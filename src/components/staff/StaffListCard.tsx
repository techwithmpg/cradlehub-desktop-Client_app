import React, { useMemo } from 'react';
import type {
  StaffFilters,
  StaffMember,
  StaffStatusFilter,
} from '../../types/staff';

interface StaffListCardProps {
  staffList: StaffMember[];
  totalStaffCount: number;
  selectedStaffId: string | null;
  onSelectStaff: (staff: StaffMember) => void;
  filters: StaffFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<StaffFilters>>;
  onResetFilters: () => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

type SortField = 'full_name' | 'system_role' | 'staff_type' | 'status';
type SortOrder = 'asc' | 'desc';

export const StaffListCard: React.FC<StaffListCardProps> = ({
  staffList,
  totalStaffCount,
  selectedStaffId,
  onSelectStaff,
  filters,
  onFiltersChange,
  onResetFilters,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const [sortField, setSortField] = React.useState<SortField>('full_name');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');

  // Derive unique Staff Types and System Roles for filter dropdowns
  const { staffTypes, systemRoles } = useMemo(() => {
    const types = new Set<string>();
    const roles = new Set<string>();

    for (const member of staffList) {
      if (member.staff_type) types.add(member.staff_type);
      if (member.system_role) roles.add(member.system_role);
    }

    return {
      staffTypes: Array.from(types).sort(),
      systemRoles: Array.from(roles).sort(),
    };
  }, [staffList]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sorted list
  const sortedStaff = useMemo(() => {
    return [...staffList].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'full_name') {
        comparison = a.full_name.localeCompare(b.full_name);
      } else if (sortField === 'system_role') {
        comparison = a.system_role.localeCompare(b.system_role);
      } else if (sortField === 'staff_type') {
        comparison = a.staff_type.localeCompare(b.staff_type);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [staffList, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = sortedStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedStaff = sortedStaff.slice(startIndex, startIndex + pageSize);

  const startRecord = totalItems === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + pageSize, totalItems);

  // Status badges matching canonical Bookings status badge system
  const renderStatusBadge = (status: StaffMember['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="booking-badge badge-confirmed">
            <span className="status-dot" aria-hidden="true" />
            Active
          </span>
        );
      case 'awaiting':
        return (
          <span className="booking-badge badge-pending">
            <span className="status-dot" aria-hidden="true" />
            Awaiting Approval
          </span>
        );
      case 'invited':
        return (
          <span className="booking-badge badge-no-show">
            <span className="status-dot" aria-hidden="true" />
            Invite Sent
          </span>
        );
    }
  };

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
    Boolean(filters.search.trim()) ||
    filters.status !== 'all' ||
    filters.staffType !== 'all' ||
    filters.systemRole !== 'all';

  return (
    <div className="staff-roster-content-wrapper" data-testid="staff-list-card">
      {/* Filter Toolbar matching BookingsToolbar */}
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
            data-testid="staff-search-input"
            placeholder="Search staff..."
            value={filters.search}
            onChange={(e) => {
              onFiltersChange((prev) => ({ ...prev, search: e.target.value }));
              onPageChange(1);
            }}
            aria-label="Search staff members"
          />
          {filters.search && (
            <button
              type="button"
              className="bookings-search-clear-btn"
              onClick={() => {
                onFiltersChange((prev) => ({ ...prev, search: '' }));
                onPageChange(1);
              }}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        <div className="bookings-filters-group">
          {/* Status Filter */}
          <select
            className="bookings-select-filter"
            data-testid="staff-status-filter"
            value={filters.status}
            onChange={(e) => {
              onFiltersChange((prev) => ({
                ...prev,
                status: e.target.value as StaffStatusFilter,
              }));
              onPageChange(1);
            }}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="awaiting">Awaiting Approval</option>
            <option value="invited">Invite Sent</option>
          </select>

          {/* Staff Type */}
          <select
            className="bookings-select-filter"
            data-testid="staff-type-filter"
            value={filters.staffType}
            onChange={(e) => {
              onFiltersChange((prev) => ({
                ...prev,
                staffType: e.target.value,
              }));
              onPageChange(1);
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

          {/* System Role */}
          <select
            className="bookings-select-filter"
            data-testid="staff-role-filter"
            value={filters.systemRole}
            onChange={(e) => {
              onFiltersChange((prev) => ({
                ...prev,
                systemRole: e.target.value,
              }));
              onPageChange(1);
            }}
            aria-label="Filter by system role"
          >
            <option value="all">All Roles</option>
            {systemRoles.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="bookings-reset-filters-btn"
              data-testid="staff-reset-filters-btn"
              onClick={onResetFilters}
              aria-label="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Dense Operational DataGrid matching Bookings */}
      <div className="bookings-datagrid-wrapper">
        {totalItems === 0 ? (
          <div
            className="bookings-table-empty-state"
            data-testid="staff-empty-state"
          >
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h4 className="bookings-empty-heading">
              {hasActiveFilters
                ? 'No staff members match active filters'
                : 'No staff members found'}
            </h4>
            <p className="bookings-empty-text">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or resetting filters.'
                : totalStaffCount === 0
                  ? 'No staff members are assigned to this branch.'
                  : 'No staff members found.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="bookings-reset-filters-btn"
                onClick={onResetFilters}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <table className="bookings-datagrid" aria-label="Staff Roster Table">
            <thead>
              <tr>
                <th scope="col" className="th-staff">
                  <button
                    type="button"
                    className="th-sort-btn"
                    onClick={() => handleSort('full_name')}
                    aria-sort={
                      sortField === 'full_name'
                        ? sortOrder === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <span>Staff Member</span>
                    {sortField === 'full_name' && (
                      <span className="sort-arrow" aria-hidden="true">
                        {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </button>
                </th>

                <th scope="col" className="th-role">
                  <button
                    type="button"
                    className="th-sort-btn"
                    onClick={() => handleSort('system_role')}
                    aria-sort={
                      sortField === 'system_role'
                        ? sortOrder === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <span>Role / Function</span>
                    {sortField === 'system_role' && (
                      <span className="sort-arrow" aria-hidden="true">
                        {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </button>
                </th>

                <th scope="col" className="th-status">
                  <button
                    type="button"
                    className="th-sort-btn"
                    onClick={() => handleSort('status')}
                    aria-sort={
                      sortField === 'status'
                        ? sortOrder === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <span>Status</span>
                    {sortField === 'status' && (
                      <span className="sort-arrow" aria-hidden="true">
                        {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </button>
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
                    data-testid={`staff-row-${member.id}`}
                  >
                    {/* Staff Member Column */}
                    <td className="td-staff">
                      <div className="staff-identity-cell">
                        <div
                          className="inspector-avatar-circle"
                          aria-hidden="true"
                        >
                          {initials}
                        </div>
                        <div className="staff-info-block">
                          <div className="flex items-center gap-1.5">
                            <span className="staff-primary-name">
                              {member.full_name}
                            </span>
                            {member.is_head && (
                              <span
                                className="supervisor-badge"
                                title="Department Head / Supervisor"
                              >
                                Head
                              </span>
                            )}
                          </div>
                          {member.nickname && (
                            <div className="staff-nickname-subtext">
                              &ldquo;{member.nickname}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role / Job Function Column (Two-line cell) */}
                    <td className="td-role">
                      <div className="role-two-line-cell">
                        <span className="role-primary-line">
                          {member.system_role.toUpperCase()}
                        </span>
                        <span className="role-secondary-line">
                          {member.staff_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="td-status">
                      {renderStatusBadge(member.status)}
                    </td>

                    {/* Action Column */}
                    <td className="td-actions">
                      <button
                        type="button"
                        className={`action-inspect-btn ${isSelected ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStaff(member);
                        }}
                        aria-label={`Inspect staff member ${member.full_name}`}
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

      {/* Pagination Footer matching Bookings */}
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
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
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
              onClick={() => onPageChange(Math.max(1, validCurrentPage - 1))}
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
              onClick={() =>
                onPageChange(Math.min(totalPages, validCurrentPage + 1))
              }
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
