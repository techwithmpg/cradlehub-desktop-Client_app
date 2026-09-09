export type ScheduleViewMode = 'day' | 'week';

export type ScheduleAttendanceState =
  'not_expected' | 'not_checked_in' | 'checked_in' | 'checked_out';

export interface ScheduleAttendancePresence {
  state: ScheduleAttendanceState;
  checkin_id: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  status: string | null;
}

export interface ScheduleWindow {
  startTime: string;
  endTime: string;
  shiftType?: string | null;
  endsNextDay?: boolean;
}

export interface ScheduleOverride {
  id: string;
  override_date: string;
  is_day_off: boolean;
  shift_type: string | null;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface ScheduleBooking {
  id: string;
  start_time: string;
  end_time: string;
  service_id?: string | null;
  service: string;
  customer: string;
  status: string;
  type: string | null;
  delivery_type?: string | null;
  resource_id: string | null;
  resource_name: string | null;
  resource_type?: string | null;
  resource_capacity?: number | null;
  payment_method?: string | null;
  payment_status?: string | null;
  amount_paid?: number | null;
}

export interface ScheduleBlock {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export interface ScheduleStaffRow {
  staff_id: string;
  staff_name: string;
  staff_tier: string | null;
  work_start: string | null;
  work_end: string | null;
  current_override: ScheduleOverride | null;
  schedule_source: string;
  schedule_status: string;
  schedule_state?: string;
  schedule_is_day_off: boolean;
  schedule_windows: ScheduleWindow[];
  schedule_conflict_code: string | null;
  schedule_conflict_reason: string | null;
  bookings: ScheduleBooking[];
  blocks: ScheduleBlock[];
  attendance_presence?: ScheduleAttendancePresence;
}

export interface ScheduleStats {
  total: number;
  pending: number;
  confirmed: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  no_show: number;
}

export interface DailyScheduleResponse {
  ok: true;
  branchId: string;
  date: string;
  staffRows: ScheduleStaffRow[];
  stats: ScheduleStats;
  schedulingRules: Record<string, unknown>;
}

export interface ScheduleAvailabilityStaff {
  id: string;
  full_name: string;
  nickname: string | null;
  avatar_url: string | null;
  tier: string | null;
  staff_type: string | null;
  system_role: string | null;
  is_head: boolean | null;
  is_active: boolean;
}

export interface AvailabilitySchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  shift_type: 'single' | 'opening' | 'closing';
  window_order: number | null;
  ends_next_day: boolean | null;
  created_at: string | null;
}

export interface AvailabilityOverride {
  id: string;
  override_date: string;
  is_day_off: boolean;
  shift_type: 'single' | 'opening' | 'closing' | null;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface AvailabilityBlockedTime {
  id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

export interface ScheduleAvailabilityItem {
  staff: ScheduleAvailabilityStaff;
  schedules: AvailabilitySchedule[];
  overrides: AvailabilityOverride[];
  blockedTimes: AvailabilityBlockedTime[];
}

export interface ScheduleAvailabilityResponse {
  ok: true;
  branchId: string;
  items: ScheduleAvailabilityItem[];
}

export interface StaffFullScheduleData {
  staff: {
    id: string;
    full_name: string;
    nickname: string | null;
    avatar_url: string | null;
    staff_type: string | null;
    system_role: string | null;
    branch_name: string | null;
  };
  schedules: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    shift_type: 'opening' | 'closing' | 'single';
    window_order: number | null;
    ends_next_day: boolean | null;
  }>;
  custom_overrides: Array<{
    id: string;
    date: string;
    shift_type: 'opening' | 'closing' | 'single' | 'day_off';
    start_time: string | null;
    end_time: string | null;
    reason: string | null;
  }>;
  blocked_times: Array<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    reason: string | null;
  }>;
  bookings: Array<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    service_name: string;
    customer_name: string | null;
    status: string | null;
  }>;
}

export interface StaffFullScheduleResponse {
  ok: true;
  branchId: string;
  staffId: string;
  startDate: string;
  endDate: string;
  data: StaffFullScheduleData;
}

export interface ScheduleWeekDay {
  date: string;
  data: DailyScheduleResponse;
}

export type ScheduleMutationAction =
  | 'replace_weekly_schedule'
  | 'replace_weekly_window_schedule'
  | 'upsert_override'
  | 'delete_override'
  | 'create_blocked_time'
  | 'delete_blocked_time';

export type ScheduleMutationResult =
  | {
      ok: true;
      [key: string]: unknown;
    }
  | {
      ok: false;
      code: string;
      message: string;
      operationId?: string;
    };
