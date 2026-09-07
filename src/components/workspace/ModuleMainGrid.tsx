import React from 'react';

export interface ModuleMainGridProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * ModuleMainGrid
 *
 * Canonical 2-column operational workspace grid (1fr + 380px inspector).
 */
export const ModuleMainGrid: React.FC<ModuleMainGridProps> = ({
  children,
  className = '',
  testId,
}) => {
  return (
    <div
      className={`bookings-main-grid ${className}`.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  );
};

export interface ModulePrimaryColumnProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * ModulePrimaryColumn
 *
 * Left primary column (1fr flex) housing the primary operational card / DataGrid.
 */
export const ModulePrimaryColumn: React.FC<ModulePrimaryColumnProps> = ({
  children,
  className = '',
  testId,
}) => {
  return (
    <div
      className={`bookings-list-column ${className}`.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  );
};

export interface ModuleInspectorColumnProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * ModuleInspectorColumn
 *
 * Right inspector column (380px width) housing context inspector details.
 */
export const ModuleInspectorColumn: React.FC<ModuleInspectorColumnProps> = ({
  children,
  className = '',
  testId,
}) => {
  return (
    <div
      className={`bookings-inspector-column ${className}`.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  );
};
