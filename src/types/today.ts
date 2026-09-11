/**
 * Desktop Today Contract Types
 *
 * Authored to strictly mirror the accepted hosted Stage 09A Today contract:
 * - GET /api/desktop/v1/today
 * - POST /api/desktop/v1/today/mutations
 *
 * Financial data (amounts, payments, cards) is strictly excluded.
 */

export type CradleFlowStage =
  'waiting' | 'in_service' | 'ready_to_pay' | 'completed' | null;

export type ReadinessStatus = 'ok' | 'warning' | 'critical';

export interface DesktopTodayContext {
  branchId: string;
  branchName: string;
  businessDate: string;
  role: string;
}

export interface DesktopTodaySummary {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  unassigned: number;
  waiting: number;
  inService: number;
  readyToPay: number;
  completedService: number;
  homeService: number;
}

export interface DesktopTodayQueueItem {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  bookingProgressStatus: string;
  type: string;
  deliveryType: string | null;
  customerName: string | null;
  customerPhone: string | null;
  serviceName: string | null;
  serviceDuration: number | null;
  staffId: string | null;
  staffName: string | null;
  resourceId: string | null;
  resourceName: string | null;
  paymentStatus: string | null;
  checkedInAt: string | null;
  sessionStartedAt: string | null;
  sessionDueAt: string | null;
  sessionCompletedAt: string | null;
  createdAt: string | null;
  stage: CradleFlowStage;
  isHomeService: boolean;
  dispatchContextAvailable: boolean | null;
  driverId: string | null;
  driverName: string | null;
  noDriverWarning: boolean;
  dispatchWarning: string | null;
  needsLocationReview: boolean;
  homeServiceAddress: string | null;
}

export interface DesktopTodayReadinessIssue {
  id: string;
  scope: string;
  severity: string;
  title: string;
  problem: string;
  impact: string;
  fix: string;
  actionLabel: string;
  actionHref: string;
  count?: number;
}

export interface DesktopTodayReadiness {
  available: boolean;
  status: ReadinessStatus;
  issues: DesktopTodayReadinessIssue[];
  error: string | null;
}

export interface DesktopTodayAttendanceItem {
  eventId: string;
  staffId: string | null;
  staffName: string;
  staffNickname: string | null;
  eventType: string;
  outcome: string;
  reasonCode: string | null;
  message: string | null;
  occurredAt: string;
  clockInAt: string | null;
  clockOutAt: string | null;
  sourceLabel: string | null;
}

export interface DesktopTodayAttendance {
  available: boolean;
  selectedDate: string;
  timezone: string;
  lastHourCount: number;
  items: DesktopTodayAttendanceItem[];
  error: string | null;
}

export interface DesktopTodayNotification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  priority: string;
  createdAt: string;
  requiresAction: boolean;
}

export interface DesktopTodayNotifications {
  available: boolean;
  items: DesktopTodayNotification[];
  error: string | null;
}

export interface DesktopTodayData {
  context: DesktopTodayContext;
  summary: DesktopTodaySummary;
  queue: DesktopTodayQueueItem[];
  readiness: DesktopTodayReadiness;
  attendance: DesktopTodayAttendance;
  notifications: DesktopTodayNotifications;
}

export interface DesktopTodayResponse {
  ok: true;
  data: DesktopTodayData;
}

export type TodayMutationAction =
  'confirm_booking' | 'mark_arrived' | 'start_service' | 'complete_service';

export type DesktopTodayMutationPayload =
  | { action: 'confirm_booking'; bookingId: string; note?: string }
  | { action: 'mark_arrived'; bookingId: string }
  | { action: 'start_service'; bookingId: string }
  | { action: 'complete_service'; bookingId: string };

export interface DesktopTodayMutationResult {
  ok: true;
  data: {
    success: boolean;
    bookingId?: string;
    status?: string;
    code?: string;
    error?: string;
    message?: string;
  };
}
