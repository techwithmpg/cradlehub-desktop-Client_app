export type CanonicalRole =
  | 'crm'
  | 'owner'
  | 'manager'
  | 'assistant_manager'
  | 'store_manager'
  | 'unknown';

export interface StaffRecord {
  id: string;
  auth_user_id: string;
  full_name: string;
  system_role: string;
  branch_id: string | null;
  is_active: boolean;
}

export interface AuthContext {
  userId: string;
  email: string;
  staffId: string;
  fullName: string;
  canonicalRole: CanonicalRole;
  rawRole: string;
  branchId: string;
  branchName: string;
  isCrmEligible: boolean;
}

export type AuthStatus =
  | 'idle'
  | 'authenticating'
  | 'resolving_context'
  | 'authenticated'
  | 'denied'
  | 'error'
  | 'signing_out';

export interface DenialDetails {
  reason: string;
  email?: string;
  userId?: string;
  rawRole?: string;
}

export type NavModuleId =
  | 'today'
  | 'bookings'
  | 'attendance'
  | 'customers'
  | 'schedule'
  | 'home-service'
  | 'staff'
  | 'settings';

export interface NavModuleItem {
  id: NavModuleId;
  label: string;
  description: string;
}
