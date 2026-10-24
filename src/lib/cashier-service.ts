import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getHostedApiBaseUrl } from './bookings-service';
import { getSupabaseClient } from './supabase';
import { readHostedJsonResponse } from './hosted-json-response';
import { measureReadOperation } from './read-performance';
import type {
  CashierOverviewData,
  PayableOrdersResponseData,
  CashierLedgerResponseData,
  CashierDrawersResponseData,
  DayCloseSummaryData,
  HistoryTabSummary,
  RecordPaymentPayload,
  RecordExpensePayload,
  DrawerSessionActionPayload,
} from '../types/cashier';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCashierOverviewData(value: unknown): value is CashierOverviewData {
  if (!isRecord(value)) return false;
  return (
    typeof value.branchId === 'string' &&
    typeof value.branchName === 'string' &&
    typeof value.businessDate === 'string' &&
    isRecord(value.kpis) &&
    typeof value.kpis.totalCollected === 'number' &&
    Array.isArray(value.paymentMix)
  );
}

function isPayableOrdersData(
  value: unknown,
): value is PayableOrdersResponseData {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.pendingQueue) &&
    Array.isArray(value.paidAndClosed) &&
    Array.isArray(value.accounts) &&
    Array.isArray(value.paymentMethods)
  );
}

function isCashierLedgerData(
  value: unknown,
): value is CashierLedgerResponseData {
  if (!isRecord(value)) return false;
  return (
    isRecord(value.kpis) &&
    typeof value.kpis.netFlow === 'number' &&
    Array.isArray(value.records) &&
    typeof value.totalRecords === 'number'
  );
}

function isCashierDrawersData(
  value: unknown,
): value is CashierDrawersResponseData {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.activeSessions) &&
    Array.isArray(value.availableDrawers) &&
    Array.isArray(value.accounts)
  );
}

function isDayCloseData(value: unknown): value is DayCloseSummaryData {
  if (!isRecord(value)) return false;
  return (
    typeof value.businessDate === 'string' &&
    typeof value.isFinalizationSupported === 'boolean' &&
    Array.isArray(value.paymentBreakdown)
  );
}

function isHistoryData(value: unknown): value is HistoryTabSummary {
  if (!isRecord(value)) return false;
  return (
    typeof value.closedDaysThisMonth === 'number' &&
    Array.isArray(value.records)
  );
}

function isGenericSuccess(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

async function getAccessToken(client?: SupabaseClient): Promise<string> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error(
      'Your session has expired. Sign in again to access Cashier.',
    );
  }
  return data.session.access_token;
}

function getBaseUrl(): string {
  const baseUrl = getHostedApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'Cashier service is not configured for this desktop installation.',
    );
  }
  return baseUrl;
}

interface ApiSuccessEnvelope<T> {
  ok: true;
  data: T;
}

function createEnvelopeValidator<T>(
  dataValidator: (value: unknown) => value is T,
): (value: unknown) => value is ApiSuccessEnvelope<T> {
  return (value: unknown): value is ApiSuccessEnvelope<T> => {
    if (!isRecord(value) || value.ok !== true) return false;
    return dataValidator(value.data);
  };
}

export class CashierApiError extends Error {
  readonly isAmbiguous: boolean;
  readonly isNetworkError: boolean;
  readonly status?: number;
  readonly code?: string;

  constructor(
    message: string,
    options: {
      isAmbiguous: boolean;
      isNetworkError?: boolean;
      status?: number;
      code?: string;
    },
  ) {
    super(message);
    this.name = 'CashierApiError';
    this.isAmbiguous = options.isAmbiguous;
    this.isNetworkError = options.isNetworkError ?? false;
    this.status = options.status;
    this.code = options.code;
  }
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
  const baseUrl = getBaseUrl();
  const token = await getAccessToken(options?.client);
  const fetchFn = options?.customFetch ?? tauriFetch;
  let response: Response;

  try {
    response = await fetchFn(`${baseUrl}${path}`, {
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
    throw new CashierApiError(
      'Cashier requires a connection. Please check your network and try again.',
      {
        isAmbiguous: true,
        isNetworkError: true,
      },
    );
  }

  const result = await readHostedJsonResponse<ApiSuccessEnvelope<T>>(response, {
    validator: createEnvelopeValidator(validator),
    serviceName: 'Cashier service',
  });

  if (!result.ok) {
    const isAmbiguous = result.status >= 500;
    throw new CashierApiError(result.message, {
      isAmbiguous,
      status: result.status,
      code: result.code,
    });
  }

  return result.data.data;
}

export async function fetchCashierOverview(
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<CashierOverviewData> {
  return measureReadOperation('cashier.fetchOverview', () =>
    requestJson('/api/desktop/v1/cashier/overview', isCashierOverviewData, {
      client,
      customFetch,
    }),
  );
}

export async function fetchPayableOrders(
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<PayableOrdersResponseData> {
  return measureReadOperation('cashier.fetchPayableOrders', () =>
    requestJson('/api/desktop/v1/cashier/payable-orders', isPayableOrdersData, {
      client,
      customFetch,
    }),
  );
}

export async function fetchCashierLedger(
  filters: {
    search?: string;
    category?: string;
    method?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {},
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<CashierLedgerResponseData> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.method) params.set('method', filters.method);
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const query = params.toString() ? `?${params.toString()}` : '';

  return measureReadOperation('cashier.fetchLedger', () =>
    requestJson(`/api/desktop/v1/cashier/ledger${query}`, isCashierLedgerData, {
      client,
      customFetch,
    }),
  );
}

export async function fetchCashierDrawers(
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<CashierDrawersResponseData> {
  return measureReadOperation('cashier.fetchDrawers', () =>
    requestJson('/api/desktop/v1/cashier/drawers', isCashierDrawersData, {
      client,
      customFetch,
    }),
  );
}

export async function fetchDayClose(
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<DayCloseSummaryData> {
  return measureReadOperation('cashier.fetchDayClose', () =>
    requestJson('/api/desktop/v1/cashier/day-close', isDayCloseData, {
      client,
      customFetch,
    }),
  );
}

export async function fetchCashierHistory(
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<HistoryTabSummary> {
  return measureReadOperation('cashier.fetchHistory', () =>
    requestJson('/api/desktop/v1/cashier/history', isHistoryData, {
      client,
      customFetch,
    }),
  );
}

export async function postRecordPayment(
  payload: RecordPaymentPayload,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<Record<string, unknown>> {
  return requestJson('/api/desktop/v1/cashier/payments', isGenericSuccess, {
    method: 'POST',
    body: payload,
    client,
    customFetch,
  });
}

export async function postRecordExpense(
  payload: RecordExpensePayload,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<Record<string, unknown>> {
  return requestJson('/api/desktop/v1/cashier/expenses', isGenericSuccess, {
    method: 'POST',
    body: payload,
    client,
    customFetch,
  });
}

export async function postDrawerSessionAction(
  payload: DrawerSessionActionPayload,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<Record<string, unknown>> {
  return requestJson('/api/desktop/v1/cashier/drawers', isGenericSuccess, {
    method: 'POST',
    body: payload,
    client,
    customFetch,
  });
}
