import React, { useMemo } from 'react';
import { AlertTriangle, CalendarOff } from 'lucide-react';
import { formatScheduleTime } from '../../lib/schedule-view-utils';
import {
  getScheduleStaffStateLabel,
  matchesScheduleRole,
  matchesScheduleState,
  type ScheduleRoleGroup,
  type ScheduleStaffState,
} from '../../lib/schedule-role-groups';
import type {
  DailyScheduleResponse,
  ScheduleAvailabilityItem,
  ScheduleBooking,
  ScheduleStaffRow,
  ScheduleWeekDay,
} from '../../types/schedule';

interface ScheduleTimelineProps {
  day: DailyScheduleResponse;
  availabilityByStaffId: Map<string, ScheduleAvailabilityItem>;
  selectedStaffId: string | null;
  onSelectStaff: (staffId: string) => void;
  roleGroup: ScheduleRoleGroup;
  staffState: ScheduleStaffState;
  roomFilter: string;
  conflictsOnly: boolean;
  searchQuery: string;
}

function toMinutes(value: string | null | undefined): number | null {
  if (!value) return null;

  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function durationMinutes(start: string, end: string): number {
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);

  if (startMinutes === null || endMinutes === null) return 0;

  return Math.max(0, endMinutes - startMinutes);
}

function getBounds(rows: ScheduleStaffRow[]): {
  start: number;
  end: number;
} {
  const values: number[] = [];

  for (const row of rows) {
    for (const window of row.schedule_windows) {
      const start = toMinutes(window.startTime);
      const end = toMinutes(window.endTime);
      if (start !== null) values.push(start);
      if (end !== null) values.push(end);
    }

    for (const booking of row.bookings) {
      const start = toMinutes(booking.start_time);
      const end = toMinutes(booking.end_time);
      if (start !== null) values.push(start);
      if (end !== null) values.push(end);
    }

    for (const block of row.blocks) {
      const start = toMinutes(block.start_time);
      const end = toMinutes(block.end_time);
      if (start !== null) values.push(start);
      if (end !== null) values.push(end);
    }
  }

  if (values.length === 0) {
    return { start: 8 * 60, end: 20 * 60 };
  }

  const min = Math.max(0, Math.floor(Math.min(...values) / 60) * 60);
  const max = Math.min(24 * 60, Math.ceil(Math.max(...values) / 60) * 60);

  if (max - min < 6 * 60) {
    return {
      start: Math.max(0, min - 60),
      end: Math.min(24 * 60, Math.max(max + 60, min + 6 * 60)),
    };
  }

  return { start: min, end: max };
}

function getPosition(
  start: string,
  end: string,
  bounds: { start: number; end: number },
): React.CSSProperties {
  const startMinutes = toMinutes(start) ?? bounds.start;
  const endMinutes = toMinutes(end) ?? startMinutes + 30;
  const span = Math.max(1, bounds.end - bounds.start);

  const left =
    ((Math.max(bounds.start, startMinutes) - bounds.start) / span) * 100;
  const width = (Math.max(15, endMinutes - startMinutes) / span) * 100;

  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.min(100 - Math.max(0, left), Math.max(1.5, width))}%`,
  };
}

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'ST'
  );
}

function displayStaffType(item: ScheduleAvailabilityItem | undefined): string {
  const raw = item?.staff.staff_type || item?.staff.system_role || 'Staff';

  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function bookingAccessibleLabel(
  booking: ScheduleBooking,
  staffName: string,
): string {
  return [
    booking.service,
    booking.customer,
    staffName,
    `${formatScheduleTime(booking.start_time)} to ${formatScheduleTime(
      booking.end_time,
    )}`,
    booking.resource_name ? `at ${booking.resource_name}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  day,
  availabilityByStaffId,
  selectedStaffId,
  onSelectStaff,
  roleGroup,
  staffState,
  roomFilter,
  conflictsOnly,
  searchQuery,
}) => {
  const rows = useMemo(() => {
    return day.staffRows.filter((row) => {
      if (!matchesScheduleRole(row, availabilityByStaffId, roleGroup)) {
        return false;
      }

      if (!matchesScheduleState(row, staffState)) {
        return false;
      }
      const query = searchQuery.trim().toLowerCase();

      if (query) {
        const staffMatches = row.staff_name.toLowerCase().includes(query);

        const appointmentMatches = row.bookings.some(
          (booking) =>
            booking.customer.toLowerCase().includes(query) ||
            booking.service.toLowerCase().includes(query) ||
            (booking.resource_name ?? '').toLowerCase().includes(query),
        );

        if (!staffMatches && !appointmentMatches) {
          return false;
        }
      }

      if (
        roomFilter !== 'all' &&
        !row.bookings.some((booking) => booking.resource_id === roomFilter)
      ) {
        return false;
      }

      if (conflictsOnly && !row.schedule_conflict_code) {
        return false;
      }

      return true;
    });
  }, [
    availabilityByStaffId,
    conflictsOnly,
    searchQuery,
    day.staffRows,
    roleGroup,
    roomFilter,
    staffState,
  ]);

  const bounds = useMemo(() => getBounds(rows), [rows]);

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let value = bounds.start; value <= bounds.end; value += 60) {
      marks.push(value);
    }
    return marks;
  }, [bounds]);

  const today = new Date();
  const todayDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const currentLineVisible =
    day.date === todayDate &&
    nowMinutes >= bounds.start &&
    nowMinutes <= bounds.end;

  const currentLeft =
    ((nowMinutes - bounds.start) / Math.max(1, bounds.end - bounds.start)) *
    100;

  if (rows.length === 0) {
    return (
      <div className="schedule-empty-body" data-testid="schedule-empty-body">
        <CalendarOff size={26} aria-hidden="true" />
        <strong>No schedule rows match this view</strong>
        <span>
          Change the filters or choose another date to view branch schedule
          activity.
        </span>
      </div>
    );
  }

  return (
    <div
      className="schedule-board"
      role="region"
      aria-label={`Staff schedule for ${day.date}`}
      data-testid="schedule-day-board"
    >
      <div className="schedule-board-scroll">
        <div className="schedule-board-inner">
          <div className="schedule-time-header">
            <div className="schedule-staff-header">
              <strong>Staff</strong>
              <span>{rows.length} in view</span>
            </div>

            <div className="schedule-time-axis">
              {hourMarks.map((mark) => {
                const left =
                  ((mark - bounds.start) /
                    Math.max(1, bounds.end - bounds.start)) *
                  100;

                return (
                  <div
                    key={mark}
                    className="schedule-hour-label"
                    style={{ left: `${left}%` }}
                  >
                    {formatScheduleTime(
                      `${String(Math.floor(mark / 60)).padStart(2, '0')}:00`,
                    ).replace(':00', '')}
                  </div>
                );
              })}
            </div>
          </div>

          {rows.map((row) => {
            const availability = availabilityByStaffId.get(row.staff_id);
            const selected = row.staff_id === selectedStaffId;

            return (
              <div
                key={row.staff_id}
                className={`schedule-row ${selected ? 'selected' : ''}`}
                data-testid={`schedule-row-${row.staff_id}`}
              >
                <button
                  type="button"
                  className="schedule-staff-cell"
                  onClick={() => onSelectStaff(row.staff_id)}
                  aria-pressed={selected}
                >
                  <span className="schedule-staff-avatar" aria-hidden="true">
                    {getInitials(row.staff_name)}
                  </span>

                  <span className="schedule-staff-meta">
                    <strong>{row.staff_name}</strong>
                    <span>{displayStaffType(availability)}</span>

                    <span
                      className={`schedule-attendance-state state-${
                        row.attendance_presence?.state || 'unknown'
                      }`}
                    >
                      {getScheduleStaffStateLabel(row)}
                    </span>
                  </span>

                  {row.schedule_conflict_code && (
                    <AlertTriangle
                      size={15}
                      className="schedule-conflict-icon"
                      aria-label="Schedule conflict"
                    />
                  )}
                </button>

                <div className="schedule-lane">
                  {hourMarks.map((mark) => {
                    const left =
                      ((mark - bounds.start) /
                        Math.max(1, bounds.end - bounds.start)) *
                      100;

                    return (
                      <span
                        key={mark}
                        className="schedule-hour-line"
                        style={{ left: `${left}%` }}
                        aria-hidden="true"
                      />
                    );
                  })}

                  {row.schedule_windows.map((window, index) => (
                    <span
                      key={`${row.staff_id}-window-${index}`}
                      className="schedule-window-band"
                      style={getPosition(
                        window.startTime,
                        window.endTime,
                        bounds,
                      )}
                      title={`Scheduled ${formatScheduleTime(
                        window.startTime,
                      )} – ${formatScheduleTime(window.endTime)}`}
                    />
                  ))}

                  {row.schedule_is_day_off && (
                    <div className="schedule-day-off-band">
                      Day off
                      {row.current_override?.reason
                        ? ` · ${row.current_override.reason}`
                        : ''}
                    </div>
                  )}

                  {row.blocks.map((block) => (
                    <div
                      key={block.id}
                      className="schedule-block-card"
                      style={getPosition(
                        block.start_time,
                        block.end_time,
                        bounds,
                      )}
                      title={`${block.reason || 'Blocked'} · ${formatScheduleTime(
                        block.start_time,
                      )} – ${formatScheduleTime(block.end_time)}`}
                    >
                      <strong>{block.reason || 'Blocked'}</strong>
                      <span>{formatScheduleTime(block.start_time)}</span>
                    </div>
                  ))}

                  {row.bookings.map((booking) => (
                    <button
                      key={booking.id}
                      type="button"
                      className={`schedule-booking-card status-${booking.status}`}
                      style={getPosition(
                        booking.start_time,
                        booking.end_time,
                        bounds,
                      )}
                      onClick={() => onSelectStaff(row.staff_id)}
                      aria-label={bookingAccessibleLabel(
                        booking,
                        row.staff_name,
                      )}
                    >
                      <strong>{formatScheduleTime(booking.start_time)}</strong>
                      <span>{booking.service}</span>
                      <small>
                        {booking.resource_name ||
                          `${durationMinutes(
                            booking.start_time,
                            booking.end_time,
                          )} min`}
                      </small>
                    </button>
                  ))}

                  {row.schedule_conflict_code && (
                    <div className="schedule-conflict-note">
                      <AlertTriangle size={13} aria-hidden="true" />
                      <span>
                        {row.schedule_conflict_reason ||
                          row.schedule_conflict_code}
                      </span>
                    </div>
                  )}

                  {currentLineVisible && (
                    <span
                      className="schedule-current-time-line"
                      style={{ left: `${currentLeft}%` }}
                      aria-label={`Current time ${formatScheduleTime(
                        `${String(today.getHours()).padStart(2, '0')}:${String(
                          today.getMinutes(),
                        ).padStart(2, '0')}`,
                      )}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ScheduleWeekOverviewProps {
  days: ScheduleWeekDay[];
  selectedStaffId: string | null;
  onSelectStaff: (staffId: string) => void;
  searchQuery: string;
}

export const ScheduleWeekOverview: React.FC<ScheduleWeekOverviewProps> = ({
  days,
  selectedStaffId,
  onSelectStaff,
  searchQuery,
}) => {
  const staff = useMemo(() => {
    const map = new Map<string, string>();
    const normalizedQuery = searchQuery.trim().toLowerCase();

    for (const day of days) {
      for (const row of day.data.staffRows) {
        if (normalizedQuery) {
          const staffMatches = row.staff_name
            .toLowerCase()
            .includes(normalizedQuery);

          const appointmentMatches = row.bookings.some(
            (booking) =>
              booking.customer.toLowerCase().includes(normalizedQuery) ||
              booking.service.toLowerCase().includes(normalizedQuery) ||
              (booking.resource_name ?? '')
                .toLowerCase()
                .includes(normalizedQuery),
          );

          if (!staffMatches && !appointmentMatches) {
            continue;
          }
        }

        map.set(row.staff_id, row.staff_name);
      }
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [days, searchQuery]);

  if (staff.length === 0) {
    return (
      <div className="schedule-empty-body">
        <CalendarOff size={26} aria-hidden="true" />
        <strong>No scheduled staff this week</strong>
        <span>
          The authoritative Schedule API returned no operational rows.
        </span>
      </div>
    );
  }

  return (
    <div
      className="schedule-week-board"
      role="region"
      aria-label="Weekly schedule overview"
      data-testid="schedule-week-board"
    >
      <div className="schedule-week-scroll">
        <div
          className="schedule-week-grid"
          style={{
            gridTemplateColumns: `190px repeat(${days.length}, minmax(128px, 1fr))`,
          }}
        >
          <div className="schedule-week-corner">Staff</div>

          {days.map((day) => (
            <div key={day.date} className="schedule-week-day-header">
              <strong>
                {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                  undefined,
                  {
                    weekday: 'short',
                  },
                )}
              </strong>
              <span>
                {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                  undefined,
                  {
                    month: 'short',
                    day: 'numeric',
                  },
                )}
              </span>
            </div>
          ))}

          {staff.map((member) => (
            <React.Fragment key={member.id}>
              <button
                type="button"
                className={`schedule-week-staff ${
                  selectedStaffId === member.id ? 'selected' : ''
                }`}
                onClick={() => onSelectStaff(member.id)}
              >
                {member.name}
              </button>

              {days.map((day) => {
                const row = day.data.staffRows.find(
                  (candidate) => candidate.staff_id === member.id,
                );

                if (!row) {
                  return (
                    <div
                      key={`${member.id}-${day.date}`}
                      className="schedule-week-cell empty"
                    >
                      —
                    </div>
                  );
                }

                return (
                  <button
                    key={`${member.id}-${day.date}`}
                    type="button"
                    className={`schedule-week-cell ${
                      row.schedule_conflict_code ? 'conflict' : ''
                    }`}
                    onClick={() => onSelectStaff(member.id)}
                    aria-label={`${member.name}, ${day.date}, ${
                      row.bookings.length
                    } bookings`}
                  >
                    {row.schedule_is_day_off ? (
                      <span className="schedule-week-off">Day off</span>
                    ) : (
                      <>
                        <strong>{row.bookings.length}</strong>
                        <span>
                          {row.bookings.length === 1 ? 'booking' : 'bookings'}
                        </span>
                        {row.work_start && row.work_end && (
                          <small>
                            {formatScheduleTime(row.work_start)}–
                            {formatScheduleTime(row.work_end)}
                          </small>
                        )}
                      </>
                    )}

                    {row.schedule_conflict_code && (
                      <AlertTriangle size={13} aria-label="Schedule conflict" />
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
