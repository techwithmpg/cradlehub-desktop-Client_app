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
  Calendar,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  DoorClosed,
  Eye,
  GanttChart,
  List,
  Play,
  Plus,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  Users,
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
import { TodayArrivalsQueueCard } from './TodayArrivalsQueueCard';
import { TodayQuickActionsCard } from './TodayQuickActionsCard';
import { TodayBookingInspectorCard } from './TodayBookingInspectorCard';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export interface TodayViewProps {
  authContext: AuthContext;
  onNavigate?: (module: NavModuleId) => void;
}

type StageScopeFilter =
  'all' | 'waiting' | 'in_service' | 'ready_to_pay' | 'completed';

type ViewMode = 'timeline' | 'list';

function formatClock(value: string | null | undefined): string {
  if (!value) return '—';
  const [hoursStr, minutesStr] = value.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function formatDateHeader(dateString?: string): string {
  if (!dateString) return 'Date unavailable';
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const THERAPIST_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700',
];

function getTherapistColor(name: string | null | undefined): string {
  if (!name) return 'bg-slate-100 text-slate-700';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % THERAPIST_COLORS.length;
  return THERAPIST_COLORS[index];
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

function getTimelineBarColor(item: DesktopTodayQueueItem): string {
  if (item.bookingProgressStatus === 'checked_in') return 'bg-emerald-500';
  if (item.status === 'arrived') return 'bg-blue-500';
  if (item.stage === 'in_service' || item.status === 'in_progress')
    return 'bg-purple-500';
  if (item.stage === 'waiting') return 'bg-amber-500';
  if (item.stage === 'ready_to_pay') return 'bg-orange-500';
  if (item.stage === 'completed' || item.status === 'completed')
    return 'bg-emerald-600';
  if (item.status === 'confirmed') return 'bg-emerald-500';
  return 'bg-slate-300';
}

function renderStageBadge(item: DesktopTodayQueueItem) {
  if (item.bookingProgressStatus === 'checked_in') {
    return <span className="today-badge badge-in-service">Checked In</span>;
  }
  if (item.status === 'arrived') {
    return <span className="today-badge badge-confirmed">Arrived</span>;
  }
  if (item.stage === 'in_service' || item.status === 'in_progress') {
    return <span className="today-badge badge-in-service">In Service</span>;
  }
  if (item.stage === 'waiting') {
    return <span className="today-badge badge-waiting">Waiting</span>;
  }
  if (item.stage === 'ready_to_pay') {
    return <span className="today-badge badge-payment">Ready to Pay</span>;
  }
  if (item.stage === 'completed' || item.status === 'completed') {
    return <span className="today-badge badge-completed">Completed</span>;
  }
  if (item.status === 'confirmed') {
    return <span className="today-badge badge-default">Scheduled</span>;
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

  // Filters & State
  const [search, setSearch] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<StageScopeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [therapistFilter, setTherapistFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

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
  const visibleQueueStateRef = useRef({
    stageFilter,
    search,
    currentPage,
    pageSize,
  });
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    visibleQueueStateRef.current = {
      stageFilter,
      search,
      currentPage,
      pageSize,
    };
  }, [stageFilter, search, currentPage, pageSize]);

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

  const filterQueue = useCallback(
    (
      queue: DesktopTodayQueueItem[],
      stage: StageScopeFilter,
      searchQuery: string,
      status: string,
      serviceType: string,
      therapist: string,
    ): DesktopTodayQueueItem[] => {
      return queue.filter((item) => {
        // Stage filter
        if (stage !== 'all') {
          if (stage === 'waiting') {
            const isWaitingOrArrived =
              item.stage === 'waiting' ||
              item.status === 'confirmed' ||
              item.bookingProgressStatus === 'checked_in' ||
              item.status === 'arrived';
            if (!isWaitingOrArrived) return false;
          } else if (stage === 'in_service') {
            if (item.stage !== 'in_service' && item.status !== 'in_progress')
              return false;
          } else if (stage === 'ready_to_pay') {
            if (item.stage !== 'ready_to_pay') return false;
          } else if (stage === 'completed') {
            if (item.stage !== 'completed' && item.status !== 'completed')
              return false;
          }
        }

        // Status dropdown filter
        if (status !== 'all') {
          if (status === 'scheduled' && item.status !== 'confirmed')
            return false;
          if (status === 'arrived' && item.status !== 'arrived') return false;
          if (
            status === 'checked_in' &&
            item.bookingProgressStatus !== 'checked_in'
          )
            return false;
          if (
            status === 'in_service' &&
            item.stage !== 'in_service' &&
            item.status !== 'in_progress'
          )
            return false;
          if (status === 'ready_to_pay' && item.stage !== 'ready_to_pay')
            return false;
          if (status === 'completed' && item.status !== 'completed')
            return false;
          if (status === 'cancelled' && item.status !== 'cancelled')
            return false;
          if (status === 'no_show' && item.status !== 'no_show') return false;
        }

        // Service Type filter
        if (serviceType !== 'all') {
          if (
            !item.serviceName?.toLowerCase().includes(serviceType.toLowerCase())
          ) {
            return false;
          }
        }

        // Therapist filter
        if (therapist !== 'all') {
          if (
            item.staffName?.toLowerCase() !== therapist.toLowerCase() &&
            item.staffId !== therapist
          ) {
            return false;
          }
        }

        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchesCustomer = item.customerName
            ?.toLowerCase()
            .includes(query);
          const matchesPhone = item.customerPhone
            ?.toLowerCase()
            .includes(query);
          const matchesService = item.serviceName
            ?.toLowerCase()
            .includes(query);
          const matchesStaff = item.staffName?.toLowerCase().includes(query);
          const matchesResource = item.resourceName
            ?.toLowerCase()
            .includes(query);
          const matchesAddress = item.homeServiceAddress
            ?.toLowerCase()
            .includes(query);
          const matchesId = item.id.toLowerCase().includes(query);

          if (
            !matchesCustomer &&
            !matchesPhone &&
            !matchesService &&
            !matchesStaff &&
            !matchesResource &&
            !matchesAddress &&
            !matchesId
          ) {
            return false;
          }
        }

        return true;
      });
    },
    [],
  );

  const reconcileToday = useCallback(async (): Promise<boolean> => {
    const token = beginRefresh();
    setError(null);

    try {
      const result = await loadTodaySnapshot(token.generation);

      if (!completeRefresh(token)) {
        return false;
      }

      const visibleState = visibleQueueStateRef.current;
      const filtered = filterQueue(
        result.queue,
        visibleState.stageFilter,
        visibleState.search,
        statusFilter,
        serviceTypeFilter,
        therapistFilter,
      );
      const page = Math.min(
        Math.max(1, visibleState.currentPage),
        Math.max(1, Math.ceil(filtered.length / visibleState.pageSize)),
      );
      const start = (page - 1) * visibleState.pageSize;
      const visibleBookings = filtered.slice(
        start,
        start + visibleState.pageSize,
      );
      setData(result);
      setSelectedBookingId((current) =>
        current && visibleBookings.some((booking) => booking.id === current)
          ? current
          : null,
      );
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load authoritative Today workspace.';

      if (failRefresh(token, message)) {
        setError(message);
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    beginRefresh,
    completeRefresh,
    failRefresh,
    filterQueue,
    loadTodaySnapshot,
    serviceTypeFilter,
    statusFilter,
    therapistFilter,
  ]);

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
    void reconcileToday();
  }, [
    isActive,
    hasValidatedData,
    isDirty,
    isRefreshing,
    invalidationGeneration,
    reconcileToday,
  ]);

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

  const handleOpenBookingModal = useCallback((mode?: QuickBookingMode) => {
    setBookingModalInitialMode(mode);
    setIsBookingModalOpen(true);
  }, []);

  const handleBookingCreated = useCallback(() => {
    invalidateModules(BOOKING_WRITE_INVALIDATIONS);
    void reconcileToday();
  }, [invalidateModules, reconcileToday]);

  const handleMutateAction = useCallback(
    async (action: TodayMutationAction, bookingId: string) => {
      setMutatingBookingId(bookingId);
      setMutationNotice(null);

      try {
        await mutateToday({ action, bookingId });
        invalidateModules(TODAY_OPERATIONAL_WRITE_INVALIDATIONS);
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
        await reconcileToday();
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to update booking status.';
        setMutationNotice({
          type: 'error',
          message,
        });
      } finally {
        setMutatingBookingId(null);
      }
    },
    [invalidateModules, reconcileToday],
  );

  const handleStageFilterChange = useCallback((newFilter: StageScopeFilter) => {
    setStageFilter(newFilter);
    setCurrentPage(1);
    setSelectedBookingId(null);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setCurrentPage(1);
      setSelectedBookingId(null);
    },
    [],
  );

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    if (!data) return [];
    return filterQueue(
      data.queue,
      stageFilter,
      search,
      statusFilter,
      serviceTypeFilter,
      therapistFilter,
    );
  }, [
    data,
    filterQueue,
    search,
    serviceTypeFilter,
    stageFilter,
    statusFilter,
    therapistFilter,
  ]);

  // Unique service types & therapists for toolbar filters
  const uniqueServices = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const item of data.queue) {
      if (item.serviceName) set.add(item.serviceName);
    }
    return Array.from(set);
  }, [data]);

  const uniqueTherapists = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, string>();
    for (const item of data.queue) {
      if (item.staffId && item.staffName) {
        map.set(item.staffId, item.staffName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    if (!data) {
      return {
        arrivalsCount: 0,
        checkedInCount: 0,
        waitingCount: 0,
        inServiceCount: 0,
        readyToPayCount: 0,
        completedCount: 0,
      };
    }
    let checkedIn = 0;
    let waiting = 0;
    let inService = 0;
    let readyToPay = 0;
    let completed = 0;

    for (const item of data.queue) {
      if (item.bookingProgressStatus === 'checked_in') {
        checkedIn++;
      } else if (item.stage === 'waiting' || item.status === 'confirmed') {
        waiting++;
      }
      if (item.stage === 'in_service' || item.status === 'in_progress') {
        inService++;
      }
      if (item.stage === 'ready_to_pay') {
        readyToPay++;
      }
      if (item.stage === 'completed' || item.status === 'completed') {
        completed++;
      }
    }

    return {
      arrivalsCount: data.summary?.waiting ?? checkedIn + waiting,
      checkedInCount: checkedIn,
      waitingCount: waiting,
      inServiceCount: data.summary?.inService ?? inService,
      readyToPayCount: data.summary?.readyToPay ?? readyToPay,
      completedCount:
        data.summary?.completedService ?? data.summary?.completed ?? completed,
    };
  }, [data]);

  // Selected Booking
  const selectedBooking = useMemo(() => {
    if (!selectedBookingId || !data) return null;
    return data.queue.find((b) => b.id === selectedBookingId) || null;
  }, [data, selectedBookingId]);

  // Pagination calculation
  const totalItems = filteredQueue.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startRecord =
    totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(validCurrentPage * pageSize, totalItems);

  const paginatedQueue = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, pageSize, validCurrentPage]);

  return (
    <ModuleWorkspace
      className="today-workspace-container"
      testId="today-workspace"
    >
      {/* 1. Header Area Matching Design Reference */}
      <header className="today-page-header" data-testid="today-header">
        <div className="today-header-left">
          <div className="today-brand-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#064e3b]"
            >
              <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.6 4.5 8.4-.2-1.4 0-2.8.5-4.1C8 13.5 10 11 12 11c2.5 0 4.5 2 4.5 4.5 0 1.2-.5 2.3-1.2 3.1 2.3-1.6 3.7-4.2 3.7-7.1 0-5.5-4.5-9.5-7-9.5z" />
            </svg>
          </div>
          <div>
            <h1 className="today-page-title">Today</h1>
            <p className="today-page-subtitle">
              Intake, arrivals, and today's front-desk workflow
            </p>
          </div>
        </div>

        <div className="today-header-right">
          {/* Accessible context tags for test contract / screen reader continuity without visual duplication */}
          <span className="sr-only">{authContext.branchName}</span>
          <span className="sr-only" data-testid="today-view-selector">
            Front Desk View
          </span>

          {/* Authoritative Business Date Pill */}
          <div className="today-header-pill">
            <Calendar size={15} className="text-slate-500" aria-hidden="true" />
            <span className="font-medium text-slate-700">
              {formatDateHeader(data?.context?.businessDate)}
            </span>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="today-refresh-btn"
            data-testid="today-refresh-button"
            title="Refresh Today workspace"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'animate-spin' : ''}
              aria-hidden="true"
            />
          </Button>
        </div>
      </header>

      {/* Mutation Notices */}
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
        <div className="today-intake-body">
          {/* Top Row: 4 Action Cards + Customer Search */}
          <div className="today-top-row">
            {/* 4 Action Cards Strip */}
            <section
              className="today-action-strip"
              aria-label="Front-desk booking actions"
              data-testid="today-action-strip"
            >
              {/* Card 1: New Booking (Dark Forest Green) */}
              <button
                type="button"
                className="today-action-card today-action-card-primary"
                onClick={() => handleOpenBookingModal(undefined)}
                data-testid="action-card-new-booking"
              >
                <div className="today-action-card-icon-box">
                  <Plus size={20} aria-hidden="true" />
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
                <div className="today-action-card-icon-box bg-emerald-50 text-emerald-700">
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
                onClick={() => handleOpenBookingModal('phone')}
                data-testid="action-card-book-later"
              >
                <div className="today-action-card-icon-box bg-blue-50 text-blue-700">
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
                <div className="today-action-card-icon-box bg-emerald-50 text-emerald-700">
                  <Truck size={18} aria-hidden="true" />
                </div>
                <div className="today-action-card-content">
                  <strong className="today-action-card-title">
                    Home Service
                  </strong>
                  <span className="today-action-card-desc">
                    {data.summary.homeService > 0
                      ? `${data.summary.homeService} dispatch booking${data.summary.homeService === 1 ? '' : 's'}`
                      : 'Outcall booking'}
                  </span>
                </div>
              </button>
            </section>

            {/* Top-Right Customer Search */}
            <div className="today-customer-search-top">
              <div className="today-search-wrapper">
                <Search
                  size={16}
                  className="today-search-icon"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  placeholder="Search today's bookings..."
                  value={search}
                  onChange={handleSearchChange}
                  className="today-search-input"
                  data-testid="today-search-input"
                  aria-label="Search today's bookings"
                />
              </div>
            </div>
          </div>

          {/* Operational Alerts Strip */}
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
                {data.summary.unassigned === 1 ? '' : 's'} currently unassigned
              </span>
            </div>
          )}

          {/* Second Row: 4 Operational KPI Cards */}
          <section
            className="today-kpi-grid"
            aria-label="Operational KPI summary"
          >
            {/* Card 1: Arrivals Today */}
            <button
              type="button"
              className={`today-kpi-card ${stageFilter === 'waiting' ? 'active' : ''}`}
              onClick={() => handleStageFilterChange('waiting')}
              data-testid="kpi-waiting"
            >
              <div className="today-kpi-icon-box bg-blue-50 text-blue-600">
                <Users size={20} aria-hidden="true" />
              </div>
              <div className="today-kpi-details">
                <span className="today-kpi-label">Arrivals Today</span>
                <span className="today-kpi-value">{data.summary.waiting}</span>
                <span className="today-kpi-subtext">
                  {kpiStats.checkedInCount} checked in · {kpiStats.waitingCount}{' '}
                  waiting
                </span>
              </div>
            </button>

            {/* Card 2: In Service */}
            <button
              type="button"
              className={`today-kpi-card ${stageFilter === 'in_service' ? 'active' : ''}`}
              onClick={() => handleStageFilterChange('in_service')}
              data-testid="kpi-in-service"
            >
              <div className="today-kpi-icon-box bg-amber-50 text-amber-600">
                <Clock size={20} aria-hidden="true" />
              </div>
              <div className="today-kpi-details">
                <span className="today-kpi-label">In Service</span>
                <span className="today-kpi-value">
                  {data.summary.inService}
                </span>
                <span className="today-kpi-subtext">
                  Currently receiving service
                </span>
              </div>
            </button>

            {/* Card 3: Ready to Pay */}
            <button
              type="button"
              className={`today-kpi-card ${stageFilter === 'ready_to_pay' ? 'active' : ''}`}
              onClick={() => handleStageFilterChange('ready_to_pay')}
              data-testid="kpi-ready-to-pay"
            >
              <div className="today-kpi-icon-box bg-emerald-50 text-emerald-600">
                <CreditCard size={20} aria-hidden="true" />
              </div>
              <div className="today-kpi-details">
                <span className="today-kpi-label">Ready to Pay</span>
                <span className="today-kpi-value">
                  {data.summary.readyToPay}
                </span>
                <span className="today-kpi-subtext">Services completed</span>
              </div>
            </button>

            {/* Card 4: Completed */}
            <button
              type="button"
              className={`today-kpi-card ${stageFilter === 'completed' ? 'active' : ''}`}
              onClick={() => handleStageFilterChange('completed')}
              data-testid="kpi-completed"
            >
              <div className="today-kpi-icon-box bg-green-50 text-green-600">
                <CheckCircle2 size={20} aria-hidden="true" />
              </div>
              <div className="today-kpi-details">
                <span className="today-kpi-label">Completed</span>
                <span className="today-kpi-value">
                  {data.summary.completedService ?? data.summary.completed}
                </span>
                <span className="today-kpi-subtext">
                  Today's finished visits
                </span>
              </div>
            </button>
          </section>

          {/* Third Area: Main Schedule on Left, Operational Rail on Right */}
          <div className="today-main-layout" data-testid="today-page-grid">
            {/* Left Column: Today's Schedule Card */}
            <section
              className={`today-schedule-card ${filteredQueue.length === 0 ? 'is-empty' : ''}`}
              aria-label="Today's Schedule"
              data-testid="today-workflow-card"
            >
              {/* Top Navigation Tabs */}
              <div className="today-schedule-tabs-bar">
                <button
                  type="button"
                  className={`today-sched-tab ${stageFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleStageFilterChange('all')}
                  data-testid="tab-all-queue"
                >
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>Today's Schedule</span>
                </button>

                <button
                  type="button"
                  className={`today-sched-tab ${stageFilter === 'waiting' ? 'active' : ''}`}
                  onClick={() => handleStageFilterChange('waiting')}
                  data-testid="tab-arrivals"
                >
                  <Users size={16} aria-hidden="true" />
                  <span>Arrivals & Queue</span>
                </button>

                <button
                  type="button"
                  className={`today-sched-tab ${stageFilter === 'in_service' ? 'active' : ''}`}
                  onClick={() => handleStageFilterChange('in_service')}
                  data-testid="tab-in-service"
                >
                  <Clock size={16} aria-hidden="true" />
                  <span>In Service</span>
                </button>

                <button
                  type="button"
                  className={`today-sched-tab ${stageFilter === 'ready_to_pay' ? 'active' : ''}`}
                  onClick={() => handleStageFilterChange('ready_to_pay')}
                  data-testid="tab-ready-to-pay"
                >
                  <CreditCard size={16} aria-hidden="true" />
                  <span>Ready to Pay</span>
                </button>

                <button
                  type="button"
                  className={`today-sched-tab ${stageFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => handleStageFilterChange('completed')}
                  data-testid="tab-completed"
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span>Completed</span>
                </button>
              </div>

              {/* Filter Toolbar Matching Reference Screenshot */}
              <div className="today-filter-toolbar">
                <div className="today-filter-dropdowns">
                  {/* Status Dropdown */}
                  <div className="today-filter-pill-select">
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="today-select-input"
                      aria-label="Filter by Status"
                    >
                      <option value="all">All Status</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="arrived">Arrived</option>
                      <option value="checked_in">Checked In</option>
                      <option value="in_service">In Service</option>
                      <option value="ready_to_pay">Ready to Pay</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="today-select-chevron"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Service Types Dropdown */}
                  <div className="today-filter-pill-select">
                    <select
                      value={serviceTypeFilter}
                      onChange={(e) => {
                        setServiceTypeFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="today-select-input"
                      aria-label="Filter by Service Type"
                    >
                      <option value="all">All Service Types</option>
                      {uniqueServices.map((svc) => (
                        <option key={svc} value={svc}>
                          {svc}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="today-select-chevron"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Therapists Dropdown */}
                  <div className="today-filter-pill-select">
                    <select
                      value={therapistFilter}
                      onChange={(e) => {
                        setTherapistFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="today-select-input"
                      aria-label="Filter by Therapist"
                    >
                      <option value="all">All Therapists</option>
                      {uniqueTherapists.map((th) => (
                        <option key={th.id} value={th.name}>
                          {th.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="today-select-chevron"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Right View Mode Toggles */}
                <div className="today-view-mode-group">
                  <button
                    type="button"
                    className={`today-view-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                    onClick={() => setViewMode('timeline')}
                    title="Timeline View"
                    aria-pressed={viewMode === 'timeline'}
                  >
                    <GanttChart size={14} aria-hidden="true" />
                    <span>Timeline</span>
                  </button>
                  <button
                    type="button"
                    className={`today-view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List View"
                    aria-pressed={viewMode === 'list'}
                  >
                    <List size={14} aria-hidden="true" />
                    <span>List</span>
                  </button>
                  <button
                    type="button"
                    className="today-view-mode-btn"
                    disabled
                    aria-label="Rooms view unavailable: room occupancy data is not provided by Today"
                    title="Rooms view unavailable: room occupancy data is not provided by Today"
                  >
                    <DoorClosed size={14} aria-hidden="true" />
                    <span>Rooms unavailable</span>
                  </button>
                </div>
              </div>

              {/* Booking Rows Timeline / Table */}
              <div
                className={`today-schedule-content today-table-container ${filteredQueue.length === 0 ? 'is-empty' : ''}`}
                ref={tableContainerCallbackRef}
                data-testid="today-table-container"
              >
                {filteredQueue.length === 0 ? (
                  <div
                    className="today-table-empty"
                    data-testid="today-queue-empty"
                  >
                    <CalendarDays
                      size={32}
                      className="text-slate-300 mb-2"
                      aria-hidden="true"
                    />
                    <h4>
                      {data.queue.length === 0
                        ? 'No bookings scheduled for today'
                        : 'No bookings match your filters'}
                    </h4>
                    <p>
                      {data.queue.length === 0
                        ? 'Get started by creating the first intake booking for today.'
                        : 'Try adjusting your search or filters to see more bookings.'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenBookingModal(undefined)}
                      className="mt-3"
                    >
                      <Plus size={14} className="mr-1" aria-hidden="true" />
                      Create New Booking
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`today-timeline-list ${viewMode === 'list' ? 'today-list-view' : ''}`}
                    data-testid={`today-${viewMode}-view`}
                  >
                    {paginatedQueue.map((booking) => {
                      const isSelected = selectedBookingId === booking.id;
                      const isMutating = mutatingBookingId === booking.id;
                      const action = getApplicableAction(booking);
                      const barColor = getTimelineBarColor(booking);
                      const therapistColor = getTherapistColor(
                        booking.staffName,
                      );
                      const therapistInitials = getInitials(booking.staffName);

                      return (
                        <div
                          key={booking.id}
                          className={`today-timeline-row ${
                            isSelected ? 'today-timeline-row-selected' : ''
                          }`}
                          onClick={() =>
                            setSelectedBookingId((prev) =>
                              prev === booking.id ? null : booking.id,
                            )
                          }
                          data-testid={`today-row-${booking.id}`}
                        >
                          {/* 1. Time Column with Vertical Bar */}
                          <div className="today-row-time-col">
                            <span className="today-row-time">
                              {formatClock(booking.startTime)}
                            </span>
                            <div
                              className={`today-row-vbar ${barColor}`}
                              aria-hidden="true"
                            />
                          </div>

                          {/* 2. Status Badge */}
                          <div className="today-row-status-col">
                            {renderStageBadge(booking)}
                          </div>

                          {/* 3. Customer Info */}
                          <div className="today-row-customer-col">
                            <button
                              type="button"
                              className="today-booking-select"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBookingId((prev) =>
                                  prev === booking.id ? null : booking.id,
                                );
                              }}
                              aria-pressed={isSelected}
                              aria-label={`Review booking for ${booking.customerName || 'customer'}`}
                              data-testid={`select-booking-${booking.id}`}
                            >
                              <strong className="today-customer-name">
                                {booking.customerName || 'Walk-in Guest'}
                              </strong>
                            </button>
                            <span className="today-customer-phone">
                              {booking.customerPhone || '—'}
                            </span>
                          </div>

                          {/* 4. Service Info */}
                          <div className="today-row-service-col">
                            <span className="today-service-name">
                              {booking.serviceName || 'Custom Service'}
                            </span>
                            <span className="today-service-duration">
                              {booking.serviceDuration
                                ? `${booking.serviceDuration} min`
                                : '—'}
                            </span>
                          </div>

                          {/* 5. Assigned Therapist */}
                          <div className="today-row-therapist-col">
                            <div
                              className={`today-therapist-avatar ${therapistColor}`}
                              title={booking.staffName || 'Unassigned'}
                            >
                              {therapistInitials}
                            </div>
                            <span className="today-therapist-name">
                              {booking.staffName || 'Unassigned'}
                            </span>
                          </div>

                          {/* 6. Room / Dispatch */}
                          <div className="today-row-room-col">
                            {booking.isHomeService ? (
                              <div className="today-row-resource-info text-left">
                                {booking.dispatchContextAvailable === false && (
                                  <span className="text-[10px] text-amber-800 font-medium block">
                                    Dispatch unavailable
                                  </span>
                                )}
                                {booking.dispatchContextAvailable !== false &&
                                  booking.noDriverWarning && (
                                    <span className="text-[10px] text-red-700 font-medium block">
                                      No driver assigned
                                    </span>
                                  )}
                                <span className="text-xs text-slate-500 block">
                                  {booking.driverName
                                    ? `Driver: ${booking.driverName}`
                                    : !booking.dispatchContextAvailable
                                      ? 'Dispatch details unavailable'
                                      : 'No driver assigned'}
                                </span>
                              </div>
                            ) : (
                              <span className="today-room-label">
                                {booking.resourceName || '—'}
                              </span>
                            )}
                          </div>

                          {/* 7. Action Button */}
                          <div className="today-row-action-col">
                            {action ? (
                              <button
                                type="button"
                                className={`today-timeline-action-btn ${action.tone}`}
                                disabled={isMutating}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleMutateAction(
                                    action.action,
                                    booking.id,
                                  );
                                }}
                                data-testid={`action-${action.action}-${booking.id}`}
                              >
                                <Play
                                  size={12}
                                  fill="currentColor"
                                  aria-hidden="true"
                                />
                                <span>
                                  {isMutating ? 'Updating...' : action.label}
                                </span>
                              </button>
                            ) : booking.stage === 'ready_to_pay' ? (
                              <button
                                type="button"
                                className="today-timeline-action-btn view-bill today-read-only-pill"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onNavigate) {
                                    onNavigate('cashier');
                                  } else {
                                    setSelectedBookingId(booking.id);
                                  }
                                }}
                                data-testid={`payment-pending-pill-${booking.id}`}
                              >
                                <Eye size={12} aria-hidden="true" />
                                <span>Payment Pending — manage on web</span>
                              </button>
                            ) : booking.stage === 'completed' ||
                              booking.status === 'completed' ? (
                              <span className="today-completed-text">
                                Completed
                              </span>
                            ) : ['cancelled', 'no_show'].includes(
                                booking.status,
                              ) ? (
                              <span className="today-closed-text">Closed</span>
                            ) : (
                              <span className="today-closed-text">—</span>
                            )}
                          </div>

                          {/* 8. Booking inspector shortcut */}
                          <div className="today-row-more-col">
                            <button
                              type="button"
                              className="today-row-more-btn"
                              title="View booking details"
                              aria-label={`View details for ${booking.customerName || 'customer'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBookingId(booking.id);
                              }}
                            >
                              <Eye size={15} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    setSelectedBookingId(null);
                  }}
                  showPageSizeSelector={false}
                  className="today-pagination"
                  testId="today-pagination"
                />
              )}
            </section>

            {/* Right Column: Operational Rail */}
            <aside
              className="today-right-rail"
              aria-label="Today contextual operational rail"
              data-testid="today-right-rail"
            >
              {/* Contextual Inspector (persistent in DOM so tests find today-booking-inspector; sr-only when empty) */}
              <div className={selectedBooking ? 'block mb-4' : 'sr-only'}>
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
                  onOpenCashier={
                    onNavigate ? () => onNavigate('cashier') : undefined
                  }
                  onClose={() => setSelectedBookingId(null)}
                  onMutateAction={handleMutateAction}
                  isMutating={mutatingBookingId === selectedBooking?.id}
                />
              </div>

              {/* Panel 1: Arrivals & Waiting Queue */}
              {!selectedBooking && (
                <TodayArrivalsQueueCard
                  queue={data.queue}
                  onSelectBooking={(id) => setSelectedBookingId(id)}
                  onViewAll={() => handleStageFilterChange('waiting')}
                  onMutateAction={handleMutateAction}
                  mutatingBookingId={mutatingBookingId}
                />
              )}

              {/* Panel 2: Today's Activity */}
              <TodayActivityCard
                attendance={data.attendance}
                notifications={data.notifications}
                onNavigate={onNavigate}
              />

              {/* Panel 3: Quick Actions Grid */}
              <TodayQuickActionsCard onNavigate={onNavigate} />
            </aside>
          </div>
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
