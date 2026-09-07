import React from 'react';

export interface ModuleDataGridFrameProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
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
}) => {
  return (
    <div
      className={`bookings-datagrid-wrapper ${className}`.trim()}
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
