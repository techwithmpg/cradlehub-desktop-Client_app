import { useState } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Booking } from '../src/types/bookings';
import type { AuthContext } from '../src/types/auth';
import { BookingsView } from '../src/components/bookings/BookingsView';
import {
  WorkspaceLifecycleProvider,
  WorkspaceModulePresence,
  useWorkspaceInvalidation,
} from '../src/components/workspace';
import * as bookingsService from '../src/lib/bookings-service';
import { clearInFlightOperationsForTests } from '../src/lib/single-flight';

const authContext: AuthContext = {
  userId: 'user-01',
  email: 'crm@example.com',
  staffId: 'staff-01',
  fullName: 'CRM Operator',
  canonicalRole: 'crm',
  rawRole: 'crm',
  branchId: 'branch-main',
  branchName: 'Main Spa',
  isCrmEligible: true,
};

function createBooking(id: string, customerName: string): Booking {
  return {
    id,
    branch_id: 'branch-main',
    booking_date: '2026-10-15',
    start_time: '10:00:00',
    end_time: '11:00:00',
    status: 'confirmed',
    type: 'walkin',
    delivery_type: 'in_spa',
    amount_paid: 0,
    payment_method: 'pay_on_site',
    payment_status: 'pending',
    payment_reference: null,
    resource_id: 'room-1',
    staff_id: 'staff-1',
    customer_id: `customer-${id}`,
    service_id: 'service-1',
    travel_buffer_mins: 0,
    metadata: null,
    created_at: '2026-10-15T00:00:00Z',
    updated_at: '2026-10-15T00:00:00Z',
    customer: {
      id: `customer-${id}`,
      full_name: customerName,
      phone: '09170000000',
      email: null,
    },
    service: {
      id: 'service-1',
      name: 'Swedish Massage',
      duration_minutes: 60,
      price: 700,
    },
    staff: {
      id: 'staff-1',
      full_name: 'Therapist One',
      nickname: null,
      tier: undefined,
    },
    resource: {
      id: 'room-1',
      name: 'Room 1',
      type: 'room',
    },
  };
}

function LifecycleHarness() {
  const [isActive, setIsActive] = useState(true);
  const invalidate = useWorkspaceInvalidation();

  return (
    <>
      <button type="button" onClick={() => setIsActive(false)}>
        Hide Bookings
      </button>

      <button type="button" onClick={() => invalidate(['bookings'])}>
        Dirty Bookings
      </button>

      <button type="button" onClick={() => setIsActive(true)}>
        Show Bookings
      </button>

      <WorkspaceModulePresence moduleId="bookings" isActive={isActive}>
        <div hidden={!isActive}>
          <BookingsView authContext={authContext} />
        </div>
      </WorkspaceModulePresence>
    </>
  );
}

describe('Bookings retained workspace lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearInFlightOperationsForTests();
  });

  it('keeps validated data while hidden and refreshes only when reactivated', async () => {
    const initialBooking = createBooking('booking-old', 'Existing Customer');
    const refreshedBooking = createBooking(
      'booking-new',
      'Authoritative Customer',
    );

    let resolveRefresh!: (value: Booking[]) => void;

    const fetchSpy = vi
      .spyOn(bookingsService, 'fetchBranchBookings')
      .mockResolvedValueOnce([initialBooking])
      .mockImplementationOnce(
        () =>
          new Promise<Booking[]>((resolve) => {
            resolveRefresh = resolve;
          }),
      );

    render(
      <WorkspaceLifecycleProvider>
        <LifecycleHarness />
      </WorkspaceLifecycleProvider>,
    );

    await screen.findAllByText('Existing Customer');

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Hide Bookings' }));

    fireEvent.click(screen.getByRole('button', { name: 'Dirty Bookings' }));

    // Dirty hidden workspaces do not consume network resources.
    await Promise.resolve();

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Show Bookings' }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    // Existing validated content remains usable while authority refreshes.
    expect(screen.getAllByText('Existing Customer').length).toBeGreaterThan(0);

    await act(async () => {
      resolveRefresh([refreshedBooking]);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(
        screen.getAllByText('Authoritative Customer').length,
      ).toBeGreaterThan(0);
    });
  });
});
