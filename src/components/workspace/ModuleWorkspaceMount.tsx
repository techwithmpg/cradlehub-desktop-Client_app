import React from 'react';

export interface ModuleWorkspaceMountProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * ModuleWorkspaceMount
 *
 * Neutral structural mount container for active module controllers within ModuleWorkspaceHost.
 * Encapsulates the canonical full-width flex column geometry (.bookings-module-wrapper).
 */
export const ModuleWorkspaceMount: React.FC<ModuleWorkspaceMountProps> = ({
  children,
  className = '',
  testId = 'module-workspace-mount',
}) => {
  return (
    <div
      className={`bookings-module-wrapper ${className}`.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  );
};
