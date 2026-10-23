import type { DesktopTodayQueueItem } from '../../types/today';
import { ModuleInspectorFrame } from '../workspace';

interface TodayBookingInspectorCardProps {
  booking: DesktopTodayQueueItem | null;
  timeLabel?: string;
  onOpenBookings?: () => void;
}

export function TodayBookingInspectorCard({
  booking,
  timeLabel,
  onOpenBookings,
}: TodayBookingInspectorCardProps) {
  return (
    <ModuleInspectorFrame
      ariaLabel="Selected booking details"
      className="today-booking-inspector"
      testId="today-booking-inspector"
    >
      <div className="today-right-card-header">
        <h2 className="today-right-card-title">Booking details</h2>
      </div>
      {booking ? (
        <>
          <p className="today-inspector-customer">
            {booking.customerName || 'Customer name unavailable'}
          </p>
          <dl className="today-inspector-details">
            <div>
              <dt>Booking ID</dt>
              <dd>{booking.id}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{timeLabel}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{booking.serviceName || 'Service unavailable'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{booking.status.replaceAll('_', ' ')}</dd>
            </div>
            <div>
              <dt>Assignee</dt>
              <dd>{booking.staffName || 'Unassigned'}</dd>
            </div>
            {booking.customerPhone && (
              <div>
                <dt>Phone</dt>
                <dd>{booking.customerPhone}</dd>
              </div>
            )}
            {booking.isHomeService && (
              <div>
                <dt>Location</dt>
                <dd>{booking.homeServiceAddress || 'Unavailable'}</dd>
              </div>
            )}
          </dl>
          {booking.dispatchWarning && (
            <p className="today-inspector-warning" role="status">
              {booking.dispatchWarning}
            </p>
          )}
        </>
      ) : (
        <p className="today-inspector-empty">
          Select a booking in the queue to review its details.
        </p>
      )}
      {onOpenBookings && (
        <button
          type="button"
          className="today-inspector-open-bookings"
          onClick={onOpenBookings}
        >
          Open Bookings
        </button>
      )}
    </ModuleInspectorFrame>
  );
}
