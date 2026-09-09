import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
  UserCheck,
  UsersRound,
} from 'lucide-react';
import type { AuthContext } from '../../types/auth';
import type {
  DailyScheduleResponse,
  ScheduleAvailabilityItem,
  ScheduleViewMode,
  ScheduleWeekDay,
} from '../../types/schedule';
import {
  addDays,
  fetchDailySchedule,
  fetchScheduleAvailability,
  fetchScheduleWeek,
} from '../../lib/schedule-service';
import { NewBookingModal } from '../bookings/NewBookingModal';
import {
  ModuleErrorBanner,
  ModuleHeader,
  ModuleInspectorColumn,
  ModuleKpiCell,
  ModuleKpiGrid,
  ModuleLoadingState,
  ModuleMainGrid,
  ModulePrimaryColumn,
  ModuleSummaryCard,
  ModuleToolbar,
  ModuleWorkspace,
} from '../workspace';
import { ScheduleTimeline, ScheduleWeekOverview } from './ScheduleBoard';
import { formatScheduleTime } from '../../lib/schedule-view-utils';
import {
  getScheduleRoleGroup,
  getScheduleStaffState,
  SCHEDULE_ROLE_GROUPS,
  SCHEDULE_STAFF_STATES,
  type ScheduleRoleGroup,
  type ScheduleStaffState,
} from '../../lib/schedule-role-groups';
import { ScheduleInspector } from './ScheduleInspector';
import {
  ScheduleActionModal,
  type ScheduleActionKind,
} from './ScheduleActionModal';

interface ScheduleViewProps {
  authContext: AuthContext;
}

function localDateString(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function timeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function nextShiftChange(
  daily: DailyScheduleResponse,
  selectedDate: string,
): string {
  const today = new Date();
  const todayString = localDateString(today);
  const nowMinutes = today.getHours() * 60 + today.getMinutes();

  const changes: number[] = [];

  for (const row of daily.staffRows) {
    for (const window of row.schedule_windows) {
      const start = timeToMinutes(window.startTime);
      const end = timeToMinutes(window.endTime);

      if (start !== null) {
        if (selectedDate !== todayString || start >= nowMinutes) {
          changes.push(start);
        }
      }

      if (end !== null) {
        if (selectedDate !== todayString || end >= nowMinutes) {
          changes.push(end);
        }
      }
    }
  }

  if (changes.length === 0) return '—';

  const value = Math.min(...changes);
  return formatScheduleTime(
    `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(
      value % 60,
    ).padStart(2, '0')}`,
  );
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ authContext }) => {
  const [selectedDate, setSelectedDate] = useState(localDateString());
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('day');

  const [daily, setDaily] = useState<DailyScheduleResponse | null>(null);
  const [week, setWeek] = useState<ScheduleWeekDay[]>([]);
  const [availability, setAvailability] = useState<ScheduleAvailabilityItem[]>(
    [],
  );

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const [roleGroup, setRoleGroup] = useState<ScheduleRoleGroup>('all');
  const [staffState, setStaffState] = useState<ScheduleStaffState>('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWeekLoading, setIsWeekLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [scheduleAction, setScheduleAction] =
    useState<ScheduleActionKind | null>(null);

  const loadDay = useCallback(async (date: string, refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const [dayData, availabilityData] = await Promise.all([
        fetchDailySchedule(date),
        fetchScheduleAvailability(),
      ]);

      setDaily(dayData);
      setAvailability(availabilityData.items);

      setSelectedStaffId((current) => {
        if (
          current &&
          dayData.staffRows.some((row) => row.staff_id === current)
        ) {
          return current;
        }

        return dayData.staffRows[0]?.staff_id ?? null;
      });
    } catch (cause: unknown) {
      setDaily(null);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to load Schedule Operations.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode !== 'day') {
      return;
    }

    let active = true;

    void Promise.all([
      fetchDailySchedule(selectedDate),
      fetchScheduleAvailability(),
    ])
      .then(([dayData, availabilityData]) => {
        if (!active) return;

        setDaily(dayData);
        setAvailability(availabilityData.items);

        setSelectedStaffId((current) => {
          if (
            current &&
            dayData.staffRows.some((row) => row.staff_id === current)
          ) {
            return current;
          }

          return dayData.staffRows[0]?.staff_id ?? null;
        });
      })
      .catch((cause: unknown) => {
        if (!active) return;

        setDaily(null);
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to load Schedule Operations.',
        );
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedDate, viewMode]);

  useEffect(() => {
    if (viewMode !== 'week') {
      return;
    }

    let active = true;

    void Promise.all([
      fetchScheduleWeek(selectedDate),
      fetchScheduleAvailability(),
    ])
      .then(([weekData, availabilityData]) => {
        if (!active) return;

        setWeek(weekData);
        setAvailability(availabilityData.items);

        const anchorDay =
          weekData.find((entry) => entry.date === selectedDate) ??
          weekData[0] ??
          null;

        setDaily(anchorDay?.data ?? null);

        setSelectedStaffId((current) => {
          const rows = anchorDay?.data.staffRows ?? [];

          if (current && rows.some((row) => row.staff_id === current)) {
            return current;
          }

          return rows[0]?.staff_id ?? null;
        });
      })
      .catch((cause: unknown) => {
        if (!active) return;

        setWeek([]);
        setDaily(null);
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to load the weekly schedule.',
        );
      })
      .finally(() => {
        if (active) {
          setIsWeekLoading(false);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedDate, viewMode]);

  const availabilityByStaffId = useMemo(
    () => new Map(availability.map((item) => [item.staff.id, item] as const)),
    [availability],
  );

  const selectedStaff = useMemo(
    () =>
      daily?.staffRows.find((row) => row.staff_id === selectedStaffId) ?? null,
    [daily, selectedStaffId],
  );

  const selectedAvailability = useMemo(
    () =>
      selectedStaffId
        ? (availabilityByStaffId.get(selectedStaffId) ?? null)
        : null,
    [availabilityByStaffId, selectedStaffId],
  );

  const roleGroups = useMemo(() => {
    const counts = new Map<ScheduleRoleGroup, number>();

    for (const row of daily?.staffRows ?? []) {
      const item = availabilityByStaffId.get(row.staff_id);
      const staffType =
        item?.staff.staff_type ?? item?.staff.system_role ?? null;

      const key = getScheduleRoleGroup(staffType);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return SCHEDULE_ROLE_GROUPS.map((group) => ({
      ...group,
      count:
        group.key === 'all'
          ? (daily?.staffRows.length ?? 0)
          : (counts.get(group.key) ?? 0),
    })).filter((group) => group.key === 'all' || group.count > 0);
  }, [availabilityByStaffId, daily]);

  const stateCounts = useMemo(() => {
    const counts = new Map<ScheduleStaffState, number>();

    for (const row of daily?.staffRows ?? []) {
      const item = availabilityByStaffId.get(row.staff_id);
      const staffType =
        item?.staff.staff_type ?? item?.staff.system_role ?? null;

      if (
        roleGroup !== 'all' &&
        getScheduleRoleGroup(staffType) !== roleGroup
      ) {
        continue;
      }

      const state = getScheduleStaffState(row);
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }

    return SCHEDULE_STAFF_STATES.map((state) => ({
      ...state,
      count:
        state.key === 'all'
          ? Array.from(counts.values()).reduce(
              (total, value) => total + value,
              0,
            )
          : (counts.get(state.key) ?? 0),
    }));
  }, [availabilityByStaffId, daily, roleGroup]);
  const resources = useMemo(() => {
    const values = new Map<string, string>();

    for (const row of daily?.staffRows ?? []) {
      for (const booking of row.bookings) {
        if (booking.resource_id && booking.resource_name) {
          values.set(booking.resource_id, booking.resource_name);
        }
      }
    }

    return Array.from(values.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [daily]);

  const scheduledStaff =
    daily?.staffRows.filter(
      (row) =>
        !row.schedule_is_day_off &&
        (row.schedule_windows.length > 0 ||
          Boolean(row.work_start && row.work_end)),
    ).length ?? 0;

  const onDuty =
    daily?.staffRows.filter(
      (row) => row.attendance_presence?.state === 'checked_in',
    ).length ?? 0;

  const conflictCount =
    daily?.staffRows.filter((row) => Boolean(row.schedule_conflict_code))
      .length ?? 0;

  const totalBookings =
    daily?.stats.total ??
    daily?.staffRows.reduce((total, row) => total + row.bookings.length, 0) ??
    0;

  const changeSelectedDate = useCallback(
    (nextDate: string) => {
      if (!nextDate || nextDate === selectedDate) return;

      setError(null);

      if (viewMode === 'week') {
        setWeek([]);
        setIsWeekLoading(true);
      } else {
        setIsLoading(true);
      }

      setSelectedDate(nextDate);
    },
    [selectedDate, viewMode],
  );

  const handleViewModeChange = useCallback(
    (nextMode: ScheduleViewMode) => {
      if (nextMode === viewMode) return;

      setError(null);

      if (nextMode === 'week') {
        setWeek([]);
        setIsWeekLoading(true);
      } else {
        setWeek([]);
        setIsLoading(true);
      }

      setViewMode(nextMode);
    },
    [viewMode],
  );
  const handleNewBookingCreated = useCallback(() => {
    setIsNewBookingOpen(false);
    void loadDay(selectedDate, true);
  }, [loadDay, selectedDate]);

  const handleScheduleActionSaved = useCallback(async () => {
    if (viewMode === 'day') {
      await loadDay(selectedDate, true);
      return;
    }

    setIsWeekLoading(true);
    setError(null);

    try {
      const [weekData, availabilityData] = await Promise.all([
        fetchScheduleWeek(selectedDate),
        fetchScheduleAvailability(),
      ]);

      setWeek(weekData);
      setAvailability(availabilityData.items);

      const anchorDay =
        weekData.find((entry) => entry.date === selectedDate) ??
        weekData[0] ??
        null;

      setDaily(anchorDay?.data ?? null);

      if (anchorDay) {
        setSelectedStaffId((current) => {
          if (
            current &&
            anchorDay.data.staffRows.some((row) => row.staff_id === current)
          ) {
            return current;
          }

          return anchorDay.data.staffRows[0]?.staff_id ?? null;
        });
      }
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to refresh the weekly schedule.',
      );
    } finally {
      setIsWeekLoading(false);
    }
  }, [loadDay, selectedDate, viewMode]);
  return (
    <ModuleWorkspace
      ariaLabel="Schedule Operations"
      testId="schedule-view"
      className="schedule-view"
    >
      <ModuleHeader
        title="Schedule Operations"
        subtitle={`Branch schedule, coverage, resources, and shift readiness · ${authContext.branchName}`}
        onRefresh={() => void loadDay(selectedDate, true)}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: 'New Booking',
          onClick: () => setIsNewBookingOpen(true),
          testId: 'schedule-new-booking',
        }}
        testId="schedule-header"
      />

      {error && (
        <ModuleErrorBanner
          message={error}
          onRetry={() => void loadDay(selectedDate, true)}
          testId="schedule-error"
        />
      )}

      {isLoading ? (
        <ModuleLoadingState
          ariaLabel="Loading branch schedule"
          testId="schedule-loading"
        />
      ) : daily ? (
        <>
          <ModuleSummaryCard
            ariaLabel="Schedule summary"
            testId="schedule-summary"
          >
            <ModuleKpiGrid className="schedule-kpi-grid">
              <ModuleKpiCell
                label="Scheduled Staff"
                count={scheduledStaff}
                subtext={`${daily.staffRows.length} operational staff returned`}
                icon={<UsersRound size={17} />}
              />

              <ModuleKpiCell
                label="On Duty"
                count={onDuty}
                subtext="Checked in now"
                icon={<UserCheck size={17} />}
              />

              <ModuleKpiCell
                label="Bookings"
                count={totalBookings}
                subtext={`For ${selectedDate}`}
                icon={<CalendarDays size={17} />}
              />

              <ModuleKpiCell
                label="Next Shift Change"
                count={nextShiftChange(daily, selectedDate)}
                subtext="From resolved schedule windows"
                icon={<Clock3 size={17} />}
              />

              <ModuleKpiCell
                label="Conflicts"
                count={conflictCount}
                subtext={
                  conflictCount > 0
                    ? 'Requires review'
                    : 'No explicit conflicts returned'
                }
                icon={<AlertTriangle size={17} />}
              />
            </ModuleKpiGrid>
          </ModuleSummaryCard>
          <ModuleMainGrid className="schedule-main-grid">
            <ModulePrimaryColumn className="schedule-primary-column">
              <div className="schedule-board-shell">
                <div className="schedule-board-controls">
                  <div
                    className="schedule-role-filter-area"
                    aria-label="Schedule staff filters"
                  >
                    <div
                      className="schedule-role-tabs"
                      role="tablist"
                      aria-label="Staff role"
                    >
                      {roleGroups.map((group) => (
                        <button
                          key={group.key}
                          type="button"
                          role="tab"
                          aria-selected={roleGroup === group.key}
                          className={roleGroup === group.key ? 'active' : ''}
                          onClick={() => {
                            setRoleGroup(group.key);
                            setStaffState('all');
                            setSelectedStaffId(null);
                          }}
                        >
                          <span>{group.label}</span>
                          <small>{group.count}</small>
                        </button>
                      ))}
                    </div>

                    <div className="schedule-state-row">
                      <div className="schedule-state-row">
                        <div
                          className="schedule-state-tabs"
                          aria-label="Staff schedule state"
                        >
                          {stateCounts.map((state) => (
                            <button
                              key={state.key}
                              type="button"
                              aria-pressed={staffState === state.key}
                              className={
                                staffState === state.key ? 'active' : ''
                              }
                              onClick={() => {
                                setStaffState(state.key);
                                setSelectedStaffId(null);
                              }}
                            >
                              {state.label}
                              <span>{state.count}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="schedule-state-actions"></div>
                    </div>
                  </div>
                  <ModuleToolbar
                    ariaLabel="Schedule controls"
                    className="schedule-toolbar"
                    testId="schedule-toolbar"
                  >
                    <div
                      className="schedule-view-toggle"
                      role="tablist"
                      aria-label="Schedule view"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === 'day'}
                        className={viewMode === 'day' ? 'active' : ''}
                        onClick={() => handleViewModeChange('day')}
                      >
                        Day
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === 'week'}
                        className={viewMode === 'week' ? 'active' : ''}
                        onClick={() => handleViewModeChange('week')}
                      >
                        Week
                      </button>
                    </div>

                    <div className="schedule-date-controls">
                      <button
                        type="button"
                        onClick={() =>
                          changeSelectedDate(addDays(selectedDate, -1))
                        }
                        aria-label="Previous day"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(event) =>
                          changeSelectedDate(event.target.value)
                        }
                        aria-label="Schedule date"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          changeSelectedDate(addDays(selectedDate, 1))
                        }
                        aria-label="Next day"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <select
                      value={roomFilter}
                      onChange={(event) => setRoomFilter(event.target.value)}
                      aria-label="Filter by room or resource"
                    >
                      <option value="all">All Rooms</option>

                      {resources.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name}
                        </option>
                      ))}
                    </select>
                    <label className="schedule-local-search">
                      <Search size={15} aria-hidden="true" />

                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search staff or appointment"
                        aria-label="Search staff or appointment"
                      />

                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear Schedule search"
                        >
                          ×
                        </button>
                      )}
                    </label>
                  </ModuleToolbar>
                </div>

                <div className="schedule-board-content">
                  {viewMode === 'week' ? (
                    isWeekLoading ? (
                      <ModuleLoadingState
                        ariaLabel="Loading weekly schedule"
                        testId="schedule-week-loading"
                      />
                    ) : (
                      <ScheduleWeekOverview
                        days={week}
                        availabilityByStaffId={availabilityByStaffId}
                        selectedStaffId={selectedStaffId}
                        onSelectStaff={setSelectedStaffId}
                        roleGroup={roleGroup}
                        staffState={staffState}
                        roomFilter={roomFilter}
                        searchQuery={searchQuery}
                      />
                    )
                  ) : (
                    <ScheduleTimeline
                      day={daily}
                      availabilityByStaffId={availabilityByStaffId}
                      selectedStaffId={selectedStaffId}
                      onSelectStaff={setSelectedStaffId}
                      roleGroup={roleGroup}
                      staffState={staffState}
                      roomFilter={roomFilter}
                      conflictsOnly={false}
                      searchQuery={searchQuery}
                    />
                  )}
                </div>
              </div>
            </ModulePrimaryColumn>

            <ModuleInspectorColumn>
              {' '}
              <ScheduleInspector
                day={daily}
                selectedStaff={selectedStaff}
                selectedAvailability={selectedAvailability}
                selectedDate={selectedDate}
                onAdjustSchedule={() => setScheduleAction('adjust')}
                onBlockTime={() => setScheduleAction('block')}
                onFullSchedule={() => setScheduleAction('full')}
                onAvailability={() => setScheduleAction('availability')}
              />
            </ModuleInspectorColumn>
          </ModuleMainGrid>
        </>
      ) : (
        <div className="schedule-empty-body">
          <CalendarDays size={26} aria-hidden="true" />
          <strong>Schedule unavailable</strong>
          <span>No authoritative Schedule response is currently loaded.</span>
        </div>
      )}

      <ScheduleActionModal
        isOpen={scheduleAction !== null}
        kind={scheduleAction ?? 'adjust'}
        onClose={() => setScheduleAction(null)}
        branchId={authContext.branchId}
        selectedDate={selectedDate}
        staff={selectedStaff}
        availability={selectedAvailability}
        onSaved={handleScheduleActionSaved}
      />
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        branchId={authContext.branchId}
        branchName={authContext.branchName}
        onBookingCreated={handleNewBookingCreated}
      />
    </ModuleWorkspace>
  );
};
