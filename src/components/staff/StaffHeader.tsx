import React from 'react';

interface StaffHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="bookings-header-container staff-header-container">
      <div className="bookings-header-left">
        <h1 className="bookings-header-title">Staff</h1>
        <p className="bookings-header-subtitle">
          Operational staff roster and capability profiles for the selected
          branch.
        </p>
      </div>

      <div className="bookings-header-right">
        <button
          type="button"
          className="bookings-header-refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Staff Roster"
          aria-label="Refresh Staff Roster"
        >
          <svg
            className={`bookings-header-refresh-icon ${isRefreshing ? 'spin' : ''}`}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span className="bookings-header-refresh-text">Refresh</span>
        </button>
      </div>
    </div>
  );
};
