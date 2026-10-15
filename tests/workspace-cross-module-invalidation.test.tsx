import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext, NavModuleId } from '../src/types/auth';
import type { Booking } from '../src/types/bookings';
import type {
  DesktopTodayData,
  DesktopTodayQueueItem,
} from '../src/types/today';
import { TodayView } from '../src/components/today/TodayView';
import { BookingsView } from '../src/components/bookings/BookingsView';
import {
  RetainedModuleWorkspace,
  WorkspaceLifecycleProvider,
  WorkspaceModulePresence,
  useWorkspaceInvalidation,
} from '../src/components/workspace';
import { clearInFlightOperationsForTests } from '../src/lib/single-flight';
import * as todayService from '../src/lib/today-service';
import * as bookingsService from '../src/lib/bookings-service';
import * as customersService from '../src/lib/customers-service';

const authContext: AuthContext = {
  userId: 'user-01',
  email: 'crm@example.com',
  staffId: 'staff-01',
  fullName: 'CRM Operator',
  canonicalRole: 'crm',
  rawRole: 'crm',
  branchId: 'branch-main',
  branchName: 'Main Spa',
  isCrmEligible: true,
};

function createBooking(
  id: string,
  customerName: string,
  status: Booking['status'] = 'confirmed',
): Booking {
  return {
    id,
    branch_id: 'branch-main',
    booking_date: '2026-10-15',
    start_time: '10:00:00',
    end_time: '11:00:00',
    status,
    type: 'walkin',
    delivery_type: 'in_spa',
    amount_paid: 0,
    payment_method: 'pay_on_site',
    payment_status: 'pending',
    payment_reference: null,
    resource_id: 'room-1',
    staff_id: 'staff-1',
    customer_id: `customer-${id}`,
    service_id: 'service-1',
    travel_buffer_mins: 0,
    metadata: null,
    created_at: '2026-10-15T00:00:00Z',
    updated_at: '2026-10-15T00:00:00Z',
    customer: {
      id: `customer-${id}`,
      full_name: customerName,
      phone: '09170000000',
      email: null,
    },
    service: {
      id: 'service-1',
      name: 'Swedish Massage',
      duration_minutes: 60,
      price: 700,
    },
    staff: {
      id: 'staff-1',
      full_name: 'Therapist One',
      nickname: null,
      tier: undefined,
    },
    resource: {
      id: 'room-1',
      name: 'Room 1',
      type: 'room',
    },
  };
}

function createQueueItem(
  overrides: Partial<DesktopTodayQueueItem> = {},
): DesktopTodayQueueItem {
  return {
    id: 'booking-01',
    bookingDate: '2026-10-15',
    startTime: '10:00:00',
    endTime: '11:00:00',
    status: 'confirmed',
    bookingProgressStatus: 'not_started',
    type: 'walkin',
    deliveryType: 'in_spa',
    customerName: 'Existing Customer',
    customerPhone: '09170000000',
    serviceName: 'Swedish Massage',
    serviceDuration: 60,
    staffId: 'staff-1',
    staffName: 'Therapist One',
    resourceId: 'room-1',
    resourceName: 'Room 1',
    paymentStatus: 'pending',
    checkedInAt: null,
    sessionStartedAt: null,
    sessionDueAt: null,
    sessionCompletedAt: null,
    createdAt: '2026-10-15T08:00:00Z',
    stage: 'waiting',
    isHomeService: false,
    dispatchContextAvailable: null,
    driverId: null,
    driverName: null,
    noDriverWarning: false,
    dispatchWarning: null,
    needsLocationReview: false,
    homeServiceAddress: null,
    ...overrides,
  };
}

function createTodayData(queue: DesktopTodayQueueItem[]): DesktopTodayData {
  return {
    context: {
      branchId: 'branch-main',
      branchName: 'Main Spa',
      businessDate: '2026-10-15',
      role: 'crm',
    },
    summary: {
      total: queue.length,
      pending: 0,
      confirmed: queue.length,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      unassigned: 0,
      waiting: queue.length,
      inService: 0,
      readyToPay: 0,
      completedService: 0,
      homeService: 0,
    },
    queue,
    readiness: {
      available: true,
      status: 'ok',
      issues: [],
      error: null,
    },
    attendance: {
      available: true,
      selectedDate: '2026-10-15',
      timezone: 'Asia/Manila',
      lastHourCount: 0,
      items: [],
      error: null,
    },
    notifications: {
      available: true,
      items: [],
      error: null,
    },
  };
}

function CrossModuleHarness() {
  const [activeModule, setActiveModule] = useState<'today' | 'bookings'>(
    'today',
  );

  return (
    <>
      <button type="button" onClick={() => setActiveModule('today')}>
        Show Today
      </button>

      <button type="button" onClick={() => setActiveModule('bookings')}>
        Show Bookings
      </button>

      <WorkspaceModulePresence
        moduleId="today"
        isActive={activeModule === 'today'}
      >
        <div hidden={activeModule !== 'today'}>
          <TodayView authContext={authContext} />
        </div>
      </WorkspaceModulePresence>

      <WorkspaceModulePresence
        moduleId="bookings"
        isActive={activeModule === 'bookings'}
      >
        <div hidden={activeModule !== 'bookings'}>
          <BookingsView authContext={authContext} />
        </div>
      </WorkspaceModulePresence>
    </>
  );
}

const LEGACY_RETENTION_VISITED = new Set<NavModuleId>([
  'customers',
  'settings',
]);

function LegacyRetentionHarness() {
  const [activeModule, setActiveModule] = useState<NavModuleId>('customers');

  const invalidate = useWorkspaceInvalidation();

  return (
    <>
      <button type="button" onClick={() => setActiveModule('customers')}>
        Show Customers
      </button>

      <button type="button" onClick={() => setActiveModule('settings')}>
        Show Settings
      </button>

      <button type="button" onClick={() => invalidate(['customers'])}>
        Invalidate Customers
      </button>

      <RetainedModuleWorkspace
        authContext={authContext}
        activeModule={activeModule}
        visitedModules={LEGACY_RETENTION_VISITED}
        onNavigate={setActiveModule}
      />
    </>
  );
}
describe('cross-module workspace invalidation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearInFlightOperationsForTests();
  });

  it('marks hidden Bookings dirty after successful Today mutation and refreshes only when activated', async () => {
    const initialQueue = [createQueueItem()];

    const refreshedQueue = [
      createQueueItem({
        bookingProgressStatus: 'checked_in',
      }),
    ];

    const initialBooking = createBooking(
      'booking-01',
      'Existing Customer',
      'confirmed',
    );

    const refreshedBooking = createBooking(
      'booking-01',
      'Existing Customer',
      'checked_in',
    );

    const todayFetchSpy = vi
      .spyOn(todayService, 'fetchToday')
      .mockResolvedValueOnce(createTodayData(initialQueue))
      .mockResolvedValueOnce(createTodayData(refreshedQueue));

    const mutateSpy = vi.spyOn(todayService, 'mutateToday').mockResolvedValue({
      ok: true,
      data: {},
    });

    const bookingsFetchSpy = vi
      .spyOn(bookingsService, 'fetchBranchBookings')
      .mockResolvedValueOnce([initialBooking])
      .mockResolvedValueOnce([refreshedBooking]);

    render(
      <WorkspaceLifecycleProvider>
        <CrossModuleHarness />
      </WorkspaceLifecycleProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('today-loading-skeleton')).toBeNull();
    });

    // Both retained workspaces validate once when first mounted.
    await waitFor(() => {
      expect(bookingsFetchSpy).toHaveBeenCalledTimes(1);
    });

    expect(todayFetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('action-mark_arrived-booking-01'));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledTimes(1);
    });

    // Today is active, so it reconciles immediately.
    await waitFor(() => {
      expect(todayFetchSpy).toHaveBeenCalledTimes(2);
    });

    // Bookings was invalidated but remains hidden, so no request yet.
    expect(bookingsFetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Show Bookings' }));

    // Activation of dirty Bookings triggers exactly one reconciliation.
    await waitFor(() => {
      expect(bookingsFetchSpy).toHaveBeenCalledTimes(2);
    });

    expect(bookingsFetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not invalidate Bookings when the Today mutation fails', async () => {
    vi.spyOn(todayService, 'fetchToday').mockResolvedValue(
      createTodayData([createQueueItem()]),
    );

    vi.spyOn(todayService, 'mutateToday').mockRejectedValue(
      new Error('Hosted mutation rejected'),
    );

    const bookingsFetchSpy = vi
      .spyOn(bookingsService, 'fetchBranchBookings')
      .mockResolvedValue([createBooking('booking-01', 'Existing Customer')]);

    render(
      <WorkspaceLifecycleProvider>
        <CrossModuleHarness />
      </WorkspaceLifecycleProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('today-loading-skeleton')).toBeNull();
    });

    await waitFor(() => {
      expect(bookingsFetchSpy).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByTestId('action-mark_arrived-booking-01'));

    await waitFor(() => {
      expect(screen.getByTestId('today-mutation-error')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Show Bookings' }));

    await Promise.resolve();

    // Failed authoritative writes must not dirty dependent workspaces.
    expect(bookingsFetchSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps a legacy retained module mounted normally and revalidates it once after hidden invalidation', async () => {
    const fetchSpy = vi
      .spyOn(customersService, 'fetchBranchCustomers')
      .mockResolvedValue({
        ok: true,
        tab: 'all',
        data: [],
        waitlist: [],
        pagination: {
          page: 1,
          pageSize: 6,
          totalCount: 0,
          totalPages: 1,
        },
        kpis: {
          totalCustomers: 0,
          repeatClients: 0,
          lapsedClients: 0,
          newThisMonth: 0,
          totalVisits: 0,
        },
      });

    render(
      <WorkspaceLifecycleProvider>
        <LegacyRetentionHarness />
      </WorkspaceLifecycleProvider>,
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const originalCustomersView = screen.getByTestId('customers-view');

    fireEvent.click(screen.getByRole('button', { name: 'Show Settings' }));

    expect(screen.getByTestId('retained-module-customers').hidden).toBe(true);

    // Ordinary navigation preserves the exact mounted Customers workspace.
    expect(screen.getByTestId('customers-view')).toBe(originalCustomersView);

    fireEvent.click(
      screen.getByRole('button', { name: 'Invalidate Customers' }),
    );

    await Promise.resolve();

    // Hidden invalidation must stay quiet.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('customers-view')).toBe(originalCustomersView);

    fireEvent.click(screen.getByRole('button', { name: 'Show Customers' }));

    // Activation observes the new generation and remounts the legacy
    // workspace, causing exactly one authoritative revalidation.
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByTestId('customers-view')).not.toBe(
      originalCustomersView,
    );

    await Promise.resolve();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
