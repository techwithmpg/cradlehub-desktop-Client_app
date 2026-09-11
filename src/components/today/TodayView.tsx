import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import type { AuthContext } from '../../types/auth';
import type {
  DesktopTodayData,
  DesktopTodayQueueItem,
  TodayMutationAction,
} from '../../types/today';
import { fetchToday, mutateToday } from '../../lib/today-service';
import {
  ModuleDataGridFrame,
  ModuleErrorBanner,
  ModuleHeader,
  ModuleInspectorColumn,
  ModuleInspectorEmptyState,
  ModuleInspectorFrame,
  ModuleKpiCell,
  ModuleKpiGrid,
  ModuleLoadingState,
  ModuleMainGrid,
  ModulePrimaryCard,
  ModulePrimaryColumn,
  ModuleSuccessBanner,
  ModuleSummaryCard,
  ModuleTable,
  ModuleTabs,
  ModuleToolbar,
  ModuleWorkspace,
} from '../workspace';

interface TodayViewProps {
  authContext: AuthContext;
}

type StageScopeFilter =
  'all' | 'waiting' | 'in_service' | 'ready_to_pay' | 'completed';

type InspectorTabId = 'detail' | 'readiness' | 'attendance' | 'notifications';

function formatClock(value: string | null | undefined): string {
  if (!value) return '—';
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function formatDateLabel(dateString?: string): string {
  if (!dateString) return 'Today';
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}

function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return 'Not recorded';
  const date = new Date(isoString);
  return Number.isNaN(date.getTime())
    ? isoString
    : date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
}

function getApplicableAction(booking: DesktopTodayQueueItem): {
  action: TodayMutationAction;
  label: string;
  tone: 'primary' | 'success';
} | null {
  // Home Service mutations are strictly excluded from the Today module
  if (booking.isHomeService) {
    return null;
  }

  // Pending bookings -> Confirm
  if (
    booking.status === 'pending' ||
    booking.status === 'pending_crm_confirmation' ||
    booking.status === 'pending_payment'
  ) {
    return {
      action: 'confirm_booking',
      label: 'Confirm',
      tone: 'primary',
    };
  }

  // Confirmed and not started -> Mark Arrived
  if (
    booking.status === 'confirmed' &&
    booking.bookingProgressStatus === 'not_started'
  ) {
    return {
      action: 'mark_arrived',
      label: 'Mark Arrived',
      tone: 'primary',
    };
  }

  // Checked in -> Start Service
  if (booking.bookingProgressStatus === 'checked_in') {
    return {
      action: 'start_service',
      label: 'Start Service',
      tone: 'primary',
    };
  }

  // In service -> Complete Service
  if (
    booking.bookingProgressStatus === 'in_progress' ||
    booking.status === 'in_progress'
  ) {
    return {
      action: 'complete_service',
      label: 'Complete Service',
      tone: 'success',
    };
  }

  return null;
}

function renderStageBadge(item: DesktopTodayQueueItem) {
  if (item.stage === 'waiting') {
    return <span className="booking-badge badge-pending">Waiting</span>;
  }
  if (item.stage === 'in_service' || item.status === 'in_progress') {
    return <span className="booking-badge badge-checked-in">In Service</span>;
  }
  if (item.stage === 'ready_to_pay') {
    return <span className="booking-badge badge-no-show">Payment Pending</span>;
  }
  if (item.stage === 'completed' || item.status === 'completed') {
    return <span className="booking-badge badge-completed">Completed</span>;
  }
  if (item.status === 'confirmed') {
    return <span className="booking-badge badge-confirmed">Confirmed</span>;
  }
  if (item.status === 'cancelled') {
    return <span className="booking-badge badge-cancelled">Cancelled</span>;
  }
  if (item.status === 'no_show') {
    return <span className="booking-badge badge-no-show">No Show</span>;
  }
  return <span className="booking-badge badge-pending">{item.status}</span>;
}

export const TodayView: React.FC<TodayViewProps> = ({ authContext }) => {
  const [data, setData] = useState<DesktopTodayData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<StageScopeFilter>('all');
  const [inspectorTab, setInspectorTab] = useState<InspectorTabId>('detail');
  const [mutatingBookingId, setMutatingBookingId] = useState<string | null>(
    null,
  );
  const [mutationNotice, setMutationNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadToday = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    setError(null);

    try {
      const result = await fetchToday();
      setData(result);
      setSelectedId((current) => {
        if (current && result.queue.some((b) => b.id === current)) {
          return current;
        }
        return result.queue[0]?.id ?? null;
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to load authoritative Today workspace.';
      setError(msg);
      setData(null);
      setSelectedId(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const result = await fetchToday();
        if (!isMounted) return;
        setData(result);
        setSelectedId((current) => {
          if (current && result.queue.some((b) => b.id === current)) {
            return current;
          }
          return result.queue[0]?.id ?? null;
        });
        setError(null);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to load authoritative Today workspace.';
        setError(msg);
        setData(null);
        setSelectedId(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [authContext.branchId]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setMutationNotice(null);
    void loadToday(false);
  }, [loadToday]);

  const handleRunMutation = async (
    booking: DesktopTodayQueueItem,
    action: TodayMutationAction,
  ) => {
    if (mutatingBookingId) return;
    setMutatingBookingId(booking.id);
    setMutationNotice(null);

    try {
      await mutateToday({
        action,
        bookingId: booking.id,
      });

      const actionSuccessMessages: Record<TodayMutationAction, string> = {
        confirm_booking: 'Booking confirmed.',
        mark_arrived: 'Arrival recorded.',
        start_service: 'Service started.',
        complete_service: 'Service completed.',
      };

      setMutationNotice({
        type: 'success',
        message: actionSuccessMessages[action] ?? 'Operation completed.',
      });
      await loadToday(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mutation failed.';
      setMutationNotice({
        type: 'error',
        message: msg,
      });
    } finally {
      setMutatingBookingId(null);
    }
  };

  const filteredQueue = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();

    return data.queue.filter((item) => {
      // Stage filter
      if (stageFilter !== 'all') {
        if (item.stage !== stageFilter) {
          return false;
        }
      }

      // Search filter
      if (query) {
        const matchesCustomer = item.customerName
          ?.toLowerCase()
          .includes(query);
        const matchesPhone = item.customerPhone?.toLowerCase().includes(query);
        const matchesService = item.serviceName?.toLowerCase().includes(query);
        const matchesStaff = item.staffName?.toLowerCase().includes(query);
        const matchesResource = item.resourceName
          ?.toLowerCase()
          .includes(query);
        const matchesAddress = item.homeServiceAddress
          ?.toLowerCase()
          .includes(query);

        if (
          !matchesCustomer &&
          !matchesPhone &&
          !matchesService &&
          !matchesStaff &&
          !matchesResource &&
          !matchesAddress
        ) {
          return false;
        }
      }

      return true;
    });
  }, [data, stageFilter, search]);

  const selectedBooking = useMemo(() => {
    if (!data || !selectedId) return null;
    return data.queue.find((b) => b.id === selectedId) ?? null;
  }, [data, selectedId]);

  return (
    <ModuleWorkspace
      className="today-view-container"
      ariaLabel="Today Workspace"
      testId="today-workspace"
    >
      {/* Header */}
      <ModuleHeader
        title="Today"
        subtitle={`${data?.context.branchName || authContext.branchName} • ${formatDateLabel(data?.context.businessDate)}`}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        refreshAriaLabel="Refresh Today snapshot"
        testId="today-header"
      />

      {/* Notices */}
      {mutationNotice?.type === 'success' && (
        <ModuleSuccessBanner
          message={mutationNotice.message}
          onDismiss={() => setMutationNotice(null)}
          testId="today-mutation-success"
        />
      )}

      {mutationNotice?.type === 'error' && (
        <ModuleErrorBanner
          message={mutationNotice.message}
          onRetry={() => setMutationNotice(null)}
          testId="today-mutation-error"
        />
      )}

      {error && (
        <ModuleErrorBanner
          message={error}
          onRetry={() => void loadToday(true)}
          testId="today-error-banner"
        />
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <ModuleLoadingState
          ariaLabel="Loading Today workspace"
          testId="today-loading-skeleton"
        />
      ) : data ? (
        <>
          {/* Operational Summary Cards */}
          <ModuleSummaryCard
            ariaLabel="Today Operational Summary"
            testId="today-summary-card"
          >
            <ModuleKpiGrid>
              <ModuleKpiCell
                label="Waiting"
                count={data.summary.waiting}
                subtext="Queue & checked in"
                icon={<Clock3 size={16} />}
                onClick={() => setStageFilter('waiting')}
                accentClass={stageFilter === 'waiting' ? 'active-filter' : ''}
                testId="kpi-waiting"
              />
              <ModuleKpiCell
                label="In Service"
                count={data.summary.inService}
                subtext="Active sessions"
                icon={<CheckCircle2 size={16} />}
                onClick={() => setStageFilter('in_service')}
                accentClass={
                  stageFilter === 'in_service' ? 'active-filter' : ''
                }
                testId="kpi-in-service"
              />
              <ModuleKpiCell
                label="Payment Pending"
                count={data.summary.readyToPay}
                subtext="Manage on web"
                icon={<AlertCircle size={16} />}
                onClick={() => setStageFilter('ready_to_pay')}
                accentClass={
                  stageFilter === 'ready_to_pay' ? 'active-filter' : ''
                }
                testId="kpi-ready-to-pay"
              />
              <ModuleKpiCell
                label="Completed"
                count={data.summary.completedService}
                subtext="Finished services"
                icon={<CheckCircle2 size={16} />}
                onClick={() => setStageFilter('completed')}
                accentClass={stageFilter === 'completed' ? 'active-filter' : ''}
                testId="kpi-completed"
              />
              <ModuleKpiCell
                label="Unassigned"
                count={data.summary.unassigned}
                subtext="Needs staff assignment"
                icon={<Users size={16} />}
                testId="kpi-unassigned"
              />
              <ModuleKpiCell
                label="Home Service"
                count={data.summary.homeService}
                subtext="Out-of-spa bookings"
                icon={<Truck size={16} />}
                testId="kpi-home-service"
              />
            </ModuleKpiGrid>
          </ModuleSummaryCard>

          {/* Main Operational Workspace Grid */}
          <ModuleMainGrid testId="today-main-grid">
            {/* Primary Column: Today Queue */}
            <ModulePrimaryColumn testId="today-primary-column">
              <ModulePrimaryCard
                ariaLabel="Operational Queue"
                testId="today-queue-card"
              >
                {/* Scope Tabs */}
                <ModuleTabs
                  tabs={[
                    {
                      id: 'all',
                      label: 'All Queue',
                      count: data.queue.length,
                    },
                    {
                      id: 'waiting',
                      label: 'Waiting',
                      count: data.summary.waiting,
                    },
                    {
                      id: 'in_service',
                      label: 'In Service',
                      count: data.summary.inService,
                    },
                    {
                      id: 'ready_to_pay',
                      label: 'Payment Pending',
                      count: data.summary.readyToPay,
                    },
                    {
                      id: 'completed',
                      label: 'Completed',
                      count: data.summary.completedService,
                    },
                  ]}
                  activeTab={stageFilter}
                  onTabChange={(tab: StageScopeFilter) => setStageFilter(tab)}
                  ariaLabel="Queue scope filter"
                  testId="today-scope-tabs"
                />

                {/* Search Bar */}
                <ModuleToolbar testId="today-toolbar">
                  <div className="bookings-search-wrapper">
                    <Search
                      size={15}
                      className="bookings-search-icon"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      className="bookings-search-input"
                      placeholder="Search customer, service, staff, or room..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      aria-label="Search today's bookings"
                      data-testid="today-search-input"
                    />
                  </div>
                </ModuleToolbar>

                {/* Queue DataGrid */}
                <ModuleDataGridFrame testId="today-datagrid-frame">
                  {filteredQueue.length === 0 ? (
                    <div
                      className="bookings-table-empty-state"
                      data-testid="today-queue-empty"
                    >
                      <CalendarDays size={28} aria-hidden="true" />
                      <h4>
                        {data.queue.length === 0
                          ? 'No bookings scheduled for today'
                          : 'No matching bookings found'}
                      </h4>
                      <p>
                        {data.queue.length === 0
                          ? 'Today is clear. Confirmed bookings will appear here.'
                          : 'Try adjusting your search terms or scope filter.'}
                      </p>
                    </div>
                  ) : (
                    <ModuleTable
                      aria-label="Today's booking queue"
                      data-testid="today-queue-table"
                    >
                      <thead>
                        <tr>
                          <th scope="col">Time</th>
                          <th scope="col">Customer</th>
                          <th scope="col">Service</th>
                          <th scope="col">Staff / Room</th>
                          <th scope="col">Stage / Context</th>
                          <th scope="col">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQueue.map((booking) => {
                          const isSelected = booking.id === selectedId;
                          const action = getApplicableAction(booking);
                          const isMutating = mutatingBookingId === booking.id;

                          return (
                            <tr
                              key={booking.id}
                              className={`bookings-table-row ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedId(booking.id);
                                setInspectorTab('detail');
                              }}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setSelectedId(booking.id);
                                  setInspectorTab('detail');
                                }
                              }}
                              data-testid={`today-row-${booking.id}`}
                            >
                              {/* Time */}
                              <td className="bookings-table-cell time-cell">
                                <strong>
                                  {formatClock(booking.startTime)}
                                </strong>
                                <span className="bookings-cell-subtext">
                                  to {formatClock(booking.endTime)}
                                </span>
                              </td>

                              {/* Customer */}
                              <td className="bookings-table-cell">
                                <span className="bookings-cell-title">
                                  {booking.customerName || 'Walk-in Customer'}
                                </span>
                                <span className="bookings-cell-subtext">
                                  {booking.customerPhone || 'No contact'}
                                </span>
                              </td>

                              {/* Service */}
                              <td className="bookings-table-cell">
                                <span className="bookings-cell-title">
                                  {booking.serviceName || 'Standard Service'}
                                </span>
                                {booking.serviceDuration && (
                                  <span className="bookings-cell-subtext">
                                    {booking.serviceDuration} mins
                                  </span>
                                )}
                              </td>

                              {/* Staff / Room */}
                              <td className="bookings-table-cell">
                                <span className="bookings-cell-title">
                                  {booking.staffName || (
                                    <span className="text-amber-700 font-semibold">
                                      Unassigned
                                    </span>
                                  )}
                                </span>
                                <span className="bookings-cell-subtext">
                                  {booking.resourceName || 'No room assigned'}
                                </span>
                              </td>

                              {/* Stage / Context */}
                              <td className="bookings-table-cell">
                                <div className="flex flex-col gap-1 items-start">
                                  {renderStageBadge(booking)}
                                  {booking.isHomeService && (
                                    <span className="booking-source-badge source-home flex items-center gap-1">
                                      <Truck size={10} aria-hidden="true" />
                                      Home Service
                                    </span>
                                  )}
                                  {booking.isHomeService &&
                                    booking.dispatchContextAvailable ===
                                      false && (
                                      <span className="text-[10px] text-amber-800 font-medium">
                                        Dispatch unavailable
                                      </span>
                                    )}
                                  {booking.isHomeService &&
                                    booking.dispatchContextAvailable !==
                                      false &&
                                    booking.noDriverWarning && (
                                      <span className="text-[10px] text-red-700 font-medium">
                                        No driver assigned
                                      </span>
                                    )}
                                </div>
                              </td>

                              {/* Contextual Action */}
                              <td
                                className="bookings-table-cell"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {action ? (
                                  <button
                                    type="button"
                                    className={`today-action-btn ${action.tone === 'success' ? 'tone-success' : ''}`}
                                    onClick={() =>
                                      void handleRunMutation(
                                        booking,
                                        action.action,
                                      )
                                    }
                                    disabled={
                                      mutatingBookingId !== null || isMutating
                                    }
                                    aria-label={`${action.label} for ${booking.customerName || 'booking'}`}
                                    data-testid={`action-${action.action}-${booking.id}`}
                                  >
                                    {isMutating ? 'Updating...' : action.label}
                                  </button>
                                ) : booking.stage === 'ready_to_pay' ? (
                                  <span
                                    className="today-read-only-pill"
                                    data-testid={`payment-pending-pill-${booking.id}`}
                                  >
                                    Payment Pending — manage on web
                                  </span>
                                ) : booking.stage === 'completed' ||
                                  booking.status === 'completed' ? (
                                  <span className="today-completed-text">
                                    Completed
                                  </span>
                                ) : ['cancelled', 'no_show'].includes(
                                    booking.status,
                                  ) ? (
                                  <span className="today-closed-text">
                                    Closed
                                  </span>
                                ) : (
                                  <span className="today-closed-text">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </ModuleTable>
                  )}
                </ModuleDataGridFrame>
              </ModulePrimaryCard>
            </ModulePrimaryColumn>

            {/* Inspector Column: Context Inspector */}
            <ModuleInspectorColumn testId="today-inspector-column">
              <ModuleInspectorFrame
                ariaLabel="Today Context Inspector"
                testId="today-inspector-frame"
              >
                {/* Inspector Tabs */}
                <ModuleTabs
                  tabs={[
                    {
                      id: 'detail',
                      label: 'Booking',
                      count: selectedBooking ? 1 : 0,
                    },
                    {
                      id: 'readiness',
                      label: 'Readiness',
                      count: data.readiness.available
                        ? data.readiness.issues.length
                        : undefined,
                    },
                    {
                      id: 'attendance',
                      label: 'Attendance',
                      count: data.attendance.available
                        ? data.attendance.items.length
                        : undefined,
                    },
                    {
                      id: 'notifications',
                      label: 'Alerts',
                      count: data.notifications.available
                        ? data.notifications.items.length
                        : undefined,
                    },
                  ]}
                  activeTab={inspectorTab}
                  onTabChange={(tab: InspectorTabId) => setInspectorTab(tab)}
                  ariaLabel="Inspector panels"
                  testId="today-inspector-tabs"
                />

                {/* Tab Content: Booking Detail */}
                {inspectorTab === 'detail' && (
                  <>
                    {!selectedBooking ? (
                      <ModuleInspectorEmptyState
                        title="No Booking Selected"
                        description="Select a booking from the queue to view operational details and perform lifecycle transitions."
                        icon={<CalendarDays size={26} />}
                        testId="today-inspector-empty"
                      />
                    ) : (
                      <div
                        className="flex flex-col gap-3 p-3"
                        data-testid="today-booking-detail"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between pb-2 border-b border-slate-200">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 m-0">
                              {selectedBooking.customerName ||
                                'Walk-in Customer'}
                            </h3>
                            <p className="text-xs text-slate-500 m-0">
                              {selectedBooking.customerPhone ||
                                'No phone on file'}
                            </p>
                          </div>
                          {renderStageBadge(selectedBooking)}
                        </div>

                        {/* Schedule & Timing */}
                        <div className="today-inspector-section">
                          <h4>Schedule & Service</h4>
                          <dl className="today-dl-grid">
                            <dt>Time</dt>
                            <dd>
                              {formatClock(selectedBooking.startTime)} –{' '}
                              {formatClock(selectedBooking.endTime)}
                            </dd>
                            <dt>Service</dt>
                            <dd>{selectedBooking.serviceName || '—'}</dd>
                            <dt>Duration</dt>
                            <dd>
                              {selectedBooking.serviceDuration
                                ? `${selectedBooking.serviceDuration} minutes`
                                : '—'}
                            </dd>
                            <dt>Therapist</dt>
                            <dd>{selectedBooking.staffName || 'Unassigned'}</dd>
                            <dt>Room / Area</dt>
                            <dd>{selectedBooking.resourceName || 'None'}</dd>
                          </dl>
                        </div>

                        {/* Home Service Context */}
                        {selectedBooking.isHomeService && (
                          <div className="today-inspector-section">
                            <h4>Home Service Context</h4>
                            <dl className="today-dl-grid">
                              <dt>Address</dt>
                              <dd>
                                {selectedBooking.homeServiceAddress ||
                                  'Address not recorded'}
                              </dd>
                              <dt>Driver</dt>
                              <dd>
                                {selectedBooking.dispatchContextAvailable ===
                                false ? (
                                  <span className="text-amber-800 font-medium">
                                    Dispatch context unavailable on desktop
                                  </span>
                                ) : selectedBooking.driverName ? (
                                  selectedBooking.driverName
                                ) : selectedBooking.noDriverWarning ? (
                                  <span className="text-red-700 font-medium">
                                    No driver assigned
                                  </span>
                                ) : (
                                  'Pending assignment'
                                )}
                              </dd>
                              {selectedBooking.dispatchWarning && (
                                <>
                                  <dt>Warning</dt>
                                  <dd className="text-amber-700">
                                    {selectedBooking.dispatchWarning}
                                  </dd>
                                </>
                              )}
                              {selectedBooking.needsLocationReview && (
                                <>
                                  <dt>Location</dt>
                                  <dd className="text-amber-700">
                                    Review required on web
                                  </dd>
                                </>
                              )}
                            </dl>
                          </div>
                        )}

                        {/* Operational Timestamps */}
                        <div className="today-inspector-section">
                          <h4>Operational Activity</h4>
                          <dl className="today-dl-grid">
                            <dt>Checked in</dt>
                            <dd>
                              {formatDateTime(selectedBooking.checkedInAt)}
                            </dd>
                            <dt>Session start</dt>
                            <dd>
                              {formatDateTime(selectedBooking.sessionStartedAt)}
                            </dd>
                            <dt>Due time</dt>
                            <dd>
                              {formatDateTime(selectedBooking.sessionDueAt)}
                            </dd>
                            <dt>Completed</dt>
                            <dd>
                              {formatDateTime(
                                selectedBooking.sessionCompletedAt,
                              )}
                            </dd>
                          </dl>
                        </div>

                        {/* Action Control */}
                        <div className="today-inspector-section">
                          <h4>Lifecycle Action</h4>
                          {(() => {
                            const action = getApplicableAction(selectedBooking);
                            if (action) {
                              const isMutating =
                                mutatingBookingId === selectedBooking.id;
                              return (
                                <button
                                  type="button"
                                  className={`today-action-btn w-full ${action.tone === 'success' ? 'tone-success' : ''}`}
                                  onClick={() =>
                                    void handleRunMutation(
                                      selectedBooking,
                                      action.action,
                                    )
                                  }
                                  disabled={
                                    mutatingBookingId !== null || isMutating
                                  }
                                  data-testid={`inspector-action-${action.action}`}
                                >
                                  {isMutating ? 'Updating...' : action.label}
                                </button>
                              );
                            }

                            if (selectedBooking.stage === 'ready_to_pay') {
                              return (
                                <div
                                  className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 font-medium"
                                  data-testid="inspector-payment-pending-notice"
                                >
                                  Payment Pending — manage on web
                                </div>
                              );
                            }

                            if (
                              selectedBooking.stage === 'completed' ||
                              selectedBooking.status === 'completed'
                            ) {
                              return (
                                <p className="text-xs text-emerald-700 m-0 font-medium">
                                  Service completed. No further lifecycle
                                  actions required.
                                </p>
                              );
                            }

                            if (
                              ['cancelled', 'no_show'].includes(
                                selectedBooking.status,
                              )
                            ) {
                              return (
                                <p className="text-xs text-slate-500 m-0">
                                  Booking is closed ({selectedBooking.status}).
                                </p>
                              );
                            }

                            return (
                              <p className="text-xs text-slate-500 m-0">
                                No action available for current status.
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Tab Content: Readiness */}
                {inspectorTab === 'readiness' && (
                  <div
                    className="flex flex-col gap-3 p-3"
                    data-testid="today-readiness-panel"
                  >
                    {!data.readiness.available ? (
                      <div
                        className="today-degraded-panel"
                        role="region"
                        aria-label="Readiness unavailable"
                        data-testid="readiness-degraded"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={18} />
                          <h4>Readiness Service Unavailable</h4>
                        </div>
                        <p>
                          {data.readiness.error ||
                            'Authoritative operational readiness status could not be resolved for this branch.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            {data.readiness.status === 'ok' ? (
                              <ShieldCheck
                                size={18}
                                className="text-emerald-600"
                              />
                            ) : (
                              <ShieldAlert
                                size={18}
                                className={
                                  data.readiness.status === 'critical'
                                    ? 'text-red-600'
                                    : 'text-amber-600'
                                }
                              />
                            )}
                            <h3 className="text-sm font-bold text-slate-900 m-0">
                              Readiness Status
                            </h3>
                          </div>
                          <span
                            className={`booking-badge ${
                              data.readiness.status === 'ok'
                                ? 'badge-completed'
                                : data.readiness.status === 'critical'
                                  ? 'badge-cancelled'
                                  : 'badge-no-show'
                            }`}
                            data-testid="readiness-status-badge"
                          >
                            {data.readiness.status.toUpperCase()}
                          </span>
                        </div>

                        {data.readiness.issues.length === 0 ? (
                          <div
                            className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800"
                            data-testid="readiness-all-clear"
                          >
                            All operational readiness checks passing for this
                            branch.
                          </div>
                        ) : (
                          <div
                            className="today-card-list"
                            data-testid="readiness-issues-list"
                          >
                            {data.readiness.issues.map((issue) => (
                              <div
                                key={issue.id}
                                className="today-card-item"
                                data-testid={`readiness-issue-${issue.id}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="today-card-item-title">
                                    {issue.title}
                                  </span>
                                  <span
                                    className={`booking-badge ${
                                      issue.severity === 'critical'
                                        ? 'badge-cancelled'
                                        : 'badge-no-show'
                                    }`}
                                  >
                                    {issue.severity}
                                  </span>
                                </div>
                                <p className="today-card-item-desc">
                                  <strong>Problem:</strong> {issue.problem}
                                </p>
                                <p className="today-card-item-desc">
                                  <strong>Fix:</strong> {issue.fix}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Tab Content: Attendance */}
                {inspectorTab === 'attendance' && (
                  <div
                    className="flex flex-col gap-3 p-3"
                    data-testid="today-attendance-panel"
                  >
                    {!data.attendance.available ? (
                      <div
                        className="today-degraded-panel"
                        role="region"
                        aria-label="Attendance unavailable"
                        data-testid="attendance-degraded"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={18} />
                          <h4>Attendance Service Unavailable</h4>
                        </div>
                        <p>
                          {data.attendance.error ||
                            'Recent attendance scans could not be loaded.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="pb-2 border-b border-slate-200">
                          <h3 className="text-sm font-bold text-slate-900 m-0">
                            Recent Attendance Scans
                          </h3>
                          <p className="text-xs text-slate-500 m-0">
                            Scans in last hour: {data.attendance.lastHourCount}
                          </p>
                        </div>

                        {data.attendance.items.length === 0 ? (
                          <p
                            className="today-empty-subtext"
                            data-testid="attendance-empty"
                          >
                            No attendance scans recorded for this branch today.
                          </p>
                        ) : (
                          <div
                            className="today-card-list"
                            data-testid="attendance-items-list"
                          >
                            {data.attendance.items.map((scan) => (
                              <div
                                key={scan.eventId}
                                className="today-card-item"
                                data-testid={`attendance-item-${scan.eventId}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="today-card-item-title flex items-center gap-1">
                                    <ScanLine
                                      size={14}
                                      className="text-slate-500"
                                    />
                                    {scan.staffName}
                                  </span>
                                  <span className="booking-badge badge-confirmed">
                                    {scan.eventType.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>
                                    Time: {formatDateTime(scan.occurredAt)}
                                  </span>
                                  <span>{scan.sourceLabel || 'Scan'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Tab Content: Notifications */}
                {inspectorTab === 'notifications' && (
                  <div
                    className="flex flex-col gap-3 p-3"
                    data-testid="today-notifications-panel"
                  >
                    {!data.notifications.available ? (
                      <div
                        className="today-degraded-panel"
                        role="region"
                        aria-label="Notifications unavailable"
                        data-testid="notifications-degraded"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={18} />
                          <h4>Action Notifications Unavailable</h4>
                        </div>
                        <p>
                          {data.notifications.error ||
                            'Action-required notifications could not be retrieved.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="pb-2 border-b border-slate-200">
                          <h3 className="text-sm font-bold text-slate-900 m-0">
                            Action-Required Notifications
                          </h3>
                        </div>

                        {data.notifications.items.length === 0 ? (
                          <p
                            className="today-empty-subtext"
                            data-testid="notifications-empty"
                          >
                            No action-required notifications.
                          </p>
                        ) : (
                          <div
                            className="today-card-list"
                            data-testid="notifications-items-list"
                          >
                            {data.notifications.items.map((notif) => (
                              <div
                                key={notif.id}
                                className="today-card-item"
                                data-testid={`notification-item-${notif.id}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="today-card-item-title">
                                    {notif.title}
                                  </span>
                                  <span
                                    className={`booking-badge ${
                                      notif.priority === 'urgent'
                                        ? 'badge-cancelled'
                                        : notif.priority === 'high'
                                          ? 'badge-no-show'
                                          : 'badge-pending'
                                    }`}
                                  >
                                    {notif.priority}
                                  </span>
                                </div>
                                {notif.body && (
                                  <p className="today-card-item-desc">
                                    {notif.body}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </ModuleInspectorFrame>
            </ModuleInspectorColumn>
          </ModuleMainGrid>
        </>
      ) : null}
    </ModuleWorkspace>
  );
};
