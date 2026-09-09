import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Clock3,
  DoorOpen,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { ModuleInspectorEmptyState, ModuleInspectorFrame } from '../workspace';
import type {
  DailyScheduleResponse,
  ScheduleAvailabilityItem,
  ScheduleBooking,
  ScheduleStaffRow,
} from '../../types/schedule';
import { formatScheduleTime } from '../../lib/schedule-view-utils';

interface ScheduleInspectorProps {
  day: DailyScheduleResponse;
  selectedStaff: ScheduleStaffRow | null;
  selectedAvailability: ScheduleAvailabilityItem | null;
  selectedDate: string;
  onAdjustSchedule: () => void;
  onBlockTime: () => void;
  onFullSchedule: () => void;
  onAvailability: () => void;
}

function minutes(value: string): number {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);

  return hour * 60 + minute;
}

function bookingDuration(booking: ScheduleBooking): number {
  return Math.max(0, minutes(booking.end_time) - minutes(booking.start_time));
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'ST'
  );
}

function pretty(value: string | null | undefined): string {
  if (!value) return 'Staff';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export const ScheduleInspector: React.FC<ScheduleInspectorProps> = ({
  day,
  selectedStaff,
  selectedAvailability,
  selectedDate,
  onAdjustSchedule,
  onBlockTime,
  onFullSchedule,
  onAvailability,
}) => {
  const [tab, setTab] = useState<'staff' | 'rooms'>('staff');

  const now = new Date();

  const todayString = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  const nextBooking = useMemo(() => {
    if (!selectedStaff || selectedStaff.bookings.length === 0) {
      return null;
    }

    const sorted = [...selectedStaff.bookings].sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );

    if (selectedDate !== todayString) {
      return sorted[0] ?? null;
    }

    return (
      sorted.find(
        (booking) => minutes(booking.start_time) >= currentTimeMinutes,
      ) ?? null
    );
  }, [currentTimeMinutes, selectedDate, selectedStaff, todayString]);

  const rooms = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        type: string | null;
        capacity: number | null;
        bookings: ScheduleBooking[];
      }
    >();

    for (const row of day.staffRows) {
      for (const booking of row.bookings) {
        if (!booking.resource_id || !booking.resource_name) {
          continue;
        }

        const current = map.get(booking.resource_id);

        if (current) {
          current.bookings.push(booking);
          continue;
        }

        map.set(booking.resource_id, {
          id: booking.resource_id,
          name: booking.resource_name,
          type: booking.resource_type ?? null,
          capacity: booking.resource_capacity ?? null,
          bookings: [booking],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [day.staffRows]);

  const bookedMinutes =
    selectedStaff?.bookings.reduce(
      (total, booking) => total + bookingDuration(booking),
      0,
    ) ?? 0;

  return (
    <ModuleInspectorFrame
      className="schedule-inspector"
      ariaLabel="Schedule Inspector"
      testId="schedule-inspector"
    >
      <div className="schedule-inspector-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'staff'}
          className={tab === 'staff' ? 'active' : ''}
          onClick={() => setTab('staff')}
        >
          Staff
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'rooms'}
          className={tab === 'rooms' ? 'active' : ''}
          onClick={() => setTab('rooms')}
        >
          Rooms
        </button>
      </div>

      {tab === 'rooms' ? (
        rooms.length === 0 ? (
          <ModuleInspectorEmptyState
            title="No room assignments"
            description="No booking on the selected date returned an assigned resource."
            icon={<DoorOpen size={26} />}
            testId="schedule-rooms-empty"
          />
        ) : (
          <div className="schedule-room-list">
            {rooms.map((room) => (
              <section key={room.id} className="schedule-room-card">
                <div className="schedule-room-heading">
                  <DoorOpen size={16} aria-hidden="true" />

                  <div>
                    <strong>{room.name}</strong>

                    <span>
                      {pretty(room.type)}
                      {room.capacity ? ` · Capacity ${room.capacity}` : ''}
                    </span>
                  </div>
                </div>

                <div className="schedule-room-bookings">
                  {room.bookings
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((booking) => (
                      <div key={booking.id}>
                        <strong>
                          {formatScheduleTime(booking.start_time)}
                        </strong>
                        <span>{booking.service}</span>
                      </div>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )
      ) : !selectedStaff ? (
        <ModuleInspectorEmptyState
          title="Select a staff member"
          description="Choose a staff row to inspect that person's schedule."
          icon={<UserRound size={26} />}
          testId="schedule-staff-empty"
        />
      ) : (
        <>
          <section className="schedule-inspector-person">
            <span className="schedule-inspector-avatar" aria-hidden="true">
              {initials(selectedStaff.staff_name)}
            </span>

            <div className="schedule-inspector-person-meta">
              <strong>{selectedStaff.staff_name}</strong>

              <span>
                {pretty(
                  selectedAvailability?.staff.staff_type ||
                    selectedAvailability?.staff.system_role,
                )}
              </span>
            </div>

            <span className="schedule-inspector-duty">
              {selectedStaff.attendance_presence?.state === 'checked_in'
                ? 'On Duty'
                : selectedStaff.attendance_presence?.state === 'checked_out'
                  ? 'Checked Out'
                  : selectedStaff.schedule_is_day_off
                    ? 'Day Off'
                    : 'Not Checked In'}
            </span>
          </section>

          <section className="schedule-inspector-shift">
            <div>
              <span>Shift</span>

              <strong>
                {selectedStaff.work_start && selectedStaff.work_end
                  ? `${formatScheduleTime(
                      selectedStaff.work_start,
                    )} – ${formatScheduleTime(selectedStaff.work_end)}`
                  : selectedStaff.schedule_is_day_off
                    ? 'Day off'
                    : 'Not configured'}
              </strong>
            </div>

            <div>
              <span>Schedule Source</span>

              <strong>{pretty(selectedStaff.schedule_source)}</strong>
            </div>

            {selectedStaff.current_override && (
              <div>
                <span>Override</span>

                <strong>
                  {selectedStaff.current_override.is_day_off
                    ? 'Day off'
                    : 'Custom hours'}
                </strong>
              </div>
            )}
          </section>

          <section className="schedule-inspector-section">
            <h3>
              {selectedDate === todayString
                ? "Today's Summary"
                : 'Selected Day Summary'}
            </h3>

            <div className="schedule-summary-grid">
              <div>
                <CalendarClock size={15} aria-hidden="true" />
                <strong>{selectedStaff.bookings.length}</strong>
                <span>Bookings</span>
              </div>

              <div>
                <Clock3 size={15} aria-hidden="true" />
                <strong>
                  {Math.floor(bookedMinutes / 60)}h {bookedMinutes % 60}m
                </strong>
                <span>Booked</span>
              </div>

              <div>
                <ShieldCheck size={15} aria-hidden="true" />
                <strong>{selectedStaff.blocks.length}</strong>
                <span>Blocked periods</span>
              </div>

              <div
                className={
                  selectedStaff.schedule_conflict_code ? 'has-conflict' : ''
                }
              >
                <AlertTriangle size={15} aria-hidden="true" />

                <strong>
                  {selectedStaff.schedule_conflict_code ? 'Issue' : 'Clear'}
                </strong>

                <span>Conflict state</span>
              </div>
            </div>

            {selectedStaff.schedule_conflict_code && (
              <div className="schedule-inspector-conflict" role="status">
                <AlertTriangle size={14} aria-hidden="true" />

                <span>
                  {selectedStaff.schedule_conflict_reason ||
                    selectedStaff.schedule_conflict_code}
                </span>
              </div>
            )}
          </section>

          <section className="schedule-inspector-section">
            <h3>Next Booking</h3>

            {nextBooking ? (
              <div className="schedule-next-booking">
                <strong>{formatScheduleTime(nextBooking.start_time)}</strong>

                <span className="schedule-next-service">
                  {nextBooking.service}
                </span>

                <span>{nextBooking.customer}</span>

                <small>
                  {nextBooking.resource_name
                    ? `${nextBooking.resource_name} · `
                    : ''}
                  {bookingDuration(nextBooking)} min
                </small>
              </div>
            ) : (
              <p className="schedule-inspector-empty-copy">
                No upcoming booking is returned for this staff member on the
                selected date.
              </p>
            )}
          </section>

          <section className="schedule-inspector-section">
            <h3>Schedule Actions</h3>

            <div className="schedule-action-grid">
              <button type="button" onClick={onAdjustSchedule}>
                Adjust Schedule
              </button>

              <button type="button" onClick={onBlockTime}>
                Block Time
              </button>

              <button type="button" onClick={onFullSchedule}>
                Full Schedule
              </button>

              <button type="button" onClick={onAvailability}>
                Availability
              </button>
            </div>
          </section>
        </>
      )}
    </ModuleInspectorFrame>
  );
};
