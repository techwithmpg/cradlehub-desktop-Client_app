import React from 'react';
import type { BookingKpiSummary } from '../../types/bookings';

interface BookingsKpiSummaryProps {
  kpis: BookingKpiSummary;
  onKpiClick?: (filterType: string) => void;
}

export const BookingsKpiSummaryCard: React.FC<BookingsKpiSummaryProps> = ({
  kpis,
  onKpiClick,
}) => {
  const items = [
    {
      key: 'today',
      data: kpis.today,
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
      accentClass: 'kpi-accent-gold',
    },
    {
      key: 'confirmed',
      data: kpis.confirmed,
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
      accentClass: 'kpi-accent-blue',
    },
    {
      key: 'checked_in',
      data: kpis.checkedIn,
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
      accentClass: 'kpi-accent-emerald',
    },
    {
      key: 'completed',
      data: kpis.completed,
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
          <polyline points="16 10 12 14 8 10" />
        </svg>
      ),
      accentClass: 'kpi-accent-green',
    },
    {
      key: 'no_show',
      data: kpis.noShow,
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
      key: 'cancelled',
      data: kpis.cancelled,
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
      className="bookings-kpi-summary-card"
      role="region"
      aria-label="Bookings KPI Summary"
    >
      <div className="bookings-kpi-grid">
        {items.map((item) => (
          <div
            key={item.key}
            className={`bookings-kpi-cell ${item.accentClass} ${onKpiClick ? 'interactive' : ''}`}
            onClick={() => onKpiClick?.(item.key)}
            role="article"
            aria-label={`${item.data.label}: ${item.data.count}`}
          >
            <div className="bookings-kpi-cell-top">
              <div className="bookings-kpi-icon-wrapper">{item.icon}</div>
              <span className="bookings-kpi-label">{item.data.label}</span>
            </div>
            <div className="bookings-kpi-count">{item.data.count}</div>
            <div className="bookings-kpi-subtext">{item.data.subtext}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
