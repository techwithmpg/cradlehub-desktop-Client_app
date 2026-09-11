import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getHostedApiBaseUrl } from './bookings-service';
import { getSupabaseClient } from './supabase';
import { readHostedJsonResponse } from './hosted-json-response';
import type {
  DesktopTodayAttendanceItem,
  DesktopTodayData,
  DesktopTodayMutationPayload,
  DesktopTodayMutationResult,
  DesktopTodayNotification,
  DesktopTodayQueueItem,
  DesktopTodayReadinessIssue,
  DesktopTodayResponse,
  DesktopTodayStage,
  ReadinessStatus,
} from '../types/today';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return (typeof value === 'number' && !Number.isNaN(value)) || value === null;
}

function isStage(value: unknown): value is DesktopTodayStage {
  return (
    value === 'waiting' ||
    value === 'in_service' ||
    value === 'ready_to_pay' ||
    value === 'completed' ||
    value === null
  );
}

function isReadinessStatus(value: unknown): value is ReadinessStatus {
  return value === 'ok' || value === 'warning' || value === 'critical';
}

function isTodayQueueItem(item: unknown): item is DesktopTodayQueueItem {
  if (!isRecord(item)) return false;
  return (
    isString(item.id) &&
    isString(item.bookingDate) &&
    isString(item.startTime) &&
    isString(item.endTime) &&
    isString(item.status) &&
    isString(item.bookingProgressStatus) &&
    isString(item.type) &&
    isNullableString(item.deliveryType) &&
    isNullableString(item.customerName) &&
    isNullableString(item.customerPhone) &&
    isNullableString(item.serviceName) &&
    isNullableNumber(item.serviceDuration) &&
    isNullableString(item.staffId) &&
    isNullableString(item.staffName) &&
    isNullableString(item.resourceId) &&
    isNullableString(item.resourceName) &&
    isNullableString(item.paymentStatus) &&
    isNullableString(item.checkedInAt) &&
    isNullableString(item.sessionStartedAt) &&
    isNullableString(item.sessionDueAt) &&
    isNullableString(item.sessionCompletedAt) &&
    isNullableString(item.createdAt) &&
    isStage(item.stage) &&
    isBoolean(item.isHomeService) &&
    (isBoolean(item.dispatchContextAvailable) ||
      item.dispatchContextAvailable === null) &&
    isNullableString(item.driverId) &&
    isNullableString(item.driverName) &&
    isBoolean(item.noDriverWarning) &&
    isNullableString(item.dispatchWarning) &&
    isBoolean(item.needsLocationReview) &&
    isNullableString(item.homeServiceAddress)
  );
}

function isReadinessIssue(issue: unknown): issue is DesktopTodayReadinessIssue {
  if (!isRecord(issue)) return false;
  return (
    isString(issue.id) &&
    isString(issue.scope) &&
    isString(issue.severity) &&
    isString(issue.title) &&
    isString(issue.problem) &&
    isString(issue.impact) &&
    isString(issue.fix) &&
    isString(issue.actionLabel) &&
    isString(issue.actionHref) &&
    (issue.count === undefined || isNumber(issue.count))
  );
}

function isAttendanceItem(item: unknown): item is DesktopTodayAttendanceItem {
  if (!isRecord(item)) return false;
  return (
    isString(item.eventId) &&
    isNullableString(item.staffId) &&
    isString(item.staffName) &&
    isNullableString(item.staffNickname) &&
    isString(item.eventType) &&
    isString(item.outcome) &&
    isNullableString(item.reasonCode) &&
    isNullableString(item.message) &&
    isString(item.occurredAt) &&
    isNullableString(item.clockInAt) &&
    isNullableString(item.clockOutAt) &&
    isNullableString(item.sourceLabel)
  );
}

function isNotificationItem(item: unknown): item is DesktopTodayNotification {
  if (!isRecord(item)) return false;
  return (
    isString(item.id) &&
    isString(item.title) &&
    isNullableString(item.body) &&
    isString(item.type) &&
    isString(item.priority) &&
    isString(item.createdAt) &&
    isBoolean(item.requiresAction)
  );
}

export function isTodayResponse(value: unknown): value is DesktopTodayResponse {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data)) {
    return false;
  }

  const data = value.data;

  // Validate context
  if (
    !isRecord(data.context) ||
    !isString(data.context.branchId) ||
    !isString(data.context.branchName) ||
    !isString(data.context.businessDate) ||
    !isString(data.context.role)
  ) {
    return false;
  }

  // Validate summary
  const summary = data.summary;
  if (!isRecord(summary)) {
    return false;
  }
  const summaryKeys = [
    'total',
    'pending',
    'confirmed',
    'inProgress',
    'completed',
    'cancelled',
    'noShow',
    'unassigned',
    'waiting',
    'inService',
    'readyToPay',
    'completedService',
    'homeService',
  ];
  if (!summaryKeys.every((key) => isNumber(summary[key]))) {
    return false;
  }

  // Validate queue
  if (!Array.isArray(data.queue) || !data.queue.every(isTodayQueueItem)) {
    return false;
  }

  // Validate readiness
  if (
    !isRecord(data.readiness) ||
    !isBoolean(data.readiness.available) ||
    !isReadinessStatus(data.readiness.status) ||
    !Array.isArray(data.readiness.issues) ||
    !data.readiness.issues.every(isReadinessIssue) ||
    !isNullableString(data.readiness.error)
  ) {
    return false;
  }

  // Validate attendance
  if (
    !isRecord(data.attendance) ||
    !isBoolean(data.attendance.available) ||
    !isString(data.attendance.selectedDate) ||
    !isString(data.attendance.timezone) ||
    !isNumber(data.attendance.lastHourCount) ||
    !Array.isArray(data.attendance.items) ||
    !data.attendance.items.every(isAttendanceItem) ||
    !isNullableString(data.attendance.error)
  ) {
    return false;
  }

  // Validate notifications
  if (
    !isRecord(data.notifications) ||
    !isBoolean(data.notifications.available) ||
    !Array.isArray(data.notifications.items) ||
    !data.notifications.items.every(isNotificationItem) ||
    !isNullableString(data.notifications.error)
  ) {
    return false;
  }

  return true;
}

export function isTodayMutationResult(
  value: unknown,
): value is DesktopTodayMutationResult {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data)) {
    return false;
  }
  const data = value.data;
  if (data.releasedNow !== undefined && typeof data.releasedNow !== 'boolean') {
    return false;
  }
  if (
    data.releaseAt !== undefined &&
    typeof data.releaseAt !== 'string' &&
    data.releaseAt !== null
  ) {
    return false;
  }
  return true;
}

async function getAccessToken(client?: SupabaseClient): Promise<string> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Your session has expired. Sign in again to view Today.');
  }
  return data.session.access_token;
}

function getBaseUrl(): string {
  const baseUrl = getHostedApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'Today service is not configured for this desktop installation.',
    );
  }
  return baseUrl;
}

async function requestJson<T>(
  path: string,
  validator: (value: unknown) => value is T,
  options?: {
    method?: 'GET' | 'POST';
    body?: unknown;
    client?: SupabaseClient;
    customFetch?: typeof fetch;
  },
): Promise<T> {
  const token = await getAccessToken(options?.client);
  const fetchFn = options?.customFetch ?? tauriFetch;
  let response: Response;

  try {
    response = await fetchFn(`${getBaseUrl()}${path}`, {
      method: options?.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options?.body === undefined
          ? {}
          : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
      },
      ...(options?.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new Error(
      'Today requires a connection. Please check your network and try again.',
    );
  }

  const result = await readHostedJsonResponse(response, {
    validator,
    serviceName: 'Today service',
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

/**
 * Fetches authoritative Today snapshot for the authenticated branch operator.
 * Branch is resolved authoritatively on the server; no branch parameter is sent.
 */
export async function fetchToday(
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<DesktopTodayData> {
  const response = await requestJson<DesktopTodayResponse>(
    '/api/desktop/v1/today',
    isTodayResponse,
    { client, customFetch },
  );
  return response.data;
}

/**
 * Executes an authorized operational mutation for a booking in the Today workspace.
 */
export function mutateToday(
  payload: DesktopTodayMutationPayload,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<DesktopTodayMutationResult> {
  return requestJson<DesktopTodayMutationResult>(
    '/api/desktop/v1/today/mutations',
    isTodayMutationResult,
    {
      method: 'POST',
      body: payload,
      client,
      customFetch,
    },
  );
}
