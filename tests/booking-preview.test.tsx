import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { NewBookingModal } from '../src/components/bookings/NewBookingModal';
import * as service from '../src/lib/bookings-service';
import type { BookingCustomer } from '../src/types/bookings';

const options = {
  services: [
    {
      id: 'spa',
      name: 'Spa only',
      price: 100,
      durationMinutes: 30,
      availableInSpa: true,
      availableHomeService: false,
    },
    {
      id: 'both',
      name: 'Both modes',
      price: 200,
      durationMinutes: 45,
      availableInSpa: true,
      availableHomeService: true,
    },
    {
      id: 'home',
      name: 'Home only',
      price: 300,
      durationMinutes: 60,
      availableInSpa: false,
      availableHomeService: true,
    },
  ],
  staff: [
    { id: 'spa-provider', name: 'Spa provider', serviceIds: ['spa'] },
    {
      id: 'all-provider',
      name: 'All services provider',
      serviceIds: ['spa', 'both', 'home'],
    },
    { id: 'home-provider', name: 'Home provider', serviceIds: ['home'] },
    { id: 'unknown', name: 'Unknown capability', serviceIds: [] },
  ],
  resources: [{ id: 'room', name: 'Room One' }],
};
const empty = { services: [], staff: [], resources: [] };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function mount() {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onBookingCreated: vi.fn(),
    branchId: 'branch-1',
    branchName: 'Branch One',
  };
  const view = render(<NewBookingModal {...props} />);
  return {
    ...view,
    props,
    change: (next: Partial<typeof props>) => {
      Object.assign(props, next);
      view.rerender(<NewBookingModal {...props} />);
    },
  };
}
const input = (id: string) => document.getElementById(id) as HTMLInputElement;
const change = (id: string, value: string) =>
  fireEvent.change(input(id), { target: { value } });
const close = () => fireEvent.click(screen.getByLabelText('Close modal'));
const mode = (label: string) =>
  fireEvent.click(screen.getByRole('tab', { name: new RegExp(`^${label}`) }));
const ready = () => screen.findByRole('button', { name: /Spa only/ });
beforeEach(() => {
  vi.spyOn(service, 'fetchBranchBookingOptions').mockResolvedValue(options);
  vi.spyOn(service, 'searchBranchCustomers').mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('booking preview selection and availability', () => {
  it.each(['Walk-in', 'Phone', 'Future'])(
    '%s offers only in-spa services',
    async (label) => {
      mount();
      await ready();
      mode(label);
      expect(screen.queryByRole('button', { name: /Home only/ })).toBeNull();
      expect(screen.getByRole('button', { name: /Both modes/ })).toBeDefined();
    },
  );
  it('disables Home Service mode tab with accessible state and explanatory title', async () => {
    mount();
    await ready();
    const homeTab = screen.getByRole('tab', { name: /^Home Service/ });
    expect(homeTab.getAttribute('aria-disabled')).toBe('true');
    expect(homeTab.hasAttribute('disabled')).toBe(true);
    expect(homeTab.getAttribute('title')).toContain(
      'Home Service booking will be enabled after precise address/location support is connected.',
    );
  });
  it('requires explicit capability for every selected service and clears an invalid provider', async () => {
    mount();
    await ready();
    const providers = input('staff-select');
    expect(within(providers).queryByText('Home provider')).toBeNull();
    expect(within(providers).queryByText('Unknown capability')).toBeNull();
    change('staff-select', 'spa-provider');
    fireEvent.click(screen.getByRole('button', { name: /Both modes/ }));
    expect(providers.value).toBe('');
    expect(within(providers).queryByText('Spa provider')).toBeNull();
    expect(within(providers).getByText('All services provider')).toBeDefined();
    change('staff-select', 'all-provider');
    fireEvent.click(screen.getByRole('button', { name: /Spa only/ }));
    expect(providers.value).toBe('all-provider');
  });
  it.each([
    { label: 'Walk-in', modeVal: 'walkin' },
    { label: 'Phone', modeVal: 'phone' },
    { label: 'Future', modeVal: 'standard_future' },
  ])(
    'submits creation in $label mode when valid',
    async ({ label, modeVal }) => {
      const create = vi
        .spyOn(service, 'createBranchBooking')
        .mockResolvedValue({ ok: true, bookingId: 'b-new-1' });
      const view = mount();
      await ready();
      mode(label);
      change('customer-fullname', 'Preview Customer');
      change('customer-phone', '09000000000');
      const button = screen.getByRole('button', {
        name: 'Create Booking',
      }) as HTMLButtonElement;
      expect(button.disabled).toBe(false);
      fireEvent.click(button);

      await waitFor(() => {
        expect(create).toHaveBeenCalledWith(
          expect.objectContaining({
            branchId: 'branch-1',
            fullName: 'Preview Customer',
            phone: '09000000000',
            mode: modeVal,
            paymentReceived: false,
            paymentMethod: undefined,
          }),
        );
        expect(view.props.onBookingCreated).toHaveBeenCalledWith({
          bookingId: 'b-new-1',
          warning: undefined,
        });
        expect(view.props.onClose).toHaveBeenCalledOnce();
      });
    },
  );

  it('handles payment confirmation and requires explicit payment method selection', async () => {
    const create = vi
      .spyOn(service, 'createBranchBooking')
      .mockResolvedValue({ ok: true, bookingId: 'b-paid-1' });
    const view = mount();
    await ready();
    change('customer-fullname', 'Paying Customer');
    change('customer-phone', '09000000000');

    // Payment defaults to false, payment method select is not rendered
    const paymentCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(paymentCheckbox.checked).toBe(false);
    expect(document.getElementById('payment-method-select')).toBeNull();

    // Check payment received
    fireEvent.click(paymentCheckbox);
    expect(paymentCheckbox.checked).toBe(true);

    // Payment method dropdown appears, initially empty
    const methodSelect = input('payment-method-select');
    expect(methodSelect.value).toBe('');

    // Create Booking button is disabled until explicit method is selected
    const createButton = screen.getByRole('button', {
      name: 'Create Booking',
    }) as HTMLButtonElement;
    expect(createButton.disabled).toBe(true);

    // Select valid payment method
    change('payment-method-select', 'gcash');
    expect(createButton.disabled).toBe(false);

    fireEvent.click(createButton);
    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentReceived: true,
          paymentMethod: 'gcash',
        }),
      );
      expect(view.props.onBookingCreated).toHaveBeenCalledWith({
        bookingId: 'b-paid-1',
        warning: undefined,
      });
    });
  });

  it('keeps entered values and surfaces server conflict error', async () => {
    vi.spyOn(service, 'createBranchBooking').mockResolvedValue({
      ok: false,
      code: 'SLOT_UNAVAILABLE',
      error: 'The requested slot is already booked.',
    });
    const view = mount();
    await ready();
    change('customer-fullname', 'Conflict Customer');
    change('customer-phone', '09171234567');
    const button = screen.getByRole('button', {
      name: 'Create Booking',
    }) as HTMLButtonElement;
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('booking-submit-error')).toBeDefined();
      expect(
        screen.getByText(/The requested slot is already booked/),
      ).toBeDefined();
      expect(input('customer-fullname').value).toBe('Conflict Customer');
      expect(input('customer-phone').value).toBe('09171234567');
      expect(view.props.onBookingCreated).not.toHaveBeenCalled();
      expect(view.props.onClose).not.toHaveBeenCalled();
    });
  });
});

describe('dirty state and defaults', () => {
  it.each([
    'customer-fullname',
    'customer-phone',
    'customer-email',
    'booking-notes',
    'booking-date',
    'booking-start-time',
    'staff-select',
    'resource-select',
  ])('tracks and reverts %s exactly', async (id) => {
    const view = mount();
    await ready();
    const original = input(id).value;
    const values: Record<string, string> = {
      'booking-date': '2030-01-02',
      'booking-start-time': original === '12:30' ? '13:30' : '12:30',
      'staff-select': 'spa-provider',
      'resource-select': 'room',
    };
    change(id, values[id] ?? 'test');
    close();
    expect(screen.getByText('Discard unfinished booking?')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Keep Editing' }));
    change(id, original);
    close();
    expect(view.props.onClose).toHaveBeenCalledOnce();
    expect(screen.queryByText('Discard unfinished booking?')).toBeNull();
  });
  it('tracks and reverts mode, payment flag and multi-service selection', async () => {
    const view = mount();
    await ready();
    for (const [edit, revert] of [
      [() => mode('Phone'), () => mode('Walk-in')],
      [
        () => fireEvent.click(screen.getByRole('checkbox')),
        () => fireEvent.click(screen.getByRole('checkbox')),
      ],
      [
        () =>
          fireEvent.click(screen.getByRole('button', { name: /Both modes/ })),
        () =>
          fireEvent.click(screen.getByRole('button', { name: /Both modes/ })),
      ],
    ]) {
      edit();
      close();
      expect(screen.getByText('Discard unfinished booking?')).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: 'Keep Editing' }));
      revert();
    }
    close();
    expect(view.props.onClose).toHaveBeenCalledOnce();
  });
  it('treats whitespace as an edit and closes a genuinely pristine form directly', async () => {
    const view = mount();
    await ready();
    change('booking-notes', ' ');
    close();
    expect(view.props.onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep Editing' }));
    change('booking-notes', '');
    close();
    expect(view.props.onClose).toHaveBeenCalledOnce();
  });
});

describe('option failures and modal lifecycle', () => {
  it('shows successful empty services/providers/resources distinctly', async () => {
    vi.mocked(service.fetchBranchBookingOptions).mockResolvedValue(empty);
    mount();
    await screen.findByText('No eligible services for this branch and mode.');
    expect(
      screen.getByText('No eligible providers for the selected services.'),
    ).toBeDefined();
    expect(
      screen.getByText('No active resources for this branch.'),
    ).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it.each(['services', 'staff', 'resources', 'booking rules'])(
    'shows %s failure, then clears it on reopen',
    async (part) => {
      vi.mocked(service.fetchBranchBookingOptions).mockRejectedValueOnce(
        new Error(`Failed to load branch ${part}`),
      );
      const view = mount();
      await screen.findByRole('alert');
      expect(screen.getByText('Service options unavailable.')).toBeDefined();
      expect(screen.getByText('Provider options unavailable.')).toBeDefined();
      expect(screen.getByText('Resource options unavailable.')).toBeDefined();
      expect(
        screen.queryByText('No active resources for this branch.'),
      ).toBeNull();
      view.change({ isOpen: false });
      view.change({ isOpen: true });
      await ready();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(service.fetchBranchBookingOptions).toHaveBeenCalledTimes(2);
    },
  );
  it('resets all fields, mode, selection and discard state when reopened on the same branch', async () => {
    const view = mount();
    await ready();
    const originalDate = input('booking-date').value;
    const originalTime = input('booking-start-time').value;
    change('customer-fullname', 'Changed');
    change('customer-phone', '1');
    change('customer-email', 'changed@example.test');
    change('customer-search-input', 'x');
    change('staff-select', 'spa-provider');
    change('resource-select', 'room');
    change('booking-date', '2030-01-01');
    change('booking-start-time', '01:00');
    change('booking-notes', 'Changed');
    fireEvent.click(screen.getByRole('checkbox'));
    change('payment-method-select', 'gcash');
    close();
    view.change({ isOpen: false });
    view.change({ isOpen: true });
    await ready();
    for (const id of [
      'customer-fullname',
      'customer-phone',
      'customer-email',
      'booking-notes',
      'staff-select',
      'resource-select',
    ])
      expect(input(id).value).toBe('');
    expect(input('booking-date').value).toBe(originalDate);
    expect(input('booking-start-time').value).toBe(originalTime);
    expect(document.getElementById('payment-method-select')).toBeNull();
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(
      false,
    );
    expect(screen.queryByText('Discard unfinished booking?')).toBeNull();
    close();
    expect(view.props.onClose).toHaveBeenCalledOnce();
  });
  it.each(['resolve', 'reject'] as const)(
    'ignores late options %s from a previous branch',
    async (outcome) => {
      const old = deferred<typeof options>();
      vi.mocked(service.fetchBranchBookingOptions)
        .mockReturnValueOnce(old.promise)
        .mockResolvedValueOnce(empty);
      const view = mount();
      change('customer-fullname', 'Old branch');
      view.change({ branchId: 'branch-2', branchName: 'Branch Two' });
      expect(input('customer-fullname').value).toBe('');
      await screen.findByText('No active resources for this branch.');
      await act(async () => {
        if (outcome === 'resolve') old.resolve(options);
        else old.reject(new Error('Old branch failure'));
      });
      expect(screen.queryByRole('button', { name: /Spa only/ })).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
    },
  );
  it('removes loaded old branch options immediately while new branch loads', async () => {
    const next = deferred<typeof options>();
    const view = mount();
    await ready();
    change('staff-select', 'spa-provider');
    vi.mocked(service.fetchBranchBookingOptions).mockReturnValueOnce(
      next.promise,
    );
    view.change({ branchId: 'branch-2' });
    expect(screen.queryByRole('button', { name: /Spa only/ })).toBeNull();
    expect(input('staff-select').value).toBe('');
    expect(screen.getByText('Loading services...')).toBeDefined();
    await act(async () => next.resolve(empty));
  });
  it('ignores pending options from an earlier opening of the same branch', async () => {
    const old = deferred<typeof options>();
    vi.mocked(service.fetchBranchBookingOptions)
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(empty);
    const view = mount();
    view.change({ isOpen: false });
    view.change({ isOpen: true });
    await screen.findByText('No active resources for this branch.');
    await act(async () => old.resolve(options));
    expect(screen.queryByRole('button', { name: /Spa only/ })).toBeNull();
  });
});

describe('isolated mocked lookup lifecycle (not an enabled production read)', () => {
  beforeEach(() => {
    // Keep the pre-existing async safeguards covered with isolated responses.
    // The production reason is fixed and the real helper always rejects.
    vi.spyOn(service, 'getCustomerLookupUnavailableReason').mockReturnValue(
      null,
    );
  });
  const customer: BookingCustomer = {
    id: 'customer',
    full_name: 'Latest Customer',
    phone: '09000000000',
    email: null,
  };
  it('distinguishes failure from a successful empty search and clears error on a new query', async () => {
    vi.mocked(service.searchBranchCustomers)
      .mockRejectedValueOnce(new Error('Denied'))
      .mockResolvedValueOnce([]);
    mount();
    await ready();
    change('customer-search-input', 'First');
    await screen.findByText('Customer search unavailable. Please try again.');
    expect(screen.queryByText('No matching customers.')).toBeNull();
    change('customer-search-input', 'Second');
    expect(screen.queryByRole('alert')).toBeNull();
    await screen.findByText('No matching customers.');
  });
  it.each(['resolve', 'reject'] as const)(
    'ignores an older query %s after a newer query completes',
    async (outcome) => {
      const old = deferred<BookingCustomer[]>();
      vi.mocked(service.searchBranchCustomers)
        .mockReturnValueOnce(old.promise)
        .mockResolvedValueOnce([customer]);
      mount();
      await ready();
      change('customer-search-input', 'Old');
      await waitFor(() =>
        expect(service.searchBranchCustomers).toHaveBeenCalledTimes(1),
      );
      change('customer-search-input', 'Latest');
      await screen.findByRole('button', { name: /Latest Customer/ });
      await act(async () => {
        if (outcome === 'resolve') old.resolve([]);
        else old.reject(new Error('Old failure'));
      });
      expect(
        screen.getByRole('button', { name: /Latest Customer/ }),
      ).toBeDefined();
      expect(screen.queryByRole('alert')).toBeNull();
    },
  );
  it.each(['clear', 'close', 'branch'] as const)(
    'invalidates pending search on %s',
    async (action) => {
      const old = deferred<BookingCustomer[]>();
      vi.mocked(service.searchBranchCustomers).mockReturnValueOnce(old.promise);
      const view = mount();
      await ready();
      change('customer-search-input', 'Old');
      await waitFor(() =>
        expect(service.searchBranchCustomers).toHaveBeenCalledOnce(),
      );
      if (action === 'clear') change('customer-search-input', '');
      if (action === 'close') {
        view.change({ isOpen: false });
        view.change({ isOpen: true });
        await ready();
      }
      if (action === 'branch') {
        view.change({ branchId: 'branch-2' });
        await ready();
      }
      await act(async () => old.resolve([customer]));
      expect(
        screen.queryByRole('button', { name: /Latest Customer/ }),
      ).toBeNull();
      expect(screen.queryByText('Searching...')).toBeNull();
    },
  );
  it('renders a boundary rejection as unavailable rather than error or empty', async () => {
    vi.mocked(service.searchBranchCustomers).mockRejectedValue(
      new service.CustomerLookupUnavailableError(),
    );
    mount();
    await ready();
    change('customer-search-input', 'Lookup');
    await screen.findByText(
      'Customer lookup is unavailable until a branch-scoped hosted read boundary is available.',
    );
    expect(input('customer-search-input').disabled).toBe(true);
    expect(screen.queryByText('No matching customers.')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it.each(['results', 'error', 'selection'])(
    'clears old-branch %s on branch change',
    async (state) => {
      const view = mount();
      await ready();
      if (state === 'error')
        vi.mocked(service.searchBranchCustomers).mockRejectedValueOnce(
          new Error('Denied'),
        );
      else
        vi.mocked(service.searchBranchCustomers).mockResolvedValueOnce([
          customer,
        ]);
      change('customer-search-input', 'Latest');
      if (state === 'error') await screen.findByRole('alert');
      else {
        const result = await screen.findByRole('button', {
          name: /Latest Customer/,
        });
        if (state === 'selection') fireEvent.click(result);
      }
      view.change({ branchId: 'branch-2' });
      await ready();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(
        screen.queryByRole('button', { name: /Latest Customer/ }),
      ).toBeNull();
      expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
      expect(input('customer-search-input').value).toBe('');
      expect(input('customer-fullname').value).toBe('');
    },
  );
  it('tracks selected customer and clears its state on clear and reopen', async () => {
    vi.mocked(service.searchBranchCustomers).mockResolvedValue([customer]);
    const view = mount();
    await ready();
    change('customer-search-input', 'Latest');
    fireEvent.click(
      await screen.findByRole('button', { name: /Latest Customer/ }),
    );
    expect(input('customer-fullname').value).toBe(customer.full_name);
    close();
    expect(view.props.onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep Editing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    close();
    expect(view.props.onClose).toHaveBeenCalledOnce();
    view.change({ isOpen: false });
    view.change({ isOpen: true });
    await ready();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });
});

describe('customer lookup unavailable UI', () => {
  it.each(['branch-1', 'branch-2'])(
    'never starts a lookup or exposes another branch customer in %s',
    async (branchId) => {
      vi.mocked(service.searchBranchCustomers).mockResolvedValue([
        {
          id: 'customer-c',
          full_name: 'Other branch customer',
          phone: null,
          email: null,
        },
      ]);
      const view = mount();
      view.change({ branchId });
      await ready();
      expect(input('customer-search-input').disabled).toBe(true);
      expect(
        screen.getByText(service.getCustomerLookupUnavailableReason()!),
      ).toBeDefined();
      // Even a synthetic change event cannot bypass the unavailable UI guard.
      change('customer-search-input', 'Other branch');
      expect(service.searchBranchCustomers).not.toHaveBeenCalled();
      expect(screen.queryByText('Searching...')).toBeNull();
      expect(screen.queryByText('No matching customers.')).toBeNull();
      expect(screen.queryByText('Other branch customer')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      change('customer-fullname', 'Manual preview');
      expect(input('customer-fullname').value).toBe('Manual preview');
      expect(
        (
          screen.getByRole('button', {
            name: 'Create Booking',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    },
  );
  it('stays unavailable after close/reopen and branch change, with clean manual fields', async () => {
    const view = mount();
    await ready();
    change('customer-fullname', 'Manual preview');
    view.change({ isOpen: false });
    view.change({ isOpen: true, branchId: 'branch-2' });
    await ready();
    expect(input('customer-search-input').disabled).toBe(true);
    expect(input('customer-fullname').value).toBe('');
    expect(input('customer-search-input').value).toBe('');
    expect(service.searchBranchCustomers).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });
});
