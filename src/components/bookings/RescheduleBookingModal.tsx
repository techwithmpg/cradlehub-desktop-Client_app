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

function readHomeServiceAddress(booking: Booking | null): string {
  const meta = booking?.metadata as Record<string, unknown> | null | undefined;
  const canonical = meta?.home_service_address as
    Record<string, unknown> | null | undefined;
  if (canonical && typeof canonical.full_address === 'string') {
    return canonical.full_address;
  }
  // Bounded compatibility fallback for existing Desktop test payloads
  const legacy = meta?.home_service as
    Record<string, unknown> | null | undefined;
  if (legacy && typeof legacy.address === 'string') {
    return legacy.address;
  }
  return '';
}

function readHomeServiceAccessNote(booking: Booking | null): string {
  const meta = booking?.metadata as Record<string, unknown> | null | undefined;
  const canonical = meta?.home_service_address as
    Record<string, unknown> | null | undefined;
  if (canonical && typeof canonical.access_note === 'string') {
    return canonical.access_note;
  }
  // Bounded compatibility fallback for existing Desktop test payloads
  const legacy = meta?.home_service as
    Record<string, unknown> | null | undefined;
  if (legacy) {
    if (typeof legacy.access_notes === 'string') return legacy.access_notes;
    if (typeof legacy.access_note === 'string') return legacy.access_note;
  }
  return '';
}

function normalizeTimeForCompare(time?: string | null): string {
  if (!time) return '';
  return time.slice(0, 5);
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

  const initialAddress = readHomeServiceAddress(booking);
  const initialAccessNote = readHomeServiceAccessNote(booking);

  const [date, setDate] = useState(booking.booking_date || '');
  const [startTime, setStartTime] = useState(
    booking.start_time ? booking.start_time.slice(0, 5) : '',
  );
  const [homeServiceAddress, setHomeServiceAddress] = useState(initialAddress);
  const [homeServiceAccessNote, setHomeServiceAccessNote] =
    useState(initialAccessNote);
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

  const dateChanged = date !== (booking.booking_date || '');
  const timeChanged =
    normalizeTimeForCompare(startTime) !==
    normalizeTimeForCompare(booking.start_time);
  const addressChanged =
    isHomeService &&
    (homeServiceAddress.trim() !== initialAddress.trim() ||
      homeServiceAccessNote.trim() !== initialAccessNote.trim());

  // A free-form CRM note alone is NOT an operational change; only date, time, or address changes qualify.
  const changed = dateChanged || timeChanged || addressChanged;

  // Hosted behavior requires CRM reason for time and address changes.
  const requiresReason = timeChanged || addressChanged;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date.trim() || !startTime.trim()) {
      setError('Date and start time are required.');
      return;
    }

    if (!changed) {
      setError('Choose a new date, time, or address before saving.');
      return;
    }

    if (requiresReason && !note.trim()) {
      setError('Add a CRM reason before saving this change.');
      return;
    }

    if (isHomeService && addressChanged && !homeServiceAddress.trim()) {
      setError('Enter the updated home-service address.');
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
            {/* Current Schedule Summary with Full Operational Context */}
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
                  Mode:
                </span>
                <span className="text-[var(--cs-text)]">
                  {isHomeService ? 'Home Service' : 'In-spa'}
                </span>
              </div>
              <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                <span className="text-[var(--cs-text-muted)] font-medium">
                  Therapist:
                </span>
                <span className="text-[var(--cs-text)] truncate font-medium">
                  {booking.staff?.full_name || 'Unassigned'}
                </span>
              </div>
              <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                <span className="text-[var(--cs-text-muted)] font-medium">
                  {isHomeService ? 'Current Address:' : 'Room / Resource:'}
                </span>
                <span className="text-[var(--cs-text)] truncate">
                  {isHomeService
                    ? initialAddress || 'No address saved'
                    : booking.resource?.name || 'No room assigned'}
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

            {/* Assigned Therapist Block (Authoritative Reassignment Unavailable on Desktop v1) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[var(--cs-text)]">
                Assigned Therapist
              </label>
              <div className="flex items-center justify-between rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface-warm)] px-3 py-2 text-xs">
                <span className="text-[var(--cs-text)] font-medium">
                  {booking.staff?.full_name || 'Unassigned'}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] bg-[var(--cs-surface)] border border-[var(--cs-border)] px-1.5 py-0.5 rounded">
                  Reassignment Unavailable
                </span>
              </div>
              <p className="text-[11px] text-[var(--cs-text-muted)]">
                Therapist reassignment requires an authoritative Desktop backend
                action (Stage 12). Existing therapist assignment remains
                preserved.
              </p>
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
                {requiresReason ? (
                  <span className="text-red-700" aria-hidden="true">
                    *
                  </span>
                ) : (
                  <span className="font-normal text-[var(--cs-text-muted)]">
                    (optional for date-only change)
                  </span>
                )}
              </label>
              <textarea
                id="reschedule-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  requiresReason
                    ? 'Reason for reschedule (required for time/address changes)'
                    : 'Reason for reschedule (e.g. customer requested new date)'
                }
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
              disabled={isSubmitting || !changed}
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
