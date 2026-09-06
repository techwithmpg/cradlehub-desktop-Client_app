import React from 'react';
import type { CustomerKpis, CustomerTabType } from '../../types/customers';

interface CustomersKpiSummaryProps {
  kpis: CustomerKpis;
  activeTab?: CustomerTabType;
  onKpiClick?: (tab: CustomerTabType) => void;
}

export const CustomersKpiSummary: React.FC<CustomersKpiSummaryProps> = ({
  kpis,
  activeTab,
  onKpiClick,
}) => {
  const items = [
    {
      key: 'totalCustomers',
      label: 'Total Customers',
      count: kpis.totalCustomers,
      subtext: 'Branch customer roster',
      tabTarget: 'all' as CustomerTabType,
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
      accentClass: 'kpi-accent-gold',
    },
    {
      key: 'repeatClients',
      label: 'Repeat Clients',
      count: kpis.repeatClients,
      subtext: '2+ recorded visits',
      tabTarget: 'repeat' as CustomerTabType,
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
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
      ),
      accentClass: 'kpi-accent-emerald',
    },
    {
      key: 'lapsedClients',
      label: 'Lapsed Clients',
      count: kpis.lapsedClients,
      subtext: 'No visit in 30+ days',
      tabTarget: 'lapsed' as CustomerTabType,
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
      key: 'newThisMonth',
      label: 'New This Month',
      count: kpis.newThisMonth,
      subtext: 'First visit this month',
      tabTarget: 'all' as CustomerTabType,
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
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
      accentClass: 'kpi-accent-blue',
    },
    {
      key: 'totalVisits',
      label: 'Total Visits',
      count: kpis.totalVisits,
      subtext: 'Aggregate recorded visits',
      tabTarget: 'all' as CustomerTabType,
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
  ];

  return (
    <div
      className="bookings-kpi-summary-card customers-kpi-summary-card"
      role="region"
      aria-label="Customers KPI Summary"
    >
      <div className="bookings-kpi-grid customers-kpi-grid">
        {items.map((item) => {
          const isSelected =
            activeTab === item.tabTarget &&
            (item.key === 'repeatClients' || item.key === 'lapsedClients');
          return (
            <div
              key={item.key}
              className={`bookings-kpi-cell ${item.accentClass} ${onKpiClick ? 'interactive' : ''} ${isSelected ? 'selected-kpi-cell' : ''}`}
              onClick={() => onKpiClick?.(item.tabTarget)}
              role="article"
              aria-label={`${item.label}: ${item.count}`}
              tabIndex={onKpiClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onKpiClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onKpiClick(item.tabTarget);
                }
              }}
            >
              <div className="bookings-kpi-cell-top">
                <div className="bookings-kpi-icon-wrapper">{item.icon}</div>
                <span className="bookings-kpi-label">{item.label}</span>
              </div>
              <div className="bookings-kpi-count">{item.count}</div>
              <div className="bookings-kpi-subtext">{item.subtext}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
