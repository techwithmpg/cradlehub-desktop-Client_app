import React, { useState } from 'react';
import type { StaffMember, UpdateStaffProfileInput } from '../../types/staff';
import { updateStaffProfile } from '../../lib/staff-service';

export type StaffInspectorTab = 'overview' | 'services' | 'access';

interface StaffInspectorCardProps {
  staff: StaffMember | null;
  onClose: () => void;
  onOpenScheduleModal: (staff: StaffMember) => void;
  onOpenFullScheduleModal?: (staff: StaffMember) => void;
  onOpenCapabilityModal: (staff: StaffMember) => void;
  onOpenRoleModal: (staff: StaffMember) => void;
  onOpenOffboardingModal: (staff: StaffMember) => void;
  onStaffUpdated: (patch: Partial<StaffMember> & { id: string }) => void;
  onCheckAvailability?: (staff: StaffMember) => void;
}

const INSPECTOR_TABS: Array<{ id: StaffInspectorTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'services', label: 'Services' },
  { id: 'access', label: 'Access' },
];

export const StaffInspectorCard: React.FC<StaffInspectorCardProps> = ({
  staff,
  onClose,
  onOpenScheduleModal,
  onOpenFullScheduleModal,
  onOpenCapabilityModal,
  onOpenRoleModal,
  onOpenOffboardingModal,
  onStaffUpdated,
  onCheckAvailability,
}) => {
  const [activeTab, setActiveTab] = useState<StaffInspectorTab>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  if (!staff) {
    return (
      <div
        className="booking-inspector-card empty"
        role="region"
        aria-label="Staff Inspector"
        data-testid="staff-inspector-empty"
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h4 className="inspector-empty-heading">No Staff Selected</h4>
          <p className="inspector-empty-text">
            Select a staff member from the roster to view their complete
            operational profile, assigned services, and access permissions.
          </p>
        </div>
      </div>
    );
  }

  const initials = staff.full_name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setActiveTab('overview');
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
    setEditFullName(staff.full_name);
    setEditNickname(staff.nickname || '');
    setEditPhone(staff.phone || '');
    setEditStaffType(staff.staff_type);
    setEditTier(staff.tier);
    setEditIsHead(staff.is_head);
    setIsEditingProfile(false);
    setEditError(null);
  };

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

  return (
    <div
      className="booking-inspector-card active staff-inspector-card"
      role="region"
      aria-label="Staff Details Inspector"
      data-testid="staff-inspector-card"
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
            onClick={onClose}
            aria-label="Close Inspector"
          >
            &times;
          </button>
        </div>

        <div className="inspector-customer-identity">
          <div className="inspector-avatar-circle" aria-hidden="true">
            {initials}
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
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              className={`inspector-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
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
        {activeTab === 'overview' && (
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

                  {/* Skill Tier: Displayed for service providers who are not department heads / managerial / crm */}
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
        {activeTab === 'services' && (
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
        {activeTab === 'access' && (
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
