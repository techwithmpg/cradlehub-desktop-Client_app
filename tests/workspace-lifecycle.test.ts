import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createWorkspaceLifecycleStore,
  isWorkspaceModuleDirty,
} from '../src/lib/workspace-lifecycle';

describe('workspace lifecycle store', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts unvalidated and dirty', () => {
    const store = createWorkspaceLifecycleStore();
    const state = store.getSnapshot('bookings');

    expect(state.hasValidatedData).toBe(false);
    expect(isWorkspaceModuleDirty(state)).toBe(true);
  });

  it('becomes clean after a validated authoritative refresh', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123456);

    const store = createWorkspaceLifecycleStore();
    const token = store.beginRefresh('bookings');

    expect(store.completeRefresh(token)).toBe(true);

    const state = store.getSnapshot('bookings');

    expect(state.hasValidatedData).toBe(true);
    expect(state.isRefreshing).toBe(false);
    expect(state.lastValidatedAt).toBe(123456);
    expect(isWorkspaceModuleDirty(state)).toBe(false);
  });

  it('becomes dirty after invalidation without discarding validated data', () => {
    const store = createWorkspaceLifecycleStore();

    store.completeRefresh(store.beginRefresh('bookings'));
    store.invalidateModules(['bookings']);

    const state = store.getSnapshot('bookings');

    expect(state.hasValidatedData).toBe(true);
    expect(isWorkspaceModuleDirty(state)).toBe(true);
  });

  it('rejects a refresh result that began before a newer invalidation', () => {
    const store = createWorkspaceLifecycleStore();

    store.completeRefresh(store.beginRefresh('bookings'));

    const staleRefresh = store.beginRefresh('bookings');

    store.invalidateModules(['bookings']);

    expect(store.completeRefresh(staleRefresh)).toBe(false);

    const state = store.getSnapshot('bookings');

    expect(state.hasValidatedData).toBe(true);
    expect(state.isRefreshing).toBe(false);
    expect(isWorkspaceModuleDirty(state)).toBe(true);
  });

  it('allows a newer refresh to win and rejects the older response', () => {
    vi.spyOn(Date, 'now').mockReturnValue(200);

    const store = createWorkspaceLifecycleStore();

    const older = store.beginRefresh('bookings');
    const newer = store.beginRefresh('bookings');

    expect(store.completeRefresh(newer)).toBe(true);

    const afterNewer = store.getSnapshot('bookings');

    expect(afterNewer.lastValidatedAt).toBe(200);
    expect(afterNewer.hasValidatedData).toBe(true);

    expect(store.completeRefresh(older)).toBe(false);

    const finalState = store.getSnapshot('bookings');

    expect(finalState.lastValidatedAt).toBe(200);
    expect(finalState.lastError).toBeNull();
    expect(isWorkspaceModuleDirty(finalState)).toBe(false);
  });

  it('ignores an obsolete failure after a newer refresh succeeds', () => {
    const store = createWorkspaceLifecycleStore();

    const older = store.beginRefresh('bookings');
    const newer = store.beginRefresh('bookings');

    expect(store.completeRefresh(newer)).toBe(true);
    expect(store.failRefresh(older, 'Old network failure')).toBe(false);

    const state = store.getSnapshot('bookings');

    expect(state.hasValidatedData).toBe(true);
    expect(state.lastError).toBeNull();
    expect(state.isRefreshing).toBe(false);
  });

  it('preserves validated data when the current reconciliation refresh fails', () => {
    const store = createWorkspaceLifecycleStore();

    store.completeRefresh(store.beginRefresh('bookings'));
    store.invalidateModules(['bookings']);

    const refresh = store.beginRefresh('bookings');

    expect(store.failRefresh(refresh, 'Network unavailable')).toBe(true);

    const state = store.getSnapshot('bookings');

    expect(state.hasValidatedData).toBe(true);
    expect(state.lastError).toBe('Network unavailable');
    expect(state.isRefreshing).toBe(false);
    expect(isWorkspaceModuleDirty(state)).toBe(true);
  });

  it('isolates lifecycle state between modules', () => {
    const store = createWorkspaceLifecycleStore();

    store.completeRefresh(store.beginRefresh('bookings'));
    store.completeRefresh(store.beginRefresh('customers'));

    store.invalidateModules(['bookings']);

    expect(isWorkspaceModuleDirty(store.getSnapshot('bookings'))).toBe(true);

    expect(isWorkspaceModuleDirty(store.getSnapshot('customers'))).toBe(false);
  });
});
