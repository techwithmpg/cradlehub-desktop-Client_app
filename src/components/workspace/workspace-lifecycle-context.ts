import { createContext } from 'react';
import type { NavModuleId } from '../../types/auth';
import type { WorkspaceLifecycleStore } from '../../lib/workspace-lifecycle';

export const WorkspaceLifecycleContext =
  createContext<WorkspaceLifecycleStore | null>(null);

export interface WorkspaceModulePresenceValue {
  moduleId: NavModuleId;
  isActive: boolean;
}

export const WorkspaceModulePresenceContext =
  createContext<WorkspaceModulePresenceValue | null>(null);
