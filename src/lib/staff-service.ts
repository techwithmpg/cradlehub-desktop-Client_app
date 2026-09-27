import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { getHostedApiBaseUrl } from './bookings-service';
import { readHostedJsonResponse } from './hosted-json-response';
import { STAFF_ROLE_OPTIONS } from './roles';
import {
  STAFF_TIERS,
  STAFF_TYPES,
  type HostedMutationResult,
} from '../types/staff';
import type {
  BranchServiceOption,
  FetchStaffResult,
  FetchBranchServicesResult,
  FetchOnboardingRequestsResult,
  ReviewOnboardingInput,
  StaffBlockedTime,
  StaffFilters,
  StaffKpiSummary,
  StaffMember,
  StaffOnboardingRequest,
  StaffScheduleAdjustmentInput,
  StaffScheduleOverride,
  StaffServiceCapability,
  StaffStatus,
  UpdateStaffProfileInput,
} from '../types/staff';

const STAFF_SELECT = `
  id, branch_id, auth_user_id, full_name, nickname, phone, avatar_url,
  tier, system_role, staff_type, is_head, is_active, is_cross_branch,
  created_at, updated_at,
  staff_services (
    service_id,
    services (
      id,
      name
    )
  )
`;

interface RawStaffServiceItem {
  service_id?: unknown;
  services?:
    | { id?: unknown; name?: unknown }
    | Array<{ id?: unknown; name?: unknown }>
    | null;
}

/**
 * Authoritative Staff status derivation function.
 * Mirrors hosted `getStaffStatus()` in `src/components/features/staff/staff-management-utils.ts`.
 * Emits strictly 'active', 'invited', or 'awaiting'. Does NOT emit 'inactive'.
 */
export function deriveStaffStatus(member: {
  is_active: boolean;
  auth_user_id?: string | null;
  full_name: string;
}): StaffStatus {
  if (member.is_active) return 'active';
  if (
    !member.auth_user_id ||
    member.full_name.toLowerCase() === 'pending invitation'
  ) {
    return 'invited';
  }
  return 'awaiting';
}

/**
 * Calculates summary KPI metrics aligned 1:1 with hosted Staff semantics.
 */
export function calculateStaffKpis(roster: StaffMember[]): StaffKpiSummary {
  let activeStaff = 0;
  let awaitingStaff = 0;
  let invitedStaff = 0;

  for (const member of roster) {
    if (member.status === 'active') {
      activeStaff++;
    } else if (member.status === 'awaiting') {
      awaitingStaff++;
    } else if (member.status === 'invited') {
      invitedStaff++;
    }
  }

  return {
    totalStaff: roster.length,
    activeStaff,
    awaitingStaff,
    invitedStaff,
  };
}

const NON_TIER_ROLES = new Set([
  'owner',
  'manager',
  'assistant_manager',
  'store_manager',
  'crm',
  'service_head',
  'driver',
  'utility',
  'managerial',
  'salon_head',
]);

const TIER_ELIGIBLE_STAFF_TYPES = new Set([
  'therapist',
  'nail_tech',
  'aesthetician',
]);

const TIER_ELIGIBLE_SYSTEM_ROLES = new Set(['staff', 'service_staff']);

const NON_TIER_STAFF_TYPES = new Set([
  'csr',
  'driver',
  'utility',
  'managerial',
  'salon_head',
]);

/**
 * Determines whether a staff member is eligible to have a skill tier displayed.
 * Mirrors hosted `getStaffDisplayMeta()` semantics:
 * Only operational service providers (therapist, nail_tech, aesthetician) under
 * staff/service_staff system roles display skill tier.
 * Suppressed for managerial, CRM/CSR, driver, utility, and supervisor roles.
 */
export function shouldDisplayStaffTier(member: {
  tier?: string | null;
  system_role?: string | null;
  staff_type?: string | null;
}): boolean {
  if (!member.tier || !member.tier.trim()) return false;

  const rawRole = (member.system_role || '').trim().toLowerCase();
  const staffType = (member.staff_type || '').trim().toLowerCase();

  const canonicalRole =
    rawRole === 'csr' || rawRole === 'csr_head' || rawRole === 'csr_staff'
      ? 'crm'
      : rawRole;

  const isRoleEligible =
    TIER_ELIGIBLE_SYSTEM_ROLES.has(canonicalRole) &&
    !NON_TIER_ROLES.has(canonicalRole);

  const isTypeEligible = staffType
    ? TIER_ELIGIBLE_STAFF_TYPES.has(staffType) &&
      !NON_TIER_STAFF_TYPES.has(staffType)
    : true;

  return isRoleEligible && isTypeEligible;
}

/**
 * Normalizes raw database capabilities into minimized service records.
 * Returns null if nested capability data is malformed (fails closed, does not fabricate names).
 * Strictly validates:
 * - staff_services must be an Array (rejects undefined and null; [] is valid empty)
 * - outer service_id must be a non-empty string
 * - nested services.id and services.name must be non-empty strings
 * - services.id must match outer service_id (defensive ID consistency)
 * - single-element array compatibility form requires services.length === 1 with valid id/name
 */
export function extractCapabilities(
  rawServices: unknown,
): StaffServiceCapability[] | null {
  if (!Array.isArray(rawServices)) return null;

  const capabilities: StaffServiceCapability[] = [];
  for (const item of rawServices) {
    if (typeof item !== 'object' || item === null) return null;
    const raw = item as RawStaffServiceItem;

    if (typeof raw.service_id !== 'string' || !raw.service_id.trim()) {
      return null;
    }
    const serviceId = raw.service_id.trim();

    let serviceIdFromRelation: string;
    let serviceName: string;

    if (raw.services && typeof raw.services === 'object') {
      if (Array.isArray(raw.services)) {
        if (raw.services.length !== 1) return null;
        const first = raw.services[0];
        if (
          typeof first !== 'object' ||
          first === null ||
          typeof first.id !== 'string' ||
          !first.id.trim() ||
          typeof first.name !== 'string' ||
          !first.name.trim()
        ) {
          return null;
        }
        serviceIdFromRelation = first.id.trim();
        serviceName = first.name.trim();
      } else {
        const svcObj = raw.services as { id?: unknown; name?: unknown };
        if (
          typeof svcObj.id !== 'string' ||
          !svcObj.id.trim() ||
          typeof svcObj.name !== 'string' ||
          !svcObj.name.trim()
        ) {
          return null;
        }
        serviceIdFromRelation = svcObj.id.trim();
        serviceName = svcObj.name.trim();
      }
    } else {
      return null;
    }

    // Defensive ID consistency check
    if (serviceIdFromRelation !== serviceId) {
      return null;
    }

    capabilities.push({
      service_id: serviceId,
      service_name: serviceName,
    });
  }

  return capabilities;
}

/**
 * Validates and transforms a raw staff row into a typed StaffMember.
 * Fails closed by returning null if required modern schema fields are missing or malformed.
 * Strictly validates all selected fields: undefined is rejected on all selected columns.
 */
export function normalizeStaffMember(
  row: unknown,
  expectedBranchId?: string,
): StaffMember | null {
  if (typeof row !== 'object' || row === null) return null;
  const obj = row as Record<string, unknown>;

  // 1. id: non-empty string
  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;

  // 2. branch_id: non-empty string, matches expectedBranchId if supplied
  if (typeof obj.branch_id !== 'string' || !obj.branch_id.trim()) return null;
  if (expectedBranchId && obj.branch_id.trim() !== expectedBranchId.trim()) {
    return null;
  }

  // 3. auth_user_id: string | null (reject undefined; reject empty/whitespace string)
  if (obj.auth_user_id !== null) {
    if (typeof obj.auth_user_id !== 'string' || !obj.auth_user_id.trim()) {
      return null;
    }
  }

  // 4. full_name: non-empty string
  if (typeof obj.full_name !== 'string' || !obj.full_name.trim()) return null;

  // 5. nickname: string | null (reject undefined)
  if (obj.nickname !== null && typeof obj.nickname !== 'string') {
    return null;
  }

  // 6. phone: string | null (reject undefined)
  if (obj.phone !== null && typeof obj.phone !== 'string') {
    return null;
  }

  // 7. avatar_url: string | null (reject undefined)
  if (obj.avatar_url !== null && typeof obj.avatar_url !== 'string') {
    return null;
  }

  // 8. tier: non-empty string
  if (typeof obj.tier !== 'string' || !obj.tier.trim()) return null;

  // 9. system_role: non-empty string
  if (typeof obj.system_role !== 'string' || !obj.system_role.trim())
    return null;

  // 10. staff_type: non-empty string
  if (typeof obj.staff_type !== 'string' || !obj.staff_type.trim()) return null;

  // 11. is_head: boolean
  if (typeof obj.is_head !== 'boolean') return null;

  // 12. is_active: boolean
  if (typeof obj.is_active !== 'boolean') return null;

  // 13. is_cross_branch: boolean
  if (typeof obj.is_cross_branch !== 'boolean') return null;

  // 14. created_at: non-empty string
  if (typeof obj.created_at !== 'string' || !obj.created_at.trim()) return null;

  // 15. updated_at: non-empty string (reject null/undefined)
  if (typeof obj.updated_at !== 'string' || !obj.updated_at.trim()) {
    return null;
  }

  // 16. staff_services: nested capability validation
  const services = extractCapabilities(obj.staff_services);
  if (services === null) return null;

  const status = deriveStaffStatus({
    is_active: obj.is_active,
    auth_user_id: obj.auth_user_id as string | null,
    full_name: obj.full_name,
  });

  return {
    id: obj.id.trim(),
    branch_id: obj.branch_id.trim(),
    auth_user_id: obj.auth_user_id ? (obj.auth_user_id as string).trim() : null,
    full_name: obj.full_name.trim(),
    nickname: obj.nickname ? (obj.nickname as string).trim() : null,
    phone: obj.phone ? (obj.phone as string).trim() : null,
    avatar_url: obj.avatar_url ? (obj.avatar_url as string).trim() : null,
    tier: obj.tier.trim(),
    system_role: obj.system_role.trim(),
    staff_type: obj.staff_type.trim(),
    is_head: obj.is_head,
    is_active: obj.is_active,
    is_cross_branch: obj.is_cross_branch,
    created_at: obj.created_at.trim(),
    updated_at: (obj.updated_at as string).trim(),
    status,
    services,
  };
}

/**
 * Filters the staff roster by search term, status, staff type, system role, and capability.
 */
export function filterStaff(
  staffList: StaffMember[],
  filters: StaffFilters,
): StaffMember[] {
  const query = filters.search.trim().toLowerCase();
  const statusFilter = filters.status;
  const staffTypeFilter = filters.staffType;
  const systemRoleFilter = filters.systemRole;
  const capabilityFilter = filters.capabilityId;

  return staffList.filter((member) => {
    // 1. Status scope filter
    if (statusFilter !== 'all' && member.status !== statusFilter) {
      return false;
    }

    // 2. Staff type filter
    if (
      staffTypeFilter &&
      staffTypeFilter !== 'all' &&
      member.staff_type.toLowerCase() !== staffTypeFilter.toLowerCase()
    ) {
      return false;
    }

    // 3. System role filter
    if (
      systemRoleFilter &&
      systemRoleFilter !== 'all' &&
      member.system_role.toLowerCase() !== systemRoleFilter.toLowerCase()
    ) {
      return false;
    }

    // 4. Capability filter
    if (capabilityFilter && capabilityFilter !== 'all') {
      const hasCap = member.services.some(
        (s) => s.service_id === capabilityFilter,
      );
      if (!hasCap) return false;
    }

    // 5. Search query filter
    if (query) {
      const matchName = member.full_name.toLowerCase().includes(query);
      const matchNickname =
        member.nickname?.toLowerCase().includes(query) ?? false;
      const matchPhone = member.phone?.toLowerCase().includes(query) ?? false;
      const matchRole = member.system_role.toLowerCase().includes(query);
      const matchType = member.staff_type.toLowerCase().includes(query);
      const matchService = member.services.some((s) =>
        s.service_name.toLowerCase().includes(query),
      );

      if (
        !matchName &&
        !matchNickname &&
        !matchPhone &&
        !matchRole &&
        !matchType &&
        !matchService
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Type guard for StaffMember.
 */
export function isStaffMember(item: unknown): item is StaffMember {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.branch_id === 'string' &&
    typeof obj.full_name === 'string' &&
    typeof obj.status === 'string' &&
    (obj.status === 'active' ||
      obj.status === 'awaiting' ||
      obj.status === 'invited') &&
    Array.isArray(obj.services)
  );
}

/**
 * Classifies query errors into user-friendly codes and messages.
 */
export function classifyStaffError(err: unknown): {
  code: string;
  message: string;
} {
  if (!err) {
    return {
      code: 'UNKNOWN_ERROR',
      message:
        'Failed to load staff roster. Please check your connection and try again.',
    };
  }

  const errorObj = err as Record<string, unknown>;
  const code = String(errorObj.code || '');
  const status = Number(errorObj.status || 0);
  const message = String(errorObj.message || '').toLowerCase();

  if (
    code === '42501' ||
    message.includes('permission denied') ||
    message.includes('policy') ||
    message.includes('not authorized')
  ) {
    return {
      code: 'PERMISSION_DENIED',
      message: 'You do not have permission to view staff for this branch.',
    };
  }

  if (
    code === 'PGRST301' ||
    status === 401 ||
    message.includes('jwt expired') ||
    message.includes('session expired') ||
    message.includes('invalid claim')
  ) {
    return {
      code: 'SESSION_EXPIRED',
      message:
        'Your session has expired. Sign in again to view the staff roster.',
    };
  }

  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('abort')
  ) {
    return {
      code: 'NETWORK_ERROR',
      message:
        'Failed to load staff roster. Please check your connection and try again.',
    };
  }

  return {
    code: code || 'QUERY_FAILED',
    message:
      'Failed to load staff roster. Please check your connection and try again.',
  };
}

/**
 * Fetches the authoritative branch Staff roster and minimized service capabilities.
 * Validates payload structure and derives operational statuses and KPIs.
 */
export async function fetchBranchStaff(
  branchId: string,
  client?: SupabaseClient,
): Promise<FetchStaffResult> {
  if (!branchId || typeof branchId !== 'string' || !branchId.trim()) {
    return {
      ok: false,
      code: 'INVALID_BRANCH',
      message: 'Branch identifier is missing.',
    };
  }

  try {
    const supabase = client ?? getSupabaseClient();
    const { data, error } = await supabase
      .from('staff')
      .select(STAFF_SELECT)
      .eq('branch_id', branchId.trim())
      .order('full_name', { ascending: true });

    if (error) {
      const classified = classifyStaffError(error);
      return {
        ok: false,
        code: classified.code,
        message: classified.message,
      };
    }

    if (!Array.isArray(data)) {
      return {
        ok: false,
        code: 'INVALID_PAYLOAD',
        message: 'Staff service returned an invalid data payload.',
      };
    }

    const roster: StaffMember[] = [];
    for (const row of data) {
      const normalized = normalizeStaffMember(row, branchId.trim());
      if (!normalized) {
        return {
          ok: false,
          code: 'INVALID_PAYLOAD',
          message: 'Staff service returned an invalid data payload.',
        };
      }
      roster.push(normalized);
    }

    const kpis = calculateStaffKpis(roster);

    return {
      ok: true,
      data: roster,
      kpis,
    };
  } catch (err: unknown) {
    const classified = classifyStaffError(err);
    return {
      ok: false,
      code: classified.code,
      message: classified.message,
    };
  }
}

/** Branch-scoped assignment choices; a failed read never becomes an empty catalogue. */
export async function fetchBranchAssignableServices(
  branchId: string,
  client?: SupabaseClient,
): Promise<FetchBranchServicesResult> {
  if (!branchId?.trim())
    return {
      ok: false,
      code: 'INVALID_BRANCH',
      message: 'Branch identifier is missing.',
    };
  const invalid = {
    ok: false as const,
    code: 'INVALID_PAYLOAD',
    message:
      'Service assignments could not be verified for this branch. Reload the Staff workspace.',
  };
  try {
    const supabase = client ?? getSupabaseClient();
    const { data, error } = await supabase
      .from('branch_services')
      .select(
        'branch_id, service_id, is_active, available_in_spa, available_home_service, services (id, name, is_active, duration_minutes, service_categories (name))',
      )
      .eq('branch_id', branchId.trim())
      .eq('is_active', true);
    if (error) return staffDependencyError(error, 'Service assignments');
    if (!Array.isArray(data)) return invalid;
    const candidates: Array<{
      option: BranchServiceOption;
      inSpa: boolean;
      home: boolean;
    }> = [];
    for (const row of data) {
      if (
        !isRecord(row) ||
        row.branch_id !== branchId.trim() ||
        typeof row.service_id !== 'string' ||
        !row.service_id.trim() ||
        typeof row.is_active !== 'boolean' ||
        typeof row.available_in_spa !== 'boolean' ||
        typeof row.available_home_service !== 'boolean'
      )
        return invalid;
      const service = Array.isArray(row.services)
        ? row.services.length === 1
          ? row.services[0]
          : null
        : row.services;
      if (
        !isRecord(service) ||
        service.id !== row.service_id ||
        typeof service.name !== 'string' ||
        !service.name.trim() ||
        typeof service.is_active !== 'boolean' ||
        (service.duration_minutes !== null &&
          (typeof service.duration_minutes !== 'number' ||
            !Number.isFinite(service.duration_minutes)))
      )
        return invalid;
      if (!row.is_active || !service.is_active) continue;
      const category = Array.isArray(service.service_categories)
        ? service.service_categories[0]
        : service.service_categories;
      candidates.push({
        option: {
          id: row.service_id,
          name: service.name.trim(),
          category:
            isRecord(category) && typeof category.name === 'string'
              ? category.name
              : null,
          duration_minutes: service.duration_minutes as number | null,
        },
        inSpa: row.available_in_spa,
        home: row.available_home_service,
      });
    }
    let homeEnabled = false;
    if (candidates.some((item) => !item.inSpa && item.home)) {
      const rules = await supabase
        .from('branch_booking_rules')
        .select('branch_id, home_service_enabled')
        .eq('branch_id', branchId.trim())
        .maybeSingle();
      if (rules.error)
        return staffDependencyError(rules.error, 'Branch Home Service rules');
      // Missing rules are unverified in this client read; never assume an enabled mode.
      if (
        !isRecord(rules.data) ||
        rules.data.branch_id !== branchId.trim() ||
        typeof rules.data.home_service_enabled !== 'boolean'
      )
        return invalid;
      homeEnabled = rules.data.home_service_enabled;
    }
    const options = new Map<string, BranchServiceOption>();
    for (const item of candidates) {
      if (item.inSpa || (homeEnabled && item.home))
        options.set(item.option.id, item.option);
    }
    return {
      ok: true,
      data: [...options.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (error) {
    return staffDependencyError(error, 'Service assignments');
  }
}

function staffDependencyError(
  error: unknown,
  subject: string,
): { ok: false; code: string; message: string } {
  const classified = classifyStaffError(error);
  return {
    ok: false,
    code: classified.code,
    message: `${subject} could not be loaded for this branch. Reload the Staff workspace or sign in again if your session has expired.`,
  };
}

/** Branch applications: failed or malformed reads remain failures. */
export async function fetchBranchOnboardingRequests(
  branchId: string,
  client?: SupabaseClient,
): Promise<FetchOnboardingRequestsResult> {
  if (!branchId?.trim())
    return {
      ok: false,
      code: 'INVALID_BRANCH',
      message: 'Branch identifier is missing.',
    };
  const invalid = {
    ok: false as const,
    code: 'INVALID_PAYLOAD',
    message:
      'Applications returned invalid data for this branch. Reload the Staff workspace.',
  };
  try {
    const supabase = client ?? getSupabaseClient();
    const { data, error } = await supabase
      .from('staff_onboarding_requests')
      .select('*')
      .eq('requested_branch_id', branchId.trim())
      .order('created_at', { ascending: false });
    if (error) return staffDependencyError(error, 'Applications');
    if (!Array.isArray(data)) return invalid;
    const requests: StaffOnboardingRequest[] = [];
    for (const row of data) {
      if (
        !isRecord(row) ||
        typeof row.id !== 'string' ||
        !row.id.trim() ||
        row.requested_branch_id !== branchId.trim() ||
        typeof row.full_name !== 'string' ||
        !row.full_name.trim() ||
        typeof row.email !== 'string' ||
        (row.phone !== null && typeof row.phone !== 'string') ||
        (row.preferred_role !== null &&
          typeof row.preferred_role !== 'string') ||
        typeof row.created_at !== 'string' ||
        !row.created_at.trim() ||
        typeof row.status !== 'string' ||
        !['submitted', 'under_review', 'approved', 'rejected'].includes(
          row.status,
        )
      )
        return invalid;
      for (const field of [
        'staff_id',
        'reviewed_at',
        'reviewed_by_staff_id',
        'rejection_reason',
      ]) {
        if (row[field] != null && typeof row[field] !== 'string')
          return invalid;
      }
      if (row.metadata != null && !isRecord(row.metadata)) return invalid;
      requests.push({
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone ?? '',
        preferred_role: row.preferred_role ?? '',
        experience_years:
          typeof row.experience_years === 'number'
            ? row.experience_years
            : null,
        requested_branch_id: row.requested_branch_id as string,
        status: row.status as StaffOnboardingRequest['status'],
        staff_id: row.staff_id as string | null | undefined,
        created_at: row.created_at,
        reviewed_at: row.reviewed_at as string | null | undefined,
        reviewed_by_staff_id: row.reviewed_by_staff_id as
          string | null | undefined,
        rejection_reason: row.rejection_reason as string | null | undefined,
        metadata: row.metadata as Record<string, unknown> | null | undefined,
      });
    }
    return { ok: true, data: requests };
  } catch (error) {
    return staffDependencyError(error, 'Applications');
  }
}

/**
 * Fetches schedule overrides and blocked times for a specific 7-day week window.
 */
export async function fetchBranchScheduleWeek(
  _branchId: string,
  startDate: string,
  client?: SupabaseClient,
): Promise<{
  overrides: StaffScheduleOverride[];
  blockedTimes: StaffBlockedTime[];
}> {
  const supabase = client ?? getSupabaseClient();

  // Compute end date (6 days after start date)
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endDate = end.toISOString().slice(0, 10);

  const [overridesRes, blocksRes] = await Promise.all([
    supabase
      .from('schedule_overrides')
      .select('*')
      .gte('override_date', startDate)
      .lte('override_date', endDate),
    supabase
      .from('blocked_times')
      .select('*')
      .gte('block_date', startDate)
      .lte('block_date', endDate),
  ]);

  const overrides: StaffScheduleOverride[] = Array.isArray(overridesRes.data)
    ? overridesRes.data.map((r) => ({
        id: r.id ? String(r.id) : undefined,
        staff_id: String(r.staff_id),
        override_date: String(r.override_date),
        is_day_off: Boolean(r.is_day_off),
        start_time: r.start_time ? String(r.start_time) : null,
        end_time: r.end_time ? String(r.end_time) : null,
        reason: r.reason ? String(r.reason) : null,
      }))
    : [];

  const blockedTimes: StaffBlockedTime[] = Array.isArray(blocksRes.data)
    ? blocksRes.data.map((r) => ({
        id: String(r.id),
        staff_id: String(r.staff_id),
        block_date: String(r.block_date),
        start_time: String(r.start_time || ''),
        end_time: String(r.end_time || ''),
        reason: String(r.reason || 'other'),
      }))
    : [];

  return { overrides, blockedTimes };
}

type StaffMutationData = { staff: Record<string, unknown> };
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isStaffMutationData(data: unknown): data is StaffMutationData {
  return (
    isRecord(data) &&
    isRecord(data.staff) &&
    typeof data.staff.id === 'string' &&
    data.staff.id.length > 0
  );
}
function invalidStaffInput(error: string): {
  ok: false;
  code: string;
  error: string;
} {
  return { ok: false, code: 'INVALID_INPUT', error };
}

/** Native hosted boundary. Only the bearer token conveys caller identity. */
async function staffHostedMutation<T>(
  path: string,
  method: 'POST' | 'PATCH',
  body: Record<string, unknown>,
  validator: (data: unknown) => data is T,
  message: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<HostedMutationResult<T>> {
  const baseUrl = getHostedApiBaseUrl();
  if (!baseUrl)
    return {
      ok: false,
      code: 'API_CONFIG_REQUIRED',
      error: 'Staff service is not configured for this desktop installation.',
    };
  let supabase: SupabaseClient;
  try {
    supabase = client ?? getSupabaseClient();
  } catch {
    return {
      ok: false,
      code: 'API_CONFIG_REQUIRED',
      error:
        'Staff service is not configured. Sign in again after checking configuration.',
    };
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token)
      return {
        ok: false,
        code: 'AUTH_SESSION_REQUIRED',
        error: 'Your session has expired. Sign in again to update staff.',
      };
    const response = await (customFetch ?? tauriFetch)(
      `${baseUrl}/api/desktop/v1/staff/${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify(body),
      },
    );
    const parsed = await readHostedJsonResponse<{ ok: true; data: T }>(
      response,
      {
        serviceName: 'Staff service',
        validator: (value): value is { ok: true; data: T } =>
          isRecord(value) && value.ok === true && validator(value.data),
      },
    );
    if (!parsed.ok)
      return { ok: false, code: parsed.code, error: parsed.message };
    return { ok: true, data: parsed.data.data, message };
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      error:
        'Updating staff requires a connection. Please check your network and try again.',
    };
  }
}

/** Profile input contains no branch, role, email, or lifecycle authority. */
export async function updateStaffProfile(
  input: UpdateStaffProfileInput,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<HostedMutationResult<StaffMutationData>> {
  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 100)
    return invalidStaffInput('Full name must be 2–100 characters.');
  if ((input.nickname?.trim().length ?? 0) > 80)
    return invalidStaffInput('Nickname must be 80 characters or fewer.');
  if (
    input.phone !== undefined &&
    (input.phone === null ||
      input.phone.trim().length < 7 ||
      input.phone.trim().length > 20)
  )
    return invalidStaffInput(
      'Phone must be 7–20 characters. Clearing a saved phone is not supported.',
    );
  if (
    !STAFF_TIERS.some((tier) => tier === input.tier) ||
    !STAFF_TYPES.some((type) => type === input.staffType)
  )
    return invalidStaffInput('Choose a supported skill tier and staff type.');
  return staffHostedMutation(
    encodeURIComponent(input.staffId),
    'PATCH',
    {
      fullName,
      nickname: input.nickname?.trim() || null,
      phone: input.phone?.trim(),
      tier: input.tier,
      staffType: input.staffType,
      isHead: input.isHead,
    },
    isStaffMutationData,
    'Staff profile updated successfully.',
    client,
    customFetch,
  );
}

/**
 * Replaces a staff member's service capabilities using the authoritative RPC.
 */
export async function updateStaffCapabilities(
  staffId: string,
  serviceIds: string[],
  client?: SupabaseClient,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const supabase = client ?? getSupabaseClient();
  const uniqueIds = Array.from(new Set(serviceIds));

  const { error } = await supabase.rpc('replace_staff_service_capabilities', {
    p_target_staff_id: staffId,
    p_service_ids: uniqueIds,
  });

  if (error) {
    return {
      ok: false,
      error:
        error.message ||
        'Failed to save capabilities. Please verify permissions.',
    };
  }

  return {
    ok: true,
    message: `Capabilities updated (${uniqueIds.length} assigned).`,
  };
}

/**
 * Adjusts a staff schedule (working hours, day off, blocked time, clear override/block).
 */
export async function adjustStaffSchedule(
  input: StaffScheduleAdjustmentInput,
  client?: SupabaseClient,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const supabase = client ?? getSupabaseClient();

  if (input.adjustmentType === 'working_hours') {
    if (!input.startTime || !input.endTime) {
      return { ok: false, error: 'Start and end time are required.' };
    }
    if (input.startTime >= input.endTime) {
      return { ok: false, error: 'Start time must be before end time.' };
    }

    const { error } = await supabase.from('schedule_overrides').upsert(
      {
        staff_id: input.staffId,
        override_date: input.date,
        is_day_off: false,
        start_time: input.startTime,
        end_time: input.endTime,
        reason: input.reason?.trim() || null,
      },
      { onConflict: 'staff_id,override_date' },
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true, message: 'Custom working hours saved.' };
  }

  if (input.adjustmentType === 'day_off') {
    const { error } = await supabase.from('schedule_overrides').upsert(
      {
        staff_id: input.staffId,
        override_date: input.date,
        is_day_off: true,
        start_time: null,
        end_time: null,
        reason: input.reason?.trim() || null,
      },
      { onConflict: 'staff_id,override_date' },
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true, message: 'Day off recorded for staff member.' };
  }

  if (input.adjustmentType === 'blocked_time') {
    if (!input.startTime || !input.endTime) {
      return {
        ok: false,
        error: 'Start and end time are required for blocked time.',
      };
    }
    if (input.startTime >= input.endTime) {
      return { ok: false, error: 'Start time must be before end time.' };
    }

    const { error } = await supabase.from('blocked_times').insert({
      staff_id: input.staffId,
      block_date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      reason: input.reason?.trim() || 'Blocked time',
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, message: 'Blocked time added.' };
  }

  if (input.adjustmentType === 'remove_override') {
    const { error } = await supabase
      .from('schedule_overrides')
      .delete()
      .eq('staff_id', input.staffId)
      .eq('override_date', input.date);

    if (error) return { ok: false, error: error.message };
    return { ok: true, message: 'Schedule override removed.' };
  }

  if (input.adjustmentType === 'remove_block') {
    if (!input.blockId) {
      return { ok: false, error: 'Select a block to remove.' };
    }
    const { error } = await supabase
      .from('blocked_times')
      .delete()
      .eq('id', input.blockId)
      .eq('staff_id', input.staffId);

    if (error) return { ok: false, error: error.message };
    return { ok: true, message: 'Blocked time removed.' };
  }

  return { ok: false, error: 'Invalid adjustment type.' };
}

/** Reviews onboarding entirely through server-owned authorization and compensation. */
export async function reviewOnboardingRequest(
  input: ReviewOnboardingInput,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<HostedMutationResult<Record<string, unknown>>> {
  const path = `onboarding/${encodeURIComponent(input.requestId)}`;
  if (input.action === 'approve') {
    if (
      !input.branchId ||
      !STAFF_ROLE_OPTIONS.some((role) => role.value === input.systemRole) ||
      !STAFF_TIERS.some((tier) => tier === input.tier)
    )
      return invalidStaffInput(
        'Choose a branch, supported system role and skill tier.',
      );
    return staffHostedMutation(
      `${path}/approve`,
      'POST',
      {
        branchId: input.branchId,
        systemRole: input.systemRole,
        tier: input.tier,
        serviceIds: input.serviceIds
          ? [...new Set(input.serviceIds)]
          : undefined,
      },
      (data): data is Record<string, unknown> =>
        isRecord(data) &&
        typeof data.staffId === 'string' &&
        data.staffId.length > 0 &&
        typeof data.branchId === 'string' &&
        typeof data.systemRole === 'string',
      'Application approved successfully.',
      client,
      customFetch,
    );
  }
  if (input.action === 'reject') {
    if ((input.rejectionReason?.length ?? 0) > 500)
      return invalidStaffInput(
        'Rejection reason must be 500 characters or fewer.',
      );
    return staffHostedMutation(
      `${path}/reject`,
      'POST',
      { rejectionReason: input.rejectionReason?.trim() || undefined },
      (data): data is Record<string, unknown> =>
        isRecord(data) &&
        typeof data.requestId === 'string' &&
        (data.staffId === null || typeof data.staffId === 'string'),
      'Application rejected.',
      client,
      customFetch,
    );
  }
  return invalidStaffInput('Invalid review action.');
}

export async function updateStaffSystemRole(
  staffId: string,
  newRole: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<HostedMutationResult<StaffMutationData>> {
  if (!STAFF_ROLE_OPTIONS.some((role) => role.value === newRole))
    return invalidStaffInput('Choose a supported system role.');
  return staffHostedMutation(
    `${encodeURIComponent(staffId)}/role`,
    'POST',
    { systemRole: newRole },
    isStaffMutationData,
    'System role updated successfully.',
    client,
    customFetch,
  );
}

export async function deactivateStaff(
  staffId: string,
  client?: SupabaseClient,
  customFetch?: typeof fetch,
): Promise<HostedMutationResult<StaffMutationData>> {
  return staffHostedMutation(
    `${encodeURIComponent(staffId)}/deactivate`,
    'POST',
    {},
    (data): data is StaffMutationData =>
      isStaffMutationData(data) && data.staff.is_active === false,
    'Staff access deactivated. The staff record is retained.',
    client,
    customFetch,
  );
}
