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
import type { StaffMember } from '../src/types/staff';

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
    services: [],
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

describe('Staff Workspace Component Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

  it('renders populated roster with KPI summary cards and table', async () => {
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

    // Verify KPI subtexts: total and active have contract-backed subtext, awaiting and invited have no unproven claims
    expect(totalKpi.textContent).toContain('Branch roster headcount');
    expect(activeKpi.textContent).toContain('Active branch staff');
    expect(awaitingKpi.textContent).not.toContain('Account claimed');
    expect(invitedKpi.textContent).not.toContain('Invitation link issued');

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

    // Table rows:
    // s-1 is service_head -> non-tier supervisory role -> table renders '—'
    const row1 = screen.getByTestId('staff-row-s-1');
    expect(row1.textContent).toContain('—');

    // s-2 is staff / nail_tech -> tier-eligible -> table renders 'Mid'
    const row2 = screen.getByTestId('staff-row-s-2');
    expect(row2.textContent).toContain('Mid');

    // s-4 is crm / csr -> non-tier role -> table renders '—'
    const row4 = screen.getByTestId('staff-row-s-4');
    expect(row4.textContent).toContain('—');

    // Inspector checks:
    // Initial selection is Maria Santos (service_head) -> Skill Tier detail row is omitted
    const inspectorSection1 = screen.getByTestId('inspector-profile-section');
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Maria Santos',
    );
    expect(within(inspectorSection1).queryByText('Skill Tier')).toBeNull();

    // Select Juan Dela Cruz (nail_tech / staff) -> Skill Tier detail row is displayed with 'Mid'
    fireEvent.click(row2);
    const inspectorSection2 = screen.getByTestId('inspector-profile-section');
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Juan Dela Cruz',
    );
    expect(within(inspectorSection2).getByText('Skill Tier')).toBeDefined();
    expect(within(inspectorSection2).getByText('Mid')).toBeDefined();

    // Select Carlos Mendoza (crm) -> Skill Tier detail row is omitted
    fireEvent.click(row4);
    const inspectorSection3 = screen.getByTestId('inspector-profile-section');
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Carlos Mendoza',
    );
    expect(within(inspectorSection3).queryByText('Skill Tier')).toBeNull();
  });

  it('filters staff roster by status tabs and KPI clicks and updates aria-pressed', async () => {
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

    // Filter by Active tab
    fireEvent.click(screen.getByTestId('staff-tab-active'));
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(screen.queryByTestId('staff-row-s-2')).toBeNull();
    expect(screen.queryByTestId('staff-row-s-3')).toBeNull();
    expect(screen.getByTestId('staff-row-s-4')).toBeDefined();
    expect(
      screen.getByTestId('staff-kpi-activeStaff').getAttribute('aria-pressed'),
    ).toBe('true');

    // Filter by Awaiting tab
    fireEvent.click(screen.getByTestId('staff-tab-awaiting'));
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

    // Reset to All Staff tab
    fireEvent.click(screen.getByTestId('staff-tab-all'));
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-3')).toBeDefined();
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

    // 1. Initial selection is Maria Santos (s-1, active)
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Maria Santos',
    );

    // 2. Filter to 'awaiting' tab (excludes Maria Santos, leaves Juan Dela Cruz)
    fireEvent.click(screen.getByTestId('staff-tab-awaiting'));
    await waitFor(() => {
      expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
        'Juan Dela Cruz',
      );
    });

    // 3. Switch to 'all' tab and search for 'Pending' (excludes Maria and Juan, leaves Pending invitation)
    fireEvent.click(screen.getByTestId('staff-tab-all'));
    const searchInput = screen.getByTestId('staff-search-input');
    fireEvent.change(searchInput, { target: { value: 'Pending' } });
    await waitFor(() => {
      expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
        'Pending invitation',
      );
    });

    // 4. Search for nonexistent term (0 results -> inspector cleared)
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    await waitFor(() => {
      expect(screen.getByTestId('staff-inspector-empty')).toBeDefined();
      expect(screen.getByText('No Staff Selected')).toBeDefined();
    });

    // 5. Clear search (returns to all tab results -> Maria Santos selected)
    fireEvent.click(screen.getByLabelText('Clear search'));
    await waitFor(() => {
      expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
        'Maria Santos',
      );
    });
  });

  it('supports keyboard-operable table column sorting with aria-sort', async () => {
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

    const sortNameBtn = screen.getByTestId('sort-staff-name-btn');
    const sortRoleBtn = screen.getByTestId('sort-staff-role-btn');

    // Default sort is name ascending
    const nameTh = sortNameBtn.closest('th');
    expect(nameTh?.getAttribute('aria-sort')).toBe('ascending');

    // Activate sort by name again -> toggles to descending
    fireEvent.click(sortNameBtn);
    expect(nameTh?.getAttribute('aria-sort')).toBe('descending');

    // Activate sort by role -> role becomes ascending
    fireEvent.click(sortRoleBtn);
    const roleTh = sortRoleBtn.closest('th');
    expect(roleTh?.getAttribute('aria-sort')).toBe('ascending');
    expect(nameTh?.getAttribute('aria-sort')).toBe('none');
  });

  it('displays truthful business labels and avoids misleading provider/head/UUID copy', async () => {
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

    // Maria is Head -> inspector should say "Department Head" (not "Head Therapist")
    expect(screen.getAllByText('Department Head').length).toBeGreaterThan(0);
    expect(screen.queryByText('Head Therapist')).toBeNull();

    // Cross-Branch label should be "Cross-Branch Eligibility" (not "Cross-Branch Dispatch")
    expect(screen.getByText('Cross-Branch Eligibility')).toBeDefined();
    expect(screen.queryByText('Cross-Branch Dispatch')).toBeNull();

    // Account login linkage should show human status and no raw UUID
    expect(screen.getByText('Account linked')).toBeDefined();
    expect(screen.queryByText(/u-1/)).toBeNull();

    // Select Juan Dela Cruz (non-head, unlinked)
    fireEvent.click(screen.getByTestId('staff-row-s-2'));
    expect(screen.getByText('Not a department head')).toBeDefined();
    expect(screen.queryByText('Standard Provider')).toBeNull();
  });

  it('searches staff by full name, nickname, and phone', async () => {
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

    const searchInput = screen.getByTestId('staff-search-input');

    // Search by name
    fireEvent.change(searchInput, { target: { value: 'Juan' } });
    expect(screen.queryByTestId('staff-row-s-1')).toBeNull();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();

    // Search by nickname
    fireEvent.change(searchInput, { target: { value: 'Mary' } });
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(screen.queryByTestId('staff-row-s-2')).toBeNull();

    // Search by phone
    fireEvent.change(searchInput, { target: { value: '0918' } });
    expect(screen.queryByTestId('staff-row-s-1')).toBeNull();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();

    // Clear search
    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();
  });

  it('updates inspector when selecting another staff member and allows switching tabs', async () => {
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

    // Check Maria's profile
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Maria Santos',
    );

    // Switch to Services tab in Inspector
    fireEvent.click(screen.getByTestId('inspector-tab-services'));
    expect(screen.getByText('Swedish Massage')).toBeDefined();
    expect(screen.getByText('Deep Tissue Massage')).toBeDefined();

    // Select Juan Dela Cruz
    fireEvent.click(screen.getByTestId('staff-row-s-2'));
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Juan Dela Cruz',
    );

    // Juan has 0 services -> shows empty services state
    fireEvent.click(screen.getByTestId('inspector-tab-services'));
    expect(screen.getByTestId('inspector-services-empty')).toBeDefined();
    expect(screen.getByText('No Assigned Services')).toBeDefined();

    // Close Inspector
    fireEvent.click(screen.getByLabelText('Close staff inspector'));
    expect(screen.getByTestId('staff-inspector-empty')).toBeDefined();
    expect(screen.getByText('No Staff Selected')).toBeDefined();
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
      expect(screen.getByTestId('staff-error-state')).toBeDefined();
    });

    expect(screen.getByText('Staff Service Unavailable')).toBeDefined();
    expect(
      screen.getByText(
        'Failed to load staff roster. Please check your connection and try again.',
      ),
    ).toBeDefined();

    // Click retry
    fireEvent.click(screen.getByTestId('staff-retry-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('staff-error-state')).toBeNull();
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

    expect(screen.getByText('No staff members assigned')).toBeDefined();
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
