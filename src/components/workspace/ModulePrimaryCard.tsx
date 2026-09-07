import React from 'react';

export interface ModulePrimaryCardProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  testId?: string;
}

/**
 * ModulePrimaryCard
 *
 * Canonical white operational card housing tabs, toolbars, DataGrids, and footers.
 */
export const ModulePrimaryCard: React.FC<ModulePrimaryCardProps> = ({
  children,
  className = '',
  ariaLabel,
  testId,
}) => {
  return (
    <div
      className={`bookings-list-card ${className}`.trim()}
      role="region"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {children}
    </div>
  );
};
