import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { fetchToday, mutateToday } from '../src/lib/today-service';
import type {
  DesktopTodayData,
  DesktopTodayMutationPayload,
} from '../src/types/today';

function createMockSupabaseClient(
  token: string | null = 'test-token',
): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: token ? { access_token: token } : null,
        },
        error: null,
      }),
    },
  } as unknown as SupabaseClient;
}

function validTodayData(): DesktopTodayData {
  return {
    context: {
      branchId: 'branch-101',
      branchName: 'Downtown Spa',
      businessDate: '2026-09-12',
      role: 'receptionist',
    },
    summary: {
      total: 10,
      pending: 2,
      confirmed: 3,
      inProgress: 2,
      completed: 3,
      cancelled: 0,
      noShow: 0,
      unassigned: 1,
      waiting: 2,
      inService: 2,
      readyToPay: 1,
      completedService: 3,
      homeService: 1,
    },
    queue: [
      {
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
      },
      {
        id: 'booking-02',
        bookingDate: '2026-09-12',
        startTime: '10:30:00',
        endTime: '12:00:00',
        status: 'confirmed',
        bookingProgressStatus: 'not_started',
        type: 'home_service',
        deliveryType: 'home_service',
        customerName: 'Bob Vance',
        customerPhone: '+639170002222',
        serviceName: 'Deep Tissue Massage',
        serviceDuration: 90,
        staffId: 'staff-02',
        staffName: 'Elena Cruz',
        resourceId: null,
        resourceName: null,
        paymentStatus: 'paid',
        checkedInAt: null,
        sessionStartedAt: null,
        sessionDueAt: null,
        sessionCompletedAt: null,
        createdAt: '2026-09-11T11:00:00Z',
        stage: 'waiting',
        isHomeService: true,
        dispatchContextAvailable: true,
        driverId: 'driver-01',
        driverName: 'Dan Driver',
        noDriverWarning: false,
        dispatchWarning: null,
        needsLocationReview: false,
        homeServiceAddress: '123 Palm St, Bacolod',
      },
    ],
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
      lastHourCount: 4,
      items: [
        {
          eventId: 'event-01',
          staffId: 'staff-01',
          staffName: 'Maria Santos',
          staffNickname: 'Maria',
          eventType: 'clock_in',
          outcome: 'success',
          reasonCode: null,
          message: null,
          occurredAt: '2026-09-12T08:30:00Z',
          clockInAt: '2026-09-12T08:30:00Z',
          clockOutAt: null,
          sourceLabel: 'NFC Scan',
        },
      ],
      error: null,
    },
    notifications: {
      available: true,
      items: [
        {
          id: 'notif-01',
          title: 'Unassigned Booking',
          body: 'Booking for 2:00 PM has no assigned therapist.',
          type: 'booking_warning',
          priority: 'high',
          createdAt: '2026-09-12T08:00:00Z',
          requiresAction: true,
        },
      ],
      error: null,
    },
  };
}

describe('today-service', () => {
  it('accepts valid GET response without branchId parameter', async () => {
    const data = validTodayData();
    let requestedUrl = '';
    let requestedHeaders: HeadersInit | undefined;

    const mockFetch = vi.fn().mockImplementation(async (url, init) => {
      requestedUrl = String(url);
      requestedHeaders = init?.headers;
      return new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const client = createMockSupabaseClient('valid-bearer-token');
    const result = await fetchToday(client, mockFetch);

    expect(result.context.branchId).toBe('branch-101');
    expect(result.summary.total).toBe(10);
    expect(result.queue).toHaveLength(2);
    expect(requestedUrl).toContain('/api/desktop/v1/today');
    expect(requestedUrl).not.toContain('branchId');
    expect((requestedHeaders as Record<string, string>)?.Authorization).toBe(
      'Bearer valid-bearer-token',
    );
  });

  it('rejects malformed response shape truthfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: { context: {} } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createMockSupabaseClient();
    await expect(fetchToday(client, mockFetch)).rejects.toThrow(
      /unexpected response format/i,
    );
  });

  it('throws truthful error when bearer token is missing or session expired', async () => {
    const client = createMockSupabaseClient(null);
    const mockFetch = vi.fn();

    await expect(fetchToday(client, mockFetch)).rejects.toThrow(
      'Your session has expired. Sign in again to view Today.',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles network failure truthfully', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const client = createMockSupabaseClient();

    await expect(fetchToday(client, mockFetch)).rejects.toThrow(
      'Today requires a connection. Please check your network and try again.',
    );
  });

  it('sends authorized operational mutation payload and accepts real hosted { ok: true, data: {} }', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody = '';

    const mockFetch = vi.fn().mockImplementation(async (url, init) => {
      capturedUrl = String(url);
      capturedMethod = init?.method ?? '';
      capturedBody = String(init?.body ?? '');

      return new Response(
        JSON.stringify({
          ok: true,
          data: {},
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    const client = createMockSupabaseClient();
    const payload: DesktopTodayMutationPayload = {
      action: 'confirm_booking',
      bookingId: 'booking-01',
      note: 'Confirmed by front desk',
    };

    const result = await mutateToday(payload, client, mockFetch);

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({});
    expect(capturedUrl).toContain('/api/desktop/v1/today/mutations');
    expect(capturedMethod).toBe('POST');
    expect(JSON.parse(capturedBody)).toEqual(payload);
  });

  it('rejects mutation when server returns error response', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          code: 'FORBIDDEN',
          message: 'Operation not permitted.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const client = createMockSupabaseClient();
    await expect(
      mutateToday(
        { action: 'mark_arrived', bookingId: 'booking-01' },
        client,
        mockFetch,
      ),
    ).rejects.toThrow('Operation not permitted.');
  });

  describe('nested response validator regression tests', () => {
    it('rejects payload when queue contains malformed item', async () => {
      const invalid = validTodayData();
      // @ts-expect-error test malformed queue item
      invalid.queue = [{ id: 'bad-item' }];

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, data: invalid }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const client = createMockSupabaseClient();
      await expect(fetchToday(client, mockFetch)).rejects.toThrow(
        /unexpected response format/i,
      );
    });

    it('rejects payload when stage value is invalid', async () => {
      const invalid = validTodayData();
      // @ts-expect-error test invalid stage enum
      invalid.queue[0].stage = 'invalid_stage';

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, data: invalid }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const client = createMockSupabaseClient();
      await expect(fetchToday(client, mockFetch)).rejects.toThrow(
        /unexpected response format/i,
      );
    });

    it('rejects payload when dispatchContextAvailable has wrong type', async () => {
      const invalid = validTodayData();
      // @ts-expect-error test wrong type for dispatchContextAvailable
      invalid.queue[0].dispatchContextAvailable = 'yes';

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, data: invalid }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const client = createMockSupabaseClient();
      await expect(fetchToday(client, mockFetch)).rejects.toThrow(
        /unexpected response format/i,
      );
    });

    it('rejects payload when readiness has invalid status', async () => {
      const invalid = validTodayData();
      // @ts-expect-error test invalid readiness status
      invalid.readiness.status = 'super_critical';

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, data: invalid }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const client = createMockSupabaseClient();
      await expect(fetchToday(client, mockFetch)).rejects.toThrow(
        /unexpected response format/i,
      );
    });

    it('rejects payload when readiness issue is malformed', async () => {
      const invalid = validTodayData();
      // @ts-expect-error test malformed issue
      invalid.readiness.issues = [{ title: 'Incomplete issue' }];

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, data: invalid }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const client = createMockSupabaseClient();
      await expect(fetchToday(client, mockFetch)).rejects.toThrow(
        /unexpected response format/i,
      );
    });

    it('rejects payload when attendance item is malformed', async () => {
      const invalid = validTodayData();
      // @ts-expect-error test malformed attendance item
      invalid.attendance.items = [{ eventId: 'missing-fields' }];

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, data: invalid }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const client = createMockSupabaseClient();
      await expect(fetchToday(client, mockFetch)).rejects.toThrow(
        /unexpected response format/i,
      );
    });

    it('rejects payload when notification item is malformed', async () => {
      const invalid = validTodayData();
      // @ts-expect-error test malformed notification item
      invalid.notifications.items = [{ id: 'notif-bad' }];

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, data: invalid }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const client = createMockSupabaseClient();
      await expect(fetchToday(client, mockFetch)).rejects.toThrow(
        /unexpected response format/i,
      );
    });
  });
});
