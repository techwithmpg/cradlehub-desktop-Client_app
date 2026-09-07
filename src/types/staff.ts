export type StaffStatus = 'active' | 'awaiting' | 'invited';

export type StaffStatusFilter = 'all' | 'active' | 'awaiting' | 'invited';

export interface StaffServiceCapability {
  service_id: string;
  service_name: string;
}

export interface StaffMember {
  id: string;
  branch_id: string;
  auth_user_id: string | null;
  full_name: string;
  nickname: string | null;
  phone: string | null;
  avatar_url: string | null;
  tier: string;
  system_role: string;
  staff_type: string;
  is_head: boolean;
  is_active: boolean;
  is_cross_branch: boolean;
  created_at: string;
  updated_at: string;
  status: StaffStatus;
  services: StaffServiceCapability[];
}

export interface StaffKpiSummary {
  totalStaff: number;
  activeStaff: number;
  awaitingStaff: number;
  invitedStaff: number;
}

export type FetchStaffResult =
  | {
      ok: true;
      data: StaffMember[];
      kpis: StaffKpiSummary;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };
