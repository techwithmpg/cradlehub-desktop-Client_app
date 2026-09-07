import React, { useEffect, useMemo, useState } from 'react';
import type {
  StaffBlockedTime,
  StaffMember,
  StaffScheduleOverride,
} from '../../types/staff';
import { fetchBranchScheduleWeek } from '../../lib/staff-service';

interface StaffScheduleViewProps {
  branchId: string;
  staffList: StaffMember[];
  onOpenScheduleModal: (
    staff: StaffMember,
    date?: string,
    existingBlocks?: StaffBlockedTime[],
  ) => void;
}

export const StaffScheduleView: React.FC<StaffScheduleViewProps> = ({
  branchId,
  staffList,
  onOpenScheduleModal,
}) => {
  // Current Monday for the week
  const [currentMonday, setCurrentMonday] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().slice(0, 10);
  });

  const [overrides, setOverrides] = useState<StaffScheduleOverride[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<StaffBlockedTime[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (isMounted) setIsLoading(true);
      try {
        const data = await fetchBranchScheduleWeek(branchId, currentMonday);
        if (isMounted) {
          setOverrides(data.overrides);
          setBlockedTimes(data.blockedTimes);
        }
      } catch {
        // graceful empty
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [branchId, currentMonday]);

  // Compute 7 days of the week
  const weekDays = useMemo(() => {
    const days: { dateStr: string; dayName: string; dayNum: string }[] = [];
    const base = new Date(currentMonday);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dayNum = d.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric',
      });
      days.push({ dateStr, dayName, dayNum });
    }
    return days;
  }, [currentMonday]);

  const handlePrevWeek = () => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() - 7);
    setCurrentMonday(d.toISOString().slice(0, 10));
  };

  const handleNextWeek = () => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + 7);
    setCurrentMonday(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    setCurrentMonday(monday.toISOString().slice(0, 10));
  };

  // Format date range string
  const rangeDisplay = useMemo(() => {
    if (weekDays.length < 7) return '';
    const first = new Date(weekDays[0].dateStr);
    const last = new Date(weekDays[6].dateStr);
    return `${first.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [weekDays]);

  return (
    <div
      className="bookings-list-card staff-schedule-view-card p-4 space-y-4"
      data-testid="staff-schedule-view"
    >
      {/* Schedule Header / Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[var(--cs-border)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--cs-text)]">
            Weekly Schedule Overview
          </h3>
          <p className="text-xs text-[var(--cs-text-muted)]">
            Inspect working hours, days off, and blocked times across branch
            staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary-compact text-xs"
            onClick={handlePrevWeek}
            aria-label="Previous week"
          >
            &larr; Prev
          </button>
          <button
            type="button"
            className="btn-secondary-compact text-xs font-semibold"
            onClick={handleToday}
          >
            Today
          </button>
          <span className="text-xs font-bold text-[var(--cs-text)] px-2">
            {rangeDisplay}
          </span>
          <button
            type="button"
            className="btn-secondary-compact text-xs"
            onClick={handleNextWeek}
            aria-label="Next week"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Week-board Grid */}
      <div className="overflow-x-auto border border-[var(--cs-border)] rounded-md bg-[var(--cs-surface)]">
        {staffList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--cs-text-muted)]">
            No staff members available to display schedule.
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--cs-surface-warm)] border-b border-[var(--cs-border)]">
                <th className="p-2.5 text-left font-semibold text-[var(--cs-text)] w-48 border-r border-[var(--cs-border)]">
                  Staff Member
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.dateStr}
                    className="p-2 text-center font-semibold text-[var(--cs-text)] border-r border-[var(--cs-border)] last:border-r-0 min-w-[110px]"
                  >
                    <div>{day.dayName}</div>
                    <div className="text-[10px] text-[var(--cs-text-muted)] font-normal">
                      {day.dayNum}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-[var(--cs-border)] hover:bg-[var(--cs-surface-hover)] transition-colors"
                >
                  <td className="p-2.5 border-r border-[var(--cs-border)] font-medium text-[var(--cs-text)]">
                    <div className="truncate font-semibold">
                      {member.full_name}
                    </div>
                    <div className="text-[10px] text-[var(--cs-text-muted)] uppercase">
                      {member.staff_type.replace(/_/g, ' ')}
                    </div>
                  </td>

                  {weekDays.map((day) => {
                    const dayOverride = overrides.find(
                      (o) =>
                        o.staff_id === member.id &&
                        o.override_date === day.dateStr,
                    );
                    const dayBlocks = blockedTimes.filter(
                      (b) =>
                        b.staff_id === member.id &&
                        b.block_date === day.dateStr,
                    );

                    return (
                      <td
                        key={day.dateStr}
                        className="p-1.5 border-r border-[var(--cs-border)] last:border-r-0 text-center align-top cursor-pointer hover:bg-[var(--cs-sand-mist)] transition-colors"
                        onClick={() =>
                          onOpenScheduleModal(member, day.dateStr, dayBlocks)
                        }
                        title={`Click to adjust schedule for ${member.full_name} on ${day.dateStr}`}
                      >
                        {dayOverride?.is_day_off ? (
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Day Off
                          </span>
                        ) : dayOverride?.start_time ? (
                          <div className="text-[10px] font-medium text-[var(--cs-sand)] bg-[var(--cs-sand-mist)] px-1 py-0.5 rounded">
                            {dayOverride.start_time.slice(0, 5)} -{' '}
                            {dayOverride.end_time?.slice(0, 5)}
                          </div>
                        ) : dayBlocks.length > 0 ? (
                          <div className="text-[10px] font-medium text-red-700 bg-red-50 px-1 py-0.5 rounded border border-red-200">
                            {dayBlocks.length} Block
                            {dayBlocks.length > 1 ? 's' : ''}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--cs-text-muted)]">
                            Regular Shift
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-2 text-xs text-[var(--cs-text-muted)]">
          Loading schedule overrides...
        </div>
      )}
    </div>
  );
};
