import type { SupabaseClient } from '@supabase/supabase-js';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { getSupabaseClient } from './supabase';
import type {
  Booking,
  BookingCustomer,
  BookingFilters,
  BookingKpiSummary,
  BookingResource,
  BookingScopeTab,
  BookingService,
  BookingStaff,
  BookingStatus,
  CreateBookingInput,
  CreateBookingResult,
  QuickBookingOptionResource,
  QuickBookingOptionService,
  QuickBookingOptionStaff,
} from '../types/bookings';

const BOOKING_SELECT = `
  id, branch_id, booking_date, start_time, end_time, type, delivery_type, status,
  amount_paid, payment_method, payment_status, payment_reference,
  resource_id, staff_id, customer_id, service_id, travel_buffer_mins, metadata,
  created_at, updated_at,
  customers ( id, full_name, phone, email, total_bookings, loyalty_tier, notes, health_notes, first_booking_date, last_booking_date ),
  services ( id, name, duration_minutes, price ),
  staff!staff_id ( id, full_name, nickname, tier, avatar_url ),
  branch_resources!bookings_resource_id_fkey ( id, name, type )
`;

interface RawBookingRow {
  id: string;
  branch_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  type: string;
  delivery_type: string | null;
  status: string;
  amount_paid: number | string | null;
  payment_method: string | null;
  payment_status: string | null;
  payment_reference: string | null;
  resource_id: string | null;
  staff_id: string;
  customer_id: string;
  service_id: string;
  travel_buffer_mins: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  customers: BookingCustomer | BookingCustomer[] | null;
  services: BookingService | BookingService[] | null;
  staff: BookingStaff | BookingStaff[] | null;
  branch_resources: BookingResource | BookingResource[] | null;
}

function extractFirst<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] ?? null;
  return val;
}

export function formatCurrency(amount: number | null | undefined): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function normalizeBooking(row: RawBookingRow): Booking {
  const customer = extractFirst(row.customers);
  const service = extractFirst(row.services);
  const staff = extractFirst(row.staff);
  const resource = extractFirst(row.branch_resources);

  const amount =
    typeof row.amount_paid === 'number'
      ? row.amount_paid
      : parseFloat(String(row.amount_paid ?? 0)) || 0;

  return {
    id: row.id,
    branch_id: row.branch_id,
    booking_date: row.booking_date,
    start_time: row.start_time,
    end_time: row.end_time,
    status: (row.status as BookingStatus) || 'pending',
    type: row.type || 'walkin',
    delivery_type: row.delivery_type || 'in_spa',
    amount_paid: amount,
    payment_method: row.payment_method || 'pay_on_site',
    payment_status: row.payment_status || 'pending',
    payment_reference: row.payment_reference || null,
    resource_id: row.resource_id || null,
    staff_id: row.staff_id,
    customer_id: row.customer_id,
    service_id: row.service_id,
    travel_buffer_mins: row.travel_buffer_mins,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customer,
    service,
    staff,
    resource,
  };
}

export async function fetchBranchBookings(
  branchId: string,
  client?: SupabaseClient,
): Promise<Booking[]> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('branch_id', branchId)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: true })
    .limit(500);

  if (error) {
    throw new Error(`Failed to load branch bookings: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RawBookingRow[];
  return rows.map(normalizeBooking);
}

export function getTodayDateString(refDate = new Date()): string {
  const year = refDate.getFullYear();
  const month = String(refDate.getMonth() + 1).padStart(2, '0');
  const day = String(refDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeBookingKpis(
  bookings: Booking[],
  referenceDateStr?: string,
): BookingKpiSummary {
  const todayStr = referenceDateStr || getTodayDateString();

  let todayCount = 0;
  let confirmedCount = 0;
  let checkedInCount = 0;
  let completedCount = 0;
  let noShowCount = 0;
  let cancelledCount = 0;

  for (const b of bookings) {
    if (b.booking_date === todayStr) {
      todayCount++;
    }
    if (b.status === 'confirmed') {
      confirmedCount++;
    } else if (b.status === 'checked_in' || b.status === 'in_progress') {
      checkedInCount++;
    } else if (b.status === 'completed') {
      completedCount++;
    } else if (b.status === 'no_show') {
      noShowCount++;
    } else if (b.status === 'cancelled') {
      cancelledCount++;
    }
  }

  const total = bookings.length || 1;
  const completedRate = Math.round((completedCount / total) * 100);

  return {
    today: {
      label: 'Today',
      count: todayCount,
      subtext: `${todayCount} scheduled today`,
      iconName: 'today',
    },
    confirmed: {
      label: 'Confirmed',
      count: confirmedCount,
      subtext: `${confirmedCount} awaiting service`,
      iconName: 'confirmed',
    },
    checkedIn: {
      label: 'Checked In',
      count: checkedInCount,
      subtext: `${checkedInCount} on premise`,
      iconName: 'checked_in',
    },
    completed: {
      label: 'Completed',
      count: completedCount,
      subtext: `${completedRate}% of total`,
      iconName: 'completed',
    },
    noShow: {
      label: 'No Show',
      count: noShowCount,
      subtext: `${noShowCount} missed sessions`,
      iconName: 'no_show',
    },
    cancelled: {
      label: 'Cancelled',
      count: cancelledCount,
      subtext: `${cancelledCount} cancelled`,
      iconName: 'cancelled',
    },
  };
}

export function filterBookings(
  bookings: Booking[],
  scope: BookingScopeTab,
  filters: BookingFilters,
  referenceDateStr?: string,
): Booking[] {
  const todayStr = referenceDateStr || getTodayDateString();
  const refDate = new Date(todayStr + 'T00:00:00');

  // Tomorrow date string
  const tomorrow = new Date(refDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getTodayDateString(tomorrow);

  // Week start (Sunday) and end (Saturday)
  const dayOfWeek = refDate.getDay();
  const weekStart = new Date(refDate);
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  const weekStartStr = getTodayDateString(weekStart);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = getTodayDateString(weekEnd);

  // Month prefix: YYYY-MM
  const monthPrefix = todayStr.substring(0, 7);

  return bookings.filter((booking) => {
    // 1. Scope filter
    if (scope === 'today' && booking.booking_date !== todayStr) {
      return false;
    }
    if (scope === 'tomorrow' && booking.booking_date !== tomorrowStr) {
      return false;
    }
    if (
      scope === 'this_week' &&
      (booking.booking_date < weekStartStr || booking.booking_date > weekEndStr)
    ) {
      return false;
    }
    if (
      scope === 'this_month' &&
      !booking.booking_date.startsWith(monthPrefix)
    ) {
      return false;
    }
    if (scope === 'upcoming' && booking.booking_date < todayStr) {
      return false;
    }
    if (scope === 'completed' && booking.status !== 'completed') {
      return false;
    }
    if (scope === 'cancelled' && booking.status !== 'cancelled') {
      return false;
    }

    // 2. Status filter
    if (
      filters.status &&
      filters.status !== 'all' &&
      booking.status !== filters.status
    ) {
      return false;
    }

    // 3. Date filter
    if (filters.date && booking.booking_date !== filters.date) {
      return false;
    }

    // 4. Service filter
    if (
      filters.serviceId &&
      filters.serviceId !== 'all' &&
      booking.service_id !== filters.serviceId
    ) {
      return false;
    }

    // 5. Staff filter
    if (
      filters.staffId &&
      filters.staffId !== 'all' &&
      booking.staff_id !== filters.staffId
    ) {
      return false;
    }

    // 6. Search text filter
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const customerName = booking.customer?.full_name?.toLowerCase() || '';
      const customerPhone = booking.customer?.phone?.toLowerCase() || '';
      const serviceName = booking.service?.name?.toLowerCase() || '';
      const staffName = booking.staff?.full_name?.toLowerCase() || '';
      const staffNick = booking.staff?.nickname?.toLowerCase() || '';
      const bookingId = booking.id.toLowerCase();

      const matches =
        customerName.includes(q) ||
        customerPhone.includes(q) ||
        serviceName.includes(q) ||
        staffName.includes(q) ||
        staffNick.includes(q) ||
        bookingId.includes(q);

      if (!matches) return false;
    }

    return true;
  });
}

export function computeBookingEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  const parts = startTime.split(':');
  const h = Number(parts[0] || '0');
  const m = Number(parts[1] || '0');
  const totalMins = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
}

const NON_SERVICE_SYSTEM_ROLES = new Set([
  'owner',
  'manager',
  'assistant_manager',
  'store_manager',
  'crm',
  'digital_marketer',
  'driver',
  'utility',
]);

const HARD_EXCLUDED_SYSTEM_ROLES = new Set([
  'digital_marketer',
  'driver',
  'utility',
]);

const SERVICE_STAFF_TYPES = new Set([
  'therapist',
  'nail_tech',
  'aesthetician',
  'salon_head',
]);

export function canActAsBookingServiceProvider(
  member: {
    is_active?: boolean | null;
    staff_type?: string | null;
    system_role?: string | null;
  },
  hasMatchingServiceCapability = false,
): boolean {
  if (member.is_active === false) return false;

  const role = member.system_role
    ? member.system_role.trim().toLowerCase()
    : '';
  if (HARD_EXCLUDED_SYSTEM_ROLES.has(role)) {
    return false;
  }

  if (hasMatchingServiceCapability) return true;

  const staffType = member.staff_type
    ? member.staff_type.trim().toLowerCase()
    : '';
  if (staffType && SERVICE_STAFF_TYPES.has(staffType)) {
    return true;
  }

  if (NON_SERVICE_SYSTEM_ROLES.has(role)) return false;

  return false;
}

export async function fetchBranchBookingOptions(
  branchId: string,
  client?: SupabaseClient,
): Promise<{
  services: QuickBookingOptionService[];
  staff: QuickBookingOptionStaff[];
  resources: QuickBookingOptionResource[];
}> {
  const supabase = client ?? getSupabaseClient();

  const [branchServicesRes, staffRes, resourcesRes, rulesRes] =
    await Promise.all([
      supabase
        .from('branch_services')
        .select(
          `
        id,
        branch_id,
        service_id,
        custom_price,
        custom_duration_minutes,
        available_in_spa,
        available_home_service,
        visibility,
        booking_visibility,
        is_active,
        services (
          id,
          name,
          duration_minutes,
          price,
          is_active
        )
      `,
        )
        .eq('branch_id', branchId)
        .eq('is_active', true),
      supabase
        .from('staff')
        .select(
          `
        id,
        full_name,
        nickname,
        is_active,
        staff_type,
        system_role,
        archived_at,
        merged_into_staff_id,
        staff_services ( service_id )
      `,
        )
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .is('archived_at', null)
        .is('merged_into_staff_id', null)
        .order('full_name', { ascending: true }),
      supabase
        .from('branch_resources')
        .select('id, name, type, capacity, is_active')
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase
        .from('branch_booking_rules')
        .select('home_service_enabled')
        .eq('branch_id', branchId)
        .maybeSingle(),
    ]);

  if (branchServicesRes.error) {
    throw new Error(
      `Failed to load branch services: ${branchServicesRes.error.message}`,
    );
  }
  if (staffRes.error) {
    throw new Error(`Failed to load branch staff: ${staffRes.error.message}`);
  }
  if (resourcesRes.error) {
    throw new Error(
      `Failed to load branch resources: ${resourcesRes.error.message}`,
    );
  }

  if (rulesRes.error) {
    throw new Error(
      'Failed to load branch booking rules. Booking options are unavailable.',
    );
  }
  const homeServiceEnabled = rulesRes.data?.home_service_enabled === true;

  interface RawBranchServiceRow {
    id: string;
    is_active: boolean | null;
    visibility: string | null;
    booking_visibility: string | null;
    custom_price: number | string | null;
    custom_duration_minutes: number | string | null;
    available_in_spa: boolean | null;
    available_home_service: boolean | null;
    services:
      | {
          id: string;
          name: string;
          duration_minutes: number | string | null;
          price: number | string | null;
          is_active: boolean | null;
        }
      | Array<{
          id: string;
          name: string;
          duration_minutes: number | string | null;
          price: number | string | null;
          is_active: boolean | null;
        }>
      | null;
  }

  interface RawStaffMemberRow {
    id: string;
    full_name: string;
    nickname: string | null;
    is_active: boolean | null;
    staff_type: string | null;
    system_role: string | null;
    archived_at: string | null;
    merged_into_staff_id: string | null;
    staff_services: { service_id: string }[] | null;
  }

  interface RawResourceRow {
    id: string;
    is_active: boolean | null;
    name: string;
    type: string | null;
    capacity: number | string | null;
  }

  // Read-only safe subset of the hosted CRM catalog. Unknown flags/visibility
  // are excluded; missing rules never enable home service by default.
  const services = (
    (branchServicesRes.data ?? []) as unknown as RawBranchServiceRow[]
  )
    .map((row): QuickBookingOptionService | null => {
      const service = extractFirst(row.services);
      const visibility = ['public', 'internal', 'hidden'].includes(
        row.visibility ?? '',
      )
        ? row.visibility
        : row.booking_visibility === 'csr_only'
          ? 'internal'
          : row.booking_visibility === 'public'
            ? 'public'
            : 'hidden';
      if (
        row.is_active !== true ||
        service?.is_active !== true ||
        !service.id ||
        !service.name ||
        visibility === 'hidden'
      )
        return null;
      const availableInSpa = row.available_in_spa === true;
      const availableHomeService =
        homeServiceEnabled && row.available_home_service === true;
      if (!availableInSpa && !availableHomeService) return null;
      const durationMinutes = Number(
        row.custom_duration_minutes ?? service.duration_minutes,
      );
      const price = Number(row.custom_price ?? service.price);
      if (row.custom_price == null && service.price == null) return null;
      if (
        !Number.isFinite(durationMinutes) ||
        durationMinutes <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      )
        return null;
      return {
        id: service.id,
        name: service.name,
        durationMinutes,
        price,
        availableInSpa,
        availableHomeService,
        isActive: true,
      };
    })
    .filter(
      (service): service is QuickBookingOptionService => service !== null,
    );

  const rawStaff = (staffRes.data ?? []) as unknown as RawStaffMemberRow[];
  const staff: QuickBookingOptionStaff[] = rawStaff
    .filter((member) => {
      const hasMatchingCapability = (member.staff_services ?? []).length > 0;
      return (
        member.is_active === true &&
        member.archived_at === null &&
        member.merged_into_staff_id === null &&
        canActAsBookingServiceProvider(member, hasMatchingCapability)
      );
    })
    .map((st) => ({
      id: st.id,
      name: st.full_name,
      nickname: st.nickname || null,
      serviceIds: (st.staff_services ?? []).map((ss) => ss.service_id),
    }));

  const rawResources = (resourcesRes.data ?? []) as unknown as RawResourceRow[];
  const resources: QuickBookingOptionResource[] = rawResources
    .filter((r) => r.is_active === true)
    .map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type || null,
      capacity: Number(r.capacity || 1),
    }));

  return { services, staff, resources };
}

export function getCustomerLookupUnavailableReason(): string | null {
  return null;
}

export class CustomerLookupUnavailableError extends Error {
  readonly code = 'CUSTOMER_LOOKUP_UNAVAILABLE';
  constructor(message = 'Customer lookup is currently unavailable.') {
    super(message);
    this.name = 'CustomerLookupUnavailableError';
  }
}

/**
 * Search branch customers via the authoritative hosted Desktop Customers API.
 */
export async function searchBranchCustomers(
  branchId: string,
  query: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<BookingCustomer[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const baseUrl = getHostedApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'Customer lookup service is not configured for this desktop installation.',
    );
  }

  const supabase = client ?? getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      'Your session has expired. Sign in again to search customers.',
    );
  }

  const endpoint = `${baseUrl}/api/desktop/v1/customers?tab=all&q=${encodeURIComponent(trimmed)}&branchId=${encodeURIComponent(branchId)}&page=1&pageSize=20`;
  const fetchFn = customFetch ?? tauriFetch;

  let response: Response;
  try {
    response = await fetchFn(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  } catch {
    throw new Error(
      'Customer search requires a connection. Please check your network and try again.',
    );
  }

  const contentType = response.headers.get('content-type');
  const isJson =
    contentType &&
    (contentType.toLowerCase().includes('application/json') ||
      contentType.toLowerCase().includes('+json'));

  if (!isJson) {
    if (response.status === 404) {
      throw new Error(
        'The hosted Customers endpoint is not available on the current deployment.',
      );
    }
    if (response.status === 500) {
      throw new Error(
        'The hosted Customers service returned an unexpected server response.',
      );
    }
    if (response.status >= 300 && response.status < 400) {
      throw new Error('The hosted Customers endpoint redirected unexpectedly.');
    }
    throw new Error(
      `Customer search service returned an unexpected HTTP ${response.status} response instead of JSON.`,
    );
  }

  let body: {
    ok?: boolean;
    data?: Array<{
      id: string;
      fullName: string;
      phone: string | null;
      email: string | null;
      totalBookings: number;
      firstBookingDate: string | null;
      lastBookingDate: string | null;
      preferredStaffId?: string | null;
      preferredStaffName?: string | null;
    }>;
    error?: string;
    message?: string;
  };

  try {
    body = await response.json();
  } catch {
    throw new Error(
      `Customer search service returned an invalid JSON response (HTTP ${response.status}).`,
    );
  }

  if (!response.ok || body?.ok === false) {
    const msg =
      body?.message ||
      body?.error ||
      `Customer search failed with status ${response.status}.`;
    throw new Error(msg);
  }

  const list = Array.isArray(body?.data) ? body.data : [];
  return list.map((c) => ({
    id: c.id,
    full_name: c.fullName,
    phone: c.phone || null,
    email: c.email || null,
    total_bookings: c.totalBookings ?? 0,
    first_booking_date: c.firstBookingDate || null,
    last_booking_date: c.lastBookingDate || null,
  }));
}

export const EXPECTED_HOSTED_API_ORIGIN =
  'https://www.cradlewellnessliving.com';

export function validateHostedApiBaseUrl(rawUrl: string | undefined | null):
  | {
      valid: true;
      url: string;
    }
  | {
      valid: false;
      reason: string;
    } {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      valid: false,
      reason:
        'Booking service is not configured for this desktop installation.',
    };
  }
  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      reason:
        'Booking service configuration is invalid. An HTTPS URL is required.',
    };
  }
  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      reason:
        'Booking service configuration is invalid. An HTTPS URL is required.',
    };
  }
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      reason: 'Booking service URL must not contain embedded credentials.',
    };
  }
  if (parsed.origin !== EXPECTED_HOSTED_API_ORIGIN) {
    return {
      valid: false,
      reason:
        'Booking service configuration is invalid. Host origin does not match the authorized CradleHub API origin.',
    };
  }
  const normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
  return { valid: true, url: normalized };
}

export function getHostedApiBaseUrl(): string | null {
  const envUrl =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_CRADLEHUB_API_URL
      : undefined;

  if (
    !envUrl ||
    typeof envUrl !== 'string' ||
    !envUrl.trim() ||
    envUrl === 'undefined'
  ) {
    return EXPECTED_HOSTED_API_ORIGIN;
  }

  const validation = validateHostedApiBaseUrl(envUrl);
  return validation.valid ? validation.url : null;
}

/**
 * Authoritative Booking Creation Boundary:
 *
 * In accordance with the CradleHub architecture and security contracts:
 * Authoritative booking creation is handled by the hosted authoritative server boundary.
 * Desktop sends the operator's authenticated Supabase session access token via Authorization Bearer header.
 * Direct table mutations from the desktop renderer are explicitly disallowed.
 */
export async function createBranchBooking(
  input: CreateBookingInput,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<CreateBookingResult> {
  const baseUrl = getHostedApiBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      code: 'API_CONFIG_REQUIRED',
      error: 'Booking service is not configured for this desktop installation.',
    };
  }

  if (input.mode === 'home_service') {
    return {
      ok: false,
      code: 'HOME_SERVICE_LOCATION_REQUIRED',
      error:
        'Home Service booking will be enabled after precise address/location support is connected.',
    };
  }

  const supabase = client ?? getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {
      ok: false,
      code: 'AUTH_SESSION_REQUIRED',
      error: 'Your session has expired. Sign in again to create this booking.',
    };
  }

  const paymentReceived = Boolean(input.paymentReceived);
  const paymentMethod = paymentReceived
    ? input.paymentMethod?.trim() || undefined
    : undefined;

  const payload = {
    branchId: input.branchId,
    serviceIds: input.serviceIds,
    date: input.date,
    startTime: input.startTime,
    deliveryType: 'in_spa',
    type: 'walkin',
    crmBookingMode: input.mode,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    staffId: input.staffId || undefined,
    resourceId: input.resourceId || undefined,
    customerId: input.customerId || undefined,
    notes: input.notes?.trim() || undefined,
    paymentReceived,
    paymentMethod,
  };

  const endpoint = `${baseUrl}/api/desktop/v1/bookings`;
  const fetchFn = customFetch ?? tauriFetch;

  let response: Response;
  try {
    response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      error:
        'Booking creation requires a connection. Please check your network and try again.',
    };
  }

  let body: {
    ok?: boolean;
    bookingId?: string;
    warning?: string;
    message?: string;
    error?: string;
    code?: string;
  };
  try {
    body = await response.json();
  } catch {
    return {
      ok: false,
      code: 'SERVER_ERROR',
      error: `Server responded with status ${response.status}, but the response could not be parsed.`,
    };
  }

  if (response.ok && body?.ok === true) {
    if (typeof body.bookingId !== 'string' || !body.bookingId.trim()) {
      return {
        ok: false,
        code: 'SERVER_ERROR',
        error: 'Server returned a success response without a valid booking ID.',
      };
    }

    return {
      ok: true,
      bookingId: body.bookingId.trim(),
      warning: body.warning,
    };
  }

  const code =
    body?.code ||
    (response.status === 401
      ? 'UNAUTHORIZED'
      : response.status === 403
        ? 'CRM_PERMISSION_DENIED'
        : 'UNKNOWN_ERROR');

  const errorMessage =
    body?.message || body?.error || 'Failed to create booking.';

  return {
    ok: false,
    code,
    error: errorMessage,
  };
}
