import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getHostedApiBaseUrl } from './bookings-service';
import { getSupabaseClient } from './supabase';
import { readHostedJsonResponse } from './hosted-json-response';
import type {
  DesktopTodayData,
  DesktopTodayMutationPayload,
  DesktopTodayMutationResult,
  DesktopTodayResponse,
} from '../types/today';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isTodayResponse(value: unknown): value is DesktopTodayResponse {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data)) {
    return false;
  }

  const data = value.data;

  // Validate context
  if (
    !isRecord(data.context) ||
    typeof data.context.branchId !== 'string' ||
    typeof data.context.branchName !== 'string' ||
    typeof data.context.businessDate !== 'string' ||
    typeof data.context.role !== 'string'
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
  if (!summaryKeys.every((key) => typeof summary[key] === 'number')) {
    return false;
  }

  // Validate queue
  if (!Array.isArray(data.queue)) {
    return false;
  }

  // Validate readiness
  if (
    !isRecord(data.readiness) ||
    typeof data.readiness.available !== 'boolean' ||
    typeof data.readiness.status !== 'string' ||
    !Array.isArray(data.readiness.issues)
  ) {
    return false;
  }

  // Validate attendance
  if (
    !isRecord(data.attendance) ||
    typeof data.attendance.available !== 'boolean' ||
    typeof data.attendance.selectedDate !== 'string' ||
    typeof data.attendance.timezone !== 'string' ||
    typeof data.attendance.lastHourCount !== 'number' ||
    !Array.isArray(data.attendance.items)
  ) {
    return false;
  }

  // Validate notifications
  if (
    !isRecord(data.notifications) ||
    typeof data.notifications.available !== 'boolean' ||
    !Array.isArray(data.notifications.items)
  ) {
    return false;
  }

  return true;
}

export function isTodayMutationResult(
  value: unknown,
): value is DesktopTodayMutationResult {
  return isRecord(value) && value.ok === true && isRecord(value.data);
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
