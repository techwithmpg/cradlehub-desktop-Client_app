import type { CanonicalRole } from '../types/auth';

export const STAFF_ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'assistant_manager', label: 'Assistant Manager' },
  { value: 'store_manager', label: 'Store Manager' },
  { value: 'crm', label: 'Front Desk (CRM)' },
  { value: 'staff', label: 'Staff' },
  { value: 'service_head', label: 'Service Head' },
  { value: 'service_staff', label: 'Service Staff' },
  { value: 'digital_marketer', label: 'Digital Marketer' },
  { value: 'driver', label: 'Driver' },
  { value: 'utility', label: 'Utility' },
] as const;

/** UX choices only; the hosted server resolves and authorizes the actor. */
export function getAssignableStaffRoles(actorRole: string) {
  const role = canonicalizeRole(actorRole);
  if (role === 'owner') return [...STAFF_ROLE_OPTIONS];
  if (!isRoleEligibleForCrm(role)) return [];
  return STAFF_ROLE_OPTIONS.filter(
    (option) =>
      !['owner', 'manager', 'assistant_manager', 'store_manager'].includes(
        option.value,
      ) &&
      (role !== 'crm' || option.value !== 'digital_marketer'),
  );
}

/**
 * Canonicalizes an authoritative staff system_role string into an authoritative CanonicalRole.
 * Follows the hosted Cradlehub system_role canonicalization rules:
 * - 'crm', 'csr', 'csr_head', 'csr_staff' -> 'crm' (Front Desk)
 * - 'owner' -> 'owner'
 * - 'manager' -> 'manager'
 * - 'assistant_manager' -> 'assistant_manager'
 * - 'store_manager' -> 'store_manager'
 * - all other roles -> 'unknown'
 */
export function canonicalizeRole(
  systemRole: string | null | undefined,
): CanonicalRole {
  if (!systemRole) return 'unknown';

  const normalized = systemRole.trim().toLowerCase();

  switch (normalized) {
    case 'crm':
    case 'csr':
    case 'csr_head':
    case 'csr_staff':
      return 'crm';
    case 'owner':
      return 'owner';
    case 'manager':
      return 'manager';
    case 'assistant_manager':
      return 'assistant_manager';
    case 'store_manager':
      return 'store_manager';
    default:
      return 'unknown';
  }
}

/**
 * Checks whether a canonical role is eligible for CRM workspace access.
 * CRM-eligible roles: crm, owner, manager, assistant_manager, store_manager.
 */
export function isRoleEligibleForCrm(role: CanonicalRole): boolean {
  return (
    role === 'crm' ||
    role === 'owner' ||
    role === 'manager' ||
    role === 'assistant_manager' ||
    role === 'store_manager'
  );
}

/**
 * Returns a user-friendly label for a canonical role.
 */
export function formatRoleLabel(
  role: CanonicalRole,
  rawSystemRole?: string,
): string {
  switch (role) {
    case 'crm':
      return 'Front Desk (CRM)';
    case 'owner':
      return 'Owner';
    case 'manager':
      return 'Manager';
    case 'assistant_manager':
      return 'Assistant Manager';
    case 'store_manager':
      return 'Store Manager';
    case 'unknown':
    default:
      return rawSystemRole ? `Staff (${rawSystemRole})` : 'Unknown Role';
  }
}
