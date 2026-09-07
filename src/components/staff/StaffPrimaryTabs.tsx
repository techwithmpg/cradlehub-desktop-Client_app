import React, { useCallback } from 'react';
import type { StaffPrimaryTab } from '../../types/staff';

interface TabItem {
  key: StaffPrimaryTab;
  label: string;
  count?: number;
}

interface StaffPrimaryTabsProps {
  activeTab: StaffPrimaryTab;
  onTabChange: (tab: StaffPrimaryTab) => void;
  rosterCount?: number;
  applicationsCount?: number;
}

export const StaffPrimaryTabs: React.FC<StaffPrimaryTabsProps> = ({
  activeTab,
  onTabChange,
  rosterCount,
  applicationsCount,
}) => {
  const tabs: TabItem[] = React.useMemo(
    () => [
      { key: 'roster', label: 'Staff Roster', count: rosterCount },
      { key: 'schedule', label: 'Schedule View' },
      {
        key: 'applications',
        label: 'Applications',
        count:
          applicationsCount && applicationsCount > 0
            ? applicationsCount
            : undefined,
      },
      { key: 'performance', label: 'Performance' },
      { key: 'capabilities', label: 'Capabilities & Services' },
      { key: 'roles', label: 'Roles & Permissions' },
    ],
    [rosterCount, applicationsCount],
  );

  const activeIndex = tabs.findIndex((t) => t.key === activeTab);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const last = tabs.length - 1;
      let nextIndex: number;

      if (e.key === 'ArrowRight') {
        nextIndex = activeIndex >= last ? 0 : activeIndex + 1;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = activeIndex <= 0 ? last : activeIndex - 1;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = last;
      } else {
        return;
      }

      e.preventDefault();
      const target = tabs[nextIndex];
      if (target) {
        onTabChange(target.key);
      }
    },
    [activeIndex, onTabChange, tabs],
  );

  return (
    <div className="staff-primary-tabs-container">
      <div
        role="tablist"
        aria-label="Staff management views"
        onKeyDown={handleKeyDown}
        className="staff-primary-tabs-nav"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`staff-primary-tab-${tab.key}`}
              data-testid={`staff-primary-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`staff-primary-panel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.key)}
              className={`staff-primary-tab-btn ${isActive ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`staff-primary-tab-badge ${isActive ? 'active' : ''}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
