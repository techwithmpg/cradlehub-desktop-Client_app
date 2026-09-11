import React from 'react';

export const TodayMoneyCard: React.FC = () => {
  return (
    <div
      className="today-right-card today-money-card"
      data-testid="today-money-card"
    >
      <div className="today-right-card-header">
        <h3 className="today-right-card-title">Today's Money</h3>
        <span
          className="today-money-tag"
          data-testid="today-money-status"
          title="Financial operations remain on web"
        >
          Web only
        </span>
      </div>

      <div className="today-money-grid">
        <div className="today-money-metric">
          <span className="today-money-metric-label">Collected</span>
          <span className="today-money-metric-value text-slate-400">—</span>
        </div>
        <div className="today-money-metric">
          <span className="today-money-metric-label">Outstanding</span>
          <span className="today-money-metric-value text-slate-400">—</span>
        </div>
        <div className="today-money-metric">
          <span className="today-money-metric-label">Bookings</span>
          <span className="today-money-metric-value text-slate-400">—</span>
        </div>
        <div className="today-money-metric">
          <span className="today-money-metric-label">Average per ticket</span>
          <span className="today-money-metric-value text-slate-400">—</span>
        </div>
      </div>

      <div className="today-money-footer">
        <p className="today-money-notice">
          Financial summary is not available in Desktop yet. Manage payments on
          web.
        </p>
      </div>
    </div>
  );
};
