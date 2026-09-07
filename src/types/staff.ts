export type StaffStatus = 'active' | 'awaiting' | 'invited';

export type StaffStatusFilter = 'all' | 'active' | 'awaiting' | 'invited';

export type StaffPrimaryTab =
  | 'roster'
  | 'schedule'
  | 'applications'
  | 'performance'
  | 'capabilities'
  | 'roles';

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

export interface StaffFilters {
  search: string;
  status: StaffStatusFilter;
  staffType: string;
  systemRole: string;
  capabilityId: string;
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

export interface BranchServiceOption {
  id: string;
  name: string;
  category?: string | null;
  duration_minutes?: number | null;
}

export interface StaffOnboardingRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_role: string;
  experience_years?: number | null;
  requested_branch_id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  staff_id?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by_staff_id?: string | null;
  rejection_reason?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface StaffScheduleOverride {
  id?: string;
  staff_id: string;
  override_date: string;
  is_day_off: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface StaffBlockedTime {
  id: string;
  staff_id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

export interface UpdateStaffProfileInput {
  staffId: string;
  fullName: string;
  nickname?: string | null;
  phone?: string | null;
  staffType: string;
  tier: string;
  isHead: boolean;
}

export interface StaffScheduleAdjustmentInput {
  staffId: string;
  branchId: string;
  date: string;
  adjustmentType:
    | 'working_hours'
    | 'day_off'
    | 'blocked_time'
    | 'remove_override'
    | 'remove_block';
  startTime?: string;
  endTime?: string;
  blockId?: string;
  reason?: string;
}

export interface ReviewOnboardingInput {
  requestId: string;
  staffId?: string;
  action: 'approve' | 'reject';
  branchId?: string;
  systemRole?: string;
  staffType?: string;
  tier?: string;
  serviceIds?: string[];
  rejectionReason?: string;
}
