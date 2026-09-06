import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { CustomersView } from '../src/components/customers/CustomersView';
import { CanonicalShell } from '../src/components/CanonicalShell';
import * as customersService from '../src/lib/customers-service';
import type { AuthContext } from '../src/types/auth';

const mockAuthContext: AuthContext = {
  userId: 'user-1',
  email: 'operator@cradlehub.test',
  staffId: 'staff-1',
  fullName: 'Test Operator',
  canonicalRole: 'crm',
  rawRole: 'crm',
  branchId: 'branch-1',
  branchName: 'Cradle Alabang',
  isCrmEligible: true,
};

const mockCustomersList = [
  {
    id: 'c-1',
    fullName: 'Maria Santos',
    phone: '09171234567',
    email: 'maria@test.ph',
    totalBookings: 4,
    firstBookingDate: '2025-11-01',
    lastBookingDate: '2026-02-15',
    preferredStaffId: 'staff-1',
    preferredStaffName: 'Ana Therapist',
    loyaltyTier: 'VIP',
  },
  {
    id: 'c-2',
    fullName: 'Jose Rizal',
    phone: '09181112233',
    email: 'jose@test.ph',
    totalBookings: 1,
    firstBookingDate: '2026-03-01',
    lastBookingDate: '2026-03-01',
    preferredStaffId: null,
    preferredStaffName: null,
  },
];

const mockWaitlistList = [
  {
    id: 'w-1',
    customerName: 'Pedro Penduko',
    customerPhone: '09192223344',
    email: 'pedro@test.ph',
    serviceId: 'srv-1',
    serviceName: 'Aromatherapy Massage',
    preferredDate: '2026-09-10',
    preferredTime: '15:00',
    visitType: 'in_spa',
    status: 'pending',
    notes: 'Requested quiet room.',
    createdAt: '2026-09-05T10:00:00Z',
  },
];

const mockCustomerDetail = {
  id: 'c-1',
  fullName: 'Maria Santos',
  phone: '09171234567',
  email: 'maria@test.ph',
  totalBookings: 4,
  firstBookingDate: '2025-11-01',
  lastBookingDate: '2026-02-15',
  preferredStaffId: 'staff-1',
  preferredStaffName: 'Ana Therapist',
  preferredVisitType: 'In-Spa Evening',
  pressurePreference: 'Firm',
  birthday: '1992-05-18',
  notes: 'Prefers peppermint essential oil.',
  healthNotes: 'Minor shoulder tension.',
  loyaltyTier: 'VIP',
  bookingHistory: [
    {
      id: 'b-101',
      bookingDate: '2026-02-15',
      startTime: '18:00',
      status: 'completed',
      type: 'in_spa',
      deliveryType: 'in_spa',
      serviceName: 'Swedish Massage 90min',
      staffName: 'Ana Therapist',
      branchName: 'Cradle Alabang',
    },
  ],
};

describe('Customers Workspace Component Suite', () => {
  beforeEach(() => {
    vi.spyOn(customersService, 'fetchBranchCustomers').mockImplementation(
      async (params) => {
        if (params.tab === 'followup') {
          return {
            ok: true,
            tab: 'followup',
            data: [],
            waitlist: mockWaitlistList,
            kpis: {
              totalCustomers: 2,
              repeatClients: 1,
              lapsedClients: 0,
              newThisMonth: 1,
              totalVisits: 5,
            },
            pagination: {
              page: 1,
              pageSize: 25,
              totalCount: 1,
              totalPages: 1,
            },
          };
        }

        return {
          ok: true,
          tab: params.tab || 'all',
          data: mockCustomersList,
          waitlist: [],
          kpis: {
            totalCustomers: 2,
            repeatClients: 1,
            lapsedClients: 0,
            newThisMonth: 1,
            totalVisits: 5,
          },
          pagination: {
            page: 1,
            pageSize: 25,
            totalCount: 2,
            totalPages: 1,
          },
        };
      },
    );

    vi.spyOn(customersService, 'fetchCustomerDetail').mockResolvedValue({
      ok: true,
      customer: mockCustomerDetail,
      bookingHistory: mockCustomerDetail.bookingHistory,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders customer list, KPI summary metrics, and auto-selects first customer', async () => {
    render(<CustomersView authContext={mockAuthContext} />);

    // Check Header
    expect(screen.getByRole('heading', { name: 'Customers' })).toBeDefined();

    // Check KPIs
    await waitFor(() => {
      expect(screen.getByText('Total Customers')).toBeDefined();
      expect(screen.getByText('Repeat Clients')).toBeDefined();
    });

    // Check Customer List table rows
    const matches = await screen.findAllByText('Maria Santos');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Jose Rizal')).toBeDefined();

    // Check Auto-Selected Customer Inspector
    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Customer Details Inspector' }),
      ).toBeDefined();
      expect(screen.getByText('Firm')).toBeDefined();
      expect(
        screen.getByText('Prefers peppermint essential oil.'),
      ).toBeDefined();
      expect(screen.getByText('Minor shoulder tension.')).toBeDefined();
    });
  });

  it('switches to history tab in inspector and displays operational booking history without finance', async () => {
    render(<CustomersView authContext={mockAuthContext} />);

    await screen.findAllByText('Maria Santos');

    // Click History tab in inspector
    const historyTab = await screen.findByRole('tab', { name: /History/ });
    fireEvent.click(historyTab);

    // Verify booking history details
    expect(await screen.findByText('Swedish Massage 90min')).toBeDefined();
    expect(screen.getAllByText(/Ana Therapist/).length).toBeGreaterThanOrEqual(
      1,
    );

    // Verify NO financial information is rendered
    expect(screen.queryByText(/₱/)).toBeNull();
    expect(screen.queryByText(/payment/i)).toBeNull();
  });

  it('handles search input with debouncing and queries hosted API', async () => {
    render(<CustomersView authContext={mockAuthContext} />);

    await screen.findAllByText('Maria Santos');

    const searchInput = screen.getByLabelText('Search customers');
    fireEvent.change(searchInput, { target: { value: 'Jose' } });

    await waitFor(
      () => {
        expect(customersService.fetchBranchCustomers).toHaveBeenCalledWith(
          expect.objectContaining({
            q: 'Jose',
          }),
        );
      },
      { timeout: 2000 },
    );
  });

  it('switches tabs to Follow-up and displays waitlist entries and follow-up inspector', async () => {
    render(<CustomersView authContext={mockAuthContext} />);

    await screen.findAllByText('Maria Santos');

    // Click Follow-up tab
    const followupTab = screen.getByRole('tab', { name: 'Follow-up' });
    fireEvent.click(followupTab);

    // Wait for waitlist row (appears in table and inspector)
    const waitlistMatches = await screen.findAllByText('Pedro Penduko');
    expect(waitlistMatches.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText('Aromatherapy Massage').length,
    ).toBeGreaterThanOrEqual(1);

    // Check Follow-up Inspector
    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Follow-up Details Inspector' }),
      ).toBeDefined();
      expect(screen.getByText('Requested quiet room.')).toBeDefined();
    });
  });

  it('renders canonical layout structure, DataGrid, KPI grid, and footer classes', async () => {
    const { container } = render(
      <CustomersView authContext={mockAuthContext} />,
    );

    await screen.findAllByText('Maria Santos');

    // 1. KPI grid uses customers-kpi-grid
    const kpiGrid = container.querySelector('.customers-kpi-grid');
    expect(kpiGrid).not.toBeNull();
    expect(kpiGrid?.classList.contains('bookings-kpi-grid')).toBe(true);

    // 2. Main content uses canonical bookings-main-grid with sibling columns
    const mainGrid = container.querySelector('.bookings-main-grid');
    expect(mainGrid).not.toBeNull();
    const listCol = mainGrid?.querySelector('.bookings-list-column');
    const inspectorCol = mainGrid?.querySelector('.bookings-inspector-column');
    expect(listCol).not.toBeNull();
    expect(inspectorCol).not.toBeNull();

    // 3. DataGrid uses bookings-datagrid-wrapper
    const datagridWrapper = container.querySelector(
      '.bookings-datagrid-wrapper',
    );
    expect(datagridWrapper).not.toBeNull();

    // 4. Footer uses canonical Bookings footer & pagination classes
    const footer = container.querySelector('.bookings-table-footer');
    expect(footer).not.toBeNull();
    expect(footer?.querySelector('.footer-count-text')).not.toBeNull();
    expect(footer?.querySelector('.footer-pagination-controls')).not.toBeNull();
    expect(footer?.querySelector('.page-size-selector-wrapper')).not.toBeNull();
    expect(footer?.querySelector('.pagination-buttons')).not.toBeNull();
  });

  it('renders truthful KPI semantic descriptions and search placeholders', async () => {
    render(<CustomersView authContext={mockAuthContext} />);

    await screen.findAllByText('Maria Santos');

    // Truthful KPI subtext descriptions
    expect(screen.getByText('Branch customer roster')).toBeDefined();
    expect(screen.getByText('2+ recorded visits')).toBeDefined();
    expect(screen.getByText('No visit in 30+ days')).toBeDefined();
    expect(screen.getByText('First visit this month')).toBeDefined();
    expect(screen.getByText('Aggregate recorded visits')).toBeDefined();

    // Truthful search placeholder (no email search claim)
    const searchInput = screen.getByLabelText(
      'Search customers',
    ) as HTMLInputElement;
    expect(searchInput.placeholder).toBe(
      'Search customers by name or phone...',
    );

    // Switch to Follow-up tab and check placeholder
    const followupTab = screen.getByRole('tab', { name: 'Follow-up' });
    fireEvent.click(followupTab);

    const followupSearchInput = screen.getByLabelText(
      'Search follow-up waitlist',
    ) as HTMLInputElement;
    expect(followupSearchInput.placeholder).toBe(
      'Search follow-up requests by name or phone...',
    );
  });

  it('handles authoritative list error truthfully without rendering fake empty state or zero KPIs and renders exactly one unavailable presentation', async () => {
    vi.mocked(customersService.fetchBranchCustomers).mockResolvedValueOnce({
      ok: false,
      code: 'CRM_PERMISSION_DENIED',
      message: 'Access to customer roster denied for this branch.',
    });

    const { container } = render(
      <CustomersView authContext={mockAuthContext} />,
    );

    // Single authoritative unavailable alert card is displayed
    const alertCard = await screen.findByRole('alert');
    expect(alertCard).toBeDefined();
    expect(screen.getByText('Customer Service Unavailable')).toBeDefined();
    expect(
      screen.getByText('Access to customer roster denied for this branch.'),
    ).toBeDefined();

    // No duplicate error banner rendered
    expect(container.querySelectorAll('.bookings-error-banner')).toHaveLength(
      0,
    );

    // Fake empty messages are NOT rendered
    expect(screen.queryByText('No customers in this segment')).toBeNull();
    expect(screen.queryByText('No matching customers found')).toBeNull();

    // Normal KPI cells are NOT rendered
    expect(screen.queryByLabelText('Total Customers: 0')).toBeNull();

    // Retry button is available
    expect(screen.getByRole('button', { name: 'Retry Request' })).toBeDefined();
  });

  it('handles contract error with fallback message and never renders zero KPIs or false empty state', async () => {
    vi.mocked(customersService.fetchBranchCustomers).mockResolvedValueOnce({
      ok: false,
      code: 'HOSTED_RESPONSE_CONTRACT_ERROR',
      message: 'Customer service returned an unexpected response format.',
    });

    render(<CustomersView authContext={mockAuthContext} />);

    const alertCard = await screen.findByRole('alert');
    expect(alertCard).toBeDefined();
    expect(screen.getByText('Customer Service Unavailable')).toBeDefined();
    expect(
      screen.getByText(
        'Customer service returned an unexpected response format.',
      ),
    ).toBeDefined();

    expect(screen.queryByText('No customers in this segment')).toBeNull();
    expect(screen.queryByLabelText('Total Customers: 0')).toBeNull();
  });

  it('clears stale customer detail and shows detail error on detail fetch failure', async () => {
    vi.mocked(customersService.fetchCustomerDetail).mockResolvedValueOnce({
      ok: false,
      code: 'CUSTOMER_NOT_FOUND',
      message: 'Customer record not found for this branch.',
    });

    render(<CustomersView authContext={mockAuthContext} />);

    await screen.findAllByText('Maria Santos');

    // Detail error banner is displayed
    await waitFor(() => {
      expect(
        screen.getByText('Customer record not found for this branch.'),
      ).toBeDefined();
      // Stale details (like birthday / notes) are not displayed
      expect(
        screen.queryByText('Prefers peppermint essential oil.'),
      ).toBeNull();
    });
  });

  it('renders CustomersView in CanonicalShell when active module is customers', async () => {
    render(
      <CanonicalShell
        authContext={mockAuthContext}
        onSignOut={vi.fn()}
        isSigningOut={false}
      />,
    );

    // Click Customers navigation in sidebar
    const customersNavBtn = screen.getByTestId('nav-item-customers');
    fireEvent.click(customersNavBtn);

    // Verify Customers view is rendered rather than unavailable placeholder
    expect(await screen.findByTestId('customers-view')).toBeDefined();
    expect(screen.queryByTestId('module-unavailable-panel')).toBeNull();
  });
});
