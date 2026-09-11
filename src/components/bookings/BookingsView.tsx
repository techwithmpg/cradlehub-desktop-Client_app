import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthContext } from '../../types/auth';
import type {
  Booking,
  BookingFilters,
  BookingScopeTab,
} from '../../types/bookings';
import {
  computeBookingKpis,
  fetchBranchBookings,
  filterBookings,
} from '../../lib/bookings-service';
import { BookingsHeader } from './BookingsHeader';
import { BookingsKpiSummaryCard } from './BookingsKpiSummary';
import { BookingsListCard } from './BookingsListCard';
import { BookingInspectorCard } from './BookingInspectorCard';
import { NewBookingModal } from './NewBookingModal';
import {
  ModuleWorkspace,
  ModuleSuccessBanner,
  ModuleErrorBanner,
  ModuleLoadingState,
  ModuleMainGrid,
  ModulePrimaryColumn,
  ModuleInspectorColumn,
} from '../workspace';

interface BookingsViewProps {
  authContext: AuthContext;
}

export const BookingsView: React.FC<BookingsViewProps> = ({ authContext }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeScope, setActiveScope] = useState<BookingScopeTab>('all');
  const [filters, setFilters] = useState<BookingFilters>({
    search: '',
    status: 'all',
    date: '',
    serviceId: 'all',
    staffId: 'all',
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [creationNotice, setCreationNotice] = useState<{
    message: string;
    warning?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const data = await fetchBranchBookings(authContext.branchId);
        if (!isMounted) return;
        setBookings(data);
        setSelectedBooking((prev) => {
          if (prev) {
            const found = data.find((b) => b.id === prev.id);
            return found || (data.length > 0 ? data[0] : null);
          }
          return data.length > 0 ? data[0] : null;
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : 'Unable to load branch bookings';
        setError(message);
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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await fetchBranchBookings(authContext.branchId);
      setBookings(data);
      setSelectedBooking((prev) => {
        if (prev) {
          const found = data.find((b) => b.id === prev.id);
          return found || (data.length > 0 ? data[0] : null);
        }
        return data.length > 0 ? data[0] : null;
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load branch bookings';
      setError(message);
    } finally {
      setIsRefreshing(false);
    }
  }, [authContext.branchId]);

  const handleBookingCreated = useCallback(
    ({ warning }: { bookingId: string; warning?: string }) => {
      setCreationNotice({
        message: 'Booking created successfully.',
        warning,
      });
      void handleRefresh();
    },
    [handleRefresh],
  );

  // Derived KPIs
  const kpis = useMemo(() => computeBookingKpis(bookings), [bookings]);

  // Unique services & staff for filter dropdowns
  const { servicesList, staffList } = useMemo(() => {
    const serviceMap = new Map<string, { id: string; name: string }>();
    const staffMap = new Map<string, { id: string; full_name: string }>();

    for (const b of bookings) {
      if (b.service) {
        serviceMap.set(b.service.id, {
          id: b.service.id,
          name: b.service.name,
        });
      }
      if (b.staff) {
        staffMap.set(b.staff.id, {
          id: b.staff.id,
          full_name: b.staff.full_name,
        });
      }
    }

    return {
      servicesList: Array.from(serviceMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      staffList: Array.from(staffMap.values()).sort((a, b) =>
        a.full_name.localeCompare(b.full_name),
      ),
    };
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(
    () => filterBookings(bookings, activeScope, filters),
    [bookings, activeScope, filters],
  );

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      date: '',
      serviceId: 'all',
      staffId: 'all',
    });
    setActiveScope('all');
    setCurrentPage(1);
  }, []);

  const handleKpiClick = useCallback((kpiKey: string) => {
    if (kpiKey === 'today') {
      setActiveScope('today');
    } else if (kpiKey === 'confirmed') {
      setActiveScope('all');
      setFilters((prev) => ({ ...prev, status: 'confirmed' }));
    } else if (kpiKey === 'checked_in') {
      setActiveScope('all');
      setFilters((prev) => ({ ...prev, status: 'checked_in' }));
    } else if (kpiKey === 'completed') {
      setActiveScope('completed');
    } else if (kpiKey === 'no_show') {
      setActiveScope('all');
      setFilters((prev) => ({ ...prev, status: 'no_show' }));
    } else if (kpiKey === 'cancelled') {
      setActiveScope('cancelled');
    }
    setCurrentPage(1);
  }, []);

  return (
    <ModuleWorkspace ariaLabel="Bookings Management" testId="bookings-view">
      {/* Module Header */}
      <BookingsHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenNewBooking={() => setIsNewBookingOpen(true)}
      />

      {/* Creation Notice Banner */}
      {creationNotice && (
        <ModuleSuccessBanner
          message={creationNotice.message}
          warning={creationNotice.warning}
          onDismiss={() => setCreationNotice(null)}
          testId="bookings-creation-notice"
        />
      )}

      {/* Error Banner */}
      {error && (
        <ModuleErrorBanner
          message={error}
          onRetry={handleRefresh}
          testId="bookings-error-banner"
        />
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <ModuleLoadingState
          ariaLabel="Loading bookings"
          testId="bookings-skeleton"
        />
      ) : (
        <>
          {/* Card A: KPI Summary */}
          <BookingsKpiSummaryCard kpis={kpis} onKpiClick={handleKpiClick} />

          {/* Cards B & C Grid */}
          <ModuleMainGrid>
            <ModulePrimaryColumn>
              <BookingsListCard
                bookings={filteredBookings}
                selectedBookingId={selectedBooking?.id || null}
                onSelectBooking={(b) => setSelectedBooking(b)}
                activeScope={activeScope}
                onScopeChange={setActiveScope}
                filters={filters}
                onFiltersChange={setFilters}
                onResetFilters={handleResetFilters}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                servicesList={servicesList}
                staffList={staffList}
              />
            </ModulePrimaryColumn>

            <ModuleInspectorColumn>
              <BookingInspectorCard
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onBookingUpdated={handleRefresh}
              />
            </ModuleInspectorColumn>
          </ModuleMainGrid>
        </>
      )}

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        branchId={authContext.branchId}
        branchName={authContext.branchName}
        onBookingCreated={handleBookingCreated}
      />
    </ModuleWorkspace>
  );
};
