import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { getSupabaseClient } from './supabase';
import { getHostedApiBaseUrl } from './bookings-service';
import { readHostedJsonResponse } from './hosted-json-response';
import type {
  CustomerBookingHistoryItem,
  CustomerDetail,
  CustomerKpis,
  CustomerListItem,
  CustomerPagination,
  CustomerTabType,
  FetchCustomerDetailResult,
  FetchCustomersParams,
  FetchCustomersResult,
  WaitlistFollowupItem,
} from '../types/customers';

const ALLOWED_TABS: readonly CustomerTabType[] = [
  'all',
  'repeat',
  'lapsed',
  'followup',
];

export function isCustomerListItem(item: unknown): item is CustomerListItem {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.fullName === 'string' &&
    typeof obj.phone === 'string' &&
    typeof obj.totalBookings === 'number'
  );
}

export function isWaitlistFollowupItem(
  item: unknown,
): item is WaitlistFollowupItem {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.customerName === 'string' &&
    typeof obj.customerPhone === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.createdAt === 'string'
  );
}

export function isCustomerKpis(kpis: unknown): kpis is CustomerKpis {
  if (typeof kpis !== 'object' || kpis === null) return false;
  const obj = kpis as Record<string, unknown>;
  return (
    typeof obj.totalCustomers === 'number' &&
    typeof obj.repeatClients === 'number' &&
    typeof obj.lapsedClients === 'number' &&
    typeof obj.newThisMonth === 'number' &&
    typeof obj.totalVisits === 'number'
  );
}

export function isCustomerPagination(
  pagination: unknown,
): pagination is CustomerPagination {
  if (typeof pagination !== 'object' || pagination === null) return false;
  const obj = pagination as Record<string, unknown>;
  return (
    typeof obj.page === 'number' &&
    typeof obj.pageSize === 'number' &&
    typeof obj.totalCount === 'number' &&
    typeof obj.totalPages === 'number'
  );
}

export function isFetchCustomersSuccess(
  data: unknown,
): data is Extract<FetchCustomersResult, { ok: true }> {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.ok !== true) return false;
  if (
    typeof obj.tab !== 'string' ||
    !ALLOWED_TABS.includes(obj.tab as CustomerTabType)
  ) {
    return false;
  }
  if (!Array.isArray(obj.data) || !obj.data.every(isCustomerListItem)) {
    return false;
  }
  if (
    !Array.isArray(obj.waitlist) ||
    !obj.waitlist.every(isWaitlistFollowupItem)
  ) {
    return false;
  }
  if (!isCustomerPagination(obj.pagination)) {
    return false;
  }
  if (!isCustomerKpis(obj.kpis)) {
    return false;
  }
  return true;
}

export function isCustomerBookingHistoryItem(
  item: unknown,
): item is CustomerBookingHistoryItem {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.bookingDate === 'string' &&
    typeof obj.startTime === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.serviceName === 'string' &&
    typeof obj.staffName === 'string' &&
    typeof obj.branchName === 'string'
  );
}

export function isCustomerDetail(detail: unknown): detail is CustomerDetail {
  if (typeof detail !== 'object' || detail === null) return false;
  const obj = detail as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.fullName === 'string' &&
    typeof obj.phone === 'string' &&
    typeof obj.totalBookings === 'number'
  );
}

export function isFetchCustomerDetailSuccess(
  data: unknown,
): data is Extract<FetchCustomerDetailResult, { ok: true }> {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.ok !== true) return false;
  if (!isCustomerDetail(obj.customer)) {
    return false;
  }
  if (
    !Array.isArray(obj.bookingHistory) ||
    !obj.bookingHistory.every(isCustomerBookingHistoryItem)
  ) {
    return false;
  }
  return true;
}

/**
 * Fetch branch customers, segments, search results, KPIs, and waitlist follow-ups
 * from the authoritative hosted Desktop Customers API.
 */
export async function fetchBranchCustomers(
  params: FetchCustomersParams,
  customFetch?: typeof fetch,
): Promise<FetchCustomersResult> {
  const baseUrl = getHostedApiBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      code: 'API_CONFIG_REQUIRED',
      message:
        'Customer service is not configured for this desktop installation.',
    };
  }

  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {
      ok: false,
      code: 'AUTH_SESSION_REQUIRED',
      message:
        'Your session has expired. Sign in again to view customer records.',
    };
  }

  const queryParams = new URLSearchParams();
  queryParams.set('branchId', params.branchId);
  if (params.tab) {
    queryParams.set('tab', params.tab);
  }
  if (params.q !== undefined && params.q !== null && params.q.trim() !== '') {
    queryParams.set('q', params.q.trim());
  }
  if (params.page !== undefined && params.page !== null) {
    queryParams.set('page', String(params.page));
  }
  if (params.pageSize !== undefined && params.pageSize !== null) {
    queryParams.set('pageSize', String(params.pageSize));
  }

  const endpoint = `${baseUrl}/api/desktop/v1/customers?${queryParams.toString()}`;
  const fetchFn = customFetch ?? tauriFetch;

  try {
    const response = await fetchFn(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const result = await readHostedJsonResponse(response, {
      validator: isFetchCustomersSuccess,
      serviceName: 'Customer service',
    });

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: result.message,
      };
    }

    return result.data;
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message:
        'Customer service requires an active network connection. Please check your network and try again.',
    };
  }
}

/**
 * Fetch single customer detail profile and branch-filtered booking history.
 */
export async function fetchCustomerDetail(
  customerId: string,
  branchId: string,
  customFetch?: typeof fetch,
): Promise<FetchCustomerDetailResult> {
  const baseUrl = getHostedApiBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      code: 'API_CONFIG_REQUIRED',
      message:
        'Customer service is not configured for this desktop installation.',
    };
  }

  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {
      ok: false,
      code: 'AUTH_SESSION_REQUIRED',
      message:
        'Your session has expired. Sign in again to view customer details.',
    };
  }

  const endpoint = `${baseUrl}/api/desktop/v1/customers/${encodeURIComponent(customerId)}?branchId=${encodeURIComponent(branchId)}`;
  const fetchFn = customFetch ?? tauriFetch;

  try {
    const response = await fetchFn(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const result = await readHostedJsonResponse(response, {
      validator: isFetchCustomerDetailSuccess,
      serviceName: 'Customer detail service',
    });

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: result.message,
      };
    }

    return result.data;
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message:
        'Customer service requires an active network connection. Please check your network and try again.',
    };
  }
}
