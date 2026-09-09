import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarClock, Clock3, Trash2, X } from 'lucide-react';
import {
  addDays,
  fetchStaffFullSchedule,
  mutateSchedule,
} from '../../lib/schedule-service';
import type {
  ScheduleAvailabilityItem,
  ScheduleStaffRow,
  StaffFullScheduleResponse,
} from '../../types/schedule';
import { formatScheduleTime } from '../../lib/schedule-view-utils';

export type ScheduleActionKind = 'adjust' | 'block' | 'full' | 'availability';

interface ScheduleActionModalProps {
  isOpen: boolean;
  kind: ScheduleActionKind;
  onClose: () => void;
  branchId: string;
  selectedDate: string;
  staff: ScheduleStaffRow | null;
  availability: ScheduleAvailabilityItem | null;
  onSaved: () => Promise<void> | void;
}

interface ScheduleActionDialogProps extends Omit<
  ScheduleActionModalProps,
  'staff'
> {
  staff: ScheduleStaffRow;
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function toInputTime(
  value: string | null | undefined,
  fallback: string,
): string {
  return value ? value.slice(0, 5) : fallback;
}

function titleFor(kind: ScheduleActionKind): string {
  if (kind === 'adjust') return 'Adjust Schedule';
  if (kind === 'block') return 'Block Time';
  if (kind === 'full') return 'Full Schedule';
  return 'Availability';
}

function subtitleFor(kind: ScheduleActionKind, selectedDate: string): string {
  if (kind === 'adjust') {
    return `Create or update the authoritative day override for ${selectedDate}.`;
  }

  if (kind === 'block') {
    return `Add or remove blocked time for ${selectedDate}.`;
  }

  if (kind === 'full') {
    return 'Review authoritative schedule, overrides, blocks, and bookings.';
  }

  return 'Review the current weekly availability returned by the hosted Schedule API.';
}

export const ScheduleActionModal: React.FC<ScheduleActionModalProps> = (
  props,
) => {
  if (!props.isOpen || !props.staff) return null;

  return (
    <ScheduleActionDialog
      key={`${props.kind}:${props.staff.staff_id}:${props.selectedDate}`}
      {...props}
      staff={props.staff}
    />
  );
};

const ScheduleActionDialog: React.FC<ScheduleActionDialogProps> = ({
  kind,
  onClose,
  branchId,
  selectedDate,
  staff,
  availability,
  onSaved,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDayOff, setIsDayOff] = useState(
    staff.current_override?.is_day_off ?? staff.schedule_is_day_off,
  );

  const [startTime, setStartTime] = useState(
    toInputTime(
      staff.current_override?.start_time ?? staff.work_start,
      '09:00',
    ),
  );

  const [endTime, setEndTime] = useState(
    toInputTime(staff.current_override?.end_time ?? staff.work_end, '17:00'),
  );

  const [overrideReason, setOverrideReason] = useState(
    staff.current_override?.reason ?? '',
  );

  const [blockStart, setBlockStart] = useState('12:00');
  const [blockEnd, setBlockEnd] = useState('13:00');

  const [blockReason, setBlockReason] = useState<
    'break' | 'leave' | 'training' | 'other'
  >('break');

  const fullStart = useMemo(() => addDays(selectedDate, -14), [selectedDate]);

  const fullEnd = useMemo(() => addDays(selectedDate, 14), [selectedDate]);

  const [fullSchedule, setFullSchedule] =
    useState<StaffFullScheduleResponse | null>(null);

  const [fullLoading, setFullLoading] = useState(kind === 'full');

  const [fullError, setFullError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isSubmitting, onClose]);

  useEffect(() => {
    if (kind !== 'full') return;

    let active = true;

    void fetchStaffFullSchedule(staff.staff_id, fullStart, fullEnd)
      .then((result) => {
        if (active) {
          setFullSchedule(result);
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;

        setFullError(
          cause instanceof Error
            ? cause.message
            : 'Unable to load the full schedule.',
        );
      })
      .finally(() => {
        if (active) {
          setFullLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fullEnd, fullStart, kind, staff.staff_id]);

  const runMutation = async (
    action:
      | 'upsert_override'
      | 'delete_override'
      | 'create_blocked_time'
      | 'delete_blocked_time',
    payload: Record<string, unknown>,
  ) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await mutateSchedule(action, payload);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      await onSaved();
      onClose();
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The Schedule change could not be completed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveOverride = async (event: React.FormEvent) => {
    event.preventDefault();

    await runMutation('upsert_override', {
      branchId,
      staffId: staff.staff_id,
      overrideDate: selectedDate,
      isDayOff,
      ...(isDayOff
        ? {}
        : {
            shiftType: 'single',
            startTime,
            endTime,
          }),
      ...(overrideReason.trim() ? { reason: overrideReason.trim() } : {}),
    });
  };

  const deleteOverride = async () => {
    const overrideId = staff.current_override?.id;

    if (!overrideId) return;

    await runMutation('delete_override', {
      branchId,
      staffId: staff.staff_id,
      overrideId,
    });
  };

  const saveBlock = async (event: React.FormEvent) => {
    event.preventDefault();

    await runMutation('create_blocked_time', {
      branchId,
      staffId: staff.staff_id,
      blockDate: selectedDate,
      startTime: blockStart,
      endTime: blockEnd,
      reason: blockReason,
    });
  };

  const deleteBlock = async (blockId: string) => {
    await runMutation('delete_blocked_time', {
      branchId,
      staffId: staff.staff_id,
      blockId,
    });
  };

  const weeklySchedules = useMemo(() => {
    const grouped = new Map<
      number,
      NonNullable<ScheduleAvailabilityItem['schedules']>
    >();

    for (const item of availability?.schedules ?? []) {
      const list = grouped.get(item.day_of_week) ?? [];
      list.push(item);
      grouped.set(item.day_of_week, list);
    }

    return grouped;
  }, [availability]);

  const full = fullSchedule?.data ?? null;

  return (
    <div
      className="new-booking-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-action-title"
      data-testid={`schedule-action-${kind}`}
    >
      <div
        ref={dialogRef}
        className="new-booking-modal-card schedule-action-modal-card"
        tabIndex={-1}
      >
        <header className="new-booking-modal-header">
          <div className="new-booking-header-meta">
            <div className="new-booking-title-row">
              <h2 id="schedule-action-title" className="new-booking-title">
                {titleFor(kind)}
              </h2>

              <span className="new-booking-branch-badge">
                {staff.staff_name}
              </span>
            </div>

            <p className="new-booking-subtitle">
              {subtitleFor(kind, selectedDate)}
            </p>
          </div>

          <button
            type="button"
            className="new-booking-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close Schedule dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="schedule-action-modal-body">
          {error && (
            <div className="schedule-action-error" role="alert">
              <AlertTriangle size={15} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {kind === 'adjust' && (
            <form className="schedule-action-form" onSubmit={saveOverride}>
              <div className="schedule-action-context">
                <CalendarClock size={16} aria-hidden="true" />

                <div>
                  <strong>{selectedDate}</strong>
                  <span>
                    Current:{' '}
                    {staff.schedule_is_day_off
                      ? 'Day off'
                      : staff.work_start && staff.work_end
                        ? `${formatScheduleTime(
                            staff.work_start,
                          )} – ${formatScheduleTime(staff.work_end)}`
                        : 'Not assigned'}
                  </span>
                </div>
              </div>

              <label className="schedule-action-check">
                <input
                  type="checkbox"
                  checked={isDayOff}
                  onChange={(event) => setIsDayOff(event.target.checked)}
                  disabled={isSubmitting}
                />

                <span>Set this date as a day off</span>
              </label>

              {!isDayOff && (
                <div className="schedule-action-two-column">
                  <label className="schedule-action-field">
                    <span>Start time</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </label>

                  <label className="schedule-action-field">
                    <span>End time</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              )}

              <label className="schedule-action-field">
                <span>Reason</span>
                <textarea
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  maxLength={200}
                  rows={3}
                  disabled={isSubmitting}
                  placeholder="Optional reason for this override"
                />
              </label>

              {staff.current_override && (
                <div className="schedule-action-existing">
                  <div>
                    <strong>Existing override</strong>
                    <span>
                      {staff.current_override.is_day_off
                        ? 'Day off'
                        : `${formatScheduleTime(
                            staff.current_override.start_time,
                          )} – ${formatScheduleTime(
                            staff.current_override.end_time,
                          )}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="schedule-action-danger"
                    onClick={() => void deleteOverride()}
                    disabled={isSubmitting}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove override
                  </button>
                </div>
              )}

              <div className="schedule-action-footer">
                <button
                  type="button"
                  className="schedule-action-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="schedule-action-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving…' : 'Save override'}
                </button>
              </div>
            </form>
          )}

          {kind === 'block' && (
            <form className="schedule-action-form" onSubmit={saveBlock}>
              <div className="schedule-action-two-column">
                <label className="schedule-action-field">
                  <span>Start time</span>
                  <input
                    type="time"
                    value={blockStart}
                    onChange={(event) => setBlockStart(event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </label>

                <label className="schedule-action-field">
                  <span>End time</span>
                  <input
                    type="time"
                    value={blockEnd}
                    onChange={(event) => setBlockEnd(event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <label className="schedule-action-field">
                <span>Reason</span>
                <select
                  value={blockReason}
                  onChange={(event) =>
                    setBlockReason(
                      event.target.value as
                        'break' | 'leave' | 'training' | 'other',
                    )
                  }
                  disabled={isSubmitting}
                >
                  <option value="break">Break</option>
                  <option value="leave">Leave</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
              </label>

              {staff.blocks.length > 0 && (
                <section className="schedule-action-list-section">
                  <h3>Existing blocks</h3>

                  <div className="schedule-action-list">
                    {staff.blocks.map((block) => (
                      <div key={block.id} className="schedule-action-list-row">
                        <div>
                          <strong>
                            {formatScheduleTime(block.start_time)} –{' '}
                            {formatScheduleTime(block.end_time)}
                          </strong>
                          <span>{block.reason || 'Blocked'}</span>
                        </div>

                        <button
                          type="button"
                          className="schedule-action-icon-button"
                          onClick={() => void deleteBlock(block.id)}
                          disabled={isSubmitting}
                          aria-label={`Remove blocked time ${formatScheduleTime(
                            block.start_time,
                          )}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="schedule-action-footer">
                <button
                  type="button"
                  className="schedule-action-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="schedule-action-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving…' : 'Add blocked time'}
                </button>
              </div>
            </form>
          )}

          {kind === 'availability' && (
            <div className="schedule-action-read-view">
              <div className="schedule-action-context">
                <Clock3 size={16} aria-hidden="true" />

                <div>
                  <strong>Weekly availability</strong>
                  <span>
                    Current hosted availability for this staff member.
                  </span>
                </div>
              </div>

              {!availability ? (
                <p className="schedule-action-empty">
                  Availability is not currently returned for this staff member.
                </p>
              ) : (
                <>
                  <div className="schedule-weekly-availability">
                    {DAY_NAMES.map((dayName, dayIndex) => {
                      const rows = weeklySchedules.get(dayIndex) ?? [];

                      return (
                        <div key={dayName} className="schedule-weekly-day">
                          <strong>{dayName}</strong>

                          {rows.length === 0 ? (
                            <span>Not assigned</span>
                          ) : (
                            <div>
                              {rows
                                .sort(
                                  (a, b) =>
                                    (a.window_order ?? 0) -
                                    (b.window_order ?? 0),
                                )
                                .map((row) => (
                                  <span key={row.id}>
                                    {formatScheduleTime(row.start_time)} –{' '}
                                    {formatScheduleTime(row.end_time)}
                                    {row.shift_type !== 'single'
                                      ? ` · ${row.shift_type}`
                                      : ''}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {availability.overrides.length > 0 && (
                    <section className="schedule-action-list-section">
                      <h3>Overrides</h3>

                      <div className="schedule-action-list">
                        {availability.overrides.map((override) => (
                          <div
                            key={override.id}
                            className="schedule-action-list-row"
                          >
                            <div>
                              <strong>{override.override_date}</strong>
                              <span>
                                {override.is_day_off
                                  ? 'Day off'
                                  : `${formatScheduleTime(
                                      override.start_time,
                                    )} – ${formatScheduleTime(
                                      override.end_time,
                                    )}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}

          {kind === 'full' && (
            <div className="schedule-action-read-view">
              {fullLoading ? (
                <div className="schedule-action-loading">
                  Loading full schedule…
                </div>
              ) : fullError ? (
                <div className="schedule-action-error" role="alert">
                  <AlertTriangle size={15} aria-hidden="true" />
                  <span>{fullError}</span>
                </div>
              ) : !full ? (
                <p className="schedule-action-empty">
                  No full schedule data is currently available.
                </p>
              ) : (
                <>
                  <div className="schedule-action-context">
                    <CalendarClock size={16} aria-hidden="true" />

                    <div>
                      <strong>
                        {fullStart} → {fullEnd}
                      </strong>
                      <span>{full.staff.branch_name ?? 'Current branch'}</span>
                    </div>
                  </div>

                  <div className="schedule-action-stat-grid">
                    <div>
                      <strong>{full.schedules.length}</strong>
                      <span>Weekly windows</span>
                    </div>

                    <div>
                      <strong>{full.custom_overrides.length}</strong>
                      <span>Overrides</span>
                    </div>

                    <div>
                      <strong>{full.blocked_times.length}</strong>
                      <span>Blocked periods</span>
                    </div>

                    <div>
                      <strong>{full.bookings.length}</strong>
                      <span>Bookings</span>
                    </div>
                  </div>
                  <section className="schedule-action-list-section">
                    <h3>Weekly schedule</h3>

                    {full.schedules.length === 0 ? (
                      <p className="schedule-action-empty">
                        No weekly schedule windows returned for this staff
                        member.
                      </p>
                    ) : (
                      <div className="schedule-action-list">
                        {[...full.schedules]
                          .sort(
                            (a, b) =>
                              a.day_of_week - b.day_of_week ||
                              (a.window_order ?? 0) - (b.window_order ?? 0) ||
                              a.start_time.localeCompare(b.start_time),
                          )
                          .map((schedule) => (
                            <div
                              key={schedule.id}
                              className="schedule-action-list-row"
                            >
                              <div>
                                <strong>
                                  {DAY_NAMES[schedule.day_of_week] ??
                                    `Day ${schedule.day_of_week}`}{' '}
                                  · {formatScheduleTime(schedule.start_time)} –{' '}
                                  {formatScheduleTime(schedule.end_time)}
                                </strong>

                                <span>
                                  {schedule.shift_type === 'opening'
                                    ? 'Opening shift'
                                    : schedule.shift_type === 'closing'
                                      ? 'Closing shift'
                                      : 'Single shift'}
                                  {!schedule.is_active ? ' · Inactive' : ''}
                                  {schedule.ends_next_day
                                    ? ' · Ends next day'
                                    : ''}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </section>

                  <section className="schedule-action-list-section">
                    <h3>Overrides</h3>

                    {full.custom_overrides.length === 0 ? (
                      <p className="schedule-action-empty">
                        No schedule overrides returned for this range.
                      </p>
                    ) : (
                      <div className="schedule-action-list">
                        {[...full.custom_overrides]
                          .sort(
                            (a, b) =>
                              a.date.localeCompare(b.date) ||
                              (a.start_time ?? '').localeCompare(
                                b.start_time ?? '',
                              ),
                          )
                          .map((override) => (
                            <div
                              key={override.id}
                              className="schedule-action-list-row"
                            >
                              <div>
                                <strong>{override.date}</strong>

                                <span>
                                  {override.shift_type === 'day_off'
                                    ? 'Day off'
                                    : `${formatScheduleTime(
                                        override.start_time,
                                      )} – ${formatScheduleTime(
                                        override.end_time,
                                      )}`}
                                </span>

                                {override.reason && (
                                  <span>{override.reason}</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </section>

                  <section className="schedule-action-list-section">
                    <h3>Blocked time</h3>

                    {full.blocked_times.length === 0 ? (
                      <p className="schedule-action-empty">
                        No blocked periods returned for this range.
                      </p>
                    ) : (
                      <div className="schedule-action-list">
                        {[...full.blocked_times]
                          .sort(
                            (a, b) =>
                              a.date.localeCompare(b.date) ||
                              a.start_time.localeCompare(b.start_time),
                          )
                          .map((block) => (
                            <div
                              key={block.id}
                              className="schedule-action-list-row"
                            >
                              <div>
                                <strong>
                                  {block.date} ·{' '}
                                  {formatScheduleTime(block.start_time)} –{' '}
                                  {formatScheduleTime(block.end_time)}
                                </strong>

                                <span>{block.reason || 'Blocked'}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </section>

                  <section className="schedule-action-list-section">
                    <h3>Bookings</h3>

                    {full.bookings.length === 0 ? (
                      <p className="schedule-action-empty">
                        No bookings returned for this range.
                      </p>
                    ) : (
                      <div className="schedule-action-list">
                        {full.bookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="schedule-action-list-row"
                          >
                            <div>
                              <strong>
                                {booking.date} ·{' '}
                                {formatScheduleTime(booking.start_time)}
                              </strong>
                              <span>
                                {booking.service_name}
                                {booking.customer_name
                                  ? ` · ${booking.customer_name}`
                                  : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
