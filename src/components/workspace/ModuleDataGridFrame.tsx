import React from 'react';

export interface ModuleDataGridFrameProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
  naturalHeight?: boolean;
}

/**
 * ModuleDataGridFrame
 *
 * Canonical scrollable table frame with full-width overflow handling.
 */
export const ModuleDataGridFrame: React.FC<ModuleDataGridFrameProps> = ({
  children,
  className = '',
  testId,
  naturalHeight = false,
}) => {
  return (
    <div
      className={`bookings-datagrid-wrapper ${naturalHeight ? 'natural-height' : ''} ${className}`.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  );
};

export interface ModuleTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * ModuleTable
 *
 * Canonical operational DataGrid table primitive with standard typography and borders.
 */
export const ModuleTable: React.FC<ModuleTableProps> = ({
  children,
  className = '',
  ...rest
}) => {
  return (
    <table className={`bookings-table ${className}`.trim()} {...rest}>
      {children}
    </table>
  );
};
