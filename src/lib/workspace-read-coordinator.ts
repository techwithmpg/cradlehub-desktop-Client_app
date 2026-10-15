import { singleFlight } from './single-flight';

export interface WorkspaceReadScope {
  userId: string;
  role: string;
  branchId: string;
  dataset: string;
  generation: number;
  paramsKey?: string;
}

function encodeKeyPart(value: string | number): string {
  return encodeURIComponent(String(value));
}

export function createWorkspaceReadKey(scope: WorkspaceReadScope): string {
  return [
    'workspace-read-v2',
    `user=${encodeKeyPart(scope.userId)}`,
    `role=${encodeKeyPart(scope.role)}`,
    `branch=${encodeKeyPart(scope.branchId)}`,
    `dataset=${encodeKeyPart(scope.dataset)}`,
    `generation=${encodeKeyPart(scope.generation)}`,
    `params=${encodeKeyPart(scope.paramsKey ?? '')}`,
  ].join('|');
}

export function runWorkspaceRead<T>(
  scope: WorkspaceReadScope,
  operation: () => Promise<T>,
): Promise<T> {
  return singleFlight(createWorkspaceReadKey(scope), operation);
}
