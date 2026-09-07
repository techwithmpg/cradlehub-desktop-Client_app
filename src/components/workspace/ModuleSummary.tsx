import React from 'react';

export interface ModuleSummaryCardProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  testId?: string;
}

export const ModuleSummaryCard: React.FC<ModuleSummaryCardProps> = ({
  children,
  className = '',
  ariaLabel = 'Module KPI Summary',
  testId,
}) => {
  return (
    <div
      className={`bookings-kpi-summary-card ${className}`.trim()}
      role="region"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {children}
    </div>
  );
};

export interface ModuleKpiGridProps {
  children: React.ReactNode;
  className?: string;
}

export const ModuleKpiGrid: React.FC<ModuleKpiGridProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`bookings-kpi-grid ${className}`.trim()}>{children}</div>
  );
};

export interface ModuleKpiCellProps {
  label: string;
  count: number | string;
  subtext?: string;
  icon?: React.ReactNode;
  accentClass?: string;
  onClick?: () => void;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

export const ModuleKpiCell: React.FC<ModuleKpiCellProps> = ({
  label,
  count,
  subtext,
  icon,
  accentClass = '',
  onClick,
  className = '',
  testId,
  ariaLabel,
}) => {
  return (
    <div
      className={`bookings-kpi-cell ${accentClass} ${onClick ? 'interactive' : ''} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={ariaLabel || `${label}: ${count}`}
      data-testid={testId}
    >
      <div className="bookings-kpi-cell-top">
        {icon && <div className="bookings-kpi-icon-wrapper">{icon}</div>}
        <span className="bookings-kpi-label">{label}</span>
      </div>
      <div className="bookings-kpi-count">{count}</div>
      {subtext && <div className="bookings-kpi-subtext">{subtext}</div>}
    </div>
  );
};
