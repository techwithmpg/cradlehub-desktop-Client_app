import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
  cancelHomeServiceBooking,
  fetchHomeService,
  fetchHomeServiceBookingDetail,
  fetchHomeServiceDrivers,
  fetchHomeServiceRecommendations,
  getTodayDateString,
  mutateHomeService,
  rescheduleHomeServiceBooking,
} from '../src/lib/home-service-service';
import type {
  HomeServiceBookingDetail,
  HomeServiceDriver,
  HomeServiceRecommendations,
  HomeServiceResponse,
} from '../src/types/home-service';

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

function validHomeServiceWorkspaceResponse(): HomeServiceResponse {
  return {
    ok: true,
    data: {
      context: {
        branchId: 'branch-1',
        branchName: 'Main Spa',
        date: '2026-09-12',
      },
      summary: {
        totalToday: 1,
        awaitingDispatch: 1,
        activeTrips: 0,
        completedToday: 0,
        cancelledToday: 0,
      },
      items: [
        {
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
          therapistId: 'staff-1',
          therapistName: 'Staff Member',
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
        },
      ],
      alerts: [
        {
          id: 'alert-1',
          bookingId: 'booking-1',
          title: 'GPS Location Needed',
          description: 'testing 2 · Angels Massage',
          severity: 'danger',
          timeAgo: '—',
        },
      ],
      locationSemantics:
        'Coordinates and driver snapshots are recorded data. No live route tracking is active.',
    },
  };
}

function validDriversResponse(): {
  ok: true;
  data: { branchId: string; drivers: HomeServiceDriver[] };
} {
  return {
    ok: true,
    data: {
      branchId: 'branch-1',
      drivers: [
        {
          id: 'driver-1',
          name: 'Juan Driver',
          systemRole: 'driver',
          staffType: 'full_time',
          isActive: true,
        },
      ],
    },
  };
}

function validBookingDetailResponse(): {
  ok: true;
  data: HomeServiceBookingDetail;
} {
  return {
    ok: true,
    data: {
      id: 'booking-1',
      branchId: 'branch-1',
      date: '2026-09-12',
      startTime: '14:30:00',
      endTime: '15:30:00',
      customer: {
        id: 'cust-1',
        name: 'testing 2',
        phone: '09123456789',
        email: 'test@example.com',
      },
      service: {
        id: 'svc-1',
        name: 'Angels Massage',
        durationMinutes: 60,
      },
      therapist: {
        id: 'staff-1',
        name: 'Staff Member',
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
        accessNote: null,
        barangay: null,
        city: 'Bacolod',
        landmark: null,
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
      events: [],
    },
  };
}

function validRecommendationsResponse(): {
  ok: true;
  data: HomeServiceRecommendations;
} {
  return {
    ok: true,
    data: {
      therapists: [
        {
          id: 'staff-1',
          name: 'Staff Member',
          score: 90,
          reasons: ['Available'],
        },
      ],
      drivers: [
        {
          id: 'driver-1',
          name: 'Juan Driver',
          score: 95,
          reasons: ['Nearest branch'],
        },
      ],
    },
  };
}

describe('Home Service Service Read and Mutation Suite', () => {
  it('computes today date string in YYYY-MM-DD format', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('1. fetches workspace with correct endpoint and date query', async () => {
    const mockResponse = validHomeServiceWorkspaceResponse();
    const customFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createMockSupabaseClient('auth-token-123');
    const result = await fetchHomeService('2026-09-12', client, customFetch);

    expect(result).toEqual(mockResponse);
    expect(customFetch).toHaveBeenCalledTimes(1);
    expect(customFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/desktop/v1/home-service?date=2026-09-12'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer auth-token-123',
        }),
      }),
    );
  });

  it('2. sends Bearer authentication header and fails when session is missing', async () => {
    const clientWithoutSession = createMockSupabaseClient(null);
    const customFetch = vi.fn();

    await expect(
      fetchHomeService('2026-09-12', clientWithoutSession, customFetch),
    ).rejects.toThrow(
      'Your session has expired. Sign in again to use Home Service.',
    );
    expect(customFetch).not.toHaveBeenCalled();
  });

  it('3. queries driver endpoint with bearer authentication', async () => {
    const mockResponse = validDriversResponse();
    const customFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createMockSupabaseClient('driver-token');
    const result = await fetchHomeServiceDrivers(client, customFetch);

    expect(result).toEqual(mockResponse);
    expect(customFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/desktop/v1/home-service/drivers'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer driver-token',
        }),
      }),
    );
  });

  it('4. queries recommendations endpoint for a booking', async () => {
    const mockResponse = validRecommendationsResponse();
    const customFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createMockSupabaseClient();
    const result = await fetchHomeServiceRecommendations(
      'booking-1',
      client,
      customFetch,
    );

    expect(result).toEqual(mockResponse);
    expect(customFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        '/api/desktop/v1/home-service/recommendations?bookingId=booking-1',
      ),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('5. queries booking detail endpoint for authoritative booking details', async () => {
    const mockResponse = validBookingDetailResponse();
    const customFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createMockSupabaseClient();
    const result = await fetchHomeServiceBookingDetail(
      'booking-1',
      client,
      customFetch,
    );

    expect(result).toEqual(mockResponse);
    expect(customFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/desktop/v1/bookings/booking-1'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('6. executes mutations with correct POST request body and endpoint', async () => {
    const mutationResponse = { ok: true, data: { releasedNow: false } };
    const customFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mutationResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createMockSupabaseClient();
    const payload = {
      action: 'assign_driver',
      bookingId: 'booking-1',
      driverId: 'driver-1',
    };

    const result = await mutateHomeService(payload, client, customFetch);
    expect(result).toEqual(mutationResponse);
    expect(customFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/desktop/v1/home-service/mutations'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        }),
        body: JSON.stringify(payload),
      }),
    );
  });

  it('7. calls reschedule booking endpoint with correct date and time body', async () => {
    const rescheduleResponse = { ok: true, data: {} };
    const customFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(rescheduleResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createMockSupabaseClient();
    const body = {
      date: '2026-09-13',
      startTime: '15:00:00',
      note: 'Customer requested',
    };

    const result = await rescheduleHomeServiceBooking(
      'booking-1',
      body,
      client,
      customFetch,
    );
    expect(result).toEqual(rescheduleResponse);
    expect(customFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/desktop/v1/bookings/booking-1/reschedule'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  });

  it('8. calls cancel booking endpoint with correct body', async () => {
    const cancelResponse = { ok: true, data: {} };
    const customFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(cancelResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createMockSupabaseClient();
    const body = {
      cancellationReason: 'Customer request',
      note: 'Cancelled via desktop',
    };

    const result = await cancelHomeServiceBooking(
      'booking-1',
      body,
      client,
      customFetch,
    );
    expect(result).toEqual(cancelResponse);
    expect(customFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/desktop/v1/bookings/booking-1/cancel'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  });

  it('9. handles network error and reports a truthful connection failure', async () => {
    const customFetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const client = createMockSupabaseClient();

    await expect(
      fetchHomeService('2026-09-12', client, customFetch),
    ).rejects.toThrow(
      'Home Service requires a connection. Please check your network and try again.',
    );
  });

  it('10. surfaces non-2xx errors truthfully', async () => {
    const customFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          error: 'Unauthorized branch access',
          message: 'Forbidden',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const client = createMockSupabaseClient();
    await expect(
      fetchHomeService('2026-09-12', client, customFetch),
    ).rejects.toThrow(/Forbidden|Home Service/);
  });

  it('11. rejects malformed responses failing validator schema', async () => {
    const malformed = {
      ok: true,
      data: {
        context: 'invalid', // not an object
      },
    };

    const customFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(malformed), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createMockSupabaseClient();
    await expect(
      fetchHomeService('2026-09-12', client, customFetch),
    ).rejects.toThrow(/unexpected response format/i);
  });
});
