import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ModuleWorkspaceHost,
  ModuleWorkspace,
  ModuleHeader,
  ModuleSummaryCard,
  ModuleKpiGrid,
  ModuleKpiCell,
  ModuleMainGrid,
  ModulePrimaryColumn,
  ModuleInspectorColumn,
  ModulePrimaryCard,
  ModuleTabs,
  ModuleToolbar,
  ModuleDataGridFrame,
  ModuleTable,
  ModulePagination,
  ModuleInspectorFrame,
  ModuleInspectorEmptyState,
  ModuleLoadingState,
  ModuleErrorBanner,
  ModuleSuccessBanner,
} from '../src/components/workspace';

describe('Canonical Module Workspace Components', () => {
  describe('ModuleWorkspaceHost', () => {
    it('renders children with standard and wide canvas classes', () => {
      const { rerender } = render(
        <ModuleWorkspaceHost wide={true} testId="test-host">
          <div>Workspace Content</div>
        </ModuleWorkspaceHost>,
      );

      const host = screen.getByTestId('test-host');
      expect(host.className).toContain('workspace-canvas');
      expect(host.className).toContain('workspace-canvas-wide');
      expect(screen.getByText('Workspace Content')).toBeDefined();

      rerender(
        <ModuleWorkspaceHost wide={false} testId="test-host">
          <div>Narrow Content</div>
        </ModuleWorkspaceHost>,
      );
      expect(host.className).toContain('workspace-canvas');
      expect(host.className).not.toContain('workspace-canvas-wide');
    });
  });

  describe('ModuleWorkspace', () => {
    it('renders main container with role and aria-label', () => {
      render(
        <ModuleWorkspace
          ariaLabel="Test Management"
          testId="test-workspace-root"
        >
          <div>Body</div>
        </ModuleWorkspace>,
      );

      const root = screen.getByTestId('test-workspace-root');
      expect(root.getAttribute('role')).toBe('main');
      expect(root.getAttribute('aria-label')).toBe('Test Management');
      expect(root.className).toContain('bookings-view-container');
    });
  });

  describe('ModuleHeader', () => {
    it('renders title, subtitle, refresh button and primary action', async () => {
      const handleRefresh = vi.fn();
      const handlePrimary = vi.fn();

      render(
        <ModuleHeader
          title="Test Module"
          subtitle="Test Module Subtitle"
          onRefresh={handleRefresh}
          isRefreshing={false}
          refreshTitle="Refresh Data"
          refreshAriaLabel="Refresh Data"
          primaryAction={{
            label: 'New Action',
            onClick: handlePrimary,
            testId: 'test-primary-action',
          }}
          testId="test-header"
        />,
      );

      expect(screen.getByText('Test Module')).toBeDefined();
      expect(screen.getByText('Test Module Subtitle')).toBeDefined();

      const refreshBtn = screen.getByLabelText('Refresh Data');
      expect(refreshBtn).toBeDefined();
      fireEvent.click(refreshBtn);
      expect(handleRefresh).toHaveBeenCalledTimes(1);

      const primaryBtn = screen.getByTestId('test-primary-action');
      expect(primaryBtn).toBeDefined();
      fireEvent.click(primaryBtn);
      expect(handlePrimary).toHaveBeenCalledTimes(1);
    });

    it('renders spinner when isRefreshing is true and disables refresh button', () => {
      render(
        <ModuleHeader
          title="Test"
          onRefresh={vi.fn()}
          isRefreshing={true}
          refreshAriaLabel="Refreshing"
        />,
      );

      const refreshBtn = screen.getByLabelText(
        'Refreshing',
      ) as HTMLButtonElement;
      expect(refreshBtn.disabled).toBe(true);
    });
  });

  describe('ModuleSummary & KPI Grid', () => {
    it('renders summary card with grid and clickable KPI cell', () => {
      const handleClick = vi.fn();

      render(
        <ModuleSummaryCard ariaLabel="Summary Metrics">
          <ModuleKpiGrid>
            <ModuleKpiCell
              label="Active Bookings"
              count={42}
              subtext="Real-time count"
              accentClass="kpi-accent-emerald"
              onClick={handleClick}
              testId="kpi-active"
            />
          </ModuleKpiGrid>
        </ModuleSummaryCard>,
      );

      expect(screen.getByText('Active Bookings')).toBeDefined();
      expect(screen.getByText('42')).toBeDefined();
      expect(screen.getByText('Real-time count')).toBeDefined();

      const cell = screen.getByTestId('kpi-active');
      fireEvent.click(cell);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(cell, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('ModuleMainGrid & Columns', () => {
    it('renders grid with primary and inspector columns', () => {
      render(
        <ModuleMainGrid testId="main-grid">
          <ModulePrimaryColumn testId="col-primary">
            <div>Primary Content</div>
          </ModulePrimaryColumn>
          <ModuleInspectorColumn testId="col-inspector">
            <div>Inspector Content</div>
          </ModuleInspectorColumn>
        </ModuleMainGrid>,
      );

      const grid = screen.getByTestId('main-grid');
      expect(grid.className).toContain('bookings-main-grid');
      expect(screen.getByTestId('col-primary').className).toContain(
        'bookings-list-column',
      );
      expect(screen.getByTestId('col-inspector').className).toContain(
        'bookings-inspector-column',
      );
    });
  });

  describe('ModulePrimaryCard', () => {
    it('renders primary operational card wrapper', () => {
      render(
        <ModulePrimaryCard ariaLabel="Card Region" testId="primary-card">
          <div>Card Content</div>
        </ModulePrimaryCard>,
      );

      const card = screen.getByTestId('primary-card');
      expect(card.className).toContain('bookings-list-card');
      expect(card.getAttribute('role')).toBe('region');
    });
  });

  describe('ModuleTabs', () => {
    it('renders accessible tab list and handles keyboard navigation', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();

      const tabs = [
        { id: 'tab1', label: 'First Tab', count: 10 },
        { id: 'tab2', label: 'Second Tab', count: 5 },
        { id: 'tab3', label: 'Third Tab' },
      ];

      render(
        <ModuleTabs
          tabs={tabs}
          activeTab="tab1"
          onTabChange={handleTabChange}
          ariaLabel="Test Tabs"
          testId="test-tabs"
        />,
      );

      const tab1 = screen.getByTestId('module-tab-tab1');
      const tab2 = screen.getByTestId('module-tab-tab2');

      expect(tab1.getAttribute('aria-selected')).toBe('true');
      expect(tab2.getAttribute('aria-selected')).toBe('false');
      expect(screen.getByText('10')).toBeDefined();

      await user.click(tab2);
      expect(handleTabChange).toHaveBeenCalledWith('tab2');

      // ArrowRight keyboard navigation
      fireEvent.keyDown(tab1, { key: 'ArrowRight' });
      expect(handleTabChange).toHaveBeenCalledWith('tab2');

      // End key navigation
      fireEvent.keyDown(tab1, { key: 'End' });
      expect(handleTabChange).toHaveBeenCalledWith('tab3');

      // Home key navigation
      fireEvent.keyDown(tab2, { key: 'Home' });
      expect(handleTabChange).toHaveBeenCalledWith('tab1');
    });
  });

  describe('ModuleToolbar', () => {
    it('renders toolbar with role="toolbar"', () => {
      render(
        <ModuleToolbar ariaLabel="Test Toolbar" testId="test-toolbar">
          <input placeholder="Search..." />
        </ModuleToolbar>,
      );

      const toolbar = screen.getByTestId('test-toolbar');
      expect(toolbar.getAttribute('role')).toBe('toolbar');
      expect(toolbar.className).toContain('bookings-toolbar-container');
    });
  });

  describe('ModuleDataGridFrame & ModuleTable', () => {
    it('renders data grid frame with table', () => {
      render(
        <ModuleDataGridFrame testId="grid-frame">
          <ModuleTable aria-label="Test Table">
            <thead>
              <tr>
                <th>Header</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cell</td>
              </tr>
            </tbody>
          </ModuleTable>
        </ModuleDataGridFrame>,
      );

      expect(screen.getByTestId('grid-frame').className).toContain(
        'bookings-datagrid-wrapper',
      );
      expect(screen.getByLabelText('Test Table').className).toContain(
        'bookings-table',
      );
    });
  });

  describe('ModulePagination', () => {
    it('renders pagination details and handles page transitions', () => {
      const handlePageChange = vi.fn();
      const handlePageSizeChange = vi.fn();

      render(
        <ModulePagination
          startRecord={1}
          endRecord={10}
          totalItems={25}
          entityLabel="bookings"
          pageSize={10}
          currentPage={1}
          totalPages={3}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          testId="test-pagination"
        />,
      );

      expect(screen.getByText(/bookings/i)).toBeDefined();
      expect(screen.getByText('Page 1 of 3')).toBeDefined();

      const prevBtn = screen.getByLabelText(
        'Previous page',
      ) as HTMLButtonElement;
      const nextBtn = screen.getByLabelText('Next page') as HTMLButtonElement;

      expect(prevBtn.disabled).toBe(true);
      expect(nextBtn.disabled).toBe(false);

      fireEvent.click(nextBtn);
      expect(handlePageChange).toHaveBeenCalledWith(2);

      const select = screen.getByLabelText(
        'Rows per page',
      ) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '25' } });
      expect(handlePageSizeChange).toHaveBeenCalledWith(25);
    });
  });

  describe('ModuleInspectorFrame & ModuleInspectorEmptyState', () => {
    it('renders empty state when isEmpty is true', () => {
      render(
        <ModuleInspectorFrame
          isEmpty={true}
          emptyState={
            <ModuleInspectorEmptyState
              title="Nothing Selected"
              description="Please select an item"
              testId="custom-empty"
            />
          }
          testId="test-inspector"
        />,
      );

      const frame = screen.getByTestId('test-inspector');
      expect(frame.className).toContain('booking-inspector-card');
      expect(frame.className).toContain('empty');
      expect(screen.getByText('Nothing Selected')).toBeDefined();
      expect(screen.getByText('Please select an item')).toBeDefined();
    });

    it('renders active inspector children when isEmpty is false', () => {
      render(
        <ModuleInspectorFrame isEmpty={false} testId="test-inspector">
          <div>Active Details</div>
        </ModuleInspectorFrame>,
      );

      const frame = screen.getByTestId('test-inspector');
      expect(frame.className).toContain('booking-inspector-card');
      expect(frame.className).toContain('active');
      expect(screen.getByText('Active Details')).toBeDefined();
    });
  });

  describe('ModuleLoadingState', () => {
    it('renders loading skeleton with aria-busy="true"', () => {
      render(
        <ModuleLoadingState
          ariaLabel="Loading test data"
          testId="test-loading"
        />,
      );

      const skeleton = screen.getByTestId('test-loading');
      expect(skeleton.getAttribute('aria-busy')).toBe('true');
      expect(skeleton.className).toContain('bookings-loading-state');
    });
  });

  describe('ModuleStateMessage', () => {
    it('renders ModuleErrorBanner with message and retry trigger', () => {
      const handleRetry = vi.fn();
      render(
        <ModuleErrorBanner
          message="Connection failed"
          onRetry={handleRetry}
          testId="test-error"
        />,
      );

      expect(screen.getByText('Connection failed')).toBeDefined();
      const retryBtn = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renders ModuleSuccessBanner with message, warning, and dismiss trigger', () => {
      const handleDismiss = vi.fn();
      render(
        <ModuleSuccessBanner
          message="Record saved"
          warning="Requires manual verification"
          onDismiss={handleDismiss}
          testId="test-success"
        />,
      );

      expect(screen.getByText('Record saved')).toBeDefined();
      expect(screen.getByText('Requires manual verification')).toBeDefined();
      const dismissBtn = screen.getByLabelText('Dismiss message');
      fireEvent.click(dismissBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
