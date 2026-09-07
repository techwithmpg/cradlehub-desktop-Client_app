import React from 'react';

export interface ModuleWorkspaceProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  testId?: string;
}

/**
 * ModuleWorkspace
 *
 * Canonical outer layout container for a domain module's workspace body.
 * Encapsulates the outer module body layout and standard styling.
 */
export const ModuleWorkspace: React.FC<ModuleWorkspaceProps> = ({
  children,
  className = '',
  ariaLabel,
  testId,
}) => {
  return (
    <div
      className={`bookings-view-container ${className}`.trim()}
      role="main"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {children}
    </div>
  );
};
