import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as bookingsService from '../src/lib/bookings-service';
import {
  fetchDailySchedule,
  fetchScheduleAvailability,
  fetchStaffFullSchedule,
  mutateSchedule,
} from '../src/lib/schedule-service';
import type { ScheduleMutationAction } from '../src/types/schedule';

// Stage 06B Schedule service boundary

const HOSTED_BASE = 'https://hosted.example.test';

function authenticatedClient(token = 'schedule-test-token'): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: token,
          },
        },
        error: null,
      }),
    },
  } as unknown as SupabaseClient;
}

function missingSessionClient(): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: null,
        },
        error: null,
      }),
    },
  } as unknown as SupabaseClient;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function dailyPayload() {
  return {
    ok: true as const,
    branchId: 'branch-server-resolved',
    date: '2026-09-09',
    staffRows: [],
    stats: {
      total: 0,
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    },
    schedulingRules: {},
  };
}

function availabilityPayload() {
  return {
    ok: true as const,
    branchId: 'branch-server-resolved',
    items: [],
  };
}

function staffFullSchedulePayload() {
  return {
    ok: true as const,
    branchId: 'branch-server-resolved',
    staffId: 'staff-1',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    data: {
      staff: {
        id: 'staff-1',
        full_name: 'Test Staff',
        nickname: null,
        avatar_url: null,
        staff_type: 'therapist',
        system_role: 'staff',
        branch_name: 'Main Spa',
      },
      schedules: [],
      custom_overrides: [],
      blocked_times: [],
      bookings: [],
    },
  };
}

function validMutationSuccess(
  action: ScheduleMutationAction,
): Record<string, unknown> {
  switch (action) {
    case 'replace_weekly_schedule':
    case 'replace_weekly_window_schedule':
      return {
        ok: true,
        rowsWritten: 0,
        savedRows: [],
      };

    case 'upsert_override':
      return {
        ok: true,
        message: 'Day override saved.',
        override: {
          id: 'override-1',
          override_date: '2026-09-09',
          is_day_off: false,
          shift_type: 'single',
          start_time: '09:00',
          end_time: '17:00',
          reason: null,
        },
      };

    case 'delete_override':
      return {
        ok: true,
        message: 'Day override removed.',
        deletedId: 'override-1',
      };

    case 'create_blocked_time':
      return {
        ok: true,
        message: 'Block time saved.',
        block: {
          id: 'block-1',
          block_date: '2026-09-09',
          start_time: '12:00',
          end_time: '13:00',
          reason: 'break',
        },
      };

    case 'delete_blocked_time':
      return {
        ok: true,
        message: 'Block time removed.',
        deletedId: 'block-1',
      };
  }
}

describe('Stage 06B Schedule service boundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(bookingsService, 'getHostedApiBaseUrl').mockReturnValue(
      HOSTED_BASE,
    );
  });

  it('sends bearer auth to the daily endpoint and does not send a renderer branch override', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(dailyPayload()));

    const result = await fetchDailySchedule(
      '2026-09-09',
      authenticatedClient('daily-token'),
      fetchMock as unknown as typeof fetch,
    );

    expect(result).toEqual(dailyPayload());

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe(`${HOSTED_BASE}/api/desktop/v1/schedule?date=2026-09-09`);

    expect(url).not.toContain('branchId=');
    expect(url).not.toContain('branch=');

    expect(init.method).toBe('GET');

    expect(init.headers).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer daily-token',
    });
  });

  it('fails closed when the Schedule session is missing', async () => {
    const fetchMock = vi.fn();

    await expect(
      fetchDailySchedule(
        '2026-09-09',
        missingSessionClient(),
        fetchMock as unknown as typeof fetch,
      ),
    ).rejects.toThrow(
      'Your session has expired. Sign in again to use Schedule Operations.',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the authoritative staff availability endpoint', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(availabilityPayload()));

    const result = await fetchScheduleAvailability(
      authenticatedClient(),
      fetchMock as unknown as typeof fetch,
    );

    expect(result).toEqual(availabilityPayload());

    expect(fetchMock).toHaveBeenCalledWith(
      `${HOSTED_BASE}/api/desktop/v1/schedule/staff-availability`,
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('uses the authoritative staff detail endpoint with the requested range', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(staffFullSchedulePayload()));

    const result = await fetchStaffFullSchedule(
      'staff-1',
      '2026-09-01',
      '2026-09-30',
      authenticatedClient(),
      fetchMock as unknown as typeof fetch,
    );

    expect(result).toEqual(staffFullSchedulePayload());

    expect(fetchMock).toHaveBeenCalledWith(
      `${HOSTED_BASE}/api/desktop/v1/schedule/staff/staff-1?startDate=2026-09-01&endDate=2026-09-30`,
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it.each<[ScheduleMutationAction, Record<string, unknown>]>([
    [
      'upsert_override',
      {
        branchId: 'branch-1',
        staffId: 'staff-1',
        overrideDate: '2026-09-09',
        isDayOff: false,
        shiftType: 'single',
        startTime: '09:00',
        endTime: '17:00',
      },
    ],
    [
      'delete_override',
      {
        branchId: 'branch-1',
        staffId: 'staff-1',
        overrideId: 'override-1',
      },
    ],
    [
      'create_blocked_time',
      {
        branchId: 'branch-1',
        staffId: 'staff-1',
        blockDate: '2026-09-09',
        startTime: '12:00',
        endTime: '13:00',
        reason: 'break',
      },
    ],
    [
      'delete_blocked_time',
      {
        branchId: 'branch-1',
        staffId: 'staff-1',
        blockId: 'block-1',
      },
    ],
  ])(
    'POSTs %s through the hosted mutation endpoint with the exact action and payload',
    async (action, payload) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(jsonResponse(validMutationSuccess(action)));

      const result = await mutateSchedule(
        action,
        payload,
        authenticatedClient('mutation-token'),
        fetchMock as unknown as typeof fetch,
      );

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

      expect(url).toBe(`${HOSTED_BASE}/api/desktop/v1/schedule/mutations`);

      expect(init.method).toBe('POST');

      expect(init.headers).toEqual({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer mutation-token',
      });

      expect(JSON.parse(String(init.body))).toEqual({
        action,
        payload,
      });
    },
  );

  it.each<[ScheduleMutationAction, Record<string, unknown>]>([
    [
      'replace_weekly_schedule',
      {
        branchId: 'branch-1',
        staffId: 'staff-1',
        days: [],
      },
    ],
    [
      'replace_weekly_window_schedule',
      {
        branchId: 'branch-1',
        staffId: 'staff-1',
        days: [],
      },
    ],
  ])('accepts the real %s success envelope', async (action, payload) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(validMutationSuccess(action)));

    const result = await mutateSchedule(
      action,
      payload,
      authenticatedClient(),
      fetchMock as unknown as typeof fetch,
    );

    expect(result.ok).toBe(true);
  });

  it('fails closed on mutation network failure with no simulated success', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await mutateSchedule(
      'create_blocked_time',
      {
        branchId: 'branch-1',
        staffId: 'staff-1',
        blockDate: '2026-09-09',
        startTime: '12:00',
        endTime: '13:00',
        reason: 'break',
      },
      authenticatedClient(),
      fetchMock as unknown as typeof fetch,
    );

    expect(result).toEqual({
      ok: false,
      code: 'NETWORK_ERROR',
      message:
        'Schedule changes require a connection. Please check your network and try again.',
    });
  });

  it.each([
    [401, 'AUTH_SESSION_REQUIRED', 'Your session has expired.'],
    [
      403,
      'UNAUTHORIZED',
      'You do not have permission to update this staff schedule.',
    ],
    [400, 'INVALID_INPUT', 'Start and end time are required.'],
    [
      500,
      'UNKNOWN_ERROR',
      'The schedule mutation could not be completed. Please try again.',
    ],
  ])(
    'preserves hosted mutation failure %i / %s',
    async (status, code, message) => {
      const fetchMock = vi.fn().mockResolvedValue(
        jsonResponse(
          {
            ok: false,
            code,
            message,
          },
          status,
        ),
      );

      const result = await mutateSchedule(
        'upsert_override',
        {
          branchId: 'branch-1',
          staffId: 'staff-1',
          overrideDate: '2026-09-09',
          isDayOff: true,
        },
        authenticatedClient(),
        fetchMock as unknown as typeof fetch,
      );

      expect(result).toEqual({
        ok: false,
        code,
        message,
      });
    },
  );

  it.each<ScheduleMutationAction>([
    'replace_weekly_schedule',
    'replace_weekly_window_schedule',
    'upsert_override',
    'delete_override',
    'create_blocked_time',
    'delete_blocked_time',
  ])(
    'rejects malformed %s success instead of simulating mutation success',
    async (action) => {
      const fetchMock = vi.fn().mockResolvedValue(
        jsonResponse({
          ok: true,
        }),
      );

      const result = await mutateSchedule(
        action,
        {
          branchId: 'branch-1',
          staffId: 'staff-1',
        },
        authenticatedClient(),
        fetchMock as unknown as typeof fetch,
      );

      expect(result).toEqual({
        ok: false,
        code: 'HOSTED_RESPONSE_CONTRACT_ERROR',
        message: 'Schedule service returned an unexpected success response.',
      });
    },
  );

  it('rejects malformed daily success payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ok: true,
        branchId: 'branch-server-resolved',
        date: '2026-09-09',
        staffRows: 'not-an-array',
      }),
    );

    await expect(
      fetchDailySchedule(
        '2026-09-09',
        authenticatedClient(),
        fetchMock as unknown as typeof fetch,
      ),
    ).rejects.toThrow(
      'Schedule service returned an unexpected response format.',
    );
  });
});
