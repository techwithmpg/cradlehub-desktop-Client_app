import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getHostedApiBaseUrl } from './bookings-service';
import { getSupabaseClient } from './supabase';
import { readHostedJsonResponse } from './hosted-json-response';
import { measureReadOperation } from './read-performance';
import type {
  OperationsCenterData,
  OperationsIssue,
  OperationsScan,
  OperationalStaffMember,
  OperationsTab,
  OperationsFilters,
  AssignProviderPayload,
  AssignProviderResult,
  ResolveExceptionPayload,
  DeviceRecoveryPayload,
  DeviceRecoveryResult,
} from '../types/operations';

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

function isOperationsIssue(value: unknown): value is OperationsIssue {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.area) &&
    isString(value.severity) &&
    isString(value.resolutionState) &&
    isString(value.title) &&
    isString(value.description) &&
    isString(value.guidance) &&
    isString(value.actionLabel) &&
    isString(value.actionHref) &&
    isNullableString(value.code) &&
    isNullableString(value.scanIdSuffix) &&
    isNullableString(value.detectedAt)
  );
}

function isOperationsScan(value: unknown): value is OperationsScan {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isNullableString(value.staffId) &&
    isString(value.staffName) &&
    isString(value.reasonCode) &&
    isString(value.message) &&
    isString(value.scanIdSuffix) &&
    isString(value.occurredAt) &&
    isBoolean(value.isUnresolvedFailure)
  );
}

function isOperationalStaffMember(
  value: unknown,
): value is OperationalStaffMember {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.full_name) &&
    isString(value.system_role) &&
    isString(value.staff_type) &&
    isBoolean(value.is_active) &&
    isString(value.branch_id) &&
    isBoolean(value.hasLoginAccount) &&
    isBoolean(value.isIdentityVerified)
  );
}

function isOperationsCenterData(value: unknown): value is OperationsCenterData {
  if (!isRecord(value)) return false;
  return (
    isString(value.branchId) &&
    isString(value.branchName) &&
    isString(value.checkedAt) &&
    Array.isArray(value.issues) &&
    value.issues.every(isOperationsIssue) &&
    Array.isArray(value.scans) &&
    value.scans.every(isOperationsScan) &&
    isBoolean(value.attendanceAvailable) &&
    isBoolean(value.configurationAvailable) &&
    isBoolean(value.staffAvailable) &&
    Array.isArray(value.branchStaff) &&
    value.branchStaff.every(isOperationalStaffMember) &&
    isRecord(value.counts) &&
    isNumber(value.counts.critical) &&
    isNumber(value.counts.warning) &&
    isNumber(value.counts.info) &&
    isNumber(value.counts.attendance) &&
    isNumber(value.counts.staff) &&
    isNumber(value.counts.configuration) &&
    isNumber(value.counts.unresolvedScans) &&
    isNumber(value.counts.totalIssues) &&
    isString(value.readyLabel) &&
    isString(value.operatorRole) &&
    isBoolean(value.canPerformMutations)
  );
}

function isAssignProviderResult(value: unknown): value is AssignProviderResult {
  if (!isRecord(value)) return false;
  return (
    isString(value.serviceId) &&
    isString(value.staffId) &&
    isNumber(value.providerCount)
  );
}

function isDeviceRecoveryResult(value: unknown): value is DeviceRecoveryResult {
  if (!isRecord(value)) return false;
  return (
    isString(value.token) &&
    (value.activationUrl === null || isString(value.activationUrl)) &&
    isString(value.expiresAt)
  );
}

function isGenericSuccess(
  value: unknown,
): value is { ok: boolean; message?: string } {
  return isRecord(value) && typeof value.ok === 'boolean';
}

export class OperationsApiError extends Error {
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
    this.name = 'OperationsApiError';
    this.isAmbiguous = options.isAmbiguous;
    this.isNetworkError = options.isNetworkError ?? false;
    this.status = options.status;
    this.code = options.code;
  }
}

interface ApiSuccessEnvelope<T> {
  ok: true;
  data: T;
  message?: string;
}

function createEnvelopeValidator<T>(
  dataValidator: (value: unknown) => value is T,
): (value: unknown) => value is ApiSuccessEnvelope<T> {
  return (value: unknown): value is ApiSuccessEnvelope<T> => {
    if (!isRecord(value) || value.ok !== true) return false;
    return dataValidator(value.data);
  };
}

async function getAccessToken(client?: SupabaseClient): Promise<string> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error(
      'Your session has expired. Sign in again to access Operations Center.',
    );
  }
  return data.session.access_token;
}

function getBaseUrl(): string {
  const baseUrl = getHostedApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'Operations Center is not configured for this desktop installation.',
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
    throw new OperationsApiError(
      'Operations Center requires a connection. Please check your network and try again.',
      {
        isAmbiguous: true,
        isNetworkError: true,
      },
    );
  }

  const result = await readHostedJsonResponse<ApiSuccessEnvelope<T>>(response, {
    validator: createEnvelopeValidator(validator),
    serviceName: 'Operations Center',
  });

  if (!result.ok) {
    const isAmbiguous = result.status >= 500;
    throw new OperationsApiError(result.message, {
      isAmbiguous,
      status: result.status,
      code: result.code,
    });
  }

  return result.data.data;
}

export async function fetchOperationsCenterData(
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<OperationsCenterData> {
  return measureReadOperation('operations.fetchOverview', () =>
    requestJson('/api/desktop/v1/operations-center', isOperationsCenterData, {
      client,
      customFetch,
    }),
  );
}

export async function assignServiceProvider(
  payload: AssignProviderPayload,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<AssignProviderResult> {
  return requestJson(
    '/api/desktop/v1/operations-center/mutations',
    isAssignProviderResult,
    {
      method: 'POST',
      body: {
        action: 'assign_service_provider',
        serviceId: payload.serviceId,
        staffId: payload.staffId,
      },
      client,
      customFetch,
    },
  );
}

export async function resolveAttendanceException(
  payload: ResolveExceptionPayload,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<{ ok: boolean; message: string }> {
  const baseUrl = getBaseUrl();
  const token = await getAccessToken(client);
  const fetchFn = customFetch ?? tauriFetch;

  let response: Response;
  try {
    response = await fetchFn(
      `${baseUrl}/api/desktop/v1/operations-center/mutations`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'resolve_attendance_exception',
          exceptionId: payload.exceptionId,
          reason: payload.reason,
        }),
      },
    );
  } catch {
    throw new OperationsApiError(
      'Network error while attempting to resolve attendance exception.',
      { isAmbiguous: true, isNetworkError: true },
    );
  }

  const result = await readHostedJsonResponse<{
    ok: boolean;
    message?: string;
  }>(response, {
    validator: isGenericSuccess,
    serviceName: 'Operations Center',
  });

  if (!result.ok) {
    throw new OperationsApiError(result.message, {
      isAmbiguous: result.status >= 500,
      status: result.status,
      code: result.code,
    });
  }

  return {
    ok: Boolean(result.data.ok),
    message: (result.data.message as string) || 'Exception resolved.',
  };
}

export async function generateDeviceRecovery(
  payload: DeviceRecoveryPayload,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<DeviceRecoveryResult> {
  return requestJson(
    '/api/desktop/v1/operations-center/mutations',
    isDeviceRecoveryResult,
    {
      method: 'POST',
      body: {
        action: 'generate_device_recovery',
        staffId: payload.staffId,
      },
      client,
      customFetch,
    },
  );
}

export function filterOperationsIssues(
  issues: OperationsIssue[],
  tab: OperationsTab,
  filters: OperationsFilters,
): OperationsIssue[] {
  const q = filters.search.trim().toLowerCase();

  return issues.filter((issue) => {
    // Tab scope
    if (tab === 'attendance' && issue.area !== 'attendance') return false;
    if (tab === 'service' && issue.area !== 'configuration') return false;
    if (tab === 'staff' && issue.area !== 'staff_identity') return false;
    if (tab === 'scans') return false; // Scans are handled separately

    // Severity filter
    if (filters.severity !== 'all' && issue.severity !== filters.severity) {
      return false;
    }

    // Area filter
    if (filters.area !== 'all' && issue.area !== filters.area) {
      return false;
    }

    // Resolution state filter
    if (
      filters.resolutionState !== 'all' &&
      issue.resolutionState !== filters.resolutionState
    ) {
      return false;
    }

    // Text search
    if (q) {
      const titleMatch = issue.title.toLowerCase().includes(q);
      const descMatch = issue.description.toLowerCase().includes(q);
      const codeMatch = issue.code
        ? issue.code.toLowerCase().includes(q)
        : false;
      const staffMatch = issue.staffName
        ? issue.staffName.toLowerCase().includes(q)
        : false;
      const serviceMatch = issue.serviceName
        ? issue.serviceName.toLowerCase().includes(q)
        : false;
      const suffixMatch = issue.scanIdSuffix
        ? issue.scanIdSuffix.toLowerCase().includes(q)
        : false;

      if (
        !titleMatch &&
        !descMatch &&
        !codeMatch &&
        !staffMatch &&
        !serviceMatch &&
        !suffixMatch
      ) {
        return false;
      }
    }

    return true;
  });
}

export function filterOperationsScans(
  scans: OperationsScan[],
  filters: OperationsFilters,
): OperationsScan[] {
  const q = filters.search.trim().toLowerCase();

  return scans.filter((scan) => {
    if (q) {
      const nameMatch = scan.staffName.toLowerCase().includes(q);
      const codeMatch = scan.reasonCode.toLowerCase().includes(q);
      const msgMatch = scan.message.toLowerCase().includes(q);
      const suffixMatch = scan.scanIdSuffix.toLowerCase().includes(q);

      if (!nameMatch && !codeMatch && !msgMatch && !suffixMatch) {
        return false;
      }
    }
    return true;
  });
}
