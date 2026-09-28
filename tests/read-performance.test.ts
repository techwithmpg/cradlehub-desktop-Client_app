import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearReadPerformanceMetrics,
  getReadPerformanceSnapshot,
  measureReadOperation,
  READ_PERFORMANCE_HISTORY_LIMIT,
} from '../src/lib/read-performance';

describe('development-only read performance recorder', () => {
  beforeEach(() => {
    vi.stubEnv('DEV', true);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    clearReadPerformanceMetrics();
  });

  afterEach(() => {
    clearReadPerformanceMetrics();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('preserves successful data and records monotonic duration without payload fields', async () => {
    const clock = vi.spyOn(performance, 'now');
    clock.mockReturnValueOnce(100).mockReturnValueOnce(112.5);
    const data = { customerName: 'private', branchId: 'private-id' };

    await expect(
      measureReadOperation('customers.list', async () => data),
    ).resolves.toBe(data);

    expect(getReadPerformanceSnapshot()).toEqual([
      {
        operation: 'customers.list',
        durationMs: 12.5,
        outcome: 'success',
        recordedAt: expect.any(Number),
      },
    ]);
    expect(JSON.stringify(getReadPerformanceSnapshot())).not.toContain(
      'private',
    );
    expect(vi.mocked(console.info).mock.calls[0]).toEqual([
      '[CradlePerf] customers.list 12.5ms success',
    ]);
  });

  it('rethrows the identical failure and records its duration', async () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(5).mockReturnValueOnce(9);
    const failure = new Error('private error details');

    await expect(
      measureReadOperation('schedule.day', async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(getReadPerformanceSnapshot()[0]).toMatchObject({
      operation: 'schedule.day',
      durationMs: 4,
      outcome: 'error',
    });
    expect(JSON.stringify(getReadPerformanceSnapshot())).not.toContain(
      failure.message,
    );
  });

  it('marks resolved service failures as errors without changing their result', async () => {
    const result = { ok: false as const, code: 'INVALID_PAYLOAD' };
    await expect(
      measureReadOperation('staff.roster', async () => result),
    ).resolves.toBe(result);
    expect(getReadPerformanceSnapshot()[0].outcome).toBe('error');
  });

  it('bounds history, returns detached snapshots, and clears metrics', async () => {
    for (let index = 0; index <= READ_PERFORMANCE_HISTORY_LIMIT; index++) {
      await measureReadOperation('today.snapshot', async () => index);
    }
    const snapshot = getReadPerformanceSnapshot();
    expect(snapshot).toHaveLength(READ_PERFORMANCE_HISTORY_LIMIT);
    snapshot[0] = { ...snapshot[0], durationMs: 999 };
    snapshot.pop();
    expect(getReadPerformanceSnapshot()).toHaveLength(
      READ_PERFORMANCE_HISTORY_LIMIT,
    );
    expect(getReadPerformanceSnapshot()[0].durationMs).not.toBe(999);
    clearReadPerformanceMetrics();
    expect(getReadPerformanceSnapshot()).toEqual([]);
  });

  it('does no recording or logging in production mode', async () => {
    vi.stubEnv('DEV', false);
    const result = { ok: true };
    await expect(
      measureReadOperation('bookings.branch-list', async () => result),
    ).resolves.toBe(result);
    expect(getReadPerformanceSnapshot()).toEqual([]);
    expect(console.info).not.toHaveBeenCalled();
  });
});
