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
    <div
      className="bookings-view-container"
      role="main"
      aria-label="Bookings Management"
      data-testid="bookings-view"
    >
      {/* Module Header */}
      <BookingsHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenNewBooking={() => setIsNewBookingOpen(true)}
      />

      {/* Error Banner */}
      {error && (
        <div
          className="bookings-error-banner"
          role="alert"
          data-testid="bookings-error-banner"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="bookings-retry-btn"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div
          className="bookings-loading-state"
          aria-busy="true"
          aria-label="Loading bookings"
          data-testid="bookings-skeleton"
        >
          <div className="bookings-skeleton-kpi" />
          <div className="bookings-skeleton-body-grid">
            <div className="bookings-skeleton-list" />
            <div className="bookings-skeleton-inspector" />
          </div>
        </div>
      ) : (
        <>
          {/* Card A: KPI Summary */}
          <BookingsKpiSummaryCard kpis={kpis} onKpiClick={handleKpiClick} />

          {/* Cards B & C Grid */}
          <div className="bookings-main-grid">
            <div className="bookings-list-column">
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
            </div>

            <div className="bookings-inspector-column">
              <BookingInspectorCard
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
              />
            </div>
          </div>
        </>
      )}

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        branchId={authContext.branchId}
        branchName={authContext.branchName}
        onBookingCreated={handleRefresh}
      />
    </div>
  );
};
