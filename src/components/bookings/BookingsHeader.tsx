import React, { useState } from 'react';

interface BookingsHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const BookingsHeader: React.FC<BookingsHeaderProps> = ({
  onRefresh,
  isRefreshing = false,
}) => {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className="bookings-header-container">
      <div className="bookings-header-left">
        <h1 className="bookings-header-title">Bookings</h1>
        <p className="bookings-header-subtitle">
          Create, manage, and review all bookings across channels.
        </p>
      </div>

      <div className="bookings-header-right">
        {onRefresh && (
          <button
            type="button"
            className="bookings-header-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Bookings"
            aria-label="Refresh Bookings"
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
        )}

        <button
          type="button"
          className="bookings-header-primary-btn"
          onClick={() => setShowNotice(true)}
          aria-label="Create New Booking"
        >
          <svg
            className="bookings-header-btn-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Booking</span>
        </button>
      </div>

      {showNotice && (
        <div
          className="bookings-modal-backdrop"
          onClick={() => setShowNotice(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-booking-notice-title"
        >
          <div
            className="bookings-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bookings-modal-header">
              <div className="bookings-modal-badge">Read-Only Slice</div>
              <h3
                id="new-booking-notice-title"
                className="bookings-modal-title"
              >
                Administrative New Booking
              </h3>
              <button
                type="button"
                className="bookings-modal-close-btn"
                onClick={() => setShowNotice(false)}
                aria-label="Close dialog"
              >
                &times;
              </button>
            </div>
            <p className="bookings-modal-body">
              Stage 02 provides the real branch-scoped Bookings workspace, KPI
              summary, and selected booking inspector. Administrative booking
              creation writes remain hosted and will be connected in an
              authorized write stage.
            </p>
            <div className="bookings-modal-footer">
              <button
                type="button"
                className="bookings-modal-ack-btn"
                onClick={() => setShowNotice(false)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
