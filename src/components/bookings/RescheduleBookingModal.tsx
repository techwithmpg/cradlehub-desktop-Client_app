import React, { useEffect, useRef, useState } from 'react';
import type {
  Booking,
  BookingReassignmentReason,
  QuickBookingOptionStaff,
} from '../../types/bookings';
import { BOOKING_REASSIGNMENT_REASONS } from '../../types/bookings';
import { useModalFocus } from '../../lib/use-modal-focus';
import {
  fetchBranchBookingOptions,
  rescheduleBranchBooking,
} from '../../lib/bookings-service';

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

  const busy = useRef(false);
  const [therapistId, setTherapistId] = useState(booking.staff_id);
  const [overrideReason, setOverrideReason] = useState<
    BookingReassignmentReason | ''
  >('');
  const [candidates, setCandidates] = useState<QuickBookingOptionStaff[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const dialogRef = useModalFocus(true, isSubmitting, onClose);
  useEffect(() => {
    let active = true;
    void fetchBranchBookingOptions(booking.branch_id)
      .then((options) => {
        if (active) {
          setCandidates(options.staff);
          setCandidatesLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setCandidatesError(
            'Therapist choices could not be loaded. You can still reschedule with the current therapist.',
          );
          setCandidatesLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [booking.branch_id]);

  const dateChanged = date !== (booking.booking_date || '');
  const timeChanged =
    normalizeTimeForCompare(startTime) !==
    normalizeTimeForCompare(booking.start_time);
  const addressChanged =
    isHomeService &&
    (homeServiceAddress.trim() !== initialAddress.trim() ||
      homeServiceAccessNote.trim() !== initialAccessNote.trim());

  const therapistChanged = therapistId !== booking.staff_id;
  const changed =
    dateChanged || timeChanged || addressChanged || therapistChanged;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    if (!date.trim() || !startTime.trim()) {
      setError('Date and start time are required.');
      return;
    }

    if (!changed) {
      setError('Choose a new date, time, address, or therapist before saving.');
      return;
    }

    if (
      therapistChanged &&
      (candidatesLoading ||
        candidatesError ||
        !candidates.some((candidate) => candidate.id === therapistId))
    ) {
      setError(
        'Choose an available branch therapist after choices have loaded.',
      );
      return;
    }
    if (therapistChanged && !overrideReason) {
      setError('Choose a reassignment reason before saving.');
      return;
    }

    if (isHomeService && addressChanged && !homeServiceAddress.trim()) {
      setError('Enter the updated home-service address.');
      return;
    }

    busy.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await rescheduleBranchBooking({
        bookingId: booking.id,
        therapistId: therapistChanged ? therapistId : undefined,
        overrideReason: therapistChanged
          ? overrideReason || undefined
          : undefined,
        date: date.trim(),
        startTime: startTime.trim(),
        note: note.trim() || undefined,
        homeServiceAddress: isHomeService
          ? homeServiceAddress.trim() || undefined
          : undefined,
        homeServiceAccessNote: isHomeService
          ? homeServiceAccessNote.trim()
          : undefined,
      });

      if (!result.ok) {
        setError(result.error || 'Failed to reschedule booking.');
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
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      aria-busy={isSubmitting}
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
              Adjust the scheduled date, time, address, or assigned therapist.
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

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-9 rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] px-2.5 text-xs text-[var(--cs-text)] outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="reschedule-therapist"
                className="block text-xs font-semibold text-[var(--cs-text)]"
              >
                Assigned Therapist
              </label>
              <select
                id="reschedule-therapist"
                className="form-input-control text-xs w-full"
                value={therapistId}
                disabled={
                  isSubmitting || candidatesLoading || Boolean(candidatesError)
                }
                onChange={(event) => {
                  setTherapistId(event.target.value);
                  setOverrideReason('');
                }}
              >
                <option value={booking.staff_id}>
                  Keep current therapist —{' '}
                  {booking.staff?.full_name || 'Current assignment'}
                </option>
                {candidates
                  .filter((candidate) => candidate.id !== booking.staff_id)
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
              </select>
              {candidatesLoading && (
                <p role="status" className="text-xs">
                  Loading therapist choices…
                </p>
              )}
              {candidatesError && (
                <p role="alert" className="text-xs">
                  {candidatesError}
                </p>
              )}
              {!candidatesLoading &&
                !candidatesError &&
                candidates.filter(
                  (candidate) => candidate.id !== booking.staff_id,
                ).length === 0 && (
                  <p className="text-xs">
                    No other active branch providers are available to select.
                  </p>
                )}
              {therapistChanged && (
                <div>
                  <label htmlFor="reschedule-reason" className="text-xs">
                    Reassignment Reason
                  </label>
                  <select
                    id="reschedule-reason"
                    className="form-input-control text-xs w-full"
                    value={overrideReason}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setOverrideReason(
                        event.target.value as BookingReassignmentReason | '',
                      )
                    }
                  >
                    <option value="">Choose a reason</option>
                    {BOOKING_REASSIGNMENT_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                CRM Reason / Internal Note (optional)
              </label>
              <textarea
                id="reschedule-note"
                disabled={isSubmitting}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note about this change"
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
      key={booking.id}
      onClose={onClose}
      booking={booking}
      onBookingRescheduled={onBookingRescheduled}
    />
  );
};
