import React from 'react';
import type {
  StaffKpiSummary as StaffKpiSummaryType,
  StaffStatusFilter,
} from '../../types/staff';

interface StaffKpiSummaryProps {
  kpis: StaffKpiSummaryType;
  activeFilter?: StaffStatusFilter;
  onKpiClick?: (filter: StaffStatusFilter) => void;
}

export const StaffKpiSummary: React.FC<StaffKpiSummaryProps> = ({
  kpis,
  activeFilter = 'all',
  onKpiClick,
}) => {
  const items = [
    {
      key: 'totalStaff',
      label: 'Total Staff',
      count: kpis.totalStaff,
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
      count: kpis.activeStaff,
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
      count: kpis.awaitingStaff,
      subtext: '',
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
      count: kpis.invitedStaff,
      subtext: '',
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
      aria-label="Staff KPI Summary"
    >
      <div className="bookings-kpi-grid staff-kpi-grid">
        {items.map((item) => {
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

          if (onKpiClick) {
            return (
              <button
                key={item.key}
                type="button"
                className={`bookings-kpi-cell ${item.accentClass} interactive ${isSelected ? 'selected-kpi-cell' : ''}`}
                onClick={() => onKpiClick(item.filterTarget)}
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
};
