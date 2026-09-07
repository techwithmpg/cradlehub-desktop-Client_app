import React, { useMemo, useState } from 'react';
import type { StaffMember } from '../../types/staff';

export interface StaffRolesContentProps {
  staffList: StaffMember[];
  selectedStaffId: string | null;
  onSelectStaff: (staff: StaffMember) => void;
  onOpenRoleModal: (staff: StaffMember) => void;
}

export const StaffRolesContent: React.FC<StaffRolesContentProps> = ({
  staffList,
  selectedStaffId,
  onSelectStaff,
  onOpenRoleModal,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const systemRoles = useMemo(() => {
    const s = new Set<string>();
    staffList.forEach((m) => s.add(m.system_role));
    return Array.from(s).sort();
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((m) => {
      if (roleFilter !== 'all' && m.system_role !== roleFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = m.full_name.toLowerCase().includes(q);
        const matchRole = m.system_role.toLowerCase().includes(q);
        const matchType = m.staff_type.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchType) return false;
      }

      return true;
    });
  }, [staffList, roleFilter, search]);

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

  const hasActiveFilters = Boolean(search.trim()) || roleFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="staff-roles-content-wrapper" data-testid="staff-roles-view">
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
            placeholder="Search staff or roles..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search staff by name or role"
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
          {/* Role Filter */}
          <select
            className="bookings-select-filter"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by system role"
          >
            <option value="all">All Roles</option>
            {systemRoles.map((r) => (
              <option key={r} value={r}>
                {r.toUpperCase()}
              </option>
            ))}
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h4 className="bookings-empty-heading">No staff records found</h4>
            <p className="bookings-empty-text">
              {hasActiveFilters
                ? 'No staff members match the current role filter criteria.'
                : 'No staff members assigned to this branch.'}
            </p>
          </div>
        ) : (
          <table className="bookings-datagrid" aria-label="Staff Roles Table">
            <thead>
              <tr>
                <th scope="col" className="th-staff">
                  Staff Member
                </th>
                <th scope="col" className="th-role">
                  Access Role
                </th>
                <th scope="col" className="th-phone">
                  Account
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
                    data-testid={`role-row-${member.id}`}
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
                          <span className="staff-nickname-subtext capitalize">
                            {member.staff_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="td-role font-semibold text-xs text-[var(--cs-text)] uppercase">
                      {member.system_role}
                    </td>

                    <td className="td-phone text-xs">
                      {member.auth_user_id ? (
                        <span className="text-emerald-700 font-medium">
                          ● Linked
                        </span>
                      ) : (
                        <span className="text-[var(--cs-text-muted)]">
                          ○ Not linked
                        </span>
                      )}
                    </td>

                    <td className="td-actions">
                      <button
                        type="button"
                        className="btn-secondary-compact text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRoleModal(member);
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
export const StaffRolesView: React.FC<
  Omit<StaffRolesContentProps, 'selectedStaffId' | 'onSelectStaff'> & {
    selectedStaffId?: string | null;
    onSelectStaff?: (staff: StaffMember) => void;
  }
> = (props) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    props.staffList[0]?.id || null,
  );
  return (
    <StaffRolesContent
      {...props}
      selectedStaffId={
        props.selectedStaffId !== undefined ? props.selectedStaffId : selectedId
      }
      onSelectStaff={props.onSelectStaff || ((m) => setSelectedId(m.id))}
    />
  );
};
