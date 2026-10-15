import { useState, type ReactNode } from 'react';
import { createWorkspaceLifecycleStore } from '../../lib/workspace-lifecycle';
import {
  WorkspaceLifecycleContext,
  WorkspaceModulePresenceContext,
  type WorkspaceModulePresenceValue,
} from './workspace-lifecycle-context';

interface WorkspaceLifecycleProviderProps {
  children: ReactNode;
}

export function WorkspaceLifecycleProvider({
  children,
}: WorkspaceLifecycleProviderProps) {
  const [store] = useState(() => createWorkspaceLifecycleStore());

  return (
    <WorkspaceLifecycleContext.Provider value={store}>
      {children}
    </WorkspaceLifecycleContext.Provider>
  );
}

export function WorkspaceModulePresence({
  moduleId,
  isActive,
  children,
}: WorkspaceModulePresenceValue & { children: ReactNode }) {
  return (
    <WorkspaceModulePresenceContext.Provider value={{ moduleId, isActive }}>
      {children}
    </WorkspaceModulePresenceContext.Provider>
  );
}
