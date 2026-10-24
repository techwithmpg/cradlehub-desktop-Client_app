import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  DoorClosed,
  MapPin,
  Play,
  User,
  Users,
} from 'lucide-react';
import type {
  DesktopTodayQueueItem,
  TodayMutationAction,
} from '../../types/today';
import { ModuleInspectorFrame } from '../workspace';

interface TodayBookingInspectorCardProps {
  booking: DesktopTodayQueueItem | null;
  timeLabel?: string;
  onOpenBookings?: () => void;
  onClose?: () => void;
  onMutateAction?: (action: TodayMutationAction, bookingId: string) => void;
  onOpenCashier?: () => void;
  isMutating?: boolean;
}

export function TodayBookingInspectorCard({
  booking,
  timeLabel,
  onOpenBookings,
  onClose,
  onMutateAction,
  onOpenCashier,
  isMutating,
}: TodayBookingInspectorCardProps) {
  return (
    <ModuleInspectorFrame
      ariaLabel="Selected booking details"
      className="today-booking-inspector"
      testId="today-booking-inspector"
    >
      <div className="today-right-card-header">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              className="today-inspector-back-btn"
              onClick={onClose}
              data-testid="today-inspector-back-btn"
              title="Return to arrivals and activity overview"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back</span>
            </button>
          )}
          <h2 className="today-right-card-title">Booking Details</h2>
        </div>
        {booking && (
          <span className="today-badge badge-default uppercase tracking-wider text-[10px]">
            {booking.type}
          </span>
        )}
      </div>

      {booking ? (
        <div className="today-inspector-content">
          {/* Customer Header */}
          <div className="today-inspector-customer-card">
            <div className="today-inspector-avatar">
              <User size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="today-inspector-customer">
                {booking.customerName || 'Walk-in Guest'}
              </p>
              {booking.customerPhone ? (
                <p className="today-inspector-phone">{booking.customerPhone}</p>
              ) : (
                <p className="today-inspector-phone text-slate-400">
                  No phone recorded
                </p>
              )}
            </div>
          </div>

          {/* Key Facts DL */}
          <dl className="today-inspector-details">
            <div>
              <dt>
                <Clock size={13} aria-hidden="true" />
                <span>Time</span>
              </dt>
              <dd>
                {timeLabel || `${booking.startTime} – ${booking.endTime}`}
              </dd>
            </div>
            <div>
              <dt>
                <Calendar size={13} aria-hidden="true" />
                <span>Service</span>
              </dt>
              <dd>
                {booking.serviceName || 'Service unavailable'}
                {booking.serviceDuration
                  ? ` (${booking.serviceDuration} min)`
                  : ''}
              </dd>
            </div>
            <div>
              <dt>
                <Users size={13} aria-hidden="true" />
                <span>Therapist</span>
              </dt>
              <dd>{booking.staffName || 'Unassigned'}</dd>
            </div>
            {booking.resourceName && (
              <div>
                <dt>
                  <DoorClosed size={13} aria-hidden="true" />
                  <span>Room</span>
                </dt>
                <dd>{booking.resourceName}</dd>
              </div>
            )}
            <div>
              <dt>
                <span>Status</span>
              </dt>
              <dd className="capitalize">
                {booking.status.replaceAll('_', ' ')}
              </dd>
            </div>
            <div>
              <dt>
                <span>Stage</span>
              </dt>
              <dd className="capitalize">
                {booking.stage?.replaceAll('_', ' ') || 'None'}
              </dd>
            </div>
            <div>
              <dt>
                <span>Booking ID</span>
              </dt>
              <dd className="font-mono text-[10px] text-slate-500">
                {booking.id}
              </dd>
            </div>
            {booking.isHomeService && (
              <div>
                <dt>
                  <MapPin size={13} aria-hidden="true" />
                  <span>Location</span>
                </dt>
                <dd>{booking.homeServiceAddress || 'Address unavailable'}</dd>
              </div>
            )}
          </dl>

          {booking.dispatchWarning && (
            <p className="today-inspector-warning" role="status">
              {booking.dispatchWarning}
            </p>
          )}

          {/* Operational Action Buttons */}
          <div className="today-inspector-actions">
            {booking.bookingProgressStatus === 'checked_in' &&
              onMutateAction && (
                <button
                  type="button"
                  className="today-inspector-action-btn primary"
                  disabled={isMutating}
                  onClick={() => onMutateAction('start_service', booking.id)}
                >
                  <Play size={13} fill="currentColor" aria-hidden="true" />
                  <span>{isMutating ? 'Starting...' : 'Start Service'}</span>
                </button>
              )}

            {(booking.bookingProgressStatus === 'session_started' ||
              booking.stage === 'in_service') &&
              onMutateAction && (
                <button
                  type="button"
                  className="today-inspector-action-btn success"
                  disabled={isMutating}
                  onClick={() => onMutateAction('complete_service', booking.id)}
                >
                  <Play size={13} fill="currentColor" aria-hidden="true" />
                  <span>
                    {isMutating ? 'Completing...' : 'Complete Service'}
                  </span>
                </button>
              )}

            {booking.stage === 'ready_to_pay' && onOpenCashier && (
              <button
                type="button"
                className="today-inspector-action-btn cashier"
                onClick={onOpenCashier}
              >
                <CreditCard size={13} aria-hidden="true" />
                <span>Open Cashier</span>
              </button>
            )}

            {onOpenBookings && (
              <button
                type="button"
                className="today-inspector-open-bookings"
                onClick={onOpenBookings}
              >
                Open Bookings Module &rarr;
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="today-inspector-empty">
          Select a booking in the queue to review its details.
        </p>
      )}
    </ModuleInspectorFrame>
  );
}
