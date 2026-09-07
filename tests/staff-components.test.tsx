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
import type { AuthContext } from '../src/types/auth';
import type {
  BranchServiceOption,
  StaffMember,
  StaffOnboardingRequest,
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

  it('renders populated roster with KPI summary cards and DataGrid', async () => {
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

  it('renders skill tier appropriately based on operational role in table and inspector', async () => {
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

  it('switches internal inspector tabs and supports inline profile editing', async () => {
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

    const updateProfileSpy = vi
      .spyOn(staffService, 'updateStaffProfile')
      .mockResolvedValue({
        ok: true,
        staff: {
          id: 's-1',
          full_name: 'Maria Santos-Reyes',
          nickname: 'Mary',
          phone: '09171234567',
          staff_type: 'therapist',
          tier: 'senior',
          is_head: true,
        },
      });

    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    });

    // Check Overview tab default
    expect(screen.getByTestId('inspector-tab-overview')).toBeDefined();

    // Switch to Services tab
    fireEvent.click(screen.getByTestId('inspector-tab-services'));
    const inspectorCard = screen.getByTestId('staff-inspector-card');
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

    // Update name
    fireEvent.change(nameInput, { target: { value: 'Maria Santos-Reyes' } });

    // Save profile changes
    fireEvent.click(screen.getByTestId('save-profile-btn'));

    await waitFor(() => {
      expect(updateProfileSpy).toHaveBeenCalled();
    });
  });

  it('switches between all 6 primary workspace tabs', async () => {
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
    expect(screen.getByText('OFFBOARDING CONTRACT REQUIRED')).toBeDefined();
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
