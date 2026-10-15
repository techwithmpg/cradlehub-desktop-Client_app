import type { NavModuleId } from '../types/auth';

export interface WorkspaceModuleLifecycleState {
  invalidationGeneration: number;
  validatedGeneration: number;
  hasValidatedData: boolean;
  isRefreshing: boolean;
  activeRefreshId: number | null;
  lastValidatedAt: number | null;
  lastError: string | null;
}

export interface WorkspaceRefreshToken {
  moduleId: NavModuleId;
  generation: number;
  refreshId: number;
}

type Listener = () => void;

const INITIAL_STATE: WorkspaceModuleLifecycleState = Object.freeze({
  invalidationGeneration: 0,
  validatedGeneration: -1,
  hasValidatedData: false,
  isRefreshing: false,
  activeRefreshId: null,
  lastValidatedAt: null,
  lastError: null,
});

export interface WorkspaceLifecycleStore {
  getSnapshot(moduleId: NavModuleId): WorkspaceModuleLifecycleState;
  subscribe(moduleId: NavModuleId, listener: Listener): () => void;
  invalidateModules(moduleIds: readonly NavModuleId[]): void;
  beginRefresh(moduleId: NavModuleId): WorkspaceRefreshToken;
  completeRefresh(token: WorkspaceRefreshToken): boolean;
  failRefresh(token: WorkspaceRefreshToken, message: string): boolean;
}

export function createWorkspaceLifecycleStore(): WorkspaceLifecycleStore {
  const states = new Map<NavModuleId, WorkspaceModuleLifecycleState>();
  const listeners = new Map<NavModuleId, Set<Listener>>();
  let nextRefreshId = 1;

  const read = (moduleId: NavModuleId): WorkspaceModuleLifecycleState =>
    states.get(moduleId) ?? INITIAL_STATE;

  const publish = (
    moduleId: NavModuleId,
    next: WorkspaceModuleLifecycleState,
  ): void => {
    states.set(moduleId, next);

    for (const listener of listeners.get(moduleId) ?? []) {
      listener();
    }
  };

  return {
    getSnapshot(moduleId) {
      return read(moduleId);
    },

    subscribe(moduleId, listener) {
      let moduleListeners = listeners.get(moduleId);

      if (!moduleListeners) {
        moduleListeners = new Set();
        listeners.set(moduleId, moduleListeners);
      }

      moduleListeners.add(listener);

      return () => {
        moduleListeners?.delete(listener);

        if (moduleListeners?.size === 0) {
          listeners.delete(moduleId);
        }
      };
    },

    invalidateModules(moduleIds) {
      for (const moduleId of new Set(moduleIds)) {
        const current = read(moduleId);

        publish(moduleId, {
          ...current,
          invalidationGeneration: current.invalidationGeneration + 1,
          lastError: null,
        });
      }
    },

    beginRefresh(moduleId) {
      const current = read(moduleId);
      const refreshId = nextRefreshId++;

      const token: WorkspaceRefreshToken = {
        moduleId,
        generation: current.invalidationGeneration,
        refreshId,
      };

      publish(moduleId, {
        ...current,
        isRefreshing: true,
        activeRefreshId: refreshId,
        lastError: null,
      });

      return token;
    },

    completeRefresh(token) {
      const current = read(token.moduleId);

      // A newer refresh already owns this module. Ignore the obsolete result.
      if (current.activeRefreshId !== token.refreshId) {
        return false;
      }

      // The module was invalidated after this request started.
      // Do not allow this older snapshot to become authoritative UI state.
      if (current.invalidationGeneration !== token.generation) {
        publish(token.moduleId, {
          ...current,
          isRefreshing: false,
          activeRefreshId: null,
        });

        return false;
      }

      publish(token.moduleId, {
        ...current,
        validatedGeneration: token.generation,
        hasValidatedData: true,
        isRefreshing: false,
        activeRefreshId: null,
        lastValidatedAt: Date.now(),
        lastError: null,
      });

      return true;
    },

    failRefresh(token, message) {
      const current = read(token.moduleId);

      // An obsolete failed request must not overwrite the state of a newer one.
      if (current.activeRefreshId !== token.refreshId) {
        return false;
      }

      publish(token.moduleId, {
        ...current,
        isRefreshing: false,
        activeRefreshId: null,
        lastError: message,
      });

      return true;
    },
  };
}

export function isWorkspaceModuleDirty(
  state: WorkspaceModuleLifecycleState,
): boolean {
  return state.validatedGeneration < state.invalidationGeneration;
}
