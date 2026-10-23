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
  DistanceQuote,
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

  it('makes Home Service mode selectable, provides editable address, replaces room, and blocks save', async () => {
    mountModal();
    await screen.findByText('Swedish Massage');

    // Home service mode tab is selectable
    const homeTab = screen.getByRole('tab', { name: /home service/i });
    expect(homeTab.hasAttribute('disabled')).toBe(false);
    fireEvent.click(homeTab);
    expect(homeTab.getAttribute('aria-selected')).toBe('true');

    // Header & summary updated
    expect(
      screen.getByRole('heading', { name: 'New Booking – Home Service' }),
    ).toBeDefined();
    expect(screen.getByText('Home Service booking')).toBeDefined();

    // Address input is visible, editable, and shows distinct location states
    const addressInput = screen.getByTestId(
      'hs-address-input',
    ) as HTMLInputElement;
    expect(addressInput.disabled).toBe(false);

    // Initial state: Address not entered.
    expect(screen.getByText('Address not entered.')).toBeDefined();

    // Typing short address transitions to Address being entered.
    fireEvent.change(addressInput, { target: { value: 'To' } });
    expect(addressInput.value).toBe('To');
    expect(screen.getByText('Address being entered.')).toBeDefined();

    // Typing >= 3 characters transitions to searching
    fireEvent.change(addressInput, { target: { value: 'Tower 2, Makati' } });
    expect(screen.getByText('Searching Google Places...')).toBeDefined();

    // Room control is replaced
    expect(screen.getByTestId('hs-no-room')).toBeDefined();
    expect(screen.getByText('No room required (Home Service)')).toBeDefined();

    // Save button is disabled with explanation
    const saveBtn = screen.getByRole('button', {
      name: 'Create Booking',
    }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
    expect(screen.getByTestId('hs-save-blocked-notice')).toBeDefined();
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

  it('renders exactly THREE visible mode tabs without nested buttons and selects unified Phone / Future mode', async () => {
    const create = vi
      .spyOn(service, 'createBranchBooking')
      .mockResolvedValue({ ok: true, bookingId: 'phone-b-1' });
    const { container } = mountModal();
    await screen.findByText('Swedish Massage');

    // Exactly 3 mode tabs
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0].textContent).toContain('Walk-in');
    expect(tabs[1].textContent).toContain('Phone / Future');
    expect(tabs[2].textContent).toContain('Home Service');

    // No nested buttons inside any tab
    tabs.forEach((tab) => {
      expect(tab.querySelectorAll('button').length).toBe(0);
    });

    // Click Phone / Future tab
    const phoneFutureTab = tabs[1];
    fireEvent.click(phoneFutureTab);
    expect(phoneFutureTab.getAttribute('aria-selected')).toBe('true');

    // Header & summary show Phone / Future
    expect(
      screen.getByRole('heading', { name: 'New Booking – Phone / Future' }),
    ).toBeDefined();
    expect(screen.getByText('Phone / Future booking')).toBeDefined();

    // Date & time are editable
    const dateInput = container.querySelector(
      '#booking-date',
    ) as HTMLInputElement;
    const timeInput = container.querySelector(
      '#booking-start-time',
    ) as HTMLInputElement;
    expect(dateInput.readOnly).toBe(false);
    expect(timeInput.readOnly).toBe(false);

    // Edit date and time
    fireEvent.change(dateInput, { target: { value: '2026-11-20' } });
    fireEvent.change(timeInput, { target: { value: '16:00' } });

    // Customer details
    const nameInput = screen.getByTestId(
      'customer-search-input',
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Phone Caller' } });
    const phoneInput = container.querySelector(
      '#customer-phone',
    ) as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '09181234567' } });

    // Submit
    const saveBtn = screen.getByRole('button', { name: 'Create Booking' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Phone Caller',
          phone: '09181234567',
          date: '2026-11-20',
          startTime: '16:00',
          mode: 'phone',
        }),
      );
    });
  });

  it('normalizes legacy standard_future initialMode to Phone / Future state and submits mode phone', async () => {
    const create = vi
      .spyOn(service, 'createBranchBooking')
      .mockResolvedValue({ ok: true, bookingId: 'legacy-future-b' });
    const { container } = mountModal({ initialMode: 'standard_future' });
    await screen.findByText('Swedish Massage');

    const tabs = screen.getAllByRole('tab');
    const phoneFutureTab = tabs[1];
    expect(phoneFutureTab.getAttribute('aria-selected')).toBe('true');

    expect(
      screen.getByRole('heading', { name: 'New Booking – Phone / Future' }),
    ).toBeDefined();
    expect(screen.getByText('Phone / Future booking')).toBeDefined();

    const nameInput = screen.getByTestId(
      'customer-search-input',
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Legacy Future Client' } });
    const phoneInput = container.querySelector(
      '#customer-phone',
    ) as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '09191234567' } });

    const saveBtn = screen.getByRole('button', { name: 'Create Booking' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Legacy Future Client',
          phone: '09191234567',
          mode: 'phone',
        }),
      );
    });
  });

  it('preserves entered customer information and valid services when switching between modes', async () => {
    const { container } = mountModal();
    await screen.findByText('Swedish Massage');

    // Fill customer info
    const nameInput = screen.getByTestId(
      'customer-search-input',
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Elena Cruz' } });
    const phoneInput = container.querySelector(
      '#customer-phone',
    ) as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '09201234567' } });
    const notesInput = container.querySelector(
      '#booking-notes',
    ) as HTMLTextAreaElement;
    fireEvent.change(notesInput, {
      target: { value: 'Prefers lavender scent' },
    });

    // Switch to Phone / Future mode
    fireEvent.click(screen.getByRole('tab', { name: /Phone \/ Future/i }));
    expect(nameInput.value).toBe('Elena Cruz');
    expect(phoneInput.value).toBe('09201234567');
    expect(notesInput.value).toBe('Prefers lavender scent');

    // Date & time are editable in Phone / Future
    const dateInput = container.querySelector(
      '#booking-date',
    ) as HTMLInputElement;
    expect(dateInput.readOnly).toBe(false);

    // Switch to Home Service mode
    fireEvent.click(screen.getByRole('tab', { name: /Home Service/i }));
    expect(nameInput.value).toBe('Elena Cruz');
    expect(phoneInput.value).toBe('09201234567');
    expect(notesInput.value).toBe('Prefers lavender scent');

    // Switch back to Walk-in
    fireEvent.click(screen.getByRole('tab', { name: /Walk-in/i }));
    expect(nameInput.value).toBe('Elena Cruz');
    expect(phoneInput.value).toBe('09201234567');
    expect(notesInput.value).toBe('Prefers lavender scent');

    // Date & time are reset to branch defaults and read-only for Walk-in
    expect(dateInput.readOnly).toBe(true);
  });

  it('supports real Home Service location autocomplete, place resolution, distance quote, and enables Save safely', async () => {
    const mockPredictions = [
      {
        placeId: 'ChIJ123_makati',
        description: 'Salcedo Village, Makati, Metro Manila, Philippines',
        mainText: 'Salcedo Village',
        secondaryText: 'Makati, Metro Manila, Philippines',
      },
    ];

    const mockResolved = {
      placeId: 'ChIJ123_makati',
      formattedAddress: 'Salcedo Village, Makati, Metro Manila, Philippines',
      lat: 14.5586,
      lng: 121.0244,
      addressComponents: [
        {
          long_name: 'Makati',
          short_name: 'Makati',
          types: ['locality'],
        },
      ],
      mapUrl: 'https://maps.google.com/?q=14.5586,121.0244',
    };

    const mockQuote: DistanceQuote = {
      branchId: 'branch-main',
      branchName: 'Main Spa',
      distanceKm: 4.5,
      drivingDistanceKm: 4.5,
      distanceSource: 'google_routes',
      baseFee: 100,
      includedKm: 3,
      perKmFee: 30,
      billableDistanceKm: 1.5,
      rawFee: 145,
      travelFee: 150,
    };

    vi.spyOn(service, 'fetchLocationAutocomplete').mockResolvedValue({
      ok: true,
      predictions: mockPredictions,
    });
    vi.spyOn(service, 'resolveLocationPlace').mockResolvedValue({
      ok: true,
      location: mockResolved,
    });
    vi.spyOn(service, 'fetchDistanceQuote').mockResolvedValue({
      ok: true,
      quote: mockQuote,
    });

    const create = vi
      .spyOn(service, 'createBranchBooking')
      .mockResolvedValue({ ok: true, bookingId: 'home-b-1' });

    const { container } = mountModal();
    await screen.findByText('Swedish Massage');

    // Switch to Home Service
    fireEvent.click(screen.getByRole('tab', { name: /Home Service/i }));

    // Facial Treatment is available for Home Service
    const facialBtn = screen.getByRole('button', { name: /Facial Treatment/i });
    fireEvent.click(facialBtn);

    // Fill customer info
    const nameInput = screen.getByTestId(
      'customer-search-input',
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Home Client' } });
    const phoneInput = container.querySelector(
      '#customer-phone',
    ) as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '09170001122' } });

    // Address input
    const addressInput = screen.getByTestId(
      'hs-address-input',
    ) as HTMLInputElement;
    expect(addressInput).toBeDefined();

    // Type address (triggers debounced autocomplete)
    fireEvent.change(addressInput, { target: { value: 'Salcedo' } });

    // Wait for autocomplete suggestions
    await waitFor(() => {
      expect(service.fetchLocationAutocomplete).toHaveBeenCalledWith(
        'Salcedo',
        'branch-main',
        expect.any(String),
      );
    });

    // Suggestions dropdown appears
    const suggestionBtn = await screen.findByTestId(
      'hs-suggestion-ChIJ123_makati',
    );
    expect(suggestionBtn).toBeDefined();

    // Click suggestion
    fireEvent.click(suggestionBtn);

    // Resolves location place details
    await waitFor(() => {
      expect(service.resolveLocationPlace).toHaveBeenCalledWith(
        'ChIJ123_makati',
        expect.any(String),
      );
    });

    // Fetches distance quote
    await waitFor(() => {
      expect(service.fetchDistanceQuote).toHaveBeenCalledWith('branch-main', {
        lat: 14.5586,
        lng: 121.0244,
      });
    });

    // Verified location box and distance quote metrics are displayed
    expect(await screen.findByText('Verified precise location.')).toBeDefined();
    expect(screen.getByText('4.5 km')).toBeDefined();
    expect(screen.getAllByText('₱150.00').length).toBeGreaterThanOrEqual(1);

    // Transportation fee in summary
    expect(screen.getByText(/Transportation Fee/i)).toBeDefined();
    expect(screen.getByText('₱800.00')).toBeDefined();

    // Save button is now enabled
    const saveBtn = screen.getByRole('button', {
      name: 'Create Booking',
    }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);

    // Submit booking
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Home Client',
          phone: '09170001122',
          mode: 'home_service',
          homeServiceAddress:
            'Salcedo Village, Makati, Metro Manila, Philippines',
          homeServicePlaceId: 'ChIJ123_makati',
          homeServiceFormattedAddress:
            'Salcedo Village, Makati, Metro Manila, Philippines',
          homeServiceLat: 14.5586,
          homeServiceLng: 121.0244,
          resourceId: undefined,
        }),
      );
    });
  });

  it('invalidates previously verified location and quote when typing after selection', async () => {
    const mockPredictions = [
      {
        placeId: 'ChIJ123_makati',
        description: 'Salcedo Village, Makati, Metro Manila, Philippines',
        mainText: 'Salcedo Village',
        secondaryText: 'Makati, Metro Manila, Philippines',
      },
    ];

    const mockResolved = {
      placeId: 'ChIJ123_makati',
      formattedAddress: 'Salcedo Village, Makati, Metro Manila, Philippines',
      lat: 14.5586,
      lng: 121.0244,
    };

    const mockQuote: DistanceQuote = {
      branchId: 'branch-main',
      branchName: 'Main Spa',
      distanceKm: 4.5,
      drivingDistanceKm: 4.5,
      distanceSource: 'google_routes',
      baseFee: 100,
      includedKm: 3,
      perKmFee: 30,
      billableDistanceKm: 1.5,
      rawFee: 145,
      travelFee: 150,
    };

    vi.spyOn(service, 'fetchLocationAutocomplete').mockResolvedValue({
      ok: true,
      predictions: mockPredictions,
    });
    vi.spyOn(service, 'resolveLocationPlace').mockResolvedValue({
      ok: true,
      location: mockResolved,
    });
    vi.spyOn(service, 'fetchDistanceQuote').mockResolvedValue({
      ok: true,
      quote: mockQuote,
    });

    const { container } = mountModal();
    await screen.findByText('Swedish Massage');

    fireEvent.click(screen.getByRole('tab', { name: /Home Service/i }));
    fireEvent.click(screen.getByRole('button', { name: /Facial Treatment/i }));

    const nameInput = screen.getByTestId(
      'customer-search-input',
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Home Client' } });
    const phoneInput = container.querySelector(
      '#customer-phone',
    ) as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '09170001122' } });

    const addressInput = screen.getByTestId(
      'hs-address-input',
    ) as HTMLInputElement;
    fireEvent.change(addressInput, { target: { value: 'Salcedo' } });

    const suggestionBtn = await screen.findByTestId(
      'hs-suggestion-ChIJ123_makati',
    );
    fireEvent.click(suggestionBtn);

    await screen.findByText('Verified precise location.');
    const saveBtn = screen.getByRole('button', {
      name: 'Create Booking',
    }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);

    // Typing in address input immediately invalidates verified location and quote
    fireEvent.change(addressInput, { target: { value: 'Salcedo modified' } });
    expect(screen.queryByText('Verified precise location.')).toBeNull();
    expect(saveBtn.disabled).toBe(true);
    expect(screen.getByTestId('hs-save-blocked-notice')).toBeDefined();
  });
});
