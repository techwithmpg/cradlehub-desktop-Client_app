import React, { useState } from 'react';
import type {
  BranchServiceOption,
  StaffBlockedTime,
  StaffMember,
  StaffOnboardingRequest,
  StaffPrimaryTab,
  StaffScheduleOverride,
  UpdateStaffProfileInput,
} from '../../types/staff';
import { updateStaffProfile } from '../../lib/staff-service';

export type StaffInspectorTab = 'overview' | 'services' | 'access';

export interface StaffContextInspectorProps {
  activeTab: StaffPrimaryTab;
  staff: StaffMember | null;
  selectedStaffId?: string | null;
  application?: StaffOnboardingRequest | null;
  selectedApplicationId?: string | null;
  branchName?: string;
  branchServices?: BranchServiceOption[];
  scheduleOverrides?: StaffScheduleOverride[];
  scheduleBlocks?: StaffBlockedTime[];
  todayStr?: string;
  onCloseStaffSelection: () => void;
  onCloseApplicationSelection?: () => void;
  onOpenScheduleModal: (
    staff: StaffMember,
    date?: string,
    existingBlocks?: StaffBlockedTime[],
  ) => void;
  onOpenFullScheduleModal?: (staff: StaffMember) => void;
  onOpenCapabilityModal: (staff: StaffMember) => void;
  onOpenRoleModal: (staff: StaffMember) => void;
  onOpenOffboardingModal: (staff: StaffMember) => void;
  onStaffUpdated: (patch: Partial<StaffMember> & { id: string }) => void;
  onOpenApprovalModal?: (req: StaffOnboardingRequest) => void;
  onRejectApplication?: (requestId: string, reason?: string) => void;
  onOpenProfileEdit?: (staff: StaffMember) => void;
  onCheckAvailability?: (staff: StaffMember) => void;
  // Backward compatibility alias for onClose
  onClose?: () => void;
}

const INSPECTOR_TABS: Array<{ id: StaffInspectorTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'services', label: 'Services' },
  { id: 'access', label: 'Access' },
];

export const StaffContextInspector: React.FC<StaffContextInspectorProps> = ({
  activeTab,
  staff,
  selectedStaffId,
  application,
  selectedApplicationId,
  branchName = 'Active Branch',
  branchServices = [],
  scheduleOverrides = [],
  scheduleBlocks = [],
  todayStr = new Date().toISOString().slice(0, 10),
  onCloseStaffSelection,
  onCloseApplicationSelection,
  onOpenScheduleModal,
  onOpenFullScheduleModal,
  onOpenCapabilityModal,
  onOpenRoleModal,
  onOpenOffboardingModal,
  onStaffUpdated,
  onOpenApprovalModal,
  onRejectApplication,
  onOpenProfileEdit,
  onCheckAvailability,
  onClose,
}) => {
  const [internalTab, setInternalTab] = useState<StaffInspectorTab>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Reject modal state for application review inside inspector
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Edit form state
  const [editFullName, setEditFullName] = useState(staff?.full_name || '');
  const [editNickname, setEditNickname] = useState(staff?.nickname || '');
  const [editPhone, setEditPhone] = useState(staff?.phone || '');
  const [editStaffType, setEditStaffType] = useState(
    staff?.staff_type || 'therapist',
  );
  const [editTier, setEditTier] = useState(staff?.tier || 'Standard');
  const [editIsHead, setEditIsHead] = useState(staff?.is_head || false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [prevStaffId, setPrevStaffId] = useState<string | null>(
    staff?.id || null,
  );
  if (staff && staff.id !== prevStaffId) {
    setPrevStaffId(staff.id);
    setIsEditingProfile(false);
    setEditError(null);
    setActionNotice(null);
  }

  const handleCloseStaff = onCloseStaffSelection || onClose;
  const handleCloseApp =
    onCloseApplicationSelection || onCloseStaffSelection || onClose;

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;
    if (!editFullName.trim()) {
      setEditError('Full name is required.');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    const input: UpdateStaffProfileInput = {
      staffId: staff.id,
      fullName: editFullName.trim(),
      nickname: editNickname.trim() || null,
      phone: editPhone.trim() || null,
      staffType: editStaffType.trim(),
      tier: editTier.trim(),
      isHead: editIsHead,
    };

    const result = await updateStaffProfile(input);
    if (!result.ok) {
      setEditError(result.error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsEditingProfile(false);
    onStaffUpdated({
      id: staff.id,
      full_name: editFullName.trim(),
      nickname: editNickname.trim() || null,
      phone: editPhone.trim() || null,
      staff_type: editStaffType.trim(),
      tier: editTier.trim(),
      is_head: editIsHead,
    });
  };

  const handleStartEditing = () => {
    if (!staff) return;
    setInternalTab('overview');
    setEditFullName(staff.full_name);
    setEditNickname(staff.nickname || '');
    setEditPhone(staff.phone || '');
    setEditStaffType(staff.staff_type);
    setEditTier(staff.tier);
    setEditIsHead(staff.is_head);
    setEditError(null);
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    if (!staff) return;
    setEditFullName(staff.full_name);
    setEditNickname(staff.nickname || '');
    setEditPhone(staff.phone || '');
    setEditStaffType(staff.staff_type);
    setEditTier(staff.tier);
    setEditIsHead(staff.is_head);
    setIsEditingProfile(false);
    setEditError(null);
  };

  const handleConfirmReject = () => {
    if (application && onRejectApplication) {
      onRejectApplication(application.id, rejectReason.trim() || undefined);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  // ==========================================
  // CASE A: Applications Context
  // ==========================================
  if (activeTab === 'applications') {
    const isAppSelected = Boolean(application && selectedApplicationId !== '');

    if (!isAppSelected || !application) {
      return (
        <div
          className="booking-inspector-card empty staff-inspector-card staff-context-inspector"
          role="region"
          aria-label="Staff Application Inspector"
          data-testid="staff-context-inspector"
        >
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
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h4 className="inspector-empty-heading">No Application Selected</h4>
            <p className="inspector-empty-text">
              Select an applicant from the list to review contact information
              and configure branch onboarding.
            </p>
          </div>
        </div>
      );
    }

    const appInitials = getInitials(application.full_name);

    return (
      <div
        className="booking-inspector-card active staff-inspector-card staff-context-inspector"
        role="region"
        aria-label="Staff Details Inspector"
        data-testid="staff-context-inspector"
      >
        <div className="inspector-header">
          <div className="inspector-header-top-row">
            <div className="inspector-status-wrapper">
              <span
                className={`booking-badge ${
                  application.status === 'approved'
                    ? 'badge-confirmed'
                    : application.status === 'rejected'
                      ? 'badge-cancelled'
                      : 'badge-pending'
                }`}
              >
                {application.status === 'submitted'
                  ? 'Pending Review'
                  : application.status}
              </span>
              <span className="inspector-type-pill">Applicant</span>
            </div>
            <button
              type="button"
              className="inspector-close-btn"
              onClick={handleCloseApp}
              aria-label="Close Inspector"
            >
              &times;
            </button>
          </div>

          <div className="inspector-customer-identity">
            <div className="inspector-avatar-circle" aria-hidden="true">
              {appInitials}
            </div>
            <div className="inspector-identity-details">
              <h3
                className="inspector-customer-name"
                data-testid="inspector-staff-name"
              >
                {application.full_name}
              </h3>
              <div className="inspector-booking-id">
                Role:{' '}
                <span className="id-code">{application.preferred_role}</span>
              </div>
            </div>
          </div>

          <div className="inspector-service-summary-bar">
            <div className="summary-service-title">
              {application.preferred_role}
            </div>
            <div className="summary-resource-label">
              <span>Submitted {formatDate(application.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="inspector-body-scrollable">
          <div className="inspector-section">
            <h4 className="inspector-section-heading">Contact Details</h4>
            <div className="inspector-details-grid">
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value font-medium">
                  {application.email}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value font-medium">
                  {application.phone}
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
                  {application.preferred_role}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Experience</span>
                <span className="detail-value">
                  {application.experience_years} years
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Submission Date</span>
                <span className="detail-value">
                  {formatDate(application.created_at)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Current Status</span>
                <span className="detail-value capitalize font-semibold">
                  {application.status}
                </span>
              </div>
            </div>

            {application.rejection_reason && (
              <div className="mt-3 p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                <span className="font-semibold block mb-0.5">
                  Rejection Reason:
                </span>
                {application.rejection_reason}
              </div>
            )}
          </div>

          {/* Actions for Pending Requests */}
          {application.status === 'submitted' && (
            <div className="inspector-section">
              <h4 className="inspector-section-heading">Review Actions</h4>
              <div className="inspector-quick-actions-row">
                {onOpenApprovalModal && (
                  <button
                    type="button"
                    className="quick-action-btn primary"
                    onClick={() => onOpenApprovalModal(application)}
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
                )}

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

        {/* Reject Modal */}
        {showRejectModal && (
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
                  Are you sure you want to reject the onboarding application
                  from{' '}
                  <span className="font-semibold">{application.full_name}</span>
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
  }

  // ==========================================
  // STAFF-CENTRIC TABS: Empty Selection State
  // ==========================================
  const isStaffSelected = Boolean(staff && selectedStaffId !== '');

  if (!isStaffSelected || !staff) {
    return (
      <div
        className="booking-inspector-card empty staff-inspector-card staff-context-inspector"
        role="region"
        aria-label="Staff Details Inspector"
        data-testid="staff-context-inspector"
      >
        <div
          className="inspector-empty-container"
          data-testid="staff-inspector-empty"
        >
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h4 className="inspector-empty-heading">No Staff Selected</h4>
          <p className="inspector-empty-text">
            {activeTab === 'schedule'
              ? 'Select a staff member from the list to inspect their schedule, view working hours, and record overrides.'
              : activeTab === 'capabilities'
                ? 'Select a staff member from the list to view assigned capabilities and launch the full capability editor.'
                : activeTab === 'roles'
                  ? 'Select a staff member from the list to review their system permissions and modify administrative access roles.'
                  : 'Select a staff member from the roster to view their complete operational profile, assigned services, and access permissions.'}
          </p>
        </div>
      </div>
    );
  }

  const staffInitials = getInitials(staff.full_name);

  // ==========================================
  // CASE B: Schedule View Context
  // ==========================================
  if (activeTab === 'schedule') {
    const staffOverrides = scheduleOverrides.filter(
      (o) => o.staff_id === staff.id,
    );
    const staffBlocks = scheduleBlocks.filter((b) => b.staff_id === staff.id);
    const todayOverride = staffOverrides.find(
      (o) => o.override_date === todayStr,
    );
    const todayBlocks = staffBlocks.filter((b) => b.block_date === todayStr);

    return (
      <div
        className="booking-inspector-card active staff-inspector-card staff-context-inspector"
        role="region"
        aria-label="Staff Details Inspector"
        data-testid="staff-context-inspector"
      >
        <div className="inspector-header">
          <div className="inspector-header-top-row">
            <div className="inspector-status-wrapper">
              <span className="booking-badge badge-confirmed">
                {staff.status.toUpperCase()}
              </span>
              <span className="inspector-type-pill">
                {staff.staff_type.replace(/_/g, ' ')}
              </span>
              {staff.is_head && <span className="supervisor-badge">Head</span>}
            </div>
            <button
              type="button"
              className="inspector-close-btn"
              onClick={handleCloseStaff}
              aria-label="Close Inspector"
            >
              &times;
            </button>
          </div>

          <div className="inspector-customer-identity">
            <div className="inspector-avatar-circle" aria-hidden="true">
              {staffInitials}
            </div>
            <div className="inspector-identity-details">
              <h3
                className="inspector-customer-name"
                data-testid="inspector-staff-name"
              >
                {staff.full_name}
              </h3>
              <div className="inspector-booking-id">
                Branch: <span className="id-code">{branchName}</span>
              </div>
            </div>
          </div>

          <div className="inspector-service-summary-bar">
            <div className="summary-service-title">
              {staff.staff_type.toUpperCase()} SCHEDULE
            </div>
            <div className="summary-resource-label">
              <span>{staff.tier ? `${staff.tier} Tier` : 'Standard'}</span>
            </div>
          </div>
        </div>

        <div className="inspector-body-scrollable">
          {actionNotice && (
            <div className="p-3 bg-[var(--cs-surface-warm)] border-b border-[var(--cs-border)] text-xs text-[var(--cs-text)] flex justify-between items-center">
              <span>{actionNotice}</span>
              <button
                type="button"
                className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text)] ml-2"
                onClick={() => setActionNotice(null)}
              >
                &times;
              </button>
            </div>
          )}

          {/* THIS WEEK Section */}
          <div className="inspector-section">
            <h4 className="inspector-section-heading">This Week Overview</h4>
            <div className="inspector-details-grid">
              <div className="detail-item">
                <span className="detail-label">Overrides Configured</span>
                <span className="detail-value font-medium">
                  {staffOverrides.length} active
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Blocked Periods</span>
                <span className="detail-value font-medium">
                  {staffBlocks.length} recorded
                </span>
              </div>
            </div>
          </div>

          {/* TODAY Section */}
          <div className="inspector-section">
            <h4 className="inspector-section-heading">
              Today's Schedule ({todayStr})
            </h4>
            {todayOverride?.is_day_off ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <span className="font-bold block">Day Off</span>
                {todayOverride.reason && (
                  <span>Reason: {todayOverride.reason}</span>
                )}
              </div>
            ) : todayOverride ? (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <span className="font-bold block">Custom Working Hours:</span>
                <span>
                  {todayOverride.start_time || '09:00'} –{' '}
                  {todayOverride.end_time || '18:00'}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[var(--cs-surface-warm)] border border-[var(--cs-border)] text-xs text-[var(--cs-text-muted)] italic">
                Standard working hours schedule active.
              </div>
            )}

            {todayBlocks.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[11px] font-semibold text-blue-800 block">
                  Blocked Times Today:
                </span>
                {todayBlocks.map((b) => (
                  <div
                    key={b.id}
                    className="p-2 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900"
                  >
                    <span>
                      {b.start_time || '—'} – {b.end_time || '—'}
                    </span>
                    {b.reason && (
                      <span className="block text-[11px] text-blue-700">
                        {b.reason}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Operational Actions */}
          <div className="inspector-section">
            <h4 className="inspector-section-heading">
              Quick Operational Actions
            </h4>
            <div className="inspector-quick-actions-row">
              <button
                type="button"
                className="quick-action-btn primary"
                onClick={() => {
                  if (onOpenFullScheduleModal) {
                    onOpenFullScheduleModal(staff);
                  } else {
                    onOpenScheduleModal(staff);
                  }
                }}
                data-testid="schedule-view-full-btn"
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
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>View Full Schedule</span>
              </button>

              <button
                type="button"
                className="quick-action-btn secondary"
                onClick={() =>
                  onOpenScheduleModal(staff, todayStr, todayBlocks)
                }
                data-testid="schedule-adjust-btn"
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
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>Adjust Schedule</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--cs-border)] mt-3">
              <button
                type="button"
                className="btn-secondary-compact text-xs"
                onClick={() => {
                  if (onCheckAvailability) {
                    onCheckAvailability(staff);
                  } else {
                    setActionNotice(
                      `Checked availability for ${staff.full_name}: active in branch operational schedule.`,
                    );
                  }
                }}
              >
                Check Availability
              </button>

              {onOpenProfileEdit && (
                <button
                  type="button"
                  className="btn-secondary-compact text-xs"
                  onClick={() => onOpenProfileEdit(staff)}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE C: Capabilities & Services Context
  // ==========================================
  if (activeTab === 'capabilities') {
    return (
      <div
        className="booking-inspector-card active staff-inspector-card staff-context-inspector"
        role="region"
        aria-label="Staff Details Inspector"
        data-testid="staff-context-inspector"
      >
        <div className="inspector-header">
          <div className="inspector-header-top-row">
            <div className="inspector-status-wrapper">
              <span
                className={`booking-badge ${
                  staff.services.length > 0
                    ? 'badge-confirmed'
                    : 'badge-pending'
                }`}
              >
                {staff.services.length > 0 ? 'Assigned' : 'Unassigned'}
              </span>
              <span className="inspector-type-pill">
                {staff.staff_type.replace(/_/g, ' ')}
              </span>
              {staff.is_head && <span className="supervisor-badge">Head</span>}
            </div>
            <button
              type="button"
              className="inspector-close-btn"
              onClick={handleCloseStaff}
              aria-label="Close Inspector"
            >
              &times;
            </button>
          </div>

          <div className="inspector-customer-identity">
            <div className="inspector-avatar-circle" aria-hidden="true">
              {staffInitials}
            </div>
            <div className="inspector-identity-details">
              <h3
                className="inspector-customer-name"
                data-testid="inspector-staff-name"
              >
                {staff.full_name}
              </h3>
              <div className="inspector-booking-id">
                Role: <span className="id-code">{staff.system_role}</span>
              </div>
            </div>
          </div>

          <div className="inspector-service-summary-bar">
            <div className="summary-service-title">
              {staff.services.length} Assigned Services
            </div>
            <div className="summary-resource-label">
              <span>Branch Total: {branchServices.length}</span>
            </div>
          </div>
        </div>

        <div className="inspector-body-scrollable p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--cs-border)] pb-2">
            <h4 className="text-xs font-semibold uppercase text-[var(--cs-text)]">
              Service Capability Catalog
            </h4>
            <button
              type="button"
              className="bookings-header-primary-btn text-xs py-1 px-2.5"
              onClick={() => onOpenCapabilityModal(staff)}
            >
              Manage
            </button>
          </div>

          {staff.services.length === 0 ? (
            <div className="text-center py-6 bg-[var(--cs-surface-warm)] rounded-lg border border-[var(--cs-border)]">
              <p className="text-xs text-[var(--cs-text-muted)] italic">
                No capabilities assigned. Click below to assign services.
              </p>
              <button
                type="button"
                className="btn-secondary-compact text-xs mt-2"
                onClick={() => onOpenCapabilityModal(staff)}
              >
                Assign Capabilities
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {staff.services.slice(0, 8).map((s) => (
                <div
                  key={s.service_id}
                  className="p-2 rounded bg-[var(--cs-surface-warm)] border border-[var(--cs-border)] flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-[var(--cs-text)]">
                    {s.service_name}
                  </span>
                  <span className="text-[10px] text-[var(--cs-text-muted)] font-mono">
                    ID: {s.service_id.slice(0, 8)}
                  </span>
                </div>
              ))}
              {staff.services.length > 8 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-[var(--cs-text-muted)]">
                    +{staff.services.length - 8} more capabilities assigned
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE D: Roles & Permissions Context
  // ==========================================
  if (activeTab === 'roles') {
    return (
      <div
        className="booking-inspector-card active staff-inspector-card staff-context-inspector"
        role="region"
        aria-label="Staff Details Inspector"
        data-testid="staff-context-inspector"
      >
        <div className="inspector-header">
          <div className="inspector-header-top-row">
            <div className="inspector-status-wrapper">
              <span className="booking-badge badge-confirmed">
                {staff.system_role.toUpperCase()}
              </span>
              <span className="inspector-type-pill">
                {staff.staff_type.replace(/_/g, ' ')}
              </span>
              {staff.is_head && <span className="supervisor-badge">Head</span>}
            </div>
            <button
              type="button"
              className="inspector-close-btn"
              onClick={handleCloseStaff}
              aria-label="Close Inspector"
            >
              &times;
            </button>
          </div>

          <div className="inspector-customer-identity">
            <div className="inspector-avatar-circle" aria-hidden="true">
              {staffInitials}
            </div>
            <div className="inspector-identity-details">
              <h3
                className="inspector-customer-name"
                data-testid="inspector-staff-name"
              >
                {staff.full_name}
              </h3>
              <div className="inspector-booking-id">
                Type: <span className="id-code">{staff.staff_type}</span>
              </div>
            </div>
          </div>

          <div className="inspector-service-summary-bar">
            <div className="summary-service-title">
              {staff.system_role.toUpperCase()} ACCESS
            </div>
            <div className="summary-resource-label">
              <span>Branch Authorized</span>
            </div>
          </div>
        </div>

        <div className="inspector-body-scrollable p-4 space-y-4">
          <div className="inspector-section">
            <div className="flex items-center justify-between mb-2">
              <h4 className="inspector-section-heading mb-0">System Access</h4>
              <button
                type="button"
                className="bookings-header-primary-btn text-xs py-1 px-2.5"
                onClick={() => onOpenRoleModal(staff)}
              >
                Manage Role
              </button>
            </div>
            <div className="inspector-details-grid">
              <div className="detail-item">
                <span className="detail-label">Current Role</span>
                <span className="detail-value font-semibold uppercase text-[var(--cs-brand-green)]">
                  {staff.system_role}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Login Account</span>
                <span className="detail-value">
                  {staff.auth_user_id ? 'Linked' : 'Not linked'}
                </span>
              </div>
            </div>
          </div>

          <div className="inspector-section">
            <h4 className="inspector-section-heading">Operational Context</h4>
            <div className="inspector-details-grid">
              <div className="detail-item">
                <span className="detail-label">Job Function</span>
                <span className="detail-value capitalize font-medium">
                  {staff.staff_type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department Supervision</span>
                <span className="detail-value">
                  {staff.is_head ? 'Department Head' : 'Standard'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cross-Branch Access</span>
                <span className="detail-value">
                  {staff.is_cross_branch ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value capitalize font-medium">
                  {staff.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE E: Performance Context (Truthful Unavailable)
  // ==========================================
  if (activeTab === 'performance') {
    return (
      <div
        className="booking-inspector-card active staff-inspector-card staff-context-inspector"
        role="region"
        aria-label="Staff Details Inspector"
        data-testid="staff-context-inspector"
      >
        <div className="inspector-header">
          <div className="inspector-header-top-row">
            <div className="inspector-status-wrapper">
              {renderStatusBadge(staff.status)}
              <span className="inspector-type-pill">
                {staff.staff_type.replace(/_/g, ' ')}
              </span>
            </div>
            <button
              type="button"
              className="inspector-close-btn"
              onClick={handleCloseStaff}
              aria-label="Close Inspector"
            >
              &times;
            </button>
          </div>

          <div className="inspector-customer-identity">
            <div className="inspector-avatar-circle" aria-hidden="true">
              {staffInitials}
            </div>
            <div className="inspector-identity-details">
              <h3
                className="inspector-customer-name"
                data-testid="inspector-staff-name"
              >
                {staff.full_name}
              </h3>
              <div className="inspector-booking-id">Performance Evaluation</div>
            </div>
          </div>
        </div>

        <div className="inspector-body-scrollable p-4 space-y-4">
          <div className="p-4 text-center text-xs text-[var(--cs-text-muted)] italic bg-[var(--cs-surface-warm)] rounded-lg border border-[var(--cs-border)]">
            Performance detail is not available in the current Staff contract.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE F: Staff Roster Context (Full Roster Inspector)
  // ==========================================
  return (
    <div
      className="booking-inspector-card active staff-inspector-card staff-context-inspector"
      role="region"
      aria-label="Staff Details Inspector"
      data-testid="staff-context-inspector"
    >
      {/* 1. Header matching BookingInspectorCard */}
      <div className="inspector-header">
        <div className="inspector-header-top-row">
          <div className="inspector-status-wrapper">
            {renderStatusBadge(staff.status)}
            <span className="inspector-type-pill">
              {staff.staff_type.replace(/_/g, ' ')}
            </span>
            {staff.is_head && <span className="supervisor-badge">Head</span>}
          </div>
          <button
            type="button"
            className="inspector-close-btn"
            onClick={handleCloseStaff}
            aria-label="Close Inspector"
          >
            &times;
          </button>
        </div>

        <div className="inspector-customer-identity">
          <div className="inspector-avatar-circle" aria-hidden="true">
            {staffInitials}
          </div>
          <div className="inspector-identity-details">
            <h3
              className="inspector-customer-name"
              data-testid="inspector-staff-name"
            >
              {staff.full_name}
            </h3>
            {staff.nickname && (
              <div className="inspector-booking-id">
                &ldquo;<span className="id-code">{staff.nickname}</span>&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Summary Bar: System role & Job function */}
        <div className="inspector-service-summary-bar">
          <div className="summary-service-title">
            {staff.system_role.toUpperCase()} ACCESS
          </div>
          <div className="summary-resource-label">
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{staff.staff_type.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* 2. Inspector Tabs */}
      <div
        className="inspector-tabs-nav"
        role="tablist"
        aria-label="Staff Inspector Panels"
      >
        {INSPECTOR_TABS.map((tab) => {
          const isActive = internalTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              className={`inspector-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setInternalTab(tab.id);
                setIsEditingProfile(false);
              }}
              data-testid={`inspector-tab-${tab.id}`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Body */}
      <div className="inspector-body-scrollable">
        {actionNotice && (
          <div className="p-3 bg-[var(--cs-surface-warm)] border-b border-[var(--cs-border)] text-xs text-[var(--cs-text)] flex justify-between items-center">
            <span>{actionNotice}</span>
            <button
              type="button"
              className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text)] ml-2"
              onClick={() => setActionNotice(null)}
            >
              &times;
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {internalTab === 'overview' && (
          <div className="inspector-tab-pane overview-pane">
            {isEditingProfile ? (
              <form
                onSubmit={handleSaveProfile}
                className="p-3.5 space-y-3 bg-[var(--cs-surface-warm)] rounded-lg border border-[var(--cs-border)] m-3"
                data-testid="edit-profile-form"
              >
                <div className="flex items-center justify-between border-b border-[var(--cs-border)] pb-2 mb-2">
                  <h4 className="text-xs font-semibold uppercase text-[var(--cs-text)]">
                    Edit Profile
                  </h4>
                  <button
                    type="button"
                    className="text-xs text-[var(--cs-text-muted)] hover:text-[var(--cs-text)]"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>

                {editError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {editError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="bookings-search-input w-full"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    data-testid="edit-staff-name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1">
                    Nickname / Call Name
                  </label>
                  <input
                    type="text"
                    className="bookings-search-input w-full"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    data-testid="edit-staff-nickname"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="bookings-search-input w-full"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    data-testid="edit-staff-phone"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1">
                      Staff Type
                    </label>
                    <select
                      className="bookings-select-filter w-full"
                      value={editStaffType}
                      onChange={(e) => setEditStaffType(e.target.value)}
                      data-testid="edit-staff-type"
                    >
                      <option value="therapist">Therapist</option>
                      <option value="nail_tech">Nail Tech</option>
                      <option value="aesthetician">Aesthetician</option>
                      <option value="csr">CSR / Front Desk</option>
                      <option value="driver">Driver</option>
                      <option value="utility">Utility</option>
                      <option value="managerial">Managerial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1">
                      Skill Tier
                    </label>
                    <select
                      className="bookings-select-filter w-full"
                      value={editTier}
                      onChange={(e) => setEditTier(e.target.value)}
                      data-testid="edit-staff-tier"
                    >
                      <option value="Standard">Standard</option>
                      <option value="junior">Junior</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="master">Master</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="edit-is-head"
                    checked={editIsHead}
                    onChange={(e) => setEditIsHead(e.target.checked)}
                    className="rounded text-[var(--cs-brand-green)]"
                    data-testid="edit-staff-is-head"
                  />
                  <label
                    htmlFor="edit-is-head"
                    className="text-xs text-[var(--cs-text)]"
                  >
                    Department Head / Supervisor
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--cs-border)]">
                  <button
                    type="button"
                    className="btn-secondary-compact text-xs"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bookings-header-primary-btn text-xs py-1.5 px-3"
                    disabled={isSaving}
                    data-testid="save-profile-btn"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            ) : (
              <div
                className="inspector-section"
                data-testid="inspector-profile-section"
              >
                <h4 className="inspector-section-heading">Contact & Work</h4>
                <div className="inspector-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value font-medium">
                      {staff.phone || '—'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Member Since</span>
                    <span className="detail-value">
                      {formatDate(staff.created_at)}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Job Function</span>
                    <span className="detail-value font-medium capitalize">
                      {staff.staff_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">System Role</span>
                    <span className="detail-value font-medium uppercase">
                      {staff.system_role}
                    </span>
                  </div>

                  {/* Skill Tier */}
                  {staff.system_role !== 'service_head' &&
                    staff.system_role !== 'crm' &&
                    staff.staff_type !== 'csr' &&
                    staff.staff_type !== 'driver' &&
                    staff.staff_type !== 'utility' &&
                    staff.tier && (
                      <div className="detail-item">
                        <span className="detail-label">Skill Tier</span>
                        <span className="detail-value font-medium capitalize">
                          {staff.tier}
                        </span>
                      </div>
                    )}

                  <div className="detail-item">
                    <span className="detail-label">Supervision</span>
                    <span className="detail-value">
                      {staff.is_head
                        ? 'Department Head'
                        : 'Not a department head'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Cross-Branch</span>
                    <span className="detail-value">
                      {staff.is_cross_branch
                        ? 'Eligible for cross-branch'
                        : 'Single branch only'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Operational Actions */}
            <div className="inspector-section">
              <h4 className="inspector-section-heading">
                Quick Operational Actions
              </h4>
              <div className="inspector-quick-actions-row">
                <button
                  type="button"
                  className="quick-action-btn primary"
                  onClick={handleStartEditing}
                  data-testid="inspector-edit-profile-btn"
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
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  className="quick-action-btn secondary"
                  onClick={() => {
                    if (onOpenFullScheduleModal) {
                      onOpenFullScheduleModal(staff);
                    } else {
                      onOpenScheduleModal(staff);
                    }
                  }}
                  data-testid="inspector-view-schedule-btn"
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
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>View Schedule</span>
                </button>

                <button
                  type="button"
                  className="quick-action-btn secondary"
                  onClick={() => onOpenCapabilityModal(staff)}
                  data-testid="inspector-manage-capabilities-btn"
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
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Capabilities</span>
                </button>
              </div>

              {/* Secondary Actions Row */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--cs-border)] mt-3">
                <button
                  type="button"
                  className="btn-secondary-compact text-xs"
                  onClick={() => onOpenRoleModal(staff)}
                  data-testid="inspector-manage-role-btn"
                >
                  Manage Role
                </button>
                <button
                  type="button"
                  className="btn-secondary-compact text-xs"
                  onClick={() => onOpenScheduleModal(staff)}
                  data-testid="inspector-adjust-schedule-btn"
                >
                  Adjust Schedule
                </button>
                <button
                  type="button"
                  className="btn-secondary-compact text-xs"
                  onClick={() => {
                    if (onCheckAvailability) {
                      onCheckAvailability(staff);
                    } else {
                      setActionNotice(
                        `Checked availability for ${staff.full_name}: active in branch schedule.`,
                      );
                    }
                  }}
                  data-testid="inspector-check-availability-btn"
                >
                  Check Availability
                </button>
              </div>

              {/* Destructive Action */}
              <div className="pt-3 border-t border-[var(--cs-border)] mt-3">
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5"
                  onClick={() => onOpenOffboardingModal(staff)}
                  data-testid="inspector-offboard-btn"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                    <line x1="12" y1="2" x2="12" y2="12" />
                  </svg>
                  <span>End Employment</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICES */}
        {internalTab === 'services' && (
          <div className="inspector-tab-pane services-pane p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--cs-border)] pb-2">
              <div>
                <h4 className="text-sm font-semibold text-[var(--cs-text)]">
                  Assigned Services
                </h4>
                <p className="text-xs text-[var(--cs-text-muted)]">
                  {staff.services.length} capability
                  {staff.services.length === 1 ? '' : 's'} assigned
                </p>
              </div>
              <button
                type="button"
                className="bookings-header-primary-btn text-xs py-1 px-2.5"
                onClick={() => onOpenCapabilityModal(staff)}
              >
                Manage
              </button>
            </div>

            {staff.services.length === 0 ? (
              <div className="text-center py-6 bg-[var(--cs-surface-warm)] rounded-lg border border-[var(--cs-border)]">
                <p className="text-xs text-[var(--cs-text-muted)] italic">
                  No service capabilities currently assigned to this staff
                  member.
                </p>
                <button
                  type="button"
                  className="btn-secondary-compact text-xs mt-2"
                  onClick={() => onOpenCapabilityModal(staff)}
                >
                  Assign Services
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {staff.services.slice(0, 8).map((s) => (
                  <div
                    key={s.service_id}
                    className="p-2 rounded bg-[var(--cs-surface-warm)] border border-[var(--cs-border)] flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-[var(--cs-text)]">
                      {s.service_name}
                    </span>
                    <span className="text-[10px] text-[var(--cs-text-muted)] font-mono">
                      ID: {s.service_id.slice(0, 8)}
                    </span>
                  </div>
                ))}
                {staff.services.length > 8 && (
                  <div className="text-center pt-2">
                    <span className="text-xs text-[var(--cs-text-muted)]">
                      +{staff.services.length - 8} more services assigned
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACCESS */}
        {internalTab === 'access' && (
          <div className="inspector-tab-pane access-pane p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--cs-border)] pb-2">
              <div>
                <h4 className="text-sm font-semibold text-[var(--cs-text)]">
                  System Access & Roles
                </h4>
                <p className="text-xs text-[var(--cs-text-muted)]">
                  Role governance and security credentials
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary-compact text-xs"
                onClick={() => onOpenRoleModal(staff)}
                data-testid="inspector-manage-role-btn"
              >
                Manage Role
              </button>
            </div>

            <div className="inspector-details-grid">
              <div className="detail-item">
                <span className="detail-label">Current Role</span>
                <span className="detail-value font-semibold uppercase text-[var(--cs-brand-green)]">
                  {staff.system_role}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Account Linkage</span>
                <span className="detail-value">
                  {staff.auth_user_id ? (
                    <span className="text-emerald-700 font-medium">
                      ● Account Linked
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">
                      ○ Not Linked
                    </span>
                  )}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Supervision</span>
                <span className="detail-value">
                  {staff.is_head ? 'Department Head' : 'Standard Provider'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Branch Governance</span>
                <span className="detail-value">
                  {staff.is_cross_branch
                    ? 'Multi-Branch'
                    : 'Single Branch Only'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Backward-compatible alias
export const StaffInspectorCard: React.FC<
  Omit<StaffContextInspectorProps, 'activeTab' | 'onCloseStaffSelection'> & {
    activeTab?: StaffPrimaryTab;
    onCloseStaffSelection?: () => void;
  }
> = (props) => {
  return (
    <StaffContextInspector
      {...props}
      activeTab={props.activeTab || 'roster'}
      onCloseStaffSelection={
        props.onCloseStaffSelection || props.onClose || (() => {})
      }
    />
  );
};
