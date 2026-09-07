import React, { useMemo, useState } from 'react';
import type { StaffOnboardingRequest } from '../../types/staff';

interface StaffApplicationsViewProps {
  requests: StaffOnboardingRequest[];
  onOpenApprovalModal: (request: StaffOnboardingRequest) => void;
  onRejectRequest: (requestId: string, reason?: string) => void;
}

export const StaffApplicationsView: React.FC<StaffApplicationsViewProps> = ({
  requests,
  onOpenApprovalModal,
  onRejectRequest,
}) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'submitted' | 'approved' | 'rejected'
  >('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
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

  const selectedRequest = useMemo(() => {
    if (filteredRequests.length === 0) return null;
    if (selectedRequestId === '') return null;
    if (selectedRequestId === null) return filteredRequests[0];
    const found = filteredRequests.find((r) => r.id === selectedRequestId);
    return found || filteredRequests[0];
  }, [filteredRequests, selectedRequestId]);

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

  const handleConfirmReject = () => {
    if (selectedRequest) {
      onRejectRequest(selectedRequest.id, rejectReason.trim() || undefined);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  return (
    <div className="bookings-main-grid" data-testid="staff-applications-view">
      {/* Left Workspace Column */}
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
                  e.target.value as
                    'all' | 'submitted' | 'approved' | 'rejected',
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
                  const isSelected = req.id === selectedRequest?.id;
                  const initials = getInitials(req.full_name);

                  return (
                    <tr
                      key={req.id}
                      className={`booking-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedRequestId(req.id)}
                      tabIndex={0}
                      role="row"
                      aria-selected={isSelected}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRequestId(req.id);
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
                            setSelectedRequestId(req.id);
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

      {/* Right Context Inspector Column */}
      <div className="bookings-inspector-column">
        {selectedRequest ? (
          <div
            className="booking-inspector-card active"
            data-testid="application-inspector"
          >
            {/* Header */}
            <div className="inspector-header">
              <div className="inspector-header-top-row">
                <div className="inspector-status-wrapper">
                  <span
                    className={`booking-badge ${
                      selectedRequest.status === 'approved'
                        ? 'badge-confirmed'
                        : selectedRequest.status === 'rejected'
                          ? 'badge-cancelled'
                          : 'badge-pending'
                    }`}
                  >
                    {selectedRequest.status === 'submitted'
                      ? 'Pending Review'
                      : selectedRequest.status}
                  </span>
                  <span className="inspector-type-pill">Applicant</span>
                </div>
                <button
                  type="button"
                  className="inspector-close-btn"
                  onClick={() => setSelectedRequestId('')}
                  aria-label="Close Inspector"
                >
                  &times;
                </button>
              </div>

              <div className="inspector-customer-identity">
                <div className="inspector-avatar-circle" aria-hidden="true">
                  {getInitials(selectedRequest.full_name)}
                </div>
                <div className="inspector-identity-details">
                  <h3 className="inspector-customer-name">
                    {selectedRequest.full_name}
                  </h3>
                  <div className="inspector-booking-id">
                    Role:{' '}
                    <span className="id-code">
                      {selectedRequest.preferred_role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="inspector-service-summary-bar">
                <div className="summary-service-title">
                  {selectedRequest.preferred_role}
                </div>
                <div className="summary-resource-label">
                  <span>
                    Submitted {formatDate(selectedRequest.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="inspector-body-scrollable">
              <div className="inspector-section">
                <h4 className="inspector-section-heading">Contact Details</h4>
                <div className="inspector-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value font-medium">
                      {selectedRequest.email}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value font-medium">
                      {selectedRequest.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="inspector-section">
                <h4 className="inspector-section-heading">
                  Application Information
                </h4>
                <div className="inspector-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Preferred Role</span>
                    <span className="detail-value font-medium">
                      {selectedRequest.preferred_role}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Experience</span>
                    <span className="detail-value">
                      {selectedRequest.experience_years} years
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Submission Date</span>
                    <span className="detail-value">
                      {formatDate(selectedRequest.created_at)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Current Status</span>
                    <span className="detail-value capitalize font-semibold">
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>

                {selectedRequest.rejection_reason && (
                  <div className="mt-3 p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                    <span className="font-semibold block mb-0.5">
                      Rejection Reason:
                    </span>
                    {selectedRequest.rejection_reason}
                  </div>
                )}
              </div>

              {/* Actions for Pending Requests */}
              {selectedRequest.status === 'submitted' && (
                <div className="inspector-section">
                  <h4 className="inspector-section-heading">Review Actions</h4>
                  <div className="inspector-quick-actions-row">
                    <button
                      type="button"
                      className="quick-action-btn primary"
                      onClick={() => onOpenApprovalModal(selectedRequest)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Approve & Configure</span>
                    </button>

                    <button
                      type="button"
                      className="quick-action-btn secondary text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setShowRejectModal(true)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h4 className="inspector-empty-heading">
                No Application Selected
              </h4>
              <p className="inspector-empty-text">
                Select an applicant from the list to review contact information
                and configure branch onboarding.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div
          className="bookings-modal-backdrop"
          onClick={() => setShowRejectModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bookings-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bookings-modal-header">
              <h3 className="bookings-modal-title">Reject Application</h3>
              <button
                type="button"
                className="bookings-modal-close-btn"
                onClick={() => setShowRejectModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-[var(--cs-text)]">
                Are you sure you want to reject the onboarding application from{' '}
                <span className="font-semibold">
                  {selectedRequest.full_name}
                </span>
                ?
              </p>
              <div>
                <label className="block text-xs font-medium text-[var(--cs-text-secondary)] mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  className="bookings-search-input w-full p-2 h-20"
                  placeholder="State reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="bookings-modal-footer">
              <button
                type="button"
                className="btn-secondary-compact text-xs"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bookings-header-primary-btn text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700"
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
