import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Booking, BookingKpiSummary } from '../src/types/bookings';
import type { AuthContext } from '../src/types/auth';
import { BookingsHeader } from '../src/components/bookings/BookingsHeader';
import { BookingsKpiSummaryCard } from '../src/components/bookings/BookingsKpiSummary';
import { BookingsListCard } from '../src/components/bookings/BookingsListCard';
import { BookingInspectorCard } from '../src/components/bookings/BookingInspectorCard';
import { BookingsView } from '../src/components/bookings/BookingsView';
import { NewBookingModal } from '../src/components/bookings/NewBookingModal';
import * as bookingsService from '../src/lib/bookings-service';
import * as supabaseLib from '../src/lib/supabase';

function createMockBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b-1',
    branch_id: 'branch-1',
    customer_id: 'cust-1',
    service_id: 'svc-1',
    staff_id: 'staff-1',
    resource_id: 'res-1',
    booking_date: '2026-09-05',
    start_time: '10:00',
    end_time: '11:00',
    status: 'confirmed',
    type: 'walkin',
    delivery_type: 'in_spa',
    amount_paid: 1500,
    payment_method: 'pay_on_site',
    payment_status: 'pending',
    payment_reference: null,
    travel_buffer_mins: 0,
    metadata: null,
    created_at: '2026-09-01T08:00:00.000Z',
    updated_at: '2026-09-01T08:00:00.000Z',
    customer: {
      id: 'cust-1',
      full_name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '+63 917 123 4567',
      notes: 'VIP customer requested aromatherapy oils.',
    },
    service: {
      id: 'svc-1',
      name: 'Full Body Massage',
      duration_minutes: 60,
      price: 1500,
    },
    staff: {
      id: 'staff-1',
      full_name: 'Anna Cruz',
      nickname: 'Anna',
      tier: 'senior',
    },
    resource: {
      id: 'res-1',
      name: 'Room A',
      type: 'room',
    },
    ...overrides,
  };
}

const mockAuthContext: AuthContext = {
  userId: 'usr-123',
  email: 'staff@example.com',
  staffId: 'staff-1',
  fullName: 'Jane Doe',
  canonicalRole: 'crm',
  rawRole: 'crm',
  branchId: 'branch-1',
  branchName: 'Makati Branch',
  isCrmEligible: true,
};

describe('Stage 02 Bookings UI Components', () => {
  describe('BookingsHeader', () => {
    it('renders module title, subtitle, refresh button, and new booking action button', () => {
      render(<BookingsHeader onRefresh={vi.fn()} isRefreshing={false} />);

      expect(screen.getByText('Bookings')).toBeDefined();
      expect(
        screen.getByText(
          /Create, manage, and review all bookings across channels/i,
        ),
      ).toBeDefined();
      expect(screen.getByLabelText(/Refresh Bookings/i)).toBeDefined();
      expect(screen.getByLabelText(/Create New Booking/i)).toBeDefined();
    });

    it('opens and closes New Booking dormant notice modal when clicking + New Booking', async () => {
      const user = userEvent.setup();
      render(<BookingsHeader onRefresh={vi.fn()} isRefreshing={false} />);

      const newBtn = screen.getByLabelText(/Create New Booking/i);
      await user.click(newBtn);

      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText(/Administrative New Booking/i)).toBeDefined();

      const closeBtn = screen.getByRole('button', { name: /understood/i });
      await user.click(closeBtn);

      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('BookingsKpiSummaryCard', () => {
    it('renders 6 KPI metric cells with formatted numbers and handles kpi click', async () => {
      const user = userEvent.setup();
      const onKpiClick = vi.fn();
      const mockKpis: BookingKpiSummary = {
        today: {
          label: "Today's Bookings",
          count: 12,
          subtext: '12 scheduled today',
          iconName: 'today',
        },
        confirmed: {
          label: 'Confirmed',
          count: 5,
          subtext: '5 ready',
          iconName: 'confirmed',
        },
        checkedIn: {
          label: 'Checked In',
          count: 3,
          subtext: '3 in spa',
          iconName: 'checked_in',
        },
        completed: {
          label: 'Completed',
          count: 4,
          subtext: '4 finished',
          iconName: 'completed',
        },
        noShow: {
          label: 'No Show',
          count: 1,
          subtext: '1 missed',
          iconName: 'no_show',
        },
        cancelled: {
          label: 'Cancelled',
          count: 2,
          subtext: '2 voided',
          iconName: 'cancelled',
        },
      };

      render(
        <BookingsKpiSummaryCard kpis={mockKpis} onKpiClick={onKpiClick} />,
      );

      expect(screen.getByText('12')).toBeDefined();
      expect(screen.getByText('5')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
      expect(screen.getByText('4')).toBeDefined();
      expect(screen.getByText('1')).toBeDefined();
      expect(screen.getByText('2')).toBeDefined();

      const todayCard = screen
        .getByText("Today's Bookings")
        .closest('.bookings-kpi-cell');
      if (todayCard) {
        await user.click(todayCard);
        expect(onKpiClick).toHaveBeenCalledWith('today');
      }
    });
  });

  describe('BookingsListCard', () => {
    it('renders scope tabs, search input, filter selects, and data table', () => {
      const mockBooking = createMockBooking();
      render(
        <BookingsListCard
          bookings={[mockBooking]}
          selectedBookingId={mockBooking.id}
          onSelectBooking={vi.fn()}
          activeScope="all"
          onScopeChange={vi.fn()}
          filters={{
            search: '',
            status: 'all',
            date: '',
            serviceId: 'all',
            staffId: 'all',
          }}
          onFiltersChange={vi.fn()}
          onResetFilters={vi.fn()}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          servicesList={[{ id: 'svc-1', name: 'Full Body Massage' }]}
          staffList={[{ id: 'staff-1', full_name: 'Anna Cruz' }]}
        />,
      );

      expect(screen.getByText('All Bookings')).toBeDefined();
      expect(screen.getByPlaceholderText(/Search by customer/i)).toBeDefined();
      expect(screen.getAllByText('Maria Santos').length).toBeGreaterThan(0);
    });

    it('triggers onSelectBooking callback when a row is clicked', async () => {
      const user = userEvent.setup();
      const mockBooking = createMockBooking();
      const onSelectBooking = vi.fn();

      render(
        <BookingsListCard
          bookings={[mockBooking]}
          selectedBookingId={null}
          onSelectBooking={onSelectBooking}
          activeScope="all"
          onScopeChange={vi.fn()}
          filters={{
            search: '',
            status: 'all',
            date: '',
            serviceId: 'all',
            staffId: 'all',
          }}
          onFiltersChange={vi.fn()}
          onResetFilters={vi.fn()}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          servicesList={[]}
          staffList={[]}
        />,
      );

      await user.click(screen.getAllByText('Maria Santos')[0]);
      expect(onSelectBooking).toHaveBeenCalledWith(mockBooking);
    });

    it('displays empty state message when bookings array is empty', () => {
      render(
        <BookingsListCard
          bookings={[]}
          selectedBookingId={null}
          onSelectBooking={vi.fn()}
          activeScope="today"
          onScopeChange={vi.fn()}
          filters={{
            search: 'NonExistent',
            status: 'all',
            date: '',
            serviceId: 'all',
            staffId: 'all',
          }}
          onFiltersChange={vi.fn()}
          onResetFilters={vi.fn()}
          currentPage={1}
          pageSize={10}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          servicesList={[]}
          staffList={[]}
        />,
      );

      expect(screen.getByText(/No bookings found/i)).toBeDefined();
    });
  });

  describe('BookingInspectorCard', () => {
    it('renders empty state placeholder when no booking is selected', () => {
      render(<BookingInspectorCard booking={null} onClose={vi.fn()} />);
      expect(screen.getByText(/No Booking Selected/i)).toBeDefined();
    });

    it('renders selected booking header, customer profile card, tabs, and details', () => {
      const mockBooking = createMockBooking();
      render(<BookingInspectorCard booking={mockBooking} onClose={vi.fn()} />);

      expect(screen.getByText(/Ref:/i)).toBeDefined();
      expect(screen.getAllByText('Maria Santos').length).toBeGreaterThan(0);
      expect(screen.getByText('maria@example.com')).toBeDefined();
      expect(screen.getByText('+63 917 123 4567')).toBeDefined();
      expect(screen.getByText('Anna Cruz')).toBeDefined();
      expect(screen.getAllByText('Room A').length).toBeGreaterThan(0);
    });

    it('switches between inspector tabs correctly', async () => {
      const user = userEvent.setup();
      const mockBooking = createMockBooking();
      render(<BookingInspectorCard booking={mockBooking} onClose={vi.fn()} />);

      // Customer tab
      await user.click(screen.getByRole('tab', { name: /customer/i }));
      expect(screen.getByText(/Customer Record/i)).toBeDefined();

      // Timeline tab
      await user.click(screen.getByRole('tab', { name: /timeline/i }));
      expect(screen.getByText(/Booking Created/i)).toBeDefined();

      // Payments tab (Dormant Notice)
      await user.click(screen.getByRole('tab', { name: /payments/i }));
      expect(screen.getByText(/Dormant Scope Notice/i)).toBeDefined();

      // Notes tab
      await user.click(screen.getByRole('tab', { name: /notes/i }));
      expect(
        screen.getByText('VIP customer requested aromatherapy oils.'),
      ).toBeDefined();
    });

    it('opens dormant action modal when clicking Reschedule or Cancel quick actions', async () => {
      const user = userEvent.setup();
      const mockBooking = createMockBooking();
      render(<BookingInspectorCard booking={mockBooking} onClose={vi.fn()} />);

      const rescheduleBtn = screen.getByRole('button', { name: /reschedule/i });
      await user.click(rescheduleBtn);

      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText(/Booking Action Notice/i)).toBeDefined();

      const closeBtn = screen.getByRole('button', { name: /understood/i });
      await user.click(closeBtn);

      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('BookingsView (Integrated Container)', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('loads and displays bookings from branch on initial mount', async () => {
      const mockBookings: Booking[] = [
        createMockBooking({
          id: 'b-1',
          customer: {
            id: 'c-1',
            full_name: 'Maria Santos',
            email: 'maria@test.com',
            phone: '123',
          },
        }),
        createMockBooking({
          id: 'b-2',
          status: 'checked_in',
          customer: {
            id: 'c-2',
            full_name: 'Carlos Mendoza',
            email: 'carlos@test.com',
            phone: '456',
          },
        }),
      ];

      vi.spyOn(supabaseLib, 'getSupabaseClient').mockReturnValue(
        {} as unknown as SupabaseClient,
      );
      vi.spyOn(bookingsService, 'fetchBranchBookings').mockResolvedValue(
        mockBookings,
      );

      render(<BookingsView authContext={mockAuthContext} />);

      // Initial loading skeleton should be shown
      expect(screen.getByTestId('bookings-skeleton')).toBeDefined();

      // Await data load
      await waitFor(() => {
        expect(screen.queryByTestId('bookings-skeleton')).toBeNull();
      });

      expect(screen.getByTestId('bookings-view')).toBeDefined();
      expect(screen.getAllByText('Maria Santos').length).toBeGreaterThan(0);
      expect(screen.getByText('Carlos Mendoza')).toBeDefined();
    });

    it('displays error banner and allows retry when fetch fails', async () => {
      vi.spyOn(supabaseLib, 'getSupabaseClient').mockReturnValue(
        {} as unknown as SupabaseClient,
      );
      const fetchSpy = vi
        .spyOn(bookingsService, 'fetchBranchBookings')
        .mockRejectedValueOnce(new Error('Network connectivity lost'))
        .mockResolvedValueOnce([createMockBooking()]);

      render(<BookingsView authContext={mockAuthContext} />);

      await waitFor(() => {
        expect(screen.getByTestId('bookings-error-banner')).toBeDefined();
      });

      expect(screen.getByText(/Network connectivity lost/i)).toBeDefined();

      // Click retry
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('bookings-error-banner')).toBeNull();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Maria Santos').length).toBeGreaterThan(0);
      });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('opens NewBookingModal when clicking + New Booking in BookingsHeader', async () => {
      vi.spyOn(supabaseLib, 'getSupabaseClient').mockReturnValue(
        {} as unknown as SupabaseClient,
      );
      vi.spyOn(bookingsService, 'fetchBranchBookings').mockResolvedValue([]);
      vi.spyOn(bookingsService, 'fetchBranchBookingOptions').mockResolvedValue({
        services: [
          {
            id: 's-1',
            name: 'Swedish Massage',
            durationMinutes: 60,
            price: 700,
            availableInSpa: true,
          },
        ],
        staff: [{ id: 'st-1', name: 'Ana Cruz', nickname: 'Ana' }],
        resources: [{ id: 'r-1', name: 'Room 1', type: 'room', capacity: 1 }],
      });

      render(<BookingsView authContext={mockAuthContext} />);

      await waitFor(() => {
        expect(screen.queryByTestId('bookings-skeleton')).toBeNull();
      });

      const newBookingBtn = screen.getByTestId('new-booking-button');
      fireEvent.click(newBookingBtn);

      expect(screen.getByTestId('new-booking-modal')).toBeDefined();
      expect(
        screen.getByRole('heading', { name: 'New Booking' }),
      ).toBeDefined();
      expect(screen.getByText('Walk-in')).toBeDefined();
      expect(screen.getByText('Home Service')).toBeDefined();
      await screen.findByText('Swedish Massage');
    });
  });

  describe('NewBookingModal', () => {
    it('renders write boundary notice, calculates options, and handles discard lifecycle', async () => {
      vi.spyOn(bookingsService, 'fetchBranchBookingOptions').mockResolvedValue({
        services: [
          {
            id: 's-1',
            name: 'Swedish Massage',
            durationMinutes: 60,
            price: 700,
            availableInSpa: true,
            availableHomeService: false,
          },
          {
            id: 's-2',
            name: 'Deep Tissue',
            durationMinutes: 90,
            price: 950,
            availableInSpa: true,
            availableHomeService: true,
          },
        ],
        staff: [{ id: 'st-1', name: 'Ana Cruz', nickname: 'Ana' }],
        resources: [{ id: 'r-1', name: 'Room 1', type: 'room', capacity: 1 }],
      });

      const onBookingCreated = vi.fn();
      const onClose = vi.fn();

      const { rerender } = render(
        <NewBookingModal
          isOpen={true}
          onClose={onClose}
          branchId="branch-1"
          branchName="Makati Branch"
          onBookingCreated={onBookingCreated}
        />,
      );

      // Wait for options to load
      await screen.findByText('Swedish Massage');

      // Verify write boundary notice
      expect(screen.getByText('Booking workflow preview')).toBeDefined();

      // Verify mode tabs
      expect(screen.getByText('Walk-in')).toBeDefined();
      expect(screen.getByText('Phone')).toBeDefined();
      expect(screen.getByText('Future')).toBeDefined();
      expect(screen.getByText('Home Service')).toBeDefined();

      // Enter customer info to make form dirty
      const nameInput = screen.getByPlaceholderText(/e\.g\. Maria Santos/i);
      fireEvent.change(nameInput, { target: { value: 'Elena Santos' } });

      // Click Close button -> should trigger discard confirmation
      const closeBtn = screen.getByLabelText('Close modal');
      fireEvent.click(closeBtn);

      expect(screen.getByText('Discard unfinished booking?')).toBeDefined();

      // Confirm discard
      const discardBtn = screen.getByRole('button', { name: 'Discard' });
      fireEvent.click(discardBtn);

      expect(onClose).toHaveBeenCalled();

      // Rerender as closed then open again -> should be pristine
      rerender(
        <NewBookingModal
          isOpen={false}
          onClose={onClose}
          branchId="branch-1"
          branchName="Makati Branch"
          onBookingCreated={onBookingCreated}
        />,
      );

      rerender(
        <NewBookingModal
          isOpen={true}
          onClose={onClose}
          branchId="branch-1"
          branchName="Makati Branch"
          onBookingCreated={onBookingCreated}
        />,
      );

      await screen.findByText('Swedish Massage');
      const freshNameInput = screen.getByPlaceholderText(
        /e\.g\. Maria Santos/i,
      ) as HTMLInputElement;
      expect(freshNameInput.value).toBe('');
    });

    it('disables creation without invoking the write helper', async () => {
      vi.spyOn(bookingsService, 'fetchBranchBookingOptions').mockResolvedValue({
        services: [
          {
            id: 's-1',
            name: 'Swedish Massage',
            durationMinutes: 60,
            price: 700,
            availableInSpa: true,
          },
        ],
        staff: [{ id: 'st-1', name: 'Ana Cruz', nickname: 'Ana' }],
        resources: [{ id: 'r-1', name: 'Room 1', type: 'room', capacity: 1 }],
      });

      const onBookingCreated = vi.fn();
      const onClose = vi.fn();

      render(
        <NewBookingModal
          isOpen={true}
          onClose={onClose}
          branchId="branch-1"
          branchName="Makati Branch"
          onBookingCreated={onBookingCreated}
        />,
      );

      await screen.findByText('Swedish Massage');

      const nameInput = screen.getByPlaceholderText(/e\.g\. Maria Santos/i);
      const phoneInput = screen.getByPlaceholderText(/e\.g\. 09171234567/i);

      fireEvent.change(nameInput, { target: { value: 'Elena Santos' } });
      fireEvent.change(phoneInput, { target: { value: '09179998877' } });

      const createSpy = vi.spyOn(bookingsService, 'createBranchBooking');
      const submitBtn = screen.getByRole('button', {
        name: 'Booking Creation Unavailable',
      }) as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(true);
      fireEvent.click(submitBtn);
      fireEvent.submit(nameInput.closest('form')!);
      expect(createSpy).not.toHaveBeenCalled();

      expect(onBookingCreated).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
