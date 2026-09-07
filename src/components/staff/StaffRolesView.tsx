import React, { useMemo, useState } from 'react';
import type { StaffMember } from '../../types/staff';

interface StaffRolesViewProps {
  staffList: StaffMember[];
  onOpenRoleModal: (staff: StaffMember) => void;
}

export const StaffRolesView: React.FC<StaffRolesViewProps> = ({
  staffList,
  onOpenRoleModal,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
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

  const selectedStaff = useMemo(() => {
    if (filteredStaff.length === 0) return null;
    if (selectedStaffId === '') return null;
    if (selectedStaffId === null) return filteredStaff[0];
    const found = filteredStaff.find((m) => m.id === selectedStaffId);
    return found || filteredStaff[0];
  }, [filteredStaff, selectedStaffId]);

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
    <div className="bookings-main-grid" data-testid="staff-roles-view">
      {/* Left List Column */}
      <div className="bookings-list-column">
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
                  const isSelected = member.id === selectedStaff?.id;
                  const initials = getInitials(member.full_name);

                  return (
                    <tr
                      key={member.id}
                      className={`booking-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedStaffId(member.id)}
                      tabIndex={0}
                      role="row"
                      aria-selected={isSelected}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedStaffId(member.id);
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
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

      {/* Right Access Inspector Column */}
      <div className="bookings-inspector-column">
        {selectedStaff ? (
          <div
            className="booking-inspector-card active"
            data-testid="role-inspector"
          >
            <div className="inspector-header">
              <div className="inspector-header-top-row">
                <div className="inspector-status-wrapper">
                  <span className="booking-badge badge-confirmed">
                    {selectedStaff.system_role.toUpperCase()}
                  </span>
                  <span className="inspector-type-pill">
                    {selectedStaff.staff_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  className="inspector-close-btn"
                  onClick={() => setSelectedStaffId('')}
                  aria-label="Close Inspector"
                >
                  &times;
                </button>
              </div>

              <div className="inspector-customer-identity">
                <div className="inspector-avatar-circle" aria-hidden="true">
                  {getInitials(selectedStaff.full_name)}
                </div>
                <div className="inspector-identity-details">
                  <h3 className="inspector-customer-name">
                    {selectedStaff.full_name}
                  </h3>
                  <div className="inspector-booking-id">
                    Type:{' '}
                    <span className="id-code">{selectedStaff.staff_type}</span>
                  </div>
                </div>
              </div>

              <div className="inspector-service-summary-bar">
                <div className="summary-service-title">
                  {selectedStaff.system_role.toUpperCase()} ACCESS
                </div>
                <div className="summary-resource-label">
                  <span>Branch Authorized</span>
                </div>
              </div>
            </div>

            <div className="inspector-body-scrollable p-4 space-y-4">
              <div className="inspector-section">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="inspector-section-heading mb-0">
                    System Access
                  </h4>
                  <button
                    type="button"
                    className="bookings-header-primary-btn text-xs py-1 px-2.5"
                    onClick={() => onOpenRoleModal(selectedStaff)}
                  >
                    Manage Role
                  </button>
                </div>
                <div className="inspector-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Current Role</span>
                    <span className="detail-value font-semibold uppercase text-[var(--cs-brand-green)]">
                      {selectedStaff.system_role}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Login Account</span>
                    <span className="detail-value">
                      {selectedStaff.auth_user_id ? 'Linked' : 'Not linked'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="inspector-section">
                <h4 className="inspector-section-heading">
                  Operational Context
                </h4>
                <div className="inspector-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Job Function</span>
                    <span className="detail-value capitalize font-medium">
                      {selectedStaff.staff_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Department Supervision</span>
                    <span className="detail-value">
                      {selectedStaff.is_head ? 'Department Head' : 'Standard'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Cross-Branch Access</span>
                    <span className="detail-value">
                      {selectedStaff.is_cross_branch ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value capitalize font-medium">
                      {selectedStaff.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="booking-inspector-card empty">
            <div className="inspector-empty-container">
              <div className="inspector-empty-icon-circle">
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
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
              <h4 className="inspector-empty-heading">No Staff Selected</h4>
              <p className="inspector-empty-text">
                Select a staff member from the list to review their system
                permissions and modify administrative access roles.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
