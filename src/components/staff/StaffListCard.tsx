import React, { useMemo } from 'react';
import type {
  BranchServiceOption,
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
  branchServices?: BranchServiceOption[];
}

type SortField =
  'full_name' | 'system_role' | 'staff_type' | 'phone' | 'status';
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
  branchServices = [],
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
      } else if (sortField === 'phone') {
        comparison = (a.phone || '').localeCompare(b.phone || '');
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

  // Status badges
  const renderStatusBadge = (status: StaffMember['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="bookings-status-badge status-confirmed">
            <span className="status-dot" aria-hidden="true" />
            Active
          </span>
        );
      case 'awaiting':
        return (
          <span className="bookings-status-badge status-pending">
            <span className="status-dot" aria-hidden="true" />
            Awaiting Approval
          </span>
        );
      case 'invited':
        return (
          <span className="bookings-status-badge status-draft">
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
    filters.systemRole !== 'all' ||
    filters.capabilityId !== 'all';

  return (
    <div
      className="bookings-list-card staff-list-card"
      data-testid="staff-list-card"
    >
      {/* 1. Layer A: Secondary Status Scope Filter Tabs */}
      <div
        className="bookings-scope-tabs"
        role="tablist"
        aria-label="Staff Status Scope"
      >
        {(
          [
            { key: 'all', label: 'All Staff' },
            { key: 'active', label: 'Active' },
            { key: 'awaiting', label: 'Awaiting Approval' },
            { key: 'invited', label: 'Invites Sent' },
          ] as const
        ).map((tab) => {
          const isActive = filters.status === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`scope-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                onFiltersChange((prev) => ({
                  ...prev,
                  status: tab.key as StaffStatusFilter,
                }));
                onPageChange(1);
              }}
              data-testid={`staff-tab-${tab.key}`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Layer B: Multi-Facet Filter Toolbar */}
      <div className="bookings-filter-toolbar staff-filter-toolbar">
        <div className="filter-search-group">
          <svg
            className="filter-search-icon"
            viewBox="0 0 24 24"
            width="14"
            height="14"
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
            className="filter-search-input"
            data-testid="staff-search-input"
            placeholder="Search staff by name, nickname, phone, role, service..."
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
              className="filter-search-clear"
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

        <div className="filter-select-group">
          {/* Staff Type */}
          <select
            className="filter-select-control"
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
            className="filter-select-control"
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

          {/* Capability / Service */}
          {branchServices.length > 0 && (
            <select
              className="filter-select-control"
              data-testid="staff-capability-filter"
              value={filters.capabilityId}
              onChange={(e) => {
                onFiltersChange((prev) => ({
                  ...prev,
                  capabilityId: e.target.value,
                }));
                onPageChange(1);
              }}
              aria-label="Filter by capability"
            >
              <option value="all">All Capabilities</option>
              {branchServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              className="filter-reset-btn"
              data-testid="staff-reset-filters-btn"
              onClick={onResetFilters}
              aria-label="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. Layer C: Dense Operational DataGrid */}
      <div className="bookings-table-wrapper">
        {totalItems === 0 ? (
          <div className="bookings-empty-state" data-testid="staff-empty-state">
            <svg
              viewBox="0 0 24 24"
              width="36"
              height="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="bookings-empty-icon"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3 className="empty-title">
              {hasActiveFilters
                ? 'No staff members match active filters'
                : 'No staff members found'}
            </h3>
            <p className="empty-subtitle">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or resetting filters.'
                : totalStaffCount === 0
                  ? 'No staff members are assigned to this branch.'
                  : 'No staff members found.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="empty-action-btn"
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

                <th scope="col" className="th-capabilities">
                  Capabilities
                </th>

                <th scope="col" className="th-phone">
                  <button
                    type="button"
                    className="th-sort-btn"
                    onClick={() => handleSort('phone')}
                    aria-sort={
                      sortField === 'phone'
                        ? sortOrder === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <span>Phone</span>
                    {sortField === 'phone' && (
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

                // Capability chips (first 2 + overflow)
                const firstCaps = member.services.slice(0, 2);
                const overflowCount = member.services.length - 2;

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
                        <div className="staff-avatar-circle" aria-hidden="true">
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

                    {/* Capabilities Preview Column */}
                    <td className="td-capabilities">
                      {member.services.length === 0 ? (
                        <span className="text-xs text-[var(--cs-text-muted)] italic">
                          No capabilities
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          {firstCaps.map((c) => (
                            <span
                              key={c.service_id}
                              className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--cs-surface-hover)] border border-[var(--cs-border)] text-[var(--cs-text)]"
                            >
                              {c.service_name}
                            </span>
                          ))}
                          {overflowCount > 0 && (
                            <span
                              className="text-[10px] px-1 py-0.5 rounded bg-[var(--cs-sand-mist)] text-[var(--cs-sand)] font-semibold"
                              title={`${overflowCount} more services assigned`}
                            >
                              +{overflowCount}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Phone Column */}
                    <td className="td-phone">
                      <span className="text-xs text-[var(--cs-text)]">
                        {member.phone || '—'}
                      </span>
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

      {/* 4. Layer D: Pagination Footer */}
      <div className="bookings-table-footer staff-table-footer">
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
