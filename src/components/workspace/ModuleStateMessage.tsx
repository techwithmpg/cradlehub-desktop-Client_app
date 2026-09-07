import React from 'react';

export interface ModuleErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  testId?: string;
}

/**
 * ModuleErrorBanner
 *
 * Canonical error state banner with optional retry trigger.
 */
export const ModuleErrorBanner: React.FC<ModuleErrorBannerProps> = ({
  message,
  onRetry,
  className = '',
  testId = 'module-error-banner',
}) => {
  return (
    <div
      className={`bookings-error-banner ${className}`.trim()}
      role="alert"
      data-testid={testId}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="bookings-retry-btn"
          aria-label="Retry operation"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export interface ModuleSuccessBannerProps {
  message: string;
  warning?: string;
  onDismiss?: () => void;
  className?: string;
  testId?: string;
}

/**
 * ModuleSuccessBanner
 *
 * Canonical success notice banner with optional warning line and dismiss trigger.
 */
export const ModuleSuccessBanner: React.FC<ModuleSuccessBannerProps> = ({
  message,
  warning,
  onDismiss,
  className = '',
  testId = 'module-success-banner',
}) => {
  return (
    <div
      className={`bookings-success-banner ${className}`.trim()}
      role="status"
      data-testid={testId}
    >
      <div className="bookings-notice-content">
        <span className="bookings-notice-title">{message}</span>
        {warning && <span className="bookings-notice-warning">{warning}</span>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="bookings-notice-dismiss"
          aria-label="Dismiss message"
        >
          &times;
        </button>
      )}
    </div>
  );
};
