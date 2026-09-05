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
} from '../types/bookings';

const BOOKING_SELECT = `
  id, branch_id, booking_date, start_time, end_time, type, delivery_type, status,
  amount_paid, payment_method, payment_status, payment_reference,
  resource_id, staff_id, customer_id, service_id, travel_buffer_mins, metadata,
  created_at, updated_at,
  customers ( id, full_name, phone, email, total_bookings, loyalty_tier, notes, health_notes, first_booking_date, last_booking_date ),
  services ( id, name, duration_minutes, price ),
  staff!staff_id ( id, full_name, nickname, tier, avatar_url ),
  branch_resources ( id, name, type )
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
