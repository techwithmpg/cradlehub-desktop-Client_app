import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchBranchBookingOptions,
  searchBranchCustomers,
} from '../src/lib/bookings-service';

type Reply = { data: unknown; error: { message: string } | null };
function database(rows: Record<string, unknown>, failure?: string) {
  const queries: Record<
    string,
    Record<'select' | 'eq' | 'is', ReturnType<typeof vi.fn>>
  > = {};
  const from = vi.fn((table: string) => {
    if (!(table in rows)) throw new Error(`Unexpected table ${table}`);
    const result: Reply = {
      data: rows[table],
      error: failure === table ? { message: 'Permission denied' } : null,
    };
    const query = {
      ...Promise.resolve(result),
      then: Promise.resolve(result).then.bind(Promise.resolve(result)),
      select: vi.fn(),
      eq: vi.fn(),
      is: vi.fn(),
      order: vi.fn(),
      maybeSingle: vi.fn(),
      or: vi.fn(),
      limit: vi.fn(),
    };
    for (const method of [
      'select',
      'eq',
      'is',
      'order',
      'maybeSingle',
      'or',
      'limit',
    ] as const)
      query[method].mockReturnValue(query);
    queries[table] = query;
    return query;
  });
  return { client: { from } as unknown as SupabaseClient, from, queries };
}
const service = (id: string, overrides = {}) => ({
  id: `bs-${id}`,
  branch_id: 'branch-1',
  service_id: id,
  is_active: true,
  visibility: 'public',
  booking_visibility: 'public',
  available_in_spa: true,
  available_home_service: true,
  custom_price: null,
  custom_duration_minutes: null,
  services: {
    id,
    name: id,
    is_active: true,
    price: 1000,
    duration_minutes: 60,
  },
  ...overrides,
});
const staff = (id: string, overrides = {}) => ({
  id,
  full_name: id,
  nickname: null,
  is_active: true,
  archived_at: null,
  merged_into_staff_id: null,
  staff_type: 'therapist',
  system_role: 'therapist',
  staff_services: [{ service_id: 'spa' }],
  ...overrides,
});
const tables = (overrides = {}) => ({
  branch_services: [service('spa')],
  staff: [staff('provider')],
  branch_resources: [
    { id: 'room', name: 'Room', is_active: true, capacity: 1 },
  ],
  branch_booking_rules: { home_service_enabled: true },
  ...overrides,
});

describe('branch booking preview reads', () => {
  it('never queries the global catalog when branch services are empty', async () => {
    const db = database(tables({ branch_services: [] }));
    expect(
      (await fetchBranchBookingOptions('branch-1', db.client)).services,
    ).toEqual([]);
    expect(db.from.mock.calls.map(([table]) => table)).toEqual([
      'branch_services',
      'staff',
      'branch_resources',
      'branch_booking_rules',
    ]);
  });
  it('preserves branch overrides including zero price and scopes all reads', async () => {
    const db = database(
      tables({
        branch_services: [
          service('spa', { custom_price: 0, custom_duration_minutes: 75 }),
        ],
      }),
    );
    const options = await fetchBranchBookingOptions('branch-1', db.client);
    expect(options.services[0]).toMatchObject({
      price: 0,
      durationMinutes: 75,
      availableInSpa: true,
      availableHomeService: true,
    });
    for (const table of Object.keys(db.queries))
      expect(db.queries[table].eq).toHaveBeenCalledWith(
        'branch_id',
        'branch-1',
      );
    expect(db.queries.staff.is).toHaveBeenCalledWith('archived_at', null);
    expect(db.queries.staff.is).toHaveBeenCalledWith(
      'merged_into_staff_id',
      null,
    );
    expect(db.queries.staff.eq).toHaveBeenCalledWith('is_active', true);
    expect(db.queries.branch_resources.eq).toHaveBeenCalledWith(
      'is_active',
      true,
    );
    expect(db.queries.branch_services.select).toHaveBeenCalledWith(
      expect.stringContaining('booking_visibility'),
    );
  });
  it('excludes inactive, hidden, unknown, unavailable and invalid-price/duration services', async () => {
    const rows = [
      service('public'),
      service('internal', { visibility: 'internal' }),
      service('legacy', { visibility: null, booking_visibility: 'csr_only' }),
      service('inactive', { is_active: false }),
      service('unknown-active', { is_active: null }),
      service('global-inactive', {
        services: { id: 'global-inactive', name: 'Inactive', is_active: false },
      }),
      service('hidden', { visibility: 'hidden' }),
      service('vip', { visibility: null, booking_visibility: 'vip' }),
      service('unknown', { visibility: null, booking_visibility: null }),
      service('no-mode', {
        available_in_spa: false,
        available_home_service: false,
      }),
      service('missing-flags', {
        available_in_spa: null,
        available_home_service: null,
      }),
      service('bad-price', { custom_price: -1 }),
      service('bad-duration', { custom_duration_minutes: 0 }),
      service('home-only', { available_in_spa: false }),
    ];
    const db = database(tables({ branch_services: rows }));
    expect(
      (await fetchBranchBookingOptions('branch-1', db.client)).services.map(
        (s) => s.id,
      ),
    ).toEqual(['public', 'internal', 'legacy', 'home-only']);
  });
  it.each([false, null, undefined])(
    'never enables home service when branch rules say %s',
    async (enabled) => {
      const db = database(
        tables({
          branch_services: [
            service('spa'),
            service('home', { available_in_spa: false }),
          ],
          branch_booking_rules:
            enabled === undefined ? null : { home_service_enabled: enabled },
        }),
      );
      const options = await fetchBranchBookingOptions('branch-1', db.client);
      expect(options.services.map((s) => s.id)).toEqual(['spa']);
      expect(options.services[0].availableHomeService).toBe(false);
    },
  );
  it.each([
    'branch_services',
    'staff',
    'branch_resources',
    'branch_booking_rules',
  ])('throws on %s failure instead of empty success', async (table) => {
    const db = database(tables(), table);
    await expect(
      fetchBranchBookingOptions('branch-1', db.client),
    ).rejects.toThrow(/Failed to load branch/);
    expect(db.from).not.toHaveBeenCalledWith('services');
  });
  it('keeps only active unarchived unmerged providers and active resources', async () => {
    const db = database(
      tables({
        staff: [
          staff('valid'),
          staff('inactive', { is_active: false }),
          staff('archived', { archived_at: '2026-01-01' }),
          staff('merged', { merged_into_staff_id: 'valid' }),
          ...['driver', 'digital_marketer', 'utility'].map((role) =>
            staff(role, { system_role: role }),
          ),
          staff('manager-capable', {
            system_role: 'manager',
            staff_type: null,
          }),
          staff('manager-no-capability', {
            system_role: 'manager',
            staff_type: null,
            staff_services: [],
          }),
        ],
        branch_resources: [{ id: 'off', name: 'Off', is_active: false }],
      }),
    );
    const options = await fetchBranchBookingOptions('branch-1', db.client);
    expect(options.staff.map((s) => s.id)).toEqual([
      'valid',
      'manager-capable',
    ]);
    expect(options.staff[0].serviceIds).toEqual(['spa']);
    expect(options.resources).toEqual([]);
  });
});

describe('customer lookup hosted API boundary', () => {
  it('returns empty list immediately for query with length < 2', async () => {
    const res = await searchBranchCustomers('branch-1', 'a');
    expect(res).toEqual([]);
  });

  it('fails if API configuration is invalid override', async () => {
    const originalEnv = import.meta.env.VITE_CRADLEHUB_API_URL;
    try {
      import.meta.env.VITE_CRADLEHUB_API_URL = 'https://invalid-host.example';
      await expect(searchBranchCustomers('branch-1', 'Maria')).rejects.toThrow(
        /Customer lookup service is not configured/,
      );
    } finally {
      if (originalEnv === undefined) {
        delete import.meta.env.VITE_CRADLEHUB_API_URL;
      } else {
        import.meta.env.VITE_CRADLEHUB_API_URL = originalEnv;
      }
    }
  });

  it('fails if session is missing', async () => {
    const fakeClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    } as unknown as SupabaseClient;

    const customFetch = vi.fn();
    await expect(
      searchBranchCustomers('branch-1', 'Maria', fakeClient, customFetch),
    ).rejects.toThrow(/session has expired/);
  });

  it('queries hosted customer API and maps top-level data array correctly', async () => {
    const fakeClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'auth-token-123' } },
        }),
      },
    } as unknown as SupabaseClient;

    const customFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        ok: true,
        tab: 'all',
        data: [
          {
            id: 'c-10',
            fullName: 'Corazon Aquino',
            phone: '09171234567',
            email: 'cory@test.ph',
            totalBookings: 8,
            firstBookingDate: '2024-01-01',
            lastBookingDate: '2026-08-01',
            preferredStaffId: 'staff-9',
            preferredStaffName: 'Staff 9',
          },
        ],
        waitlist: [],
        pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
        kpis: {
          totalCustomers: 1,
          repeatClients: 1,
          lapsedClients: 0,
          newThisMonth: 0,
          totalVisits: 8,
        },
      }),
    } as unknown as Response);

    const customers = await searchBranchCustomers(
      'branch-1',
      'Corazon',
      fakeClient,
      customFetch,
    );

    expect(customFetch).toHaveBeenCalledOnce();
    const [url, init] = customFetch.mock.calls[0];
    expect(url).toContain('branchId=branch-1');
    expect(url).toContain('q=Corazon');
    expect((init?.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer auth-token-123',
    );

    expect(customers).toEqual([
      {
        id: 'c-10',
        full_name: 'Corazon Aquino',
        phone: '09171234567',
        email: 'cory@test.ph',
        total_bookings: 8,
        first_booking_date: '2024-01-01',
        last_booking_date: '2026-08-01',
      },
    ]);
  });

  it('handles non-JSON error responses in searchBranchCustomers gracefully', async () => {
    const fakeClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'auth-token-123' } },
        }),
      },
    } as unknown as SupabaseClient;

    const customFetch404 = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'text/html' }),
    } as unknown as Response);

    await expect(
      searchBranchCustomers('branch-1', 'Maria', fakeClient, customFetch404),
    ).rejects.toThrow(
      /The hosted Customers endpoint is not available on the current deployment/,
    );
  });
});
