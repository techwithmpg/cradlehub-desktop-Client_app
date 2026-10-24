export type CashierTab =
  'today' | 'ledger' | 'drawers' | 'day-close' | 'history';

export interface CashierOverviewKpis {
  totalCollected: number;
  totalTransactions: number;
  pendingAmount: number;
  pendingBookingsCount: number;
  cashAmount: number;
  cashCount: number;
  digitalAmount: number;
  digitalCount: number;
  expenseAmount: number;
  expenseCount: number;
}

export interface PaymentMixItem {
  method: string;
  label: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface RecentPaymentItem {
  id: string;
  time: string;
  type?: string;
  customerName: string;
  reference: string;
  serviceDescription: string;
  durationMinutes?: number | null;
  paymentMethodDisplay: string;
  amount: number;
  status: string;
}

export interface MaskedAccountOption {
  id: string;
  name: string;
  accountType:
    | 'cash_drawer'
    | 'gcash'
    | 'maya'
    | 'bank_transfer'
    | 'card_terminal'
    | 'other';
  identifierMask?: string | null;
  branchId?: string | null;
}

export interface ExpenseCategoryOption {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface StaffOption {
  id: string;
  name: string;
  role: string;
}

export interface CashSessionSummary {
  id: string;
  branchId: string;
  businessDate: string;
  cashDrawerAccountId: string;
  cashDrawerName: string;
  status: 'open' | 'closed';
  openingFloat: number;
  openingNote?: string | null;
  openedBy: string;
  openedByName?: string;
  openedAt: string;
  currentCustodianId?: string;
  currentCustodianName?: string;
  closedBy?: string | null;
  closedByName?: string | null;
  closedAt?: string | null;
  expectedCash: number;
  countedCash?: number | null;
  expectedCashAtClose?: number | null;
  variance?: number | null;
  closingNote?: string | null;
}

export interface CashierOverviewData {
  branchId: string;
  branchName: string;
  businessDate: string;
  kpis: CashierOverviewKpis;
  paymentMix: PaymentMixItem[];
  recentPayments: RecentPaymentItem[];
  activeDrawerSession: CashSessionSummary | null;
}

export interface PayableOrderItemDetail {
  id: string;
  description: string;
  amount: number;
  itemType?: string;
}

export interface PayableOrderOption {
  id: string;
  sourceKind: 'booking_order' | 'legacy_booking';
  paymentEligible?: boolean;
  ineligibilityReason?: string | null;
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  serviceDescription: string;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  bookingDate: string;
  serviceTime?: string | null;
  branchName?: string;
  visitType?: 'in_spa' | 'home_service';
  bookingStatus?: string;
  paymentStatus?: 'unpaid' | 'partially_paid' | 'paid';
  payableItems?: PayableOrderItemDetail[];
}

export interface PayableOrdersResponseData {
  pendingQueue: PayableOrderOption[];
  paidAndClosed: PayableOrderOption[];
  accounts: MaskedAccountOption[];
  paymentMethods: string[];
}

export interface LedgerRecordItem {
  id: string;
  dateTime: string;
  reference: string;
  customerSource: string;
  category: string;
  method: string;
  inflow: number | null;
  outflow: number | null;
  netEffect: number;
  status: string;
  isReconciliationOnly?: boolean;
}

export interface LedgerKpiSummary {
  inflow: number;
  outflow: number;
  netFlow: number;
  unreconciledText: string;
  unreconciledCount?: number;
}

export interface CashierLedgerResponseData {
  kpis: LedgerKpiSummary;
  records: LedgerRecordItem[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  accounts: MaskedAccountOption[];
}

export interface CashierDrawersResponseData {
  activeSessions: CashSessionSummary[];
  availableDrawers: MaskedAccountOption[];
  accounts: MaskedAccountOption[];
  expenseCategories: ExpenseCategoryOption[];
  staffOptions: StaffOption[];
}

export interface DayCloseSummaryData {
  businessDate: string;
  isBalanced: boolean;
  readyForReview: boolean;
  lastUpdatedText: string;
  reconciliationStatus: 'not_started' | 'draft' | 'submitted' | 'approved';
  expectedCash: number | null;
  actualCash: number | null;
  cashVariance: number | null;
  channelVariance: number | null;
  recordedInflow: number;
  recordedOutflow: number;
  netPosition: number;
  openIssuesCount: number;
  paymentBreakdown: PaymentMixItem[];
  isFinalizationSupported: boolean;
}

export interface HistoricalDayCloseItem {
  id: string;
  date: string;
  branchName: string;
  status: 'reviewed' | 'closed' | 'needs_review' | 'reopened' | string;
  inflow: number | null;
  outflow: number | null;
  net: number | null;
  reviewedBy: string | null;
}

export interface HistoryTabSummary {
  closedDaysThisMonth: number;
  totalInflowThisMonth: number;
  totalOutflowThisMonth: number;
  reviewExceptions: number;
  records: HistoricalDayCloseItem[];
  auditTrail: Array<{
    id: string;
    time: string;
    user: string;
    action: string;
    details: string;
  }>;
  isHistoricalSummarySupported?: boolean;
}

export interface RecordPaymentPayload {
  orderId: string;
  idempotencyKey: string;
  payments: Array<{
    amount: number;
    paymentMethod: string;
    financialAccountId: string;
    externalReference?: string | null;
  }>;
  businessDate?: string;
  externalReference?: string | null;
  notes?: string | null;
}

export interface RecordExpensePayload {
  categoryId: string;
  financialAccountId: string;
  amount: number;
  payee: string;
  description: string;
  receiptReference?: string | null;
  businessDate?: string;
  notes?: string | null;
  idempotencyKey: string;
}

export type DrawerSessionActionPayload =
  | {
      action: 'open';
      cashDrawerAccountId: string;
      openingFloat: number;
      openingNote?: string | null;
      idempotencyKey: string;
    }
  | {
      action: 'handover';
      sessionId: string;
      incomingCustodianId: string;
      countedCash: number;
      notes?: string | null;
      idempotencyKey: string;
    }
  | {
      action: 'close';
      sessionId: string;
      countedCash: number;
      closingNote?: string | null;
      idempotencyKey: string;
    }
  | {
      action: 'adjustment';
      cashDrawerId: string;
      entryType: 'cash_addition' | 'cash_removal';
      amount: number;
      adjustmentReason: string;
      notes?: string | null;
      idempotencyKey: string;
    };
