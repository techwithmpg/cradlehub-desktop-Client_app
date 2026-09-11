import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getHostedApiBaseUrl } from './bookings-service';
import { getSupabaseClient } from './supabase';
import { readHostedJsonResponse } from './hosted-json-response';
import type {
  HomeServiceBookingDetail,
  HomeServiceDriver,
  HomeServiceMutationResult,
  HomeServiceRecommendations,
  HomeServiceResponse,
} from '../types/home-service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isHomeServiceResponse(value: unknown): value is HomeServiceResponse {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data))
    return false;

  const data = value.data;
  const summary = data.summary;

  if (!isRecord(summary)) return false;

  return (
    isRecord(data.context) &&
    typeof data.context.branchId === 'string' &&
    typeof data.context.branchName === 'string' &&
    typeof data.context.date === 'string' &&
    [
      'totalToday',
      'awaitingDispatch',
      'activeTrips',
      'completedToday',
      'cancelledToday',
    ].every((key) => typeof summary[key] === 'number') &&
    Array.isArray(data.items) &&
    Array.isArray(data.alerts) &&
    typeof data.locationSemantics === 'string'
  );
}

function isBookingDetailResponse(
  value: unknown,
): value is { ok: true; data: HomeServiceBookingDetail } {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data))
    return false;
  const data = value.data;
  return (
    typeof data.id === 'string' &&
    isRecord(data.customer) &&
    isRecord(data.service) &&
    isRecord(data.homeServiceAddress)
  );
}

function isRecommendationsResponse(
  value: unknown,
): value is { ok: true; data: HomeServiceRecommendations } {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data))
    return false;
  return (
    Array.isArray(value.data.therapists) && Array.isArray(value.data.drivers)
  );
}

function isDriversResponse(value: unknown): value is {
  ok: true;
  data: { branchId: string; drivers: HomeServiceDriver[] };
} {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data))
    return false;
  return (
    typeof value.data.branchId === 'string' && Array.isArray(value.data.drivers)
  );
}

async function getAccessToken(client?: SupabaseClient): Promise<string> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error(
      'Your session has expired. Sign in again to use Home Service.',
    );
  }
  return data.session.access_token;
}

function getBaseUrl(): string {
  const baseUrl = getHostedApiBaseUrl();
  if (!baseUrl)
    throw new Error(
      'Home Service is not configured for this desktop installation.',
    );
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
      'Home Service requires a connection. Please check your network and try again.',
    );
  }
  const result = await readHostedJsonResponse(response, {
    validator,
    serviceName: 'Home Service',
  });
  if (!result.ok) throw new Error(result.message);
  return result.data;
}

export function fetchHomeService(
  date: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<HomeServiceResponse> {
  return requestJson(
    `/api/desktop/v1/home-service?date=${encodeURIComponent(date)}`,
    isHomeServiceResponse,
    { client, customFetch },
  );
}

export function fetchHomeServiceDrivers(
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<{
  ok: true;
  data: { branchId: string; drivers: HomeServiceDriver[] };
}> {
  return requestJson(
    '/api/desktop/v1/home-service/drivers',
    isDriversResponse,
    { client, customFetch },
  );
}

export function fetchHomeServiceBookingDetail(
  bookingId: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<{ ok: true; data: HomeServiceBookingDetail }> {
  return requestJson(
    `/api/desktop/v1/bookings/${encodeURIComponent(bookingId)}`,
    isBookingDetailResponse,
    { client, customFetch },
  );
}

export function fetchHomeServiceRecommendations(
  bookingId: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<{ ok: true; data: HomeServiceRecommendations }> {
  return requestJson(
    `/api/desktop/v1/home-service/recommendations?bookingId=${encodeURIComponent(bookingId)}`,
    isRecommendationsResponse,
    { client, customFetch },
  );
}

export function mutateHomeService(
  body: Record<string, unknown>,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<HomeServiceMutationResult> {
  return requestJson(
    '/api/desktop/v1/home-service/mutations',
    (value): value is HomeServiceMutationResult =>
      isRecord(value) && value.ok === true && isRecord(value.data),
    { method: 'POST', body, client, customFetch },
  );
}

export function rescheduleHomeServiceBooking(
  bookingId: string,
  body: { date: string; startTime: string; note?: string },
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<HomeServiceMutationResult> {
  return requestJson(
    `/api/desktop/v1/bookings/${encodeURIComponent(bookingId)}/reschedule`,
    (value): value is HomeServiceMutationResult =>
      isRecord(value) && value.ok === true && isRecord(value.data),
    { method: 'POST', body: { ...body }, client, customFetch },
  );
}

export function cancelHomeServiceBooking(
  bookingId: string,
  body: { note?: string; cancellationReason?: string },
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<HomeServiceMutationResult> {
  return requestJson(
    `/api/desktop/v1/bookings/${encodeURIComponent(bookingId)}/cancel`,
    (value): value is HomeServiceMutationResult =>
      isRecord(value) && value.ok === true && isRecord(value.data),
    { method: 'POST', body, client, customFetch },
  );
}
