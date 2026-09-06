import React, { useState } from 'react';
import type { StaffMember } from '../../types/staff';
import { canonicalizeRole, formatRoleLabel } from '../../lib/roles';

interface StaffInspectorCardProps {
  selectedStaff: StaffMember | null;
  branchName?: string;
  onClose: () => void;
}

type InspectorTab = 'profile' | 'services';

function formatStaffType(type: string): string {
  if (!type) return 'Therapist';
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatTier(tier: string): string {
  if (!tier) return 'Mid';
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const StaffInspectorCard: React.FC<StaffInspectorCardProps> = ({
  selectedStaff,
  branchName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('profile');

  if (!selectedStaff) {
    return (
      <div
        className="bookings-inspector-card staff-inspector-card"
        data-testid="staff-inspector-empty"
      >
        <div className="inspector-placeholder-state">
          <div className="inspector-placeholder-icon" aria-hidden="true">
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
          <h4 className="inspector-placeholder-title">No Staff Selected</h4>
          <p className="inspector-placeholder-desc">
            Select a staff member from the roster to inspect their profile and
            assigned service capabilities.
          </p>
        </div>
      </div>
    );
  }

  const initials = getInitials(selectedStaff.full_name);
  const serviceCount = selectedStaff.services.length;

  return (
    <div
      className="bookings-inspector-card staff-inspector-card"
      data-testid="staff-inspector-card"
    >
      {/* 1. Inspector Header */}
      <div className="inspector-header">
        <div className="inspector-header-left">
          <div className="inspector-avatar-circle" aria-hidden="true">
            {selectedStaff.avatar_url ? (
              <img
                src={selectedStaff.avatar_url}
                alt=""
                className="inspector-avatar-img"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="inspector-meta">
            <h3 className="inspector-title" data-testid="inspector-staff-name">
              {selectedStaff.full_name}
            </h3>
            {selectedStaff.nickname && (
              <p className="inspector-subtitle">
                Nickname: &ldquo;{selectedStaff.nickname}&rdquo;
              </p>
            )}
            <div className="inspector-status-container">
              <span
                className={`staff-status-badge staff-status-${selectedStaff.status}`}
                data-testid="inspector-status-badge"
              >
                {selectedStaff.status === 'active'
                  ? 'Active'
                  : selectedStaff.status === 'awaiting'
                    ? 'Awaiting Approval'
                    : 'Invite Sent'}
              </span>
              {selectedStaff.is_head && (
                <span className="staff-head-badge">Head Therapist</span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="inspector-close-btn"
          onClick={onClose}
          aria-label="Close staff inspector"
          title="Close inspector"
        >
          ✕
        </button>
      </div>

      {/* 2. Inspector Navigation Tabs */}
      <div
        className="inspector-tabs-nav"
        role="tablist"
        aria-label="Staff detail sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'profile'}
          className={`inspector-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          data-testid="inspector-tab-profile"
        >
          Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'services'}
          className={`inspector-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
          data-testid="inspector-tab-services"
        >
          <span>Services</span>
          <span className="inspector-tab-count-badge">{serviceCount}</span>
        </button>
      </div>

      {/* 3. Tab Body */}
      <div className="inspector-body">
        {activeTab === 'profile' ? (
          <div
            className="inspector-section"
            data-testid="inspector-profile-section"
          >
            <h4 className="inspector-section-heading">OPERATIONAL IDENTITY</h4>
            <dl className="inspector-details-list">
              <div className="inspector-detail-row">
                <dt className="detail-term">Full Legal Name</dt>
                <dd className="detail-val">{selectedStaff.full_name}</dd>
              </div>

              {selectedStaff.nickname && (
                <div className="inspector-detail-row">
                  <dt className="detail-term">Operational Nickname</dt>
                  <dd className="detail-val">{selectedStaff.nickname}</dd>
                </div>
              )}

              <div className="inspector-detail-row">
                <dt className="detail-term">Phone Number</dt>
                <dd className="detail-val">{selectedStaff.phone || '—'}</dd>
              </div>

              <div className="inspector-detail-row">
                <dt className="detail-term">System Access Role</dt>
                <dd className="detail-val">
                  <span className="staff-role-badge">
                    {formatRoleLabel(
                      canonicalizeRole(selectedStaff.system_role),
                      selectedStaff.system_role,
                    )}
                  </span>
                </dd>
              </div>

              <div className="inspector-detail-row">
                <dt className="detail-term">Operational Job Function</dt>
                <dd className="detail-val">
                  {formatStaffType(selectedStaff.staff_type)}
                </dd>
              </div>

              <div className="inspector-detail-row">
                <dt className="detail-term">Therapist Skill Tier</dt>
                <dd className="detail-val">
                  <span
                    className={`staff-tier-badge staff-tier-${selectedStaff.tier.toLowerCase()}`}
                  >
                    {formatTier(selectedStaff.tier)}
                  </span>
                </dd>
              </div>

              <div className="inspector-detail-row">
                <dt className="detail-term">Department Supervision</dt>
                <dd className="detail-val">
                  {selectedStaff.is_head ? (
                    <span className="badge-positive">
                      Department Lead / Head
                    </span>
                  ) : (
                    <span className="text-muted">Standard Provider</span>
                  )}
                </dd>
              </div>

              <div className="inspector-detail-row">
                <dt className="detail-term">Cross-Branch Dispatch</dt>
                <dd className="detail-val">
                  {selectedStaff.is_cross_branch
                    ? 'Cross-branch active'
                    : 'Single branch only'}
                </dd>
              </div>

              <div className="inspector-detail-row">
                <dt className="detail-term">Account Login Link</dt>
                <dd className="detail-val">
                  {selectedStaff.auth_user_id ? (
                    <span className="text-emerald-700">
                      Linked to Login User (
                      {selectedStaff.auth_user_id.slice(0, 8)}...)
                    </span>
                  ) : (
                    <span className="text-amber-700">
                      Pending Account Claim
                    </span>
                  )}
                </dd>
              </div>

              {branchName && (
                <div className="inspector-detail-row">
                  <dt className="detail-term">Assigned Branch</dt>
                  <dd className="detail-val">{branchName}</dd>
                </div>
              )}

              <div className="inspector-detail-row">
                <dt className="detail-term">Member Since</dt>
                <dd className="detail-val">
                  {formatDate(selectedStaff.created_at)}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div
            className="inspector-section"
            data-testid="inspector-services-section"
          >
            <h4 className="inspector-section-heading">
              ASSIGNED SERVICE CAPABILITIES ({serviceCount})
            </h4>
            {serviceCount === 0 ? (
              <div
                className="inspector-empty-services-state"
                data-testid="inspector-services-empty"
              >
                <div className="empty-services-icon" aria-hidden="true">
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
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <p className="empty-services-title">No Assigned Services</p>
                <p className="empty-services-desc">
                  This staff member does not have any assigned service
                  capabilities.
                </p>
              </div>
            ) : (
              <ul className="staff-services-list" role="list">
                {selectedStaff.services.map((svc) => (
                  <li key={svc.service_id} className="staff-service-item">
                    <div className="service-check-icon" aria-hidden="true">
                      ✓
                    </div>
                    <span className="staff-service-name">
                      {svc.service_name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
