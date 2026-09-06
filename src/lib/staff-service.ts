import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import type {
  FetchStaffResult,
  StaffKpiSummary,
  StaffMember,
  StaffServiceCapability,
  StaffStatus,
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

interface RawStaffServiceRow {
  service_id: string;
  services:
    { id: string; name: string } | Array<{ id: string; name: string }> | null;
}

interface RawStaffRow {
  id: string;
  branch_id: string;
  auth_user_id: string | null;
  full_name: string;
  nickname: string | null;
  phone: string | null;
  avatar_url: string | null;
  tier: string | null;
  system_role: string | null;
  staff_type: string | null;
  is_head: boolean | null;
  is_active: boolean | null;
  is_cross_branch: boolean | null;
  created_at: string;
  updated_at?: string;
  staff_services?: RawStaffServiceRow[] | null;
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

/**
 * Normalizes raw database capabilities into minimized service records.
 */
function extractCapabilities(
  rawServices: RawStaffServiceRow[] | null | undefined,
): StaffServiceCapability[] {
  if (!Array.isArray(rawServices)) return [];

  const capabilities: StaffServiceCapability[] = [];
  for (const item of rawServices) {
    if (!item || typeof item !== 'object') continue;
    const serviceId = item.service_id;
    let serviceName = '';

    if (item.services) {
      if (Array.isArray(item.services)) {
        serviceName = item.services[0]?.name || '';
      } else if (typeof item.services === 'object') {
        serviceName = item.services.name || '';
      }
    }

    if (serviceId) {
      capabilities.push({
        service_id: serviceId,
        service_name: serviceName || 'Unnamed Service',
      });
    }
  }

  return capabilities;
}

/**
 * Validates and transforms a raw staff row into a typed StaffMember.
 * Returns null if the row fails essential contract validation.
 */
export function normalizeStaffMember(row: unknown): StaffMember | null {
  if (typeof row !== 'object' || row === null) return null;
  const obj = row as Partial<RawStaffRow>;

  if (
    typeof obj.id !== 'string' ||
    !obj.id ||
    typeof obj.branch_id !== 'string' ||
    typeof obj.full_name !== 'string' ||
    typeof obj.created_at !== 'string'
  ) {
    return null;
  }

  const isActive = Boolean(obj.is_active);
  const status = deriveStaffStatus({
    is_active: isActive,
    auth_user_id: obj.auth_user_id,
    full_name: obj.full_name,
  });

  const services = extractCapabilities(obj.staff_services);

  return {
    id: obj.id,
    branch_id: obj.branch_id,
    auth_user_id: obj.auth_user_id || null,
    full_name: obj.full_name,
    nickname: obj.nickname || null,
    phone: obj.phone || null,
    avatar_url: obj.avatar_url || null,
    tier: obj.tier || 'mid',
    system_role: obj.system_role || 'staff',
    staff_type: obj.staff_type || 'therapist',
    is_head: Boolean(obj.is_head),
    is_active: isActive,
    is_cross_branch: Boolean(obj.is_cross_branch),
    created_at: obj.created_at,
    updated_at: obj.updated_at,
    status,
    services,
  };
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
  if (!branchId) {
    return {
      ok: false,
      code: 'INVALID_BRANCH',
      message: 'Branch identifier is missing.',
    };
  }

  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('staff')
      .select(STAFF_SELECT)
      .eq('branch_id', branchId)
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
      const normalized = normalizeStaffMember(row);
      if (!normalized) {
        return {
          ok: false,
          code: 'CORRUPTED_ROW',
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
