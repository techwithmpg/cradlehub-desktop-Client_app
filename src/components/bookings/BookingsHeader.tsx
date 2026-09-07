import React, { useState } from 'react';
import { ModuleHeader } from '../workspace/ModuleHeader';

interface BookingsHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenNewBooking?: () => void;
}

export const BookingsHeader: React.FC<BookingsHeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  onOpenNewBooking,
}) => {
  const [showNotice, setShowNotice] = useState(false);

  const handleNewBookingClick = () => {
    if (onOpenNewBooking) {
      onOpenNewBooking();
    } else {
      setShowNotice(true);
    }
  };

  return (
    <ModuleHeader
      title="Bookings"
      subtitle="Create, manage, and review all bookings across channels."
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      refreshTitle="Refresh Bookings"
      refreshAriaLabel="Refresh Bookings"
      primaryAction={{
        label: 'New Booking',
        onClick: handleNewBookingClick,
        ariaLabel: 'Create New Booking',
        testId: 'new-booking-button',
      }}
    >
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
    </ModuleHeader>
  );
};
