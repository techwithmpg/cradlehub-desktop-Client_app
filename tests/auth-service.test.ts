import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  authenticateWithPassword,
  resolveStaffAndBranchContext,
  signOutUser,
  AuthDenialError,
  InvalidCredentialsError,
  NetworkOrConfigError,
} from '../src/lib/auth-service';

function createMockSupabaseClient(overrides: {
  signInResponse?: {
    data: { user: User | null; session: unknown };
    error: unknown;
  };
  getUserResponse?: { data: { user: User | null }; error: unknown };
  staffResponse?: { data: unknown; error: unknown };
  branchResponse?: { data: unknown; error: unknown };
  signOutError?: unknown;
}): SupabaseClient {
  const signInWithPassword = vi.fn().mockResolvedValue(
    overrides.signInResponse ?? {
      data: {
        user: { id: 'usr-123', email: 'staff@example.com' } as User,
        session: {},
      },
      error: null,
    },
  );

  const getUser = vi.fn().mockResolvedValue(
    overrides.getUserResponse ?? {
      data: {
        user: { id: 'usr-123', email: 'staff@example.com' } as User,
      },
      error: null,
    },
  );

  const signOut = vi.fn().mockResolvedValue({
    error: overrides.signOutError ?? null,
  });

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === 'staff') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue(
              overrides.staffResponse ?? {
                data: {
                  id: 'staff-1',
                  auth_user_id: 'usr-123',
                  full_name: 'Jane Doe',
                  role: 'crm',
                  branch_id: 'branch-1',
                  is_active: true,
                  branches: { name: 'Makati Branch' },
                },
                error: null,
              },
            ),
          }),
        }),
      };
    }

    if (table === 'branches') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue(
              overrides.branchResponse ?? {
                data: { name: 'Makati Branch' },
                error: null,
              },
            ),
          }),
        }),
      };
    }

    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };
  });

  return {
    auth: {
      signInWithPassword,
      getUser,
      signOut,
    },
    from,
  } as unknown as SupabaseClient;
}

describe('Authentication Service', () => {
  describe('authenticateWithPassword', () => {
    it('returns validated user on successful authentication', async () => {
      const mockClient = createMockSupabaseClient({});
      const user = await authenticateWithPassword(
        'staff@example.com',
        'valid-pass',
        mockClient,
      );

      expect(user.id).toBe('usr-123');
      expect(user.email).toBe('staff@example.com');
      expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'staff@example.com',
        password: 'valid-pass',
      });
      expect(mockClient.auth.getUser).toHaveBeenCalled();
    });

    it('throws InvalidCredentialsError for empty email or password', async () => {
      const mockClient = createMockSupabaseClient({});
      await expect(
        authenticateWithPassword('', 'pass', mockClient),
      ).rejects.toThrow(InvalidCredentialsError);
      await expect(
        authenticateWithPassword('user@example.com', '', mockClient),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('throws InvalidCredentialsError when Supabase returns invalid credentials', async () => {
      const mockClient = createMockSupabaseClient({
        signInResponse: {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials', status: 400 },
        },
      });

      await expect(
        authenticateWithPassword('staff@example.com', 'wrong-pass', mockClient),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('throws NetworkOrConfigError when network request fails', async () => {
      const mockClient = {
        auth: {
          signInWithPassword: vi
            .fn()
            .mockRejectedValue(new Error('Failed to fetch')),
          getUser: vi.fn(),
          signOut: vi.fn(),
        },
      } as unknown as SupabaseClient;

      await expect(
        authenticateWithPassword('staff@example.com', 'pass', mockClient),
      ).rejects.toThrow(NetworkOrConfigError);
    });
  });

  describe('resolveStaffAndBranchContext', () => {
    const mockUser: User = {
      id: 'usr-123',
      email: 'jane@cradlehub.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-01-01',
    };

    it('resolves full AuthContext for active staff with authorized role and branch', async () => {
      const mockClient = createMockSupabaseClient({
        staffResponse: {
          data: {
            id: 'staff-42',
            auth_user_id: 'usr-123',
            full_name: 'Jane Doe',
            role: 'csr',
            branch_id: 'branch-101',
            is_active: true,
            branches: { name: 'BGC Flagship' },
          },
          error: null,
        },
      });

      const context = await resolveStaffAndBranchContext(mockUser, mockClient);

      expect(context.userId).toBe('usr-123');
      expect(context.email).toBe('jane@cradlehub.com');
      expect(context.staffId).toBe('staff-42');
      expect(context.fullName).toBe('Jane Doe');
      expect(context.canonicalRole).toBe('crm');
      expect(context.rawRole).toBe('csr');
      expect(context.branchId).toBe('branch-101');
      expect(context.branchName).toBe('BGC Flagship');
      expect(context.isCrmEligible).toBe(true);
    });

    it('denies access if staff record is not found', async () => {
      const mockClient = createMockSupabaseClient({
        staffResponse: { data: null, error: null },
      });

      await expect(
        resolveStaffAndBranchContext(mockUser, mockClient),
      ).rejects.toThrow(AuthDenialError);
    });

    it('denies access if staff record is inactive', async () => {
      const mockClient = createMockSupabaseClient({
        staffResponse: {
          data: {
            id: 'staff-42',
            auth_user_id: 'usr-123',
            full_name: 'Jane Doe',
            role: 'crm',
            branch_id: 'branch-101',
            is_active: false,
          },
          error: null,
        },
      });

      await expect(
        resolveStaffAndBranchContext(mockUser, mockClient),
      ).rejects.toThrow(/inactive/);
    });

    it('denies access if staff role is not CRM-eligible', async () => {
      const mockClient = createMockSupabaseClient({
        staffResponse: {
          data: {
            id: 'staff-42',
            auth_user_id: 'usr-123',
            full_name: 'Jane Doe',
            role: 'therapist',
            branch_id: 'branch-101',
            is_active: true,
            branches: { name: 'BGC Flagship' },
          },
          error: null,
        },
      });

      await expect(
        resolveStaffAndBranchContext(mockUser, mockClient),
      ).rejects.toThrow(/not authorized for CRM/);
    });

    it('denies access if branch is missing', async () => {
      const mockClient = createMockSupabaseClient({
        staffResponse: {
          data: {
            id: 'staff-42',
            auth_user_id: 'usr-123',
            full_name: 'Jane Doe',
            role: 'manager',
            branch_id: null,
            is_active: true,
          },
          error: null,
        },
      });

      await expect(
        resolveStaffAndBranchContext(mockUser, mockClient),
      ).rejects.toThrow(/No branch is assigned/);
    });
  });

  describe('signOutUser', () => {
    it('calls client auth signOut', async () => {
      const mockClient = createMockSupabaseClient({});
      await signOutUser(mockClient);
      expect(mockClient.auth.signOut).toHaveBeenCalled();
    });
  });
});
