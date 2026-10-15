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

  const state = useSyncExternalStore(
    (listener) => store.subscribe(moduleId, listener),
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
