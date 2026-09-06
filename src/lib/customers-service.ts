import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { getSupabaseClient } from './supabase';
import { getHostedApiBaseUrl } from './bookings-service';
import type {
  FetchCustomersParams,
  FetchCustomersResult,
  FetchCustomerDetailResult,
} from '../types/customers';

function parseNonJsonErrorMessage(
  status: number,
  serviceName: string = 'Customer service',
): string {
  if (status === 404) {
    return 'The hosted Customers endpoint is not available on the current deployment.';
  }
  if (status === 500) {
    return 'The hosted Customers service returned an unexpected server response.';
  }
  if (status >= 300 && status < 400) {
    return 'The hosted Customers endpoint redirected unexpectedly.';
  }
  return `${serviceName} returned an unexpected HTTP ${status} response instead of JSON.`;
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const lower = contentType.toLowerCase();
  return lower.includes('application/json') || lower.includes('+json');
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
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const contentType = response.headers.get('content-type');
    if (!isJsonContentType(contentType)) {
      return {
        ok: false,
        code: 'HOSTED_API_NON_JSON_RESPONSE',
        message: parseNonJsonErrorMessage(response.status, 'Customer service'),
      };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return {
        ok: false,
        code: 'RESPONSE_PARSE_ERROR',
        message: `Customer service returned an invalid JSON response (HTTP ${response.status}).`,
      };
    }

    if (
      !response.ok ||
      (typeof body === 'object' &&
        body !== null &&
        (body as { ok?: boolean }).ok === false)
    ) {
      const errObj = (
        typeof body === 'object' && body !== null ? body : {}
      ) as {
        code?: string;
        message?: string;
      };
      return {
        ok: false,
        code: errObj.code || `HTTP_${response.status}`,
        message:
          errObj.message ||
          `Customer request failed with status ${response.status}.`,
      };
    }

    return body as FetchCustomersResult;
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
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const contentType = response.headers.get('content-type');
    if (!isJsonContentType(contentType)) {
      return {
        ok: false,
        code: 'HOSTED_API_NON_JSON_RESPONSE',
        message: parseNonJsonErrorMessage(
          response.status,
          'Customer detail service',
        ),
      };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return {
        ok: false,
        code: 'RESPONSE_PARSE_ERROR',
        message: `Customer detail service returned an invalid JSON response (HTTP ${response.status}).`,
      };
    }

    if (
      !response.ok ||
      (typeof body === 'object' &&
        body !== null &&
        (body as { ok?: boolean }).ok === false)
    ) {
      const errObj = (
        typeof body === 'object' && body !== null ? body : {}
      ) as {
        code?: string;
        message?: string;
      };
      return {
        ok: false,
        code: errObj.code || `HTTP_${response.status}`,
        message:
          errObj.message ||
          `Customer detail request failed with status ${response.status}.`,
      };
    }

    return body as FetchCustomerDetailResult;
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message:
        'Customer service requires an active network connection. Please check your network and try again.',
    };
  }
}
