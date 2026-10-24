import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCashierOverview,
  fetchPayableOrders,
  fetchCashierLedger,
  fetchCashierDrawers,
  fetchDayClose,
  fetchCashierHistory,
  postRecordPayment,
  postRecordExpense,
  postDrawerSessionAction,
} from '../src/lib/cashier-service';
import * as bookingsService from '../src/lib/bookings-service';

function createMockSupabaseClient(
  token: string | null = 'test-bearer-token',
): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: token ? { access_token: token } : null,
        },
        error: null,
      }),
    },
  } as unknown as SupabaseClient;
}

function mockJsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Cashier Service (Desktop API Client)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue(
      'https://hosted.cradlehub.test',
    );
  });

  describe('Session & Configuration Validation', () => {
    it('throws error if session token is missing', async () => {
      const mockClient = createMockSupabaseClient(null);

      await expect(
        fetchCashierOverview(mockClient, vi.fn() as unknown as typeof fetch),
      ).rejects.toThrow(
        'Your session has expired. Sign in again to access Cashier.',
      );
    });

    it('throws error if hosted API base URL is missing', async () => {
      vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue('');
      const mockClient = createMockSupabaseClient();

      await expect(
        fetchCashierOverview(mockClient, vi.fn() as unknown as typeof fetch),
      ).rejects.toThrow(
        'Cashier service is not configured for this desktop installation.',
      );
    });

    it('throws friendly error on network connection failure', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      await expect(
        fetchCashierOverview(mockClient, mockFetch as unknown as typeof fetch),
      ).rejects.toThrow(
        'Cashier requires a connection. Please check your network and try again.',
      );
    });
  });

  describe('fetchCashierOverview', () => {
    it('fetches and validates overview data successfully', async () => {
      const mockClient = createMockSupabaseClient();
      const validOverview = {
        branchId: 'branch-1',
        branchName: 'Main Branch',
        businessDate: '2026-10-23',
        kpis: {
          totalCollected: 25400,
          pendingPaymentsCount: 3,
          pendingPaymentsAmount: 4500,
          totalExpenses: 1200,
          netCashFlow: 24200,
          activeDrawerCash: 8000,
        },
        paymentMix: [
          {
            method: 'cash',
            label: 'Cash',
            count: 12,
            amount: 15400,
            percentage: 60.6,
          },
          {
            method: 'gcash',
            label: 'GCash',
            count: 5,
            amount: 10000,
            percentage: 39.4,
          },
        ],
        activeDrawerSession: null,
      };

      const mockFetch = vi
        .fn()
        .mockResolvedValue(mockJsonResponse(validOverview));

      const result = await fetchCashierOverview(
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hosted.cradlehub.test/api/desktop/v1/cashier/overview',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-bearer-token',
            Accept: 'application/json',
          }),
        }),
      );
      expect(result.branchId).toBe('branch-1');
      expect(result.kpis.totalCollected).toBe(25400);
    });

    it('rejects if server returns malformed data structure', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi
        .fn()
        .mockResolvedValue(mockJsonResponse({ invalidField: true }));

      await expect(
        fetchCashierOverview(mockClient, mockFetch as unknown as typeof fetch),
      ).rejects.toThrow();
    });
  });

  describe('fetchPayableOrders', () => {
    it('fetches payable orders and accounts correctly', async () => {
      const mockClient = createMockSupabaseClient();
      const validPayable = {
        pendingQueue: [
          {
            orderId: 'order-1',
            bookingId: 'booking-1',
            customerName: 'Juan Dela Cruz',
            customerPhone: '09171234567',
            serviceName: 'Deep Tissue Massage',
            staffName: 'Staff Ana',
            bookingDate: '2026-10-23',
            startTime: '10:00:00',
            totalAmount: 1500,
            paidAmount: 0,
            balanceDue: 1500,
            currency: 'PHP',
            status: 'confirmed',
            deliveryType: 'in_spa',
          },
        ],
        paidAndClosed: [],
        accounts: [
          {
            id: 'acc-1',
            code: 'CASH-01',
            name: 'Front Desk Cash Drawer',
            accountType: 'cash_drawer',
            currency: 'PHP',
            isActive: true,
            isDigital: false,
          },
        ],
        paymentMethods: [
          {
            method: 'cash',
            label: 'Cash',
            accountId: 'acc-1',
            isDigital: false,
          },
        ],
      };

      const mockFetch = vi
        .fn()
        .mockResolvedValue(mockJsonResponse(validPayable));

      const result = await fetchPayableOrders(
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(result.pendingQueue).toHaveLength(1);
      expect(result.pendingQueue[0].customerName).toBe('Juan Dela Cruz');
      expect(result.accounts).toHaveLength(1);
    });
  });

  describe('fetchCashierLedger', () => {
    it('appends filters to query string', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi.fn().mockResolvedValue(
        mockJsonResponse({
          kpis: { totalInflows: 1000, totalOutflows: 200, netFlow: 800 },
          records: [],
          totalRecords: 0,
          page: 1,
          pageSize: 25,
          totalPages: 1,
        }),
      );

      await fetchCashierLedger(
        { search: 'Juan', category: 'payment', page: 2, pageSize: 15 },
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/desktop/v1/cashier/ledger?search=Juan&category=payment&page=2&pageSize=15',
        ),
        expect.anything(),
      );
    });
  });

  describe('fetchCashierDrawers', () => {
    it('fetches drawer sessions and options successfully', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi.fn().mockResolvedValue(
        mockJsonResponse({
          activeSessions: [],
          availableDrawers: [],
          accounts: [],
          expenseCategories: ['supplies', 'repairs'],
          staffOptions: [],
        }),
      );

      const result = await fetchCashierDrawers(
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(result.expenseCategories).toContain('supplies');
    });
  });

  describe('fetchDayClose', () => {
    it('fetches day-close summary and confirms isFinalizationSupported is false', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi.fn().mockResolvedValue(
        mockJsonResponse({
          businessDate: '2026-10-23',
          isFinalizationSupported: false,
          grossSales: 15000,
          totalDiscounts: 0,
          netSales: 15000,
          totalCollected: 15000,
          totalExpenses: 500,
          netCash: 14500,
          paymentBreakdown: [],
          unsettledBookingsCount: 0,
          unsettledAmount: 0,
        }),
      );

      const result = await fetchDayClose(
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(result.businessDate).toBe('2026-10-23');
      expect(result.isFinalizationSupported).toBe(false);
    });
  });

  describe('fetchCashierHistory', () => {
    it('fetches history summary records successfully', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi.fn().mockResolvedValue(
        mockJsonResponse({
          closedDaysThisMonth: 14,
          totalInflowThisMonth: 320000,
          totalOutflowThisMonth: 45000,
          reviewExceptions: 0,
          records: [],
          auditTrail: [],
        }),
      );

      const result = await fetchCashierHistory(
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(result.closedDaysThisMonth).toBe(14);
      expect(result.totalInflowThisMonth).toBe(320000);
    });
  });

  describe('Mutations: Payments, Expenses, and Drawers', () => {
    it('posts record payment with expected body', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          mockJsonResponse({ paymentId: 'pay-1', success: true }),
        );

      const payload = {
        orderId: 'order-1',
        idempotencyKey: 'idemp-1',
        payments: [
          {
            amount: 1500,
            paymentMethod: 'cash',
            financialAccountId: 'acc-1',
            referenceNumber: 'RCPT-1001',
          },
        ],
        notes: null,
      };

      const result = await postRecordPayment(
        payload,
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hosted.cradlehub.test/api/desktop/v1/cashier/payments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      );
      expect(result.paymentId).toBe('pay-1');
    });

    it('posts record expense with expected body', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          mockJsonResponse({ expenseId: 'exp-1', success: true }),
        );

      const payload = {
        categoryId: 'cat-1',
        financialAccountId: 'acc-1',
        amount: 350,
        payee: 'Clean Co',
        description: 'Towels and detergent',
        businessDate: '2026-10-23',
        notes: null,
        idempotencyKey: 'idemp-2',
      };

      const result = await postRecordExpense(
        payload,
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hosted.cradlehub.test/api/desktop/v1/cashier/expenses',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      );
      expect(result.expenseId).toBe('exp-1');
    });

    it('posts drawer session action (open, handover, close, adjustment)', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          mockJsonResponse({ sessionId: 'sess-1', success: true }),
        );

      const payload = {
        action: 'open' as const,
        cashDrawerAccountId: 'acc-1',
        openingFloat: 5000,
        openingNote: 'Starting float',
        idempotencyKey: 'idemp-3',
      };

      const result = await postDrawerSessionAction(
        payload,
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hosted.cradlehub.test/api/desktop/v1/cashier/drawers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      );
      expect(result.sessionId).toBe('sess-1');
    });
  });
});
