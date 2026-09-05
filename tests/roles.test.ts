import { describe, expect, it } from 'vitest';
import {
  canonicalizeRole,
  isRoleEligibleForCrm,
  formatRoleLabel,
} from '../src/lib/roles';

describe('Roles canonicalization and CRM eligibility', () => {
  it('canonicalizes Front Desk role aliases to crm', () => {
    expect(canonicalizeRole('crm')).toBe('crm');
    expect(canonicalizeRole('csr')).toBe('crm');
    expect(canonicalizeRole('csr_head')).toBe('crm');
    expect(canonicalizeRole('csr_staff')).toBe('crm');
    expect(canonicalizeRole('  CSR  ')).toBe('crm');
    expect(canonicalizeRole('CRM')).toBe('crm');
  });

  it('canonicalizes management roles correctly', () => {
    expect(canonicalizeRole('owner')).toBe('owner');
    expect(canonicalizeRole('manager')).toBe('manager');
    expect(canonicalizeRole('assistant_manager')).toBe('assistant_manager');
    expect(canonicalizeRole('store_manager')).toBe('store_manager');
  });

  it('returns unknown for unassigned or non-CRM roles', () => {
    expect(canonicalizeRole('therapist')).toBe('unknown');
    expect(canonicalizeRole('driver')).toBe('unknown');
    expect(canonicalizeRole('cleaner')).toBe('unknown');
    expect(canonicalizeRole('guest')).toBe('unknown');
    expect(canonicalizeRole('')).toBe('unknown');
    expect(canonicalizeRole(null)).toBe('unknown');
    expect(canonicalizeRole(undefined)).toBe('unknown');
  });

  it('verifies CRM workspace eligibility strictly', () => {
    expect(isRoleEligibleForCrm('crm')).toBe(true);
    expect(isRoleEligibleForCrm('owner')).toBe(true);
    expect(isRoleEligibleForCrm('manager')).toBe(true);
    expect(isRoleEligibleForCrm('assistant_manager')).toBe(true);
    expect(isRoleEligibleForCrm('store_manager')).toBe(true);

    expect(isRoleEligibleForCrm('unknown')).toBe(false);
  });

  it('formats role labels appropriately', () => {
    expect(formatRoleLabel('crm')).toBe('Front Desk (CRM)');
    expect(formatRoleLabel('owner')).toBe('Owner');
    expect(formatRoleLabel('manager')).toBe('Manager');
    expect(formatRoleLabel('assistant_manager')).toBe('Assistant Manager');
    expect(formatRoleLabel('store_manager')).toBe('Store Manager');
    expect(formatRoleLabel('unknown', 'therapist')).toBe('Staff (therapist)');
    expect(formatRoleLabel('unknown')).toBe('Unknown Role');
  });
});
