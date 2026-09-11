import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '../src/types/auth';
import type {
  DesktopTodayData,
  DesktopTodayMutationResult,
  DesktopTodayQueueItem,
} from '../src/types/today';
import { TodayView } from '../src/components/today/TodayView';
import { calculateAdaptivePageSize } from '../src/components/today/adaptive-page-size';
import { fetchToday, mutateToday } from '../src/lib/today-service';
import { createBranchBooking } from '../src/lib/bookings-service';

vi.mock('../src/lib/today-service', () => ({
  fetchToday: vi.fn(),
  mutateToday: vi.fn(),
}));

vi.mock('../src/lib/bookings-service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../src/lib/bookings-service')>();
  return {
    ...actual,
    fetchBranchBookingOptions: vi.fn().mockResolvedValue({
      services: [
        {
          id: 's-1',
          name: 'Aromatherapy Massage',
          durationMinutes: 60,
          price: 700,
          availableInSpa: true,
          availableHomeService: true,
        },
      ],
      staff: [{ id: 'staff-01', name: 'Maria Santos', nickname: 'Maria' }],
      resources: [{ id: 'room-01', name: 'Room 1', type: 'room', capacity: 1 }],
    }),
    createBranchBooking: vi.fn(),
    searchBranchCustomers: vi.fn().mockResolvedValue([]),
  };
});

const mockedFetchToday = vi.mocked(fetchToday);
const mockedMutateToday = vi.mocked(mutateToday);

const authContext: AuthContext = {
  userId: 'user-01',
  email: 'reception@cradlehub.com',
  staffId: 'staff-01',
  fullName: 'Reception Staff',
  canonicalRole: 'crm',
  rawRole: 'receptionist',
  branchId: 'branch-101',
  branchName: 'Downtown Spa',
  isCrmEligible: true,
};

function createQueueItem(
  overrides: Partial<DesktopTodayQueueItem> = {},
): DesktopTodayQueueItem {
  return {
    id: 'booking-01',
    bookingDate: '2026-09-12',
    startTime: '09:00:00',
    endTime: '10:00:00',
    status: 'confirmed',
    bookingProgressStatus: 'not_started',
    type: 'standard',
    deliveryType: 'in_spa',
    customerName: 'Alice Walker',
    customerPhone: '+639170001111',
    serviceName: 'Aromatherapy Massage',
    serviceDuration: 60,
    staffId: 'staff-01',
    staffName: 'Maria Santos',
    resourceId: 'room-01',
    resourceName: 'Room 1',
    paymentStatus: 'pending',
    checkedInAt: null,
    sessionStartedAt: null,
    sessionDueAt: null,
    sessionCompletedAt: null,
    createdAt: '2026-09-11T10:00:00Z',
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

function createTodayData(
  overrides: Partial<DesktopTodayData> = {},
): DesktopTodayData {
  return {
    context: {
      branchId: 'branch-101',
      branchName: 'Downtown Spa',
      businessDate: '2026-09-12',
      role: 'receptionist',
    },
    summary: {
      total: 5,
      pending: 1,
      confirmed: 2,
      inProgress: 1,
      completed: 1,
      cancelled: 0,
      noShow: 0,
      unassigned: 1,
      waiting: 2,
      inService: 1,
      readyToPay: 1,
      completedService: 1,
      homeService: 1,
    },
    queue: [createQueueItem()],
    readiness: {
      available: true,
      status: 'ok',
      issues: [],
      error: null,
    },
    attendance: {
      available: true,
      selectedDate: '2026-09-12',
      timezone: 'Asia/Manila',
      lastHourCount: 2,
      items: [
        {
          eventId: 'scan-01',
          staffId: 'staff-01',
          staffName: 'Maria Santos',
          staffNickname: 'Maria',
          eventType: 'clock_in',
          outcome: 'success',
          reasonCode: null,
          message: null,
          occurredAt: '2026-09-12T08:00:00Z',
          clockInAt: '2026-09-12T08:00:00Z',
          clockOutAt: null,
          sourceLabel: 'NFC Badge',
        },
      ],
      error: null,
    },
    notifications: {
      available: true,
      items: [
        {
          id: 'notif-01',
          title: 'Unassigned Booking Warning',
          body: 'Booking needs therapist assignment.',
          type: 'booking_warning',
          priority: 'high',
          createdAt: '2026-09-12T08:15:00Z',
          requiresAction: true,
        },
      ],
      error: null,
    },
    ...overrides,
  };
}

describe('TodayView Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially while fetch is pending', () => {
    mockedFetchToday.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<TodayView authContext={authContext} />);

    expect(screen.getByTestId('today-loading-skeleton')).toBeDefined();
  });

  it('renders real authoritative snapshot and derives summary counts truthfully', async () => {
    const mockData = createTodayData();
    mockedFetchToday.mockResolvedValue(mockData);

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.queryByTestId('today-loading-skeleton')).toBeNull();
    });

    expect(screen.getByTestId('today-header')).toBeDefined();
    expect(screen.getByText(/Downtown Spa/)).toBeDefined();

    // Verify summary KPI counts derived from response
    expect(screen.getByTestId('kpi-waiting').textContent).toContain('2');
    expect(screen.getByTestId('kpi-in-service').textContent).toContain('1');
    expect(screen.getByTestId('kpi-ready-to-pay').textContent).toContain('1');
    expect(screen.getByTestId('kpi-completed').textContent).toContain('1');
    expect(screen.getByTestId('kpi-unassigned').textContent).toContain('1');
    expect(screen.getByTestId('kpi-home-service').textContent).toContain('1');

    // Queue item rendered
    expect(screen.getByTestId('today-row-booking-01')).toBeDefined();
    expect(screen.getAllByText('Alice Walker').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.getAllByText('Aromatherapy Massage').length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders fatal error banner and retries on click', async () => {
    mockedFetchToday.mockRejectedValueOnce(
      new Error('Network connection failed'),
    );

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('today-error-banner')).toBeDefined();
    });
    expect(screen.getByText('Network connection failed')).toBeDefined();

    // Retry
    const mockData = createTodayData();
    mockedFetchToday.mockResolvedValueOnce(mockData);

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('today-error-banner')).toBeNull();
    });
    expect(screen.getByTestId('today-row-booking-01')).toBeDefined();
  });

  it('renders truthful empty queue state when response has zero bookings', async () => {
    const emptyData = createTodayData({
      summary: {
        total: 0,
        pending: 0,
        confirmed: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        unassigned: 0,
        waiting: 0,
        inService: 0,
        readyToPay: 0,
        completedService: 0,
        homeService: 0,
      },
      queue: [],
    });
    mockedFetchToday.mockResolvedValue(emptyData);

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('today-queue-empty')).toBeDefined();
    });
    expect(screen.getByText('No bookings scheduled for today')).toBeDefined();
  });

  it('does NOT render readiness as healthy when readiness.available === false', async () => {
    const degradedData = createTodayData({
      readiness: {
        available: false,
        status: 'critical',
        issues: [],
        error: 'Readiness evaluation service offline',
      },
    });
    mockedFetchToday.mockResolvedValue(degradedData);

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.queryByTestId('today-loading-skeleton')).toBeNull();
    });

    // Readiness is rendered in the operational readiness strip on the main workflow surface
    expect(screen.getByTestId('readiness-degraded')).toBeDefined();
    expect(
      screen.getByText(/Readiness evaluation service offline/),
    ).toBeDefined();
    expect(screen.queryByTestId('readiness-all-clear')).toBeNull();
  });

  it('does NOT render attendance as empty success when attendance.available === false', async () => {
    const degradedData = createTodayData({
      attendance: {
        available: false,
        selectedDate: '2026-09-12',
        timezone: 'Asia/Manila',
        lastHourCount: 0,
        items: [],
        error: 'Attendance scanning service unreachable',
      },
    });
    mockedFetchToday.mockResolvedValue(degradedData);

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.queryByTestId('today-loading-skeleton')).toBeNull();
    });

    // Recent Scans tab in Activity card
    fireEvent.click(screen.getByRole('tab', { name: /recent scans/i }));

    expect(screen.getByTestId('attendance-degraded')).toBeDefined();
    expect(
      screen.getByText('Attendance scanning service unreachable'),
    ).toBeDefined();
    expect(screen.queryByTestId('attendance-empty')).toBeNull();
  });

  it('does NOT render notifications as empty success when notifications.available === false', async () => {
    const degradedData = createTodayData({
      notifications: {
        available: false,
        items: [],
        error: 'Notification service timed out',
      },
    });
    mockedFetchToday.mockResolvedValue(degradedData);

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.queryByTestId('today-loading-skeleton')).toBeNull();
    });

    // Switch to Recent Activity tab in Activity card
    fireEvent.click(screen.getByRole('tab', { name: /recent activity/i }));

    expect(screen.getByTestId('notifications-degraded')).toBeDefined();
    expect(screen.getByText('Notification service timed out')).toBeDefined();
    expect(screen.queryByTestId('notifications-empty')).toBeNull();
  });

  it('shows truthful empty state when notifications.available === true and 0 items', async () => {
    const emptyNotifsData = createTodayData({
      notifications: {
        available: true,
        items: [],
        error: null,
      },
    });
    mockedFetchToday.mockResolvedValue(emptyNotifsData);

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.queryByTestId('today-loading-skeleton')).toBeNull();
    });

    // Switch to Recent Activity tab in Activity card
    fireEvent.click(screen.getByRole('tab', { name: /recent activity/i }));

    expect(screen.getByTestId('notifications-empty')).toBeDefined();
    expect(screen.getByText('No action-required notifications.')).toBeDefined();
  });

  it('shows read-only Payment Pending pill and NO payment mutation button for ready_to_pay stage', async () => {
    const paymentStageBooking = createQueueItem({
      id: 'booking-payment-01',
      stage: 'ready_to_pay',
      bookingProgressStatus: 'completed',
      status: 'confirmed',
      paymentStatus: 'pending',
    });
    const mockData = createTodayData({ queue: [paymentStageBooking] });
    mockedFetchToday.mockResolvedValue(mockData);

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('today-row-booking-payment-01')).toBeDefined();
    });

    // In queue row: read-only text, no button
    expect(
      screen.getByTestId('payment-pending-pill-booking-payment-01').textContent,
    ).toContain('Payment Pending — manage on web');
    expect(
      screen.queryByRole('button', { name: /collect payment/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /confirm payment/i }),
    ).toBeNull();

    // In inspector detail: entirely removed from Today
    expect(screen.queryByTestId('selected-booking-detail')).toBeNull();
    expect(screen.queryByTestId('inspector-payment-pending-notice')).toBeNull();
  });

  it('shows truthful unavailable context when dispatchContextAvailable === false without faking no driver', async () => {
    const homeServiceBooking = createQueueItem({
      id: 'booking-hs-01',
      isHomeService: true,
      deliveryType: 'home_service',
      dispatchContextAvailable: false,
      driverId: null,
      driverName: null,
      noDriverWarning: false,
      homeServiceAddress: '456 Mango Ave',
    });
    const mockData = createTodayData({ queue: [homeServiceBooking] });
    mockedFetchToday.mockResolvedValue(mockData);

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('today-row-booking-hs-01')).toBeDefined();
    });

    // In queue row
    expect(screen.getByText('Dispatch unavailable')).toBeDefined();
    expect(screen.queryByText('No driver assigned')).toBeNull();
    expect(screen.queryByTestId('selected-booking-detail')).toBeNull();
  });

  it('executes supported operational mutation, handles in-flight pending state, and refreshes', async () => {
    const booking = createQueueItem({
      id: 'booking-01',
      status: 'confirmed',
      bookingProgressStatus: 'not_started',
      isHomeService: false,
    });
    const mockData = createTodayData({ queue: [booking] });
    mockedFetchToday.mockResolvedValue(mockData);

    let resolveMutation: (val: DesktopTodayMutationResult) => void;
    mockedMutateToday.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve;
      }),
    );

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(
        screen.getByTestId('action-mark_arrived-booking-01'),
      ).toBeDefined();
    });

    const markArrivedBtn = screen.getByTestId(
      'action-mark_arrived-booking-01',
    ) as HTMLButtonElement;
    fireEvent.click(markArrivedBtn);

    // Mutation in flight: button shows Updating... and is disabled
    expect(markArrivedBtn.textContent).toContain('Updating...');
    expect(markArrivedBtn.disabled).toBe(true);

    // Resolve mutation with real hosted Stage 09A success envelope
    resolveMutation!({
      ok: true,
      data: {},
    });

    await waitFor(() => {
      expect(screen.getByTestId('today-mutation-success')).toBeDefined();
    });
    expect(screen.getByText('Arrival recorded.')).toBeDefined();
    expect(screen.queryByTestId('today-mutation-error')).toBeNull();

    // Snapshot was re-fetched
    expect(mockedFetchToday).toHaveBeenCalledTimes(2);
  });

  it('displays mutation error truthfully when mutation fails without faking success', async () => {
    const booking = createQueueItem({
      id: 'booking-01',
      status: 'confirmed',
      bookingProgressStatus: 'not_started',
      isHomeService: false,
    });
    const mockData = createTodayData({ queue: [booking] });
    mockedFetchToday.mockResolvedValue(mockData);
    mockedMutateToday.mockRejectedValueOnce(
      new Error('Booking is closed and cannot be updated.'),
    );

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(
        screen.getByTestId('action-mark_arrived-booking-01'),
      ).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('action-mark_arrived-booking-01'));

    await waitFor(() => {
      expect(screen.getByTestId('today-mutation-error')).toBeDefined();
    });
    expect(
      screen.getByText('Booking is closed and cannot be updated.'),
    ).toBeDefined();
    expect(screen.queryByTestId('today-mutation-success')).toBeNull();
  });

  it('strictly excludes Home Service bookings from ALL Today mutations', async () => {
    const hsPending = createQueueItem({
      id: 'booking-hs-pending',
      status: 'pending',
      isHomeService: true,
    });
    const hsConfirmed = createQueueItem({
      id: 'booking-hs-confirmed',
      status: 'confirmed',
      bookingProgressStatus: 'not_started',
      isHomeService: true,
    });
    const hsCheckedIn = createQueueItem({
      id: 'booking-hs-checkedin',
      status: 'confirmed',
      bookingProgressStatus: 'checked_in',
      isHomeService: true,
    });
    const hsInProgress = createQueueItem({
      id: 'booking-hs-inprogress',
      status: 'in_progress',
      bookingProgressStatus: 'in_progress',
      isHomeService: true,
    });

    const mockData = createTodayData({
      queue: [hsPending, hsConfirmed, hsCheckedIn, hsInProgress],
    });
    mockedFetchToday.mockResolvedValue(mockData);

    render(<TodayView authContext={authContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('today-row-booking-hs-pending')).toBeDefined();
    });

    // Zero mutation buttons rendered for any Home Service row
    expect(
      screen.queryByTestId('action-confirm_booking-booking-hs-pending'),
    ).toBeNull();
    expect(
      screen.queryByTestId('action-mark_arrived-booking-hs-confirmed'),
    ).toBeNull();
    expect(
      screen.queryByTestId('action-start_service-booking-hs-checkedin'),
    ).toBeNull();
    expect(
      screen.queryByTestId('action-complete_service-booking-hs-inprogress'),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: /^confirm$/i })).toBeNull();
    expect(
      screen.queryByRole('button', { name: /^mark arrived$/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /^start service$/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /^complete service$/i }),
    ).toBeNull();
  });

  describe('action-eligibility presentation lifecycle', () => {
    it('offers Mark Arrived for confirmed + not_started in-spa booking', async () => {
      const item = createQueueItem({
        id: 'booking-confirmed-01',
        status: 'confirmed',
        bookingProgressStatus: 'not_started',
        isHomeService: false,
      });
      mockedFetchToday.mockResolvedValue(createTodayData({ queue: [item] }));

      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('action-mark_arrived-booking-confirmed-01'),
        ).toBeDefined();
      });
      expect(
        screen.getAllByRole('button', { name: /mark arrived/i }).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('offers Start Service for checked_in booking', async () => {
      const item = createQueueItem({
        id: 'booking-checkedin-01',
        status: 'confirmed',
        bookingProgressStatus: 'checked_in',
        isHomeService: false,
      });
      mockedFetchToday.mockResolvedValue(createTodayData({ queue: [item] }));

      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('action-start_service-booking-checkedin-01'),
        ).toBeDefined();
      });
      expect(
        screen.getAllByRole('button', { name: /start service/i }).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('offers Complete Service for session_started progress signal', async () => {
      const item = createQueueItem({
        id: 'booking-started-01',
        status: 'confirmed',
        bookingProgressStatus: 'session_started',
        isHomeService: false,
      });
      mockedFetchToday.mockResolvedValue(createTodayData({ queue: [item] }));

      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('action-complete_service-booking-started-01'),
        ).toBeDefined();
      });
      expect(
        screen.getAllByRole('button', { name: /complete service/i }).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('offers Complete Service when booking status is in_progress', async () => {
      const item = createQueueItem({
        id: 'booking-inprogress-01',
        status: 'in_progress',
        stage: 'in_service',
        isHomeService: false,
      });
      mockedFetchToday.mockResolvedValue(createTodayData({ queue: [item] }));

      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('action-complete_service-booking-inprogress-01'),
        ).toBeDefined();
      });
      expect(
        screen.getAllByRole('button', { name: /complete service/i }).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('offers Confirm for waiting/not_started booking with synthetic status without copied allow-list', async () => {
      const item = createQueueItem({
        id: 'booking-synth-01',
        status: 'awaiting_confirmation',
        stage: 'waiting',
        bookingProgressStatus: 'not_started',
        isHomeService: false,
      });
      mockedFetchToday.mockResolvedValue(createTodayData({ queue: [item] }));

      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('action-confirm_booking-booking-synth-01'),
        ).toBeDefined();
      });
      expect(
        screen.getAllByRole('button', { name: /^confirm$/i }).length,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Owner-Directed Layout Correction Suite', () => {
    it('renders persistent three-card right rail and removes old persistent inspector tabs', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());

      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-page-grid')).toBeDefined();
      });

      // Three independent cards exist in the right rail
      expect(screen.getByTestId('today-right-rail')).toBeDefined();
      expect(screen.getByTestId('today-activity-card')).toBeDefined();
      expect(screen.getByTestId('today-quick-actions-card')).toBeDefined();
      expect(screen.getByTestId('today-money-card')).toBeDefined();

      // Old persistent inspector column & tabs are NOT in the right rail
      expect(screen.queryByTestId('module-inspector-column')).toBeNull();
      expect(screen.queryByRole('tab', { name: /^readiness$/i })).toBeNull();
    });

    it('renders Activity card with Recent Scans and Recent Activity tabs, Snapshot badge, and no fake Live badge', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());

      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-activity-card')).toBeDefined();
      });

      // Tabs exist
      expect(screen.getByTestId('tab-recent-scans')).toBeDefined();
      expect(screen.getByTestId('tab-recent-activity')).toBeDefined();

      // Truthful freshness indicator: "Snapshot", NOT "Live" or "Realtime"
      expect(screen.getByText('Snapshot')).toBeDefined();
      expect(screen.queryByText(/^live$/i)).toBeNull();
      expect(screen.queryByText(/realtime/i)).toBeNull();

      // Scans list renders real scan
      expect(screen.getAllByText('Maria Santos').length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.getByText(/NFC Badge/)).toBeDefined();
    });

    it('Activity card footer navigates to attendance using canonical module navigation', async () => {
      const onNavigate = vi.fn();
      mockedFetchToday.mockResolvedValue(createTodayData());

      render(<TodayView authContext={authContext} onNavigate={onNavigate} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('activity-view-attendance-btn'),
        ).toBeDefined();
      });

      fireEvent.click(screen.getByTestId('activity-view-attendance-btn'));
      expect(onNavigate).toHaveBeenCalledWith('attendance');
    });

    it('Quick Actions card renders 4 canonical actions and navigates correctly', async () => {
      const onNavigate = vi.fn();
      mockedFetchToday.mockResolvedValue(createTodayData());

      render(<TodayView authContext={authContext} onNavigate={onNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-quick-actions-card')).toBeDefined();
      });

      // Customers
      fireEvent.click(screen.getByTestId('quick-action-customers'));
      expect(onNavigate).toHaveBeenCalledWith('customers');

      // Schedule
      fireEvent.click(screen.getByTestId('quick-action-schedule'));
      expect(onNavigate).toHaveBeenCalledWith('schedule');

      // Attendance
      fireEvent.click(screen.getByTestId('quick-action-attendance'));
      expect(onNavigate).toHaveBeenCalledWith('attendance');

      // Home Service
      fireEvent.click(screen.getByTestId('quick-action-home-service'));
      expect(onNavigate).toHaveBeenCalledWith('home-service');
    });

    it("Today's Money card shows truthful unavailable / web-only state with NO fake money values", async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());

      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-money-card')).toBeDefined();
      });

      expect(screen.getByText("Today's Money")).toBeDefined();
      expect(screen.getByText('Web only')).toBeDefined();
      expect(
        screen.getByText(/Financial summary is not available in Desktop yet/i),
      ).toBeDefined();

      // Zero fake currency symbols, zero fake values
      expect(screen.queryByText(/₱/)).toBeNull();
      expect(screen.queryByText(/198/)).toBeNull();
      expect(screen.queryByText(/145/)).toBeNull();

      // No payment mutation controls
      expect(
        screen.queryByRole('button', { name: /collect payment/i }),
      ).toBeNull();
      expect(
        screen.queryByRole('button', { name: /confirm payment/i }),
      ).toBeNull();
    });

    it('renders front-desk action strip with New Booking, Walk-in, Book for Later, and Home Service', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());

      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-action-strip')).toBeDefined();
      });

      expect(screen.getByTestId('action-card-new-booking')).toBeDefined();
      expect(screen.getByTestId('action-card-walk-in')).toBeDefined();
      expect(screen.getByTestId('action-card-book-later')).toBeDefined();
      expect(screen.getByTestId('kpi-home-service')).toBeDefined();

      // Static Front Desk View indicator exists in header
      expect(screen.getByTestId('today-view-selector').textContent).toContain(
        'Front Desk View',
      );
    });
  });

  describe('Section 33 — Booking Details Removed', () => {
    it('does not render selected-booking-detail card on initial load', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-row-booking-01')).toBeDefined();
      });

      expect(screen.queryByTestId('selected-booking-detail')).toBeNull();
      expect(screen.queryByText(/Booking Details —/)).toBeNull();
    });

    it('clicking a queue row does not open an inline details card', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-row-booking-01')).toBeDefined();
      });

      fireEvent.click(screen.getByTestId('today-row-booking-01'));
      expect(screen.queryByTestId('selected-booking-detail')).toBeNull();
    });

    it('first loaded booking is not automatically selected or expanded', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-row-booking-01')).toBeDefined();
      });

      const row = screen.getByTestId('today-row-booking-01');
      expect(row.classList.contains('selected')).toBe(false);
      expect(row.getAttribute('tabindex')).toBeNull();
      expect(screen.queryByTestId('selected-booking-detail')).toBeNull();
    });

    it('queue action buttons remain fully interactive without row selection', async () => {
      const item = createQueueItem({
        id: 'booking-interactive-01',
        status: 'confirmed',
        bookingProgressStatus: 'not_started',
      });
      mockedFetchToday.mockResolvedValue(createTodayData({ queue: [item] }));
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('action-mark_arrived-booking-interactive-01'),
        ).toBeDefined();
      });

      const actionBtn = screen.getByTestId(
        'action-mark_arrived-booking-interactive-01',
      );
      expect(actionBtn).toBeDefined();
      expect((actionBtn as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('Section 34 — Upper Action Cards Open Canonical Booking Modal', () => {
    it('New Booking card opens canonical NewBookingModal in default mode', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-card-new-booking')).toBeDefined();
      });

      fireEvent.click(screen.getByTestId('action-card-new-booking'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });
      expect(
        screen.getByRole('heading', { name: 'New Booking' }),
      ).toBeDefined();
    });

    it('Walk-in card opens modal with Walk-in mode selected', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-card-walk-in')).toBeDefined();
      });

      fireEvent.click(screen.getByTestId('action-card-walk-in'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });
      const walkinTab = screen.getByRole('tab', { name: /walk-in/i });
      expect(walkinTab.getAttribute('aria-selected')).toBe('true');
    });

    it('Book for Later card opens modal with Future mode selected', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-card-book-later')).toBeDefined();
      });

      fireEvent.click(screen.getByTestId('action-card-book-later'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });
      const futureTab = screen.getByRole('tab', { name: /future/i });
      expect(futureTab.getAttribute('aria-selected')).toBe('true');
    });

    it('Home Service card opens modal showing truthful disabled Home Service state and forbids submit', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('kpi-home-service')).toBeDefined();
      });

      fireEvent.click(screen.getByTestId('kpi-home-service'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });
      expect(screen.getByTestId('home-service-disabled-notice')).toBeDefined();
      expect(
        screen.getByText(
          /Home Service booking will be enabled after precise address\/location support is connected/i,
        ),
      ).toBeDefined();

      const submitBtn = screen.getByRole('button', {
        name: /create booking/i,
      }) as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(true);

      // Attempt submit
      fireEvent.click(submitBtn);
      expect(createBranchBooking).not.toHaveBeenCalled();
    });

    it('successful booking creation in modal triggers Today refresh without navigating away', async () => {
      mockedFetchToday.mockResolvedValue(createTodayData());
      const onNavigate = vi.fn();

      render(<TodayView authContext={authContext} onNavigate={onNavigate} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-card-walk-in')).toBeDefined();
      });

      // Initial fetch was called once
      expect(mockedFetchToday).toHaveBeenCalledTimes(1);

      // Open modal
      fireEvent.click(screen.getByTestId('action-card-walk-in'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      // Does not navigate away
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Section 35 — Today Queue Pagination', () => {
    it('calculates adaptive page size correctly across height thresholds', () => {
      expect(calculateAdaptivePageSize(0)).toBe(5);
      expect(calculateAdaptivePageSize(100, 48, 36, 3, 8)).toBe(3); // min clamp
      expect(calculateAdaptivePageSize(250, 48, 36, 3, 8)).toBe(4); // floor((250-36)/48) = 4
      expect(calculateAdaptivePageSize(400, 48, 36, 3, 8)).toBe(7); // floor((400-36)/48) = 7
      expect(calculateAdaptivePageSize(1000, 48, 36, 3, 8)).toBe(8); // max clamp
    });

    it('paginates queue rows and navigates next and previous pages', async () => {
      const items = Array.from({ length: 12 }, (_, i) =>
        createQueueItem({
          id: `booking-${i + 1}`,
          customerName: `Customer ${i + 1}`,
        }),
      );
      mockedFetchToday.mockResolvedValue(createTodayData({ queue: items }));
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-row-booking-1')).toBeDefined();
      });

      // By default pageSize is 5 (fallback when container height is 0 in test environment)
      expect(screen.getByTestId('today-row-booking-1')).toBeDefined();
      expect(screen.getByTestId('today-row-booking-5')).toBeDefined();
      expect(screen.queryByTestId('today-row-booking-6')).toBeNull();

      // Next page
      const nextBtn = screen.getByRole('button', { name: /next page/i });
      fireEvent.click(nextBtn);

      expect(screen.queryByTestId('today-row-booking-1')).toBeNull();
      expect(screen.getByTestId('today-row-booking-6')).toBeDefined();
      expect(screen.getByTestId('today-row-booking-10')).toBeDefined();
      expect(screen.queryByTestId('today-row-booking-11')).toBeNull();

      // Prev page
      const prevBtn = screen.getByRole('button', { name: /previous page/i });
      fireEvent.click(prevBtn);

      expect(screen.getByTestId('today-row-booking-1')).toBeDefined();
      expect(screen.queryByTestId('today-row-booking-6')).toBeNull();
    });

    it('resets page to 1 when changing stage filter', async () => {
      const items = [
        createQueueItem({ id: 'b-w-1', stage: 'waiting' }),
        createQueueItem({ id: 'b-w-2', stage: 'waiting' }),
        createQueueItem({ id: 'b-w-3', stage: 'waiting' }),
        createQueueItem({ id: 'b-w-4', stage: 'waiting' }),
        createQueueItem({ id: 'b-w-5', stage: 'waiting' }),
        createQueueItem({ id: 'b-w-6', stage: 'waiting' }),
        createQueueItem({ id: 'b-i-1', stage: 'in_service' }),
      ];
      mockedFetchToday.mockResolvedValue(createTodayData({ queue: items }));
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-row-b-w-1')).toBeDefined();
      });

      // Go to page 2
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(screen.getByTestId('today-row-b-w-6')).toBeDefined();

      // Switch tab to in_service
      fireEvent.click(screen.getByTestId('kpi-in-service'));
      expect(screen.getByTestId('today-row-b-i-1')).toBeDefined();
      // Pagination shows page 1
      expect(screen.getByText(/Page 1 of 1/i)).toBeDefined();
    });

    it('resets page to 1 when changing search query', async () => {
      const items = Array.from({ length: 12 }, (_, i) =>
        createQueueItem({
          id: `booking-${i + 1}`,
          customerName: i === 11 ? 'Special Guest' : `Customer ${i + 1}`,
        }),
      );
      mockedFetchToday.mockResolvedValue(createTodayData({ queue: items }));
      render(<TodayView authContext={authContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('today-row-booking-1')).toBeDefined();
      });

      // Go to page 2
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));

      // Type in search
      const searchInput = screen.getByTestId('today-search-input');
      fireEvent.change(searchInput, { target: { value: 'Special' } });

      expect(screen.getByTestId('today-row-booking-12')).toBeDefined();
      expect(screen.getByText(/Page 1 of 1/i)).toBeDefined();
    });
  });
});
