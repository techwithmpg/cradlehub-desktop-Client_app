import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContext } from '../src/types/auth';
import type {
  CashierOverviewData,
  PayableOrdersResponseData,
  CashierLedgerResponseData,
  CashierDrawersResponseData,
  DayCloseSummaryData,
  HistoryTabSummary,
} from '../src/types/cashier';
import { CashierWorkspace } from '../src/components/cashier/CashierWorkspace';
import {
  WorkspaceLifecycleProvider,
  WorkspaceModulePresence,
} from '../src/components/workspace';
import * as cashierService from '../src/lib/cashier-service';
import { CashierApiError } from '../src/lib/cashier-service';

vi.mock('../src/lib/cashier-service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../src/lib/cashier-service')>();
  return {
    ...actual,
    fetchCashierOverview: vi.fn(),
    fetchPayableOrders: vi.fn(),
    fetchCashierLedger: vi.fn(),
    fetchCashierDrawers: vi.fn(),
    fetchDayClose: vi.fn(),
    fetchCashierHistory: vi.fn(),
    postRecordPayment: vi.fn(),
    postRecordExpense: vi.fn(),
    postDrawerSessionAction: vi.fn(),
  };
});

const mockAuthContext: AuthContext = {
  userId: 'usr-100',
  email: 'maria@cradlehub.com',
  staffId: 'staff-100',
  fullName: 'Maria Santos',
  canonicalRole: 'crm',
  rawRole: 'csr_staff',
  branchId: 'branch-10',
  branchName: 'Makati Central Branch',
  isCrmEligible: true,
};

const mockOverview: CashierOverviewData = {
  branchId: 'branch-10',
  branchName: 'Makati Central Branch',
  businessDate: '2026-10-23',
  kpis: {
    totalCollected: 25400,
    totalTransactions: 15,
    pendingAmount: 3200,
    pendingBookingsCount: 2,
    cashAmount: 15400,
    cashCount: 10,
    digitalAmount: 10000,
    digitalCount: 5,
    expenseAmount: 1200,
    expenseCount: 2,
  },
  paymentMix: [
    {
      method: 'cash',
      label: 'Cash',
      amount: 15400,
      transactionCount: 10,
      percentage: 60.6,
    },
    {
      method: 'gcash',
      label: 'GCash',
      amount: 10000,
      transactionCount: 5,
      percentage: 39.4,
    },
  ],
  recentPayments: [],
  activeDrawerSession: {
    id: 'sess-1',
    branchId: 'branch-10',
    businessDate: '2026-10-23',
    cashDrawerAccountId: 'acc-drawer-1',
    cashDrawerName: 'Front Desk Drawer #1',
    status: 'open',
    openingFloat: 5000,
    openedBy: 'staff-100',
    openedByName: 'Maria Santos',
    openedAt: '2026-10-23T08:00:00Z',
    expectedCash: 8000,
  },
};

const mockPayableOrders: PayableOrdersResponseData = {
  pendingQueue: [
    {
      id: 'order-101',
      sourceKind: 'booking_order',
      orderNumber: 'ORD-101',
      customerName: 'Juan Dela Cruz',
      customerPhone: '09171234567',
      serviceDescription: 'Aromatherapy Massage',
      totalAmount: 1800,
      amountPaid: 0,
      remainingBalance: 1800,
      bookingDate: '2026-10-23',
      serviceTime: '10:00 AM',
      bookingStatus: 'in_service',
      paymentEligible: true,
      paymentStatus: 'unpaid',
    },
    {
      id: 'order-102',
      sourceKind: 'booking_order',
      orderNumber: 'ORD-102',
      customerName: 'Pedro Penduko',
      serviceDescription: 'Foot Reflexology',
      totalAmount: 1500,
      amountPaid: 0,
      remainingBalance: 1500,
      bookingDate: '2026-10-23',
      serviceTime: '11:00 AM',
      bookingStatus: 'cancelled',
      paymentEligible: false,
      ineligibilityReason: 'Booking was cancelled',
      paymentStatus: 'unpaid',
    },
    {
      id: 'order-103',
      sourceKind: 'booking_order',
      orderNumber: 'ORD-103',
      customerName: 'Ana Reyes',
      serviceDescription: 'Body Scrub',
      totalAmount: 2000,
      amountPaid: 800,
      remainingBalance: 1200,
      bookingDate: '2026-10-23',
      serviceTime: '01:00 PM',
      bookingStatus: 'waiting',
      paymentEligible: true,
      paymentStatus: 'partially_paid',
    },
  ],
  paidAndClosed: [
    {
      id: 'order-100',
      sourceKind: 'booking_order',
      orderNumber: 'ORD-100',
      customerName: 'Maria Clara',
      serviceDescription: 'Swedish Massage',
      totalAmount: 1200,
      amountPaid: 1200,
      remainingBalance: 0,
      bookingDate: '2026-10-23',
      paymentStatus: 'paid',
    },
  ],
  accounts: [
    {
      id: 'acc-drawer-1',
      name: 'Main Cash Drawer',
      accountType: 'cash_drawer',
    },
    {
      id: 'acc-gcash-1',
      name: 'Branch GCash QR',
      accountType: 'gcash',
    },
  ],
  paymentMethods: ['cash', 'gcash'],
};

const mockLedger: CashierLedgerResponseData = {
  kpis: {
    inflow: 25400,
    outflow: 1200,
    netFlow: 24200,
    unreconciledText: 'All items reconciled',
  },
  records: [
    {
      id: 'tx-1',
      dateTime: '2026-10-23 10:15 AM',
      reference: 'TX-20261023-0001',
      customerSource: 'Juan Dela Cruz',
      category: 'payment',
      method: 'cash',
      inflow: 1800,
      outflow: null,
      netEffect: 1800,
      status: 'posted',
    },
  ],
  totalRecords: 1,
  page: 1,
  pageSize: 25,
  totalPages: 1,
  accounts: mockPayableOrders.accounts,
};

const mockDrawers: CashierDrawersResponseData = {
  activeSessions: [mockOverview.activeDrawerSession!],
  availableDrawers: [mockPayableOrders.accounts[0]],
  accounts: mockPayableOrders.accounts,
  expenseCategories: [
    { id: 'cat-1', code: 'supplies', name: 'Supplies' },
    { id: 'cat-2', code: 'repairs', name: 'Repairs' },
  ],
  staffOptions: [
    { id: 'staff-100', name: 'Maria Santos', role: 'cashier' },
    { id: 'staff-101', name: 'Ana Gomez', role: 'cashier' },
  ],
};

const mockDayClose: DayCloseSummaryData = {
  businessDate: '2026-10-23',
  readyForReview: false,
  isBalanced: true,
  lastUpdatedText: 'Just now',
  reconciliationStatus: 'draft',
  expectedCash: 8000,
  actualCash: null,
  cashVariance: null,
  channelVariance: null,
  recordedInflow: 25400,
  recordedOutflow: 1200,
  netPosition: 24200,
  openIssuesCount: 1,
  paymentBreakdown: mockOverview.paymentMix,
  isFinalizationSupported: false,
};

const mockHistory: HistoryTabSummary = {
  closedDaysThisMonth: 12,
  totalInflowThisMonth: 310500,
  totalOutflowThisMonth: 42000,
  reviewExceptions: 0,
  records: [
    {
      id: 'dc-1',
      date: '2026-10-22',
      branchName: 'Makati Central Branch',
      status: 'submitted',
      inflow: 28000,
      outflow: 1500,
      net: 26500,
      reviewedBy: 'Maria Santos',
    },
    {
      id: 'dc-2',
      date: '2026-10-21',
      branchName: 'Makati Central Branch',
      status: 'draft',
      inflow: null,
      outflow: null,
      net: null,
      reviewedBy: null,
    },
  ],
  auditTrail: [],
  isHistoricalSummarySupported: false,
};

async function renderCashierWorkspace() {
  const result = render(
    <WorkspaceLifecycleProvider>
      <WorkspaceModulePresence moduleId="cashier" isActive={true}>
        <CashierWorkspace authContext={mockAuthContext} />
      </WorkspaceModulePresence>
    </WorkspaceLifecycleProvider>,
  );

  await waitFor(() => {
    expect(
      screen.queryByText(/Loading authoritative financial workspace/i),
    ).toBeNull();
  });

  return result;
}

describe('CashierWorkspace Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(cashierService.fetchCashierOverview).mockResolvedValue(
      mockOverview,
    );
    vi.mocked(cashierService.fetchPayableOrders).mockResolvedValue(
      mockPayableOrders,
    );
    vi.mocked(cashierService.fetchCashierLedger).mockResolvedValue(mockLedger);
    vi.mocked(cashierService.fetchCashierDrawers).mockResolvedValue(
      mockDrawers,
    );
    vi.mocked(cashierService.fetchDayClose).mockResolvedValue(mockDayClose);
    vi.mocked(cashierService.fetchCashierHistory).mockResolvedValue(
      mockHistory,
    );
    vi.mocked(cashierService.postRecordPayment).mockResolvedValue({
      success: true,
    });
    vi.mocked(cashierService.postRecordExpense).mockResolvedValue({
      success: true,
    });
    vi.mocked(cashierService.postDrawerSessionAction).mockResolvedValue({
      success: true,
    });
  });

  it('shows unavailable instead of zero totals or Queue Clear after a failed read', async () => {
    vi.mocked(cashierService.fetchCashierOverview).mockRejectedValue(
      new Error('Cashier endpoint unavailable'),
    );
    await renderCashierWorkspace();
    expect(screen.getByText(/Cashier data is unavailable/)).toBeDefined();
    expect(screen.queryByText('Queue Clear')).toBeNull();
    expect(screen.queryByTestId('cashier-kpi-total-collected')).toBeNull();
  });

  it.each([
    ['ledger', 'Ledger', 'fetchCashierLedger'],
    ['drawers', 'Cash Drawer', 'fetchCashierDrawers'],
    ['day-close', 'Day Close', 'fetchDayClose'],
    ['history', 'History', 'fetchCashierHistory'],
  ] as const)(
    'keeps %s unavailable when its authoritative read fails',
    async (tab, label, service) => {
      const user = userEvent.setup();
      await renderCashierWorkspace();
      vi.mocked(cashierService[service]).mockRejectedValueOnce(
        new Error(`${label} endpoint unavailable`),
      );
      await user.click(screen.getByRole('tab', { name: label }));
      await waitFor(() =>
        expect(
          screen.getAllByText(new RegExp(`${label} endpoint unavailable`))
            .length,
        ).toBeGreaterThan(0),
      );
      if (tab === 'history') {
        expect(
          screen.getByTestId('cashier-kpi-history-days').textContent,
        ).toContain('Unavailable');
      } else {
        expect(screen.getByText(/Cashier data is unavailable/)).toBeDefined();
      }
      expect(screen.queryByText('₱0')).toBeNull();
    },
  );

  it('renders header, title, badges, and tab strip', async () => {
    await renderCashierWorkspace();

    expect(screen.getByTestId('cashier-workspace')).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cashier' }),
    ).toBeDefined();
    expect(
      screen.getAllByText(/Makati Central Branch/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2026-10-23')).toBeDefined();
    expect(screen.getByText('Maria Santos')).toBeDefined();

    // 5 tabs present
    expect(screen.getByRole('tab', { name: /today/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /ledger/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /cash drawer/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /day close/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /history/i })).toBeDefined();
  });

  it('renders Today tab with KPIs and Pending Payment Queue', async () => {
    await renderCashierWorkspace();

    expect(screen.getByText('Total Collected Today')).toBeDefined();

    // Check KPIs
    expect(screen.getByText('₱25,400')).toBeDefined();
    expect(screen.getByText('Juan Dela Cruz')).toBeDefined();
    expect(screen.getByText('Aromatherapy Massage')).toBeDefined();
    expect(screen.getByText('₱1,800')).toBeDefined();
  });

  it('opens Record Payment Modal from pending queue and submits payment', async () => {
    const user = userEvent.setup();
    await renderCashierWorkspace();

    expect(screen.getByText('Juan Dela Cruz')).toBeDefined();

    // Click Record Payment button for Juan Dela Cruz in pending queue
    const payBtn = screen.getAllByRole('button', {
      name: /record payment/i,
    })[0]!;
    await user.click(payBtn);

    // Modal opens
    const modal = await screen.findByRole('dialog');

    expect(within(modal).getByText('Juan Dela Cruz')).toBeDefined();
    expect(within(modal).getByDisplayValue('1800')).toBeDefined();

    // Select GCash method in dropdown
    const methodSelect = within(modal).getByLabelText(/payment method/i);
    await user.selectOptions(methodSelect, 'gcash');

    // Submit payment inside the modal
    const confirmBtn = within(modal).getByRole('button', {
      name: /^record payment$/i,
    });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(cashierService.postRecordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-101',
          payments: expect.arrayContaining([
            expect.objectContaining({
              amount: 1800,
              paymentMethod: 'gcash',
            }),
          ]),
        }),
      );
    });
  });

  it('opens Record Expense Modal and submits expense', async () => {
    const user = userEvent.setup();
    await renderCashierWorkspace();

    // Click Record Expense quick action
    await user.click(screen.getByRole('button', { name: /record expense/i }));

    const modal = await screen.findByRole('dialog');

    // Type amount
    const amountInput = within(modal).getByLabelText(/amount/i);
    await user.type(amountInput, '450');

    // Type description
    const descInput = within(modal).getByLabelText(/description/i);
    await user.type(descInput, 'Massage oils restock');

    // Submit expense inside the modal
    const submitBtn = within(modal).getByRole('button', {
      name: /^record expense$/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(cashierService.postRecordExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 450,
          description: 'Massage oils restock',
        }),
      );
    });
  });

  it('switches to Ledger tab and displays transactions and summary', async () => {
    const user = userEvent.setup();
    await renderCashierWorkspace();

    await user.click(screen.getByRole('tab', { name: /ledger/i }));

    await waitFor(() => {
      expect(cashierService.fetchCashierLedger).toHaveBeenCalled();
      expect(screen.getByText('TX-20261023-0001')).toBeDefined();
      expect(screen.getByText('Juan Dela Cruz')).toBeDefined();
    });
  });

  it('switches to Cash Drawer tab and displays active drawer session with digital separation note', async () => {
    const user = userEvent.setup();
    await renderCashierWorkspace();

    await user.click(screen.getByRole('tab', { name: /cash drawer/i }));

    await waitFor(() => {
      expect(cashierService.fetchCashierDrawers).toHaveBeenCalled();
      expect(screen.getByText('Front Desk Drawer #1')).toBeDefined();
      expect(
        screen.getByText(/Physical Cash vs. Digital Inflows Isolation/i),
      ).toBeDefined();
      expect(screen.getByRole('button', { name: /handover/i })).toBeDefined();
      expect(
        screen.getByRole('button', { name: /close session/i }),
      ).toBeDefined();
    });
  });

  it('switches to Day Close tab and displays disabled Close Day button with contract explanation', async () => {
    const user = userEvent.setup();
    await renderCashierWorkspace();

    await user.click(screen.getByRole('tab', { name: /day close/i }));

    await waitFor(() => {
      expect(cashierService.fetchDayClose).toHaveBeenCalled();
      expect(screen.getByText(/Day Close & Reconciliation/i)).toBeDefined();
    });

    // Close Day button must be disabled because isFinalizationSupported is false
    const closeDayBtn = screen.getByRole('button', { name: /close day/i });
    expect(closeDayBtn.getAttribute('disabled')).not.toBeNull();
    expect(
      screen.getByText(
        /Full Business Day Finalization Unsupported by Server Contract/i,
      ),
    ).toBeDefined();
  });

  it('switches to History tab and displays truthful history state', async () => {
    const user = userEvent.setup();
    await renderCashierWorkspace();

    await user.click(screen.getByRole('tab', { name: /history/i }));

    await waitFor(() => {
      expect(cashierService.fetchCashierHistory).toHaveBeenCalled();
      expect(screen.getByText('Closed Days (This Month)')).toBeDefined();
      expect(screen.getByText('2026-10-22')).toBeDefined();
      expect(screen.getAllByText('Unavailable').length).toBeGreaterThanOrEqual(
        1,
      );
    });
  });

  it('preserves idempotency key and locks inputs across retry when payment submission fails ambiguously', async () => {
    const user = userEvent.setup();
    const mockPostPayment = vi.mocked(cashierService.postRecordPayment);
    // First attempt rejects with ambiguous network/server error
    mockPostPayment.mockRejectedValueOnce(
      new CashierApiError('Network connection timeout', {
        isAmbiguous: true,
        isNetworkError: true,
      }),
    );
    // Second attempt succeeds
    mockPostPayment.mockResolvedValueOnce({ success: true });

    await renderCashierWorkspace();

    const payBtn = screen.getAllByRole('button', {
      name: /record payment/i,
    })[0]!;
    await user.click(payBtn);

    const modal = await screen.findByRole('dialog');
    const confirmBtn = within(modal).getByRole('button', {
      name: /^record payment$/i,
    });
    const amountInput = within(modal).getByLabelText(
      /amount received/i,
    ) as HTMLInputElement;

    // First click: fails ambiguously
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(
        within(modal).getByText(/network connection timeout/i),
      ).toBeDefined();
      expect(
        within(modal).getByText(
          /form inputs are locked to preserve financial idempotency/i,
        ),
      ).toBeDefined();
    });

    // Form inputs must be disabled to prevent conflicting edits
    expect(amountInput.disabled).toBe(true);

    expect(mockPostPayment).toHaveBeenCalledTimes(1);
    const firstCallPayload = mockPostPayment.mock.calls[0]![0];
    const initialKey = firstCallPayload.idempotencyKey;
    expect(initialKey).toBeDefined();

    // Retry button appears with clear instruction
    const retryBtn = within(modal).getByRole('button', {
      name: /retry original submission/i,
    });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(mockPostPayment).toHaveBeenCalledTimes(2);
    });

    const secondCallPayload = mockPostPayment.mock.calls[1]![0];
    expect(secondCallPayload.idempotencyKey).toBe(initialKey);
  });

  it('generates a fresh idempotency key when user modifies fields after definitive failure', async () => {
    const user = userEvent.setup();
    const mockPostPayment = vi.mocked(cashierService.postRecordPayment);
    // Definitive server rejection (400 Bad Request)
    mockPostPayment.mockRejectedValueOnce(
      new CashierApiError('Specified financial account is inactive', {
        isAmbiguous: false,
        status: 400,
      }),
    );
    mockPostPayment.mockResolvedValueOnce({ success: true });

    await renderCashierWorkspace();

    const payBtn = screen.getAllByRole('button', {
      name: /record payment/i,
    })[0]!;
    await user.click(payBtn);

    const modal = await screen.findByRole('dialog');
    const confirmBtn = within(modal).getByRole('button', {
      name: /^record payment$/i,
    });
    const amountInput = within(modal).getByLabelText(
      /amount received/i,
    ) as HTMLInputElement;

    // First submission: fails definitively
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(
        within(modal).getByText(/specified financial account is inactive/i),
      ).toBeDefined();
    });

    const firstKey = mockPostPayment.mock.calls[0]![0].idempotencyKey;

    // Inputs must NOT be locked on definitive rejection so user can fix details
    expect(amountInput.disabled).toBe(false);

    // User modifies amount
    await user.clear(amountInput);
    await user.type(amountInput, '1500');

    // Submit button is back to "Record Payment"
    const submitAgainBtn = within(modal).getByRole('button', {
      name: /^record payment$/i,
    });
    await user.click(submitAgainBtn);

    await waitFor(() => {
      expect(mockPostPayment).toHaveBeenCalledTimes(2);
    });

    const secondCallPayload = mockPostPayment.mock.calls[1]![0];
    // Rule 5: Never retry a changed payload using the old key
    expect(secondCallPayload.idempotencyKey).not.toBe(firstKey);
    expect(secondCallPayload.payments[0]!.amount).toBe(1500);
  });

  it('handles workspace refresh failure safely without allowing duplicate payment resubmission', async () => {
    const user = userEvent.setup();
    const mockPostPayment = vi.mocked(cashierService.postRecordPayment);
    // Financial mutation succeeds
    mockPostPayment.mockResolvedValueOnce({ success: true });

    await renderCashierWorkspace();

    // Background refresh after payment rejects
    vi.mocked(cashierService.fetchPayableOrders).mockRejectedValueOnce(
      new Error('Failed to refresh payable queue'),
    );

    const payBtn = screen.getAllByRole('button', {
      name: /record payment/i,
    })[0]!;
    await user.click(payBtn);

    const modal = await screen.findByRole('dialog');
    const confirmBtn = within(modal).getByRole('button', {
      name: /^record payment$/i,
    });

    await user.click(confirmBtn);

    await waitFor(() => {
      expect(
        within(modal).getByText(
          /payment was successfully posted to the ledger, but updating the local view failed/i,
        ),
      ).toBeDefined();
      expect(
        within(modal).getByText(/do not record payment again/i),
      ).toBeDefined();
    });

    // Rule 7: If posting succeeded but UI refresh failed, do not invite another payment
    expect(
      within(modal).queryByRole('button', { name: /^record payment$/i }),
    ).toBeNull();
    const closeBtn = within(modal).getByRole('button', {
      name: /close \(payment confirmed\)/i,
    });
    expect(closeBtn).toBeDefined();
  });

  it('distinguishes payable, ineligible, partially paid and fully settled orders with truthful lifecycle badges', async () => {
    await renderCashierWorkspace();

    // 1. Payable order (ORD-101): In Service, Record Payment button is enabled
    expect(screen.getByText('ORD-101')).toBeDefined();
    expect(screen.getByText('In Service')).toBeDefined();
    const recordButtons = screen.getAllByRole('button', {
      name: /^record payment$/i,
    });
    expect((recordButtons[0] as HTMLButtonElement).disabled).toBe(false);

    // 2. Ineligible order (ORD-102): Cancelled, Record Payment button is disabled with explanation
    expect(screen.getByText('ORD-102')).toBeDefined();
    expect(screen.getByText('Cancelled')).toBeDefined();
    expect(screen.getByText('Booking was cancelled')).toBeDefined();
    expect((recordButtons[1] as HTMLButtonElement).disabled).toBe(true);

    // 3. Partially paid order (ORD-103): Waiting, Partial badge
    expect(screen.getByText('ORD-103')).toBeDefined();
    expect(screen.getByText('Waiting')).toBeDefined();
    expect(screen.getByText('Partial (₱800)')).toBeDefined();
    expect((recordButtons[2] as HTMLButtonElement).disabled).toBe(false);

    // 4. Fully settled order (ORD-100): in Paid & Closed table
    expect(screen.getByText('ORD-100')).toBeDefined();
    expect(screen.getByText('Maria Clara')).toBeDefined();
    expect(screen.getByText('Paid')).toBeDefined();
  });

  it('validates partial payments and prevents payment amounts exceeding remaining balance', async () => {
    const user = userEvent.setup();
    await renderCashierWorkspace();

    const payBtn = screen.getAllByRole('button', {
      name: /record payment/i,
    })[0]!;
    await user.click(payBtn);

    const modal = await screen.findByRole('dialog');
    const amountInput = within(modal).getByLabelText(/amount received/i);

    // Overpayment attempt: enter 2500 when balance is 1800
    await user.clear(amountInput);
    await user.type(amountInput, '2500');

    const confirmBtn = within(modal).getByRole('button', {
      name: /^record payment$/i,
    });
    await user.click(confirmBtn);

    expect(
      within(modal).getByText(/cannot exceed the remaining balance of ₱1,800/i),
    ).toBeDefined();

    // Partial payment: enter 1000
    await user.clear(amountInput);
    await user.type(amountInput, '1000');

    expect(
      within(modal).getByText(
        /Partial payment: ₱800 will remain in the pending payment queue/i,
      ),
    ).toBeDefined();
  });

  it('disables Print Receipt in Today tab with not supported notice', async () => {
    await renderCashierWorkspace();
    const printBtn = screen.getByRole('button', { name: /print receipt/i });
    expect(printBtn).toBeDefined();
    expect((printBtn as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/not supported/i)).toBeDefined();
  });

  it('renders History tab with truthful unavailable states, nullable monetary amounts, and preserved statuses', async () => {
    const user = userEvent.setup();
    await renderCashierWorkspace();

    const historyTab = screen.getByRole('tab', { name: /history/i });
    await user.click(historyTab);

    // Shows informative banner
    expect(
      screen.getByText(
        /Historical monthly aggregates, finalization logs and multi-day closing audits are pending server contract support/i,
      ),
    ).toBeDefined();

    // Renders "Unavailable" for monthly aggregates
    expect(screen.getAllByText('Unavailable')).toHaveLength(4);

    // Record 1 (dc-1): verified posted figures and actual submitted status
    const table = screen.getByRole('table');
    expect(within(table).getByText('2026-10-22')).toBeDefined();
    expect(within(table).getByText('₱28,000')).toBeDefined();
    expect(within(table).getByText('₱1,500')).toBeDefined();
    expect(within(table).getByText('₱26,500')).toBeDefined();
    expect(within(table).getByText('submitted')).toBeDefined();
    expect(within(table).getByText('Maria Santos')).toBeDefined();

    // Record 2 (dc-2): unverified figures rendered truthfully as '—', status 'draft', reviewer 'Not recorded'
    expect(screen.getByText('2026-10-21')).toBeDefined();
    expect(screen.getByText('draft')).toBeDefined();
    expect(screen.getByText('Not recorded')).toBeDefined();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('handles historical query errors truthfully rather than treating failure as empty success', async () => {
    const user = userEvent.setup();
    vi.mocked(cashierService.fetchCashierHistory).mockRejectedValueOnce(
      new Error('Authoritative audit connection timed out'),
    );

    await renderCashierWorkspace();

    const historyTab = screen.getByRole('tab', { name: /history/i });
    await user.click(historyTab);

    await waitFor(() => {
      expect(
        screen.getByText(
          /failed to retrieve historical day-close data: Authoritative audit connection timed out/i,
        ),
      ).toBeDefined();
      expect(
        screen.getByText(/failed to load historical reconciliation records/i),
      ).toBeDefined();
    });

    // Does NOT render false-empty message
    expect(
      screen.queryByText(
        /no historical reconciliation records available for this branch/i,
      ),
    ).toBeNull();
  });
});
