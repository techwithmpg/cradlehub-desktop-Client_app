import React, { useMemo, useState } from 'react';
import type {
  StaffBlockedTime,
  StaffMember,
  StaffScheduleOverride,
} from '../../../types/staff';

interface StaffFullScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  branchName: string;
  overrides?: StaffScheduleOverride[];
  blockedTimes?: StaffBlockedTime[];
  onOpenAdjustSchedule?: (staff: StaffMember, date?: string) => void;
}

type CalendarView = 'day' | 'week' | 'month';

export const StaffFullScheduleModal: React.FC<StaffFullScheduleModalProps> = ({
  isOpen,
  onClose,
  staff,
  branchName,
  overrides = [],
  blockedTimes = [],
  onOpenAdjustSchedule,
}) => {
  const [viewMode, setViewMode] = useState<CalendarView>('week');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().slice(0, 10);
  });
  const staffId = staff?.id;

  // Compute 7 days for the current week starting from selectedDate (assumed Monday)
  const weekDays = useMemo(() => {
    if (!staffId) return [];
    const days: Array<{
      dateStr: string;
      dayName: string;
      formattedDate: string;
      isToday: boolean;
      override?: StaffScheduleOverride;
      blocks: StaffBlockedTime[];
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);
    const base = new Date(selectedDate);

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const override = overrides.find(
        (o) => o.staff_id === staffId && o.override_date === dateStr,
      );
      const blocks = blockedTimes.filter(
        (b) => b.staff_id === staffId && b.block_date === dateStr,
      );

      days.push({
        dateStr,
        dayName,
        formattedDate,
        isToday: dateStr === todayStr,
        override,
        blocks,
      });
    }

    return days;
  }, [selectedDate, overrides, blockedTimes, staffId]);

  const dateRangeDisplay = useMemo(() => {
    if (weekDays.length < 7) return '';
    const start = weekDays[0].formattedDate;
    const end = weekDays[6].formattedDate;
    return `${start} – ${end}`;
  }, [weekDays]);

  if (!isOpen || !staff) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    setSelectedDate(monday.toISOString().slice(0, 10));
  };

  const daysOffCount = weekDays.filter((d) => d.override?.is_day_off).length;
  const overridesCount = weekDays.filter(
    (d) => d.override && !d.override.is_day_off,
  ).length;
  const blocksCount = weekDays.reduce((acc, d) => acc + d.blocks.length, 0);

  return (
    <div
      className="bookings-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="full-schedule-modal"
    >
      <div
        className="bookings-modal-content staff-full-schedule-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '94vw',
          width: '1100px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div className="bookings-modal-header border-b border-[var(--cs-border)] pb-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--cs-brand-green)]">
              Full Schedule View
            </span>
            <h3 className="bookings-modal-title text-base">
              {staff.full_name} &bull; Schedule & Availability
            </h3>
            <p className="text-xs text-[var(--cs-text-muted)]">
              Weekly schedule overview, shifts, overrides, and blocked times at{' '}
              {branchName}.
            </p>
          </div>
          <button
            type="button"
            className="bookings-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Staff Identity & KPI Strip */}
        <div className="p-4 bg-[var(--cs-surface-warm)] border-b border-[var(--cs-border)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inspector-avatar-circle" aria-hidden="true">
              {getInitials(staff.full_name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--cs-text)]">
                  {staff.full_name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-[var(--cs-surface)] border border-[var(--cs-border)] text-[var(--cs-text-secondary)]">
                  {staff.staff_type.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-[var(--cs-text-muted)]">
                Role:{' '}
                <span className="uppercase font-medium">
                  {staff.system_role}
                </span>{' '}
                &bull; {branchName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center px-3 py-1.5 rounded bg-[var(--cs-surface)] border border-[var(--cs-border)]">
              <span className="text-xs text-[var(--cs-text-muted)] block">
                Days Off
              </span>
              <span className="text-sm font-bold text-[var(--cs-text)]">
                {daysOffCount}
              </span>
            </div>
            <div className="text-center px-3 py-1.5 rounded bg-[var(--cs-surface)] border border-[var(--cs-border)]">
              <span className="text-xs text-[var(--cs-text-muted)] block">
                Overrides
              </span>
              <span className="text-sm font-bold text-amber-700">
                {overridesCount}
              </span>
            </div>
            <div className="text-center px-3 py-1.5 rounded bg-[var(--cs-surface)] border border-[var(--cs-border)]">
              <span className="text-xs text-[var(--cs-text-muted)] block">
                Blocks
              </span>
              <span className="text-sm font-bold text-blue-700">
                {blocksCount}
              </span>
            </div>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="p-3 border-b border-[var(--cs-border)] flex items-center justify-between flex-wrap gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-[var(--cs-surface-warm)] p-1 rounded-md border border-[var(--cs-border)]">
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded font-medium ${
                viewMode === 'week'
                  ? 'bg-[var(--cs-surface)] shadow-sm text-[var(--cs-text)]'
                  : 'text-[var(--cs-text-muted)]'
              }`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded font-medium ${
                viewMode === 'day'
                  ? 'bg-[var(--cs-surface)] shadow-sm text-[var(--cs-text)]'
                  : 'text-[var(--cs-text-muted)]'
              }`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary-compact text-xs px-2.5"
              onClick={handlePrevWeek}
              aria-label="Previous week"
            >
              &larr; Prev
            </button>
            <button
              type="button"
              className="btn-secondary-compact text-xs"
              onClick={handleToday}
            >
              Today
            </button>
            <button
              type="button"
              className="btn-secondary-compact text-xs px-2.5"
              onClick={handleNextWeek}
              aria-label="Next week"
            >
              Next &rarr;
            </button>
            <span className="text-xs font-semibold text-[var(--cs-text)] ml-2">
              {dateRangeDisplay}
            </span>
          </div>

          {onOpenAdjustSchedule && (
            <button
              type="button"
              className="bookings-header-primary-btn text-xs py-1.5 px-3"
              onClick={() => {
                onClose();
                onOpenAdjustSchedule(staff, selectedDate);
              }}
            >
              Adjust Schedule
            </button>
          )}
        </div>

        {/* Main Schedule Grid Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-[var(--cs-surface-warm)]">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {weekDays.map((day) => (
              <div
                key={day.dateStr}
                className={`p-3 rounded-lg border bg-[var(--cs-surface)] flex flex-col justify-between min-h-[160px] ${
                  day.isToday
                    ? 'ring-2 ring-[var(--cs-brand-green)] border-[var(--cs-brand-green)]'
                    : 'border-[var(--cs-border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[var(--cs-border)] pb-1.5 mb-2">
                    <span className="font-bold text-xs text-[var(--cs-text)]">
                      {day.dayName}
                    </span>
                    <span className="text-[11px] text-[var(--cs-text-muted)] font-medium">
                      {day.formattedDate}
                    </span>
                  </div>

                  {/* Day Off Indicator */}
                  {day.override?.is_day_off ? (
                    <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-2 text-center font-semibold">
                      Day Off
                      {day.override.reason && (
                        <span className="block font-normal text-[10px] text-amber-700 mt-0.5">
                          {day.override.reason}
                        </span>
                      )}
                    </div>
                  ) : day.override ? (
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs mb-2">
                      <span className="font-semibold block text-[11px]">
                        Working Hours Override:
                      </span>
                      <span>
                        {day.override.start_time || '09:00'} –{' '}
                        {day.override.end_time || '18:00'}
                      </span>
                      {day.override.reason && (
                        <span className="block text-[10px] text-emerald-600 mt-0.5">
                          {day.override.reason}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-[var(--cs-surface-warm)] border border-[var(--cs-border)] text-xs text-[var(--cs-text-muted)] mb-2 text-center italic">
                      Standard Schedule
                    </div>
                  )}

                  {/* Blocked Times */}
                  {day.blocks.length > 0 && (
                    <div className="space-y-1">
                      {day.blocks.map((b) => (
                        <div
                          key={b.id}
                          className="p-1.5 rounded bg-blue-50 border border-blue-200 text-[11px] text-blue-800"
                        >
                          <span className="font-semibold block">
                            Blocked Time:
                          </span>
                          <span>
                            {b.start_time || '—'} – {b.end_time || '—'}
                          </span>
                          {b.reason && (
                            <span className="block text-[10px] text-blue-600 truncate">
                              {b.reason}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {onOpenAdjustSchedule && (
                  <button
                    type="button"
                    className="text-[11px] text-[var(--cs-brand-green)] hover:underline pt-2 border-t border-[var(--cs-border)] text-center mt-2"
                    onClick={() => {
                      onClose();
                      onOpenAdjustSchedule(staff, day.dateStr);
                    }}
                  >
                    + Adjust Day
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--cs-border)] text-xs text-[var(--cs-text-secondary)]">
            <span className="font-semibold text-[var(--cs-text)]">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--cs-brand-green)]" />{' '}
              Standard Schedule
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Day Off
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />{' '}
              Working Override
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Blocked
              Time
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bookings-modal-footer">
          <button
            type="button"
            className="bookings-modal-ack-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
