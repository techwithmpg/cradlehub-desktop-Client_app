import React, { useMemo, useState } from 'react';
import type {
  StaffBlockedTime,
  StaffMember,
  StaffScheduleOverride,
} from '../../types/staff';

export interface StaffScheduleContentProps {
  branchName?: string;
  staffList: StaffMember[];
  selectedStaffId: string | null;
  onSelectStaff: (staff: StaffMember) => void;
  overrides?: StaffScheduleOverride[];
  blockedTimes?: StaffBlockedTime[];
  isLoading?: boolean;
  scheduleError?: string | null;
}

export const StaffScheduleContent: React.FC<StaffScheduleContentProps> = ({
  staffList,
  selectedStaffId,
  onSelectStaff,
  overrides = [],
  blockedTimes = [],
  isLoading = false,
  scheduleError = null,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
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
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = m.full_name.toLowerCase().includes(q);
        const matchType = m.staff_type.toLowerCase().includes(q);
        if (!matchName && !matchType) return false;
      }
      return true;
    });
  }, [staffList, typeFilter, search]);

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

  const hasActiveFilters = Boolean(search.trim()) || typeFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  return (
    <div
      className="staff-schedule-content-wrapper"
      data-testid="staff-schedule-view"
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
            placeholder="Search staff..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search staff members"
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

      {/* Schedule Error Banner if query failed */}
      {scheduleError && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-700">
          <span className="font-semibold block mb-0.5">Schedule Error:</span>
          {scheduleError}
        </div>
      )}

      {/* DataGrid */}
      <div className="bookings-datagrid-wrapper">
        {isLoading ? (
          <div
            className="p-8 text-center text-xs text-[var(--cs-text-muted)]"
            aria-busy="true"
          >
            Loading schedule data...
          </div>
        ) : totalItems === 0 ? (
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h4 className="bookings-empty-heading">No staff found</h4>
            <p className="bookings-empty-text">
              {hasActiveFilters
                ? 'No staff members match the active filters.'
                : 'No staff members assigned to this branch.'}
            </p>
          </div>
        ) : (
          <table
            className="bookings-datagrid"
            aria-label="Staff Schedule Roster"
          >
            <thead>
              <tr>
                <th scope="col" className="th-staff">
                  Staff Member
                </th>
                <th scope="col" className="th-role">
                  Job Function
                </th>
                <th scope="col" className="th-phone">
                  Schedule Status
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

                const memberOverrides = overrides.filter(
                  (o) => o.staff_id === member.id,
                );
                const memberBlocks = blockedTimes.filter(
                  (b) => b.staff_id === member.id,
                );

                let summaryText = 'Configured Roster';
                if (memberOverrides.length > 0 && memberBlocks.length > 0) {
                  summaryText = `${memberOverrides.length} override(s), ${memberBlocks.length} block(s)`;
                } else if (memberOverrides.length > 0) {
                  summaryText = `${memberOverrides.length} active override(s)`;
                } else if (memberBlocks.length > 0) {
                  summaryText = `${memberBlocks.length} blocked period(s)`;
                }

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
                    data-testid={`schedule-staff-row-${member.id}`}
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

                    <td className="td-phone text-xs text-[var(--cs-text-secondary)]">
                      {summaryText}
                    </td>

                    <td className="td-actions">
                      <button
                        type="button"
                        className={`action-inspect-btn ${isSelected ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStaff(member);
                        }}
                        aria-label={`Inspect schedule for ${member.full_name}`}
                      >
                        Inspect
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
export const StaffScheduleView = StaffScheduleContent;
