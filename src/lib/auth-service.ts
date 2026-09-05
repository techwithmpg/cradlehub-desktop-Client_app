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

export class ContextLoadError extends Error {
  readonly isContextLoad = true;
  constructor(
    message = 'We could not load your authorized workspace context. Please check your connection and try again.',
  ) {
    super(message);
    this.name = 'ContextLoadError';
  }
}

export class NetworkOrConfigError extends Error {
  readonly isNetworkOrConfig = true;
  constructor(
    message = 'Unable to connect to authentication service. Please check your network connection.',
  ) {
    super(message);
    this.name = 'NetworkOrConfigError';
  }
}

export class InvalidCredentialsError extends Error {
  readonly isInvalidCredentials = true;
  constructor(message = 'Invalid email or password.') {
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
    throw new InvalidCredentialsError('Invalid email or password.');
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
      throw new InvalidCredentialsError('Invalid email or password.');
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

    throw new NetworkOrConfigError(
      error.message ||
        'Unable to connect to authentication service. Please check your network connection.',
    );
  }

  if (!data.user) {
    throw new InvalidCredentialsError('Invalid email or password.');
  }

  // Authoritatively validate user identity
  let userResult;
  try {
    userResult = await client.auth.getUser();
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
    throw new NetworkOrConfigError(
      'Failed to validate user identity with auth service.',
    );
  }

  const { data: userData, error: userError } = userResult;
  if (userError) {
    const userErrMsg = userError.message.toLowerCase();
    if (
      userErrMsg.includes('fetch') ||
      userErrMsg.includes('network') ||
      userErrMsg.includes('connection') ||
      userErrMsg.includes('timeout')
    ) {
      throw new NetworkOrConfigError(
        'Unable to connect to authentication service. Please check your network connection.',
      );
    }
    throw new InvalidCredentialsError(
      'Authenticated user session is invalid or expired.',
    );
  }

  if (!userData.user) {
    throw new InvalidCredentialsError(
      'Authenticated user session could not be established.',
    );
  }

  return userData.user;
}

/**
 * Resolves authoritative staff record and branch context for an authenticated user.
 * Distinguishes context loading errors from authorization denials.
 * Fails closed for any unauthorized or missing context.
 */
export async function resolveStaffAndBranchContext(
  user: User,
  customClient?: SupabaseClient,
): Promise<AuthContext> {
  const client = customClient ?? getSupabaseClient();
  const userEmail = user.email || '';

  // 1. Query staff row for the authenticated auth_user_id using authoritative system_role
  let staffResult;
  try {
    staffResult = await client
      .from('staff')
      .select(
        'id, auth_user_id, full_name, system_role, branch_id, is_active, branches(name)',
      )
      .eq('auth_user_id', user.id)
      .maybeSingle();
  } catch {
    throw new ContextLoadError(
      'We could not load your authorized workspace context. Please check your connection and try again.',
    );
  }

  const { data: staffData, error: staffError } = staffResult;

  if (staffError) {
    throw new ContextLoadError(
      'We could not load your authorized workspace context. Please check your connection and try again.',
    );
  }

  // 2. Check if staff row exists (Denial if no staff profile)
  if (!staffData) {
    throw new AuthDenialError(
      'No staff profile associated with this authenticated account.',
      {
        email: userEmail,
        userId: user.id,
      },
    );
  }

  // 3. Verify staff account is active (Denial if inactive)
  if (!staffData.is_active) {
    throw new AuthDenialError(
      'Your staff account is marked inactive. Contact an administrator.',
      {
        email: userEmail,
        userId: user.id,
        rawRole: staffData.system_role,
      },
    );
  }

  // 4. Canonicalize authoritative system_role and verify CRM eligibility
  const canonicalRole = canonicalizeRole(staffData.system_role);
  const isCrmEligible = isRoleEligibleForCrm(canonicalRole);

  if (!isCrmEligible) {
    throw new AuthDenialError(
      `Your account role (${staffData.system_role || 'unassigned'}) is not authorized for CRM workspace access.`,
      {
        email: userEmail,
        userId: user.id,
        rawRole: staffData.system_role,
      },
    );
  }

  // 5. Verify authoritative branch assignment
  if (!staffData.branch_id) {
    throw new AuthDenialError('No branch is assigned to your staff profile.', {
      email: userEmail,
      userId: user.id,
      rawRole: staffData.system_role,
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
    let branchResult;
    try {
      branchResult = await client
        .from('branches')
        .select('name')
        .eq('id', staffData.branch_id)
        .maybeSingle();
    } catch {
      throw new ContextLoadError(
        'We could not load your authorized branch details. Please check your connection and try again.',
      );
    }

    const { data: branchData, error: branchError } = branchResult;

    if (branchError) {
      throw new ContextLoadError(
        'We could not load your authorized branch details. Please check your connection and try again.',
      );
    }

    if (branchData?.name) {
      branchName = branchData.name;
    }
  }

  if (!branchName) {
    throw new AuthDenialError(
      'Assigned branch details could not be resolved.',
      {
        email: userEmail,
        userId: user.id,
        rawRole: staffData.system_role,
      },
    );
  }

  return {
    userId: user.id,
    email: userEmail,
    staffId: staffData.id,
    fullName: staffData.full_name?.trim() || userEmail || 'Staff Member',
    canonicalRole,
    rawRole: staffData.system_role,
    branchId: staffData.branch_id,
    branchName,
    isCrmEligible: true,
  };
}

/**
 * Signs out from Supabase Auth for the local desktop session only.
 * Does not swallow errors.
 */
export async function signOutUser(
  customClient?: SupabaseClient,
): Promise<void> {
  const client = customClient ?? getSupabaseClient();
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) {
    throw new Error(error.message || 'Failed to sign out. Please try again.');
  }
}
