import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '../src/types/auth';
import type {
  DesktopTodayData,
  DesktopTodayMutationResult,
  DesktopTodayQueueItem,
} from '../src/types/today';
import { TodayView } from '../src/components/today/TodayView';
import { fetchToday, mutateToday } from '../src/lib/today-service';

vi.mock('../src/lib/today-service', () => ({
  fetchToday: vi.fn(),
  mutateToday: vi.fn(),
}));

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

    // Switch to Readiness inspector tab
    fireEvent.click(screen.getByRole('tab', { name: /readiness/i }));

    expect(screen.getByTestId('readiness-degraded')).toBeDefined();
    expect(
      screen.getByText('Readiness evaluation service offline'),
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

    // Switch to Attendance tab
    fireEvent.click(screen.getByRole('tab', { name: /attendance/i }));

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

    // Switch to Alerts tab
    fireEvent.click(screen.getByRole('tab', { name: /alerts/i }));

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

    fireEvent.click(screen.getByRole('tab', { name: /alerts/i }));

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

    // In inspector detail: read-only text, no payment CTA
    expect(
      screen.getByTestId('inspector-payment-pending-notice').textContent,
    ).toContain('Payment Pending — manage on web');
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

    // In inspector
    expect(
      screen.getByText('Dispatch context unavailable on desktop'),
    ).toBeDefined();
    expect(screen.queryByText('No driver assigned')).toBeNull();
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

    // Resolve mutation
    resolveMutation!({
      ok: true,
      data: { success: true, bookingId: 'booking-01', status: 'confirmed' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('today-mutation-success')).toBeDefined();
    });

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
});
