import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import type {
  BranchServiceOption,
  FetchStaffResult,
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

/**
 * Fetches active services eligible for staff assignment in the branch.
 */
export async function fetchBranchAssignableServices(
  branchId: string,
  client?: SupabaseClient,
): Promise<BranchServiceOption[]> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase
    .from('services')
    .select('id, name, category, duration_minutes')
    .eq('branch_id', branchId.trim())
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error || !Array.isArray(data)) {
    // If services by branch_id returns empty or table doesn't have branch_id, query general active services
    const fallback = await supabase
      .from('services')
      .select('id, name, category, duration_minutes')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (!fallback.error && Array.isArray(fallback.data)) {
      return fallback.data.map((s) => ({
        id: String(s.id),
        name: String(s.name),
        category: s.category ? String(s.category) : null,
        duration_minutes:
          typeof s.duration_minutes === 'number' ? s.duration_minutes : null,
      }));
    }
    return [];
  }

  return data.map((s) => ({
    id: String(s.id),
    name: String(s.name),
    category: s.category ? String(s.category) : null,
    duration_minutes:
      typeof s.duration_minutes === 'number' ? s.duration_minutes : null,
  }));
}

/**
 * Fetches branch staff onboarding applications.
 */
export async function fetchBranchOnboardingRequests(
  branchId: string,
  client?: SupabaseClient,
): Promise<StaffOnboardingRequest[]> {
  const supabase = client ?? getSupabaseClient();
  const { data, error } = await supabase
    .from('staff_onboarding_requests')
    .select('*')
    .eq('requested_branch_id', branchId.trim())
    .order('created_at', { ascending: false });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((row) => ({
    id: String(row.id),
    full_name: String(row.full_name || ''),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    preferred_role: String(row.preferred_role || ''),
    experience_years:
      typeof row.experience_years === 'number' ? row.experience_years : null,
    requested_branch_id: String(row.requested_branch_id),
    status: row.status as StaffOnboardingRequest['status'],
    staff_id: row.staff_id ? String(row.staff_id) : null,
    created_at: String(row.created_at || ''),
    reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    reviewed_by_staff_id: row.reviewed_by_staff_id
      ? String(row.reviewed_by_staff_id)
      : null,
    rejection_reason: row.rejection_reason
      ? String(row.rejection_reason)
      : null,
    metadata:
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : null,
  }));
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

/**
 * Updates a staff member's profile attributes under RLS.
 */
export async function updateStaffProfile(
  input: UpdateStaffProfileInput,
  client?: SupabaseClient,
): Promise<
  { ok: true; staff: Partial<StaffMember> } | { ok: false; error: string }
> {
  if (!input.fullName.trim()) {
    return { ok: false, error: 'Full name is required.' };
  }

  const supabase = client ?? getSupabaseClient();
  const updatePayload = {
    full_name: input.fullName.trim(),
    nickname: input.nickname?.trim() || null,
    phone: input.phone?.trim() || null,
    staff_type: input.staffType.trim(),
    tier: input.tier.trim(),
    is_head: input.isHead,
  };

  const { data, error } = await supabase
    .from('staff')
    .update(updatePayload)
    .eq('id', input.staffId)
    .select(
      'id, full_name, nickname, phone, staff_type, tier, is_head, updated_at',
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      error: 'Failed to update profile. The record may be inaccessible.',
    };
  }

  return { ok: true, staff: data[0] as Partial<StaffMember> };
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

/**
 * Reviews a staff onboarding request (approve or reject).
 */
export async function reviewOnboardingRequest(
  input: ReviewOnboardingInput,
  client?: SupabaseClient,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const supabase = client ?? getSupabaseClient();
  const now = new Date().toISOString();

  if (input.action === 'approve') {
    // 1. Update onboarding request status
    const { error: reqErr } = await supabase
      .from('staff_onboarding_requests')
      .update({
        status: 'approved',
        reviewed_at: now,
      })
      .eq('id', input.requestId);

    if (reqErr) return { ok: false, error: reqErr.message };

    // 2. If staffId is present, update staff record
    if (input.staffId) {
      const updatePayload: Record<string, unknown> = {
        is_active: true,
      };
      if (input.branchId) updatePayload.branch_id = input.branchId;
      if (input.systemRole) updatePayload.system_role = input.systemRole;
      if (input.staffType) updatePayload.staff_type = input.staffType;
      if (input.tier) updatePayload.tier = input.tier;

      const { error: staffErr } = await supabase
        .from('staff')
        .update(updatePayload)
        .eq('id', input.staffId);

      if (staffErr) return { ok: false, error: staffErr.message };

      if (input.serviceIds) {
        await updateStaffCapabilities(
          input.staffId,
          input.serviceIds,
          supabase,
        );
      }
    }

    return { ok: true, message: 'Application approved successfully.' };
  }

  if (input.action === 'reject') {
    const { error: reqErr } = await supabase
      .from('staff_onboarding_requests')
      .update({
        status: 'rejected',
        reviewed_at: now,
        rejection_reason: input.rejectionReason?.trim() || null,
      })
      .eq('id', input.requestId);

    if (reqErr) return { ok: false, error: reqErr.message };
    return { ok: true, message: 'Application rejected.' };
  }

  return { ok: false, error: 'Invalid review action.' };
}

/**
 * Updates a staff member's system access role under RLS.
 */
export async function updateStaffSystemRole(
  staffId: string,
  newRole: string,
  client?: SupabaseClient,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  if (!newRole.trim()) {
    return { ok: false, error: 'Role is required.' };
  }
  const supabase = client ?? getSupabaseClient();
  const { error } = await supabase
    .from('staff')
    .update({ system_role: newRole.trim() })
    .eq('id', staffId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, message: `System role updated to ${newRole}.` };
}
