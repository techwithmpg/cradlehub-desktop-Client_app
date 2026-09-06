import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
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
    status: 'invited',
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
        totalStaff: 3,
        activeStaff: 1,
        awaitingStaff: 1,
        invitedStaff: 1,
      },
    });

    render(<StaffView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.queryByTestId('staff-skeleton')).toBeNull();
    });

    // Check KPI counts
    expect(screen.getByLabelText('Total Staff: 3')).toBeDefined();
    expect(screen.getByLabelText('Active: 1')).toBeDefined();
    expect(screen.getByLabelText('Awaiting Approval: 1')).toBeDefined();
    expect(screen.getByLabelText('Invites Sent: 1')).toBeDefined();

    // Check staff rows
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-3')).toBeDefined();

    // Auto-selects first staff member
    expect(screen.getByTestId('inspector-staff-name').textContent).toBe(
      'Maria Santos',
    );
  });

  it('filters staff roster by status tabs and KPI clicks', async () => {
    vi.spyOn(staffService, 'fetchBranchStaff').mockResolvedValue({
      ok: true,
      data: mockStaffRoster,
      kpis: {
        totalStaff: 3,
        activeStaff: 1,
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

    // Filter by Awaiting tab
    fireEvent.click(screen.getByTestId('staff-tab-awaiting'));
    expect(screen.queryByTestId('staff-row-s-1')).toBeNull();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();
    expect(screen.queryByTestId('staff-row-s-3')).toBeNull();

    // Click Invites Sent KPI Card
    fireEvent.click(screen.getByLabelText('Invites Sent: 1'));
    expect(screen.queryByTestId('staff-row-s-1')).toBeNull();
    expect(screen.queryByTestId('staff-row-s-2')).toBeNull();
    expect(screen.getByTestId('staff-row-s-3')).toBeDefined();

    // Reset to All Staff tab
    fireEvent.click(screen.getByTestId('staff-tab-all'));
    expect(screen.getByTestId('staff-row-s-1')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-2')).toBeDefined();
    expect(screen.getByTestId('staff-row-s-3')).toBeDefined();
  });

  it('searches staff by full name, nickname, and phone', async () => {
    vi.spyOn(staffService, 'fetchBranchStaff').mockResolvedValue({
      ok: true,
      data: mockStaffRoster,
      kpis: {
        totalStaff: 3,
        activeStaff: 1,
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
        totalStaff: 3,
        activeStaff: 1,
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
          totalStaff: 3,
          activeStaff: 1,
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
        totalStaff: 3,
        activeStaff: 1,
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
