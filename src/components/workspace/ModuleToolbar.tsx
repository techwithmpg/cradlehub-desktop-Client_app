import React from 'react';

export interface ModuleToolbarProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  testId?: string;
}

/**
 * ModuleToolbar
 *
 * Canonical in-card toolbar container for search fields, filter selects, and view options.
 */
export const ModuleToolbar: React.FC<ModuleToolbarProps> = ({
  children,
  className = '',
  ariaLabel = 'Module Toolbar',
  testId,
}) => {
  return (
    <div
      className={`bookings-toolbar-container ${className}`.trim()}
      role="toolbar"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {children}
    </div>
  );
};
