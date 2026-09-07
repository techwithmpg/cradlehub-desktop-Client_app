import React, { useRef } from 'react';

export interface ModuleTabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number | string;
  badge?: string | React.ReactNode;
}

export interface ModuleTabsProps<T extends string = string> {
  tabs: Array<ModuleTabItem<T>>;
  activeTab: T;
  onTabChange: (tabId: T) => void;
  ariaLabel?: string;
  className?: string;
  containerClassName?: string;
  tabButtonClassName?: string;
  tabTestIdPrefix?: string;
  getTabTestId?: (id: T) => string;
  testId?: string;
}

/**
 * ModuleTabs
 *
 * Canonical in-card horizontal tab strip with keyboard navigation and ARIA attributes.
 */
export function ModuleTabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = 'Module Tabs',
  className = '',
  containerClassName = '',
  tabButtonClassName = 'bookings-scope-tab-btn',
  tabTestIdPrefix = 'module-tab',
  getTabTestId,
  testId = 'module-tabs',
}: ModuleTabsProps<T>) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = tabs[nextIndex];
      if (nextTab) {
        onTabChange(nextTab.id);
        const buttons =
          tabListRef.current?.querySelectorAll<HTMLButtonElement>(
            'button[role="tab"]',
          );
        buttons?.[nextIndex]?.focus();
      }
    }
  };

  return (
    <div
      className={`bookings-scope-tabs-container ${containerClassName}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
      data-testid={testId}
      ref={tabListRef}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        const buttonTestId = getTabTestId
          ? getTabTestId(tab.id)
          : `${tabTestIdPrefix}-${tab.id}`;

        return (
          <button
            key={tab.id}
            type="button"
            className={`${tabButtonClassName} ${isActive ? 'active' : ''} ${className}`.trim()}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            data-testid={buttonTestId}
          >
            <span className="tab-label">{tab.label}</span>
            {tab.count !== undefined && (
              <span className="tab-count-badge">{tab.count}</span>
            )}
            {tab.badge &&
              (typeof tab.badge === 'string' ||
              typeof tab.badge === 'number' ? (
                <span className="tab-pill-badge">{tab.badge}</span>
              ) : (
                tab.badge
              ))}
          </button>
        );
      })}
    </div>
  );
}
