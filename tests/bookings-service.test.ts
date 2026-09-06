import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchBranchBookings,
  normalizeBooking,
  computeBookingKpis,
  filterBookings,
  computeBookingEndTime,
  getHostedApiBaseUrl,
  createBranchBooking,
} from '../src/lib/bookings-service';
import type { Booking } from '../src/types/bookings';

function createMockBooking(overrides: Partial<Booking> = {}): Booking {
  const service =
    overrides.service !== undefined
      ? overrides.service
      : {
          id: 'svc-1',
          name: 'Full Body Massage',
          duration_minutes: 60,
          price: 1500,
        };
  const staff =
    overrides.staff !== undefined
      ? overrides.staff
      : {
          id: 'staff-1',
          full_name: 'Anna Cruz',
          nickname: 'Anna',
          tier: 'senior',
        };

  return {
    id: 'b-1',
    branch_id: 'branch-1',
    customer_id: 'cust-1',
    service_id: overrides.service_id ?? (service ? service.id : 'svc-1'),
    staff_id: overrides.staff_id ?? (staff ? staff.id : 'staff-1'),
    resource_id: 'res-1',
    booking_date: '2026-09-05',
    start_time: '10:00',
    end_time: '11:00',
    status: 'confirmed',
    type: 'walkin',
    delivery_type: 'in_spa',
    amount_paid: 1500,
    payment_method: 'pay_on_site',
    payment_status: 'pending',
    payment_reference: null,
    travel_buffer_mins: 0,
    metadata: null,
    created_at: '2026-09-01T08:00:00.000Z',
    updated_at: '2026-09-01T08:00:00.000Z',
    customer: {
      id: 'cust-1',
      full_name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '+63 917 123 4567',
    },
    service,
    staff,
    resource: {
      id: 'res-1',
      name: 'Room A',
      type: 'room',
    },
    ...overrides,
  };
}

describe('Bookings Service', () => {
  describe('normalizeBooking', () => {
    it('normalizes raw database record with joined objects', () => {
      const raw = {
        id: 'b-100',
        branch_id: 'branch-1',
        booking_date: '2026-09-05',
        start_time: '14:00',
        end_time: '15:00',
        status: 'confirmed',
        type: 'walkin',
        delivery_type: 'in_spa',
        amount_paid: '2500',
        payment_method: 'cash',
        payment_status: 'paid',
        payment_reference: 'PAY-100',
        resource_id: 'res-1',
        staff_id: 'staff-1',
        customer_id: 'cust-1',
        service_id: 'svc-1',
        travel_buffer_mins: 15,
        metadata: null,
        created_at: '2026-09-02T10:00:00.000Z',
        updated_at: '2026-09-02T10:00:00.000Z',
        customers: {
          id: 'cust-1',
          full_name: 'Juan Dela Cruz',
          email: 'juan@example.com',
          phone: '+639180000000',
        },
        services: {
          id: 'svc-1',
          name: 'Facial Treatment',
          duration_minutes: 45,
          price: 2500,
        },
        staff: {
          id: 'staff-1',
          full_name: 'Dr. Santos',
          nickname: 'Doc',
          tier: 'master',
        },
        branch_resources: {
          id: 'res-1',
          name: 'Suite 1',
          type: 'suite',
        },
      };

      const normalized = normalizeBooking(raw);
      expect(normalized.id).toBe('b-100');
      expect(normalized.amount_paid).toBe(2500);
      expect(normalized.customer?.full_name).toBe('Juan Dela Cruz');
      expect(normalized.service?.name).toBe('Facial Treatment');
      expect(normalized.staff?.full_name).toBe('Dr. Santos');
      expect(normalized.resource?.name).toBe('Suite 1');
    });

    it('handles raw record with array-wrapped joins or missing relations gracefully', () => {
      const raw = {
        id: 'b-101',
        branch_id: 'branch-1',
        booking_date: '2026-09-05',
        start_time: '14:00',
        end_time: '15:00',
        status: 'invalid_status',
        type: 'online',
        delivery_type: null,
        amount_paid: null,
        payment_method: null,
        payment_status: null,
        payment_reference: null,
        resource_id: null,
        staff_id: 'staff-2',
        customer_id: 'cust-2',
        service_id: 'svc-2',
        travel_buffer_mins: null,
        metadata: null,
        created_at: '2026-09-02T10:00:00.000Z',
        updated_at: '2026-09-02T10:00:00.000Z',
        customers: [
          { id: 'cust-2', full_name: 'Elena Roxas', phone: null, email: null },
        ],
        services: null,
        staff: null,
        branch_resources: null,
      };

      const normalized = normalizeBooking(raw);
      expect(normalized.id).toBe('b-101');
      expect(normalized.customer?.full_name).toBe('Elena Roxas');
      expect(normalized.service).toBeNull();
      expect(normalized.staff).toBeNull();
      expect(normalized.resource).toBeNull();
      expect(normalized.amount_paid).toBe(0);
    });
  });

  describe('computeBookingKpis', () => {
    it('computes correct KPIs partitioned by status for today and total count', () => {
      const todayStr = '2026-09-05';
      const bookings: Booking[] = [
        createMockBooking({
          id: '1',
          booking_date: todayStr,
          status: 'confirmed',
        }),
        createMockBooking({
          id: '2',
          booking_date: todayStr,
          status: 'checked_in',
        }),
        createMockBooking({
          id: '3',
          booking_date: todayStr,
          status: 'completed',
        }),
        createMockBooking({
          id: '4',
          booking_date: '2020-01-01',
          status: 'no_show',
        }),
        createMockBooking({
          id: '5',
          booking_date: '2020-01-01',
          status: 'cancelled',
        }),
      ];

      const kpis = computeBookingKpis(bookings, todayStr);
      expect(kpis.today.count).toBe(3);
      expect(kpis.confirmed.count).toBe(1);
      expect(kpis.checkedIn.count).toBe(1);
      expect(kpis.completed.count).toBe(1);
      expect(kpis.noShow.count).toBe(1);
      expect(kpis.cancelled.count).toBe(1);
    });
  });

  describe('filterBookings', () => {
    const todayStr = '2026-09-05';
    const tomorrowStr = '2026-09-06';
    const pastStr = '2025-01-01';

    const bookings: Booking[] = [
      createMockBooking({
        id: 'b-today',
        booking_date: todayStr,
        status: 'confirmed',
        customer: {
          id: 'c1',
          full_name: 'Carlos Garcia',
          email: 'carlos@test.com',
          phone: '111',
        },
        service: {
          id: 's1',
          name: 'Swedish Massage',
          duration_minutes: 60,
          price: 1000,
        },
        staff: { id: 'st1', full_name: 'Elena Ramos' },
      }),
      createMockBooking({
        id: 'b-tomorrow',
        booking_date: tomorrowStr,
        status: 'pending',
        customer: {
          id: 'c2',
          full_name: 'Beatriz Alvarez',
          email: 'beatriz@test.com',
          phone: '222',
        },
        service: {
          id: 's2',
          name: 'Foot Spa',
          duration_minutes: 45,
          price: 800,
        },
        staff: { id: 'st2', full_name: 'Marco Santos' },
      }),
      createMockBooking({
        id: 'b-completed',
        booking_date: pastStr,
        status: 'completed',
        customer: {
          id: 'c3',
          full_name: 'Diana Lim',
          email: 'diana@test.com',
          phone: '333',
        },
        service: {
          id: 's1',
          name: 'Swedish Massage',
          duration_minutes: 60,
          price: 1000,
        },
        staff: { id: 'st1', full_name: 'Elena Ramos' },
      }),
      createMockBooking({
        id: 'b-cancelled',
        booking_date: todayStr,
        status: 'cancelled',
        customer: {
          id: 'c4',
          full_name: 'Felix Tan',
          email: 'felix@test.com',
          phone: '444',
        },
        service: {
          id: 's2',
          name: 'Foot Spa',
          duration_minutes: 45,
          price: 800,
        },
        staff: { id: 'st2', full_name: 'Marco Santos' },
      }),
    ];

    it('filters by scope tab "today"', () => {
      const filtered = filterBookings(bookings, 'today', {}, todayStr);
      expect(filtered.map((b) => b.id)).toEqual(['b-today', 'b-cancelled']);
    });

    it('filters by scope tab "tomorrow"', () => {
      const filtered = filterBookings(bookings, 'tomorrow', {}, todayStr);
      expect(filtered.map((b) => b.id)).toEqual(['b-tomorrow']);
    });

    it('filters by scope tab "completed"', () => {
      const filtered = filterBookings(bookings, 'completed', {}, todayStr);
      expect(filtered.map((b) => b.id)).toEqual(['b-completed']);
    });

    it('filters by scope tab "cancelled"', () => {
      const filtered = filterBookings(bookings, 'cancelled', {}, todayStr);
      expect(filtered.map((b) => b.id)).toEqual(['b-cancelled']);
    });

    it('filters by search query matching customer name or service', () => {
      const filtered = filterBookings(
        bookings,
        'all',
        { search: 'Carlos' },
        todayStr,
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('b-today');
    });

    it('filters by status filter', () => {
      const filtered = filterBookings(
        bookings,
        'all',
        { status: 'completed' },
        todayStr,
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('b-completed');
    });

    it('filters by service filter', () => {
      const filtered = filterBookings(
        bookings,
        'all',
        { serviceId: 's2' },
        todayStr,
      );
      expect(filtered.map((b) => b.id)).toEqual(['b-tomorrow', 'b-cancelled']);
    });

    it('filters by staff filter', () => {
      const filtered = filterBookings(
        bookings,
        'all',
        { staffId: 'st1' },
        todayStr,
      );
      expect(filtered.map((b) => b.id)).toEqual(['b-today', 'b-completed']);
    });

    it('filters by specific exact date filter', () => {
      const filtered = filterBookings(
        bookings,
        'all',
        { date: todayStr },
        todayStr,
      );
      expect(filtered.map((b) => b.id)).toEqual(['b-today', 'b-cancelled']);
    });
  });

  describe('fetchBranchBookings', () => {
    it('queries Supabase bookings table scoped to branch_id with order by start_time asc', async () => {
      const mockRawData = [
        {
          id: 'b-1',
          branch_id: 'branch-1',
          booking_date: '2026-09-05',
          start_time: '10:00',
          end_time: '11:00',
          type: 'walkin',
          delivery_type: 'in_spa',
          status: 'confirmed',
          amount_paid: 1000,
          payment_method: 'cash',
          payment_status: 'paid',
          payment_reference: null,
          resource_id: null,
          staff_id: 'st-1',
          customer_id: 'c-1',
          service_id: 's-1',
          travel_buffer_mins: 0,
          metadata: null,
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
          customers: {
            id: 'c-1',
            full_name: 'John Doe',
            email: null,
            phone: null,
          },
          services: {
            id: 's-1',
            name: 'Spa',
            duration_minutes: 60,
            price: 1000,
          },
          staff: {
            id: 'st-1',
            full_name: 'Staffer',
            nickname: null,
            tier: 'senior',
          },
          branch_resources: null,
        },
      ];

      const limitMock = vi
        .fn()
        .mockResolvedValue({ data: mockRawData, error: null });
      const order2Mock = vi.fn().mockReturnValue({ limit: limitMock });
      const order1Mock = vi.fn().mockReturnValue({ order: order2Mock });
      const eqMock = vi.fn().mockReturnValue({ order: order1Mock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      const client = { from: fromMock } as unknown as SupabaseClient;

      const result = await fetchBranchBookings('branch-1', client);
      expect(fromMock).toHaveBeenCalledWith('bookings');
      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining('branch_resources!bookings_resource_id_fkey'),
      );
      expect(eqMock).toHaveBeenCalledWith('branch_id', 'branch-1');
      expect(result.length).toBe(1);
      expect(result[0].customer?.full_name).toBe('John Doe');
    });

    it('throws error with message when Supabase query returns an error', async () => {
      const limitMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Permission denied to bookings table' },
      });
      const order2Mock = vi.fn().mockReturnValue({ limit: limitMock });
      const order1Mock = vi.fn().mockReturnValue({ order: order2Mock });
      const eqMock = vi.fn().mockReturnValue({ order: order1Mock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      const client = { from: fromMock } as unknown as SupabaseClient;

      await expect(fetchBranchBookings('branch-1', client)).rejects.toThrow(
        'Permission denied to bookings table',
      );
    });
  });

  describe('computeBookingEndTime', () => {
    it('computes correct end time adding duration to start time', () => {
      expect(computeBookingEndTime('10:00', 60)).toBe('11:00:00');
      expect(computeBookingEndTime('14:30', 90)).toBe('16:00:00');
      expect(computeBookingEndTime('23:00', 90)).toBe('00:30:00');
    });
  });

  describe('getHostedApiBaseUrl', () => {
    it('returns empty string or configured base URL without trailing slash', () => {
      const url = getHostedApiBaseUrl();
      expect(typeof url).toBe('string');
      expect(url).not.toMatch(/\/$/);
    });
  });

  describe('createBranchBooking', () => {
    it('fails closed with AUTH_SESSION_REQUIRED and makes no fetch call when there is no session', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const client = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
      } as unknown as SupabaseClient;

      const res = await createBranchBooking(
        {
          branchId: 'branch-1',
          fullName: 'Maria Santos',
          phone: '09171234567',
          serviceIds: ['svc-1'],
          date: '2026-09-05',
          startTime: '14:00',
          mode: 'walkin',
          paymentReceived: true,
          paymentMethod: 'cash',
        },
        client,
      );

      expect(res.ok).toBe(false);
      expect(res.code).toBe('AUTH_SESSION_REQUIRED');
      expect(res.error).toContain('session has expired');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('sends POST request with Authorization Bearer header and mapped canonical payload', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          ok: true,
          bookingId: 'booking-new-123',
          warning: 'Note on provider tier',
        }),
      } as unknown as Response);

      const client = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'valid-jwt-token-xyz' } },
          }),
        },
      } as unknown as SupabaseClient;

      const res = await createBranchBooking(
        {
          branchId: '00000000-0000-0000-0000-000000000001',
          customerId: '00000000-0000-0000-0000-000000000002',
          fullName: 'Maria Santos',
          phone: '09171234567',
          email: 'maria@example.com',
          serviceIds: ['00000000-0000-0000-0000-000000000003'],
          staffId: '00000000-0000-0000-0000-000000000004',
          resourceId: '00000000-0000-0000-0000-000000000005',
          date: '2026-09-05',
          startTime: '14:00',
          totalDurationMinutes: 60,
          totalPrice: 1500,
          mode: 'walkin',
          paymentReceived: true,
          paymentMethod: 'cash',
          notes: 'Special request',
        },
        client,
      );

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toMatch(/\/api\/desktop\/v1\/bookings$/);
      expect(init?.method).toBe('POST');
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe(
        'application/json',
      );
      expect((init?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer valid-jwt-token-xyz',
      );

      const parsedBody = JSON.parse(init?.body as string);
      expect(parsedBody).toEqual({
        branchId: '00000000-0000-0000-0000-000000000001',
        customerId: '00000000-0000-0000-0000-000000000002',
        fullName: 'Maria Santos',
        phone: '09171234567',
        email: 'maria@example.com',
        serviceIds: ['00000000-0000-0000-0000-000000000003'],
        staffId: '00000000-0000-0000-0000-000000000004',
        resourceId: '00000000-0000-0000-0000-000000000005',
        date: '2026-09-05',
        startTime: '14:00',
        deliveryType: 'in_spa',
        type: 'walkin',
        crmBookingMode: 'walkin',
        paymentReceived: true,
        paymentMethod: 'cash',
        notes: 'Special request',
      });
      // Verifies no UI-only fields or privileged bypass keys sent
      expect(parsedBody.totalDurationMinutes).toBeUndefined();
      expect(parsedBody.totalPrice).toBeUndefined();
      expect(parsedBody.mode).toBeUndefined();
      expect(parsedBody.isDevBypass).toBeUndefined();
      expect(parsedBody.role).toBeUndefined();

      expect(res).toEqual({
        ok: true,
        bookingId: 'booking-new-123',
        warning: 'Note on provider tier',
      });
    });

    it('correctly maps home_service mode and includes address fields while omitting resourceId', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          ok: true,
          bookingId: 'booking-home-123',
        }),
      } as unknown as Response);

      const client = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
          }),
        },
      } as unknown as SupabaseClient;

      const res = await createBranchBooking(
        {
          branchId: '00000000-0000-0000-0000-000000000001',
          fullName: 'Juan Dela Cruz',
          phone: '09181234567',
          serviceIds: ['00000000-0000-0000-0000-000000000003'],
          staffId: '00000000-0000-0000-0000-000000000004',
          resourceId: 'ignored-in-home-service',
          date: '2026-09-05',
          startTime: '10:00',
          mode: 'home_service',
          paymentReceived: false,
          homeServiceAddress: '123 Main St',
          homeServiceBarangay: 'San Antonio',
          homeServiceCity: 'Pasig City',
        },
        client,
      );

      expect(res.ok).toBe(true);
      expect(res.bookingId).toBe('booking-home-123');

      const parsedBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(parsedBody.deliveryType).toBe('home_service');
      expect(parsedBody.type).toBe('home_service');
      expect(parsedBody.crmBookingMode).toBe('home_service');
      expect(parsedBody.resourceId).toBeUndefined();
      expect(parsedBody.homeServiceAddress).toBe('123 Main St');
      expect(parsedBody.homeServiceBarangay).toBe('San Antonio');
      expect(parsedBody.homeServiceCity).toBe('Pasig City');
    });

    it.each([
      {
        status: 400,
        response: {
          ok: false,
          code: 'VALIDATION_ERROR',
          error: 'Validation failed',
        },
        expectedCode: 'VALIDATION_ERROR',
      },
      {
        status: 401,
        response: {
          ok: false,
          code: 'UNAUTHORIZED',
          error: 'Missing or invalid authorization token',
        },
        expectedCode: 'UNAUTHORIZED',
      },
      {
        status: 403,
        response: {
          ok: false,
          code: 'CRM_BRANCH_FORBIDDEN',
          error: 'Staff is not assigned to this branch',
        },
        expectedCode: 'CRM_BRANCH_FORBIDDEN',
      },
      {
        status: 409,
        response: {
          ok: false,
          code: 'SLOT_UNAVAILABLE',
          error: 'Selected time slot is already booked',
        },
        expectedCode: 'SLOT_UNAVAILABLE',
      },
      {
        status: 500,
        response: {
          ok: false,
          code: 'BOOKING_INSERT_FAILED',
          error: 'Failed to insert booking record',
        },
        expectedCode: 'BOOKING_INSERT_FAILED',
      },
    ])(
      'preserves server error code $expectedCode on HTTP $status',
      async ({ status, response, expectedCode }) => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
          ok: false,
          status,
          json: async () => response,
        } as unknown as Response);

        const client = {
          auth: {
            getSession: vi.fn().mockResolvedValue({
              data: { session: { access_token: 'secret-token-xyz' } },
            }),
          },
        } as unknown as SupabaseClient;

        const res = await createBranchBooking(
          {
            branchId: 'branch-1',
            fullName: 'Maria Santos',
            phone: '09171234567',
            serviceIds: ['svc-1'],
            date: '2026-09-05',
            startTime: '14:00',
            mode: 'walkin',
          },
          client,
        );

        expect(res.ok).toBe(false);
        expect(res.code).toBe(expectedCode);
        expect(res.error).toBe(response.error);
        // Security check: token must never appear in error message
        expect(res.error).not.toContain('secret-token-xyz');
      },
    );

    it('returns fail-closed NETWORK_ERROR on network fetch failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new TypeError('Failed to fetch'),
      );

      const client = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'secret-token-xyz' } },
          }),
        },
      } as unknown as SupabaseClient;

      const res = await createBranchBooking(
        {
          branchId: 'branch-1',
          fullName: 'Maria Santos',
          phone: '09171234567',
          serviceIds: ['svc-1'],
          date: '2026-09-05',
          startTime: '14:00',
          mode: 'walkin',
        },
        client,
      );

      expect(res.ok).toBe(false);
      expect(res.code).toBe('NETWORK_ERROR');
      expect(res.error).toContain('Booking creation requires a connection');
      expect(res.error).not.toContain('secret-token-xyz');
    });

    it('returns SERVER_ERROR when server returns non-JSON or malformed payload', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error('Unexpected token < in JSON');
        },
      } as unknown as Response);

      const client = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'secret-token-xyz' } },
          }),
        },
      } as unknown as SupabaseClient;

      const res = await createBranchBooking(
        {
          branchId: 'branch-1',
          fullName: 'Maria Santos',
          phone: '09171234567',
          serviceIds: ['svc-1'],
          date: '2026-09-05',
          startTime: '14:00',
          mode: 'walkin',
        },
        client,
      );

      expect(res.ok).toBe(false);
      expect(res.code).toBe('SERVER_ERROR');
      expect(res.error).toContain('502');
      expect(res.error).not.toContain('secret-token-xyz');
    });
  });
});
