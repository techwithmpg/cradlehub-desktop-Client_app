import React from 'react';
import type {
  BranchServiceOption,
  StaffBlockedTime,
  StaffKpiSummary as StaffKpiSummaryType,
  StaffMember,
  StaffOnboardingRequest,
  StaffPrimaryTab,
  StaffScheduleOverride,
  StaffStatusFilter,
} from '../../types/staff';

export interface StaffSummaryCardProps {
  activeTab: StaffPrimaryTab;
  staffList?: StaffMember[];
  onboardingRequests?: StaffOnboardingRequest[];
  scheduleOverrides?: StaffScheduleOverride[];
  scheduleBlocks?: StaffBlockedTime[];
  scheduleLoading?: boolean;
  scheduleError?: string | null;
  branchServices?: BranchServiceOption[];
  kpis?: StaffKpiSummaryType;
  activeFilter?: StaffStatusFilter;
  onRosterKpiClick?: (filter: StaffStatusFilter) => void;
  // Backward compatibility alias for onRosterKpiClick
  onKpiClick?: (filter: StaffStatusFilter) => void;
}

export const StaffSummaryCard: React.FC<StaffSummaryCardProps> = ({
  activeTab,
  staffList = [],
  onboardingRequests = [],
  scheduleOverrides = [],
  scheduleBlocks = [],
  scheduleLoading = false,
  scheduleError = null,
  kpis,
  activeFilter = 'all',
  onRosterKpiClick,
  onKpiClick,
}) => {
  const handleRosterClick = onRosterKpiClick || onKpiClick;

  // 1. TAB: Staff Roster Summary
  if (activeTab === 'roster') {
    const calculatedKpis = kpis || {
      totalStaff: staffList.length,
      activeStaff: staffList.filter((s) => s.status === 'active').length,
      awaitingStaff: staffList.filter((s) => s.status === 'awaiting').length,
      invitedStaff: staffList.filter((s) => s.status === 'invited').length,
    };

    const rosterItems = [
      {
        key: 'totalStaff',
        label: 'Total Staff',
        count: calculatedKpis.totalStaff,
        subtext: 'Branch roster headcount',
        filterTarget: 'all' as StaffStatusFilter,
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
        accentClass: 'kpi-accent-emerald',
      },
      {
        key: 'activeStaff',
        label: 'Active',
        count: calculatedKpis.activeStaff,
        subtext: 'Active branch staff',
        filterTarget: 'active' as StaffStatusFilter,
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ),
        accentClass: 'kpi-accent-green',
      },
      {
        key: 'awaitingStaff',
        label: 'Awaiting Approval',
        count: calculatedKpis.awaitingStaff,
        subtext: 'Pending approval',
        filterTarget: 'awaiting' as StaffStatusFilter,
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
        accentClass: 'kpi-accent-amber',
      },
      {
        key: 'invitedStaff',
        label: 'Invites Sent',
        count: calculatedKpis.invitedStaff,
        subtext: 'Pending activation',
        filterTarget: 'invited' as StaffStatusFilter,
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        ),
        accentClass: 'kpi-accent-blue',
      },
    ];

    return (
      <div
        className="bookings-kpi-summary-card staff-kpi-summary-card"
        role="region"
        aria-label="Staff Summary"
        data-testid="staff-summary-card"
      >
        <div className="bookings-kpi-grid staff-kpi-grid">
          {rosterItems.map((item) => {
            const isSelected = activeFilter === item.filterTarget;
            const content = (
              <>
                <div className="bookings-kpi-cell-top">
                  <div className="bookings-kpi-icon-wrapper">{item.icon}</div>
                  <span className="bookings-kpi-label">{item.label}</span>
                </div>
                <div className="bookings-kpi-count">{item.count}</div>
                {item.subtext ? (
                  <div className="bookings-kpi-subtext">{item.subtext}</div>
                ) : null}
              </>
            );

            if (handleRosterClick) {
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`bookings-kpi-cell ${item.accentClass} interactive ${isSelected ? 'selected-kpi-cell' : ''}`}
                  onClick={() => handleRosterClick(item.filterTarget)}
                  aria-pressed={isSelected}
                  aria-label={
                    item.subtext
                      ? `${item.label}: ${item.count}, ${item.subtext}`
                      : `${item.label}: ${item.count}`
                  }
                  data-testid={`staff-kpi-${item.key}`}
                >
                  {content}
                </button>
              );
            }

            return (
              <div
                key={item.key}
                className={`bookings-kpi-cell ${item.accentClass} ${isSelected ? 'selected-kpi-cell' : ''}`}
                aria-label={
                  item.subtext
                    ? `${item.label}: ${item.count}, ${item.subtext}`
                    : `${item.label}: ${item.count}`
                }
                data-testid={`staff-kpi-${item.key}`}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. TAB: Applications Summary
  if (activeTab === 'applications') {
    const totalApplications = onboardingRequests.length;
    const pendingApplications = onboardingRequests.filter(
      (r) => r.status === 'submitted',
    ).length;
    const approvedApplications = onboardingRequests.filter(
      (r) => r.status === 'approved',
    ).length;
    const rejectedApplications = onboardingRequests.filter(
      (r) => r.status === 'rejected',
    ).length;

    const applicationItems = [
      {
        key: 'totalApplications',
        label: 'Total Applications',
        count: totalApplications,
        subtext: 'All candidate submissions',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ),
        accentClass: 'kpi-accent-emerald',
      },
      {
        key: 'pendingApplications',
        label: 'Pending Review',
        count: pendingApplications,
        subtext: 'Awaiting onboarding review',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
        accentClass: 'kpi-accent-amber',
      },
      {
        key: 'approvedApplications',
        label: 'Approved',
        count: approvedApplications,
        subtext: 'Accepted applications',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ),
        accentClass: 'kpi-accent-green',
      },
      {
        key: 'rejectedApplications',
        label: 'Rejected',
        count: rejectedApplications,
        subtext: 'Declined submissions',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        ),
        accentClass: 'kpi-accent-red',
      },
    ];

    return (
      <div
        className="bookings-kpi-summary-card staff-kpi-summary-card"
        role="region"
        aria-label="Staff Applications Summary"
        data-testid="staff-summary-card"
      >
        <div className="bookings-kpi-grid staff-kpi-grid">
          {applicationItems.map((item) => (
            <div
              key={item.key}
              className={`bookings-kpi-cell ${item.accentClass}`}
              aria-label={`${item.label}: ${item.count}`}
              data-testid={`staff-kpi-${item.key}`}
            >
              <div className="bookings-kpi-cell-top">
                <div className="bookings-kpi-icon-wrapper">{item.icon}</div>
                <span className="bookings-kpi-label">{item.label}</span>
              </div>
              <div className="bookings-kpi-count">{item.count}</div>
              {item.subtext ? (
                <div className="bookings-kpi-subtext">{item.subtext}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. TAB: Capabilities & Services Summary
  if (activeTab === 'capabilities') {
    const totalStaff = staffList.length;
    const withCapabilities = staffList.filter(
      (s) => s.services.length > 0,
    ).length;
    const withoutCapabilities = staffList.filter(
      (s) => s.services.length === 0,
    ).length;
    const totalAssignments = staffList.reduce(
      (sum, s) => sum + s.services.length,
      0,
    );

    const capabilityItems = [
      {
        key: 'totalCapabilitiesStaff',
        label: 'Total Staff',
        count: totalStaff,
        subtext: 'Branch roster headcount',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        ),
        accentClass: 'kpi-accent-emerald',
      },
      {
        key: 'withCapabilities',
        label: 'With Capabilities',
        count: withCapabilities,
        subtext: 'Assigned service capabilities',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ),
        accentClass: 'kpi-accent-green',
      },
      {
        key: 'withoutCapabilities',
        label: 'Without Capabilities',
        count: withoutCapabilities,
        subtext: 'Unassigned (0 services)',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        ),
        accentClass: 'kpi-accent-amber',
      },
      {
        key: 'totalAssignments',
        label: 'Total Assignments',
        count: totalAssignments,
        subtext: 'Service capability links',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        ),
        accentClass: 'kpi-accent-blue',
      },
    ];

    return (
      <div
        className="bookings-kpi-summary-card staff-kpi-summary-card"
        role="region"
        aria-label="Staff Capabilities Summary"
        data-testid="staff-summary-card"
      >
        <div className="bookings-kpi-grid staff-kpi-grid">
          {capabilityItems.map((item) => (
            <div
              key={item.key}
              className={`bookings-kpi-cell ${item.accentClass}`}
              aria-label={`${item.label}: ${item.count}`}
              data-testid={`staff-kpi-${item.key}`}
            >
              <div className="bookings-kpi-cell-top">
                <div className="bookings-kpi-icon-wrapper">{item.icon}</div>
                <span className="bookings-kpi-label">{item.label}</span>
              </div>
              <div className="bookings-kpi-count">{item.count}</div>
              {item.subtext ? (
                <div className="bookings-kpi-subtext">{item.subtext}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. TAB: Roles & Permissions Summary
  if (activeTab === 'roles') {
    const totalStaff = staffList.length;
    const linkedAccounts = staffList.filter((s) =>
      Boolean(s.auth_user_id),
    ).length;
    const unlinkedAccounts = staffList.filter((s) => !s.auth_user_id).length;
    const departmentHeads = staffList.filter((s) => s.is_head).length;

    const roleItems = [
      {
        key: 'totalRolesStaff',
        label: 'Total Staff',
        count: totalStaff,
        subtext: 'Branch roster headcount',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        ),
        accentClass: 'kpi-accent-emerald',
      },
      {
        key: 'linkedAccounts',
        label: 'Linked Accounts',
        count: linkedAccounts,
        subtext: 'Active auth credentials',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <polyline points="17 11 19 13 23 9" />
          </svg>
        ),
        accentClass: 'kpi-accent-green',
      },
      {
        key: 'unlinkedAccounts',
        label: 'Unlinked Accounts',
        count: unlinkedAccounts,
        subtext: 'Roster only (no auth login)',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="18" y1="8" x2="23" y2="13" />
            <line x1="23" y1="8" x2="18" y2="13" />
          </svg>
        ),
        accentClass: 'kpi-accent-amber',
      },
      {
        key: 'departmentHeads',
        label: 'Department Heads',
        count: departmentHeads,
        subtext: 'Designated supervisors',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ),
        accentClass: 'kpi-accent-gold',
      },
    ];

    return (
      <div
        className="bookings-kpi-summary-card staff-kpi-summary-card"
        role="region"
        aria-label="Staff Roles Summary"
        data-testid="staff-summary-card"
      >
        <div className="bookings-kpi-grid staff-kpi-grid">
          {roleItems.map((item) => (
            <div
              key={item.key}
              className={`bookings-kpi-cell ${item.accentClass}`}
              aria-label={`${item.label}: ${item.count}`}
              data-testid={`staff-kpi-${item.key}`}
            >
              <div className="bookings-kpi-cell-top">
                <div className="bookings-kpi-icon-wrapper">{item.icon}</div>
                <span className="bookings-kpi-label">{item.label}</span>
              </div>
              <div className="bookings-kpi-count">{item.count}</div>
              {item.subtext ? (
                <div className="bookings-kpi-subtext">{item.subtext}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. TAB: Schedule View Summary
  if (activeTab === 'schedule') {
    if (scheduleLoading) {
      return (
        <div
          className="bookings-kpi-summary-card staff-kpi-summary-card"
          role="region"
          aria-label="Staff Schedule Summary"
          data-testid="staff-summary-card"
        >
          <div className="bookings-kpi-grid staff-kpi-grid">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bookings-kpi-cell kpi-accent-emerald animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-6 bg-gray-300 rounded w-10" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (scheduleError) {
      return (
        <div
          className="bookings-kpi-summary-card staff-kpi-summary-card"
          role="region"
          aria-label="Staff Schedule Summary"
          data-testid="staff-summary-card"
        >
          <div className="p-4 text-center text-xs text-red-700 bg-red-50 rounded-md">
            Schedule summary data is unavailable: {scheduleError}
          </div>
        </div>
      );
    }

    const scheduleItems = [
      {
        key: 'scheduleStaff',
        label: 'Staff in View',
        count: staffList.length,
        subtext: 'Branch operational roster',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        ),
        accentClass: 'kpi-accent-emerald',
      },
      {
        key: 'scheduleOverrides',
        label: 'Overrides This Week',
        count: scheduleOverrides.length,
        subtext: 'Custom shift hours & days off',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
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
        ),
        accentClass: 'kpi-accent-amber',
      },
      {
        key: 'scheduleBlocks',
        label: 'Blocked Times',
        count: scheduleBlocks.length,
        subtext: 'Recorded blocked intervals',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        ),
        accentClass: 'kpi-accent-blue',
      },
      {
        key: 'scheduleWindow',
        label: 'Schedule Scope',
        count: 'Active',
        subtext: 'Current weekly schedule window',
        icon: (
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        ),
        accentClass: 'kpi-accent-green',
      },
    ];

    return (
      <div
        className="bookings-kpi-summary-card staff-kpi-summary-card"
        role="region"
        aria-label="Staff Schedule Summary"
        data-testid="staff-summary-card"
      >
        <div className="bookings-kpi-grid staff-kpi-grid">
          {scheduleItems.map((item) => (
            <div
              key={item.key}
              className={`bookings-kpi-cell ${item.accentClass}`}
              aria-label={`${item.label}: ${item.count}`}
              data-testid={`staff-kpi-${item.key}`}
            >
              <div className="bookings-kpi-cell-top">
                <div className="bookings-kpi-icon-wrapper">{item.icon}</div>
                <span className="bookings-kpi-label">{item.label}</span>
              </div>
              <div className="bookings-kpi-count">{item.count}</div>
              {item.subtext ? (
                <div className="bookings-kpi-subtext">{item.subtext}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. TAB: Performance Summary (Truthful Unavailable Contract)
  return (
    <div
      className="bookings-kpi-summary-card staff-kpi-summary-card"
      role="region"
      aria-label="Staff Performance Summary"
      data-testid="staff-summary-card"
    >
      <div
        className="p-4 text-center text-xs text-[var(--cs-text-muted)] flex items-center justify-center gap-2"
        data-testid="staff-kpi-performance-unavailable"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          Performance metrics are not available in the current Staff contract.
        </span>
      </div>
    </div>
  );
};

// Backward-compatible alias
export const StaffKpiSummary = StaffSummaryCard;
