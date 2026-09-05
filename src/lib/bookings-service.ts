import type { SupabaseClient } from '@supabase/supabase-js';
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

export async function fetchBranchBookingOptions(
  branchId: string,
  client?: SupabaseClient,
): Promise<{
  services: QuickBookingOptionService[];
  staff: QuickBookingOptionStaff[];
  resources: QuickBookingOptionResource[];
}> {
  const supabase = client ?? getSupabaseClient();

  const [servicesRes, staffRes, resourcesRes] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, duration_minutes, price, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('staff')
      .select('id, full_name, nickname, is_active')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabase
      .from('branch_resources')
      .select('id, name, type, capacity, is_active')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  interface RawServiceRow {
    id: string;
    name: string;
    duration_minutes: number | string | null;
    price: number | string | null;
    is_active: boolean | null;
  }
  interface RawStaffRow {
    id: string;
    full_name: string;
    nickname: string | null;
  }
  interface RawResourceRow {
    id: string;
    name: string;
    type: string | null;
    capacity: number | string | null;
  }

  const rawServices = (servicesRes.data ?? []) as unknown as RawServiceRow[];
  const services: QuickBookingOptionService[] = rawServices.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: Number(s.duration_minutes || 60),
    price: Number(s.price || 0),
    isActive: s.is_active ?? true,
  }));

  const rawStaff = (staffRes.data ?? []) as unknown as RawStaffRow[];
  const staff: QuickBookingOptionStaff[] = rawStaff.map((st) => ({
    id: st.id,
    name: st.full_name,
    nickname: st.nickname || null,
  }));

  const rawResources = (resourcesRes.data ?? []) as unknown as RawResourceRow[];
  const resources: QuickBookingOptionResource[] = rawResources.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type || null,
    capacity: Number(r.capacity || 1),
  }));

  return { services, staff, resources };
}

export async function searchBranchCustomers(
  query: string,
  client?: SupabaseClient,
): Promise<BookingCustomer[]> {
  if (!query || query.trim().length < 2) return [];
  const supabase = client ?? getSupabaseClient();
  const trimmed = query.trim();

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone, email, total_bookings, loyalty_tier')
    .or(`full_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
    .limit(10);

  if (error || !data) return [];
  return data as unknown as BookingCustomer[];
}

export async function createBranchBooking(
  input: CreateBookingInput,
  client?: SupabaseClient,
): Promise<{ ok: boolean; bookingId?: string; error?: string }> {
  const supabase = client ?? getSupabaseClient();

  if (!input.fullName?.trim()) {
    return { ok: false, error: "Enter the customer's full name." };
  }
  if (!input.phone?.trim() || input.phone.trim().length < 7) {
    return {
      ok: false,
      error: 'Enter a valid phone number (at least 7 digits).',
    };
  }
  if (!input.serviceIds || input.serviceIds.length === 0) {
    return { ok: false, error: 'Select at least one service.' };
  }
  if (!input.date) {
    return { ok: false, error: 'Select a booking date.' };
  }
  if (!input.startTime) {
    return { ok: false, error: 'Select a booking start time.' };
  }
  if (input.mode === 'home_service' && !input.homeServiceAddress?.trim()) {
    return {
      ok: false,
      error: 'Enter the complete home-service destination address.',
    };
  }

  // 1. Resolve Customer ID
  let customerId = input.customerId;
  if (!customerId) {
    const cleanPhone = input.phone.trim();
    // Try to find existing customer by phone
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
    } else {
      // Insert new customer
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          full_name: input.fullName.trim(),
          phone: cleanPhone,
          email: input.email?.trim() || null,
        })
        .select('id')
        .single();

      if (custError || !newCustomer) {
        return {
          ok: false,
          error: `Could not save customer: ${custError?.message || 'Customer creation rejected.'}`,
        };
      }
      customerId = newCustomer.id;
    }
  }

  // 2. Compute Timing
  const primaryServiceId = input.serviceIds[0];
  const totalDuration = input.totalDurationMinutes || 60;
  const computedEnd = computeBookingEndTime(input.startTime, totalDuration);
  const endTime = input.endTime || computedEnd;

  const deliveryType =
    input.mode === 'home_service' ? 'home_service' : 'in_spa';
  const bookingType =
    input.mode === 'home_service'
      ? 'home_service'
      : input.mode === 'phone'
        ? 'phone'
        : 'walkin';
  const initialStatus = input.mode === 'walkin' ? 'confirmed' : 'pending';

  const metadata: Record<string, unknown> = {};
  if (input.notes?.trim()) {
    metadata.customer_notes = input.notes.trim();
  }
  if (input.serviceIds.length > 1) {
    metadata.all_service_ids = input.serviceIds;
  }
  if (input.mode === 'home_service') {
    metadata.home_service = {
      address: input.homeServiceAddress?.trim(),
      barangay: input.homeServiceBarangay?.trim(),
      city: input.homeServiceCity?.trim(),
    };
  }

  // 3. Insert Booking Row
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      branch_id: input.branchId,
      customer_id: customerId,
      service_id: primaryServiceId,
      staff_id: input.staffId || null,
      resource_id:
        input.mode === 'home_service' ? null : input.resourceId || null,
      booking_date: input.date,
      start_time:
        input.startTime.length === 5
          ? `${input.startTime}:00`
          : input.startTime,
      end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      type: bookingType,
      delivery_type: deliveryType,
      status: initialStatus,
      payment_status: input.paymentReceived ? 'paid' : 'pending',
      payment_method: input.paymentReceived
        ? input.paymentMethod || 'cash'
        : 'pay_on_site',
      amount_paid: input.paymentReceived ? input.totalPrice || 0 : 0,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
    .select('id')
    .single();

  if (bookingError || !booking) {
    const errorMsg = bookingError?.message || '';
    if (
      bookingError?.code === '23P01' ||
      errorMsg.includes('BOOKING_STAFF_TIME_CONFLICT')
    ) {
      return {
        ok: false,
        error:
          'The selected therapist already has a booking during this time slot. Please choose another time or therapist.',
      };
    }
    if (
      bookingError?.code === '23P01' ||
      errorMsg.includes('BOOKING_RESOURCE_TIME_CONFLICT')
    ) {
      return {
        ok: false,
        error:
          'The selected room is occupied at this time. Please choose another room or time.',
      };
    }
    if (errorMsg.includes('BOOKING_SERVICE_NOT_AVAILABLE_AT_BRANCH')) {
      return {
        ok: false,
        error:
          'The selected service is not currently available at this branch.',
      };
    }
    return {
      ok: false,
      error: `Could not create booking: ${errorMsg || 'Database rejected booking'}`,
    };
  }

  return { ok: true, bookingId: booking.id };
}
