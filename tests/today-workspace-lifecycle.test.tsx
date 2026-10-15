import { useState } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '../src/types/auth';
import type { DesktopTodayData } from '../src/types/today';
import { TodayView } from '../src/components/today/TodayView';
import {
  WorkspaceLifecycleProvider,
  WorkspaceModulePresence,
  useWorkspaceInvalidation,
} from '../src/components/workspace';
import { clearInFlightOperationsForTests } from '../src/lib/single-flight';
import * as todayService from '../src/lib/today-service';

vi.mock('../src/lib/bookings-service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../src/lib/bookings-service')>();

  return {
    ...actual,
    fetchBranchBookingOptions: vi.fn().mockResolvedValue({
      services: [],
      staff: [],
      resources: [],
    }),
    searchBranchCustomers: vi.fn().mockResolvedValue([]),
  };
});

const authContext: AuthContext = {
  userId: 'user-01',
  email: 'crm@example.com',
  staffId: 'staff-01',
  fullName: 'CRM Operator',
  canonicalRole: 'crm',
  rawRole: 'crm',
  branchId: 'branch-main',
  branchName: 'Main Spa',
  isCrmEligible: true,
};

function createTodayData(total: number): DesktopTodayData {
  return {
    context: {
      branchId: 'branch-main',
      branchName: 'Main Spa',
      businessDate: '2026-10-15',
      role: 'crm',
    },
    summary: {
      total,
      pending: 0,
      confirmed: total,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      unassigned: 0,
      waiting: total,
      inService: 0,
      readyToPay: 0,
      completedService: 0,
      homeService: 0,
    },
    queue: [],
    readiness: {
      available: true,
      status: 'ok',
      issues: [],
      error: null,
    },
    attendance: {
      available: true,
      selectedDate: '2026-10-15',
      timezone: 'Asia/Manila',
      lastHourCount: 0,
      items: [],
      error: null,
    },
    notifications: {
      available: true,
      items: [],
      error: null,
    },
  };
}

function LifecycleHarness() {
  const [isActive, setIsActive] = useState(true);
  const invalidate = useWorkspaceInvalidation();

  return (
    <>
      <button type="button" onClick={() => setIsActive(false)}>
        Hide Today
      </button>

      <button type="button" onClick={() => invalidate(['today'])}>
        Dirty Today
      </button>

      <button type="button" onClick={() => setIsActive(true)}>
        Show Today
      </button>

      <WorkspaceModulePresence moduleId="today" isActive={isActive}>
        <div hidden={!isActive}>
          <TodayView authContext={authContext} />
        </div>
      </WorkspaceModulePresence>
    </>
  );
}

describe('Today retained workspace lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearInFlightOperationsForTests();
  });

  it('retains validated Today data while hidden and reconciles when reactivated', async () => {
    const initialData = createTodayData(3);
    const refreshedData = createTodayData(7);

    let resolveRefresh!: (value: DesktopTodayData) => void;

    const fetchSpy = vi
      .spyOn(todayService, 'fetchToday')
      .mockResolvedValueOnce(initialData)
      .mockImplementationOnce(
        () =>
          new Promise<DesktopTodayData>((resolve) => {
            resolveRefresh = resolve;
          }),
      );

    render(
      <WorkspaceLifecycleProvider>
        <LifecycleHarness />
      </WorkspaceLifecycleProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('today-loading-skeleton')).toBeNull();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Hide Today' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dirty Today' }));

    await Promise.resolve();

    // Hidden dirty Today consumes no network request.
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Show Today' }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    // Existing validated workspace remains rendered during reconciliation.
    expect(screen.getByTestId('today-page-grid')).toBeDefined();

    await act(async () => {
      resolveRefresh(refreshedData);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('today-page-grid')).toBeDefined();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
