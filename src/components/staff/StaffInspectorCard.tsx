import React, { useState } from 'react';
import type { StaffMember, UpdateStaffProfileInput } from '../../types/staff';
import {
  shouldDisplayStaffTier,
  updateStaffProfile,
} from '../../lib/staff-service';

interface StaffInspectorCardProps {
  staff: StaffMember | null;
  onClose: () => void;
  onOpenScheduleModal: (staff: StaffMember) => void;
  onOpenCapabilityModal: (staff: StaffMember) => void;
  onOpenRoleModal: (staff: StaffMember) => void;
  onOpenOffboardingModal: (staff: StaffMember) => void;
  onStaffUpdated: (updated: Partial<StaffMember> & { id: string }) => void;
}

type InspectorTab = 'profile' | 'services' | 'access';

const STAFF_TYPE_OPTIONS = [
  { value: 'therapist', label: 'Therapist' },
  { value: 'nail_tech', label: 'Nail Technician' },
  { value: 'aesthetician', label: 'Aesthetician' },
  { value: 'csr', label: 'Front Desk / CSR' },
  { value: 'driver', label: 'Driver' },
  { value: 'utility', label: 'Utility' },
  { value: 'managerial', label: 'Managerial' },
];

const TIER_OPTIONS = ['Junior', 'Senior', 'Master', 'Standard'];

export const StaffInspectorCard: React.FC<StaffInspectorCardProps> = ({
  staff,
  onClose,
  onOpenScheduleModal,
  onOpenCapabilityModal,
  onOpenRoleModal,
  onOpenOffboardingModal,
  onStaffUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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
  }

  if (!staff) {
    return (
      <div
        className="booking-inspector-card staff-inspector-card empty-inspector"
        data-testid="staff-inspector-empty"
      >
        <div className="inspector-placeholder-content">
          <svg
            viewBox="0 0 24 24"
            width="32"
            height="32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="placeholder-icon"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <div className="placeholder-title">No Staff Selected</div>
          <div className="placeholder-subtitle">
            Select a staff member from the roster to view or manage their
            operational profile.
          </div>
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

  const isTierEligible = shouldDisplayStaffTier(staff);

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
      return d.toLocaleDateString(undefined, {
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
      className="booking-inspector-card staff-inspector-card"
      data-testid="staff-inspector-card"
    >
      {/* 1. Header with Close Button pinned top-right */}
      <div className="inspector-header">
        <div className="inspector-header-main flex items-start gap-3">
          <div
            className="staff-avatar-circle"
            aria-hidden="true"
            style={{ width: 42, height: 42, fontSize: 13 }}
          >
            {initials}
          </div>
          <div className="inspector-header-text min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2
                className="inspector-header-title text-base font-bold text-[var(--cs-text)] truncate"
                data-testid="inspector-staff-name"
              >
                {staff.full_name}
              </h2>
              {staff.is_head && (
                <span
                  className="supervisor-badge text-[10px] px-1.5 py-0.5"
                  title="Department Head"
                >
                  Head
                </span>
              )}
            </div>
            {staff.nickname && (
              <div className="text-xs text-[var(--cs-text-muted)] italic truncate">
                &ldquo;{staff.nickname}&rdquo;
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase">
                {staff.staff_type.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] text-[var(--cs-text-muted)]">
                &bull;
              </span>
              <span
                className={`bookings-status-badge ${staff.status === 'active' ? 'status-confirmed' : staff.status === 'awaiting' ? 'status-pending' : 'status-draft'}`}
              >
                {staff.status === 'active'
                  ? 'Active'
                  : staff.status === 'awaiting'
                    ? 'Awaiting Approval'
                    : 'Invite Sent'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="inspector-close-btn"
          onClick={onClose}
          aria-label="Close staff inspector"
        >
          &times;
        </button>
      </div>

      {/* 2. Quick Action Row */}
      <div className="inspector-actions-row flex items-center gap-1.5 p-2.5 border-b border-[var(--cs-border)] bg-[var(--cs-surface-warm)] overflow-x-auto">
        <button
          type="button"
          className={`btn-secondary-compact text-xs flex items-center gap-1 ${isEditingProfile ? 'active' : ''}`}
          data-testid="inspector-edit-profile-btn"
          onClick={() => {
            setActiveTab('profile');
            if (!isEditingProfile && staff) {
              setEditFullName(staff.full_name);
              setEditNickname(staff.nickname || '');
              setEditPhone(staff.phone || '');
              setEditStaffType(staff.staff_type);
              setEditTier(staff.tier);
              setEditIsHead(staff.is_head);
              setEditError(null);
            }
            setIsEditingProfile((prev) => !prev);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>{isEditingProfile ? 'Done Editing' : 'Edit Profile'}</span>
        </button>

        <button
          type="button"
          className="btn-secondary-compact text-xs flex items-center gap-1"
          data-testid="inspector-manage-schedule-btn"
          onClick={() => onOpenScheduleModal(staff)}
        >
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Schedule</span>
        </button>

        <button
          type="button"
          className="btn-secondary-compact text-xs flex items-center gap-1"
          data-testid="inspector-manage-capabilities-btn"
          onClick={() => onOpenCapabilityModal(staff)}
        >
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Capabilities</span>
        </button>

        <button
          type="button"
          className="btn-secondary-compact text-xs text-red-600 hover:text-red-700 ml-auto"
          data-testid="inspector-offboard-btn"
          onClick={() => onOpenOffboardingModal(staff)}
          title="End Employment / Offboarding"
        >
          End Employment
        </button>
      </div>

      {/* 3. Internal Tabs */}
      <div
        className="inspector-tabs-nav flex border-b border-[var(--cs-border)] px-4"
        role="tablist"
      >
        {(
          [
            { key: 'profile', label: 'Profile' },
            { key: 'services', label: `Services (${staff.services.length})` },
            { key: 'access', label: 'Access' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            data-testid={`inspector-tab-${t.key}`}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-[var(--cs-sand)] text-[var(--cs-sand)]'
                : 'border-transparent text-[var(--cs-text-muted)] hover:text-[var(--cs-text)]'
            }`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 4. Tab Content Body */}
      <div className="inspector-body-content p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            {isEditingProfile ? (
              <form
                onSubmit={handleSaveProfile}
                className="space-y-3"
                data-testid="staff-profile-edit-form"
              >
                <div>
                  <label className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    className="form-input-control text-xs w-full"
                    data-testid="edit-staff-name"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1">
                      Nickname
                    </label>
                    <input
                      type="text"
                      className="form-input-control text-xs w-full"
                      data-testid="edit-staff-nickname"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      className="form-input-control text-xs w-full"
                      data-testid="edit-staff-phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1">
                      Staff Type
                    </label>
                    <select
                      className="form-input-control text-xs w-full"
                      data-testid="edit-staff-type"
                      value={editStaffType}
                      onChange={(e) => setEditStaffType(e.target.value)}
                    >
                      {STAFF_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1">
                      Skill Tier
                    </label>
                    <select
                      className="form-input-control text-xs w-full"
                      data-testid="edit-staff-tier"
                      value={editTier}
                      onChange={(e) => setEditTier(e.target.value)}
                    >
                      {TIER_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--cs-text)]">
                    <input
                      type="checkbox"
                      checked={editIsHead}
                      onChange={(e) => setEditIsHead(e.target.checked)}
                      className="rounded border-[var(--cs-border)] text-[var(--cs-sand)]"
                    />
                    <span>Designate as Department Head / Supervisor</span>
                  </label>
                </div>

                {editError && (
                  <div
                    className="p-2 rounded bg-red-50 border border-red-200 text-red-700 text-xs"
                    role="alert"
                  >
                    {editError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--cs-border)]">
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    data-testid="cancel-profile-btn"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs"
                    data-testid="save-profile-btn"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div
                className="space-y-4"
                data-testid="inspector-profile-section"
              >
                {/* Contact Section */}
                <div className="inspector-section">
                  <h4 className="inspector-section-heading">
                    Contact &amp; Identity
                  </h4>
                  <div className="inspector-grid-2">
                    <div className="inspector-data-item">
                      <span className="data-label">Phone</span>
                      <span className="data-value">{staff.phone || '—'}</span>
                    </div>
                    <div className="inspector-data-item">
                      <span className="data-label">Nickname</span>
                      <span className="data-value">
                        {staff.nickname ? `"${staff.nickname}"` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Work Section */}
                <div className="inspector-section">
                  <h4 className="inspector-section-heading">
                    Work &amp; Operations
                  </h4>
                  <div className="inspector-grid-2">
                    <div className="inspector-data-item">
                      <span className="data-label">Job Function</span>
                      <span className="data-value">
                        {staff.staff_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {isTierEligible && (
                      <div className="inspector-data-item">
                        <span className="data-label">Skill Tier</span>
                        <span className="data-value">{staff.tier}</span>
                      </div>
                    )}
                    <div className="inspector-data-item">
                      <span className="data-label">Supervision</span>
                      <span className="data-value">
                        {staff.is_head
                          ? 'Department Head'
                          : 'Not a department head'}
                      </span>
                    </div>
                    <div className="inspector-data-item">
                      <span className="data-label">Cross-Branch</span>
                      <span className="data-value">
                        {staff.is_cross_branch
                          ? 'Eligible'
                          : 'Single branch only'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Employment Section */}
                <div className="inspector-section">
                  <h4 className="inspector-section-heading">
                    Employment Record
                  </h4>
                  <div className="inspector-grid-2">
                    <div className="inspector-data-item">
                      <span className="data-label">Member Since</span>
                      <span className="data-value">
                        {formatDate(staff.created_at)}
                      </span>
                    </div>
                    <div className="inspector-data-item">
                      <span className="data-label">Last Updated</span>
                      <span className="data-value">
                        {formatDate(staff.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--cs-text)]">
                Assigned Capabilities ({staff.services.length})
              </span>
              <button
                type="button"
                className="btn-secondary-compact text-xs"
                onClick={() => onOpenCapabilityModal(staff)}
              >
                Manage Capabilities
              </button>
            </div>

            {staff.services.length === 0 ? (
              <div
                className="p-4 rounded border border-dashed border-[var(--cs-border)] text-center text-xs text-[var(--cs-text-muted)]"
                data-testid="inspector-services-empty"
              >
                No service capabilities assigned to this staff member.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {staff.services.map((svc) => (
                  <span
                    key={svc.service_id}
                    className="text-xs px-2.5 py-1 rounded bg-[var(--cs-surface)] border border-[var(--cs-border)] text-[var(--cs-text)] font-medium"
                  >
                    {svc.service_name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Access Tab */}
        {activeTab === 'access' && (
          <div className="space-y-4">
            <div className="inspector-section">
              <h4 className="inspector-section-heading">
                System Access Authority
              </h4>
              <div className="space-y-3">
                <div className="inspector-data-item">
                  <span className="data-label">System Role</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-[var(--cs-text)] uppercase px-2 py-0.5 rounded bg-[var(--cs-surface-hover)] border border-[var(--cs-border)]">
                      {staff.system_role}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary-compact text-xs"
                      data-testid="inspector-manage-role-btn"
                      onClick={() => onOpenRoleModal(staff)}
                    >
                      Manage Role
                    </button>
                  </div>
                </div>

                <div className="inspector-data-item">
                  <span className="data-label">Authentication Account</span>
                  <span className="data-value">
                    {staff.auth_user_id
                      ? 'Account linked'
                      : 'Not linked (Pending invite)'}
                  </span>
                </div>

                <div className="inspector-data-item">
                  <span className="data-label">Active Status</span>
                  <span className="data-value">
                    {staff.is_active
                      ? 'Operational (Active)'
                      : 'Inactive / Onboarding'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
