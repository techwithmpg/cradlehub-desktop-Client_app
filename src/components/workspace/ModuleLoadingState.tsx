import React from 'react';

export interface ModuleLoadingStateProps {
  ariaLabel?: string;
  className?: string;
  testId?: string;
  showKpiSkeleton?: boolean;
  showInspectorSkeleton?: boolean;
}

/**
 * ModuleLoadingState
 *
 * Canonical skeleton loading geometry representing the standard module workspace.
 */
export const ModuleLoadingState: React.FC<ModuleLoadingStateProps> = ({
  ariaLabel = 'Loading workspace',
  className = '',
  testId = 'module-skeleton',
  showKpiSkeleton = true,
  showInspectorSkeleton = true,
}) => {
  return (
    <div
      className={`bookings-loading-state ${className}`.trim()}
      aria-busy="true"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {showKpiSkeleton && <div className="bookings-skeleton-kpi" />}
      <div className="bookings-skeleton-body-grid">
        <div className="bookings-skeleton-list" />
        {showInspectorSkeleton && (
          <div className="bookings-skeleton-inspector" />
        )}
      </div>
    </div>
  );
};
