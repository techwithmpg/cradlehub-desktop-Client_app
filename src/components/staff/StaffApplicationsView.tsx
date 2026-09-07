import React, { useMemo, useState } from 'react';
import type { StaffOnboardingRequest } from '../../types/staff';

interface StaffApplicationsViewProps {
  requests: StaffOnboardingRequest[];
  onOpenApprovalModal: (request: StaffOnboardingRequest) => void;
  onRejectRequest: (requestId: string, reason?: string) => void;
  isLoading?: boolean;
}

export const StaffApplicationsView: React.FC<StaffApplicationsViewProps> = ({
  requests,
  onOpenApprovalModal,
  onRejectRequest,
  isLoading = false,
}) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    () => (requests.length > 0 ? requests[0].id : null),
  );
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'submitted' | 'approved' | 'rejected'
  >('all');
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
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
  }, [requests, statusFilter, search]);

  const selectedRequest = useMemo(() => {
    return (
      filteredRequests.find((r) => r.id === selectedRequestId) ||
      (filteredRequests.length > 0 ? filteredRequests[0] : null)
    );
  }, [filteredRequests, selectedRequestId]);

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div
      className="bookings-main-grid staff-applications-grid"
      data-testid="staff-applications-view"
    >
      {/* Left Column: Applications List */}
      <div className="bookings-list-column">
        <div className="bookings-list-card">
          {/* Status Scope Filters */}
          <div className="bookings-scope-tabs" role="tablist">
            {(
              [
                { key: 'all', label: 'All Applications' },
                { key: 'submitted', label: 'Pending Review' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={statusFilter === t.key}
                className={`scope-tab-btn ${statusFilter === t.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(t.key)}
              >
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Search Toolbar */}
          <div className="bookings-filter-toolbar">
            <div className="filter-search-group w-full">
              <input
                type="text"
                className="filter-search-input"
                placeholder="Search applicants by name, email, phone, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search applications"
              />
              {search && (
                <button
                  type="button"
                  className="filter-search-clear"
                  onClick={() => setSearch('')}
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bookings-table-wrapper">
            {filteredRequests.length === 0 ? (
              <div className="bookings-empty-state">
                <h3 className="empty-title">
                  {isLoading
                    ? 'Loading applications...'
                    : 'No onboarding applications found'}
                </h3>
                <p className="empty-subtitle">
                  {search || statusFilter !== 'all'
                    ? 'Try clearing your search query or switching tabs.'
                    : 'New applicants who submit their onboarding forms will appear here.'}
                </p>
              </div>
            ) : (
              <table
                className="bookings-datagrid"
                aria-label="Applications Queue"
              >
                <thead>
                  <tr>
                    <th scope="col">Applicant</th>
                    <th scope="col">Preferred Role</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const isSelected = selectedRequest?.id === req.id;
                    return (
                      <tr
                        key={req.id}
                        className={`booking-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedRequestId(req.id)}
                        tabIndex={0}
                        role="row"
                        aria-selected={isSelected}
                      >
                        <td>
                          <div className="font-semibold text-xs text-[var(--cs-text)]">
                            {req.full_name}
                          </div>
                          <div className="text-[11px] text-[var(--cs-text-muted)]">
                            {req.phone || req.email}
                          </div>
                        </td>
                        <td>
                          <span className="text-xs text-[var(--cs-text)] capitalize">
                            {req.preferred_role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-[var(--cs-text-muted)]">
                            {formatDate(req.created_at)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`bookings-status-badge ${
                              req.status === 'approved'
                                ? 'status-confirmed'
                                : req.status === 'rejected'
                                  ? 'status-cancelled'
                                  : 'status-pending'
                            }`}
                          >
                            {req.status === 'approved'
                              ? 'Approved'
                              : req.status === 'rejected'
                                ? 'Rejected'
                                : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`action-inspect-btn ${isSelected ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequestId(req.id);
                            }}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Applicant Inspector */}
      <div className="bookings-inspector-column">
        {selectedRequest ? (
          <div className="booking-inspector-card staff-inspector-card">
            <div className="inspector-header">
              <div className="inspector-header-main">
                <h2 className="inspector-header-title text-base font-bold text-[var(--cs-text)]">
                  {selectedRequest.full_name}
                </h2>
                <div className="text-xs text-[var(--cs-text-muted)]">
                  Application ID: #{selectedRequest.id.slice(0, 8)}
                </div>
              </div>
            </div>

            <div className="inspector-body-content p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="inspector-section">
                <h4 className="inspector-section-heading">Applicant Profile</h4>
                <div className="inspector-grid-2">
                  <div className="inspector-data-item">
                    <span className="data-label">Email</span>
                    <span className="data-value">
                      {selectedRequest.email || '—'}
                    </span>
                  </div>
                  <div className="inspector-data-item">
                    <span className="data-label">Phone</span>
                    <span className="data-value">
                      {selectedRequest.phone || '—'}
                    </span>
                  </div>
                  <div className="inspector-data-item">
                    <span className="data-label">Preferred Role</span>
                    <span className="data-value capitalize">
                      {selectedRequest.preferred_role.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="inspector-data-item">
                    <span className="data-label">Experience</span>
                    <span className="data-value">
                      {selectedRequest.experience_years !== null
                        ? `${selectedRequest.experience_years} years`
                        : 'Not specified'}
                    </span>
                  </div>
                  <div className="inspector-data-item">
                    <span className="data-label">Submitted On</span>
                    <span className="data-value">
                      {formatDate(selectedRequest.created_at)}
                    </span>
                  </div>
                  <div className="inspector-data-item">
                    <span className="data-label">Review Status</span>
                    <span className="data-value uppercase font-semibold text-xs">
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>
              </div>

              {selectedRequest.rejection_reason && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                  <div className="font-semibold">Rejection Note:</div>
                  <p className="mt-1">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {/* Review Actions */}
              {selectedRequest.status === 'submitted' && (
                <div className="pt-3 border-t border-[var(--cs-border)] space-y-2">
                  <button
                    type="button"
                    className="btn-primary w-full text-xs"
                    onClick={() => onOpenApprovalModal(selectedRequest)}
                  >
                    Approve &amp; Configure Staff
                  </button>

                  {!showRejectPrompt ? (
                    <button
                      type="button"
                      className="btn-secondary w-full text-xs text-red-600 hover:text-red-700"
                      onClick={() => setShowRejectPrompt(true)}
                    >
                      Reject Application
                    </button>
                  ) : (
                    <div className="space-y-2 p-2.5 rounded bg-[var(--cs-surface-hover)] border border-[var(--cs-border)]">
                      <label className="block text-xs font-semibold text-[var(--cs-text-muted)]">
                        Reason for Rejection (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-input-control text-xs w-full"
                        placeholder="e.g. Incomplete credentials, Position filled..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-secondary-compact text-xs flex-1"
                          onClick={() => setShowRejectPrompt(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-secondary-compact text-xs text-red-600 font-semibold flex-1"
                          onClick={() => {
                            onRejectRequest(selectedRequest.id, rejectReason);
                            setShowRejectPrompt(false);
                            setRejectReason('');
                          }}
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="booking-inspector-card staff-inspector-card empty-inspector">
            <div className="inspector-placeholder-content">
              <div className="placeholder-title">No Application Selected</div>
              <div className="placeholder-subtitle">
                Select an onboarding applicant from the list to review their
                submission.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
