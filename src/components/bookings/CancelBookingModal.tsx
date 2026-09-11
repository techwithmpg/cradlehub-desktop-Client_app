import React, { useEffect, useState } from 'react';
import type { Booking } from '../../types/bookings';
import {
  BOOKING_CANCELLATION_REASONS,
  type BookingCancellationReason,
  cancelBranchBooking,
} from '../../lib/bookings-service';

export interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onBookingCancelled?: () => void;
}

function formatBookingDate(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-PH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTimeDisplay(timeStr?: string | null): string {
  if (!timeStr) return '—';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${ampm}`;
}

interface CancelBookingModalDialogProps {
  onClose: () => void;
  booking: Booking;
  onBookingCancelled?: () => void;
}

const CancelBookingModalDialog: React.FC<CancelBookingModalDialogProps> = ({
  onClose,
  booking,
  onBookingCancelled,
}) => {
  const [reason, setReason] = useState<BookingCancellationReason | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Select a cancellation reason.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await cancelBranchBooking({
        bookingId: booking.id,
        cancellationReason: reason as BookingCancellationReason,
        note: note.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.error || 'Failed to cancel booking.');
        setIsSubmitting(false);
        return;
      }

      onBookingCancelled?.();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Network error occurred while cancelling booking.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-booking-modal-title"
      data-testid="cancel-booking-modal"
    >
      <div className="modal-container-card" style={{ maxWidth: 480 }}>
        <div className="modal-header-row">
          <div>
            <h2 id="cancel-booking-modal-title" className="modal-title-text">
              Cancel booking?
            </h2>
            <p className="modal-subtitle-text">
              This keeps the existing cancellation workflow and records the
              reason in the booking history.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close cancellation dialog"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-content space-y-4">
            {/* Read-only Booking Summary */}
            <div className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-warm)] p-3 text-xs space-y-1.5">
              <div className="grid grid-cols-[5rem_1fr] gap-x-2">
                <span className="text-[var(--cs-text-muted)] font-medium">
                  Customer:
                </span>
                <span className="font-semibold text-[var(--cs-text)] truncate">
                  {booking.customer?.full_name || 'Customer'}
                </span>
              </div>
              <div className="grid grid-cols-[5rem_1fr] gap-x-2">
                <span className="text-[var(--cs-text-muted)] font-medium">
                  Service:
                </span>
                <span className="text-[var(--cs-text)] truncate">
                  {booking.service?.name || 'Service'}
                </span>
              </div>
              <div className="grid grid-cols-[5rem_1fr] gap-x-2">
                <span className="text-[var(--cs-text-muted)] font-medium">
                  Date:
                </span>
                <span className="text-[var(--cs-text)]">
                  {formatBookingDate(booking.booking_date)}
                </span>
              </div>
              <div className="grid grid-cols-[5rem_1fr] gap-x-2">
                <span className="text-[var(--cs-text-muted)] font-medium">
                  Time:
                </span>
                <span className="text-[var(--cs-text)]">
                  {formatTimeDisplay(booking.start_time)}
                </span>
              </div>
            </div>

            {/* Reason selection (Canonical CRM list) */}
            <div className="space-y-1">
              <label
                htmlFor="cancellation-reason"
                className="block text-xs font-semibold text-[var(--cs-text)]"
              >
                Reason{' '}
                <span className="text-red-700" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                id="cancellation-reason"
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value as BookingCancellationReason | '')
                }
                required
                className="w-full h-9 rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] px-2.5 text-xs text-[var(--cs-text)] outline-none focus:border-[var(--color-accent)]"
              >
                <option value="">Select a cancellation reason</option>
                {BOOKING_CANCELLATION_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cancellation Note */}
            <div className="space-y-1">
              <label
                htmlFor="cancellation-note"
                className="block text-xs font-semibold text-[var(--cs-text)]"
              >
                Note{' '}
                <span className="font-normal text-[var(--cs-text-muted)]">
                  (optional)
                </span>
              </label>
              <textarea
                id="cancellation-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add internal context"
                maxLength={500}
                className="w-full rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] p-2 text-xs text-[var(--cs-text)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="p-2.5 rounded bg-red-50 text-red-700 border border-red-200 text-xs"
              >
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer-row">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] text-xs font-semibold text-[var(--cs-text)] hover:bg-[var(--cs-surface-hover)] disabled:opacity-50"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Keep Booking
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 shadow-sm"
              disabled={isSubmitting || !reason}
            >
              {isSubmitting ? 'Cancelling…' : 'Cancel Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  onBookingCancelled,
}) => {
  if (!isOpen || !booking) return null;

  return (
    <CancelBookingModalDialog
      onClose={onClose}
      booking={booking}
      onBookingCancelled={onBookingCancelled}
    />
  );
};
