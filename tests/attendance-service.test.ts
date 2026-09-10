import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
  updateAttendanceRules,
  isAttendanceRulesMutationResponse,
  isAttendanceHistoryResponse,
  fetchAttendanceHistory,
  fetchAttendanceWorkspace,
  isAttendanceWorkspaceResponse,
  mutateAttendanceException,
} from '../src/lib/attendance-service';
import type { AttendanceWorkspaceResponse } from '../src/types/attendance';

function validResponse(): AttendanceWorkspaceResponse {
  return {
    ok: true,
    branchId: 'branch-main',
    data: {
      branchId: 'branch-main',
      branchName: 'Main Spa',
      businessDate: '2026-09-10',
      timezone: 'Asia/Manila',
      serverNowMs: 1_757_470_000_000,
      settings: {
        branch_id: 'branch-main',
        late_grace_minutes: 20,
      },
      summary: {
        checkedInNow: 0,
        recordsToday: 0,
        openExceptions: 0,
        activeSessions: 0,
        activeDevices: 0,
      },
      records: [],
      exceptions: [],
      dailyStaffStates: [],
    },
  };
}

function clientWithToken(token: string | null): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: token
            ? {
                access_token: token,
              }
            : null,
        },
        error: null,
      }),
    },
  } as unknown as SupabaseClient;
}

describe('Attendance Desktop service', () => {
  it('accepts the hosted Attendance workspace envelope', () => {
    expect(isAttendanceWorkspaceResponse(validResponse())).toBe(true);
  });

  it('rejects a success envelope whose branch does not match its data', () => {
    const response = validResponse();

    response.data.branchId = 'branch-other';

    expect(isAttendanceWorkspaceResponse(response)).toBe(false);
  });

  it('fetches Attendance with the Supabase bearer token', async () => {
    const responseBody = validResponse();

    const customFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    const result = await fetchAttendanceWorkspace(
      clientWithToken('attendance-token'),
      customFetch,
    );

    expect(result).toEqual(responseBody);

    expect(customFetch).toHaveBeenCalledTimes(1);

    expect(customFetch).toHaveBeenCalledWith(
      'https://www.cradlewellnessliving.com/api/desktop/v1/attendance',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer attendance-token',
        }),
      }),
    );
  });

  it('fails closed when the authenticated session is unavailable', async () => {
    await expect(
      fetchAttendanceWorkspace(clientWithToken(null), vi.fn()),
    ).rejects.toThrow(
      'Your session has expired. Sign in again to use Attendance.',
    );
  });

  it('reports a truthful network failure', async () => {
    const customFetch = vi.fn().mockRejectedValue(new Error('offline'));

    await expect(
      fetchAttendanceWorkspace(
        clientWithToken('attendance-token'),
        customFetch,
      ),
    ).rejects.toThrow(
      'Attendance requires a connection. Please check your network and try again.',
    );
  });
});

describe('Attendance Desktop timeout behavior', () => {
  it('times out a stalled hosted Attendance request', async () => {
    vi.useFakeTimers();

    try {
      const stalledFetch = vi.fn(
        () => new Promise<Response>(() => {}),
      ) as unknown as typeof fetch;

      const request = fetchAttendanceWorkspace(
        clientWithToken('attendance-token'),
        stalledFetch,
      );

      const rejection = expect(request).rejects.toThrow(
        'Attendance service did not respond within 60 seconds. Please retry.',
      );

      await vi.advanceTimersByTimeAsync(60_000);
      await rejection;
    } finally {
      vi.useRealTimers();
    }
  });

  it('times out a stalled Attendance session lookup', async () => {
    vi.useFakeTimers();

    try {
      const stalledClient = {
        auth: {
          getSession: vi.fn(() => new Promise(() => {})),
        },
      } as unknown as SupabaseClient;

      const request = fetchAttendanceWorkspace(
        stalledClient,
        vi.fn() as unknown as typeof fetch,
      );

      const rejection = expect(request).rejects.toThrow(
        'Attendance could not verify your session within 5 seconds. Sign in again and retry.',
      );

      await vi.advanceTimersByTimeAsync(5_000);
      await rejection;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Attendance Review mutations', () => {
  it('reviews an exception without sending renderer branch authority', async () => {
    const customFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          action: 'review_exception',
          message: 'Issue reviewed and kept open.',
          exceptionId: 'exception-1',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const result = await mutateAttendanceException(
      {
        action: 'review_exception',
        exceptionId: 'exception-1',
      },
      clientWithToken('attendance-token'),
      customFetch,
    );

    expect(result.message).toBe('Issue reviewed and kept open.');

    expect(customFetch).toHaveBeenCalledTimes(1);

    const [url, request] = customFetch.mock.calls[0];

    expect(url).toBe(
      'https://www.cradlewellnessliving.com/api/desktop/v1/attendance/mutations',
    );

    expect(request).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer attendance-token',
          'Content-Type': 'application/json',
        }),
      }),
    );

    const body = JSON.parse(String(request?.body));

    expect(body).toEqual({
      action: 'review_exception',
      payload: {
        exceptionId: 'exception-1',
      },
    });

    expect(JSON.stringify(body)).not.toContain('branchId');
  });

  it('resolves an exception with an optional resolution note', async () => {
    const customFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          action: 'resolve_exception',
          message: 'Exception resolved.',
          exceptionId: 'exception-1',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    await mutateAttendanceException(
      {
        action: 'resolve_exception',
        exceptionId: 'exception-1',
        resolutionNote: 'Verified with manager.',
      },
      clientWithToken('attendance-token'),
      customFetch,
    );

    const [, request] = customFetch.mock.calls[0];
    const body = JSON.parse(String(request?.body));

    expect(body).toEqual({
      action: 'resolve_exception',
      payload: {
        exceptionId: 'exception-1',
        resolutionNote: 'Verified with manager.',
      },
    });

    expect(JSON.stringify(body)).not.toContain('branchId');
  });
});

describe('Attendance History service', () => {
  it('accepts the hosted Attendance History envelope', () => {
    expect(
      isAttendanceHistoryResponse({
        ok: true,
        branchId: 'branch-main',
        fromDate: '2026-09-04',
        toDate: '2026-09-10',
        data: {
          fromDate: '2026-09-04',
          toDate: '2026-09-10',
          records: [],
          corrections: [],
        },
      }),
    ).toBe(true);
  });

  it('fetches branch-authoritative Attendance History without renderer branch authority', async () => {
    const customFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          branchId: 'branch-main',
          fromDate: '2026-09-04',
          toDate: '2026-09-10',
          data: {
            fromDate: '2026-09-04',
            toDate: '2026-09-10',
            records: [],
            corrections: [],
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    await fetchAttendanceHistory(
      '2026-09-04',
      '2026-09-10',
      clientWithToken('attendance-token'),
      customFetch,
    );

    const [url, request] = customFetch.mock.calls[0];

    expect(url).toBe(
      'https://www.cradlewellnessliving.com/api/desktop/v1/attendance/history?fromDate=2026-09-04&toDate=2026-09-10',
    );

    expect(String(url)).not.toContain('branchId');

    expect(request).toEqual(
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer attendance-token',
        }),
      }),
    );
  });
});

describe('Attendance Setup rules mutation', () => {
  it('accepts the hosted update_rules response', () => {
    expect(
      isAttendanceRulesMutationResponse({
        ok: true,
        action: 'update_rules',
        message: 'Attendance rules saved.',
        settings: {
          late_grace_minutes: 15,
          clock_in_window_before_shift_minutes: 30,
          duplicate_scan_debounce_minutes: 2,
        },
      }),
    ).toBe(true);
  });

  it('sends only editable rules and no renderer branch authority', async () => {
    const customFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          action: 'update_rules',
          message: 'Attendance rules saved.',
          settings: {
            late_grace_minutes: 15,
            clock_in_window_before_shift_minutes: 30,
            duplicate_scan_debounce_minutes: 2,
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    await updateAttendanceRules(
      {
        settings: {
          late_grace_minutes: 15,
          clock_in_window_before_shift_minutes: 30,
          duplicate_scan_debounce_minutes: 2,
        },
        reason: 'Adjusted for front desk operations.',
      },
      clientWithToken('attendance-token'),
      customFetch,
    );

    expect(customFetch).toHaveBeenCalledTimes(1);

    const [url, request] = customFetch.mock.calls[0];

    expect(url).toBe(
      'https://www.cradlewellnessliving.com/api/desktop/v1/attendance/mutations',
    );

    expect(request).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer attendance-token',
        }),
      }),
    );

    const body = JSON.parse(String(request?.body));

    expect(body).toEqual({
      action: 'update_rules',
      payload: {
        settings: {
          late_grace_minutes: 15,
          clock_in_window_before_shift_minutes: 30,
          duplicate_scan_debounce_minutes: 2,
        },
        reason: 'Adjusted for front desk operations.',
      },
    });

    expect(JSON.stringify(body)).not.toContain('branchId');

    expect(JSON.stringify(body)).not.toContain('test_mode');

    expect(JSON.stringify(body)).not.toContain('launch_recovery');
  });
});
