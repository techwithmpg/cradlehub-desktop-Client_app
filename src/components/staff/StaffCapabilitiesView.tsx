import React, { useMemo, useState } from 'react';
import type { BranchServiceOption, StaffMember } from '../../types/staff';

export interface StaffCapabilitiesContentProps {
  staffList: StaffMember[];
  branchServices: BranchServiceOption[];
  selectedStaffId: string | null;
  onSelectStaff: (staff: StaffMember) => void;
  onOpenCapabilityModal: (staff: StaffMember) => void;
}

export const StaffCapabilitiesContent: React.FC<
  StaffCapabilitiesContentProps
> = ({ staffList, selectedStaffId, onSelectStaff, onOpenCapabilityModal }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState<
    'all' | 'assigned' | 'unassigned'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const staffTypes = useMemo(() => {
    const s = new Set<string>();
    staffList.forEach((m) => s.add(m.staff_type));
    return Array.from(s).sort();
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((m) => {
      if (typeFilter !== 'all' && m.staff_type !== typeFilter) return false;
      if (assignmentFilter === 'assigned' && m.services.length === 0)
        return false;
      if (assignmentFilter === 'unassigned' && m.services.length > 0)
        return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = m.full_name.toLowerCase().includes(q);
        const matchType = m.staff_type.toLowerCase().includes(q);
        const matchService = m.services.some((s) =>
          s.service_name.toLowerCase().includes(q),
        );
        if (!matchName && !matchType && !matchService) return false;
      }

      return true;
    });
  }, [staffList, typeFilter, assignmentFilter, search]);

  const totalItems = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + pageSize);

  const startRecord = totalItems === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + pageSize, totalItems);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    typeFilter !== 'all' ||
    assignmentFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setAssignmentFilter('all');
    setCurrentPage(1);
  };

  return (
    <div
      className="staff-capabilities-content-wrapper"
      data-testid="staff-capabilities-view"
    >
      {/* Toolbar */}
      <div className="bookings-toolbar-container">
        <div className="bookings-search-wrapper">
          <svg
            className="bookings-search-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="bookings-search-input"
            placeholder="Search staff or capabilities..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search staff or capabilities"
          />
          {search && (
            <button
              type="button"
              className="bookings-search-clear-btn"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        <div className="bookings-filters-group">
          {/* Staff Type */}
          <select
            className="bookings-select-filter"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by staff type"
          >
            <option value="all">All Staff Types</option>
            {staffTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Assignment Status */}
          <select
            className="bookings-select-filter"
            value={assignmentFilter}
            onChange={(e) => {
              setAssignmentFilter(
                e.target.value as 'all' | 'assigned' | 'unassigned',
              );
              setCurrentPage(1);
            }}
            aria-label="Filter by assignment"
          >
            <option value="all">All Assignment States</option>
            <option value="assigned">Assigned Capabilities</option>
            <option value="unassigned">Unassigned (0)</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="bookings-reset-filters-btn"
              onClick={handleResetFilters}
              aria-label="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* DataGrid */}
      <div className="bookings-datagrid-wrapper">
        {totalItems === 0 ? (
          <div className="bookings-table-empty-state">
            <div className="bookings-empty-icon-circle">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h4 className="bookings-empty-heading">
              No capability records found
            </h4>
            <p className="bookings-empty-text">
              {hasActiveFilters
                ? 'No staff capability records match your active filters.'
                : 'No staff members assigned to this branch.'}
            </p>
          </div>
        ) : (
          <table
            className="bookings-datagrid"
            aria-label="Staff Capabilities Table"
          >
            <thead>
              <tr>
                <th scope="col" className="th-staff">
                  Staff Member
                </th>
                <th scope="col" className="th-role">
                  Staff Type
                </th>
                <th scope="col" className="th-phone">
                  Capabilities
                </th>
                <th scope="col" className="th-status">
                  State
                </th>
                <th scope="col" className="th-actions">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedStaff.map((member) => {
                const isSelected = member.id === selectedStaffId;
                const initials = getInitials(member.full_name);

                return (
                  <tr
                    key={member.id}
                    className={`booking-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectStaff(member)}
                    tabIndex={0}
                    role="row"
                    aria-selected={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectStaff(member);
                      }
                    }}
                    data-testid={`capability-row-${member.id}`}
                  >
                    <td className="td-staff">
                      <div className="staff-identity-cell">
                        <div
                          className="inspector-avatar-circle"
                          aria-hidden="true"
                        >
                          {initials}
                        </div>
                        <div className="staff-info-block">
                          <span className="staff-primary-name">
                            {member.full_name}
                          </span>
                          {member.nickname && (
                            <span className="staff-nickname-subtext">
                              &ldquo;{member.nickname}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="td-role font-medium text-xs text-[var(--cs-text)] capitalize">
                      {member.staff_type.replace(/_/g, ' ')}
                    </td>

                    <td className="td-phone font-semibold text-xs text-[var(--cs-text)]">
                      {member.services.length}{' '}
                      <span className="font-normal text-[var(--cs-text-muted)]">
                        service{member.services.length === 1 ? '' : 's'}
                      </span>
                    </td>

                    <td className="td-status">
                      <span
                        className={`booking-badge ${
                          member.services.length > 0
                            ? 'badge-confirmed'
                            : 'badge-pending'
                        }`}
                      >
                        {member.services.length > 0 ? 'Assigned' : 'Unassigned'}
                      </span>
                    </td>

                    <td className="td-actions">
                      <button
                        type="button"
                        className="btn-secondary-compact text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCapabilityModal(member);
                        }}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="bookings-table-footer">
        <div className="footer-count-text">
          Showing <span className="count-highlight">{startRecord}</span>–
          <span className="count-highlight">{endRecord}</span> of{' '}
          <span className="count-highlight">{totalItems}</span> staff
        </div>

        <div className="footer-pagination-controls">
          <div className="page-size-selector-wrapper">
            <span className="page-size-label">Rows per page:</span>
            <select
              className="page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="pagination-buttons">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              aria-label="Previous page"
            >
              &larr; Prev
            </button>

            <span className="pagination-page-indicator">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              aria-label="Next page"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Backward-compatible alias
export const StaffCapabilitiesView: React.FC<
  Omit<StaffCapabilitiesContentProps, 'selectedStaffId' | 'onSelectStaff'> & {
    selectedStaffId?: string | null;
    onSelectStaff?: (staff: StaffMember) => void;
  }
> = (props) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    props.staffList[0]?.id || null,
  );
  return (
    <StaffCapabilitiesContent
      {...props}
      selectedStaffId={
        props.selectedStaffId !== undefined ? props.selectedStaffId : selectedId
      }
      onSelectStaff={props.onSelectStaff || ((m) => setSelectedId(m.id))}
    />
  );
};
