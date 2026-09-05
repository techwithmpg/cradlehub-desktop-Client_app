import type { CanonicalRole } from '../types/auth';

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
