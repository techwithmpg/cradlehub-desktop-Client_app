import React from 'react';

export interface ModuleInspectorFrameProps {
  children?: React.ReactNode;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  testId?: string;
}

/**
 * ModuleInspectorFrame
 *
 * Canonical outer card frame for context inspectors.
 */
export const ModuleInspectorFrame: React.FC<ModuleInspectorFrameProps> = ({
  children,
  isEmpty = false,
  emptyState,
  className = '',
  ariaLabel = 'Context Inspector',
  testId,
}) => {
  return (
    <div
      className={`booking-inspector-card ${isEmpty ? 'empty' : 'active'} ${className}`.trim()}
      role="region"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {isEmpty ? emptyState || children : children}
    </div>
  );
};

export interface ModuleInspectorEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * ModuleInspectorEmptyState
 *
 * Canonical empty state presentation inside an inspector column.
 */
export const ModuleInspectorEmptyState: React.FC<
  ModuleInspectorEmptyStateProps
> = ({
  title,
  description,
  icon,
  className = '',
  testId = 'inspector-empty-state',
}) => {
  return (
    <div
      className={`inspector-empty-container ${className}`.trim()}
      data-testid={testId}
    >
      <div className="inspector-empty-icon-circle" aria-hidden="true">
        {icon || (
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        )}
      </div>
      <h4 className="inspector-empty-heading">{title}</h4>
      <p className="inspector-empty-text">{description}</p>
    </div>
  );
};
