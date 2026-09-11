import React, { useEffect, useState } from 'react';
import type { Booking } from '../../types/bookings';
import { rescheduleBranchBooking } from '../../lib/bookings-service';

export interface RescheduleBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onBookingRescheduled?: () => void;
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

interface RescheduleBookingModalDialogProps {
  onClose: () => void;
  booking: Booking;
  onBookingRescheduled?: () => void;
}

const RescheduleBookingModalDialog: React.FC<
  RescheduleBookingModalDialogProps
> = ({ onClose, booking, onBookingRescheduled }) => {
  const isHomeService =
    booking.delivery_type === 'home_service' || booking.type === 'home_service';
  const meta = booking.metadata as Record<string, unknown> | null | undefined;
  const hs = meta?.home_service as Record<string, unknown> | null | undefined;

  const [date, setDate] = useState(booking.booking_date || '');
  const [startTime, setStartTime] = useState(
    booking.start_time ? booking.start_time.slice(0, 5) : '',
  );
  const [homeServiceAddress, setHomeServiceAddress] = useState(
    typeof hs?.address === 'string' ? hs.address : '',
  );
  const [homeServiceAccessNote, setHomeServiceAccessNote] = useState(
    typeof hs?.access_notes === 'string'
      ? hs.access_notes
      : typeof hs?.access_note === 'string'
        ? hs.access_note
        : '',
  );
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

  const hasChanges =
    date !== booking.booking_date ||
    startTime !== (booking.start_time ? booking.start_time.slice(0, 5) : '') ||
    Boolean(note.trim()) ||
    Boolean(homeServiceAddress.trim()) ||
    Boolean(homeServiceAccessNote.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date.trim() || !startTime.trim()) {
      setError('Date and start time are required.');
      return;
    }

    if (!hasChanges) {
      setError('Modify at least one field or provide a note to save changes.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await rescheduleBranchBooking({
        bookingId: booking.id,
        date: date.trim(),
        startTime: startTime.trim(),
        note: note.trim() || undefined,
        homeServiceAddress: isHomeService
          ? homeServiceAddress.trim() || undefined
          : undefined,
        homeServiceAccessNote: isHomeService
          ? homeServiceAccessNote.trim() || undefined
          : undefined,
      });

      if (!result.ok) {
        setError(result.error || 'Failed to reschedule booking.');
        setIsSubmitting(false);
        return;
      }

      onBookingRescheduled?.();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Network error occurred while rescheduling booking.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-booking-modal-title"
      data-testid="reschedule-booking-modal"
    >
      <div className="modal-container-card" style={{ maxWidth: 520 }}>
        <div className="modal-header-row">
          <div>
            <h2
              id="reschedule-booking-modal-title"
              className="modal-title-text"
            >
              Reschedule or Adjust Booking
            </h2>
            <p className="modal-subtitle-text">
              Adjust the scheduled date, time, address, or operational notes.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close reschedule dialog"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-content space-y-4">
            {/* Current Schedule Summary */}
            <div className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-warm)] p-3 text-xs space-y-1.5">
              <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                <span className="text-[var(--cs-text-muted)] font-medium">
                  Customer:
                </span>
                <span className="font-semibold text-[var(--cs-text)] truncate">
                  {booking.customer?.full_name || 'Customer'}
                </span>
              </div>
              <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                <span className="text-[var(--cs-text-muted)] font-medium">
                  Service:
                </span>
                <span className="text-[var(--cs-text)] truncate">
                  {booking.service?.name || 'Service'}
                  {booking.service?.duration_minutes
                    ? ` (${booking.service.duration_minutes}m)`
                    : ''}
                </span>
              </div>
              <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                <span className="text-[var(--cs-text-muted)] font-medium">
                  Current Schedule:
                </span>
                <span className="text-[var(--cs-text)]">
                  {formatBookingDate(booking.booking_date)} at{' '}
                  {formatTimeDisplay(booking.start_time)}
                </span>
              </div>
              <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                <span className="text-[var(--cs-text-muted)] font-medium">
                  Location:
                </span>
                <span className="text-[var(--cs-text)] truncate">
                  {booking.resource?.name ||
                    (isHomeService ? 'Home Service' : 'Room unassigned')}
                </span>
              </div>
            </div>

            {/* Date and Time Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="reschedule-date"
                  className="block text-xs font-semibold text-[var(--cs-text)]"
                >
                  New Date{' '}
                  <span className="text-red-700" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-9 rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] px-2.5 text-xs text-[var(--cs-text)] outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="reschedule-time"
                  className="block text-xs font-semibold text-[var(--cs-text)]"
                >
                  New Start Time{' '}
                  <span className="text-red-700" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="reschedule-time"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-9 rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] px-2.5 text-xs text-[var(--cs-text)] outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            {/* Home Service Delivery Details */}
            {isHomeService && (
              <div className="space-y-3 pt-1 border-t border-[var(--cs-border)]">
                <div className="space-y-1">
                  <label
                    htmlFor="reschedule-address"
                    className="block text-xs font-semibold text-[var(--cs-text)]"
                  >
                    Home Service Address
                  </label>
                  <textarea
                    id="reschedule-address"
                    rows={2}
                    value={homeServiceAddress}
                    onChange={(e) => setHomeServiceAddress(e.target.value)}
                    placeholder="Complete address (unit, building, street, barangay)"
                    maxLength={1000}
                    className="w-full rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] p-2 text-xs text-[var(--cs-text)] outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="reschedule-access-note"
                    className="block text-xs font-semibold text-[var(--cs-text)]"
                  >
                    Access Note / Landmark
                  </label>
                  <textarea
                    id="reschedule-access-note"
                    rows={2}
                    value={homeServiceAccessNote}
                    onChange={(e) => setHomeServiceAccessNote(e.target.value)}
                    placeholder="Landmarks, gate codes, parking instructions"
                    maxLength={500}
                    className="w-full rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] p-2 text-xs text-[var(--cs-text)] outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>
            )}

            {/* Internal CRM Note */}
            <div className="space-y-1">
              <label
                htmlFor="reschedule-note"
                className="block text-xs font-semibold text-[var(--cs-text)]"
              >
                CRM Reason / Internal Note{' '}
                <span className="font-normal text-[var(--cs-text-muted)]">
                  (optional)
                </span>
              </label>
              <textarea
                id="reschedule-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for reschedule (e.g. customer requested earlier time)"
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
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-md bg-[var(--color-accent,#0f766e)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm"
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? 'Saving…' : 'Save Booking Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RescheduleBookingModal: React.FC<RescheduleBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  onBookingRescheduled,
}) => {
  if (!isOpen || !booking) return null;

  return (
    <RescheduleBookingModalDialog
      onClose={onClose}
      booking={booking}
      onBookingRescheduled={onBookingRescheduled}
    />
  );
};
