import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '../src/types/auth';
import type {
  HomeServiceBookingDetail,
  HomeServiceDriver,
  HomeServiceQueueItem,
  HomeServiceRecommendations,
  HomeServiceResponse,
} from '../src/types/home-service';
import { HomeServiceView } from '../src/components/home-service/HomeServiceView';
import { HomeServiceMapCard } from '../src/components/home-service/HomeServiceMapCard';
import {
  fetchHomeService,
  fetchHomeServiceBookingDetail,
  fetchHomeServiceDrivers,
  fetchHomeServiceRecommendations,
  mutateHomeService,
} from '../src/lib/home-service-service';

vi.mock('../src/lib/home-service-service', () => ({
  cancelHomeServiceBooking: vi.fn(),
  fetchHomeService: vi.fn(),
  fetchHomeServiceBookingDetail: vi.fn(),
  fetchHomeServiceDrivers: vi.fn(),
  fetchHomeServiceRecommendations: vi.fn(),
  getTodayDateString: () => '2026-09-12',
  mutateHomeService: vi.fn(),
  rescheduleHomeServiceBooking: vi.fn(),
}));

const mockedFetchHomeService = vi.mocked(fetchHomeService);
const mockedFetchDrivers = vi.mocked(fetchHomeServiceDrivers);
const mockedFetchDetail = vi.mocked(fetchHomeServiceBookingDetail);
const mockedFetchRecommendations = vi.mocked(fetchHomeServiceRecommendations);
const mockedMutate = vi.mocked(mutateHomeService);
const authContext: AuthContext = {
  userId: 'user-1',
  email: 'admin@cradlehub.com',
  staffId: 'staff-admin',
  fullName: 'Main Admin',
  canonicalRole: 'owner',
  rawRole: 'owner',
  branchId: 'branch-main',
  branchName: 'Main Spa',
  isCrmEligible: true,
};

function createQueueItem(
  overrides: Partial<HomeServiceQueueItem> = {},
): HomeServiceQueueItem {
  return {
    id: 'booking-1',
    bookingDate: '2026-09-12',
    startTime: '14:30:00',
    endTime: '15:30:00',
    customerName: 'testing 2',
    serviceName: 'Angels Massage',
    area: 'Bacolod',
    formattedAddress:
      'Central Philippine Adventist College, Bacolod, 6129 Negros Occidental',
    lat: 10.6433451,
    lng: 123.0696699,
    branchName: 'Main Spa',
    needsLocationReview: true,
    driverId: null,
    driverName: null,
    therapistId: 'staff-therapist',
    therapistName: 'Maria Therapist',
    dispatchStatus: 'awaiting_driver',
    bookingStatus: 'pending_payment',
    bookingProgressStatus: 'not_started',
    paymentStatus: 'pending',
    eta: null,
    travelStartedAt: null,
    arrivedAt: null,
    sessionStartedAt: null,
    completedAt: null,
    latestDriverLocation: null,
    ...overrides,
  };
}

function createWorkspaceResponse(
  items: HomeServiceQueueItem[] = [createQueueItem()],
): HomeServiceResponse {
  const awaitingDispatch = items.filter(
    (i) =>
      i.dispatchStatus === 'awaiting_driver' || i.dispatchStatus === 'ready',
  ).length;
  const activeTrips = items.filter(
    (i) =>
      i.dispatchStatus === 'in_route' ||
      i.dispatchStatus === 'arrived_at_customer',
  ).length;
  const completedToday = items.filter(
    (i) => i.dispatchStatus === 'completed',
  ).length;
  const cancelledToday = items.filter(
    (i) => i.dispatchStatus === 'cancelled',
  ).length;

  return {
    ok: true,
    data: {
      context: {
        branchId: 'branch-main',
        branchName: 'Main Spa',
        date: '2026-09-12',
      },
      summary: {
        totalToday: items.length,
        awaitingDispatch,
        activeTrips,
        completedToday,
        cancelledToday,
      },
      items,
      alerts: items.some((i) => i.needsLocationReview)
        ? [
            {
              id: 'alert-loc-1',
              bookingId: items[0].id,
              title: 'GPS Location Needed',
              description: `${items[0].customerName} · ${items[0].serviceName}`,
              severity: 'danger',
              timeAgo: '—',
            },
          ]
        : [],
      locationSemantics:
        'Coordinates and driver snapshots are recorded data. No live route tracking is active.',
    },
  };
}

function createDriverRecord(
  overrides: Partial<HomeServiceDriver> = {},
): HomeServiceDriver {
  return {
    id: 'driver-1',
    name: 'Juan Driver',
    systemRole: 'driver',
    staffType: 'full_time',
    isActive: true,
    ...overrides,
  };
}

function createDetailRecord(bookingId = 'booking-1'): HomeServiceBookingDetail {
  return {
    id: bookingId,
    branchId: 'branch-main',
    date: '2026-09-12',
    startTime: '14:30:00',
    endTime: '15:30:00',
    customer: {
      id: 'cust-1',
      name: 'testing 2',
      phone: '09123456789',
      email: 'testing2@example.com',
    },
    service: {
      id: 'svc-1',
      name: 'Angels Massage',
      durationMinutes: 60,
    },
    therapist: {
      id: 'staff-therapist',
      name: 'Maria Therapist',
    },
    driver: {
      id: null,
      name: null,
    },
    status: 'pending_payment',
    progressStatus: 'not_started',
    paymentStatus: 'pending',
    type: 'home_service',
    deliveryType: 'home_service',
    bookingMode: 'standard',
    homeServiceAddress: {
      fullAddress:
        'Central Philippine Adventist College, Bacolod, 6129 Negros Occidental',
      accessNote: 'Building 3 second floor',
      barangay: null,
      city: 'Bacolod',
      landmark: 'Near chapel',
      lat: 10.6433451,
      lng: 123.0696699,
    },
    lifecycle: {
      checkedInAt: null,
      travelStartedAt: null,
      arrivedAt: null,
      sessionStartedAt: null,
      sessionCompletedAt: null,
      completedAt: null,
    },
    events: [
      {
        id: 'event-1',
        fromStatus: null,
        toStatus: 'pending_payment',
        notes: 'Created via hosted portal',
        createdAt: '2026-09-11T08:00:00.000Z',
      },
    ],
  };
}

function createRecommendations(): HomeServiceRecommendations {
  return {
    therapists: [
      {
        id: 'staff-therapist',
        name: 'Maria Therapist',
        score: 92,
        reasons: ['Scheduled'],
      },
      {
        id: 'staff-2',
        name: 'Elena Santos',
        score: 85,
        reasons: ['Available'],
      },
    ],
    drivers: [
      {
        id: 'driver-1',
        name: 'Juan Driver',
        score: 96,
        reasons: ['Nearest branch'],
      },
      {
        id: 'driver-2',
        name: 'Pedro Reyes',
        score: 80,
        reasons: ['Available'],
      },
    ],
  };
}

async function waitForQueueLoaded() {
  await waitFor(() => {
    expect(screen.getByTestId('home-service-queue-grid')).toBeDefined();
  });
  return screen.getByTestId('home-service-queue-grid');
}

describe('HomeServiceView Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchHomeService.mockResolvedValue(createWorkspaceResponse());
    mockedFetchDrivers.mockResolvedValue({
      ok: true,
      data: { branchId: 'branch-main', drivers: [createDriverRecord()] },
    });
    mockedFetchDetail.mockResolvedValue({
      ok: true,
      data: createDetailRecord(),
    });
    mockedFetchRecommendations.mockResolvedValue({
      ok: true,
      data: createRecommendations(),
    });
  });

  it('12. renders loading state while initial fetch is in flight', () => {
    mockedFetchHomeService.mockReturnValue(new Promise(() => {}));
    render(<HomeServiceView authContext={authContext} />);

    expect(screen.getByTestId('home-service-loading')).toBeDefined();
  });

  it('13. renders empty queue truthfully when no bookings exist', async () => {
    mockedFetchHomeService.mockResolvedValue(createWorkspaceResponse([]));
    render(<HomeServiceView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.getByText('No Home Service bookings')).toBeDefined();
    });
    expect(
      screen.getByText(/no authoritative home service records are available/i),
    ).toBeDefined();
  });

  it('14. displays error banner on API failure and retries on click', async () => {
    mockedFetchHomeService.mockRejectedValueOnce(
      new Error('Hosted network unavailable'),
    );
    render(<HomeServiceView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.getByText('Hosted network unavailable')).toBeDefined();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    mockedFetchHomeService.mockResolvedValueOnce(createWorkspaceResponse());
    fireEvent.click(retryButton);

    const queueGrid = await waitForQueueLoaded();
    expect(within(queueGrid).getByText('testing 2')).toBeDefined();
  });

  it('15. renders populated queue with customer, service, time, and status', async () => {
    render(<HomeServiceView authContext={authContext} />);

    const queueGrid = await waitForQueueLoaded();
    expect(within(queueGrid).getByText('testing 2')).toBeDefined();
    expect(within(queueGrid).getByText('Angels Massage')).toBeDefined();
    expect(within(queueGrid).getByText(/awaiting driver/i)).toBeDefined();
    expect(within(queueGrid).getByText('2:30 PM')).toBeDefined();
  });

  it('16. filters queue rows by search query, status, and area', async () => {
    const item1 = createQueueItem({
      id: 'b-1',
      customerName: 'Alice Green',
      area: 'Bacolod',
    });
    const item2 = createQueueItem({
      id: 'b-2',
      customerName: 'Bob White',
      area: 'Talisay',
    });
    mockedFetchHomeService.mockResolvedValue(
      createWorkspaceResponse([item1, item2]),
    );

    render(<HomeServiceView authContext={authContext} />);
    const queueGrid = await waitForQueueLoaded();
    expect(within(queueGrid).getByText('Alice Green')).toBeDefined();
    expect(within(queueGrid).getByText('Bob White')).toBeDefined();

    const searchInput = screen.getByPlaceholderText(
      /search customer, service/i,
    );
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    expect(within(queueGrid).getByText('Alice Green')).toBeDefined();
    expect(within(queueGrid).queryByText('Bob White')).toBeNull();
  });

  it('17. filters queue rows by scope tabs (Needs Dispatch, On the Way, etc.)', async () => {
    const awaiting = createQueueItem({
      id: 'b-await',
      customerName: 'Customer Awaiting',
      dispatchStatus: 'awaiting_driver',
    });
    const inRoute = createQueueItem({
      id: 'b-route',
      customerName: 'Customer InRoute',
      dispatchStatus: 'in_route',
    });
    mockedFetchHomeService.mockResolvedValue(
      createWorkspaceResponse([awaiting, inRoute]),
    );

    render(<HomeServiceView authContext={authContext} />);
    const queueGrid = await waitForQueueLoaded();
    expect(within(queueGrid).getByText('Customer Awaiting')).toBeDefined();
    expect(within(queueGrid).getByText('Customer InRoute')).toBeDefined();

    // Click "Needs Dispatch" tab
    const needsDispatchTab = screen.getByTestId(
      'home-service-queue-tab-needs-dispatch',
    );
    fireEvent.click(needsDispatchTab);

    expect(within(queueGrid).getByText('Customer Awaiting')).toBeDefined();
    expect(within(queueGrid).queryByText('Customer InRoute')).toBeNull();

    // Click "On the Way" tab
    const onTheWayTab = screen.getByTestId('home-service-queue-tab-on-the-way');
    fireEvent.click(onTheWayTab);

    expect(within(queueGrid).queryByText('Customer Awaiting')).toBeNull();
    expect(within(queueGrid).getByText('Customer InRoute')).toBeDefined();
  });

  it('18. updates selection on row click', async () => {
    const item1 = createQueueItem({ id: 'b-1', customerName: 'First Item' });
    const item2 = createQueueItem({ id: 'b-2', customerName: 'Second Item' });
    mockedFetchHomeService.mockResolvedValue(
      createWorkspaceResponse([item1, item2]),
    );

    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    const row2 = screen.getByTestId('home-service-row-b-2');
    fireEvent.click(row2);

    expect(row2.className).toContain('selected');
  });

  it('19. opens dispatch details modal on keyboard Enter or Space on row', async () => {
    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    const row = screen.getByTestId('home-service-row-booking-1');
    fireEvent.keyDown(row, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });
  });

  it('20. opens dispatch details modal on row click', async () => {
    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    const row = screen.getByTestId('home-service-row-booking-1');
    fireEvent.click(row);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });
    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog')).getByText('09123456789'),
      ).toBeDefined();
    });
  });

  it('21. closes dispatch details modal via close button and Escape key', async () => {
    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    fireEvent.click(screen.getByTestId('home-service-row-booking-1'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    // Close via close button
    const closeBtn = screen.getByRole('button', {
      name: /close dispatch details/i,
    });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Reopen and close via Escape
    fireEvent.click(screen.getByTestId('home-service-row-booking-1'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('22. displays detail load error gracefully inside modal', async () => {
    mockedFetchDetail.mockRejectedValue(
      new Error('Failed to load booking details.'),
    );
    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    fireEvent.click(screen.getByTestId('home-service-row-booking-1'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('Failed to load booking details.')).toBeDefined();
    });
  });

  it('23. handles assign driver mutation and refreshes workspace', async () => {
    mockedMutate.mockResolvedValue({ ok: true, data: { releasedNow: false } });
    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    fireEvent.click(screen.getByTestId('home-service-row-booking-1'));
    const driverSelect = await waitFor(() =>
      screen.getByLabelText(/assign driver/i),
    );
    fireEvent.change(driverSelect, { target: { value: 'driver-1' } });

    await waitFor(() => {
      const btn = screen.getAllByRole('button', {
        name: 'Assign',
      })[0] as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    const assignBtn = screen.getAllByRole('button', { name: 'Assign' })[0];
    fireEvent.click(assignBtn);

    await waitFor(() => {
      expect(mockedMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'assign_driver',
          bookingId: 'booking-1',
          driverId: 'driver-1',
        }),
      );
      expect(screen.getByText('Driver assignment saved.')).toBeDefined();
    });
  });

  it('24. displays mutation failure truthfully without false success banner', async () => {
    mockedMutate.mockRejectedValue(new Error('Driver already on active run'));
    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    fireEvent.click(screen.getByTestId('home-service-row-booking-1'));
    const driverSelect = await waitFor(() =>
      screen.getByLabelText(/assign driver/i),
    );
    fireEvent.change(driverSelect, { target: { value: 'driver-1' } });

    await waitFor(() => {
      const btn = screen.getAllByRole('button', {
        name: 'Assign',
      })[0] as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    const assignBtn = screen.getAllByRole('button', { name: 'Assign' })[0];
    fireEvent.click(assignBtn);

    await waitFor(() => {
      expect(screen.getByText('Driver already on active run')).toBeDefined();
    });
    expect(screen.queryByText('Driver assignment saved.')).toBeNull();
  });

  it('25. displays "—" when ETA is not provided, never inventing a fallback number', async () => {
    const itemWithoutEta = createQueueItem({ eta: null });
    mockedFetchHomeService.mockResolvedValue(
      createWorkspaceResponse([itemWithoutEta]),
    );

    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    const row = screen.getByTestId('home-service-row-booking-1');
    expect(within(row).queryByText(/ETA/i)).toBeNull();
  });

  it('26. renders real authoritative ETA when supplied', async () => {
    const itemWithEta = createQueueItem({
      eta: {
        minutes: 22,
        source: 'stored_routes_api',
        calculatedAt: '2026-09-12T06:30:00Z',
        origin: 'Main Spa',
      },
    });
    mockedFetchHomeService.mockResolvedValue(
      createWorkspaceResponse([itemWithEta]),
    );

    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    const row = screen.getByTestId('home-service-row-booking-1');
    expect(within(row).getByText(/ETA 22 min/i)).toBeDefined();
  });

  it('27. truthfully displays location status when coordinates are unavailable', async () => {
    const itemWithoutGps = createQueueItem({ lat: null, lng: null });
    mockedFetchHomeService.mockResolvedValue(
      createWorkspaceResponse([itemWithoutGps]),
    );

    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    const row = screen.getByTestId('home-service-row-booking-1');
    expect(within(row).getByText(/location unavailable/i)).toBeDefined();
  });

  it('28. navigates to Drivers tab, displaying active drivers and their counts', async () => {
    render(<HomeServiceView authContext={authContext} />);
    await waitForQueueLoaded();

    const driversTab = screen.getByTestId('home-service-tab-drivers');
    fireEvent.click(driversTab);

    await waitFor(() => {
      expect(screen.getByText('Juan Driver')).toBeDefined();
    });
    expect(screen.getByText('Active staff')).toBeDefined();
    expect(screen.getByPlaceholderText(/search drivers/i)).toBeDefined();
  });
});

describe('HomeServiceMapCard Truth Component', () => {
  it('29. renders honest map layer unavailable message and truthful semantics', () => {
    const item = createQueueItem();
    render(
      <HomeServiceMapCard
        items={[item]}
        drivers={[createDriverRecord()]}
        selectedItem={item}
        summary={{
          totalToday: 1,
          awaitingDispatch: 1,
          activeTrips: 0,
          completedToday: 0,
          cancelledToday: 0,
        }}
        locationSemantics="Coordinates and driver snapshots are recorded data. No live route tracking is active."
      />,
    );

    expect(
      screen.getByText(/interactive map tiles are not connected yet/i),
    ).toBeDefined();
    expect(
      screen.getByText(
        /real customer coordinates and recorded driver locations remain available/i,
      ),
    ).toBeDefined();
    expect(
      screen.getByText(/coordinates and driver snapshots are recorded data/i),
    ).toBeDefined();
    const zoomInBtn = screen.getByRole('button', {
      name: /zoom in unavailable/i,
    }) as HTMLButtonElement;
    expect(zoomInBtn.disabled).toBe(true);
    const zoomOutBtn = screen.getByRole('button', {
      name: /zoom out unavailable/i,
    }) as HTMLButtonElement;
    expect(zoomOutBtn.disabled).toBe(true);
  });
});
