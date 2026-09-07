import React from 'react';

export const StaffPerformanceView: React.FC = () => {
  return (
    <div
      className="bookings-datagrid-wrapper p-8"
      data-testid="staff-performance-view"
    >
      <div className="bookings-table-empty-state max-w-lg mx-auto py-8">
        <div className="bookings-empty-icon-circle">
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
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <h4 className="bookings-empty-heading">
          Performance metrics are not available in the current Staff data
          contract.
        </h4>
        <p className="bookings-empty-text">
          Operational metrics such as service throughput, attendance compliance,
          and booking ratings require dedicated aggregate reporting contracts.
        </p>
      </div>
    </div>
  );
};
