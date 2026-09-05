import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AuthContext } from '../types/auth';
import { canonicalizeRole, isRoleEligibleForCrm } from './roles';
import { getSupabaseClient } from './supabase';

export class AuthDenialError extends Error {
  readonly isDenial = true;
  readonly denialReason: string;
  readonly email?: string;
  readonly userId?: string;
  readonly rawRole?: string;

  constructor(
    reason: string,
    details?: { email?: string; userId?: string; rawRole?: string },
  ) {
    super(reason);
    this.name = 'AuthDenialError';
    this.denialReason = reason;
    this.email = details?.email;
    this.userId = details?.userId;
    this.rawRole = details?.rawRole;
  }
}

export class NetworkOrConfigError extends Error {
  readonly isNetworkOrConfig = true;
  constructor(message: string) {
    super(message);
    this.name = 'NetworkOrConfigError';
  }
}

export class InvalidCredentialsError extends Error {
  readonly isInvalidCredentials = true;
  constructor(message = 'Invalid login credentials') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Signs in using email and password against Supabase Auth.
 * Never logs credentials.
 */
export async function authenticateWithPassword(
  email: string,
  password: string,
  customClient?: SupabaseClient,
): Promise<User> {
  const client = customClient ?? getSupabaseClient();

  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    throw new InvalidCredentialsError('Please enter both email and password.');
  }

  let result;
  try {
    result = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes('fetch') ||
      message.includes('Network') ||
      message.includes('Failed to fetch') ||
      message.includes('network')
    ) {
      throw new NetworkOrConfigError(
        'Unable to connect to authentication service. Please check your network connection.',
      );
    }
    throw new InvalidCredentialsError('Invalid login credentials');
  }

  const { data, error } = result;

  if (error) {
    const errorMsg = error.message.toLowerCase();
    if (
      errorMsg.includes('invalid login credentials') ||
      errorMsg.includes('invalid credentials') ||
      errorMsg.includes('invalid email or password') ||
      errorMsg.includes('user not found') ||
      errorMsg.includes('invalid grant') ||
      error.status === 400
    ) {
      throw new InvalidCredentialsError('Invalid login credentials');
    }

    if (
      errorMsg.includes('fetch') ||
      errorMsg.includes('network') ||
      errorMsg.includes('connection') ||
      errorMsg.includes('timeout')
    ) {
      throw new NetworkOrConfigError(
        'Unable to connect to authentication service. Please check your network connection.',
      );
    }

    throw new Error(
      error.message || 'Authentication failed. Please try again.',
    );
  }

  if (!data.user) {
    throw new InvalidCredentialsError('Invalid login credentials');
  }

  // Authoritatively validate user identity
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    throw new InvalidCredentialsError(
      'Failed to validate authenticated user identity.',
    );
  }

  return userData.user;
}

/**
 * Resolves authoritative staff record and branch context for an authenticated user.
 * Fails closed if any condition is unmet.
 */
export async function resolveStaffAndBranchContext(
  user: User,
  customClient?: SupabaseClient,
): Promise<AuthContext> {
  const client = customClient ?? getSupabaseClient();
  const userEmail = user.email || '';

  // 1. Query staff row for the authenticated auth_user_id
  const { data: staffData, error: staffError } = await client
    .from('staff')
    .select(
      'id, auth_user_id, full_name, role, branch_id, is_active, branches(name)',
    )
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (staffError) {
    throw new AuthDenialError(
      'Failed to verify staff record due to database or permission error.',
      {
        email: userEmail,
        userId: user.id,
      },
    );
  }

  // 2. Check if staff row exists
  if (!staffData) {
    throw new AuthDenialError(
      'No staff profile associated with this authenticated account.',
      {
        email: userEmail,
        userId: user.id,
      },
    );
  }

  // 3. Verify staff account is active
  if (!staffData.is_active) {
    throw new AuthDenialError(
      'Your staff account is marked inactive. Contact an administrator.',
      {
        email: userEmail,
        userId: user.id,
        rawRole: staffData.role,
      },
    );
  }

  // 4. Canonicalize role and verify CRM eligibility
  const canonicalRole = canonicalizeRole(staffData.role);
  const isCrmEligible = isRoleEligibleForCrm(canonicalRole);

  if (!isCrmEligible) {
    throw new AuthDenialError(
      `Your account role (${staffData.role || 'unassigned'}) is not authorized for CRM workspace access.`,
      {
        email: userEmail,
        userId: user.id,
        rawRole: staffData.role,
      },
    );
  }

  // 5. Verify authoritative branch assignment
  if (!staffData.branch_id) {
    throw new AuthDenialError('No branch is assigned to your staff profile.', {
      email: userEmail,
      userId: user.id,
      rawRole: staffData.role,
    });
  }

  // 6. Resolve branch name
  let branchName = '';
  if (staffData.branches) {
    if (
      typeof staffData.branches === 'object' &&
      'name' in staffData.branches
    ) {
      branchName = (staffData.branches as { name: string }).name;
    } else if (
      Array.isArray(staffData.branches) &&
      staffData.branches.length > 0
    ) {
      branchName = staffData.branches[0]?.name || '';
    }
  }

  if (!branchName && staffData.branch_id) {
    const { data: branchData, error: branchError } = await client
      .from('branches')
      .select('name')
      .eq('id', staffData.branch_id)
      .maybeSingle();

    if (!branchError && branchData?.name) {
      branchName = branchData.name;
    }
  }

  if (!branchName) {
    throw new AuthDenialError(
      'Assigned branch details could not be resolved.',
      {
        email: userEmail,
        userId: user.id,
        rawRole: staffData.role,
      },
    );
  }

  return {
    userId: user.id,
    email: userEmail,
    staffId: staffData.id,
    fullName: staffData.full_name?.trim() || userEmail || 'Staff Member',
    canonicalRole,
    rawRole: staffData.role,
    branchId: staffData.branch_id,
    branchName,
    isCrmEligible: true,
  };
}

/**
 * Signs out from Supabase Auth and clears session.
 */
export async function signOutUser(
  customClient?: SupabaseClient,
): Promise<void> {
  const client = customClient ?? getSupabaseClient();
  try {
    await client.auth.signOut();
  } catch {
    // Gracefully handle sign-out errors
  }
}
