import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearInFlightOperationsForTests,
  getInFlightOperationCount,
  singleFlight,
} from '../src/lib/single-flight';

describe('singleFlight', () => {
  afterEach(() => {
    clearInFlightOperationsForTests();
  });

  it('shares one in-flight operation for identical keys', async () => {
    let resolveOperation!: (value: string) => void;

    const operation = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveOperation = resolve;
        }),
    );

    const first = singleFlight('bookings:branch-a', operation);
    const second = singleFlight('bookings:branch-a', operation);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(getInFlightOperationCount()).toBe(1);

    resolveOperation('authoritative-result');

    await expect(first).resolves.toBe('authoritative-result');
    await expect(second).resolves.toBe('authoritative-result');

    expect(getInFlightOperationCount()).toBe(0);
  });

  it('keeps different keys independent', async () => {
    const operationA = vi.fn().mockResolvedValue('branch-a');
    const operationB = vi.fn().mockResolvedValue('branch-b');

    const [a, b] = await Promise.all([
      singleFlight('bookings:branch-a', operationA),
      singleFlight('bookings:branch-b', operationB),
    ]);

    expect(a).toBe('branch-a');
    expect(b).toBe('branch-b');
    expect(operationA).toHaveBeenCalledTimes(1);
    expect(operationB).toHaveBeenCalledTimes(1);
  });

  it('removes failed operations so a later retry can run', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce('recovered');

    await expect(singleFlight('today:branch-a', operation)).rejects.toThrow(
      'network failure',
    );

    expect(getInFlightOperationCount()).toBe(0);

    await expect(singleFlight('today:branch-a', operation)).resolves.toBe(
      'recovered',
    );

    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not reuse a completed request as a cache', async () => {
    const operation = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    await expect(singleFlight('customers:branch-a', operation)).resolves.toBe(
      'first',
    );

    await expect(singleFlight('customers:branch-a', operation)).resolves.toBe(
      'second',
    );

    expect(operation).toHaveBeenCalledTimes(2);
  });
});
