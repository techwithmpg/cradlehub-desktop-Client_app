import React from 'react';

export interface ModuleWorkspaceHostProps {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  testId?: string;
}

/**
 * ModuleWorkspaceHost
 *
 * Permanent structural host owned by CanonicalShell.
 * Provides the neutral mounting boundary and geometry for whichever domain module is active.
 */
export const ModuleWorkspaceHost: React.FC<ModuleWorkspaceHostProps> = ({
  children,
  className = '',
  wide = true,
  testId = 'module-workspace-host',
}) => {
  return (
    <div
      className={`workspace-canvas ${wide ? 'workspace-canvas-wide' : ''} ${className}`.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  );
};
