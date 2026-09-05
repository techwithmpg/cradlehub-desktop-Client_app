export type BookingStatus =
  | 'pending'
  | 'pending_payment'
  | 'pending_crm_confirmation'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'expired';

export type BookingType =
  'walkin' | 'in_house' | 'home_service' | 'online' | 'phone' | string;
export type DeliveryType = 'in_spa' | 'home_service' | string;

export interface BookingCustomer {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  total_bookings?: number;
  loyalty_tier?: string;
  notes?: string | null;
  health_notes?: string | null;
  first_booking_date?: string | null;
  last_booking_date?: string | null;
}

export interface BookingService {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number;
}

export interface BookingStaff {
  id: string;
  full_name: string;
  nickname?: string | null;
  tier?: string;
  avatar_url?: string | null;
}

export interface BookingResource {
  id: string;
  name: string;
  type?: string;
}

export interface Booking {
  id: string;
  branch_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  type: BookingType;
  delivery_type: DeliveryType | null;
  amount_paid: number;
  payment_method: string;
  payment_status: string;
  payment_reference: string | null;
  resource_id: string | null;
  staff_id: string;
  customer_id: string;
  service_id: string;
  travel_buffer_mins: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  customer: BookingCustomer | null;
  service: BookingService | null;
  staff: BookingStaff | null;
  resource: BookingResource | null;
}

export type BookingScopeTab =
  | 'all'
  | 'today'
  | 'tomorrow'
  | 'this_week'
  | 'this_month'
  | 'upcoming'
  | 'completed'
  | 'cancelled';

export interface BookingFilters {
  search?: string;
  status?: string;
  date?: string;
  serviceId?: string;
  staffId?: string;
}

export interface KpiMetric {
  label: string;
  count: number;
  subtext: string;
  iconName:
    | 'today'
    | 'confirmed'
    | 'checked_in'
    | 'completed'
    | 'no_show'
    | 'cancelled';
}

export interface BookingKpiSummary {
  today: KpiMetric;
  confirmed: KpiMetric;
  checkedIn: KpiMetric;
  completed: KpiMetric;
  noShow: KpiMetric;
  cancelled: KpiMetric;
}

export type InspectorTab =
  'overview' | 'customer' | 'timeline' | 'payments' | 'notes';

export type QuickBookingMode =
  'walkin' | 'phone' | 'standard_future' | 'home_service';

export interface QuickBookingOptionService {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  isActive?: boolean;
}

export interface QuickBookingOptionStaff {
  id: string;
  name: string;
  nickname?: string | null;
}

export interface QuickBookingOptionResource {
  id: string;
  name: string;
  type?: string | null;
  capacity?: number | null;
}

export interface CreateBookingInput {
  branchId: string;
  customerId?: string;
  fullName: string;
  phone: string;
  email?: string;
  serviceIds: string[];
  staffId?: string;
  resourceId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  totalDurationMinutes?: number;
  totalPrice?: number;
  mode: QuickBookingMode;
  paymentReceived?: boolean;
  paymentMethod?: string;
  notes?: string;
  homeServiceAddress?: string;
  homeServiceBarangay?: string;
  homeServiceCity?: string;
}
