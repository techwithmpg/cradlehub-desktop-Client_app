import type { SupabaseClient } from '@supabase/supabase-js';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { getSupabaseClient } from './supabase';
import { getHostedApiBaseUrl } from './bookings-service';
import { readHostedJsonResponse } from './hosted-json-response';
import type {
  DailyScheduleResponse,
  ScheduleAvailabilityResponse,
  ScheduleMutationAction,
  ScheduleMutationResult,
  ScheduleStaffRow,
  ScheduleWeekDay,
  StaffFullScheduleResponse,
} from '../types/schedule';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isScheduleStaffRow(value: unknown): value is ScheduleStaffRow {
  if (!isRecord(value)) return false;

  return (
    typeof value.staff_id === 'string' &&
    typeof value.staff_name === 'string' &&
    typeof value.schedule_is_day_off === 'boolean' &&
    Array.isArray(value.schedule_windows) &&
    Array.isArray(value.bookings) &&
    Array.isArray(value.blocks)
  );
}

export function isDailyScheduleResponse(
  value: unknown,
): value is DailyScheduleResponse {
  if (!isRecord(value) || value.ok !== true) return false;

  if (
    typeof value.branchId !== 'string' ||
    typeof value.date !== 'string' ||
    !Array.isArray(value.staffRows) ||
    !isRecord(value.stats) ||
    !isRecord(value.schedulingRules)
  ) {
    return false;
  }

  const numericStatNames = [
    'total',
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
  ];

  if (
    numericStatNames.some(
      (name) =>
        typeof (value.stats as Record<string, unknown>)[name] !== 'number',
    )
  ) {
    return false;
  }

  return value.staffRows.every(isScheduleStaffRow);
}

export function isScheduleAvailabilityResponse(
  value: unknown,
): value is ScheduleAvailabilityResponse {
  if (!isRecord(value) || value.ok !== true) return false;
  if (typeof value.branchId !== 'string' || !Array.isArray(value.items)) {
    return false;
  }

  return value.items.every((item) => {
    if (!isRecord(item) || !isRecord(item.staff)) return false;

    return (
      typeof item.staff.id === 'string' &&
      typeof item.staff.full_name === 'string' &&
      Array.isArray(item.schedules) &&
      Array.isArray(item.overrides) &&
      Array.isArray(item.blockedTimes)
    );
  });
}

export function isStaffFullScheduleResponse(
  value: unknown,
): value is StaffFullScheduleResponse {
  if (!isRecord(value) || value.ok !== true) return false;

  if (
    typeof value.branchId !== 'string' ||
    typeof value.staffId !== 'string' ||
    typeof value.startDate !== 'string' ||
    typeof value.endDate !== 'string' ||
    !isRecord(value.data) ||
    !isRecord(value.data.staff)
  ) {
    return false;
  }

  return (
    typeof value.data.staff.id === 'string' &&
    typeof value.data.staff.full_name === 'string' &&
    Array.isArray(value.data.schedules) &&
    Array.isArray(value.data.custom_overrides) &&
    Array.isArray(value.data.blocked_times) &&
    Array.isArray(value.data.bookings)
  );
}

export function isScheduleMutationResult(
  value: unknown,
  action: ScheduleMutationAction,
): value is ScheduleMutationResult {
  if (!isRecord(value) || value.ok !== true) {
    return false;
  }

  switch (action) {
    case 'replace_weekly_schedule':
    case 'replace_weekly_window_schedule':
      return (
        typeof value.rowsWritten === 'number' &&
        Number.isInteger(value.rowsWritten) &&
        value.rowsWritten >= 0 &&
        Array.isArray(value.savedRows)
      );

    case 'upsert_override':
      return (
        typeof value.message === 'string' &&
        isRecord(value.override) &&
        typeof value.override.id === 'string' &&
        typeof value.override.override_date === 'string' &&
        typeof value.override.is_day_off === 'boolean'
      );

    case 'delete_override':
    case 'delete_blocked_time':
      return (
        typeof value.message === 'string' && typeof value.deletedId === 'string'
      );

    case 'create_blocked_time':
      return (
        typeof value.message === 'string' &&
        isRecord(value.block) &&
        typeof value.block.id === 'string' &&
        typeof value.block.block_date === 'string' &&
        typeof value.block.start_time === 'string' &&
        typeof value.block.end_time === 'string' &&
        typeof value.block.reason === 'string'
      );

    default:
      return false;
  }
}

async function getAccessToken(client?: SupabaseClient): Promise<string> {
  const supabase = client ?? getSupabaseClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error(
      'Your session has expired. Sign in again to use Schedule Operations.',
    );
  }

  return session.access_token;
}

function getScheduleApiBaseUrl(): string {
  const baseUrl = getHostedApiBaseUrl();

  if (!baseUrl) {
    throw new Error(
      'Schedule service is not configured for this desktop installation.',
    );
  }

  return baseUrl;
}

async function scheduleGet<T>(
  relativePath: string,
  validator: (value: unknown) => value is T,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<T> {
  const baseUrl = getScheduleApiBaseUrl();
  const token = await getAccessToken(client);
  const fetchFn = customFetch ?? tauriFetch;

  let response: Response;

  try {
    response = await fetchFn(`${baseUrl}${relativePath}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error(
      'Schedule requires a connection. Please check your network and try again.',
    );
  }

  const result = await readHostedJsonResponse(response, {
    validator,
    serviceName: 'Schedule service',
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

export async function fetchDailySchedule(
  date: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<DailyScheduleResponse> {
  return scheduleGet(
    `/api/desktop/v1/schedule?date=${encodeURIComponent(date)}`,
    isDailyScheduleResponse,
    client,
    customFetch,
  );
}

export async function fetchScheduleAvailability(
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<ScheduleAvailabilityResponse> {
  return scheduleGet(
    '/api/desktop/v1/schedule/staff-availability',
    isScheduleAvailabilityResponse,
    client,
    customFetch,
  );
}

export async function fetchStaffFullSchedule(
  staffId: string,
  startDate: string,
  endDate: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<StaffFullScheduleResponse> {
  const path =
    `/api/desktop/v1/schedule/staff/${encodeURIComponent(staffId)}` +
    `?startDate=${encodeURIComponent(startDate)}` +
    `&endDate=${encodeURIComponent(endDate)}`;

  return scheduleGet(path, isStaffFullScheduleResponse, client, customFetch);
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(year, month - 1, day);
  value.setDate(value.getDate() + days);

  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
}

export function getWeekStart(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(year, month - 1, day);
  value.setDate(value.getDate() - value.getDay());

  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
}

export async function fetchScheduleWeek(
  anchorDate: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<ScheduleWeekDay[]> {
  const weekStart = getWeekStart(anchorDate);
  const dates = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );

  const days = await Promise.all(
    dates.map(async (date) => ({
      date,
      data: await fetchDailySchedule(date, client, customFetch),
    })),
  );

  return days;
}

export async function mutateSchedule(
  action: ScheduleMutationAction,
  payload: Record<string, unknown>,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<ScheduleMutationResult> {
  const baseUrl = getScheduleApiBaseUrl();
  const token = await getAccessToken(client);
  const fetchFn = customFetch ?? tauriFetch;

  let response: Response;

  try {
    response = await fetchFn(`${baseUrl}/api/desktop/v1/schedule/mutations`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, payload }),
    });
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message:
        'Schedule changes require a connection. Please check your network and try again.',
    };
  }

  const result = await readHostedJsonResponse<ScheduleMutationResult>(
    response,
    {
      serviceName: 'Schedule mutation service',
    },
  );

  if (!result.ok) {
    return {
      ok: false,
      code: result.code,
      message: result.message,
    };
  }

  if (!isScheduleMutationResult(result.data, action)) {
    return {
      ok: false,
      code: 'HOSTED_RESPONSE_CONTRACT_ERROR',
      message: 'Schedule service returned an unexpected success response.',
    };
  }

  return result.data;
}
