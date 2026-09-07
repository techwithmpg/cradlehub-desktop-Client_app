import React from 'react';
import { ModuleHeader } from '../workspace/ModuleHeader';

interface StaffHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenAddStaff?: () => void;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  onOpenAddStaff,
}) => {
  return (
    <ModuleHeader
      title="Staff"
      subtitle="Manage staff, capabilities and operational access."
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      refreshTitle="Refresh Staff Roster"
      refreshAriaLabel="Refresh Staff Roster"
      primaryAction={
        onOpenAddStaff
          ? {
              label: 'Add Staff',
              onClick: onOpenAddStaff,
              ariaLabel: 'Add new staff member',
              testId: 'add-staff-btn',
            }
          : undefined
      }
      className="staff-header-container"
      testId="staff-header"
    />
  );
};
