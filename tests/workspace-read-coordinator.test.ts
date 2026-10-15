import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createWorkspaceReadKey,
  runWorkspaceRead,
  type WorkspaceReadScope,
} from '../src/lib/workspace-read-coordinator';
import { clearInFlightOperationsForTests } from '../src/lib/single-flight';

const baseScope: WorkspaceReadScope = {
  userId: 'user-1',
  role: 'crm',
  branchId: 'branch-1',
  dataset: 'bookings.branch-list',
  generation: 0,
  paramsKey: 'all',
};

describe('workspace read coordinator', () => {
  beforeEach(() => {
    clearInFlightOperationsForTests();
  });

  it('keys reads by identity, role, branch, dataset, generation, and params', () => {
    const baseKey = createWorkspaceReadKey(baseScope);

    const variants: WorkspaceReadScope[] = [
      { ...baseScope, userId: 'user-2' },
      { ...baseScope, role: 'manager' },
      { ...baseScope, branchId: 'branch-2' },
      { ...baseScope, dataset: 'today.snapshot' },
      { ...baseScope, generation: 1 },
      { ...baseScope, paramsKey: 'today-only' },
    ];

    for (const variant of variants) {
      expect(createWorkspaceReadKey(variant)).not.toBe(baseKey);
    }
  });

  it('shares one in-flight operation for identical scope and generation', async () => {
    let resolve!: (value: string) => void;

    const operation = vi.fn(
      () =>
        new Promise<string>((resolver) => {
          resolve = resolver;
        }),
    );

    const first = runWorkspaceRead(baseScope, operation);
    const second = runWorkspaceRead(baseScope, operation);

    expect(first).toBe(second);
    expect(operation).toHaveBeenCalledTimes(1);

    resolve('authoritative');

    await expect(first).resolves.toBe('authoritative');
    await expect(second).resolves.toBe('authoritative');
  });

  it('does not reuse an older in-flight read after generation changes', async () => {
    let resolveOld!: (value: string) => void;
    let resolveNew!: (value: string) => void;

    const oldOperation = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveOld = resolve;
        }),
    );

    const newOperation = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveNew = resolve;
        }),
    );

    const oldRead = runWorkspaceRead(
      { ...baseScope, generation: 0 },
      oldOperation,
    );

    const newRead = runWorkspaceRead(
      { ...baseScope, generation: 1 },
      newOperation,
    );

    expect(oldRead).not.toBe(newRead);
    expect(oldOperation).toHaveBeenCalledTimes(1);
    expect(newOperation).toHaveBeenCalledTimes(1);

    resolveNew('fresh');
    await expect(newRead).resolves.toBe('fresh');

    resolveOld('stale');
    await expect(oldRead).resolves.toBe('stale');
  });

  it('keeps different authorization and parameter scopes independent', async () => {
    const operationA = vi.fn().mockResolvedValue('A');
    const operationB = vi.fn().mockResolvedValue('B');

    const first = runWorkspaceRead(baseScope, operationA);

    const second = runWorkspaceRead(
      {
        ...baseScope,
        branchId: 'branch-2',
        paramsKey: 'future',
      },
      operationB,
    );

    await expect(first).resolves.toBe('A');
    await expect(second).resolves.toBe('B');

    expect(operationA).toHaveBeenCalledTimes(1);
    expect(operationB).toHaveBeenCalledTimes(1);
  });
});
