import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { StaffView } from '../src/components/staff/StaffView';
import { CanonicalShell } from '../src/components/CanonicalShell';
import * as staffService from '../src/lib/staff-service';
import * as scheduleService from '../src/lib/schedule-service';
import { StaffApplicationApprovalModal } from '../src/components/staff/modals/StaffApplicationApprovalModal';
import { StaffRoleModal } from '../src/components/staff/modals/StaffRoleModal';
import { StaffScheduleModal } from '../src/components/staff/modals/StaffScheduleModal';
import { StaffOffboardingNoticeModal } from '../src/components/staff/modals/StaffOffboardingNoticeModal';
import { StaffCapabilityModal } from '../src/components/staff/modals/StaffCapabilityModal';
import type { AuthContext } from '../src/types/auth';
import type {
  BranchServiceOption,
  StaffMember,
  StaffOnboardingRequest,
  StaffScheduleOverride,
  StaffBlockedTime,
} from '../src/types/staff';

const mockAuthContext: AuthContext = {
  userId: 'user-1',
  email: 'manager@cradlehub.test',
  staffId: 'staff-1',
  fullName: 'Test Manager',
  canonicalRole: 'manager',
  rawRole: 'manager',
  branchId: 'branch-1',
  branchName: 'Cradle Alabang',
  isCrmEligible: true,
};

const mockStaffRoster: StaffMember[] = [
  {
    id: 's-1',
    branch_id: 'branch-1',
    auth_user_id: 'u-1',
    full_name: 'Maria Santos',
    nickname: 'Mary',
    phone: '09171234567',
    avatar_url: null,
    tier: 'senior',
    system_role: 'service_head',
    staff_type: 'therapist',
    is_head: true,
    is_active: true,
    is_cross_branch: false,
    created_at: '2025-05-10T08:00:00Z',
    updated_at: '2025-05-10T08:00:00Z',
    status: 'active',
    services: [
      { service_id: 'srv-1', service_name: 'Swedish Massage' },
      { service_id: 'srv-2', service_name: 'Deep Tissue Massage' },
    ],
  },
  {
    id: 's-2',
    branch_id: 'branch-1',
    auth_user_id: 'u-2',
    full_name: 'Juan Dela Cruz',
    nickname: null,
    phone: '09181112233',
    avatar_url: null,
    tier: 'mid',
    system_role: 'staff',
    staff_type: 'nail_tech',
    is_head: false,
    is_active: false,
    is_cross_branch: false,
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-15T09:00:00Z',
    status: 'awaiting',
    services: [{ service_id: 'srv-3', service_name: 'Classic Manicure' }],
  },
  {
    id: 's-3',
    branch_id: 'branch-1',
    auth_user_id: null,
    full_name: 'Pending invitation',
    nickname: null,
    phone: null,
    avatar_url: null,
    tier: 'junior',
    system_role: 'staff',
    staff_type: 'aesthetician',
    is_head: false,
    is_active: false,
    is_cross_branch: true,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    status: 'invited',
    services: [],
  },
  {
    id: 's-4',
    branch_id: 'branch-1',
    auth_user_id: 'u-4',
    full_name: 'Carlos Mendoza',
    nickname: 'Charlie',
    phone: '09191112233',
    avatar_url: null,
    tier: 'senior',
    system_role: 'crm',
    staff_type: 'csr',
    is_head: false,
    is_active: true,
    is_cross_branch: false,
    created_at: '2026-02-01T08:00:00Z',
    updated_at: '2026-02-01T08:00:00Z',
    status: 'active',
    services: [],
  },
];

const mockBranchServices: BranchServiceOption[] = [
  { id: 'srv-1', name: 'Swedish Massage', duration_minutes: 60 },
  { id: 'srv-2', name: 'Deep Tissue Massage', duration_minutes: 90 },
  { id: 'srv-3', name: 'Classic Manicure', duration_minutes: 45 },
  { id: 'srv-4', name: 'Foot Reflexology', duration_minutes: 60 },
];

const mockOnboardingRequests: StaffOnboardingRequest[] = [
  {
    id: 'req-1',
    full_name: 'Applicant Ana Gomez',
    email: 'ana@cradlehub.test',
    phone: '09178889999',
    preferred_role: 'Therapist',
    experience_years: 3,
    requested_branch_id: 'branch-1',
    status: 'submitted',
    staff_id: null,
    created_at: '2026-03-05T08:00:00Z',
    reviewed_at: null,
    reviewed_by_staff_id: null,
    rejection_reason: null,
    metadata: null,
  },
];

describe('Staff Workspace Component Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(staffService, 'fetchBranchStaff').mockResolvedValue({
      ok: true,
      data: mockStaffRoster,
      kpis: {
        totalStaff: 4,
        activeStaff: 2,
        awaitingStaff: 1,
        invitedStaff: 1,
      },
    });
    vi.spyOn(staffService, 'fetchBranchAssignableServices').mockResolvedValue(
      mockBranchServices,
    );
    vi.spyOn(staffService, 'fetchBranchOnboardingRequests').mockResolvedValue(
      mockOnboardingRequests,
    );
    vi.spyOn(staffService, 'fetchBranchScheduleWeek').mockResolvedValue({
      overrides: [],
      blockedTimes: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading skeleton state initially', () => {
    vi.spyOn(staffService, 'fetchBranchStaff').mockReturnValue(
      new Promise(() => {}),
    );

    render(<StaffView authContext={mockAuthContext} />);

    expect(screen.getByTestId('staff-skeleton')).toBeDefined();
    expect(screen.getByLabelText('Loading staff roster')).toBeDefined();
  });

  it('renders stable outer structure with inspector as a sibling to the workspace card', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.queryByTestId('staff-skeleton')).toBeNull();
    });

    // 1. Module Header
    expect(screen.getByTestId('staff-header')).toBeDefined();

    // 2. Persistent Summary Frame
    const summaryCard = screen.getByTestId('staff-summary-card');
    expect(summaryCard).toBeDefined();

    // 3. Main Workspace Card (Left Column)
    const workspaceCard = screen.getByTestId('staff-workspace-card');
    expect(workspaceCard).toBeDefined();

    // 4. Persistent Context Inspector (Right Column)
    const contextInspector = screen.getByTestId('staff-context-inspector');
    expect(contextInspector).toBeDefined();

    // 5. CRITICAL: Inspector is NOT a descendant of the workspace card
    expect(
      within(workspaceCard).queryByTestId('staff-context-inspector'),
    ).toBeNull();
  });

  it('renders populated roster with KPI summary cards and DataGrid', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.queryByTestId('staff-skeleton')).toBeNull();
    });

    // Check KPI testids and button semantics
    const totalKpi = screen.getByTestId('staff-kpi-totalStaff');
    const activeKpi = screen.getByTestId('staff-kpi-activeStaff');
    const awaitingKpi = screen.getByTestId('staff-kpi-awaitingStaff');
    const invitedKpi = screen.getByTestId('staff-kpi-invitedStaff');

    expect(totalKpi.tagName.toLowerCase()).toBe('button');
    expect(activeKpi.tagName.toLowerCase()).toBe('button');
    expect(awaitingKpi.tagName.toLowerCase()).toBe('button');
    expect(invitedKpi.tagName.toLowerCase()).toBe('button');
    expect(activeKpi.getAttribute('aria-pressed')).toBe('false');

    // Verify KPI subtexts
    expect(totalKpi.textContent).toContain('Branch roster headcount');
    expect(activeKpi.textContent).toContain('Active branch staff');

    // Check staff rows
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-3')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-4')).toBeDefined();

    // Auto-selects first staff member
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Maria Santos',
    );
  });

  it('renders Staff Roster table with canonical bookings-table class, colgroup, and exactly 4 columns', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    const table = screen.getByRole('table', { name: 'Staff Roster Table' });
    expect(table).toBeDefined();
    expect(table.classList.contains('bookings-table')).toBe(true);
    expect(table.classList.contains('staff-roster-table')).toBe(true);

    // Verify 4 header columns
    expect(screen.getByText('Staff Member')).toBeDefined();
    expect(screen.getByText('Role / Function')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByText('Action')).toBeDefined();

    // Verify removed columns (Phone, Capabilities) are NOT present in table headers
    const tableHeader = table.querySelector('thead');
    expect(tableHeader).toBeDefined();
    expect(within(tableHeader!).queryByText('Phone')).toBeNull();
    expect(within(tableHeader!).queryByText('Capabilities')).toBeNull();
  });

  it('renders persistent summary card and updates truthful metrics for all 6 tabs', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // Tab 1: Roster
    expect(screen.getByTestId('staff-summary-card')).toBeDefined();
    expect(screen.getByTestId('staff-kpi-totalStaff').textContent).toContain(
      '4',
    );
    expect(screen.getByTestId('staff-kpi-activeStaff').textContent).toContain(
      '2',
    );
    expect(screen.getByTestId('staff-kpi-awaitingStaff').textContent).toContain(
      '1',
    );
    expect(screen.getByTestId('staff-kpi-invitedStaff').textContent).toContain(
      '1',
    );

    // Tab 2: Schedule View
    fireEvent.click(screen.getByTestId('staff-primary-tab-schedule'));
    expect(screen.getByTestId('staff-summary-card')).toBeDefined();
    expect(screen.getByTestId('staff-kpi-scheduleStaff').textContent).toContain(
      '4',
    );
    expect(
      screen.getByTestId('staff-kpi-scheduleOverrides').textContent,
    ).toContain('0');
    expect(
      screen.getByTestId('staff-kpi-scheduleBlocks').textContent,
    ).toContain('0');

    // Tab 3: Applications
    fireEvent.click(screen.getByTestId('staff-primary-tab-applications'));
    expect(screen.getByTestId('staff-summary-card')).toBeDefined();
    expect(
      screen.getByTestId('staff-kpi-totalApplications').textContent,
    ).toContain('1');
    expect(
      screen.getByTestId('staff-kpi-pendingApplications').textContent,
    ).toContain('1');
    expect(
      screen.getByTestId('staff-kpi-approvedApplications').textContent,
    ).toContain('0');
    expect(
      screen.getByTestId('staff-kpi-rejectedApplications').textContent,
    ).toContain('0');

    // Tab 4: Performance (Truthful unavailable)
    fireEvent.click(screen.getByTestId('staff-primary-tab-performance'));
    expect(screen.getByTestId('staff-summary-card')).toBeDefined();
    expect(
      screen.getByTestId('staff-kpi-performance-unavailable'),
    ).toBeDefined();
    expect(
      screen.getByText(
        'Performance metrics are not available in the current Staff contract.',
      ),
    ).toBeDefined();

    // Tab 5: Capabilities & Services
    fireEvent.click(screen.getByTestId('staff-primary-tab-capabilities'));
    expect(screen.getByTestId('staff-summary-card')).toBeDefined();
    expect(
      screen.getByTestId('staff-kpi-totalCapabilitiesStaff').textContent,
    ).toContain('4');
    expect(
      screen.getByTestId('staff-kpi-withCapabilities').textContent,
    ).toContain('2'); // s-1 (2 services), s-2 (1 service)
    expect(
      screen.getByTestId('staff-kpi-withoutCapabilities').textContent,
    ).toContain('2'); // s-3 (0), s-4 (0)
    expect(
      screen.getByTestId('staff-kpi-totalAssignments').textContent,
    ).toContain('3'); // 2 + 1 = 3

    // Tab 6: Roles & Permissions
    fireEvent.click(screen.getByTestId('staff-primary-tab-roles'));
    expect(screen.getByTestId('staff-summary-card')).toBeDefined();
    expect(
      screen.getByTestId('staff-kpi-totalRolesStaff').textContent,
    ).toContain('4');
    expect(
      screen.getByTestId('staff-kpi-linkedAccounts').textContent,
    ).toContain('3'); // u-1, u-2, u-4
    expect(
      screen.getByTestId('staff-kpi-unlinkedAccounts').textContent,
    ).toContain('1'); // s-3 is unlinked
    expect(
      screen.getByTestId('staff-kpi-departmentHeads').textContent,
    ).toContain('1'); // s-1 is_head: true

    // Switch back to Roster
    fireEvent.click(screen.getByTestId('staff-primary-tab-roster'));
    expect(screen.getByTestId('staff-summary-card')).toBeDefined();
    expect(screen.getByTestId('staff-kpi-totalStaff')).toBeDefined();
  });

  it('persists selected staff across staff-centric tabs and isolates application selection', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // Select Juan Dela Cruz (s-2) in Roster
    fireEvent.click(screen.getByTestId('staff-row-s-2'));
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Juan Dela Cruz',
    );

    // Switch to Capabilities tab -> Juan Dela Cruz remains selected
    fireEvent.click(screen.getByTestId('staff-primary-tab-capabilities'));
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Juan Dela Cruz',
    );

    // Switch to Roles tab -> Juan Dela Cruz remains selected
    fireEvent.click(screen.getByTestId('staff-primary-tab-roles'));
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Juan Dela Cruz',
    );

    // Switch to Schedule tab -> Juan Dela Cruz remains selected
    fireEvent.click(screen.getByTestId('staff-primary-tab-schedule'));
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Juan Dela Cruz',
    );

    // Switch to Applications tab -> Applicant Ana Gomez is selected
    fireEvent.click(screen.getByTestId('staff-primary-tab-applications'));
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Applicant Ana Gomez',
    );

    // Return to Roster -> Juan Dela Cruz is still selected!
    fireEvent.click(screen.getByTestId('staff-primary-tab-roster'));
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Juan Dela Cruz',
    );
  });

  it('keeps outer inspector shell mounted when closing selection and shows empty state', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // Close staff inspector selection
    const closeBtn = screen.getByLabelText('Close Inspector');
    fireEvent.click(closeBtn);

    // Outer context inspector shell remains in the DOM
    expect(screen.getByTestId('staff-context-inspector')).toBeDefined();
    expect(screen.getByTestId('staff-inspector-empty')).toBeDefined();
    expect(screen.getByText('No Staff Selected')).toBeDefined();
  });

  it('renders skill tier appropriately based on operational role in table and inspector', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // Inspector checks:
    // Initial selection is Maria Santos (service_head) -> Skill Tier detail row is omitted
    const inspectorSection1 = screen.getByTestId('inspector-profile-section');
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Maria Santos',
    );
    expect(within(inspectorSection1).queryByText('Skill Tier')).toBeNull();

    // Select Juan Dela Cruz (nail_tech / staff) -> Skill Tier detail row is displayed with 'Mid'
    const row2 = screen.getByTestId('staff-row-s-2');
    fireEvent.click(row2);
    const inspectorSection2 = screen.getByTestId('inspector-profile-section');
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Juan Dela Cruz',
    );
    expect(within(inspectorSection2).getByText('Skill Tier')).toBeDefined();
    expect(within(inspectorSection2).getByText('mid')).toBeDefined();

    // Select Carlos Mendoza (crm) -> Skill Tier detail row is omitted
    const row4 = screen.getByTestId('staff-row-s-4');
    fireEvent.click(row4);
    const inspectorSection3 = screen.getByTestId('inspector-profile-section');
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Carlos Mendoza',
    );
    expect(within(inspectorSection3).queryByText('Skill Tier')).toBeNull();
  });

  it('filters staff roster by status KPI clicks and toolbar and updates aria-pressed', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // Filter by Active KPI button
    fireEvent.click(screen.getByTestId('staff-kpi-activeStaff'));
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(screen.queryByTestId('staff-row-s-2')).toBeNull();
    expect(screen.queryByTestId('staff-row-s-3')).toBeNull();
    expect(screen.getByTestId('staff-row-s-4')).toBeDefined();
    expect(
      screen.getByTestId('staff-kpi-activeStaff').getAttribute('aria-pressed'),
    ).toBe('true');

    // Filter by Awaiting KPI button
    fireEvent.click(screen.getByTestId('staff-kpi-awaitingStaff'));
    expect(screen.queryByTestId('staff-row-s-1')).toBeNull();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();
    expect(screen.queryByTestId('staff-row-s-3')).toBeNull();
    expect(screen.queryByTestId('staff-row-s-4')).toBeNull();

    // Click Invites Sent KPI Button
    fireEvent.click(screen.getByTestId('staff-kpi-invitedStaff'));
    expect(screen.queryByTestId('staff-row-s-1')).toBeNull();
    expect(screen.queryByTestId('staff-row-s-2')).toBeNull();
    expect(screen.getByTestId('staff-row-s-3')).toBeDefined();
    expect(screen.queryByTestId('staff-row-s-4')).toBeNull();
    expect(
      screen.getByTestId('staff-kpi-invitedStaff').getAttribute('aria-pressed'),
    ).toBe('true');

    // Reset to Total Staff KPI button (all staff)
    fireEvent.click(screen.getByTestId('staff-kpi-totalStaff'));
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-3')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-4')).toBeDefined();
  });

  it('supports multi-facet toolbar filtering by search, role, type, and capability', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // Search by name
    const searchInput = screen.getByTestId('staff-search-input');
    fireEvent.change(searchInput, { target: { value: 'Juan' } });
    expect(screen.queryByTestId('staff-row-s-1')).toBeNull();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();

    // Reset filters via Clear search
    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();

    // Filter by Staff Type
    const typeSelect = screen.getByTestId('staff-type-filter');
    fireEvent.change(typeSelect, { target: { value: 'csr' } });
    expect(screen.queryByTestId('staff-row-s-1')).toBeNull();
    expect(screen.getByTestId('staff-row-s-4')).toBeDefined();

    // Reset toolbar
    fireEvent.click(screen.getByLabelText('Reset all filters'));
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-4')).toBeDefined();
  });

  it('enforces selection coherence when selected staff member is filtered or searched out', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // Initial selection is Maria Santos
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Maria Santos',
    );

    // Filter to 'awaiting' via KPI button
    fireEvent.click(screen.getByTestId('staff-kpi-awaitingStaff'));
    await waitFor(() => {
      expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
        'Juan Dela Cruz',
      );
    });

    // Switch to 'all' and search for 'Pending'
    fireEvent.click(screen.getByTestId('staff-kpi-totalStaff'));
    const searchInput = screen.getByTestId('staff-search-input');
    fireEvent.change(searchInput, { target: { value: 'Pending' } });
    await waitFor(() => {
      expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
        'Pending invitation',
      );
    });

    // Search for nonexistent term (0 results -> inspector empty)
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    await waitFor(() => {
      expect(screen.getByTestId('staff-inspector-empty')).toBeDefined();
      expect(screen.getByText('No Staff Selected')).toBeDefined();
    });

    // Clear search
    fireEvent.click(screen.getByLabelText('Clear search'));
    await waitFor(() => {
      expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
        'Maria Santos',
      );
    });
  });

  it('supports pagination controls with page size selector', async () => {
    // Generate 15 staff members to test pagination
    const manyStaff: StaffMember[] = Array.from({ length: 15 }, (_, i) => ({
      ...mockStaffRoster[0],
      id: `staff-${i + 1}`,
      full_name: `Staff Member ${String(i + 1).padStart(2, '0')}`,
    }));

    vi.spyOn(staffService, 'fetchBranchStaff').mockResolvedValue({
      ok: true,
      data: manyStaff,
      kpis: {
        totalStaff: 15,
        activeStaff: 15,
        awaitingStaff: 0,
        invitedStaff: 0,
      },
    });

    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-staff-1')).toBeDefined();
    });

    // Default pageSize is 10 -> page 1 shows staff-1 to staff-10
    expect(screen.getByTestId('staff-row-staff-1')).toBeDefined();
    expect(screen.getByTestId('staff-row-staff-10')).toBeDefined();
    expect(screen.queryByTestId('staff-row-staff-11')).toBeNull();

    // Next page
    const nextBtn = screen.getByLabelText('Next page');
    fireEvent.click(nextBtn);
    expect(screen.queryByTestId('staff-row-staff-1')).toBeNull();
    expect(screen.getByTestId('staff-row-staff-11')).toBeDefined();

    // Change page size to 25
    const pageSizeSelect = screen.getByLabelText('Rows per page');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });
    expect(screen.getByTestId('staff-row-staff-1')).toBeDefined();
    expect(screen.getByTestId('staff-row-staff-15')).toBeDefined();
  });

  it('switches internal inspector tabs and saves profile only after hosted success', async () => {
    const updateProfileSpy = vi
      .spyOn(staffService, 'updateStaffProfile')
      .mockResolvedValue({
        ok: true,
        data: { staff: { id: 's-1' } },
        message: 'Saved',
      });

    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // Check Overview tab default
    expect(screen.getByTestId('inspector-tab-overview')).toBeDefined();

    // Switch to Services tab
    fireEvent.click(screen.getByTestId('inspector-tab-services'));
    const inspectorCard = screen.getByTestId('staff-context-inspector');
    expect(within(inspectorCard).getByText('Swedish Massage')).toBeDefined();
    expect(
      within(inspectorCard).getByText('Deep Tissue Massage'),
    ).toBeDefined();

    // Switch to Access tab
    fireEvent.click(screen.getByTestId('inspector-tab-access'));
    expect(screen.getByText('Current Role')).toBeDefined();

    // Switch back to Overview tab and enter Edit Mode
    fireEvent.click(screen.getByTestId('inspector-tab-overview'));
    fireEvent.click(screen.getByTestId('inspector-edit-profile-btn'));

    // Verify edit form is shown
    const nameInput = screen.getByTestId('edit-staff-name');
    expect(nameInput).toBeDefined();

    expect(screen.queryByText(/UNAVAILABLE IN DESKTOP/)).toBeNull();
    expect(
      Array.from(
        (screen.getByTestId('edit-staff-tier') as HTMLSelectElement).options,
      ).map((option) => option.value),
    ).toEqual(['n/a', 'junior', 'mid', 'senior', 'head']);
    expect(
      Array.from(
        (screen.getByTestId('edit-staff-type') as HTMLSelectElement).options,
      ).map((option) => option.value),
    ).toContain('salon_head');
    fireEvent.change(nameInput, { target: { value: 'Maria Santos-Reyes' } });
    fireEvent.click(screen.getByTestId('save-profile-btn'));
    await waitFor(() => expect(updateProfileSpy).toHaveBeenCalledOnce());
    expect(updateProfileSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Maria Santos-Reyes',
        phone: undefined,
        tier: 'senior',
      }),
    );
    await waitFor(() =>
      expect(screen.queryByTestId('edit-profile-form')).toBeNull(),
    );
    expect(staffService.fetchBranchStaff).toHaveBeenCalledTimes(2);
  });

  it('profile does not patch local state while pending, preserves entered values on denial and blocks phone clearing', async () => {
    let resolve!: (value: { ok: false; code: string; error: string }) => void;
    const promise = new Promise<{ ok: false; code: string; error: string }>(
      (done) => {
        resolve = done;
      },
    );
    const spy = vi
      .spyOn(staffService, 'updateStaffProfile')
      .mockReturnValue(promise);
    render(<StaffView authContext={mockAuthContext} />);
    await waitFor(() =>
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined(),
    );
    fireEvent.click(screen.getByTestId('inspector-edit-profile-btn'));
    fireEvent.change(screen.getByTestId('edit-staff-name'), {
      target: { value: 'Changed Name' },
    });
    fireEvent.change(screen.getByTestId('edit-staff-phone'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('save-profile-btn'));
    expect(
      screen.getByText(/Clearing a saved phone is not supported/),
    ).toBeDefined();
    expect(spy).not.toHaveBeenCalled();
    fireEvent.change(screen.getByTestId('edit-staff-phone'), {
      target: { value: '09171234567' },
    });
    fireEvent.click(screen.getByTestId('save-profile-btn'));
    fireEvent.click(screen.getByTestId('save-profile-btn'));
    fireEvent.click(screen.getByTestId('staff-primary-tab-applications'));
    fireEvent.click(screen.getByTestId('staff-row-s-2'));
    expect(screen.getByTestId('edit-profile-form')).toBeDefined();
    expect(spy).toHaveBeenCalledOnce();
    expect(
      (screen.getByTestId('edit-staff-name') as HTMLInputElement).disabled,
    ).toBe(true);
    expect(staffService.fetchBranchStaff).toHaveBeenCalledOnce();
    expect(
      within(screen.getByTestId('staff-row-s-1')).queryByText('Changed Name'),
    ).toBeNull();
    resolve({ ok: false, code: 'FORBIDDEN', error: 'Profile forbidden' });
    await waitFor(() =>
      expect(screen.getByText('Profile forbidden')).toBeDefined(),
    );
    expect(
      (screen.getByTestId('edit-staff-name') as HTMLInputElement).value,
    ).toBe('Changed Name');
    expect(screen.getByTestId('edit-profile-form')).toBeDefined();
    expect(staffService.fetchBranchStaff).toHaveBeenCalledOnce();
  });

  it('switches between all 6 primary workspace tabs', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // 1. Switch to Schedule View tab
    fireEvent.click(screen.getByTestId('staff-primary-tab-schedule'));
    expect(screen.getByTestId('staff-schedule-view')).toBeDefined();

    // 2. Switch to Applications View tab
    fireEvent.click(screen.getByTestId('staff-primary-tab-applications'));
    expect(screen.getByTestId('staff-applications-view')).toBeDefined();
    expect(screen.getAllByText('Applicant Ana Gomez').length).toBeGreaterThan(
      0,
    );

    // 3. Switch to Performance tab (Truthful unavailable state)
    fireEvent.click(screen.getByTestId('staff-primary-tab-performance'));
    expect(screen.getByTestId('staff-performance-view')).toBeDefined();
    expect(
      screen.getByText(
        'Performance metrics are not available in the current Staff data contract.',
      ),
    ).toBeDefined();

    // 4. Switch to Capabilities & Services tab
    fireEvent.click(screen.getByTestId('staff-primary-tab-capabilities'));
    expect(screen.getByTestId('staff-capabilities-view')).toBeDefined();
    expect(
      screen.getAllByText(/Capabilities|Services/i).length,
    ).toBeGreaterThan(0);

    // 5. Switch to Roles & Permissions tab
    fireEvent.click(screen.getByTestId('staff-primary-tab-roles'));
    expect(screen.getByTestId('staff-roles-view')).toBeDefined();
    expect(
      screen.getAllByText(/Roles & Permissions|Account Linkage/i).length,
    ).toBeGreaterThan(0);

    // 6. Switch back to Staff Roster
    fireEvent.click(screen.getByTestId('staff-primary-tab-roster'));
    expect(screen.getByTestId('staff-list-card')).toBeDefined();
  });

  it('opens and interacts with canonical modals (Add guidance, Capability, Role, Offboarding)', async () => {
    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // 1. Open Add Staff Guidance Modal
    fireEvent.click(screen.getByTestId('add-staff-btn'));
    expect(screen.getByTestId('staff-add-guidance-modal')).toBeDefined();
    fireEvent.click(screen.getByTestId('close-add-guidance-modal'));
    expect(screen.queryByTestId('staff-add-guidance-modal')).toBeNull();

    // 2. Open Capability Modal from Inspector
    fireEvent.click(screen.getByTestId('inspector-manage-capabilities-btn'));
    expect(screen.getByTestId('staff-capability-modal')).toBeDefined();
    fireEvent.click(screen.getByTestId('cancel-capability-modal'));
    expect(screen.queryByTestId('staff-capability-modal')).toBeNull();

    // 3. Open Role Modal from Inspector Access tab
    fireEvent.click(screen.getByTestId('inspector-tab-access'));
    fireEvent.click(screen.getByTestId('inspector-manage-role-btn'));
    expect(screen.getByTestId('staff-role-modal')).toBeDefined();
    fireEvent.click(screen.getByTestId('cancel-role-modal'));
    expect(screen.queryByTestId('staff-role-modal')).toBeNull();

    // 4. Open Offboarding Notice Modal from Inspector Overview tab
    fireEvent.click(screen.getByTestId('inspector-tab-overview'));
    fireEvent.click(screen.getByTestId('inspector-offboard-btn'));
    expect(screen.getByTestId('staff-offboarding-modal')).toBeDefined();
    expect(
      screen.getByText(
        'This disables the staff account while retaining the staff record.',
      ),
    ).toBeDefined();
    fireEvent.click(screen.getByTestId('close-offboarding-modal'));
    expect(screen.queryByTestId('staff-offboarding-modal')).toBeNull();
  });

  it('handles error state and allows retry', async () => {
    const fetchSpy = vi
      .spyOn(staffService, 'fetchBranchStaff')
      .mockResolvedValueOnce({
        ok: false,
        code: 'NETWORK_ERROR',
        message:
          'Failed to load staff roster. Please check your connection and try again.',
      })
      .mockResolvedValueOnce({
        ok: true,
        data: mockStaffRoster,
        kpis: {
          totalStaff: 4,
          activeStaff: 2,
          awaitingStaff: 1,
          invitedStaff: 1,
        },
      });

    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-error-banner')).toBeDefined();
    });

    expect(
      screen.getByText(
        'Failed to load staff roster. Please check your connection and try again.',
      ),
    ).toBeDefined();

    // Click retry
    fireEvent.click(screen.getByTestId('staff-retry-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('staff-error-banner')).toBeNull();
    });

    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('renders valid empty branch state when branch has 0 staff', async () => {
    vi.spyOn(staffService, 'fetchBranchStaff').mockResolvedValue({
      ok: true,
      data: [],
      kpis: {
        totalStaff: 0,
        activeStaff: 0,
        awaitingStaff: 0,
        invitedStaff: 0,
      },
    });

    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-empty-state')).toBeDefined();
    });

    expect(
      screen.getByText('No staff members are assigned to this branch.'),
    ).toBeDefined();
  });

  it('renders in CanonicalShell when Staff navigation is selected', async () => {
    render(
      <CanonicalShell
        authContext={mockAuthContext}
        onSignOut={async () => {}}
        isSigningOut={false}
      />,
    );

    // Click Staff in navigation
    fireEvent.click(screen.getByTestId('nav-item-staff'));

    await waitFor(() => {
      expect(screen.getByTestId('staff-view')).toBeDefined();
    });

    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
  });
});

describe('Staff Hosted Authority Workflows (Stage 12B)', () => {
  const mockApplicant: StaffOnboardingRequest = mockOnboardingRequests[0];

  const mockStaff: StaffMember = {
    id: 's-1',
    branch_id: 'branch-1',
    auth_user_id: 'u-1',
    full_name: 'Maria Santos',
    nickname: 'Mary',
    phone: '09171234567',
    avatar_url: null,
    tier: 'senior',
    system_role: 'staff',
    staff_type: 'therapist',
    is_head: true,
    is_active: true,
    is_cross_branch: false,
    created_at: '2025-05-10T08:00:00Z',
    updated_at: '2025-05-10T08:00:00Z',
    status: 'active',
    services: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(staffService, 'fetchBranchStaff').mockResolvedValue({
      ok: true,
      data: mockStaffRoster,
      kpis: {
        totalStaff: 4,
        activeStaff: 2,
        awaitingStaff: 1,
        invitedStaff: 1,
      },
    });
    vi.spyOn(staffService, 'fetchBranchAssignableServices').mockResolvedValue(
      mockBranchServices,
    );
    vi.spyOn(staffService, 'fetchBranchOnboardingRequests').mockResolvedValue(
      mockOnboardingRequests,
    );
    vi.spyOn(staffService, 'fetchBranchScheduleWeek').mockResolvedValue({
      overrides: [],
      blockedTimes: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
      resolve = done;
    });
    return { promise, resolve };
  }
  const success = {
    ok: true as const,
    data: { staff: { id: 's-1', is_active: false } },
    message: 'Saved',
  };
  const failure = {
    ok: false as const,
    code: 'FORBIDDEN',
    error: 'Authoritative denial',
  };
  function approval(
    actorRole = 'manager',
    onApproved = vi.fn(),
    onClose = vi.fn(),
  ) {
    render(
      <StaffApplicationApprovalModal
        isOpen
        onClose={onClose}
        request={mockApplicant}
        branchId="branch-1"
        branchName="Cradle Alabang"
        branchServices={mockBranchServices}
        actorRole={actorRole}
        onApproved={onApproved}
      />,
    );
    return { onApproved, onClose };
  }
  it.each(['owner', 'manager', 'assistant_manager', 'store_manager', 'crm'])(
    'filters canonical approval roles for %s and submits no staffType',
    async (actor) => {
      const spy = vi
        .spyOn(staffService, 'reviewOnboardingRequest')
        .mockResolvedValue({
          ok: true,
          data: { staffId: 's-1', branchId: 'branch-1', systemRole: 'staff' },
          message: 'Approved',
        });
      const callbacks = approval(actor);
      const roles = Array.from(
        (screen.getByLabelText('System Role') as HTMLSelectElement).options,
      ).map((option) => option.value);
      expect(roles).not.toContain('csr');
      expect(roles).not.toContain('csr_head');
      expect(roles.includes('owner')).toBe(actor === 'owner');
      expect(roles.includes('digital_marketer')).toBe(actor !== 'crm');
      expect(screen.queryByLabelText(/Staff Type/)).toBeNull();
      expect(
        Array.from(
          (screen.getByLabelText('Skill Tier') as HTMLSelectElement).options,
        ).map((option) => option.value),
      ).toEqual(['n/a', 'junior', 'mid', 'senior', 'head']);
      expect(screen.queryByText(/UNAVAILABLE IN DESKTOP/)).toBeNull();
      fireEvent.click(screen.getByTestId('approve-application-submit-btn'));
      await waitFor(() => expect(callbacks.onApproved).toHaveBeenCalledOnce());
      expect(spy).toHaveBeenCalledWith({
        requestId: mockApplicant.id,
        action: 'approve',
        branchId: 'branch-1',
        systemRole: 'staff',
        tier: 'junior',
        serviceIds: [],
      });
      expect(callbacks.onClose).toHaveBeenCalledOnce();
    },
  );
  it('approval pending blocks double submission, controls, Escape, and premature success; failure stays open', async () => {
    const pending = deferred<typeof failure>();
    const spy = vi
      .spyOn(staffService, 'reviewOnboardingRequest')
      .mockReturnValue(pending.promise);
    const callbacks = approval();
    const button = screen.getByTestId('approve-application-submit-btn');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(spy).toHaveBeenCalledOnce();
    expect(callbacks.onClose).not.toHaveBeenCalled();
    expect(callbacks.onApproved).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Skill Tier').matches(':disabled')).toBe(true);
    pending.resolve(failure);
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'Authoritative denial',
      ),
    );
    expect(callbacks.onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(callbacks.onClose).toHaveBeenCalledOnce();
  });
  it('approval selects exact service ids and refreshes Staff and Applications on success', async () => {
    vi.spyOn(staffService, 'reviewOnboardingRequest').mockResolvedValue({
      ok: true,
      data: { staffId: 's-1', branchId: 'branch-1', systemRole: 'staff' },
      message: 'Approved',
    });
    render(<StaffView authContext={mockAuthContext} />);
    await waitFor(() =>
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined(),
    );
    fireEvent.click(screen.getByTestId('staff-primary-tab-applications'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Approve & Configure' }),
    );
    fireEvent.click(screen.getByLabelText(mockBranchServices[0].name));
    fireEvent.click(screen.getByTestId('approve-application-submit-btn'));
    await waitFor(() =>
      expect(staffService.fetchBranchStaff).toHaveBeenCalledTimes(2),
    );
    expect(staffService.fetchBranchOnboardingRequests).toHaveBeenCalledTimes(2);
    expect(staffService.reviewOnboardingRequest).toHaveBeenCalledWith(
      expect.objectContaining({ serviceIds: [mockBranchServices[0].id] }),
    );
  });
  it('rejection enables optional bounded reason, blocks dismissal while pending, shows failure, then refreshes on success', async () => {
    const pending = deferred<typeof failure>();
    const spy = vi
      .spyOn(staffService, 'reviewOnboardingRequest')
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue({
        ok: true,
        data: { requestId: mockApplicant.id, staffId: null },
        message: 'Rejected',
      });
    render(<StaffView authContext={mockAuthContext} />);
    await waitFor(() =>
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined(),
    );
    fireEvent.click(screen.getByTestId('staff-primary-tab-applications'));
    fireEvent.click(screen.getByTestId('inspector-reject-app-btn'));
    const reason = screen.getByLabelText(
      'Reason (Optional)',
    ) as HTMLTextAreaElement;
    expect(reason.disabled).toBe(false);
    expect(reason.maxLength).toBe(500);
    fireEvent.change(reason, { target: { value: 'Wrong application' } });
    fireEvent.click(screen.getByTestId('confirm-reject-btn'));
    fireEvent.click(screen.getByTestId('confirm-reject-btn'));
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('reject-app-modal'));
    expect(spy).toHaveBeenCalledOnce();
    expect(screen.getByTestId('reject-app-modal')).toBeDefined();
    pending.resolve(failure);
    await waitFor(() =>
      expect(screen.getByText('Authoritative denial')).toBeDefined(),
    );
    fireEvent.click(screen.getByTestId('confirm-reject-btn'));
    await waitFor(() =>
      expect(screen.queryByTestId('reject-app-modal')).toBeNull(),
    );
    expect(staffService.fetchBranchOnboardingRequests).toHaveBeenCalledTimes(2);
  });
  it.each(['owner', 'manager', 'crm'])(
    'role choices for %s preserve current state and disable no-op',
    (actor) => {
      render(
        <StaffRoleModal
          isOpen
          onClose={vi.fn()}
          staff={mockStaff}
          actorRole={actor}
          onRoleUpdated={vi.fn()}
        />,
      );
      expect(screen.getByText('Current Role: staff')).toBeDefined();
      const values = screen
        .getAllByRole('radio')
        .map((radio) => (radio as HTMLInputElement).value);
      expect(values.includes('owner')).toBe(actor === 'owner');
      expect(values.includes('digital_marketer')).toBe(actor !== 'crm');
      expect(
        (screen.getByTestId('save-role-modal') as HTMLButtonElement).disabled,
      ).toBe(true);
    },
  );
  it('role keeps denial visible, blocks pending dismissal, then calls success only after response', async () => {
    const pending = deferred<typeof failure>();
    const spy = vi
      .spyOn(staffService, 'updateStaffSystemRole')
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(success);
    const onClose = vi.fn(),
      onRoleUpdated = vi.fn();
    render(
      <StaffRoleModal
        isOpen
        onClose={onClose}
        staff={mockStaff}
        actorRole="manager"
        onRoleUpdated={onRoleUpdated}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Driver' }));
    fireEvent.click(screen.getByTestId('save-role-modal'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(onRoleUpdated).not.toHaveBeenCalled();
    pending.resolve(failure);
    await waitFor(() =>
      expect(screen.getByText('Authoritative denial')).toBeDefined(),
    );
    fireEvent.click(screen.getByTestId('save-role-modal'));
    await waitFor(() =>
      expect(onRoleUpdated).toHaveBeenCalledWith('s-1', 'driver'),
    );
    expect(spy).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('disables self-role changes and self-deactivation', () => {
    const { unmount } = render(
      <StaffRoleModal
        isOpen
        onClose={vi.fn()}
        staff={mockStaff}
        actorRole="owner"
        actorStaffId="s-1"
        onRoleUpdated={vi.fn()}
      />,
    );
    expect(screen.getByText(/cannot change your own/)).toBeDefined();
    expect(
      (screen.getByTestId('save-role-modal') as HTMLButtonElement).disabled,
    ).toBe(true);
    unmount();
    render(
      <StaffOffboardingNoticeModal
        isOpen
        onClose={vi.fn()}
        staff={mockStaff}
        actorStaffId="s-1"
      />,
    );
    expect(screen.getByText(/cannot deactivate your own/)).toBeDefined();
    expect(
      (
        screen.getByRole('button', {
          name: 'Deactivate Staff Access',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
  it('deactivation retains record wording, blocks pending dismissal and duplicate submits, propagates failure, then success', async () => {
    const pending = deferred<typeof failure>();
    const spy = vi
      .spyOn(staffService, 'deactivateStaff')
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(success);
    const onClose = vi.fn(),
      onDeactivated = vi.fn();
    render(
      <StaffOffboardingNoticeModal
        isOpen
        onClose={onClose}
        staff={mockStaff}
        actorStaffId="actor"
        onDeactivated={onDeactivated}
      />,
    );
    expect(
      screen.getByText(
        'This disables the staff account while retaining the staff record.',
      ),
    ).toBeDefined();
    const submit = screen.getByRole('button', {
      name: 'Deactivate Staff Access',
    });
    fireEvent.click(submit);
    fireEvent.click(submit);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(spy).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(onDeactivated).not.toHaveBeenCalled();
    pending.resolve(failure);
    await waitFor(() =>
      expect(screen.getByText('Authoritative denial')).toBeDefined(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Deactivate Staff Access' }),
    );
    await waitFor(() => expect(onDeactivated).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('traps Tab and restores focus on idle dialog close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const { unmount } = render(
      <StaffOffboardingNoticeModal
        isOpen
        onClose={onClose}
        staff={mockStaff}
      />,
    );
    const last = screen.getByRole('button', {
      name: 'Deactivate Staff Access',
    });
    last.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(
      screen.getByLabelText('Close deactivation modal'),
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});

describe('Staff Schedule Authoritative Mutation Suite (Stage 11)', () => {
  const mockStaff: StaffMember = {
    id: 's-1',
    branch_id: 'branch-1',
    auth_user_id: 'u-1',
    full_name: 'Maria Santos',
    nickname: 'Mary',
    phone: '09171234567',
    avatar_url: null,
    tier: 'senior',
    system_role: 'staff',
    staff_type: 'therapist',
    is_head: true,
    is_active: true,
    is_cross_branch: false,
    created_at: '2025-05-10T08:00:00Z',
    updated_at: '2025-05-10T08:00:00Z',
    status: 'active',
    services: [],
  };

  const existingOverride: StaffScheduleOverride = {
    id: 'ov-1',
    staff_id: 's-1',
    override_date: '2026-03-15',
    is_day_off: false,
    start_time: '09:00:00',
    end_time: '18:00:00',
    reason: 'Temporary coverage',
  };

  const existingBlock: StaffBlockedTime = {
    id: 'blk-1',
    staff_id: 's-1',
    block_date: '2026-03-15',
    start_time: '12:00:00',
    end_time: '13:00:00',
    reason: 'Lunch break',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes working_hours adjustment to mutateSchedule(upsert_override) with exact payload', async () => {
    const mutateSpy = vi
      .spyOn(scheduleService, 'mutateSchedule')
      .mockResolvedValue({
        ok: true,
        action: 'upsert_override',
        record_id: 'ov-new',
      });
    const adjustSpy = vi.spyOn(staffService, 'adjustStaffSchedule');
    const onAdjusted = vi.fn();
    const onClose = vi.fn();

    render(
      <StaffScheduleModal
        isOpen={true}
        onClose={onClose}
        staff={mockStaff}
        branchId="branch-1"
        initialDate="2026-03-15"
        onScheduleAdjusted={onAdjusted}
      />,
    );

    // Form inputs: working_hours is default
    const reasonInput = screen.getByTestId('schedule-modal-reason');
    fireEvent.change(reasonInput, { target: { value: 'Coverage for event' } });

    // Submit
    const submitBtn = screen.getByTestId('schedule-modal-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith('upsert_override', {
        branchId: 'branch-1',
        staffId: 's-1',
        overrideDate: '2026-03-15',
        isDayOff: false,
        shiftType: 'single',
        startTime: '09:00',
        endTime: '18:00',
        reason: 'Coverage for event',
      });
    });

    expect(adjustSpy).not.toHaveBeenCalled();
    expect(onAdjusted).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('routes day_off adjustment to mutateSchedule(upsert_override) with isDayOff: true', async () => {
    const mutateSpy = vi
      .spyOn(scheduleService, 'mutateSchedule')
      .mockResolvedValue({
        ok: true,
        action: 'upsert_override',
        record_id: 'ov-off',
      });
    const onAdjusted = vi.fn();
    const onClose = vi.fn();

    render(
      <StaffScheduleModal
        isOpen={true}
        onClose={onClose}
        staff={mockStaff}
        branchId="branch-1"
        initialDate="2026-03-16"
        onScheduleAdjusted={onAdjusted}
      />,
    );

    // Select day_off
    fireEvent.click(screen.getByTestId('adj-type-day_off'));

    // Reason
    fireEvent.change(screen.getByTestId('schedule-modal-reason'), {
      target: { value: 'Personal leave approved' },
    });

    fireEvent.click(screen.getByTestId('schedule-modal-submit-btn'));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith('upsert_override', {
        branchId: 'branch-1',
        staffId: 's-1',
        overrideDate: '2026-03-16',
        isDayOff: true,
        reason: 'Personal leave approved',
      });
    });

    expect(onAdjusted).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('routes blocked_time adjustment to mutateSchedule(create_blocked_time) with blockReason', async () => {
    const mutateSpy = vi
      .spyOn(scheduleService, 'mutateSchedule')
      .mockResolvedValue({
        ok: true,
        action: 'create_blocked_time',
        record_id: 'blk-new',
      });
    const onAdjusted = vi.fn();
    const onClose = vi.fn();

    render(
      <StaffScheduleModal
        isOpen={true}
        onClose={onClose}
        staff={mockStaff}
        branchId="branch-1"
        initialDate="2026-03-17"
        onScheduleAdjusted={onAdjusted}
      />,
    );

    // Select blocked_time
    fireEvent.click(screen.getByTestId('adj-type-blocked_time'));

    // Set times and blockReason
    fireEvent.change(screen.getByTestId('schedule-modal-start-time'), {
      target: { value: '14:00' },
    });
    fireEvent.change(screen.getByTestId('schedule-modal-end-time'), {
      target: { value: '15:00' },
    });
    fireEvent.change(screen.getByTestId('schedule-modal-block-reason'), {
      target: { value: 'training' },
    });

    fireEvent.click(screen.getByTestId('schedule-modal-submit-btn'));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith('create_blocked_time', {
        branchId: 'branch-1',
        staffId: 's-1',
        blockDate: '2026-03-17',
        startTime: '14:00',
        endTime: '15:00',
        reason: 'training',
      });
    });

    expect(onAdjusted).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('routes remove_override adjustment to mutateSchedule(delete_override) with overrideId', async () => {
    const mutateSpy = vi
      .spyOn(scheduleService, 'mutateSchedule')
      .mockResolvedValue({
        ok: true,
        action: 'delete_override',
      });
    const onAdjusted = vi.fn();
    const onClose = vi.fn();

    render(
      <StaffScheduleModal
        isOpen={true}
        onClose={onClose}
        staff={mockStaff}
        branchId="branch-1"
        initialDate="2026-03-15"
        existingOverrides={[existingOverride]}
        onScheduleAdjusted={onAdjusted}
      />,
    );

    // Select remove_override
    fireEvent.click(screen.getByTestId('adj-type-remove_override'));

    fireEvent.click(screen.getByTestId('schedule-modal-submit-btn'));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith('delete_override', {
        branchId: 'branch-1',
        staffId: 's-1',
        overrideId: 'ov-1',
      });
    });

    expect(onAdjusted).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('routes remove_block adjustment to mutateSchedule(delete_blocked_time) with blockId', async () => {
    const mutateSpy = vi
      .spyOn(scheduleService, 'mutateSchedule')
      .mockResolvedValue({
        ok: true,
        action: 'delete_blocked_time',
      });
    const onAdjusted = vi.fn();
    const onClose = vi.fn();

    render(
      <StaffScheduleModal
        isOpen={true}
        onClose={onClose}
        staff={mockStaff}
        branchId="branch-1"
        initialDate="2026-03-15"
        existingBlocks={[existingBlock]}
        onScheduleAdjusted={onAdjusted}
      />,
    );

    // Select remove_block
    fireEvent.click(screen.getByTestId('adj-type-remove_block'));

    fireEvent.click(screen.getByTestId('schedule-modal-submit-btn'));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith('delete_blocked_time', {
        branchId: 'branch-1',
        staffId: 's-1',
        blockId: 'blk-1',
      });
    });

    expect(onAdjusted).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('displays authoritative server error on mutation failure and keeps modal open', async () => {
    const mutateSpy = vi
      .spyOn(scheduleService, 'mutateSchedule')
      .mockResolvedValue({
        ok: false,
        code: 'FORBIDDEN',
        message:
          'Operator lacks schedule management permission for this staff member',
      });
    const onAdjusted = vi.fn();
    const onClose = vi.fn();

    render(
      <StaffScheduleModal
        isOpen={true}
        onClose={onClose}
        staff={mockStaff}
        branchId="branch-1"
        initialDate="2026-03-15"
        onScheduleAdjusted={onAdjusted}
      />,
    );

    fireEvent.click(screen.getByTestId('schedule-modal-submit-btn'));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalled();
    });

    // Error banner is displayed
    expect(
      screen.getByText(
        'Operator lacks schedule management permission for this staff member',
      ),
    ).toBeDefined();

    // Modal stays open, no callbacks
    expect(onAdjusted).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('prevents backdrop click and Escape from closing StaffScheduleModal while mutation is in flight (success path)', async () => {
    type MutateResult = Awaited<
      ReturnType<typeof scheduleService.mutateSchedule>
    >;
    let resolveMutation!: (value: MutateResult) => void;
    const pendingPromise = new Promise<MutateResult>((resolve) => {
      resolveMutation = resolve;
    });

    vi.spyOn(scheduleService, 'mutateSchedule').mockReturnValue(pendingPromise);

    const onAdjusted = vi.fn();
    const onClose = vi.fn();

    render(
      <StaffScheduleModal
        isOpen={true}
        onClose={onClose}
        staff={mockStaff}
        branchId="branch-1"
        initialDate="2026-03-15"
        onScheduleAdjusted={onAdjusted}
      />,
    );

    const submitBtn = screen.getByTestId(
      'schedule-modal-submit-btn',
    ) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(false);

    // Click submit
    fireEvent.click(submitBtn);

    // Verify in-flight submitting state
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.textContent).toContain('Saving Adjustment...');

    // Click backdrop while in flight -> must NOT close
    const backdrop = screen.getByTestId('staff-schedule-modal');
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();

    // Press Escape while in flight -> must NOT close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    // Resolve mutation successfully
    resolveMutation({
      ok: true,
      action: 'upsert_override',
    });

    // Modal should complete lifecycle and close cleanly
    await waitFor(() => {
      expect(onAdjusted).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('prevents backdrop click while in flight and keeps modal open on authoritative mutation error', async () => {
    type MutateResult = Awaited<
      ReturnType<typeof scheduleService.mutateSchedule>
    >;
    let resolveMutation!: (value: MutateResult) => void;
    const pendingPromise = new Promise<MutateResult>((resolve) => {
      resolveMutation = resolve;
    });

    vi.spyOn(scheduleService, 'mutateSchedule').mockReturnValue(pendingPromise);

    const onAdjusted = vi.fn();
    const onClose = vi.fn();

    render(
      <StaffScheduleModal
        isOpen={true}
        onClose={onClose}
        staff={mockStaff}
        branchId="branch-1"
        initialDate="2026-03-15"
        onScheduleAdjusted={onAdjusted}
      />,
    );

    fireEvent.click(screen.getByTestId('schedule-modal-submit-btn'));

    // Click backdrop while in flight -> must NOT close
    const backdrop = screen.getByTestId('staff-schedule-modal');
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();

    // Resolve with authoritative failure
    resolveMutation({
      ok: false,
      code: 'SCHEDULE_CONFLICT',
      message: 'Time block overlaps existing booking',
    });

    await waitFor(() => {
      expect(
        screen.getByText('Time block overlaps existing booking'),
      ).toBeDefined();
    });

    // Modal remains open, no callbacks
    expect(onAdjusted).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('Staff Capability Authoritative RPC & In-Flight Lifecycle Suite (Stage 11)', () => {
  const mockStaff: StaffMember = {
    id: 's-1',
    branch_id: 'branch-1',
    auth_user_id: 'u-1',
    full_name: 'Maria Santos',
    nickname: 'Mary',
    phone: '09171234567',
    avatar_url: null,
    tier: 'senior',
    system_role: 'staff',
    staff_type: 'therapist',
    is_head: true,
    is_active: true,
    is_cross_branch: false,
    created_at: '2025-05-10T08:00:00Z',
    updated_at: '2025-05-10T08:00:00Z',
    status: 'active',
    services: [],
  };

  const mockBranchServices: BranchServiceOption[] = [
    {
      id: 'srv-1',
      name: 'Swedish Massage',
      duration_minutes: 60,
    },
  ];

  it('prevents backdrop click and Escape from closing StaffCapabilityModal while RPC is in flight and completes on success', async () => {
    type RpcResult = Awaited<
      ReturnType<typeof staffService.updateStaffCapabilities>
    >;
    let resolveRPC!: (value: RpcResult) => void;
    const pendingPromise = new Promise<RpcResult>((resolve) => {
      resolveRPC = resolve;
    });

    vi.spyOn(staffService, 'updateStaffCapabilities').mockReturnValue(
      pendingPromise,
    );

    const onCapabilitiesSaved = vi.fn();
    const onClose = vi.fn();

    render(
      <StaffCapabilityModal
        isOpen={true}
        onClose={onClose}
        staff={mockStaff}
        branchServices={mockBranchServices}
        onCapabilitiesSaved={onCapabilitiesSaved}
      />,
    );

    const saveBtn = screen.getByTestId(
      'save-capability-modal',
    ) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);

    // Start save
    fireEvent.click(saveBtn);

    // Verify in-flight state
    expect(saveBtn.disabled).toBe(true);
    expect(saveBtn.textContent).toContain('Saving...');

    // Click backdrop while in flight -> must NOT close
    const backdrop = screen.getByTestId('staff-capability-modal');
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();

    // Press Escape while in flight -> must NOT close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    // Resolve RPC successfully
    resolveRPC({
      ok: true,
      message: 'Capabilities updated (0 assigned).',
    });

    await waitFor(() => {
      expect(onCapabilitiesSaved).toHaveBeenCalledWith('s-1', []);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('prevents backdrop click while RPC is in flight and displays authoritative error while keeping modal open', async () => {
    type RpcResult = Awaited<
      ReturnType<typeof staffService.updateStaffCapabilities>
    >;
    let resolveRPC!: (value: RpcResult) => void;
    const pendingPromise = new Promise<RpcResult>((resolve) => {
      resolveRPC = resolve;
    });

    vi.spyOn(staffService, 'updateStaffCapabilities').mockReturnValue(
      pendingPromise,
    );

    const onCapabilitiesSaved = vi.fn();
    const onClose = vi.fn();

    render(
      <StaffCapabilityModal
        isOpen={true}
        onClose={onClose}
        staff={mockStaff}
        branchServices={mockBranchServices}
        onCapabilitiesSaved={onCapabilitiesSaved}
      />,
    );

    fireEvent.click(screen.getByTestId('save-capability-modal'));

    // Click backdrop while in flight -> must NOT close
    const backdrop = screen.getByTestId('staff-capability-modal');
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();

    // Resolve with authoritative RPC error string
    resolveRPC({
      ok: false,
      error: 'crm_staff_services_branch_mismatch',
    });

    await waitFor(() => {
      expect(
        screen.getByText('crm_staff_services_branch_mismatch'),
      ).toBeDefined();
    });

    // Modal remains open and onCapabilitiesSaved was not called
    expect(onCapabilitiesSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
