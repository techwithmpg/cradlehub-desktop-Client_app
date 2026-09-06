import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  fetchBranchCustomers,
  fetchCustomerDetail,
} from '../src/lib/customers-service';
import * as bookingsService from '../src/lib/bookings-service';
import * as supabaseModule from '../src/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('customers-service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchBranchCustomers', () => {
    it('returns API_CONFIG_REQUIRED when hosted API URL is not configured', async () => {
      vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue(null);
      const res = await fetchBranchCustomers({ branchId: 'branch-1' });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('API_CONFIG_REQUIRED');
      }
    });

    it('returns AUTH_SESSION_REQUIRED when active session is missing', async () => {
      vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue(
        'https://www.cradlewellnessliving.com',
      );
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
      } as unknown as SupabaseClient;
      vi.spyOn(supabaseModule, 'getSupabaseClient').mockReturnValue(
        mockSupabase,
      );

      const res = await fetchBranchCustomers({ branchId: 'branch-1' });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('AUTH_SESSION_REQUIRED');
      }
    });

    it('sends Authorization Bearer header and correct query parameters', async () => {
      vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue(
        'https://www.cradlewellnessliving.com',
      );
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'valid-test-token' } },
          }),
        },
      } as unknown as SupabaseClient;
      vi.spyOn(supabaseModule, 'getSupabaseClient').mockReturnValue(
        mockSupabase,
      );

      let requestedUrl = '';
      let requestedHeaders: Record<string, string> = {};

      const mockFetch = vi.fn(
        async (url: RequestInfo | URL, init?: RequestInit) => {
          requestedUrl = String(url);
          requestedHeaders = (init?.headers as Record<string, string>) || {};
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              tab: 'repeat',
              data: [
                {
                  id: 'c-1',
                  fullName: 'Maria Santos',
                  phone: '09171234567',
                  email: 'maria@test.ph',
                  totalBookings: 3,
                  firstBookingDate: '2026-01-10',
                  lastBookingDate: '2026-03-01',
                  preferredStaffId: 's-1',
                  preferredStaffName: 'Ana Therapist',
                },
              ],
              waitlist: [],
              kpis: {
                totalCustomers: 1,
                repeatClients: 1,
                lapsedClients: 0,
                newThisMonth: 0,
                totalVisits: 3,
              },
              pagination: {
                page: 1,
                pageSize: 25,
                totalCount: 1,
                totalPages: 1,
              },
            }),
          } as unknown as Response;
        },
      );

      const res = await fetchBranchCustomers(
        {
          branchId: 'branch-1',
          tab: 'repeat',
          q: 'Maria',
          page: 1,
          pageSize: 25,
        },
        mockFetch as unknown as typeof fetch,
      );

      expect(res.ok).toBe(true);
      expect(requestedUrl).toContain('branchId=branch-1');
      expect(requestedUrl).toContain('tab=repeat');
      expect(requestedUrl).toContain('q=Maria');
      expect(requestedUrl).toContain('page=1');
      expect(requestedUrl).toContain('pageSize=25');
      expect(requestedHeaders['Authorization']).toBe('Bearer valid-test-token');

      if (res.ok) {
        expect(res.data).toHaveLength(1);
        expect(res.data[0].fullName).toBe('Maria Santos');
      }
    });

    it('handles 401 and 403 errors appropriately', async () => {
      vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue(
        'https://www.cradlewellnessliving.com',
      );
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
          }),
        },
      } as unknown as SupabaseClient;
      vi.spyOn(supabaseModule, 'getSupabaseClient').mockReturnValue(
        mockSupabase,
      );

      const mockFetch403 = vi.fn(async () => {
        return {
          ok: false,
          status: 403,
          json: async () => ({
            ok: false,
            code: 'FORBIDDEN',
            message: 'You do not have access to this branch.',
          }),
        } as unknown as Response;
      });

      const res = await fetchBranchCustomers(
        { branchId: 'branch-other' },
        mockFetch403 as unknown as typeof fetch,
      );

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('FORBIDDEN');
        expect(res.message).toBe('You do not have access to this branch.');
      }
    });

    it('handles network failures gracefully', async () => {
      vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue(
        'https://www.cradlewellnessliving.com',
      );
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
          }),
        },
      } as unknown as SupabaseClient;
      vi.spyOn(supabaseModule, 'getSupabaseClient').mockReturnValue(
        mockSupabase,
      );

      const mockFetchNetworkError = vi.fn(async () => {
        throw new Error('Connection refused');
      });

      const res = await fetchBranchCustomers(
        { branchId: 'branch-1' },
        mockFetchNetworkError as unknown as typeof fetch,
      );

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('NETWORK_ERROR');
      }
    });

    it('handles malformed JSON responses', async () => {
      vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue(
        'https://www.cradlewellnessliving.com',
      );
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
          }),
        },
      } as unknown as SupabaseClient;
      vi.spyOn(supabaseModule, 'getSupabaseClient').mockReturnValue(
        mockSupabase,
      );

      const mockFetchInvalidJson = vi.fn(async () => {
        return {
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        } as unknown as Response;
      });

      const res = await fetchBranchCustomers(
        { branchId: 'branch-1' },
        mockFetchInvalidJson as unknown as typeof fetch,
      );

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('RESPONSE_PARSE_ERROR');
      }
    });
  });

  describe('fetchCustomerDetail', () => {
    it('fetches customer detail profile and booking history', async () => {
      vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue(
        'https://www.cradlewellnessliving.com',
      );
      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
          }),
        },
      } as unknown as SupabaseClient;
      vi.spyOn(supabaseModule, 'getSupabaseClient').mockReturnValue(
        mockSupabase,
      );

      const mockFetch = vi.fn(async (url: RequestInfo | URL) => {
        expect(String(url)).toContain(
          '/api/desktop/v1/customers/c-123?branchId=branch-1',
        );
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            customer: {
              id: 'c-123',
              fullName: 'Juan Dela Cruz',
              phone: '09181234567',
              email: 'juan@cradlehub.test',
              totalBookings: 5,
              firstBookingDate: '2025-05-15',
              lastBookingDate: '2026-02-20',
              preferredStaffId: 's-1',
              preferredStaffName: 'Elena Therapist',
              preferredVisitType: 'In-Spa',
              pressurePreference: 'Medium-Firm',
              birthday: '1990-08-12',
              notes: 'Prefers quiet sessions.',
              healthNotes: 'No allergies.',
              loyaltyTier: null,
            },
            bookingHistory: [
              {
                id: 'b-1',
                bookingDate: '2026-02-20',
                startTime: '14:00',
                status: 'completed',
                type: 'in_spa',
                deliveryType: 'in_spa',
                serviceName: 'Deep Tissue Massage',
                staffName: 'Elena Therapist',
                branchName: 'Main Branch',
              },
            ],
          }),
        } as unknown as Response;
      });

      const res = await fetchCustomerDetail(
        'c-123',
        'branch-1',
        mockFetch as unknown as typeof fetch,
      );

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.customer.fullName).toBe('Juan Dela Cruz');
        expect(res.customer.pressurePreference).toBe('Medium-Firm');
        expect(res.bookingHistory).toHaveLength(1);
        expect(res.bookingHistory[0].serviceName).toBe('Deep Tissue Massage');
      }
    });
  });
});
