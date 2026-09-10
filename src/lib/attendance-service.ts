import type { SupabaseClient } from '@supabase/supabase-js';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { getSupabaseClient } from './supabase';
import { getHostedApiBaseUrl } from './bookings-service';
import { readHostedJsonResponse } from './hosted-json-response';
import type {
  AttendanceAvailabilityState,
  AttendanceCurrentState,
  AttendanceDayStaffState,
  AttendanceException,
  AttendanceRecord,
  AttendanceShiftWindow,
  AttendanceWorkspaceResponse,
} from '../types/attendance';

const ATTENDANCE_SESSION_TIMEOUT_MS = 5_000;
const ATTENDANCE_REQUEST_TIMEOUT_MS = 60_000;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
  onTimeout?: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      onTimeout?.();
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise.then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        globalThis.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

const ATTENDANCE_CURRENT_STATES = new Set<AttendanceCurrentState>([
  'not_expected',
  'not_arrived',
  'late_not_arrived',
  'clocked_in',
  'on_break',
  'in_service',
  'available',
  'clocked_out',
  'forgotten_clock_out',
  'absent',
  'needs_review',
]);

const ATTENDANCE_AVAILABILITY_STATES = new Set<AttendanceAvailabilityState>([
  'not_available',
  'available',
  'in_service',
  'on_break',
]);

function isAttendanceShiftWindow(
  value: unknown,
): value is AttendanceShiftWindow {
  if (!isRecord(value)) return false;

  return (
    isNullableString(value.id) &&
    typeof value.shiftType === 'string' &&
    isFiniteNumber(value.windowOrder) &&
    typeof value.startTime === 'string' &&
    typeof value.endTime === 'string' &&
    typeof value.scheduledStartAt === 'string' &&
    typeof value.scheduledEndAt === 'string' &&
    typeof value.endsNextDay === 'boolean'
  );
}

function isAttendanceDayStaffState(
  value: unknown,
): value is AttendanceDayStaffState {
  if (!isRecord(value)) return false;

  if (
    typeof value.staffId !== 'string' ||
    typeof value.staffName !== 'string' ||
    !isNullableString(value.staffType) ||
    typeof value.branchId !== 'string' ||
    typeof value.businessDate !== 'string' ||
    typeof value.timezone !== 'string' ||
    typeof value.scheduleSource !== 'string' ||
    typeof value.scheduleState !== 'string' ||
    !Array.isArray(value.shiftWindows) ||
    !isNullableString(value.scheduledStart) ||
    !isNullableString(value.scheduledEnd) ||
    !isNullableString(value.attendanceRecordId) ||
    !isNullableString(value.clockInAt) ||
    !isNullableString(value.clockOutAt) ||
    typeof value.currentAttendanceState !== 'string' ||
    typeof value.operationalStatus !== 'string' ||
    !isFiniteNumber(value.workedMinutes) ||
    !isFiniteNumber(value.lateMinutes) ||
    !isFiniteNumber(value.earlyLeaveMinutes) ||
    !isFiniteNumber(value.overtimeMinutes) ||
    !isNullableString(value.activeBookingId) ||
    typeof value.availabilityState !== 'string' ||
    (value.exceptionState !== 'clear' && value.exceptionState !== 'open') ||
    !Array.isArray(value.currentExceptionIds) ||
    !Array.isArray(value.issueCodes) ||
    typeof value.displayLabel !== 'string' ||
    typeof value.actionRequired !== 'boolean'
  ) {
    return false;
  }

  if (
    !ATTENDANCE_CURRENT_STATES.has(
      value.currentAttendanceState as AttendanceCurrentState,
    )
  ) {
    return false;
  }

  if (
    !ATTENDANCE_AVAILABILITY_STATES.has(
      value.availabilityState as AttendanceAvailabilityState,
    )
  ) {
    return false;
  }

  if (!value.shiftWindows.every(isAttendanceShiftWindow)) {
    return false;
  }

  if (
    value.currentShiftWindow !== null &&
    !isAttendanceShiftWindow(value.currentShiftWindow)
  ) {
    return false;
  }

  if (
    value.nextShiftWindow !== null &&
    !isAttendanceShiftWindow(value.nextShiftWindow)
  ) {
    return false;
  }

  return (
    value.currentExceptionIds.every((item) => typeof item === 'string') &&
    value.issueCodes.every((item) => typeof item === 'string')
  );
}

function isAttendanceRecord(value: unknown): value is AttendanceRecord {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.branch_id === 'string' &&
    typeof value.staff_id === 'string' &&
    typeof value.staff_name === 'string' &&
    isNullableString(value.staff_nickname) &&
    isNullableString(value.staff_type) &&
    typeof value.shift_date === 'string' &&
    isNullableString(value.scheduled_start_at) &&
    isNullableString(value.scheduled_end_at) &&
    typeof value.checked_in_at === 'string' &&
    isNullableString(value.checked_out_at) &&
    typeof value.status === 'string' &&
    typeof value.attendance_status === 'string' &&
    isNullableString(value.exception_state) &&
    isFiniteNumber(value.worked_minutes) &&
    isFiniteNumber(value.late_minutes) &&
    isFiniteNumber(value.early_leave_minutes) &&
    isFiniteNumber(value.overtime_minutes) &&
    isNullableString(value.source_label)
  );
}

function isAttendanceException(value: unknown): value is AttendanceException {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.branch_id === 'string' &&
    isNullableString(value.staff_id) &&
    isNullableString(value.staff_name) &&
    typeof value.exception_type === 'string' &&
    typeof value.severity === 'string' &&
    typeof value.status === 'string' &&
    typeof value.message === 'string' &&
    typeof value.detected_at === 'string' &&
    isNullableString(value.resolved_at)
  );
}

export function isAttendanceWorkspaceResponse(
  value: unknown,
): value is AttendanceWorkspaceResponse {
  if (!isRecord(value) || value.ok !== true) return false;
  if (typeof value.branchId !== 'string' || !isRecord(value.data)) {
    return false;
  }

  const data = value.data;

  if (
    typeof data.branchId !== 'string' ||
    data.branchId !== value.branchId ||
    typeof data.branchName !== 'string' ||
    typeof data.businessDate !== 'string' ||
    typeof data.timezone !== 'string' ||
    !isFiniteNumber(data.serverNowMs) ||
    !isRecord(data.settings) ||
    !isRecord(data.summary) ||
    !Array.isArray(data.records) ||
    !Array.isArray(data.exceptions) ||
    !Array.isArray(data.dailyStaffStates)
  ) {
    return false;
  }

  const summary = data.summary;

  if (
    !isFiniteNumber(summary.checkedInNow) ||
    !isFiniteNumber(summary.recordsToday) ||
    !isFiniteNumber(summary.openExceptions) ||
    !isFiniteNumber(summary.activeSessions) ||
    !isFiniteNumber(summary.activeDevices)
  ) {
    return false;
  }

  return (
    data.records.every(isAttendanceRecord) &&
    data.exceptions.every(isAttendanceException) &&
    data.dailyStaffStates.every(isAttendanceDayStaffState)
  );
}

async function getAccessToken(client?: SupabaseClient): Promise<string> {
  const supabase = client ?? getSupabaseClient();

  const {
    data: { session },
    error,
  } = await withTimeout(
    supabase.auth.getSession(),
    ATTENDANCE_SESSION_TIMEOUT_MS,
    'Attendance could not verify your session within 5 seconds. Sign in again and retry.',
  );

  if (error || !session?.access_token) {
    throw new Error(
      'Your session has expired. Sign in again to use Attendance.',
    );
  }

  return session.access_token;
}

export async function fetchAttendanceWorkspace(
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<AttendanceWorkspaceResponse> {
  const baseUrl = getHostedApiBaseUrl();

  if (!baseUrl) {
    throw new Error(
      'Attendance service is not configured for this desktop installation.',
    );
  }

  const token = await getAccessToken(client);
  const fetchFn = customFetch ?? tauriFetch;

  let response: Response;

  const controller = new AbortController();

  try {
    response = await withTimeout(
      fetchFn(`${baseUrl}/api/desktop/v1/attendance`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      }),
      ATTENDANCE_REQUEST_TIMEOUT_MS,
      'Attendance service did not respond within 60 seconds. Please retry.',
      () => controller.abort(),
    );
  } catch (caught: unknown) {
    if (
      caught instanceof Error &&
      caught.message ===
        'Attendance service did not respond within 60 seconds. Please retry.'
    ) {
      throw caught;
    }

    throw new Error(
      'Attendance requires a connection. Please check your network and try again.',
      { cause: caught },
    );
  }

  const result = await readHostedJsonResponse(response, {
    validator: isAttendanceWorkspaceResponse,
    serviceName: 'Attendance service',
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

export type AttendanceExceptionMutationAction =
  'review_exception' | 'resolve_exception';

export interface AttendanceExceptionMutationResponse {
  ok: true;
  action: AttendanceExceptionMutationAction;
  message: string;
  exceptionId: string;
}

function isAttendanceExceptionMutationResponse(
  value: unknown,
): value is AttendanceExceptionMutationResponse {
  if (!isRecord(value)) return false;

  return (
    value.ok === true &&
    (value.action === 'review_exception' ||
      value.action === 'resolve_exception') &&
    typeof value.message === 'string' &&
    typeof value.exceptionId === 'string'
  );
}

const ATTENDANCE_MUTATION_TIMEOUT_MS = 15_000;

export async function mutateAttendanceException(
  params: {
    action: AttendanceExceptionMutationAction;
    exceptionId: string;
    resolutionNote?: string | null;
  },
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<AttendanceExceptionMutationResponse> {
  const baseUrl = getHostedApiBaseUrl();

  if (!baseUrl) {
    throw new Error(
      'Attendance service is not configured for this desktop installation.',
    );
  }

  const exceptionId = params.exceptionId.trim();

  if (!exceptionId) {
    throw new Error('Attendance exception ID is required.');
  }

  const token = await getAccessToken(client);
  const fetchFn = customFetch ?? tauriFetch;

  const payload: Record<string, unknown> = {
    exceptionId,
  };

  if (params.action === 'resolve_exception') {
    const resolutionNote = params.resolutionNote?.trim();

    if (resolutionNote) {
      payload.resolutionNote = resolutionNote;
    }
  }

  const controller = new AbortController();

  let response: Response;

  try {
    response = await withTimeout(
      fetchFn(baseUrl + '/api/desktop/v1/attendance/mutations', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          action: params.action,
          payload,
        }),
        signal: controller.signal,
      }),
      ATTENDANCE_MUTATION_TIMEOUT_MS,
      'Attendance action did not respond within 15 seconds. Please retry.',
      () => controller.abort(),
    );
  } catch (caught: unknown) {
    if (
      caught instanceof Error &&
      caught.message ===
        'Attendance action did not respond within 15 seconds. Please retry.'
    ) {
      throw caught;
    }

    throw new Error(
      'Attendance action requires a connection. Please check your network and retry.',
      { cause: caught },
    );
  }

  const result = await readHostedJsonResponse(response, {
    validator: isAttendanceExceptionMutationResponse,
    serviceName: 'Attendance action',
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

export interface AttendanceEditableRules {
  late_grace_minutes: number;
  clock_in_window_before_shift_minutes: number;
  duplicate_scan_debounce_minutes: number;
}

export interface AttendanceRulesMutationResponse {
  ok: true;
  action: 'update_rules';
  message: string;
  settings: import('../types/attendance').AttendanceSettingsSnapshot;
}

export function isAttendanceRulesMutationResponse(
  value: unknown,
): value is AttendanceRulesMutationResponse {
  if (!isRecord(value)) return false;

  if (
    value.ok !== true ||
    value.action !== 'update_rules' ||
    typeof value.message !== 'string' ||
    !isRecord(value.settings)
  ) {
    return false;
  }

  const settings = value.settings;

  return (
    typeof settings.late_grace_minutes === 'number' &&
    Number.isFinite(settings.late_grace_minutes) &&
    typeof settings.clock_in_window_before_shift_minutes === 'number' &&
    Number.isFinite(settings.clock_in_window_before_shift_minutes) &&
    typeof settings.duplicate_scan_debounce_minutes === 'number' &&
    Number.isFinite(settings.duplicate_scan_debounce_minutes)
  );
}

export async function updateAttendanceRules(
  params: {
    settings: AttendanceEditableRules;
    reason?: string | null;
  },
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<AttendanceRulesMutationResponse> {
  const baseUrl = getHostedApiBaseUrl();

  if (!baseUrl) {
    throw new Error(
      'Attendance service is not configured for this desktop installation.',
    );
  }

  const settings = {
    late_grace_minutes: Math.max(
      0,
      Math.round(params.settings.late_grace_minutes),
    ),
    clock_in_window_before_shift_minutes: Math.max(
      0,
      Math.round(params.settings.clock_in_window_before_shift_minutes),
    ),
    duplicate_scan_debounce_minutes: Math.max(
      0,
      Math.round(params.settings.duplicate_scan_debounce_minutes),
    ),
  };

  const token = await getAccessToken(client);
  const fetchFn = customFetch ?? tauriFetch;
  const controller = new AbortController();

  const payload: {
    settings: AttendanceEditableRules;
    reason?: string;
  } = {
    settings,
  };

  const reason = params.reason?.trim();

  if (reason) {
    payload.reason = reason;
  }

  let response: Response;

  try {
    response = await withTimeout(
      fetchFn(baseUrl + '/api/desktop/v1/attendance/mutations', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          action: 'update_rules',
          payload,
        }),
        signal: controller.signal,
      }),
      ATTENDANCE_MUTATION_TIMEOUT_MS,
      'Attendance rules did not respond within 15 seconds. Please retry.',
      () => controller.abort(),
    );
  } catch (caught: unknown) {
    if (
      caught instanceof Error &&
      caught.message ===
        'Attendance rules did not respond within 15 seconds. Please retry.'
    ) {
      throw caught;
    }

    throw new Error(
      'Attendance rules require a connection. Please check your network and retry.',
      { cause: caught },
    );
  }

  const result = await readHostedJsonResponse(response, {
    validator: isAttendanceRulesMutationResponse,
    serviceName: 'Attendance rules',
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

function isAttendanceCorrection(value: unknown): boolean {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.branch_id === 'string' &&
    (value.staff_id === null || typeof value.staff_id === 'string') &&
    (value.staff_name === null || typeof value.staff_name === 'string') &&
    typeof value.correction_type === 'string' &&
    typeof value.reason === 'string' &&
    typeof value.status === 'string' &&
    typeof value.created_at === 'string'
  );
}

export function isAttendanceHistoryResponse(
  value: unknown,
): value is import('../types/attendance').AttendanceHistoryResponse {
  if (!isRecord(value) || value.ok !== true) return false;

  if (
    typeof value.branchId !== 'string' ||
    typeof value.fromDate !== 'string' ||
    typeof value.toDate !== 'string' ||
    !isRecord(value.data)
  ) {
    return false;
  }

  const data = value.data;

  if (
    typeof data.fromDate !== 'string' ||
    typeof data.toDate !== 'string' ||
    !Array.isArray(data.records) ||
    !Array.isArray(data.corrections)
  ) {
    return false;
  }

  return (
    data.fromDate === value.fromDate &&
    data.toDate === value.toDate &&
    data.records.every(isAttendanceRecord) &&
    data.corrections.every(isAttendanceCorrection)
  );
}

export async function fetchAttendanceHistory(
  fromDate: string,
  toDate: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<import('../types/attendance').AttendanceHistoryResponse> {
  const baseUrl = getHostedApiBaseUrl();

  if (!baseUrl) {
    throw new Error(
      'Attendance service is not configured for this desktop installation.',
    );
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(fromDate) || !datePattern.test(toDate)) {
    throw new Error('Attendance history dates must use YYYY-MM-DD.');
  }

  const token = await getAccessToken(client);
  const fetchFn = customFetch ?? tauriFetch;

  const controller = new AbortController();

  const url =
    baseUrl +
    '/api/desktop/v1/attendance/history?fromDate=' +
    encodeURIComponent(fromDate) +
    '&toDate=' +
    encodeURIComponent(toDate);

  let response: Response;

  try {
    response = await withTimeout(
      fetchFn(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + token,
        },
        signal: controller.signal,
      }),
      ATTENDANCE_REQUEST_TIMEOUT_MS,
      'Attendance history did not respond within 60 seconds. Please retry.',
      () => controller.abort(),
    );
  } catch (caught: unknown) {
    if (
      caught instanceof Error &&
      caught.message ===
        'Attendance history did not respond within 60 seconds. Please retry.'
    ) {
      throw caught;
    }

    throw new Error(
      'Attendance history requires a connection. Please check your network and retry.',
      { cause: caught },
    );
  }

  const result = await readHostedJsonResponse(response, {
    validator: isAttendanceHistoryResponse,
    serviceName: 'Attendance history',
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}
