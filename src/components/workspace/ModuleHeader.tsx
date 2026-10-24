import React from 'react';
import { Button } from '../ui/button';

export interface ModuleHeaderPrimaryAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  ariaLabel?: string;
  testId?: string;
  disabled?: boolean;
}

export interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  brandIcon?: React.ReactNode;
  metaBadges?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshAriaLabel?: string;
  refreshTitle?: string;
  primaryAction?: ModuleHeaderPrimaryAction;
  customActions?: React.ReactNode;
  className?: string;
  testId?: string;
  children?: React.ReactNode;
}

/**
 * ModuleHeader
 *
 * Canonical module header primitive.
 * Standardizes title, subtitle, refresh action, primary action button, brand icon, and custom slots.
 */
export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  title,
  subtitle,
  brandIcon,
  metaBadges,
  onRefresh,
  isRefreshing = false,
  refreshAriaLabel = 'Refresh',
  refreshTitle = 'Refresh',
  primaryAction,
  customActions,
  className = '',
  testId,
  children,
}) => {
  return (
    <div
      className={`bookings-header-container ${className}`.trim()}
      data-testid={testId}
    >
      <div className="bookings-header-left">
        {brandIcon && (
          <div className="bookings-header-brand-icon" aria-hidden="true">
            {brandIcon}
          </div>
        )}
        <div className="bookings-header-title-group">
          <h1 className="bookings-header-title">{title}</h1>
          {subtitle && <p className="bookings-header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="bookings-header-right">
        {metaBadges}
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bookings-header-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title={refreshTitle}
            aria-label={refreshAriaLabel}
          >
            <svg
              className={`bookings-header-refresh-icon ${isRefreshing ? 'spin' : ''}`}
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span className="bookings-header-refresh-text">Refresh</span>
          </Button>
        )}

        {customActions}

        {primaryAction && (
          <Button
            type="button"
            size="sm"
            className="bookings-header-primary-btn"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            aria-label={primaryAction.ariaLabel || primaryAction.label}
            data-testid={primaryAction.testId}
          >
            {primaryAction.icon || (
              <svg
                className="bookings-header-btn-icon"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            <span>{primaryAction.label}</span>
          </Button>
        )}
      </div>

      {children}
    </div>
  );
};
