import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchOperationsCenterData,
  assignServiceProvider,
  resolveAttendanceException,
  generateDeviceRecovery,
  filterOperationsIssues,
  filterOperationsScans,
} from '../src/lib/operations-service';
import * as bookingsService from '../src/lib/bookings-service';
import type { OperationsCenterData } from '../src/types/operations';

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

function mockErrorResponse(message: string, status = 400, code = 'ERROR') {
  return new Response(JSON.stringify({ ok: false, error: message, code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const mockOperationsData: OperationsCenterData = {
  branchId: 'b-1',
  branchName: 'Main Branch',
  checkedAt: '2026-10-25T08:00:00Z',
  issues: [
    {
      id: 'issue-1',
      area: 'configuration',
      severity: 'critical',
      resolutionState: 'detected',
      title: 'Prenatal Massage has no qualified providers',
      description:
        'Active service has 0 qualified providers assigned in this branch.',
      guidance: 'Assign an active, qualified therapist to this service.',
      actionLabel: 'Assign Provider',
      actionHref: '/admin/services',
      code: 'UNQUALIFIED_SERVICE',
      scanIdSuffix: null,
      detectedAt: '2026-10-25T07:30:00Z',
      serviceId: 'srv-1',
      serviceName: 'Prenatal Massage',
      resolutionKind: 'provider_assignment',
    },
    {
      id: 'issue-2',
      area: 'attendance',
      severity: 'warning',
      resolutionState: 'under_review',
      title: 'Device limit reached for staff member',
      description: 'Elena Rostova registered maximum allowable mobile devices.',
      guidance: 'Issue an authoritative replacement device activation link.',
      actionLabel: 'Recover Device',
      actionHref: '/admin/devices',
      code: 'DEVICE_LIMIT_REACHED',
      scanIdSuffix: '7A8B',
      detectedAt: '2026-10-25T07:45:00Z',
      staffId: 'staff-elena',
      staffName: 'Elena Rostova',
      resolutionKind: 'device_recovery',
    },
  ],
  scans: [
    {
      id: 'scan-1',
      staffId: 'staff-elena',
      staffName: 'Elena Rostova',
      reasonCode: 'DEVICE_LIMIT_REACHED',
      message: 'Staff phone was rejected because device limit was reached.',
      scanIdSuffix: '7A8B',
      occurredAt: '2026-10-25T07:45:00Z',
      isUnresolvedFailure: true,
    },
  ],
  attendanceAvailable: true,
  configurationAvailable: true,
  staffAvailable: true,
  branchStaff: [
    {
      id: 'staff-elena',
      full_name: 'Elena Rostova',
      system_role: 'staff',
      staff_type: 'therapist',
      is_active: true,
      branch_id: 'b-1',
      hasLoginAccount: true,
      isIdentityVerified: true,
    },
  ],
  counts: {
    critical: 1,
    warning: 1,
    info: 0,
    attendance: 1,
    staff: 0,
    configuration: 1,
    unresolvedScans: 1,
    totalIssues: 2,
  },
  readyLabel: 'Attention Required',
  operatorRole: 'manager',
  canPerformMutations: true,
};

describe('Operations Center Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue(
      'https://hosted.cradlehub.test',
    );
  });

  describe('fetchOperationsCenterData', () => {
    it('throws error when session token is missing', async () => {
      const mockClient = createMockSupabaseClient(null);
      await expect(
        fetchOperationsCenterData(
          mockClient,
          vi.fn() as unknown as typeof fetch,
        ),
      ).rejects.toThrow(
        'Your session has expired. Sign in again to access Operations Center.',
      );
    });

    it('throws error when hosted API base URL is missing', async () => {
      vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue('');
      const mockClient = createMockSupabaseClient();
      await expect(
        fetchOperationsCenterData(
          mockClient,
          vi.fn() as unknown as typeof fetch,
        ),
      ).rejects.toThrow(
        'Operations Center is not configured for this desktop installation.',
      );
    });

    it('fetches and returns validated OperationsCenterData', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi
        .fn()
        .mockResolvedValue(mockJsonResponse(mockOperationsData));

      const result = await fetchOperationsCenterData(
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hosted.cradlehub.test/api/desktop/v1/operations-center',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-bearer-token',
          }),
        }),
      );
      expect(result.branchId).toBe('b-1');
      expect(result.counts.critical).toBe(1);
      expect(result.issues).toHaveLength(2);
      expect(result.scans).toHaveLength(1);
    });

    it('throws error on server error response', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          mockErrorResponse('Branch staff authorization missing', 403),
        );

      await expect(
        fetchOperationsCenterData(
          mockClient,
          mockFetch as unknown as typeof fetch,
        ),
      ).rejects.toThrow('Branch staff authorization missing');
    });

    it('classifies a non-JSON Operations Center 404 without leaking the response', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response('private server content', {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }),
      );
      await expect(
        fetchOperationsCenterData(
          createMockSupabaseClient(),
          mockFetch as unknown as typeof fetch,
        ),
      ).rejects.toMatchObject({
        code: 'HOSTED_API_NON_JSON_RESPONSE',
        status: 404,
        message: expect.stringContaining('Operations Center endpoint'),
      });
    });

    it('classifies network timeouts without exposing the transport error', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new Error('token=private timeout'));
      await expect(
        fetchOperationsCenterData(
          createMockSupabaseClient(),
          mockFetch as unknown as typeof fetch,
        ),
      ).rejects.toMatchObject({
        isNetworkError: true,
        isAmbiguous: true,
        message: expect.stringContaining('requires a connection'),
      });
    });
  });

  describe('assignServiceProvider mutation', () => {
    it('sends assignment mutation and returns readiness result', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi.fn().mockResolvedValue(
        mockJsonResponse({
          serviceId: 'srv-1',
          staffId: 'staff-elena',
          providerCount: 1,
        }),
      );

      const result = await assignServiceProvider(
        { serviceId: 'srv-1', staffId: 'staff-elena' },
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(result.providerCount).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hosted.cradlehub.test/api/desktop/v1/operations-center/mutations',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            action: 'assign_service_provider',
            serviceId: 'srv-1',
            staffId: 'staff-elena',
          }),
        }),
      );
    });
  });

  describe('resolveAttendanceException mutation', () => {
    it('sends resolution mutation and returns ok', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          mockJsonResponse({ ok: true, message: 'Exception resolved.' }),
        );

      const result = await resolveAttendanceException(
        { exceptionId: 'issue-2', reason: 'Verified replacement device.' },
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(result.ok).toBe(true);
      expect(result.message).toBe('Exception resolved.');
    });
  });

  describe('generateDeviceRecovery mutation', () => {
    it('sends recovery request and returns activation url', async () => {
      const mockClient = createMockSupabaseClient();
      const mockFetch = vi.fn().mockResolvedValue(
        mockJsonResponse({
          token: 'tok-abc',
          activationUrl: 'https://cradlehub.test/activate?tok=tok-abc',
          expiresAt: '2026-10-25T12:00:00Z',
        }),
      );

      const result = await generateDeviceRecovery(
        { staffId: 'staff-elena' },
        mockClient,
        mockFetch as unknown as typeof fetch,
      );

      expect(result.token).toBe('tok-abc');
      expect(result.activationUrl).toContain('tok=tok-abc');
    });
  });

  describe('Filtering Helpers', () => {
    it('filters issues by tab scope', () => {
      const issues = mockOperationsData.issues;
      const filteredAtt = filterOperationsIssues(issues, 'attendance', {
        search: '',
        severity: 'all',
        area: 'all',
        resolutionState: 'all',
      });
      expect(filteredAtt).toHaveLength(1);
      expect(filteredAtt[0].id).toBe('issue-2');

      const filteredSrv = filterOperationsIssues(issues, 'service', {
        search: '',
        severity: 'all',
        area: 'all',
        resolutionState: 'all',
      });
      expect(filteredSrv).toHaveLength(1);
      expect(filteredSrv[0].id).toBe('issue-1');
    });

    it('filters issues by severity', () => {
      const issues = mockOperationsData.issues;
      const filteredCritical = filterOperationsIssues(issues, 'all', {
        search: '',
        severity: 'critical',
        area: 'all',
        resolutionState: 'all',
      });
      expect(filteredCritical).toHaveLength(1);
      expect(filteredCritical[0].severity).toBe('critical');
    });

    it('filters issues by search term', () => {
      const issues = mockOperationsData.issues;
      const filtered = filterOperationsIssues(issues, 'all', {
        search: 'prenatal',
        severity: 'all',
        area: 'all',
        resolutionState: 'all',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toContain('Prenatal Massage');
    });

    it('filters scans by staff name or reason code', () => {
      const scans = mockOperationsData.scans;
      const matched = filterOperationsScans(scans, {
        search: 'Elena',
        severity: 'all',
        area: 'all',
        resolutionState: 'all',
      });
      expect(matched).toHaveLength(1);

      const unmatched = filterOperationsScans(scans, {
        search: 'Nonexistent',
        severity: 'all',
        area: 'all',
        resolutionState: 'all',
      });
      expect(unmatched).toHaveLength(0);
    });
  });
});
