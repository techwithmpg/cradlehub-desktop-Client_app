import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Clock3,
  LocateFixed,
  MapPin,
  Truck,
  UserRound,
} from 'lucide-react';
import type { AuthContext } from '../../types/auth';
import type {
  HomeServiceBookingDetail,
  HomeServiceDriver,
  HomeServiceLocationSnapshot,
  HomeServiceQueueItem,
  HomeServiceRecommendations,
} from '../../types/home-service';
import {
  cancelHomeServiceBooking,
  fetchHomeService,
  fetchHomeServiceBookingDetail,
  fetchHomeServiceDrivers,
  fetchHomeServiceRecommendations,
  getTodayDateString,
  mutateHomeService,
  rescheduleHomeServiceBooking,
} from '../../lib/home-service-service';
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
import { HomeServiceMapCard } from './HomeServiceMapCard';

interface HomeServiceViewProps {
  authContext: AuthContext;
}

type HomeServiceTab = 'dispatch' | 'location' | 'drivers';

type QueueScope =
  'all' | 'needs-dispatch' | 'on-the-way' | 'active-service' | 'completed';

type InspectorTab = 'overview' | 'timeline' | 'service';

interface DriverWorkspaceRow {
  driver: HomeServiceDriver;
  assigned: HomeServiceQueueItem[];
  activeDispatches: number;
  latestLocation: HomeServiceLocationSnapshot | null;
  locationTone: 'ready' | 'stale' | 'unavailable';
  locationLabel: string;
}

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

function formatDateLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
}

function formatStatus(value: string | null | undefined): string {
  if (!value) return 'Unavailable';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatLifecycle(value: string | null | undefined): string {
  if (!value) return 'Not recorded';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-PH', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
}

function formatCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
): string {
  if (lat == null || lng == null) return 'Unavailable';

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function snapshotTone(
  snapshot: HomeServiceLocationSnapshot | null,
  needsReview = false,
): 'ready' | 'stale' | 'unavailable' {
  if (!snapshot) return 'unavailable';

  const recordedAt = new Date(snapshot.recorded_at).getTime();
  const ageMinutes = (Date.now() - recordedAt) / 60000;

  if (needsReview || !Number.isFinite(ageMinutes) || ageMinutes > 30) {
    return 'stale';
  }

  return 'ready';
}

function snapshotLabel(
  snapshot: HomeServiceLocationSnapshot | null,
  needsReview = false,
): string {
  const tone = snapshotTone(snapshot, needsReview);

  if (tone === 'ready') return 'Recent recorded location';
  if (tone === 'stale') return 'Location snapshot needs refresh';

  return 'Location unavailable';
}

function locationLabel(item: HomeServiceQueueItem): {
  label: string;
  tone: 'ready' | 'stale' | 'unavailable';
} {
  return {
    label: snapshotLabel(item.latestDriverLocation, item.needsLocationReview),
    tone: snapshotTone(item.latestDriverLocation, item.needsLocationReview),
  };
}

function statusTone(
  status: string,
): 'success' | 'attention' | 'neutral' | 'active' {
  if (status === 'completed') return 'success';

  if (status === 'cancelled' || status === 'awaiting_driver') {
    return 'attention';
  }

  if (
    [
      'released_to_driver',
      'in_route',
      'arrived_at_customer',
      'service_started',
    ].includes(status)
  ) {
    return 'active';
  }

  return 'neutral';
}

function matchesQueueScope(
  item: HomeServiceQueueItem,
  scope: QueueScope,
): boolean {
  switch (scope) {
    case 'needs-dispatch':
      return ['awaiting_driver', 'ready', 'scheduled'].includes(
        item.dispatchStatus,
      );

    case 'on-the-way':
      return ['released_to_driver', 'in_route'].includes(item.dispatchStatus);

    case 'active-service':
      return ['arrived_at_customer', 'service_started'].includes(
        item.dispatchStatus,
      );

    case 'completed':
      return item.dispatchStatus === 'completed';

    case 'all':
    default:
      return true;
  }
}

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);

  return value.toISOString().slice(0, 10);
}

export function HomeServiceView({ authContext }: HomeServiceViewProps) {
  const [activeTab, setActiveTab] = useState<HomeServiceTab>('dispatch');

  const [queueScope, setQueueScope] = useState<QueueScope>('all');

  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('overview');

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);

  const [date, setDate] = useState(getTodayDateString());

  const [items, setItems] = useState<HomeServiceQueueItem[]>([]);

  const [summary, setSummary] = useState({
    totalToday: 0,
    awaitingDispatch: 0,
    activeTrips: 0,
    completedToday: 0,
    cancelledToday: 0,
  });

  const [alerts, setAlerts] = useState<
    Array<{
      id: string;
      bookingId: string;
      title: string;
      description: string;
      severity: 'warning' | 'danger';
      timeAgo: string;
    }>
  >([]);

  const [locationSemantics, setLocationSemantics] = useState(
    'Latest recorded snapshot; refresh required.',
  );

  const [drivers, setDrivers] = useState<HomeServiceDriver[]>([]);
  const [driverError, setDriverError] = useState<string | null>(null);

  const [recommendations, setRecommendations] =
    useState<HomeServiceRecommendations | null>(null);

  const [detail, setDetail] = useState<HomeServiceBookingDetail | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [actionBusy, setActionBusy] = useState(false);

  const [driverSelection, setDriverSelection] = useState('');
  const [therapistSelection, setTherapistSelection] = useState('');

  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const areaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => item.area?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const serviceOptions = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => item.serviceName?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const queueScopeCounts = useMemo(
    () => ({
      all: items.length,
      'needs-dispatch': items.filter((item) =>
        matchesQueueScope(item, 'needs-dispatch'),
      ).length,
      'on-the-way': items.filter((item) =>
        matchesQueueScope(item, 'on-the-way'),
      ).length,
      'active-service': items.filter((item) =>
        matchesQueueScope(item, 'active-service'),
      ).length,
      completed: items.filter((item) => matchesQueueScope(item, 'completed'))
        .length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesScope = matchesQueueScope(item, queueScope);

      const matchesStatus =
        statusFilter === 'all' || item.dispatchStatus === statusFilter;

      const matchesArea = areaFilter === 'all' || item.area === areaFilter;

      const matchesService =
        serviceFilter === 'all' || item.serviceName === serviceFilter;

      const matchesSearch =
        !query ||
        [
          item.customerName,
          item.serviceName,
          item.area,
          item.formattedAddress,
          item.driverName,
          item.therapistName,
        ].some((value) => value?.toLowerCase().includes(query));

      return (
        matchesScope &&
        matchesStatus &&
        matchesArea &&
        matchesService &&
        matchesSearch
      );
    });
  }, [items, search, queueScope, statusFilter, areaFilter, serviceFilter]);

  const driverRows = useMemo<DriverWorkspaceRow[]>(
    () =>
      drivers.map((driver) => {
        const assigned = items.filter((item) => item.driverId === driver.id);

        const snapshots = assigned
          .flatMap((item) =>
            item.latestDriverLocation ? [item.latestDriverLocation] : [],
          )
          .sort(
            (a, b) =>
              new Date(b.recorded_at).getTime() -
              new Date(a.recorded_at).getTime(),
          );

        const latestLocation = snapshots[0] ?? null;

        const needsReview = assigned.some((item) => item.needsLocationReview);

        const locationTone = snapshotTone(latestLocation, needsReview);

        return {
          driver,
          assigned,
          activeDispatches: assigned.filter(
            (item) => !['completed', 'cancelled'].includes(item.dispatchStatus),
          ).length,
          latestLocation,
          locationTone,
          locationLabel: snapshotLabel(latestLocation, needsReview),
        };
      }),
    [drivers, items],
  );

  const filteredDriverRows = useMemo(() => {
    const query = driverSearch.trim().toLowerCase();

    if (!query) return driverRows;

    return driverRows.filter((row) =>
      row.driver.name.toLowerCase().includes(query),
    );
  }, [driverRows, driverSearch]);

  const selectedDriverRow = useMemo(
    () => driverRows.find((row) => row.driver.id === selectedDriverId) ?? null,
    [driverRows, selectedDriverId],
  );

  const locationMetrics = useMemo(() => {
    const customerGps = items.filter(
      (item) => item.lat != null && item.lng != null,
    ).length;

    const driverSnapshots = items.filter(
      (item) => item.latestDriverLocation != null,
    ).length;

    const recentSnapshots = items.filter(
      (item) => locationLabel(item).tone === 'ready',
    ).length;

    const needsReview = items.filter(
      (item) =>
        item.needsLocationReview || locationLabel(item).tone === 'stale',
    ).length;

    return {
      customerGps,
      driverSnapshots,
      recentSnapshots,
      needsReview,
    };
  }, [items]);

  const refresh = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setIsRefreshing(true);

      setError(null);

      try {
        const response = await fetchHomeService(date);

        setItems(response.data.items);
        setSummary(response.data.summary);
        setAlerts(response.data.alerts);
        setLocationSemantics(response.data.locationSemantics);

        setSelectedId((current) => {
          if (
            current &&
            response.data.items.some((item) => item.id === current)
          ) {
            return current;
          }

          return response.data.items[0]?.id ?? null;
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load Home Service.',
        );

        setItems([]);
        setSelectedId(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [date],
  );

  const loadBookingContext = useCallback(
    async (bookingId: string, showSpinner = true) => {
      if (showSpinner) setIsDetailLoading(true);

      setDetailError(null);

      try {
        const [detailResponse, recommendationResponse] = await Promise.all([
          fetchHomeServiceBookingDetail(bookingId),
          fetchHomeServiceRecommendations(bookingId),
        ]);

        setDetail(detailResponse.data);
        setRecommendations(recommendationResponse.data);
      } catch (err) {
        setDetailError(
          err instanceof Error
            ? err.message
            : 'Unable to load booking details.',
        );

        setDetail(null);
        setRecommendations(null);
      } finally {
        if (showSpinner) setIsDetailLoading(false);
      }
    },
    [],
  );

  const effectiveSelectedDriverId = useMemo(() => {
    if (
      selectedDriverId &&
      drivers.some((driver) => driver.id === selectedDriverId)
    ) {
      return selectedDriverId;
    }

    return drivers[0]?.id ?? null;
  }, [drivers, selectedDriverId]);

  const openDispatchModal = useCallback(
    (bookingId: string) => {
      setSelectedId(bookingId);
      setActionNotice(null);
      setActionError(null);
      setDriverSelection('');
      setTherapistSelection('');
      setInspectorTab('overview');
      setShowReschedule(false);
      setDispatchModalOpen(true);
      void loadBookingContext(bookingId);
    },
    [loadBookingContext],
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await fetchHomeService(date);
        if (!active) return;

        setItems(response.data.items);
        setSummary(response.data.summary);
        setAlerts(response.data.alerts);
        setLocationSemantics(response.data.locationSemantics);
        setError(null);

        setSelectedId((current) => {
          if (
            current &&
            response.data.items.some((item) => item.id === current)
          ) {
            return current;
          }

          return response.data.items[0]?.id ?? null;
        });
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error ? err.message : 'Unable to load Home Service.',
        );
        setItems([]);
        setSelectedId(null);
      } finally {
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [date]);

  useEffect(() => {
    let active = true;

    void fetchHomeServiceDrivers()
      .then((response) => {
        if (active) {
          setDrivers(response.data.drivers);
          setDriverError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setDrivers([]);
          setDriverError(
            err instanceof Error
              ? err.message
              : 'Unable to load Home Service drivers.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    let active = true;

    void (async () => {
      try {
        const [detailResponse, recommendationResponse] = await Promise.all([
          fetchHomeServiceBookingDetail(selectedId),
          fetchHomeServiceRecommendations(selectedId),
        ]);

        if (!active) return;
        setDetail(detailResponse.data);
        setRecommendations(recommendationResponse.data);
        setDetailError(null);
      } catch (err) {
        if (!active) return;
        setDetailError(
          err instanceof Error
            ? err.message
            : 'Unable to load booking details.',
        );
        setDetail(null);
        setRecommendations(null);
      } finally {
        if (active) {
          setIsDetailLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!dispatchModalOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDispatchModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [dispatchModalOpen]);

  const runAction = useCallback(
    async (
      action: () => Promise<unknown>,
      successMessage: string,
    ): Promise<boolean> => {
      setActionBusy(true);
      setActionError(null);
      setActionNotice(null);

      try {
        await action();

        setActionNotice(successMessage);

        await refresh(true);

        if (selectedId) {
          await loadBookingContext(selectedId, false);
        }

        return true;
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : 'The action could not be completed.',
        );

        return false;
      } finally {
        setActionBusy(false);
      }
    },
    [refresh, selectedId, loadBookingContext],
  );

  const assignDriver = () => {
    if (!selectedItem || !driverSelection) return;

    void runAction(
      () =>
        mutateHomeService({
          action: 'assign_driver',
          bookingId: selectedItem.id,
          driverId: driverSelection,
        }),
      'Driver assignment saved.',
    );
  };

  const assignTherapist = () => {
    if (!selectedItem || !therapistSelection) return;

    void runAction(
      () =>
        mutateHomeService({
          action: 'assign_therapist',
          bookingId: selectedItem.id,
          staffId: therapistSelection,
        }),
      'Therapist assignment saved.',
    );
  };

  const prepareDispatch = (releaseNow: boolean) => {
    if (!selectedItem) return;

    void runAction(
      () =>
        mutateHomeService({
          action: 'prepare_dispatch',
          bookingId: selectedItem.id,
          releaseNow,
        }),
      releaseNow ? 'Dispatch released to the driver.' : 'Dispatch prepared.',
    );
  };

  const submitReschedule = () => {
    if (!selectedItem || !rescheduleDate || !rescheduleTime) {
      return;
    }

    void runAction(
      () =>
        rescheduleHomeServiceBooking(selectedItem.id, {
          date: rescheduleDate,
          startTime: rescheduleTime,
        }),
      'Booking rescheduled.',
    ).then((saved) => {
      if (saved) setShowReschedule(false);
    });
  };

  const cancelBooking = () => {
    if (!selectedItem) return;

    void runAction(
      () =>
        cancelHomeServiceBooking(selectedItem.id, {
          note: 'Cancelled from Desktop Home Service.',
        }),
      'Booking cancellation saved.',
    );
  };

  const topTabs: Array<{
    id: HomeServiceTab;
    label: string;
  }> = [
    { id: 'dispatch', label: 'Dispatch Queue' },
    { id: 'location', label: 'Location Map' },
    { id: 'drivers', label: 'Drivers' },
  ];

  const queueTabs: Array<{
    id: QueueScope;
    label: string;
    count: number;
  }> = [
    {
      id: 'all',
      label: 'All',
      count: queueScopeCounts.all,
    },
    {
      id: 'needs-dispatch',
      label: 'Needs Dispatch',
      count: queueScopeCounts['needs-dispatch'],
    },
    {
      id: 'on-the-way',
      label: 'On the Way',
      count: queueScopeCounts['on-the-way'],
    },
    {
      id: 'active-service',
      label: 'Active Service',
      count: queueScopeCounts['active-service'],
    },
    {
      id: 'completed',
      label: 'Completed',
      count: queueScopeCounts.completed,
    },
  ];

  const inspectorTabs: Array<{
    id: InspectorTab;
    label: string;
  }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'service', label: 'Service' },
  ];

  const renderDispatchModal = () => {
    if (!dispatchModalOpen || !selectedItem) return null;

    return (
      <div
        className="new-booking-modal-overlay home-service-dispatch-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-service-dispatch-modal-title"
        onMouseDown={(event) => {
          if (event.currentTarget === event.target) {
            setDispatchModalOpen(false);
          }
        }}
      >
        <div
          className="new-booking-modal-card home-service-dispatch-modal-card"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="new-booking-modal-header home-service-dispatch-modal-header">
            <div className="new-booking-header-meta">
              <h2
                id="home-service-dispatch-modal-title"
                className="new-booking-title home-service-dispatch-modal-title"
              >
                Dispatch Details
              </h2>

              <p className="new-booking-subtitle">
                {selectedItem.customerName} ·{' '}
                {formatDateLabel(selectedItem.bookingDate)} ·{' '}
                {formatClock(selectedItem.startTime)}
              </p>
            </div>

            <button
              type="button"
              className="new-booking-close-btn"
              onClick={() => setDispatchModalOpen(false)}
              aria-label="Close dispatch details"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="home-service-dispatch-modal-body">
            <ModuleInspectorFrame
              ariaLabel="Home Service booking inspector"
              testId="home-service-inspector"
            >
              {isDetailLoading ? (
                <ModuleLoadingState
                  ariaLabel="Loading booking details"
                  showKpiSkeleton={false}
                />
              ) : detailError ? (
                <ModuleErrorBanner message={detailError} />
              ) : detail ? (
                <>
                  <div className="home-service-inspector-header">
                    <div>
                      <span className="home-service-eyebrow">
                        {formatDateLabel(detail.date)} ·{' '}
                        {formatClock(detail.startTime)}
                      </span>

                      <h2>
                        {detail.customer.name || selectedItem.customerName}
                      </h2>

                      <p>{detail.service.name || selectedItem.serviceName}</p>
                    </div>

                    <span
                      className={`home-service-status home-service-status-${statusTone(
                        selectedItem.dispatchStatus,
                      )}`}
                    >
                      {formatStatus(selectedItem.dispatchStatus)}
                    </span>
                  </div>

                  <ModuleTabs<InspectorTab>
                    tabs={inspectorTabs}
                    activeTab={inspectorTab}
                    onTabChange={setInspectorTab}
                    ariaLabel="Home Service booking detail tabs"
                    containerClassName="home-service-inspector-tabs"
                    tabButtonClassName="home-service-inspector-tab"
                    tabTestIdPrefix="home-service-inspector-tab"
                  />

                  {inspectorTab === 'overview' && (
                    <>
                      <div className="home-service-inspector-section">
                        <h3>Booking details</h3>

                        <dl className="home-service-definition-list">
                          <div>
                            <dt>Customer phone</dt>
                            <dd>{detail.customer.phone || 'Unavailable'}</dd>
                          </div>

                          <div>
                            <dt>Payment</dt>
                            <dd>
                              {formatStatus(
                                detail.paymentStatus ||
                                  selectedItem.paymentStatus,
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt>Address</dt>
                            <dd>
                              {detail.homeServiceAddress.fullAddress ||
                                selectedItem.formattedAddress ||
                                'Unavailable'}
                            </dd>
                          </div>

                          <div>
                            <dt>Access note</dt>
                            <dd>
                              {detail.homeServiceAddress.accessNote ||
                                'None recorded'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="home-service-inspector-section">
                        <h3>Assignments</h3>

                        <div className="home-service-assignment-row">
                          <label>
                            Driver
                            <select
                              value={
                                driverSelection || selectedItem.driverId || ''
                              }
                              onChange={(event) =>
                                setDriverSelection(event.target.value)
                              }
                              aria-label="Assign driver"
                            >
                              <option value="">
                                {selectedItem.driverName || 'Select driver'}
                              </option>

                              {(recommendations?.drivers.length
                                ? recommendations.drivers
                                : drivers
                              ).map((driver) => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <button
                            type="button"
                            onClick={assignDriver}
                            disabled={actionBusy || !driverSelection}
                            className="home-service-action-secondary"
                          >
                            Assign
                          </button>
                        </div>

                        <div className="home-service-assignment-row">
                          <label>
                            Therapist
                            <select
                              value={
                                therapistSelection ||
                                selectedItem.therapistId ||
                                ''
                              }
                              onChange={(event) =>
                                setTherapistSelection(event.target.value)
                              }
                              aria-label="Assign therapist"
                            >
                              <option value="">
                                {selectedItem.therapistName ||
                                  'Select therapist'}
                              </option>

                              {(recommendations?.therapists || []).map(
                                (therapist) => (
                                  <option
                                    key={therapist.id}
                                    value={therapist.id}
                                  >
                                    {therapist.name}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>

                          <button
                            type="button"
                            onClick={assignTherapist}
                            disabled={actionBusy || !therapistSelection}
                            className="home-service-action-secondary"
                          >
                            Assign
                          </button>
                        </div>
                      </div>

                      <div className="home-service-inspector-section">
                        <h3>Dispatch actions</h3>

                        <div className="home-service-actions">
                          <button
                            type="button"
                            onClick={() => prepareDispatch(false)}
                            disabled={
                              actionBusy ||
                              !selectedItem.driverId ||
                              !selectedItem.therapistId
                            }
                            className="home-service-action-secondary"
                          >
                            Prepare dispatch
                          </button>

                          <button
                            type="button"
                            onClick={() => prepareDispatch(true)}
                            disabled={
                              actionBusy ||
                              !selectedItem.driverId ||
                              !selectedItem.therapistId
                            }
                            className="home-service-action-primary"
                          >
                            Release to driver
                          </button>
                        </div>

                        <div className="home-service-actions">
                          <button
                            type="button"
                            onClick={() => {
                              setShowReschedule((current) => !current);

                              setRescheduleDate(detail.date);
                              setRescheduleTime(detail.startTime);
                            }}
                            disabled={actionBusy}
                            className="home-service-action-secondary"
                          >
                            Reschedule
                          </button>

                          <button
                            type="button"
                            onClick={cancelBooking}
                            disabled={
                              actionBusy ||
                              selectedItem.dispatchStatus === 'cancelled'
                            }
                            className="home-service-action-danger"
                          >
                            Cancel booking
                          </button>
                        </div>

                        {showReschedule && (
                          <div className="home-service-reschedule">
                            <label>
                              Date
                              <input
                                type="date"
                                value={rescheduleDate}
                                onChange={(event) =>
                                  setRescheduleDate(event.target.value)
                                }
                              />
                            </label>

                            <label>
                              Start time
                              <input
                                type="time"
                                value={rescheduleTime}
                                onChange={(event) =>
                                  setRescheduleTime(event.target.value)
                                }
                              />
                            </label>

                            <button
                              type="button"
                              onClick={submitReschedule}
                              disabled={
                                actionBusy || !rescheduleDate || !rescheduleTime
                              }
                            >
                              Save time
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {inspectorTab === 'timeline' && (
                    <>
                      <div className="home-service-inspector-section">
                        <h3>Travel lifecycle</h3>

                        <div className="home-service-timeline">
                          <div>
                            <span className="home-service-timeline-dot active" />
                            <div>
                              <strong>Travel started</strong>
                              <span>
                                {formatLifecycle(
                                  detail.lifecycle.travelStartedAt,
                                )}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="home-service-timeline-dot" />
                            <div>
                              <strong>Arrived</strong>
                              <span>
                                {formatLifecycle(detail.lifecycle.arrivedAt)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="home-service-timeline-dot" />
                            <div>
                              <strong>Service started</strong>
                              <span>
                                {formatLifecycle(
                                  detail.lifecycle.sessionStartedAt,
                                )}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="home-service-timeline-dot" />
                            <div>
                              <strong>Completed</strong>
                              <span>
                                {formatLifecycle(detail.lifecycle.completedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="home-service-inspector-section">
                        <h3>Recorded booking events</h3>

                        {detail.events.length === 0 ? (
                          <p className="home-service-muted-message">
                            No booking events were returned for this booking.
                          </p>
                        ) : (
                          <div className="home-service-event-list">
                            {detail.events.map((event, index) => (
                              <div
                                key={event.id || `${event.createdAt}-${index}`}
                                className="home-service-event"
                              >
                                <strong>{formatStatus(event.toStatus)}</strong>

                                <span>{formatLifecycle(event.createdAt)}</span>

                                {event.notes && <small>{event.notes}</small>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {inspectorTab === 'service' && (
                    <>
                      <div className="home-service-inspector-section">
                        <h3>Service</h3>

                        <dl className="home-service-definition-list">
                          <div>
                            <dt>Service</dt>
                            <dd>
                              {detail.service.name || selectedItem.serviceName}
                            </dd>
                          </div>

                          <div>
                            <dt>Duration</dt>
                            <dd>
                              {detail.service.durationMinutes != null
                                ? `${detail.service.durationMinutes} minutes`
                                : 'Unavailable'}
                            </dd>
                          </div>

                          <div>
                            <dt>Therapist</dt>
                            <dd>
                              {detail.therapist.name ||
                                selectedItem.therapistName ||
                                'Unassigned'}
                            </dd>
                          </div>

                          <div>
                            <dt>Driver</dt>
                            <dd>
                              {detail.driver.name ||
                                selectedItem.driverName ||
                                'Unassigned'}
                            </dd>
                          </div>

                          <div>
                            <dt>Booking status</dt>
                            <dd>
                              {formatStatus(
                                detail.progressStatus || detail.status,
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="home-service-inspector-section">
                        <h3>Location truth</h3>

                        <p
                          className={`home-service-location-note home-service-location-${
                            locationLabel(selectedItem).tone
                          }`}
                        >
                          <MapPin size={13} aria-hidden="true" />
                          {locationLabel(selectedItem).label}.{' '}
                          {locationSemantics}
                        </p>

                        {selectedItem.eta && (
                          <p className="home-service-eta-note">
                            Authoritative ETA: {selectedItem.eta.minutes}{' '}
                            minutes ·{' '}
                            {selectedItem.eta.source === 'stored_routes_api'
                              ? 'stored routes'
                              : 'stored dispatch estimate'}
                            .
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {actionError && (
                    <ModuleErrorBanner
                      message={actionError}
                      testId="home-service-action-error"
                    />
                  )}

                  {actionNotice && (
                    <ModuleSuccessBanner
                      message={actionNotice}
                      testId="home-service-action-success"
                    />
                  )}
                </>
              ) : null}
            </ModuleInspectorFrame>
          </div>
        </div>
      </div>
    );
  };

  const renderLocationPanel = () => (
    <HomeServiceMapCard
      items={items}
      drivers={drivers}
      selectedItem={selectedItem}
      summary={summary}
      locationSemantics={locationSemantics}
    />
  );

  return (
    <ModuleWorkspace
      ariaLabel="Home Service workspace"
      testId="home-service-workspace"
      className="home-service-workspace"
    >
      <ModuleHeader
        title="Home Service"
        subtitle={`Manage and dispatch Home Service bookings for ${authContext.branchName}.`}
        onRefresh={() => void refresh(true)}
        isRefreshing={isRefreshing}
        refreshAriaLabel="Refresh Home Service"
        testId="home-service-header"
        customActions={
          <div className="home-service-date-controls">
            <button
              type="button"
              onClick={() => setDate((current) => shiftDate(current, -1))}
              aria-label="Previous Home Service day"
            >
              ‹
            </button>

            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Home Service date"
            />

            <button
              type="button"
              onClick={() => setDate((current) => shiftDate(current, 1))}
              aria-label="Next Home Service day"
            >
              ›
            </button>
          </div>
        }
      />

      <ModuleTabs<HomeServiceTab>
        tabs={topTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ariaLabel="Home Service sections"
        containerClassName="home-service-top-tabs"
        tabButtonClassName="home-service-top-tab"
        tabTestIdPrefix="home-service-tab"
      />

      {error && (
        <ModuleErrorBanner
          message={error}
          onRetry={() => void refresh(true)}
          testId="home-service-error"
        />
      )}

      {isLoading ? (
        <ModuleLoadingState
          ariaLabel="Loading Home Service"
          testId="home-service-loading"
        />
      ) : (
        <>
          {activeTab === 'dispatch' && (
            <>
              <ModuleSummaryCard
                ariaLabel="Home Service summary"
                className="home-service-summary"
                testId="home-service-summary"
              >
                <ModuleKpiGrid className="home-service-kpi-grid">
                  <ModuleKpiCell
                    label="Today Bookings"
                    count={summary.totalToday}
                    subtext={formatDateLabel(date)}
                    icon={<Clock3 size={15} aria-hidden="true" />}
                    testId="home-service-kpi-total"
                  />

                  <ModuleKpiCell
                    label="Awaiting Dispatch"
                    count={summary.awaitingDispatch}
                    subtext="Needs assignment or release"
                    icon={<Truck size={15} aria-hidden="true" />}
                    accentClass="kpi-accent-amber"
                    testId="home-service-kpi-awaiting"
                  />

                  <ModuleKpiCell
                    label="Active Trips"
                    count={summary.activeTrips}
                    subtext="Released or in progress"
                    icon={<LocateFixed size={15} aria-hidden="true" />}
                    accentClass="kpi-accent-blue"
                    testId="home-service-kpi-active"
                  />

                  <ModuleKpiCell
                    label="Completed"
                    count={summary.completedToday}
                    subtext="Today"
                    icon={<CheckCircle2 size={15} aria-hidden="true" />}
                    accentClass="kpi-accent-emerald"
                    testId="home-service-kpi-completed"
                  />

                  <ModuleKpiCell
                    label="Cancelled"
                    count={summary.cancelledToday}
                    subtext="Today"
                    icon={<AlertTriangle size={15} aria-hidden="true" />}
                    accentClass="kpi-accent-red"
                    testId="home-service-kpi-cancelled"
                  />
                </ModuleKpiGrid>
              </ModuleSummaryCard>

              {alerts.length > 0 && (
                <div
                  className="home-service-alert-strip"
                  role="region"
                  aria-label="Home Service alerts"
                >
                  <strong>
                    <AlertTriangle size={14} aria-hidden="true" />
                    Needs attention
                  </strong>

                  {alerts.slice(0, 3).map((alert) => (
                    <button
                      type="button"
                      key={alert.id}
                      onClick={() => {
                        openDispatchModal(alert.bookingId);
                      }}
                    >
                      <span>{alert.title}</span>
                      <small>{alert.description}</small>
                    </button>
                  ))}
                </div>
              )}

              <div className="home-service-filter-stack">
                <ModuleToolbar
                  ariaLabel="Home Service queue filters"
                  className="home-service-toolbar"
                >
                  <label className="home-service-search">
                    <span className="sr-only">Search dispatch queue</span>

                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search customer, service, address, driver..."
                    />
                  </label>

                  <select
                    className="home-service-filter-select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    aria-label="Filter dispatch status"
                  >
                    <option value="all">All Status</option>
                    <option value="awaiting_driver">Awaiting driver</option>
                    <option value="ready">Ready</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="released_to_driver">Released</option>
                    <option value="in_route">In route</option>
                    <option value="arrived_at_customer">Arrived</option>
                    <option value="service_started">Service started</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    className="home-service-filter-select"
                    value={areaFilter}
                    onChange={(event) => setAreaFilter(event.target.value)}
                    aria-label="Filter area"
                  >
                    <option value="all">All Areas</option>

                    {areaOptions.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>

                  <select
                    className="home-service-filter-select"
                    value={serviceFilter}
                    onChange={(event) => setServiceFilter(event.target.value)}
                    aria-label="Filter service"
                  >
                    <option value="all">All Services</option>

                    {serviceOptions.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>

                  <span className="home-service-queue-count">
                    {filteredItems.length} of {items.length} bookings
                  </span>
                </ModuleToolbar>

                <ModuleTabs<QueueScope>
                  tabs={queueTabs}
                  activeTab={queueScope}
                  onTabChange={setQueueScope}
                  ariaLabel="Dispatch queue scopes"
                  containerClassName="home-service-queue-tabs"
                  tabButtonClassName="home-service-queue-tab"
                  tabTestIdPrefix="home-service-queue-tab"
                />
              </div>

              <ModuleMainGrid
                className="home-service-main-grid"
                testId="home-service-main-grid"
              >
                <ModulePrimaryColumn>
                  <div className="home-service-primary-split">
                    <ModulePrimaryCard
                      ariaLabel="Home Service dispatch queue"
                      testId="home-service-queue-card"
                      className="home-service-queue-card"
                    >
                      <div className="home-service-card-heading">
                        <div>
                          <span>Dispatch Queue</span>
                          <strong>{formatDateLabel(date)}</strong>
                        </div>

                        <small>Sorted by scheduled time</small>
                      </div>

                      <ModuleDataGridFrame testId="home-service-queue-grid">
                        {filteredItems.length === 0 ? (
                          <div className="bookings-table-empty-state">
                            <div
                              className="bookings-empty-icon-circle"
                              aria-hidden="true"
                            >
                              <Truck size={20} />
                            </div>

                            <h2 className="bookings-empty-heading">
                              {items.length === 0
                                ? 'No Home Service bookings'
                                : 'No matching dispatches'}
                            </h2>

                            <p className="bookings-empty-text">
                              {items.length === 0
                                ? `No authoritative Home Service records are available for ${formatDateLabel(
                                    date,
                                  )}.`
                                : 'Adjust the search or filters.'}
                            </p>
                          </div>
                        ) : (
                          <ModuleTable
                            aria-label="Home Service dispatch queue"
                            className="home-service-table"
                          >
                            <thead>
                              <tr>
                                <th scope="col">Time</th>
                                <th scope="col">Customer / location</th>
                                <th scope="col">Dispatch</th>
                                <th scope="col">Assigned</th>
                              </tr>
                            </thead>

                            <tbody>
                              {filteredItems.map((item) => {
                                const selected = item.id === selectedId;

                                const location = locationLabel(item);

                                return (
                                  <tr
                                    key={item.id}
                                    className={`booking-row ${
                                      selected ? 'selected' : ''
                                    }`}
                                    tabIndex={0}
                                    aria-selected={selected}
                                    onClick={() => {
                                      openDispatchModal(item.id);
                                    }}
                                    onKeyDown={(event) => {
                                      if (
                                        event.key === 'Enter' ||
                                        event.key === ' '
                                      ) {
                                        event.preventDefault();
                                        openDispatchModal(item.id);
                                      }
                                    }}
                                    data-testid={`home-service-row-${item.id}`}
                                  >
                                    <td className="td-time">
                                      <div className="time-primary">
                                        {formatClock(item.startTime)}
                                      </div>

                                      <div className="time-secondary">
                                        {formatClock(item.endTime)}
                                      </div>
                                    </td>

                                    <td>
                                      <div className="customer-cell">
                                        <span
                                          className="customer-avatar-pill"
                                          aria-hidden="true"
                                        >
                                          {item.customerName
                                            .split(' ')
                                            .map((part) => part[0])
                                            .join('')
                                            .slice(0, 2)
                                            .toUpperCase()}
                                        </span>

                                        <div className="customer-info">
                                          <div className="customer-name">
                                            {item.customerName}
                                          </div>

                                          <div className="customer-subtext">
                                            {item.serviceName}
                                          </div>

                                          <div className="home-service-row-location">
                                            <MapPin
                                              size={10}
                                              aria-hidden="true"
                                            />

                                            <span>
                                              {item.area ||
                                                item.formattedAddress ||
                                                'Address unavailable'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    <td>
                                      <span
                                        className={`home-service-status home-service-status-${statusTone(
                                          item.dispatchStatus,
                                        )}`}
                                      >
                                        {formatStatus(item.dispatchStatus)}
                                      </span>

                                      <div className="home-service-substatus">
                                        {formatStatus(
                                          item.bookingProgressStatus ||
                                            item.bookingStatus,
                                        )}
                                      </div>

                                      <div
                                        className={`home-service-location-inline home-service-location-${location.tone}`}
                                      >
                                        {location.label}
                                      </div>
                                    </td>

                                    <td>
                                      <div className="home-service-people">
                                        <span>
                                          <Truck size={11} aria-hidden="true" />

                                          {item.driverName || 'No driver'}
                                        </span>

                                        <span>
                                          <UserRound
                                            size={11}
                                            aria-hidden="true"
                                          />

                                          {item.therapistName || 'No therapist'}
                                        </span>

                                        {item.eta && (
                                          <small>
                                            ETA {item.eta.minutes} min
                                          </small>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </ModuleTable>
                        )}
                      </ModuleDataGridFrame>
                    </ModulePrimaryCard>

                    <ModulePrimaryCard
                      ariaLabel="Home Service location context"
                      className="home-service-location-card"
                    >
                      {renderLocationPanel()}
                    </ModulePrimaryCard>
                  </div>
                </ModulePrimaryColumn>
              </ModuleMainGrid>

              {renderDispatchModal()}
            </>
          )}

          {activeTab === 'location' && (
            <>
              <ModuleSummaryCard
                ariaLabel="Home Service location summary"
                className="home-service-summary"
              >
                <ModuleKpiGrid className="home-service-location-kpi-grid">
                  <ModuleKpiCell
                    label="Customer GPS"
                    count={locationMetrics.customerGps}
                    subtext="Bookings with coordinates"
                    icon={<MapPin size={15} aria-hidden="true" />}
                  />

                  <ModuleKpiCell
                    label="Driver Snapshots"
                    count={locationMetrics.driverSnapshots}
                    subtext="Recorded locations"
                    icon={<Truck size={15} aria-hidden="true" />}
                    accentClass="kpi-accent-blue"
                  />

                  <ModuleKpiCell
                    label="Recent Snapshots"
                    count={locationMetrics.recentSnapshots}
                    subtext="Recorded within freshness window"
                    icon={<LocateFixed size={15} aria-hidden="true" />}
                    accentClass="kpi-accent-emerald"
                  />

                  <ModuleKpiCell
                    label="Needs Review"
                    count={locationMetrics.needsReview}
                    subtext="Stale or flagged"
                    icon={<AlertTriangle size={15} aria-hidden="true" />}
                    accentClass="kpi-accent-amber"
                  />
                </ModuleKpiGrid>
              </ModuleSummaryCard>

              <ModulePrimaryCard
                ariaLabel="Home Service recorded locations"
                className="home-service-location-workspace-card"
              >
                <div className="home-service-map-unavailable">
                  <div className="home-service-map-unavailable-icon">
                    <MapPin size={24} aria-hidden="true" />
                  </div>

                  <div>
                    <strong>Interactive map not connected yet</strong>

                    <p>
                      Stage 08B shows authoritative customer coordinates and
                      latest recorded driver snapshots. It does not simulate
                      live tracking, routes, or route optimization.
                    </p>
                  </div>
                </div>

                <div className="home-service-location-records">
                  {items.length === 0 ? (
                    <div className="home-service-location-record-empty">
                      No Home Service location records are available for this
                      date.
                    </div>
                  ) : (
                    items.map((item) => {
                      const location = locationLabel(item);

                      return (
                        <button
                          type="button"
                          key={item.id}
                          className="home-service-location-record"
                          onClick={() => {
                            setSelectedId(item.id);
                            setActiveTab('dispatch');
                          }}
                        >
                          <div>
                            <strong>{item.customerName}</strong>

                            <span>
                              {item.area ||
                                item.formattedAddress ||
                                'Address unavailable'}
                            </span>
                          </div>

                          <div>
                            <span>
                              Customer: {formatCoordinates(item.lat, item.lng)}
                            </span>

                            <span>
                              Driver:{' '}
                              {item.latestDriverLocation
                                ? formatCoordinates(
                                    item.latestDriverLocation.lat,
                                    item.latestDriverLocation.lng,
                                  )
                                : 'Unavailable'}
                            </span>
                          </div>

                          <span
                            className={`home-service-location-chip home-service-location-${location.tone}`}
                          >
                            {location.label}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </ModulePrimaryCard>
            </>
          )}

          {activeTab === 'drivers' && (
            <>
              <ModuleSummaryCard
                ariaLabel="Home Service drivers summary"
                className="home-service-summary"
              >
                <ModuleKpiGrid className="home-service-driver-kpi-grid">
                  <ModuleKpiCell
                    label="Total Drivers"
                    count={drivers.length}
                    subtext="Returned by hosted contract"
                    icon={<UserRound size={15} aria-hidden="true" />}
                  />

                  <ModuleKpiCell
                    label="Active Staff"
                    count={drivers.filter((driver) => driver.isActive).length}
                    subtext="Active staff records"
                    icon={<CheckCircle2 size={15} aria-hidden="true" />}
                    accentClass="kpi-accent-emerald"
                  />

                  <ModuleKpiCell
                    label="Assigned Today"
                    count={
                      driverRows.filter((row) => row.assigned.length > 0).length
                    }
                    subtext="Drivers with bookings"
                    icon={<Truck size={15} aria-hidden="true" />}
                    accentClass="kpi-accent-blue"
                  />

                  <ModuleKpiCell
                    label="Location Available"
                    count={
                      driverRows.filter((row) => row.latestLocation != null)
                        .length
                    }
                    subtext="Recorded snapshots"
                    icon={<MapPin size={15} aria-hidden="true" />}
                    accentClass="kpi-accent-amber"
                  />
                </ModuleKpiGrid>
              </ModuleSummaryCard>

              {driverError && <ModuleErrorBanner message={driverError} />}

              <ModuleToolbar
                ariaLabel="Home Service driver filters"
                className="home-service-driver-toolbar"
              >
                <label className="home-service-search">
                  <span className="sr-only">Search drivers</span>

                  <input
                    type="search"
                    value={driverSearch}
                    onChange={(event) => setDriverSearch(event.target.value)}
                    placeholder="Search drivers..."
                  />
                </label>

                <span className="home-service-queue-count">
                  {filteredDriverRows.length} drivers
                </span>
              </ModuleToolbar>

              <ModuleMainGrid className="home-service-drivers-grid">
                <ModulePrimaryColumn>
                  <ModulePrimaryCard
                    ariaLabel="Home Service drivers"
                    className="home-service-drivers-card"
                  >
                    <ModuleDataGridFrame>
                      {filteredDriverRows.length === 0 ? (
                        <div className="bookings-table-empty-state">
                          <div
                            className="bookings-empty-icon-circle"
                            aria-hidden="true"
                          >
                            <UserRound size={20} />
                          </div>

                          <h2 className="bookings-empty-heading">
                            No drivers available
                          </h2>

                          <p className="bookings-empty-text">
                            No driver records match the current search.
                          </p>
                        </div>
                      ) : (
                        <ModuleTable
                          aria-label="Home Service drivers"
                          className="home-service-driver-table"
                        >
                          <thead>
                            <tr>
                              <th scope="col">Driver</th>
                              <th scope="col">Staff</th>
                              <th scope="col">Assigned</th>
                              <th scope="col">Active Dispatches</th>
                              <th scope="col">Latest Location</th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredDriverRows.map((row) => {
                              const selected =
                                row.driver.id === effectiveSelectedDriverId;

                              return (
                                <tr
                                  key={row.driver.id}
                                  className={`booking-row ${
                                    selected ? 'selected' : ''
                                  }`}
                                  tabIndex={0}
                                  aria-selected={selected}
                                  onClick={() =>
                                    setSelectedDriverId(row.driver.id)
                                  }
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === 'Enter' ||
                                      event.key === ' '
                                    ) {
                                      event.preventDefault();

                                      setSelectedDriverId(row.driver.id);
                                    }
                                  }}
                                >
                                  <td>
                                    <div className="customer-cell">
                                      <span
                                        className="customer-avatar-pill"
                                        aria-hidden="true"
                                      >
                                        {row.driver.name
                                          .split(' ')
                                          .map((part) => part[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </span>

                                      <div className="customer-info">
                                        <div className="customer-name">
                                          {row.driver.name}
                                        </div>

                                        <div className="customer-subtext">
                                          {row.driver.staffType ||
                                            row.driver.systemRole ||
                                            'Driver'}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td>
                                    <span
                                      className={`home-service-status ${
                                        row.driver.isActive
                                          ? 'home-service-status-success'
                                          : 'home-service-status-neutral'
                                      }`}
                                    >
                                      {row.driver.isActive
                                        ? 'Active staff'
                                        : 'Inactive'}
                                    </span>
                                  </td>

                                  <td>{row.assigned.length}</td>

                                  <td>{row.activeDispatches}</td>

                                  <td>
                                    <span
                                      className={`home-service-location-chip home-service-location-${row.locationTone}`}
                                    >
                                      {row.locationLabel}
                                    </span>
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

                <ModuleInspectorColumn>
                  {!selectedDriverRow ? (
                    <ModuleInspectorFrame
                      isEmpty
                      ariaLabel="Driver inspector"
                      emptyState={
                        <ModuleInspectorEmptyState
                          title="Select a driver"
                          description="Choose a driver to inspect assignments and recorded location context."
                          icon={<UserRound size={26} />}
                        />
                      }
                    />
                  ) : (
                    <ModuleInspectorFrame ariaLabel="Driver inspector">
                      <div className="home-service-driver-inspector-header">
                        <span className="customer-avatar-pill">
                          {selectedDriverRow.driver.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>

                        <div>
                          <span className="home-service-eyebrow">Driver</span>

                          <h2>{selectedDriverRow.driver.name}</h2>

                          <p>
                            {selectedDriverRow.driver.isActive
                              ? 'Active staff record'
                              : 'Inactive staff record'}
                          </p>
                        </div>
                      </div>

                      <div className="home-service-inspector-section">
                        <h3>Today</h3>

                        <dl className="home-service-definition-list">
                          <div>
                            <dt>Assigned bookings</dt>
                            <dd>{selectedDriverRow.assigned.length}</dd>
                          </div>

                          <div>
                            <dt>Active dispatches</dt>
                            <dd>{selectedDriverRow.activeDispatches}</dd>
                          </div>

                          <div>
                            <dt>Location</dt>
                            <dd>{selectedDriverRow.locationLabel}</dd>
                          </div>

                          <div>
                            <dt>Recorded at</dt>
                            <dd>
                              {selectedDriverRow.latestLocation
                                ? formatLifecycle(
                                    selectedDriverRow.latestLocation
                                      .recorded_at,
                                  )
                                : 'Unavailable'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="home-service-inspector-section">
                        <h3>Assignments</h3>

                        {selectedDriverRow.assigned.length === 0 ? (
                          <p className="home-service-muted-message">
                            No Home Service bookings are assigned to this driver
                            for the selected date.
                          </p>
                        ) : (
                          <div className="home-service-driver-assignment-list">
                            {selectedDriverRow.assigned.map((item) => (
                              <button
                                type="button"
                                key={item.id}
                                onClick={() => {
                                  setSelectedId(item.id);

                                  setActiveTab('dispatch');
                                }}
                              >
                                <div>
                                  <strong>{formatClock(item.startTime)}</strong>

                                  <span>{item.customerName}</span>
                                </div>

                                <small>
                                  {formatStatus(item.dispatchStatus)}
                                </small>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </ModuleInspectorFrame>
                  )}
                </ModuleInspectorColumn>
              </ModuleMainGrid>
            </>
          )}
        </>
      )}
    </ModuleWorkspace>
  );
}
