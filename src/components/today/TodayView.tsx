import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  Hourglass,
  Plus,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import type { AuthContext, NavModuleId } from '../../types/auth';
import type {
  DesktopTodayData,
  DesktopTodayQueueItem,
  TodayMutationAction,
} from '../../types/today';
import { fetchToday, mutateToday } from '../../lib/today-service';
import {
  ModuleErrorBanner,
  ModuleLoadingState,
  ModuleSuccessBanner,
  ModuleWorkspace,
} from '../workspace';
import { TodayActivityCard } from './TodayActivityCard';
import { TodayQuickActionsCard } from './TodayQuickActionsCard';
import { TodayMoneyCard } from './TodayMoneyCard';

export interface TodayViewProps {
  authContext: AuthContext;
  onNavigate?: (module: NavModuleId) => void;
}

type StageScopeFilter =
  'all' | 'waiting' | 'in_service' | 'ready_to_pay' | 'completed';

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

function getApplicableAction(booking: DesktopTodayQueueItem): {
  action: TodayMutationAction;
  label: string;
  tone: 'primary' | 'success';
} | null {
  // Home Service mutations are strictly excluded from the Today module
  if (booking.isHomeService) {
    return null;
  }

  // A. Checked-in booking -> Start Service
  if (booking.bookingProgressStatus === 'checked_in') {
    return {
      action: 'start_service',
      label: 'Start Service',
      tone: 'primary',
    };
  }

  // B. Started / in-service booking -> Complete Service
  if (
    booking.bookingProgressStatus === 'session_started' ||
    booking.status === 'in_progress' ||
    booking.stage === 'in_service'
  ) {
    return {
      action: 'complete_service',
      label: 'Complete Service',
      tone: 'success',
    };
  }

  // C. Confirmed + not started -> Mark Arrived
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

  // D. Other non-Home-Service booking in the waiting operational stage, still not started -> Confirm
  if (
    booking.stage === 'waiting' &&
    booking.bookingProgressStatus === 'not_started' &&
    booking.status !== 'confirmed'
  ) {
    return {
      action: 'confirm_booking',
      label: 'Confirm',
      tone: 'primary',
    };
  }

  return null;
}

function renderStageBadge(item: DesktopTodayQueueItem) {
  if (item.stage === 'waiting') {
    return <span className="today-badge badge-waiting">Waiting</span>;
  }
  if (item.stage === 'in_service' || item.status === 'in_progress') {
    return <span className="today-badge badge-in-service">In Service</span>;
  }
  if (item.stage === 'ready_to_pay') {
    return <span className="today-badge badge-payment">Payment Pending</span>;
  }
  if (item.stage === 'completed' || item.status === 'completed') {
    return <span className="today-badge badge-completed">Completed</span>;
  }
  if (item.status === 'confirmed') {
    return <span className="today-badge badge-confirmed">Confirmed</span>;
  }
  if (item.status === 'cancelled') {
    return <span className="today-badge badge-cancelled">Cancelled</span>;
  }
  if (item.status === 'no_show') {
    return <span className="today-badge badge-noshow">No Show</span>;
  }
  return <span className="today-badge badge-default">{item.status}</span>;
}

export const TodayView: React.FC<TodayViewProps> = ({
  authContext,
  onNavigate,
}) => {
  const [data, setData] = useState<DesktopTodayData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<StageScopeFilter>('all');
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
      className="today-workspace-root"
      ariaLabel="Today Workspace"
      testId="today-workspace"
    >
      {/* Header Area */}
      <header className="today-header-row" data-testid="today-header">
        <div className="today-header-left">
          <h1 className="today-title">Today</h1>
          <p className="today-subtitle">
            <span className="today-business-date">
              {formatDateLabel(data?.context.businessDate)}
            </span>
            <span className="today-separator">•</span>
            <span className="today-branch-name">
              {data?.context.branchName || authContext.branchName}
            </span>
          </p>
          <p className="today-helper-text">
            Prioritized front-desk work, without losing context.
          </p>
        </div>

        <div className="today-header-right">
          {/* Static Front Desk View Indicator */}
          <div
            className="today-view-selector"
            title="Front Desk View"
            data-testid="today-view-selector"
          >
            <UserRound size={14} aria-hidden="true" />
            <span>Front Desk View</span>
          </div>

          {/* Manual Refresh Action */}
          <button
            type="button"
            className="today-refresh-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh Today snapshot"
            title="Refresh Today snapshot"
            data-testid="today-refresh-button"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'animate-spin' : ''}
              aria-hidden="true"
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

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
          showInspectorSkeleton={false}
          testId="today-loading-skeleton"
        />
      ) : data ? (
        <div className="today-page-grid" data-testid="today-page-grid">
          {/* Main Column */}
          <div className="today-main-col" data-testid="today-main-col">
            {/* Front-Desk Action Strip */}
            <section
              className="today-action-strip"
              aria-label="Front-desk quick actions"
              data-testid="today-action-strip"
            >
              {/* Card 1: New Booking (Primary) */}
              <button
                type="button"
                className="today-action-card today-action-card-primary"
                onClick={() => onNavigate?.('bookings')}
                data-testid="action-card-new-booking"
              >
                <div className="today-action-card-icon-box">
                  <Plus size={18} aria-hidden="true" />
                </div>
                <div className="today-action-card-content">
                  <strong className="today-action-card-title">
                    New Booking
                  </strong>
                  <span className="today-action-card-desc">Open Bookings</span>
                </div>
                <span className="today-action-card-key" aria-hidden="true">
                  F1
                </span>
              </button>

              {/* Card 2: Walk-in */}
              <button
                type="button"
                className="today-action-card"
                onClick={() => onNavigate?.('bookings')}
                data-testid="action-card-walk-in"
              >
                <div className="today-action-card-icon-box">
                  <UserRound size={18} aria-hidden="true" />
                </div>
                <div className="today-action-card-content">
                  <strong className="today-action-card-title">Walk-in</strong>
                  <span className="today-action-card-desc">
                    Start an in-spa visit
                  </span>
                </div>
                <span className="today-action-card-key" aria-hidden="true">
                  F2
                </span>
              </button>

              {/* Card 3: Book for Later */}
              <button
                type="button"
                className="today-action-card"
                onClick={() => onNavigate?.('bookings')}
                data-testid="action-card-book-later"
              >
                <div className="today-action-card-icon-box">
                  <CalendarPlus size={18} aria-hidden="true" />
                </div>
                <div className="today-action-card-content">
                  <strong className="today-action-card-title">
                    Book for Later
                  </strong>
                  <span className="today-action-card-desc">
                    Phone or future booking
                  </span>
                </div>
                <span className="today-action-card-key" aria-hidden="true">
                  F3
                </span>
              </button>

              {/* Card 4: Home Service */}
              <button
                type="button"
                className="today-action-card"
                onClick={() => onNavigate?.('home-service')}
                data-testid="kpi-home-service"
              >
                <div className="today-action-card-icon-box">
                  <Truck size={18} aria-hidden="true" />
                </div>
                <div className="today-action-card-content">
                  <strong className="today-action-card-title">
                    Home Service
                  </strong>
                  <span className="today-action-card-desc">
                    {data.summary.homeService > 0
                      ? `${data.summary.homeService} dispatch booking${data.summary.homeService === 1 ? '' : 's'}`
                      : 'Open dispatch workspace'}
                  </span>
                </div>
                <span className="today-action-card-key" aria-hidden="true">
                  F4
                </span>
              </button>
            </section>

            {/* Operational Readiness / Unassigned Alerts Strip */}
            {!data.readiness.available ? (
              <div
                className="today-alert-strip today-alert-degraded"
                role="status"
                data-testid="readiness-degraded"
              >
                <AlertTriangle size={15} aria-hidden="true" />
                <span>
                  Readiness evaluation service offline:{' '}
                  {data.readiness.error || 'unavailable'}
                </span>
              </div>
            ) : data.readiness.status === 'ok' ? (
              <span
                className="sr-only"
                data-testid="readiness-all-clear"
                aria-hidden="true"
              >
                Readiness operational
              </span>
            ) : (
              <div
                className="today-alert-strip today-alert-warning"
                role="status"
                data-testid="readiness-warning"
              >
                <AlertTriangle size={15} aria-hidden="true" />
                <span>
                  {data.readiness.issues.length} readiness issue
                  {data.readiness.issues.length === 1 ? '' : 's'} require
                  front-desk attention
                </span>
              </div>
            )}

            {data.summary.unassigned > 0 && (
              <div
                className="today-alert-strip today-alert-info"
                data-testid="kpi-unassigned"
              >
                <AlertCircle size={14} aria-hidden="true" />
                <span>
                  <strong>{data.summary.unassigned}</strong> booking
                  {data.summary.unassigned === 1 ? '' : 's'} currently
                  unassigned
                </span>
              </div>
            )}

            {/* Active Service Workflow Card */}
            <section
              className="today-workflow-card"
              aria-label="Active Service Workflow"
              data-testid="today-workflow-card"
            >
              {/* Card Title & Subtitle */}
              <div className="today-workflow-header">
                <div>
                  <h2 className="today-workflow-title">
                    Active Service Workflow
                  </h2>
                  <p className="today-workflow-subtitle">
                    One clear next action for every customer visit.
                  </p>
                </div>
              </div>

              {/* Workflow Controls Row: Tabs + Search */}
              <div className="today-workflow-controls">
                {/* Workflow Tabs with Counts */}
                <div
                  className="today-workflow-tabs"
                  role="tablist"
                  aria-label="Workflow lifecycle stages"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={stageFilter === 'waiting'}
                    className={`today-wf-tab ${stageFilter === 'waiting' ? 'active' : ''}`}
                    onClick={() => setStageFilter('waiting')}
                    data-testid="kpi-waiting"
                  >
                    <Hourglass size={14} aria-hidden="true" />
                    <span>Waiting</span>
                    <span className="today-wf-count">
                      {data.summary.waiting}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={stageFilter === 'in_service'}
                    className={`today-wf-tab ${stageFilter === 'in_service' ? 'active' : ''}`}
                    onClick={() => setStageFilter('in_service')}
                    data-testid="kpi-in-service"
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    <span>In Service</span>
                    <span className="today-wf-count">
                      {data.summary.inService}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={stageFilter === 'ready_to_pay'}
                    className={`today-wf-tab ${stageFilter === 'ready_to_pay' ? 'active' : ''}`}
                    onClick={() => setStageFilter('ready_to_pay')}
                    data-testid="kpi-ready-to-pay"
                  >
                    <CreditCard size={14} aria-hidden="true" />
                    <span>Ready to Pay</span>
                    <span className="today-wf-count">
                      {data.summary.readyToPay}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={stageFilter === 'completed'}
                    className={`today-wf-tab ${stageFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setStageFilter('completed')}
                    data-testid="kpi-completed"
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    <span>Completed</span>
                    <span className="today-wf-count">
                      {data.summary.completedService}
                    </span>
                  </button>

                  {/* All Queue filter option */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={stageFilter === 'all'}
                    className={`today-wf-tab ${stageFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStageFilter('all')}
                    data-testid="tab-all-queue"
                  >
                    <span>All ({data.queue.length})</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="today-search-wrapper">
                  <Search
                    size={14}
                    className="today-search-icon"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    className="today-search-input"
                    placeholder="Search customer, booking ID, assignee..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search today's bookings"
                    data-testid="today-search-input"
                  />
                </div>
              </div>

              {/* Table DataGrid Frame */}
              <div
                className="today-table-container"
                data-testid="today-datagrid-frame"
              >
                {filteredQueue.length === 0 ? (
                  <div
                    className="today-table-empty"
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
                  <table
                    className="today-queue-table"
                    aria-label="Today's booking queue"
                    data-testid="today-queue-table"
                  >
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: '110px' }}>
                          Time
                        </th>
                        <th scope="col" style={{ width: '22%' }}>
                          Customer
                        </th>
                        <th scope="col" style={{ width: '25%' }}>
                          Service / Summary
                        </th>
                        <th scope="col" style={{ width: '130px' }}>
                          Status
                        </th>
                        <th scope="col" style={{ width: '20%' }}>
                          Assignee
                        </th>
                        <th scope="col" style={{ minWidth: '130px' }}>
                          Next Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQueue.map((booking) => {
                        const isSelected = booking.id === selectedId;
                        const action = getApplicableAction(booking);
                        const isMutating = mutatingBookingId === booking.id;

                        const customerInitials =
                          booking.customerName
                            ?.split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((p) => p[0]?.toUpperCase())
                            .join('') || 'WK';

                        const staffInitials =
                          booking.staffName
                            ?.split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((p) => p[0]?.toUpperCase())
                            .join('') || 'UN';

                        return (
                          <tr
                            key={booking.id}
                            className={`today-table-row ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedId(booking.id)}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedId(booking.id);
                              }
                            }}
                            data-testid={`today-row-${booking.id}`}
                          >
                            {/* TIME */}
                            <td className="today-col-time">
                              <div className="today-time-wrap">
                                <span
                                  className={`today-status-dot ${booking.stage || 'waiting'}`}
                                  aria-hidden="true"
                                />
                                <strong>
                                  {formatClock(booking.startTime)}
                                </strong>
                              </div>
                              {booking.isHomeService && (
                                <span className="today-home-tag">
                                  Home Service
                                </span>
                              )}
                            </td>

                            {/* CUSTOMER */}
                            <td className="today-col-customer">
                              <div className="today-avatar-wrap">
                                <span
                                  className="today-avatar-circle"
                                  aria-hidden="true"
                                >
                                  {customerInitials}
                                </span>
                                <div className="today-cell-text">
                                  <strong className="today-primary-name">
                                    {booking.customerName || 'Walk-in Customer'}
                                  </strong>
                                  <span className="today-secondary-text">
                                    {booking.customerPhone || 'Front Desk'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* SERVICE / SUMMARY */}
                            <td className="today-col-service">
                              <div className="today-cell-text">
                                <div className="today-primary-name-row">
                                  <strong className="today-primary-name">
                                    {booking.serviceName || 'Standard Service'}
                                  </strong>
                                  {booking.serviceDuration ? (
                                    <span className="today-service-duration">
                                      {' '}
                                      • {booking.serviceDuration} min
                                    </span>
                                  ) : null}
                                </div>
                                <span className="today-secondary-text">
                                  {booking.isHomeService
                                    ? booking.homeServiceAddress ||
                                      'Home dispatch'
                                    : booking.resourceName ||
                                      'Standard Treatment'}
                                </span>
                              </div>
                            </td>

                            {/* STATUS */}
                            <td className="today-col-status">
                              {renderStageBadge(booking)}
                            </td>

                            {/* ASSIGNEE */}
                            <td className="today-col-assignee">
                              <div className="today-avatar-wrap">
                                <span
                                  className="today-avatar-circle today-avatar-staff"
                                  aria-hidden="true"
                                >
                                  {staffInitials}
                                </span>
                                <div className="today-cell-text">
                                  <strong className="today-primary-name">
                                    {booking.staffName || (
                                      <span className="text-amber-700">
                                        Unassigned
                                      </span>
                                    )}
                                  </strong>
                                  <span className="today-secondary-text">
                                    {booking.isHomeService ? (
                                      <>
                                        {booking.dispatchContextAvailable ===
                                          false && (
                                          <span className="text-[10px] text-amber-800 font-medium block">
                                            Dispatch unavailable
                                          </span>
                                        )}
                                        {booking.dispatchContextAvailable !==
                                          false &&
                                          booking.noDriverWarning && (
                                            <span className="text-[10px] text-red-700 font-medium block">
                                              No driver assigned
                                            </span>
                                          )}
                                        {booking.driverName
                                          ? `Driver: ${booking.driverName}`
                                          : !booking.dispatchContextAvailable
                                            ? 'Home Dispatch'
                                            : 'No driver assigned'}
                                      </>
                                    ) : (
                                      booking.resourceName || 'No room assigned'
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* NEXT ACTION */}
                            <td
                              className="today-col-action"
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
                  </table>
                )}
              </div>

              {/* Selected Booking Detail Section (Section 20 Preservation) */}
              {selectedBooking && (
                <div
                  className="today-selected-booking-card"
                  data-testid="selected-booking-detail"
                >
                  <div className="today-selected-header">
                    <div className="today-selected-title-wrap">
                      <h4 className="today-selected-title">
                        Booking Details —{' '}
                        {selectedBooking.customerName || 'Walk-in Customer'}
                      </h4>
                      <span className="today-selected-id">
                        ID: {selectedBooking.id}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="today-selected-close-btn"
                      onClick={() => setSelectedId(null)}
                      aria-label="Close booking details"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="today-selected-body">
                    <div className="today-selected-grid">
                      <div>
                        <span className="today-detail-label">Time</span>
                        <strong className="today-detail-value">
                          {formatClock(selectedBooking.startTime)} –{' '}
                          {formatClock(selectedBooking.endTime)}
                        </strong>
                      </div>
                      <div>
                        <span className="today-detail-label">Service</span>
                        <strong className="today-detail-value">
                          {selectedBooking.serviceName || 'Standard Service'} (
                          {selectedBooking.serviceDuration || 60}m)
                        </strong>
                      </div>
                      <div>
                        <span className="today-detail-label">Staff Member</span>
                        <strong className="today-detail-value">
                          {selectedBooking.staffName || 'Unassigned'}
                        </strong>
                      </div>
                      <div>
                        <span className="today-detail-label">
                          Room / Resource
                        </span>
                        <strong className="today-detail-value">
                          {selectedBooking.resourceName || 'None assigned'}
                        </strong>
                      </div>
                      <div>
                        <span className="today-detail-label">Contact</span>
                        <strong className="today-detail-value">
                          {selectedBooking.customerPhone || 'None'}
                        </strong>
                      </div>
                      <div>
                        <span className="today-detail-label">Stage</span>
                        <div className="mt-1">
                          {renderStageBadge(selectedBooking)}
                        </div>
                      </div>
                    </div>

                    {selectedBooking.isHomeService && (
                      <div className="today-selected-hs-info">
                        <strong>Home Service Dispatch</strong>
                        <p>
                          Address:{' '}
                          {selectedBooking.homeServiceAddress ||
                            'Not specified'}
                        </p>
                        {selectedBooking.dispatchContextAvailable === false && (
                          <p className="text-amber-800 font-medium">
                            Dispatch context unavailable on desktop
                          </p>
                        )}
                        {selectedBooking.driverName && (
                          <p>Driver: {selectedBooking.driverName}</p>
                        )}
                      </div>
                    )}

                    {selectedBooking.stage === 'ready_to_pay' && (
                      <div className="today-selected-payment-notice">
                        <span
                          className="today-read-only-pill"
                          data-testid="inspector-payment-pending-notice"
                        >
                          Payment Pending — manage on web
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right Rail: 3 Independent Cards */}
          <aside
            className="today-right-rail"
            aria-label="Today contextual activity and actions"
            data-testid="today-right-rail"
          >
            {/* Card 1: Activity */}
            <TodayActivityCard
              attendance={data.attendance}
              notifications={data.notifications}
              onNavigate={onNavigate}
            />

            {/* Card 2: Quick Actions */}
            <TodayQuickActionsCard onNavigate={onNavigate} />

            {/* Card 3: Today's Money */}
            <TodayMoneyCard />
          </aside>
        </div>
      ) : null}
    </ModuleWorkspace>
  );
};
