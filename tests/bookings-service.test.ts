import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchBranchBookings,
  normalizeBooking,
  computeBookingKpis,
  filterBookings,
  computeBookingEndTime,
  fetchBranchBookingOptions,
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

  describe('fetchBranchBookingOptions', () => {
    it('loads branch_services and filters staff by service provider eligibility', async () => {
      const mockBranchServices = [
        {
          id: 'bs-1',
          branch_id: 'branch-1',
          service_id: 'svc-1',
          custom_price: 1800,
          custom_duration_minutes: 75,
          available_in_spa: true,
          available_home_service: true,
          is_active: true,
          services: {
            id: 'svc-1',
            name: 'Aromatherapy Massage',
            duration_minutes: 60,
            price: 1500,
            is_active: true,
          },
        },
      ];

      const mockStaff = [
        {
          id: 'st-1',
          full_name: 'Ana Cruz',
          nickname: 'Ana',
          is_active: true,
          staff_type: 'therapist',
          system_role: 'therapist',
          staff_services: [{ service_id: 'svc-1' }],
        },
        {
          id: 'st-2',
          full_name: 'David Driver',
          nickname: 'Dave',
          is_active: true,
          staff_type: null,
          system_role: 'driver',
          staff_services: [],
        },
      ];

      const mockResources = [
        {
          id: 'r-1',
          name: 'Room 1',
          type: 'room',
          capacity: 1,
          is_active: true,
        },
      ];

      const bsEqMock = vi
        .fn()
        .mockResolvedValue({ data: mockBranchServices, error: null });
      const bsSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ eq: bsEqMock }),
      });

      const staffOrderMock = vi
        .fn()
        .mockResolvedValue({ data: mockStaff, error: null });
      const staffSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: staffOrderMock,
              }),
            }),
          }),
        }),
      });

      const resOrder1Mock = vi
        .fn()
        .mockResolvedValue({ data: mockResources, error: null });
      const resEq2Mock = vi.fn().mockReturnValue({ order: resOrder1Mock });
      const resEq1Mock = vi.fn().mockReturnValue({ eq: resEq2Mock });
      const resSelectMock = vi.fn().mockReturnValue({ eq: resEq1Mock });

      const fromMock = vi.fn().mockImplementation((table: string) => {
        if (table === 'branch_services') return { select: bsSelectMock };
        if (table === 'staff') return { select: staffSelectMock };
        if (table === 'branch_resources') return { select: resSelectMock };
        return { select: vi.fn() };
      });

      const client = { from: fromMock } as unknown as SupabaseClient;

      const opts = await fetchBranchBookingOptions('branch-1', client);
      expect(opts.services.length).toBe(1);
      expect(opts.services[0].name).toBe('Aromatherapy Massage');
      expect(opts.services[0].price).toBe(1800); // custom price override
      expect(opts.services[0].durationMinutes).toBe(75); // custom duration override
      expect(opts.staff.length).toBe(1); // driver excluded
      expect(opts.staff[0].name).toBe('Ana Cruz');
      expect(opts.resources.length).toBe(1);
      expect(opts.resources[0].name).toBe('Room 1');
    });
  });

  describe('createBranchBooking', () => {
    it('returns truthful hosted write boundary required result and prevents direct renderer mutations', async () => {
      const res = await createBranchBooking({
        branchId: 'branch-1',
        fullName: 'Maria Santos',
        phone: '09171234567',
        serviceIds: ['svc-1'],
        staffId: 'staff-1',
        date: '2026-09-05',
        startTime: '14:00',
        totalDurationMinutes: 60,
        totalPrice: 1500,
        mode: 'walkin',
        paymentReceived: true,
        paymentMethod: 'cash',
      });

      expect(res.ok).toBe(false);
      expect(res.code).toBe('HOSTED_WRITE_BOUNDARY_REQUIRED');
      expect(res.error).toContain('hosted server-side write boundary');
    });
  });
});
