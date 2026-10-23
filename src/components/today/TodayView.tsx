import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
} from 'lucide-react';
import type { AuthContext, NavModuleId } from '../../types/auth';
import type {
  DesktopTodayData,
  DesktopTodayQueueItem,
  TodayMutationAction,
} from '../../types/today';
import type { QuickBookingMode } from '../../types/bookings';
import { fetchToday, mutateToday } from '../../lib/today-service';
import { runWorkspaceRead } from '../../lib/workspace-read-coordinator';
import {
  BOOKING_WRITE_INVALIDATIONS,
  TODAY_OPERATIONAL_WRITE_INVALIDATIONS,
} from '../../lib/workspace-invalidation';
import {
  ModuleErrorBanner,
  ModuleLoadingState,
  ModulePagination,
  ModuleSuccessBanner,
  ModuleWorkspace,
  useWorkspaceInvalidation,
  useWorkspaceModuleLifecycle,
} from '../workspace';
import { NewBookingModal } from '../bookings/NewBookingModal';
import { calculateAdaptivePageSize } from './adaptive-page-size';
import { TodayActivityCard } from './TodayActivityCard';
import { TodayQuickActionsCard } from './TodayQuickActionsCard';
import { TodayMoneyCard } from './TodayMoneyCard';
import { TodayBookingInspectorCard } from './TodayBookingInspectorCard';
import { Input } from '../ui/input';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Button } from '../ui/button';

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
  const {
    isActive,
    invalidationGeneration,
    isDirty,
    hasValidatedData,
    isRefreshing,
    beginRefresh,
    completeRefresh,
    failRefresh,
  } = useWorkspaceModuleLifecycle();

  const invalidateModules = useWorkspaceInvalidation();
  const lastAutomaticAttemptGenerationRef = useRef<number | null>(null);

  const [data, setData] = useState<DesktopTodayData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<StageScopeFilter>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [mutatingBookingId, setMutatingBookingId] = useState<string | null>(
    null,
  );
  const [mutationNotice, setMutationNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const observerRef = useRef<ResizeObserver | null>(null);

  const tableContainerCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (node && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const height = entry.contentRect.height;
            if (height > 0) {
              const next = calculateAdaptivePageSize(height);
              setPageSize((prev) => (prev !== next ? next : prev));
            }
          }
        });
        observer.observe(node);
        observerRef.current = observer;
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingModalInitialMode, setBookingModalInitialMode] = useState<
    QuickBookingMode | undefined
  >(undefined);

  const loadTodaySnapshot = useCallback(
    (generation: number) =>
      runWorkspaceRead(
        {
          userId: authContext.userId,
          role: authContext.canonicalRole,
          branchId: authContext.branchId,
          dataset: 'today.snapshot',
          generation,
        },
        () => fetchToday(),
      ),
    [authContext.userId, authContext.canonicalRole, authContext.branchId],
  );

  const reconcileToday = useCallback(async (): Promise<boolean> => {
    const token = beginRefresh();
    setError(null);

    try {
      const result = await loadTodaySnapshot(token.generation);

      // Ignore obsolete responses or snapshots invalidated while in flight.
      if (!completeRefresh(token)) {
        return false;
      }

      setData(result);
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load authoritative Today workspace.';

      // Preserve existing validated Today data on reconciliation failure.
      if (failRefresh(token, message)) {
        setError(message);
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [beginRefresh, completeRefresh, failRefresh, loadTodaySnapshot]);

  // Initial authoritative validation. StrictMode duplicate callers share the
  // same in-flight hosted request through the workspace read coordinator.
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void reconcileToday();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reconcileToday]);

  // Dirty hidden Today stays quiet. Reconcile when it becomes active again.
  useEffect(() => {
    if (!isActive) {
      lastAutomaticAttemptGenerationRef.current = null;
      return;
    }

    if (!hasValidatedData || !isDirty || isRefreshing) {
      return;
    }

    if (lastAutomaticAttemptGenerationRef.current === invalidationGeneration) {
      return;
    }

    lastAutomaticAttemptGenerationRef.current = invalidationGeneration;

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void reconcileToday();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    hasValidatedData,
    invalidationGeneration,
    isActive,
    isDirty,
    isRefreshing,
    reconcileToday,
  ]);
  const handleStageFilterChange = (filter: StageScopeFilter) => {
    setStageFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleRefresh = useCallback(() => {
    setMutationNotice(null);
    void reconcileToday();
  }, [reconcileToday]);

  const handleRetry = useCallback(() => {
    if (!data) {
      setIsLoading(true);
    }

    void reconcileToday();
  }, [data, reconcileToday]);

  const handleOpenBookingModal = (mode?: QuickBookingMode) => {
    setBookingModalInitialMode(mode);
    setIsBookingModalOpen(true);
  };

  const handleBookingCreated = () => {
    setIsBookingModalOpen(false);
    setMutationNotice({
      type: 'success',
      message: 'Booking created successfully.',
    });

    invalidateModules(BOOKING_WRITE_INVALIDATIONS);
    void reconcileToday();
  };

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

      setMutationNotice({
        type: 'success',
        message:
          action === 'confirm_booking'
            ? 'Booking confirmed.'
            : action === 'mark_arrived'
              ? 'Arrival recorded.'
              : action === 'start_service'
                ? 'Service started.'
                : 'Service completed.',
      });

      // Mark only affected retained workspaces dirty after authoritative success.
      invalidateModules(TODAY_OPERATIONAL_WRITE_INVALIDATIONS);

      // Today is active, so reconcile it immediately. Hidden affected modules
      // retain their current data and reconcile when next activated.
      await reconcileToday();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Mutation failed. Please try again.';
      setMutationNotice({
        type: 'error',
        message: msg,
      });
    } finally {
      setMutatingBookingId(null);
    }
  };

  // Filtered queue based on lifecycle stage and search query
  const filteredQueue = useMemo(() => {
    if (!data) return [];
    return data.queue.filter((item) => {
      // Stage filtering
      if (stageFilter !== 'all') {
        if (stageFilter === 'waiting' && item.stage !== 'waiting') return false;
        if (stageFilter === 'in_service' && item.stage !== 'in_service')
          return false;
        if (stageFilter === 'ready_to_pay' && item.stage !== 'ready_to_pay')
          return false;
        if (stageFilter === 'completed' && item.stage !== 'completed')
          return false;
      }

      // Search query filtering
      if (search.trim()) {
        const query = search.toLowerCase().trim();
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

  // Pagination calculation
  const totalItems = filteredQueue.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedQueue = useMemo(
    () => filteredQueue.slice(startIndex, startIndex + pageSize),
    [filteredQueue, startIndex, pageSize],
  );
  const startRecord = totalItems === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + pageSize, totalItems);
  const selectedBooking =
    data?.queue.find((booking) => booking.id === selectedBookingId) ?? null;

  return (
    <ModuleWorkspace
      className="today-workspace-root"
      ariaLabel="Today Workspace"
      testId="today-workspace"
    >
      {/* Header Area */}
      <header className="today-header-row" data-testid="today-header">
        <div className="today-header-left">
          <h1 className="today-title">Intake</h1>
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
            Arrivals, booking actions, and the next front-desk step.
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
          <Button
            type="button"
            variant="outline"
            size="sm"
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
          </Button>
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
          onRetry={handleRetry}
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
                onClick={() => handleOpenBookingModal(undefined)}
                data-testid="action-card-new-booking"
              >
                <div className="today-action-card-icon-box">
                  <Plus size={18} aria-hidden="true" />
                </div>
                <div className="today-action-card-content">
                  <strong className="today-action-card-title">
                    New Booking
                  </strong>
                  <span className="today-action-card-desc">
                    Choose a booking type
                  </span>
                </div>
              </button>

              {/* Card 2: Walk-in */}
              <button
                type="button"
                className="today-action-card"
                onClick={() => handleOpenBookingModal('walkin')}
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
              </button>

              {/* Card 3: Book for Later */}
              <button
                type="button"
                className="today-action-card"
                onClick={() => handleOpenBookingModal('standard_future')}
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
              </button>

              {/* Card 4: Home Service */}
              <button
                type="button"
                className="today-action-card"
                onClick={() => handleOpenBookingModal('home_service')}
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
                      : 'Review booking options'}
                  </span>
                </div>
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
                  <h2 className="today-workflow-title">Arrivals & bookings</h2>
                  <p className="today-workflow-subtitle">
                    Find a booking, review its details, and take the permitted
                    next action.
                  </p>
                </div>
              </div>

              {/* Workflow Controls Row: Tabs + Search */}
              <div className="today-workflow-controls">
                {/* Workflow Tabs with Counts */}
                <ToggleGroup
                  type="single"
                  value={stageFilter}
                  onValueChange={(value) => {
                    if (value)
                      handleStageFilterChange(value as StageScopeFilter);
                  }}
                  className="today-workflow-tabs"
                  aria-label="Workflow lifecycle stages"
                >
                  <ToggleGroupItem
                    type="button"
                    value="waiting"
                    className={`today-wf-tab ${stageFilter === 'waiting' ? 'active' : ''}`}
                    data-testid="kpi-waiting"
                  >
                    <Hourglass size={14} aria-hidden="true" />
                    <span>Waiting</span>
                    <span className="today-wf-count">
                      {data.summary.waiting}
                    </span>
                  </ToggleGroupItem>

                  <ToggleGroupItem
                    type="button"
                    value="in_service"
                    className={`today-wf-tab ${stageFilter === 'in_service' ? 'active' : ''}`}
                    data-testid="kpi-in-service"
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    <span>In Service</span>
                    <span className="today-wf-count">
                      {data.summary.inService}
                    </span>
                  </ToggleGroupItem>

                  <ToggleGroupItem
                    type="button"
                    value="ready_to_pay"
                    className={`today-wf-tab ${stageFilter === 'ready_to_pay' ? 'active' : ''}`}
                    data-testid="kpi-ready-to-pay"
                  >
                    <CreditCard size={14} aria-hidden="true" />
                    <span>Ready to Pay</span>
                    <span className="today-wf-count">
                      {data.summary.readyToPay}
                    </span>
                  </ToggleGroupItem>

                  <ToggleGroupItem
                    type="button"
                    value="completed"
                    className={`today-wf-tab ${stageFilter === 'completed' ? 'active' : ''}`}
                    data-testid="kpi-completed"
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    <span>Completed</span>
                    <span className="today-wf-count">
                      {data.summary.completedService}
                    </span>
                  </ToggleGroupItem>

                  {/* All Queue filter option */}
                  <ToggleGroupItem
                    type="button"
                    value="all"
                    className={`today-wf-tab ${stageFilter === 'all' ? 'active' : ''}`}
                    data-testid="tab-all-queue"
                  >
                    <span>All</span>
                    <span className="today-wf-count">{data.summary.total}</span>
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Queue Search Input */}
                <div className="today-search-wrapper">
                  <Search
                    size={14}
                    className="today-search-icon"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    className="today-search-input"
                    placeholder="Search customer, booking ID, assignee..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    aria-label="Search today's bookings"
                    data-testid="today-search-input"
                  />
                </div>
              </div>

              {/* Queue Table Region */}
              <div
                className="today-table-container"
                ref={tableContainerCallbackRef}
                data-testid="today-table-container"
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
                      {paginatedQueue.map((booking) => {
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
                            className={`today-table-row ${selectedBookingId === booking.id ? 'today-table-row-selected' : ''}`}
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
                                  <button
                                    type="button"
                                    className="today-booking-select"
                                    onClick={() =>
                                      setSelectedBookingId(booking.id)
                                    }
                                    aria-pressed={
                                      selectedBookingId === booking.id
                                    }
                                    aria-label={`Review booking for ${booking.customerName || 'customer name unavailable'}`}
                                  >
                                    {booking.customerName ||
                                      'Customer name unavailable'}
                                  </button>
                                  <span className="today-secondary-text">
                                    {booking.customerPhone ||
                                      'No phone on record'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* SERVICE / SUMMARY */}
                            <td className="today-col-service">
                              <div className="today-cell-text">
                                <div className="today-primary-name-row">
                                  <strong className="today-primary-name">
                                    {booking.serviceName ||
                                      'Service unavailable'}
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
                                      'Room unavailable'}
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
                                            ? 'Dispatch details unavailable'
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
                            <td className="today-col-action">
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

              {/* In-Card Pagination Footer */}
              {totalItems > 0 && (
                <ModulePagination
                  startRecord={startRecord}
                  endRecord={endRecord}
                  totalItems={totalItems}
                  entityLabel="bookings"
                  pageSize={pageSize}
                  currentPage={validCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showPageSizeSelector={false}
                  className="today-pagination"
                  testId="today-pagination"
                />
              )}
            </section>
          </div>

          {/* Right Rail: 3 Independent Cards */}
          <aside
            className="today-right-rail"
            aria-label="Today contextual activity and actions"
            data-testid="today-right-rail"
          >
            <TodayBookingInspectorCard
              booking={selectedBooking}
              timeLabel={
                selectedBooking
                  ? `${formatClock(selectedBooking.startTime)}–${formatClock(selectedBooking.endTime)}`
                  : undefined
              }
              onOpenBookings={
                onNavigate ? () => onNavigate('bookings') : undefined
              }
            />
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

      {/* Canonical NewBookingModal for Upper Action Cards */}
      <NewBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        branchId={authContext.branchId}
        branchName={authContext.branchName}
        onBookingCreated={handleBookingCreated}
        initialMode={bookingModalInitialMode}
        showFinancialFields={false}
      />
    </ModuleWorkspace>
  );
};
