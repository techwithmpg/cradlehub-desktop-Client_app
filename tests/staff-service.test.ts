import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  calculateStaffKpis,
  classifyStaffError,
  deriveStaffStatus,
  fetchBranchStaff,
  isStaffMember,
  normalizeStaffMember,
} from '../src/lib/staff-service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StaffMember } from '../src/types/staff';

describe('staff-service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Status Derivation Contract', () => {
    it('derives active when is_active is true', () => {
      expect(
        deriveStaffStatus({
          is_active: true,
          auth_user_id: 'auth-user-1',
          full_name: 'Maria Santos',
        }),
      ).toBe('active');

      expect(
        deriveStaffStatus({
          is_active: true,
          auth_user_id: null,
          full_name: 'Maria Santos',
        }),
      ).toBe('active');
    });

    it('derives invited when is_active is false and auth_user_id is null', () => {
      expect(
        deriveStaffStatus({
          is_active: false,
          auth_user_id: null,
          full_name: 'Pending Staff',
        }),
      ).toBe('invited');
    });

    it('derives invited when full_name is "Pending invitation" regardless of auth_user_id', () => {
      expect(
        deriveStaffStatus({
          is_active: false,
          auth_user_id: 'auth-user-2',
          full_name: 'Pending invitation',
        }),
      ).toBe('invited');

      expect(
        deriveStaffStatus({
          is_active: false,
          auth_user_id: 'auth-user-2',
          full_name: 'PENDING INVITATION',
        }),
      ).toBe('invited');
    });

    it('derives awaiting when is_active is false, auth_user_id exists, and name is not pending invitation', () => {
      expect(
        deriveStaffStatus({
          is_active: false,
          auth_user_id: 'auth-user-3',
          full_name: 'Juan Dela Cruz',
        }),
      ).toBe('awaiting');
    });

    it('never emits inactive', () => {
      const statuses = [
        deriveStaffStatus({ is_active: true, full_name: 'A' }),
        deriveStaffStatus({
          is_active: false,
          full_name: 'B',
          auth_user_id: null,
        }),
        deriveStaffStatus({
          is_active: false,
          full_name: 'C',
          auth_user_id: 'u-1',
        }),
      ];
      expect(statuses).not.toContain('inactive');
      expect(statuses).toEqual(['active', 'invited', 'awaiting']);
    });
  });

  describe('KPI Calculation', () => {
    it('calculates deterministic summary metrics 1:1 with roster statuses', () => {
      const mockRoster: StaffMember[] = [
        {
          id: 's-1',
          branch_id: 'b-1',
          auth_user_id: 'u-1',
          full_name: 'Staff One',
          nickname: 'One',
          phone: '09171111111',
          avatar_url: null,
          tier: 'senior',
          system_role: 'crm',
          staff_type: 'therapist',
          is_head: true,
          is_active: true,
          is_cross_branch: false,
          created_at: '2026-01-01T00:00:00Z',
          status: 'active',
          services: [{ service_id: 'srv-1', service_name: 'Swedish Massage' }],
        },
        {
          id: 's-2',
          branch_id: 'b-1',
          auth_user_id: 'u-2',
          full_name: 'Staff Two',
          nickname: null,
          phone: null,
          avatar_url: null,
          tier: 'mid',
          system_role: 'staff',
          staff_type: 'therapist',
          is_head: false,
          is_active: false,
          is_cross_branch: false,
          created_at: '2026-02-01T00:00:00Z',
          status: 'awaiting',
          services: [],
        },
        {
          id: 's-3',
          branch_id: 'b-1',
          auth_user_id: null,
          full_name: 'Pending invitation',
          nickname: null,
          phone: null,
          avatar_url: null,
          tier: 'junior',
          system_role: 'staff',
          staff_type: 'nail_tech',
          is_head: false,
          is_active: false,
          is_cross_branch: false,
          created_at: '2026-03-01T00:00:00Z',
          status: 'invited',
          services: [],
        },
      ];

      const kpis = calculateStaffKpis(mockRoster);
      expect(kpis).toEqual({
        totalStaff: 3,
        activeStaff: 1,
        awaitingStaff: 1,
        invitedStaff: 1,
      });
    });

    it('returns zeroed metrics for empty roster', () => {
      expect(calculateStaffKpis([])).toEqual({
        totalStaff: 0,
        activeStaff: 0,
        awaitingStaff: 0,
        invitedStaff: 0,
      });
    });
  });

  describe('Row Normalization & Validation', () => {
    it('normalizes a valid raw staff row with minimized capabilities', () => {
      const raw = {
        id: 's-100',
        branch_id: 'branch-1',
        auth_user_id: 'auth-100',
        full_name: 'Elena Gilbert',
        nickname: 'Lena',
        phone: '09170000000',
        avatar_url: 'https://images.test/avatar.jpg',
        tier: 'senior',
        system_role: 'service_head',
        staff_type: 'aesthetician',
        is_head: true,
        is_active: true,
        is_cross_branch: true,
        created_at: '2026-01-15T08:00:00Z',
        updated_at: '2026-01-20T08:00:00Z',
        staff_services: [
          {
            service_id: 'srv-1',
            services: { id: 'srv-1', name: 'Facial Treatment' },
          },
          {
            service_id: 'srv-2',
            services: [{ id: 'srv-2', name: 'Aromatherapy' }],
          },
        ],
      };

      const member = normalizeStaffMember(raw);
      expect(member).not.toBeNull();
      expect(member?.id).toBe('s-100');
      expect(member?.full_name).toBe('Elena Gilbert');
      expect(member?.nickname).toBe('Lena');
      expect(member?.status).toBe('active');
      expect(member?.is_head).toBe(true);
      expect(member?.is_cross_branch).toBe(true);
      expect(member?.services).toEqual([
        { service_id: 'srv-1', service_name: 'Facial Treatment' },
        { service_id: 'srv-2', service_name: 'Aromatherapy' },
      ]);
      expect(isStaffMember(member)).toBe(true);
    });

    it('rejects invalid or null objects', () => {
      expect(normalizeStaffMember(null)).toBeNull();
      expect(normalizeStaffMember(undefined)).toBeNull();
      expect(normalizeStaffMember('string')).toBeNull();
      expect(normalizeStaffMember({})).toBeNull();
      expect(normalizeStaffMember({ id: 's-1' })).toBeNull();
      expect(normalizeStaffMember({ id: 's-1', branch_id: 'b-1' })).toBeNull();
    });

    it('fails closed when staff_type is missing or empty', () => {
      const base = {
        id: 's-1',
        branch_id: 'b-1',
        auth_user_id: null,
        full_name: 'Staff Member',
        tier: 'senior',
        system_role: 'staff',
        is_head: false,
        is_active: true,
        is_cross_branch: false,
        created_at: '2026-01-01T00:00:00Z',
        staff_services: [],
      };
      expect(
        normalizeStaffMember({ ...base, staff_type: undefined }),
      ).toBeNull();
      expect(normalizeStaffMember({ ...base, staff_type: '' })).toBeNull();
      expect(normalizeStaffMember({ ...base, staff_type: '   ' })).toBeNull();
    });

    it('fails closed when system_role is missing or empty', () => {
      const base = {
        id: 's-1',
        branch_id: 'b-1',
        auth_user_id: null,
        full_name: 'Staff Member',
        tier: 'senior',
        staff_type: 'therapist',
        is_head: false,
        is_active: true,
        is_cross_branch: false,
        created_at: '2026-01-01T00:00:00Z',
        staff_services: [],
      };
      expect(
        normalizeStaffMember({ ...base, system_role: undefined }),
      ).toBeNull();
      expect(normalizeStaffMember({ ...base, system_role: '' })).toBeNull();
    });

    it('fails closed when tier is missing or empty', () => {
      const base = {
        id: 's-1',
        branch_id: 'b-1',
        auth_user_id: null,
        full_name: 'Staff Member',
        system_role: 'staff',
        staff_type: 'therapist',
        is_head: false,
        is_active: true,
        is_cross_branch: false,
        created_at: '2026-01-01T00:00:00Z',
        staff_services: [],
      };
      expect(normalizeStaffMember({ ...base, tier: undefined })).toBeNull();
      expect(normalizeStaffMember({ ...base, tier: '' })).toBeNull();
    });

    it('fails closed when is_active is missing or non-boolean', () => {
      const base = {
        id: 's-1',
        branch_id: 'b-1',
        auth_user_id: null,
        full_name: 'Staff Member',
        tier: 'senior',
        system_role: 'staff',
        staff_type: 'therapist',
        is_head: false,
        is_cross_branch: false,
        created_at: '2026-01-01T00:00:00Z',
        staff_services: [],
      };
      expect(
        normalizeStaffMember({ ...base, is_active: undefined }),
      ).toBeNull();
      expect(normalizeStaffMember({ ...base, is_active: 'true' })).toBeNull();
      expect(normalizeStaffMember({ ...base, is_active: 1 })).toBeNull();
    });

    it('fails closed when is_head or is_cross_branch are non-boolean', () => {
      const base = {
        id: 's-1',
        branch_id: 'b-1',
        auth_user_id: null,
        full_name: 'Staff Member',
        tier: 'senior',
        system_role: 'staff',
        staff_type: 'therapist',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        staff_services: [],
      };
      expect(
        normalizeStaffMember({
          ...base,
          is_head: 'yes',
          is_cross_branch: false,
        }),
      ).toBeNull();
      expect(
        normalizeStaffMember({
          ...base,
          is_head: true,
          is_cross_branch: 'no',
        }),
      ).toBeNull();
    });

    it('fails closed when nullable fields have non-string invalid types', () => {
      const base = {
        id: 's-1',
        branch_id: 'b-1',
        auth_user_id: 12345, // invalid type
        full_name: 'Staff Member',
        tier: 'senior',
        system_role: 'staff',
        staff_type: 'therapist',
        is_head: false,
        is_active: true,
        is_cross_branch: false,
        created_at: '2026-01-01T00:00:00Z',
        staff_services: [],
      };
      expect(normalizeStaffMember(base)).toBeNull();
      expect(
        normalizeStaffMember({ ...base, auth_user_id: null, nickname: 123 }),
      ).toBeNull();
      expect(
        normalizeStaffMember({ ...base, auth_user_id: null, phone: true }),
      ).toBeNull();
      expect(
        normalizeStaffMember({ ...base, auth_user_id: null, avatar_url: {} }),
      ).toBeNull();
    });

    it('fails closed when nested service capability is malformed and does not fabricate Unnamed Service', () => {
      const base = {
        id: 's-1',
        branch_id: 'b-1',
        auth_user_id: null,
        full_name: 'Staff Member',
        tier: 'senior',
        system_role: 'staff',
        staff_type: 'therapist',
        is_head: false,
        is_active: true,
        is_cross_branch: false,
        created_at: '2026-01-01T00:00:00Z',
      };

      // Service relation with missing name
      expect(
        normalizeStaffMember({
          ...base,
          staff_services: [
            {
              service_id: 'srv-1',
              services: { id: 'srv-1', name: '' },
            },
          ],
        }),
      ).toBeNull();

      // Service relation with null service object
      expect(
        normalizeStaffMember({
          ...base,
          staff_services: [
            {
              service_id: 'srv-1',
              services: null,
            },
          ],
        }),
      ).toBeNull();

      // Service relation with empty array
      expect(
        normalizeStaffMember({
          ...base,
          staff_services: [
            {
              service_id: 'srv-1',
              services: [],
            },
          ],
        }),
      ).toBeNull();
    });

    it('accepts valid empty capability array or null without inventing services', () => {
      const base = {
        id: 's-1',
        branch_id: 'b-1',
        auth_user_id: null,
        full_name: 'Staff Member',
        tier: 'senior',
        system_role: 'staff',
        staff_type: 'therapist',
        is_head: false,
        is_active: true,
        is_cross_branch: false,
        created_at: '2026-01-01T00:00:00Z',
      };

      const memberEmpty = normalizeStaffMember({ ...base, staff_services: [] });
      expect(memberEmpty?.services).toEqual([]);

      const memberNull = normalizeStaffMember({
        ...base,
        staff_services: null,
      });
      expect(memberNull?.services).toEqual([]);
    });

    it('fails closed when returned branch_id does not match expected branch invariant', () => {
      const base = {
        id: 's-1',
        branch_id: 'other-branch',
        auth_user_id: null,
        full_name: 'Staff Member',
        tier: 'senior',
        system_role: 'staff',
        staff_type: 'therapist',
        is_head: false,
        is_active: true,
        is_cross_branch: false,
        created_at: '2026-01-01T00:00:00Z',
        staff_services: [],
      };
      expect(normalizeStaffMember(base, 'expected-branch')).toBeNull();
      expect(normalizeStaffMember(base, 'other-branch')).not.toBeNull();
    });

    it('typeguard isStaffMember checks status and services array', () => {
      expect(isStaffMember(null)).toBe(false);
      expect(
        isStaffMember({
          id: '1',
          branch_id: 'b',
          full_name: 'N',
          status: 'invalid',
          services: [],
        }),
      ).toBe(false);
      expect(
        isStaffMember({
          id: '1',
          branch_id: 'b',
          full_name: 'N',
          status: 'active',
          services: 'not-array',
        }),
      ).toBe(false);
      expect(
        isStaffMember({
          id: '1',
          branch_id: 'b',
          full_name: 'N',
          status: 'active',
          services: [],
        }),
      ).toBe(true);
    });
  });

  describe('Error Classification', () => {
    it('classifies permission denied error code 42501', () => {
      const err = {
        code: '42501',
        message: 'permission denied for table staff',
      };
      const res = classifyStaffError(err);
      expect(res.code).toBe('PERMISSION_DENIED');
      expect(res.message).toBe(
        'You do not have permission to view staff for this branch.',
      );
    });

    it('classifies expired session error PGRST301 or 401', () => {
      const err = { code: 'PGRST301', message: 'JWT expired' };
      const res = classifyStaffError(err);
      expect(res.code).toBe('SESSION_EXPIRED');
      expect(res.message).toBe(
        'Your session has expired. Sign in again to view the staff roster.',
      );
    });

    it('classifies network error', () => {
      const err = new Error('Failed to fetch');
      const res = classifyStaffError(err);
      expect(res.code).toBe('NETWORK_ERROR');
      expect(res.message).toBe(
        'Failed to load staff roster. Please check your connection and try again.',
      );
    });

    it('classifies generic query error', () => {
      const err = { code: '500', message: 'Internal server error' };
      const res = classifyStaffError(err);
      expect(res.code).toBe('500');
      expect(res.message).toBe(
        'Failed to load staff roster. Please check your connection and try again.',
      );
    });
  });

  describe('fetchBranchStaff Query Execution', () => {
    it('returns error when branchId is empty', async () => {
      const res = await fetchBranchStaff('');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('INVALID_BRANCH');
      }
    });

    it('executes branch query and returns populated roster with KPIs', async () => {
      const mockStaffRows = [
        {
          id: 's-1',
          branch_id: 'branch-100',
          auth_user_id: 'auth-1',
          full_name: 'Ana Cruz',
          nickname: 'Ann',
          phone: '09171234567',
          avatar_url: null,
          tier: 'mid',
          system_role: 'staff',
          staff_type: 'therapist',
          is_head: false,
          is_active: true,
          is_cross_branch: false,
          created_at: '2026-01-01T00:00:00Z',
          staff_services: [
            {
              service_id: 'srv-10',
              services: { id: 'srv-10', name: 'Foot Reflexology' },
            },
          ],
        },
      ];

      const mockQueryBuilder: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockStaffRows, error: null }),
      };

      const mockClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      } as unknown as SupabaseClient;

      const res = await fetchBranchStaff('branch-100', mockClient);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.length).toBe(1);
        expect(res.data[0].full_name).toBe('Ana Cruz');
        expect(res.data[0].status).toBe('active');
        expect(res.data[0].services).toEqual([
          { service_id: 'srv-10', service_name: 'Foot Reflexology' },
        ]);
        expect(res.kpis.totalStaff).toBe(1);
        expect(res.kpis.activeStaff).toBe(1);
      }
    });

    it('returns valid empty roster and zeroed KPIs when branch has no staff', async () => {
      const mockQueryBuilder: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      } as unknown as SupabaseClient;

      const res = await fetchBranchStaff('branch-empty', mockClient);

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data).toEqual([]);
        expect(res.kpis).toEqual({
          totalStaff: 0,
          activeStaff: 0,
          awaitingStaff: 0,
          invitedStaff: 0,
        });
      }
    });

    it('fails closed on malformed data payload', async () => {
      const mockQueryBuilder: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: 'not an array', error: null }),
      };

      const mockClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      } as unknown as SupabaseClient;

      const res = await fetchBranchStaff('branch-100', mockClient);

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('INVALID_PAYLOAD');
        expect(res.message).toBe(
          'Staff service returned an invalid data payload.',
        );
      }
    });

    it('fails closed when row has corrupted data', async () => {
      const mockQueryBuilder: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi
          .fn()
          .mockResolvedValue({ data: [{ invalid: 'row' }], error: null }),
      };

      const mockClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      } as unknown as SupabaseClient;

      const res = await fetchBranchStaff('branch-100', mockClient);

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('INVALID_PAYLOAD');
        expect(res.message).toBe(
          'Staff service returned an invalid data payload.',
        );
      }
    });

    it('returns classified error when Supabase query returns an error', async () => {
      const mockQueryBuilder: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '42501', message: 'permission denied' },
        }),
      };

      const mockClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      } as unknown as SupabaseClient;

      const res = await fetchBranchStaff('branch-100', mockClient);

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('PERMISSION_DENIED');
        expect(res.message).toBe(
          'You do not have permission to view staff for this branch.',
        );
      }
    });
  });
});
