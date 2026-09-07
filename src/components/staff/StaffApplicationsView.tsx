import React, { useMemo, useState } from 'react';
import type { StaffOnboardingRequest } from '../../types/staff';

export interface StaffApplicationsContentProps {
  requests: StaffOnboardingRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (request: StaffOnboardingRequest) => void;
  // Backward compatibility props
  onOpenApprovalModal?: (request: StaffOnboardingRequest) => void;
  onRejectRequest?: (requestId: string, reason?: string) => void;
}

export const StaffApplicationsContent: React.FC<
  StaffApplicationsContentProps
> = ({ requests, selectedRequestId, onSelectRequest }) => {
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'submitted' | 'approved' | 'rejected'
  >('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Available preferred roles for filter
  const preferredRoles = useMemo(() => {
    const roles = new Set<string>();
    requests.forEach((r) => {
      if (r.preferred_role) roles.add(r.preferred_role);
    });
    return Array.from(roles).sort();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (roleFilter !== 'all' && r.preferred_role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = r.full_name.toLowerCase().includes(q);
        const matchEmail = r.email.toLowerCase().includes(q);
        const matchPhone = r.phone.toLowerCase().includes(q);
        const matchRole = r.preferred_role.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchRole)
          return false;
      }
      return true;
    });
  }, [requests, statusFilter, roleFilter, search]);

  const totalItems = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + pageSize,
  );
  const startRecord = totalItems === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + pageSize, totalItems);

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const hasActiveFilters =
    Boolean(search.trim()) || statusFilter !== 'all' || roleFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
    setCurrentPage(1);
  };

  return (
    <div
      className="staff-applications-content-wrapper"
      data-testid="staff-applications-view"
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
            placeholder="Search applications..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search applications"
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
          {/* Status Filter */}
          <select
            className="bookings-select-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(
                e.target.value as 'all' | 'submitted' | 'approved' | 'rejected',
              );
              setCurrentPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Preferred Role Filter */}
          {preferredRoles.length > 0 && (
            <select
              className="bookings-select-filter"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by preferred role"
            >
              <option value="all">All Preferred Roles</option>
              {preferredRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}

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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h4 className="bookings-empty-heading">No applications found</h4>
            <p className="bookings-empty-text">
              {hasActiveFilters
                ? 'No onboarding applications match your active filters.'
                : 'There are no staff onboarding applications submitted for this branch.'}
            </p>
          </div>
        ) : (
          <table
            className="bookings-datagrid"
            aria-label="Staff Applications Table"
          >
            <thead>
              <tr>
                <th scope="col" className="th-staff">
                  Applicant
                </th>
                <th scope="col" className="th-role">
                  Preferred Role
                </th>
                <th scope="col" className="th-phone">
                  Submitted
                </th>
                <th scope="col" className="th-status">
                  Status
                </th>
                <th scope="col" className="th-actions">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.map((req) => {
                const isSelected = req.id === selectedRequestId;
                const initials = getInitials(req.full_name);

                return (
                  <tr
                    key={req.id}
                    className={`booking-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectRequest(req)}
                    tabIndex={0}
                    role="row"
                    aria-selected={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectRequest(req);
                      }
                    }}
                    data-testid={`application-row-${req.id}`}
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
                            {req.full_name}
                          </span>
                          <span className="staff-nickname-subtext">
                            {req.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="td-role font-medium text-xs text-[var(--cs-text)]">
                      {req.preferred_role}
                    </td>

                    <td className="td-phone text-xs text-[var(--cs-text-secondary)]">
                      {formatDate(req.created_at)}
                    </td>

                    <td className="td-status">
                      <span
                        className={`booking-badge ${
                          req.status === 'approved'
                            ? 'badge-confirmed'
                            : req.status === 'rejected'
                              ? 'badge-cancelled'
                              : 'badge-pending'
                        }`}
                      >
                        {req.status === 'submitted' ? 'Pending' : req.status}
                      </span>
                    </td>

                    <td className="td-actions">
                      <button
                        type="button"
                        className={`action-inspect-btn ${isSelected ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRequest(req);
                        }}
                        aria-label={`Inspect application from ${req.full_name}`}
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
          <span className="count-highlight">{totalItems}</span> applications
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
export const StaffApplicationsView: React.FC<
  Omit<
    StaffApplicationsContentProps,
    'selectedRequestId' | 'onSelectRequest'
  > & {
    selectedRequestId?: string | null;
    onSelectRequest?: (req: StaffOnboardingRequest) => void;
  }
> = (props) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    props.requests[0]?.id || null,
  );
  return (
    <StaffApplicationsContent
      {...props}
      selectedRequestId={
        props.selectedRequestId !== undefined
          ? props.selectedRequestId
          : selectedId
      }
      onSelectRequest={props.onSelectRequest || ((r) => setSelectedId(r.id))}
    />
  );
};
