import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { NewBookingModal } from '../src/components/bookings/NewBookingModal';
import * as service from '../src/lib/bookings-service';
import type {
  BookingCustomer,
  QuickBookingOptionResource,
  QuickBookingOptionService,
  QuickBookingOptionStaff,
} from '../src/types/bookings';

interface MockBookingOptions {
  services: QuickBookingOptionService[];
  staff: QuickBookingOptionStaff[];
  resources: QuickBookingOptionResource[];
}

const mockOptions: MockBookingOptions = {
  services: [
    {
      id: 'srv-swedish',
      name: 'Swedish Massage',
      price: 500,
      durationMinutes: 60,
      availableInSpa: true,
      availableHomeService: false,
      category: 'Massage',
      description: 'Relaxing full body massage',
    },
    {
      id: 'srv-facial',
      name: 'Facial Treatment',
      price: 650,
      durationMinutes: 60,
      availableInSpa: true,
      availableHomeService: true,
      category: 'Facial',
      description: 'Deep cleansing & glowing skin',
    },
    {
      id: 'srv-thai',
      name: 'Thai Massage',
      price: 700,
      durationMinutes: 90,
      availableInSpa: true,
      availableHomeService: false,
      category: 'Massage',
      description: 'Traditional healing therapy',
    },
  ],
  staff: [
    {
      id: 'st-maria',
      name: 'Maria Santos',
      nickname: 'Maria',
      serviceIds: ['srv-swedish', 'srv-facial'],
    },
    {
      id: 'st-anna',
      name: 'Anna Reyes',
      nickname: 'Anna',
      serviceIds: ['srv-swedish', 'srv-thai', 'srv-facial'],
    },
  ],
  resources: [
    { id: 'res-room1', name: 'Room 1', type: 'room', capacity: 1 },
    { id: 'res-room2', name: 'Room 2', type: 'room', capacity: 1 },
  ],
};

function mountModal(
  props?: Partial<React.ComponentProps<typeof NewBookingModal>>,
) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onBookingCreated: vi.fn(),
    branchId: 'branch-main',
    branchName: 'Main Spa',
    showFinancialFields: true,
  };
  return render(<NewBookingModal {...defaultProps} {...props} />);
}

describe('Booking Modal Layout & Workflow Corrections (Approved Reference Parity)', () => {
  beforeEach(() => {
    vi.spyOn(service, 'fetchBranchBookingOptions').mockResolvedValue(
      mockOptions,
    );
    vi.spyOn(service, 'searchBranchCustomers').mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders a compact desktop dialog with 2-column layout and pinned Save/Cancel actions', async () => {
    const { container } = mountModal();
    await screen.findByText('Swedish Massage');

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();

    const card = container.querySelector('.new-booking-modal-card');
    expect(card).toBeDefined();

    // 2-column body
    const bodyGrid = container.querySelector('.new-booking-body-grid');
    expect(bodyGrid).toBeDefined();
    const leftCol = container.querySelector('.new-booking-form-col');
    const rightCol = container.querySelector('.new-booking-summary-col');
    expect(leftCol).toBeDefined();
    expect(rightCol).toBeDefined();

    // Pinned footer actions in right summary column
    const footerActions = container.querySelector('.summary-footer-actions');
    expect(footerActions).toBeDefined();
    expect(
      within(footerActions as HTMLElement).getByRole('button', {
        name: /cancel/i,
      }),
    ).toBeDefined();
    expect(
      within(footerActions as HTMLElement).getByRole('button', {
        name: /save booking|create booking/i,
      }),
    ).toBeDefined();
  });

  it('merges customer search and name into ONE input inside Customer Information card', async () => {
    const mockCustomers: BookingCustomer[] = [
      {
        id: 'cust-1',
        full_name: 'Maria Santos',
        phone: '09171234567',
        email: 'maria@example.test',
      },
    ];
    vi.mocked(service.searchBranchCustomers).mockResolvedValue(mockCustomers);

    const { container } = mountModal();
    await screen.findByText('Swedish Massage');

    // Customer Information card
    const custHeader = container.querySelector('.booking-customer-header');
    expect(custHeader).toBeDefined();
    expect(
      within(custHeader as HTMLElement).getByText('Customer Information'),
    ).toBeDefined();

    // Searchable name input
    const nameInput = screen.getByLabelText(
      /customer full name/i,
    ) as HTMLInputElement;
    expect(nameInput).toBeDefined();
    expect(nameInput.placeholder).toContain(
      'Search customer / enter customer name',
    );

    // Phone and Email in compact row
    const phoneInput = screen.getByLabelText(
      /phone number/i,
    ) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(phoneInput).toBeDefined();
    expect(emailInput).toBeDefined();

    // Notes field directly underneath customer fields
    const notesInput = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
    expect(notesInput).toBeDefined();

    // Typing in name triggers customer search
    fireEvent.change(nameInput, { target: { value: 'Maria' } });
    await waitFor(() => {
      expect(service.searchBranchCustomers).toHaveBeenCalledWith(
        'branch-main',
        'Maria',
      );
    });

    // Selecting existing customer populates phone & email and shows existing pill
    const resultItem = await screen.findByRole('button', {
      name: /Maria Santos/,
    });
    fireEvent.click(resultItem);

    expect(nameInput.value).toBe('Maria Santos');
    expect(phoneInput.value).toBe('09171234567');
    expect(emailInput.value).toBe('maria@example.test');
    expect(screen.getByText('Existing Customer')).toBeDefined();

    // Editing populated name clears authoritative customer record
    fireEvent.change(nameInput, { target: { value: 'Maria Santos Updated' } });
    expect(screen.queryByText('Existing Customer')).toBeNull();
  });

  it('renders disabled Home Service location state explaining precise address requirement', async () => {
    mountModal();
    await screen.findByText('Swedish Massage');

    // Home service mode tab is disabled with informative title
    const homeTab = screen.getByRole('tab', { name: /home service/i });
    expect(homeTab.getAttribute('aria-disabled')).toBe('true');
    expect(homeTab.hasAttribute('disabled')).toBe(true);
    expect(homeTab.getAttribute('title')).toContain(
      'precise address/location support is connected',
    );
  });

  it('keeps guest card self-contained with categories, carousel, duration, staff, room, and schedule', async () => {
    const { container } = mountModal();
    await screen.findByText('Swedish Massage');

    const guestCard = container.querySelector('.booking-guest-card');
    expect(guestCard).toBeDefined();

    // Categories
    const categoryWrap = within(guestCard as HTMLElement).getByText(
      'All Services',
    );
    expect(categoryWrap).toBeDefined();
    expect(within(guestCard as HTMLElement).getByText('Massage')).toBeDefined();
    expect(within(guestCard as HTMLElement).getByText('Facial')).toBeDefined();

    // Filter by Facial category
    fireEvent.click(within(guestCard as HTMLElement).getByText('Facial'));
    expect(
      within(guestCard as HTMLElement).getByText('Facial Treatment'),
    ).toBeDefined();
    expect(
      within(guestCard as HTMLElement).queryByText('Swedish Massage'),
    ).toBeNull();

    // Reset to All Services
    fireEvent.click(within(guestCard as HTMLElement).getByText('All Services'));
    expect(
      within(guestCard as HTMLElement).getByText('Swedish Massage'),
    ).toBeDefined();

    // Carousel cards have duration and price
    expect(
      within(guestCard as HTMLElement).getAllByText('60 min').length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(guestCard as HTMLElement).getAllByText('₱500.00').length,
    ).toBeGreaterThanOrEqual(1);

    // Duration pills inside guest card
    const durationPill60 = within(guestCard as HTMLElement).getByText('60m');
    expect(durationPill60).toBeDefined();
    expect(durationPill60.classList.contains('active')).toBe(true);

    // Unquoted duration pills (30m, 90m, 120m) are disabled
    const durationPill30 = within(guestCard as HTMLElement).getByText(
      '30m',
    ) as HTMLButtonElement;
    expect(durationPill30.disabled).toBe(true);

    // Therapist dropdown inside guest card
    const staffSelect = within(guestCard as HTMLElement).getByLabelText(
      /therapist/i,
    ) as HTMLSelectElement;
    expect(staffSelect).toBeDefined();

    // Room dropdown inside guest card
    const roomSelect = within(guestCard as HTMLElement).getByLabelText(
      /room/i,
    ) as HTMLSelectElement;
    expect(roomSelect).toBeDefined();

    // Date and time inside guest card
    const dateInput = within(guestCard as HTMLElement).getByLabelText(
      /date & time/i,
    ) as HTMLInputElement;
    expect(dateInput).toBeDefined();
    // Walk-in is read-only
    expect(dateInput.readOnly).toBe(true);

    // Expected finish time calculated
    expect(within(guestCard as HTMLElement).getByText(/finish/i)).toBeDefined();
  });

  it('allows date and time editing in Phone / Future mode and recalculates finish time', async () => {
    const { container } = mountModal();
    await screen.findByText('Swedish Massage');

    // Switch to Phone mode
    fireEvent.click(screen.getByRole('tab', { name: /^Phone/ }));

    const guestCard = container.querySelector('.booking-guest-card');
    const dateInput = within(guestCard as HTMLElement).getByLabelText(
      /date & time/i,
    ) as HTMLInputElement;
    expect(dateInput.readOnly).toBe(false);

    // Change date and time
    fireEvent.change(dateInput, { target: { value: '2026-11-15' } });
    expect(dateInput.value).toBe('2026-11-15');

    const timeInput = container.querySelector(
      '#booking-start-time',
    ) as HTMLInputElement;
    expect(timeInput.readOnly).toBe(false);
    fireEvent.change(timeInput, { target: { value: '14:00' } });
    expect(timeInput.value).toBe('14:00');

    // 60-min service finish time calculated to 15:00
    const finishPill = container.querySelector('.guest-finish-calculated');
    expect(finishPill?.textContent).toContain('15:00');
  });

  it('supports multi-guest group booking with synchronized date/time and automatic staff/room allocation on save', async () => {
    const { container } = mountModal();
    await screen.findByText('Swedish Massage');

    // Add Guest 2
    fireEvent.click(screen.getByRole('button', { name: 'Add Guest' }));

    const cards = container.querySelectorAll('.booking-guest-card');
    expect(cards).toHaveLength(2);

    // Guest 2 has automatic therapist and room on save (no independent manual overrides per hosted contract)
    const guest2 = cards[1] as HTMLElement;
    expect(
      within(guest2).getAllByText('Automatic — assigned on save').length,
    ).toBe(2);
    expect(screen.getAllByText(/Auto on save/i).length).toBeGreaterThanOrEqual(
      1,
    );

    // Summary displays both guests
    expect(screen.getByText('Guests & Services (2)')).toBeDefined();
  });
});
