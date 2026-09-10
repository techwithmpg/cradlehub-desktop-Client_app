export type AttendanceCurrentState =
  | 'not_expected'
  | 'not_arrived'
  | 'late_not_arrived'
  | 'clocked_in'
  | 'on_break'
  | 'in_service'
  | 'available'
  | 'clocked_out'
  | 'forgotten_clock_out'
  | 'absent'
  | 'needs_review';

export type AttendanceAvailabilityState =
  'not_available' | 'available' | 'in_service' | 'on_break';

export type AttendanceExceptionState = 'clear' | 'open';

export interface AttendanceShiftWindow {
  id: string | null;
  shiftType: string;
  windowOrder: number;
  startTime: string;
  endTime: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  endsNextDay: boolean;
}

export interface AttendanceDayStaffState {
  staffId: string;
  staffName: string;
  staffType: string | null;
  branchId: string;
  businessDate: string;
  timezone: string;
  scheduleSource: string;
  scheduleState: string;
  shiftWindows: AttendanceShiftWindow[];
  currentShiftWindow: AttendanceShiftWindow | null;
  nextShiftWindow: AttendanceShiftWindow | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  attendanceRecordId: string | null;
  clockInAt: string | null;
  clockOutAt: string | null;
  currentAttendanceState: AttendanceCurrentState;
  operationalStatus: string;
  workedMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  activeBookingId: string | null;
  activeServiceSession: Record<string, unknown> | null;
  availabilityState: AttendanceAvailabilityState;
  exceptionState: AttendanceExceptionState;
  currentExceptionIds: string[];
  issueCodes: string[];
  displayLabel: string;
  actionRequired: boolean;
}

export interface AttendanceRecord {
  id: string;
  branch_id: string;
  staff_id: string;
  staff_name: string;
  staff_nickname: string | null;
  staff_type: string | null;
  shift_date: string;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  checked_in_at: string;
  checked_out_at: string | null;
  status: string;
  attendance_status: string;
  exception_state: string | null;
  worked_minutes: number;
  late_minutes: number;
  early_leave_minutes: number;
  overtime_minutes: number;
  source_label: string | null;
}

export interface AttendanceException {
  id: string;
  branch_id: string;
  staff_id: string | null;
  checkin_id?: string | null;
  scan_event_id?: string | null;
  staff_name: string | null;
  exception_type: string;
  severity: string;
  status: string;
  message: string;
  metadata?: Record<string, unknown>;
  detected_at: string;
  resolved_at: string | null;
  resolved_by?: string | null;
  resolved_by_name?: string | null;
  resolution_note?: string | null;
  safe_error_code?: string | null;
  category?: string | null;
  resolution_owner?: string | null;
  resolution_status?: string | null;
  resolution_action?: string | null;
  recommended_action?: string | null;
  occurrence_count?: number;
  first_detected_at?: string | null;
  last_detected_at?: string | null;
  latest_scan_event_id?: string | null;
  dedupe_key?: string | null;
  priority?: string | null;
  staff_response_required?: boolean;
  technical_context?: Record<string, unknown>;
}

export interface AttendanceWorkspaceSummary {
  checkedInNow: number;
  recordsToday: number;
  openExceptions: number;
  activeSessions: number;
  activeDevices: number;
}

export interface AttendanceSettingsSnapshot {
  branch_id?: string;
  late_grace_minutes?: number;
  clock_in_window_before_shift_minutes?: number;
  duplicate_scan_debounce_minutes?: number;
  [key: string]: unknown;
}

export interface AttendanceQrConfigurationSnapshot {
  isConfigured: boolean;
  baseUrl?: string | null;
  error?: string | null;
}

export interface AttendanceQrPointSnapshot {
  id: string;
  point_type: string;
  label: string;
  is_active: boolean;
}

export interface AttendanceDeviceRegistrySnapshot {
  entries: Array<{
    rowId?: string;
    staffId?: string;
    staffName?: string;
    status?: string;
    device?: {
      id?: string;
      isActive?: boolean;
      lastSeenAt?: string | null;
    } | null;
  }>;
  pendingRecoveryLinks: unknown[];
  registrationRequests: unknown[];
}

export interface AttendanceWorkspaceData {
  branchId: string;
  branchName: string;
  businessDate: string;
  timezone: string;
  serverNowMs: number;
  settings: AttendanceSettingsSnapshot;
  summary: AttendanceWorkspaceSummary;
  qrConfiguration?: AttendanceQrConfigurationSnapshot;
  qrPoints?: AttendanceQrPointSnapshot[];
  deviceRegistry?: AttendanceDeviceRegistrySnapshot;
  records: AttendanceRecord[];
  exceptions: AttendanceException[];
  dailyStaffStates: AttendanceDayStaffState[];
}

export interface AttendanceWorkspaceResponse {
  ok: true;
  branchId: string;
  data: AttendanceWorkspaceData;
}

export type AttendanceStatusFilter =
  'all' | 'working' | 'late' | 'review' | 'not_scanned_in' | 'checked_out';

export interface AttendanceCorrection {
  id: string;
  branch_id: string;
  staff_id: string | null;
  staff_name: string | null;
  checkin_id: string | null;
  exception_id?: string | null;
  attendance_date: string | null;
  action_type: string;
  correction_type: string;
  reason: string;
  status: string;
  previous_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  requested_by: string | null;
  approved_by: string | null;
  corrected_by: string | null;
  corrected_by_name: string | null;
  applied_at: string | null;
  corrected_at: string | null;
  created_at: string;
}

export interface AttendanceHistoryData {
  fromDate: string;
  toDate: string;
  records: AttendanceRecord[];
  corrections: AttendanceCorrection[];
}

export interface AttendanceHistoryResponse {
  ok: true;
  branchId: string;
  fromDate: string;
  toDate: string;
  data: AttendanceHistoryData;
}
