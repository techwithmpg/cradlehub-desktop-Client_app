export type OperationsIssueArea =
  'attendance' | 'configuration' | 'staff_identity';

export type OperationsIssueSeverity = 'critical' | 'warning' | 'info';

export type OperationsResolutionState =
  'detected' | 'under_review' | 'pending_action';

export type OperationsResolutionKind =
  | 'attendance_router'
  | 'provider_assignment'
  | 'staff_duplicate'
  | 'device_recovery'
  | 'guidance';

export interface OperationsIssue {
  id: string;
  area: OperationsIssueArea;
  severity: OperationsIssueSeverity;
  resolutionState: OperationsResolutionState;
  title: string;
  description: string;
  guidance: string;
  actionLabel: string;
  actionHref: string;
  code: string | null;
  scanIdSuffix: string | null;
  detectedAt: string | null;
  staffId?: string | null;
  staffName?: string | null;
  serviceId?: string | null;
  serviceName?: string | null;
  resolutionKind?: OperationsResolutionKind;
}

export interface OperationsScan {
  id: string;
  staffId: string | null;
  staffName: string;
  reasonCode: string;
  message: string;
  scanIdSuffix: string;
  occurredAt: string;
  isUnresolvedFailure: boolean;
}

export interface OperationalStaffMember {
  id: string;
  full_name: string;
  nickname?: string | null;
  phone?: string | null;
  system_role: string;
  staff_type: string;
  tier?: string | null;
  is_active: boolean;
  branch_id: string;
  hasLoginAccount: boolean;
  isIdentityVerified: boolean;
  identity_verified_at?: string | null;
  archived_at?: string | null;
  merged_into_staff_id?: string | null;
  created_at?: string | null;
}

export interface OperationsSummaryCounts {
  critical: number;
  warning: number;
  info: number;
  attendance: number;
  staff: number;
  configuration: number;
  unresolvedScans: number;
  totalIssues: number;
}

export interface OperationsCenterData {
  branchId: string;
  branchName: string;
  checkedAt: string;
  issues: OperationsIssue[];
  scans: OperationsScan[];
  attendanceAvailable: boolean;
  configurationAvailable: boolean;
  staffAvailable: boolean;
  branchStaff: OperationalStaffMember[];
  counts: OperationsSummaryCounts;
  readyLabel: string;
  operatorRole: string;
  canPerformMutations: boolean;
}

export type OperationsTab =
  'all' | 'attendance' | 'service' | 'staff' | 'scans';

export interface OperationsFilters {
  search: string;
  severity: string;
  area: string;
  resolutionState: string;
}

export interface AssignProviderPayload {
  serviceId: string;
  staffId: string;
}

export interface AssignProviderResult {
  serviceId: string;
  staffId: string;
  providerCount: number;
}

export interface ResolveExceptionPayload {
  exceptionId: string;
  reason?: string;
}

export interface DeviceRecoveryPayload {
  staffId: string;
}

export interface DeviceRecoveryResult {
  token: string;
  activationUrl: string | null;
  expiresAt: string;
}
