import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContext } from '../src/types/auth';
import type { OperationsCenterData } from '../src/types/operations';
import { OperationsWorkspace } from '../src/components/operations/OperationsWorkspace';
import {
  WorkspaceLifecycleProvider,
  WorkspaceModulePresence,
} from '../src/components/workspace';
import * as operationsService from '../src/lib/operations-service';

vi.mock('../src/lib/operations-service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../src/lib/operations-service')>();
  return {
    ...actual,
    fetchOperationsCenterData: vi.fn(),
    assignServiceProvider: vi.fn(),
    resolveAttendanceException: vi.fn(),
    generateDeviceRecovery: vi.fn(),
  };
});

const mockAuthContext: AuthContext = {
  userId: 'usr-100',
  email: 'maria@cradlehub.com',
  staffId: 'staff-100',
  fullName: 'Maria Santos',
  canonicalRole: 'crm',
  rawRole: 'csr_staff',
  branchId: 'branch-10',
  branchName: 'Makati Central Branch',
  isCrmEligible: true,
};

const mockOperationsData: OperationsCenterData = {
  branchId: 'branch-10',
  branchName: 'Makati Central Branch',
  checkedAt: '2026-10-25T08:00:00Z',
  issues: [
    {
      id: 'issue-1',
      area: 'configuration',
      severity: 'critical',
      resolutionState: 'detected',
      title: 'Prenatal Massage has no qualified providers',
      description:
        'Active service has 0 qualified providers assigned in this branch.',
      guidance: 'Assign an active, qualified therapist to this service.',
      actionLabel: 'Assign Provider',
      actionHref: '/admin/services',
      code: 'UNQUALIFIED_SERVICE',
      scanIdSuffix: null,
      detectedAt: '2026-10-25T07:30:00Z',
      serviceId: 'srv-1',
      serviceName: 'Prenatal Massage',
      resolutionKind: 'provider_assignment',
    },
    {
      id: 'issue-2',
      area: 'attendance',
      severity: 'warning',
      resolutionState: 'under_review',
      title: 'Device limit reached for staff member',
      description: 'Elena Rostova registered maximum allowable mobile devices.',
      guidance: 'Issue an authoritative replacement device activation link.',
      actionLabel: 'Recover Device',
      actionHref: '/admin/devices',
      code: 'DEVICE_LIMIT_REACHED',
      scanIdSuffix: '7A8B',
      detectedAt: '2026-10-25T07:45:00Z',
      staffId: 'staff-elena',
      staffName: 'Elena Rostova',
      resolutionKind: 'device_recovery',
    },
    {
      id: 'issue-3',
      area: 'staff_identity',
      severity: 'info',
      resolutionState: 'detected',
      title: 'Potential duplicate staff profile detected',
      description: 'Elena Rostova shares phone number with existing account.',
      guidance: 'Inspect profile differences and verify staff identity.',
      actionLabel: 'Inspect Duplicates',
      actionHref: '/admin/staff',
      code: 'DUPLICATE_PHONE',
      scanIdSuffix: null,
      detectedAt: '2026-10-25T07:50:00Z',
      staffId: 'staff-elena',
      staffName: 'Elena Rostova',
      resolutionKind: 'staff_duplicate',
    },
  ],
  scans: [
    {
      id: 'scan-1',
      staffId: 'staff-elena',
      staffName: 'Elena Rostova',
      reasonCode: 'DEVICE_LIMIT_REACHED',
      message: 'Staff phone was rejected because device limit was reached.',
      scanIdSuffix: '7A8B',
      occurredAt: '2026-10-25T07:45:00Z',
      isUnresolvedFailure: true,
    },
  ],
  attendanceAvailable: true,
  configurationAvailable: true,
  staffAvailable: true,
  branchStaff: [
    {
      id: 'staff-elena',
      full_name: 'Elena Rostova',
      system_role: 'staff',
      staff_type: 'therapist',
      is_active: true,
      branch_id: 'branch-10',
      hasLoginAccount: true,
      isIdentityVerified: true,
    },
  ],
  counts: {
    critical: 1,
    warning: 1,
    info: 1,
    attendance: 1,
    staff: 1,
    configuration: 1,
    unresolvedScans: 1,
    totalIssues: 3,
  },
  readyLabel: 'Attention Required',
  operatorRole: 'manager',
  canPerformMutations: true,
};

function renderOperationsWorkspace(auth = mockAuthContext) {
  return render(
    <WorkspaceLifecycleProvider>
      <WorkspaceModulePresence moduleId="operations" isActive={true}>
        <OperationsWorkspace authContext={auth} />
      </WorkspaceModulePresence>
    </WorkspaceLifecycleProvider>,
  );
}

describe('Operations Center Workspace Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(operationsService.fetchOperationsCenterData).mockResolvedValue(
      mockOperationsData,
    );
  });

  it('renders loading state initially and then displays workspace header and KPIs', async () => {
    renderOperationsWorkspace();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Operations Center/i }),
      ).toBeDefined();
    });

    // Check KPI summary counts
    expect(screen.getByTestId('kpi-critical').textContent).toContain('1');
    expect(screen.getByTestId('kpi-warning').textContent).toContain('1');
    expect(screen.getByTestId('kpi-attendance').textContent).toContain('1');
    expect(screen.getByTestId('kpi-configuration').textContent).toContain('1');
    expect(screen.getByTestId('kpi-staff').textContent).toContain('1');
    expect(screen.getByTestId('kpi-scans').textContent).toContain('1');
  });

  it('renders issue items in the DataGrid table', async () => {
    renderOperationsWorkspace();

    await waitFor(() => {
      expect(
        screen.getByText('Prenatal Massage has no qualified providers'),
      ).toBeDefined();
      expect(
        screen.getByText('Device limit reached for staff member'),
      ).toBeDefined();
      expect(
        screen.getByText('Potential duplicate staff profile detected'),
      ).toBeDefined();
    });
  });

  it('filters issues when typing in the search bar', async () => {
    const user = userEvent.setup();
    renderOperationsWorkspace();

    await waitFor(() => {
      expect(
        screen.getByText('Prenatal Massage has no qualified providers'),
      ).toBeDefined();
    });

    const searchInput = screen.getByTestId('ops-search-input');
    await user.type(searchInput, 'Prenatal');

    expect(
      screen.getByText('Prenatal Massage has no qualified providers'),
    ).toBeDefined();
    expect(
      screen.queryByText('Device limit reached for staff member'),
    ).toBeNull();
  });

  it('switches to Unsuccessful Scans tab and displays failed scans table', async () => {
    const user = userEvent.setup();
    renderOperationsWorkspace();

    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: /Unsuccessful Scans/i }),
      ).toBeDefined();
    });

    const scansTab = screen.getByRole('tab', { name: /Unsuccessful Scans/i });
    await user.click(scansTab);

    await waitFor(() => {
      expect(screen.getByText('#7A8B')).toBeDefined();
      expect(
        screen.getByText(
          /Staff phone was rejected because device limit was reached/i,
        ),
      ).toBeDefined();
    });
  });

  it('opens issue in the right inspector column on row click and shows guided action', async () => {
    const user = userEvent.setup();
    renderOperationsWorkspace();

    await waitFor(() => {
      expect(
        screen.getByText('Prenatal Massage has no qualified providers'),
      ).toBeDefined();
    });

    const row = screen.getByTestId('ops-issue-row-issue-1');
    await user.click(row);

    // Inspector should now display Issue Diagnostic and resolution button
    await waitFor(() => {
      expect(screen.getByTestId('ops-issue-inspector')).toBeDefined();
      expect(
        screen.getByTestId('ops-assign-provider-action-btn'),
      ).toBeDefined();
    });
  });

  it('opens guided provider modal when clicking assign provider button in inspector', async () => {
    const user = userEvent.setup();
    renderOperationsWorkspace();

    await waitFor(() => {
      expect(
        screen.getByText('Prenatal Massage has no qualified providers'),
      ).toBeDefined();
    });

    const row = screen.getByTestId('ops-issue-row-issue-1');
    await user.click(row);

    const assignBtn = await screen.findByTestId(
      'ops-assign-provider-action-btn',
    );
    await user.click(assignBtn);

    // Modal dialog should open
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Assign Service Provider/i }),
      ).toBeDefined();
    });
  });

  it('shows read-only banner in inspector when operator lacks mutation authority', async () => {
    vi.mocked(operationsService.fetchOperationsCenterData).mockResolvedValue({
      ...mockOperationsData,
      canPerformMutations: false,
      operatorRole: 'crm',
    });

    const user = userEvent.setup();
    renderOperationsWorkspace();

    await waitFor(() => {
      expect(
        screen.getByText('Prenatal Massage has no qualified providers'),
      ).toBeDefined();
    });

    const row = screen.getByTestId('ops-issue-row-issue-1');
    await user.click(row);

    await waitFor(() => {
      expect(screen.getByText(/Read-Only Access \(crm\)/i)).toBeDefined();
    });
  });

  it('renders truthful banner when attendance service is offline', async () => {
    vi.mocked(operationsService.fetchOperationsCenterData).mockResolvedValue({
      ...mockOperationsData,
      attendanceAvailable: false,
    });

    renderOperationsWorkspace();

    await waitFor(() => {
      expect(
        screen.getByText(
          /Attendance and scan diagnostics service is currently unavailable for this branch/i,
        ),
      ).toBeDefined();
    });
    expect(screen.getByTestId('kpi-attendance').textContent).toContain(
      'Unavailable',
    );
    expect(screen.getByTestId('kpi-critical').textContent).toContain(
      'Unavailable',
    );
  });

  it('does not show zero diagnostics or a clear queue when the hosted read fails', async () => {
    vi.mocked(operationsService.fetchOperationsCenterData).mockRejectedValue(
      new Error('Operations Center endpoint unavailable'),
    );
    renderOperationsWorkspace();
    await waitFor(() =>
      expect(screen.getByTestId('ops-error-banner')).toBeDefined(),
    );
    expect(screen.queryByTestId('ops-summary-card')).toBeNull();
    expect(screen.queryByText(/All operational checks passed/)).toBeNull();
  });
});
