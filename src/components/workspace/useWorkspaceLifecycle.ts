import { useCallback, useContext, useSyncExternalStore } from 'react';
import {
  isWorkspaceModuleDirty,
  type WorkspaceLifecycleStore,
  type WorkspaceRefreshToken,
} from '../../lib/workspace-lifecycle';
import {
  WorkspaceLifecycleContext,
  WorkspaceModulePresenceContext,
} from './workspace-lifecycle-context';

function useWorkspaceStore(): WorkspaceLifecycleStore {
  const store = useContext(WorkspaceLifecycleContext);

  if (!store) {
    throw new Error(
      'Workspace lifecycle hooks must be used inside WorkspaceLifecycleProvider.',
    );
  }

  return store;
}

export function useWorkspaceInvalidation() {
  const store = useWorkspaceStore();

  return useCallback(
    (
      moduleIds: Parameters<WorkspaceLifecycleStore['invalidateModules']>[0],
    ) => {
      store.invalidateModules(moduleIds);
    },
    [store],
  );
}

export function useWorkspaceModuleLifecycle() {
  const store = useWorkspaceStore();
  const presence = useContext(WorkspaceModulePresenceContext);

  if (!presence) {
    throw new Error(
      'Module lifecycle hooks must be used inside WorkspaceModulePresence.',
    );
  }

  const { moduleId, isActive } = presence;

  const subscribe = useCallback(
    (listener: () => void) => {
      // Hidden retained modules do not need to re-render simply because
      // authority invalidated them. They observe the latest generation when
      // activated again.
      if (!isActive) {
        return () => {};
      }

      return store.subscribe(moduleId, listener);
    },
    [isActive, moduleId, store],
  );

  const state = useSyncExternalStore(
    subscribe,
    () => store.getSnapshot(moduleId),
    () => store.getSnapshot(moduleId),
  );

  const beginRefresh = useCallback(
    (): WorkspaceRefreshToken => store.beginRefresh(moduleId),
    [store, moduleId],
  );

  const completeRefresh = useCallback(
    (token: WorkspaceRefreshToken): boolean => {
      return store.completeRefresh(token);
    },
    [store],
  );

  const failRefresh = useCallback(
    (token: WorkspaceRefreshToken, message: string): boolean => {
      return store.failRefresh(token, message);
    },
    [store],
  );

  return {
    moduleId,
    isActive,
    invalidationGeneration: state.invalidationGeneration,
    isDirty: isWorkspaceModuleDirty(state),
    hasValidatedData: state.hasValidatedData,
    isRefreshing: state.isRefreshing,
    lastValidatedAt: state.lastValidatedAt,
    lastError: state.lastError,
    beginRefresh,
    completeRefresh,
    failRefresh,
  };
}
