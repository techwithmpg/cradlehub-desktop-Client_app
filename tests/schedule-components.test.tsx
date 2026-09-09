import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanonicalShell } from '../src/components/CanonicalShell';
import { ScheduleView } from '../src/components/schedule/ScheduleView';
import { ScheduleActionModal } from '../src/components/schedule/ScheduleActionModal';
import * as scheduleService from '../src/lib/schedule-service';
import type { AuthContext } from '../src/types/auth';
import type {
  DailyScheduleResponse,
  ScheduleAvailabilityItem,
  ScheduleStaffRow,
  ScheduleWeekDay,
  StaffFullScheduleResponse,
} from '../src/types/schedule';

// Stage 06B Schedule component/action boundary

const mockAuthContext: AuthContext = {
  userId: 'user-1',
  email: 'operator@cradlehub.test',
  staffId: 'operator-staff-1',
  fullName: 'Test Operator',
  canonicalRole: 'crm',
  rawRole: 'crm',
  branchId: 'branch-1',
  branchName: 'Cradle Main Spa',
  isCrmEligible: true,
};

function localDateString(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-1',
    date: localDateString(),
    start_time: '23:00',
    end_time: '23:50',
    status: 'confirmed',
    customer: 'Maria Santos',
    service: 'Swedish Massage',
    customer_name: 'Maria Santos',
    service_name: 'Swedish Massage',
    resource_id: 'room-1',
    resource_name: 'Massage Room Alpha',
    resource_type: 'massage_room',
    resource_capacity: 1,
    ...overrides,
  };
}

function staffRow(overrides: Record<string, unknown> = {}): ScheduleStaffRow {
  return {
    staff_id: 'staff-1',
    staff_name: 'Alice Therapist',
    staff_tier: 'senior',
    work_start: '09:00',
    work_end: '18:00',
    current_override: null,
    schedule_source: 'weekly',
    schedule_status: 'scheduled',
    schedule_state: 'scheduled',
    schedule_is_day_off: false,
    schedule_windows: [
      {
        startTime: '09:00',
        endTime: '18:00',
      },
    ],
    schedule_conflict_code: null,
    schedule_conflict_reason: null,
    bookings: [],
    blocks: [],
    attendance_presence: null,
    ...overrides,
  } as unknown as ScheduleStaffRow;
}

function defaultStaffRows(): ScheduleStaffRow[] {
  return [
    staffRow({
      staff_id: 'staff-1',
      staff_name: 'Alice Therapist',
      attendance_presence: {
        state: 'checked_in',
      },
      bookings: [booking()],
      blocks: [
        {
          id: 'block-1',
          date: localDateString(),
          block_date: localDateString(),
          start_time: '14:00',
          end_time: '14:30',
          reason: 'training',
        },
      ],
      schedule_conflict_code: 'BOOKING_OVERLAP',
      schedule_conflict_reason: 'Booking overlaps blocked training time.',
    }),
    staffRow({
      staff_id: 'staff-2',
      staff_name: 'Ben Driver',
      work_start: '10:00',
      work_end: '19:00',
      schedule_windows: [
        {
          startTime: '10:00',
          endTime: '19:00',
        },
      ],
    }),
    staffRow({
      staff_id: 'staff-3',
      staff_name: 'Cara Front Desk',
      work_start: null,
      work_end: null,
      schedule_status: 'day_off',
      schedule_source: 'override',
      schedule_is_day_off: true,
      schedule_windows: [],
      current_override: {
        id: 'override-dayoff-1',
        override_date: localDateString(),
        date: localDateString(),
        is_day_off: true,
        shift_type: 'day_off',
        start_time: null,
        end_time: null,
        reason: 'Approved leave',
      },
    }),
    staffRow({
      staff_id: 'staff-4',
      staff_name: 'Dana Therapist',
      work_start: null,
      work_end: null,
      schedule_status: 'missing',
      schedule_source: 'none',
      schedule_windows: [],
    }),
  ];
}

function dailyResponse(
  overrides: Partial<DailyScheduleResponse> = {},
): DailyScheduleResponse {
  const rows = overrides.staffRows ?? defaultStaffRows();

  return {
    ok: true,
    branchId: 'branch-server-resolved',
    date: localDateString(),
    staffRows: rows,
    stats: {
      total: rows.reduce((total, row) => total + row.bookings.length, 0),
      pending: 0,
      confirmed: rows.reduce((total, row) => total + row.bookings.length, 0),
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    },
    schedulingRules: {},
    ...overrides,
  };
}

function availabilityItem(
  staffId: string,
  fullName: string,
  staffType: string,
  overrides: Record<string, unknown> = {},
): ScheduleAvailabilityItem {
  return {
    staff: {
      id: staffId,
      full_name: fullName,
      nickname: null,
      avatar_url: null,
      tier: null,
      staff_type: staffType,
      system_role: 'staff',
      is_head: false,
      is_active: true,
    },
    schedules:
      staffId === 'staff-3' || staffId === 'staff-4'
        ? []
        : [
            {
              id: `weekly-${staffId}`,
              day_of_week: 1,
              start_time: '09:00',
              end_time: '18:00',
              is_active: true,
              shift_type: 'single',
              window_order: 0,
              ends_next_day: false,
              created_at: null,
            },
          ],
    overrides:
      staffId === 'staff-3'
        ? [
            {
              id: 'override-availability-1',
              override_date: localDateString(),
              is_day_off: true,
              shift_type: 'single',
              start_time: null,
              end_time: null,
              reason: 'Approved leave',
            },
          ]
        : [],
    blockedTimes: [],
    ...overrides,
  } as unknown as ScheduleAvailabilityItem;
}

function availabilityItems(): ScheduleAvailabilityItem[] {
  return [
    availabilityItem('staff-1', 'Alice Therapist', 'therapist'),
    availabilityItem('staff-2', 'Ben Driver', 'driver'),
    availabilityItem('staff-3', 'Cara Front Desk', 'csr'),
    availabilityItem('staff-4', 'Dana Therapist', 'therapist'),
  ];
}

function weekResponse(): ScheduleWeekDay[] {
  const anchor = localDateString();

  return Array.from({ length: 7 }, (_, index) => ({
    date: scheduleService.addDays(anchor, index),
    data: dailyResponse({
      date: scheduleService.addDays(anchor, index),
    }),
  }));
}

function fullScheduleResponse(): StaffFullScheduleResponse {
  return {
    ok: true,
    branchId: 'branch-server-resolved',
    staffId: 'staff-1',
    startDate: '2026-08-26',
    endDate: '2026-09-23',
    data: {
      staff: {
        id: 'staff-1',
        full_name: 'Alice Therapist',
        nickname: null,
        avatar_url: null,
        staff_type: 'therapist',
        system_role: 'staff',
        branch_name: 'Cradle Main Spa',
      },
      schedules: [
        {
          id: 'full-weekly-1',
          day_of_week: 1,
          start_time: '09:00',
          end_time: '18:00',
          is_active: true,
          shift_type: 'single',
          window_order: 0,
          ends_next_day: false,
        },
      ],
      custom_overrides: [
        {
          id: 'full-override-1',
          date: '2026-09-10',
          override_date: '2026-09-10',
          is_day_off: false,
          shift_type: 'single',
          start_time: '10:00',
          end_time: '17:00',
          reason: 'Late start',
        },
      ],
      blocked_times: [
        {
          id: 'full-block-1',
          date: '2026-09-11',
          block_date: '2026-09-11',
          start_time: '13:00',
          end_time: '14:00',
          reason: 'training',
        },
      ],
      bookings: [
        {
          id: 'full-booking-1',
          date: '2026-09-12',
          start_time: '15:00',
          end_time: '16:00',
          service_name: 'Deep Tissue Massage',
          customer_name: 'Juan Dela Cruz',
        },
      ],
    },
  } as unknown as StaffFullScheduleResponse;
}

function mutationSuccess(action: string) {
  if (action === 'create_blocked_time') {
    return {
      ok: true,
      message: 'Block time saved.',
      block: {
        id: 'created-block-1',
        block_date: localDateString(),
        start_time: '12:00',
        end_time: '13:00',
        reason: 'break',
      },
    };
  }

  return {
    ok: true,
    message: 'Day override saved.',
    override: {
      id: 'created-override-1',
      override_date: localDateString(),
      is_day_off: false,
      shift_type: 'single',
      start_time: '09:00',
      end_time: '18:00',
      reason: null,
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

function selectedStaff(): ScheduleStaffRow {
  return defaultStaffRows()[0];
}

describe('Stage 06B Schedule component/action boundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(scheduleService, 'fetchDailySchedule').mockResolvedValue(
      dailyResponse(),
    );

    vi.spyOn(scheduleService, 'fetchScheduleAvailability').mockResolvedValue({
      ok: true,
      branchId: 'branch-server-resolved',
      items: availabilityItems(),
    });

    vi.spyOn(scheduleService, 'fetchScheduleWeek').mockResolvedValue(
      weekResponse(),
    );

    vi.spyOn(scheduleService, 'fetchStaffFullSchedule').mockResolvedValue(
      fullScheduleResponse(),
    );

    vi.spyOn(scheduleService, 'mutateSchedule').mockImplementation(
      async (action) => {
        return mutationSuccess(action) as never;
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('mounts Schedule through CanonicalShell', async () => {
    render(
      <CanonicalShell
        authContext={mockAuthContext}
        onSignOut={async () => {}}
        isSigningOut={false}
        signOutError={null}
      />,
    );

    fireEvent.click(screen.getByTestId('nav-item-schedule'));

    await waitFor(() => {
      expect(screen.getByTestId('schedule-view')).toBeDefined();
    });

    expect(screen.getByTestId('schedule-header')).toBeDefined();
  });

  it('renders truthful loading state while authoritative day data is pending', () => {
    vi.spyOn(scheduleService, 'fetchDailySchedule').mockReturnValue(
      new Promise(() => {}),
    );

    render(<ScheduleView authContext={mockAuthContext} />);

    expect(screen.getByTestId('schedule-loading')).toBeDefined();
    expect(screen.getByLabelText('Loading branch schedule')).toBeDefined();
  });

  it('renders the authoritative empty state when no staff rows are returned', async () => {
    vi.spyOn(scheduleService, 'fetchDailySchedule').mockResolvedValue(
      dailyResponse({
        staffRows: [],
        stats: {
          total: 0,
          pending: 0,
          confirmed: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          no_show: 0,
        },
      }),
    );

    render(<ScheduleView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('schedule-empty-body')).toBeDefined();
    });

    expect(screen.getByText('No schedule rows match this view')).toBeDefined();
  });

  it('renders hosted Schedule failures without fabricating data', async () => {
    vi.spyOn(scheduleService, 'fetchDailySchedule').mockRejectedValue(
      new Error('Schedule requires a connection.'),
    );

    render(<ScheduleView authContext={mockAuthContext} />);

    await waitFor(() => {
      expect(screen.getByTestId('schedule-error')).toBeDefined();
    });

    expect(screen.getByText('Schedule requires a connection.')).toBeDefined();

    expect(screen.queryByTestId('schedule-day-board')).toBeNull();
  });

  it('renders real staff rows, KPI truth, role tabs, state pills, and conflict indicators', async () => {
    render(<ScheduleView authContext={mockAuthContext} />);

    await screen.findByTestId('schedule-day-board');

    expect(screen.getByTestId('schedule-row-staff-1')).toBeDefined();
    expect(screen.getByTestId('schedule-row-staff-2')).toBeDefined();
    expect(screen.getByTestId('schedule-row-staff-3')).toBeDefined();
    expect(screen.getByTestId('schedule-row-staff-4')).toBeDefined();

    expect(screen.getByRole('tab', { name: /All Staff/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Therapists/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Drivers/i })).toBeDefined();
    expect(
      screen.getByRole('tab', { name: /CRM \/ Front Desk/i }),
    ).toBeDefined();

    expect(screen.queryByRole('tab', { name: /Managers/i })).toBeNull();

    expect(screen.getByRole('button', { name: /^On Duty/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Scheduled/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Day Off/i })).toBeDefined();
    expect(
      screen.getByRole('button', { name: /^Not Assigned/i }),
    ).toBeDefined();

    expect(
      screen.getAllByLabelText('Schedule conflict').length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText('Booking overlaps blocked training time.').length,
    ).toBeGreaterThan(0);
  });

  it('filters by populated role groups and authoritative staff state', async () => {
    render(<ScheduleView authContext={mockAuthContext} />);

    await screen.findByTestId('schedule-day-board');

    fireEvent.click(screen.getByRole('tab', { name: /Drivers/i }));

    expect(screen.getByTestId('schedule-row-staff-2')).toBeDefined();
    expect(screen.queryByTestId('schedule-row-staff-1')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: /All Staff/i }));

    fireEvent.click(screen.getByRole('button', { name: /^Not Assigned/i }));

    expect(screen.getByTestId('schedule-row-staff-4')).toBeDefined();

    expect(screen.queryByTestId('schedule-row-staff-1')).toBeNull();
  });

  it('searches staff and booking customer, service, and resource truth', async () => {
    render(<ScheduleView authContext={mockAuthContext} />);

    await screen.findByTestId('schedule-day-board');

    const search = screen.getByLabelText('Search staff or appointment');

    fireEvent.change(search, {
      target: { value: 'Ben Driver' },
    });

    expect(screen.getByTestId('schedule-row-staff-2')).toBeDefined();

    expect(screen.queryByTestId('schedule-row-staff-1')).toBeNull();

    for (const query of [
      'Maria Santos',
      'Swedish Massage',
      'Massage Room Alpha',
    ]) {
      fireEvent.change(search, {
        target: { value: query },
      });

      expect(screen.getByTestId('schedule-row-staff-1')).toBeDefined();

      expect(screen.queryByTestId('schedule-row-staff-2')).toBeNull();
    }
  });

  it('updates the inspector when a different staff button is selected', async () => {
    render(<ScheduleView authContext={mockAuthContext} />);

    await screen.findByTestId('schedule-day-board');

    const inspector = screen.getByTestId('schedule-inspector');

    expect(within(inspector).getByText('Alice Therapist')).toBeDefined();

    const benRow = screen.getByTestId('schedule-row-staff-2');
    fireEvent.click(within(benRow).getByRole('button'));

    expect(within(inspector).getByText('Ben Driver')).toBeDefined();

    expect(within(inspector).queryByText('Alice Therapist')).toBeNull();
  });

  it('supports keyboard activation of native staff selector buttons', async () => {
    const user = userEvent.setup();

    render(<ScheduleView authContext={mockAuthContext} />);

    await screen.findByTestId('schedule-day-board');

    const benRow = screen.getByTestId('schedule-row-staff-2');
    const benButton = within(benRow).getByRole('button');

    benButton.focus();
    expect(document.activeElement).toBe(benButton);

    await user.keyboard('{Enter}');

    expect(
      within(screen.getByTestId('schedule-inspector')).getByText('Ben Driver'),
    ).toBeDefined();
  });

  it('renders Staff and Rooms inspector tabs using only returned booking resources', async () => {
    render(<ScheduleView authContext={mockAuthContext} />);

    await screen.findByTestId('schedule-inspector');

    const inspector = screen.getByTestId('schedule-inspector');

    expect(within(inspector).getByRole('tab', { name: 'Staff' })).toBeDefined();

    fireEvent.click(within(inspector).getByRole('tab', { name: 'Rooms' }));

    expect(within(inspector).getByText('Massage Room Alpha')).toBeDefined();

    expect(within(inspector).getByText('Swedish Massage')).toBeDefined();

    expect(within(inspector).queryByText('Unreturned Room')).toBeNull();
  });

  it('derives Next Booking from the selected staff real booking data', async () => {
    render(<ScheduleView authContext={mockAuthContext} />);

    await screen.findByTestId('schedule-inspector');

    const inspector = screen.getByTestId('schedule-inspector');

    expect(within(inspector).getByText('Next Booking')).toBeDefined();

    expect(within(inspector).getByText('Swedish Massage')).toBeDefined();

    expect(within(inspector).getByText('Maria Santos')).toBeDefined();

    expect(within(inspector).getByText(/Massage Room Alpha/)).toBeDefined();
  });

  it('lazy-loads Week mode only after Week is selected', async () => {
    const weekSpy = vi.spyOn(scheduleService, 'fetchScheduleWeek');

    render(<ScheduleView authContext={mockAuthContext} />);

    await screen.findByTestId('schedule-day-board');

    expect(weekSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('tab', { name: 'Week' }));

    await waitFor(() => {
      expect(weekSpy).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId('schedule-week-board')).toBeDefined();
    });
  });

  it('opens selected-staff Availability from the inspector using loaded authoritative availability', async () => {
    render(<ScheduleView authContext={mockAuthContext} />);

    await screen.findByTestId('schedule-inspector');

    fireEvent.click(
      within(screen.getByTestId('schedule-inspector')).getByRole('button', {
        name: 'Availability',
      }),
    );

    expect(screen.getByTestId('schedule-action-availability')).toBeDefined();

    const availabilityDialog = screen.getByTestId(
      'schedule-action-availability',
    );

    expect(
      within(availabilityDialog).getByText('Weekly availability'),
    ).toBeDefined();

    expect(within(availabilityDialog).getByText('Monday')).toBeDefined();

    expect(within(availabilityDialog).getByText(/9:00.*6:00/i)).toBeDefined();
  });

  it('closes a Schedule action dialog with Escape when no save is pending', () => {
    const onClose = vi.fn();

    render(
      <ScheduleActionModal
        isOpen={true}
        kind="availability"
        onClose={onClose}
        branchId="branch-1"
        selectedDate="2026-09-09"
        staff={selectedStaff()}
        availability={availabilityItems()[0]}
        onSaved={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, {
      key: 'Escape',
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Adjust Schedule pending, blocks Escape, then closes only after real success and onSaved', async () => {
    const pending = deferred<unknown>();

    vi.spyOn(scheduleService, 'mutateSchedule').mockReturnValue(
      pending.promise as never,
    );

    const onClose = vi.fn();
    const onSaved = vi.fn().mockResolvedValue(undefined);

    render(
      <ScheduleActionModal
        isOpen={true}
        kind="adjust"
        onClose={onClose}
        branchId="branch-1"
        selectedDate="2026-09-09"
        staff={selectedStaff()}
        availability={availabilityItems()[0]}
        onSaved={onSaved}
      />,
    );

    const save = screen.getByRole('button', {
      name: 'Save override',
    });

    fireEvent.click(save);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saving…' })).toBeDefined();
    });

    expect(
      (
        screen.getByRole('button', {
          name: 'Saving…',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    fireEvent.keyDown(window, {
      key: 'Escape',
    });

    expect(onClose).not.toHaveBeenCalled();

    pending.resolve(mutationSuccess('upsert_override'));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    expect(scheduleService.mutateSchedule).toHaveBeenCalledWith(
      'upsert_override',
      expect.objectContaining({
        branchId: 'branch-1',
        staffId: 'staff-1',
        overrideDate: '2026-09-09',
        isDayOff: false,
        shiftType: 'single',
        startTime: '09:00',
        endTime: '18:00',
      }),
    );
  });

  it('shows Adjust Schedule hosted failure and does not close or simulate success', async () => {
    vi.spyOn(scheduleService, 'mutateSchedule').mockResolvedValue({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'You do not have permission to update this schedule.',
    });

    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(
      <ScheduleActionModal
        isOpen={true}
        kind="adjust"
        onClose={onClose}
        branchId="branch-1"
        selectedDate="2026-09-09"
        staff={selectedStaff()}
        availability={availabilityItems()[0]}
        onSaved={onSaved}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Save override',
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        'You do not have permission to update this schedule.',
      );
    });

    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    expect(screen.getByTestId('schedule-action-adjust')).toBeDefined();
  });

  it('keeps Block Time pending and closes only after real success', async () => {
    const pending = deferred<unknown>();

    vi.spyOn(scheduleService, 'mutateSchedule').mockReturnValue(
      pending.promise as never,
    );

    const onClose = vi.fn();
    const onSaved = vi.fn().mockResolvedValue(undefined);

    render(
      <ScheduleActionModal
        isOpen={true}
        kind="block"
        onClose={onClose}
        branchId="branch-1"
        selectedDate="2026-09-09"
        staff={selectedStaff()}
        availability={availabilityItems()[0]}
        onSaved={onSaved}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Add blocked time',
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saving…' })).toBeDefined();
    });

    expect(onClose).not.toHaveBeenCalled();

    pending.resolve(mutationSuccess('create_blocked_time'));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    expect(scheduleService.mutateSchedule).toHaveBeenCalledWith(
      'create_blocked_time',
      {
        branchId: 'branch-1',
        staffId: 'staff-1',
        blockDate: '2026-09-09',
        startTime: '12:00',
        endTime: '13:00',
        reason: 'break',
      },
    );
  });

  it('shows Block Time hosted failure and keeps the dialog open', async () => {
    vi.spyOn(scheduleService, 'mutateSchedule').mockResolvedValue({
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Blocked time is not valid.',
    });

    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(
      <ScheduleActionModal
        isOpen={true}
        kind="block"
        onClose={onClose}
        branchId="branch-1"
        selectedDate="2026-09-09"
        staff={selectedStaff()}
        availability={availabilityItems()[0]}
        onSaved={onSaved}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Add blocked time',
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        'Blocked time is not valid.',
      );
    });

    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    expect(screen.getByTestId('schedule-action-block')).toBeDefined();
  });

  it('loads and renders authoritative Full Schedule windows, overrides, blocks, and booking history', async () => {
    const fullSpy = vi.spyOn(scheduleService, 'fetchStaffFullSchedule');

    render(
      <ScheduleActionModal
        isOpen={true}
        kind="full"
        onClose={vi.fn()}
        branchId="branch-1"
        selectedDate="2026-09-09"
        staff={selectedStaff()}
        availability={availabilityItems()[0]}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText('Loading full schedule…')).toBeDefined();

    await waitFor(() => {
      expect(fullSpy).toHaveBeenCalledWith(
        'staff-1',
        '2026-08-26',
        '2026-09-23',
      );
    });

    await screen.findByText('Weekly schedule');

    expect(screen.getByText('Late start')).toBeDefined();
    expect(screen.getByText('training')).toBeDefined();
    expect(
      screen.getByText(/Deep Tissue Massage.*Juan Dela Cruz/i),
    ).toBeDefined();
  });

  it('refreshes authoritative day and availability data before closing after an inspector mutation succeeds', async () => {
    const dailySpy = vi.spyOn(scheduleService, 'fetchDailySchedule');

    const availabilitySpy = vi.spyOn(
      scheduleService,
      'fetchScheduleAvailability',
    );

    vi.spyOn(scheduleService, 'mutateSchedule').mockResolvedValue(
      mutationSuccess('upsert_override') as never,
    );

    render(<ScheduleView authContext={mockAuthContext} />);

    await screen.findByTestId('schedule-day-board');

    dailySpy.mockClear();
    availabilitySpy.mockClear();

    fireEvent.click(
      within(screen.getByTestId('schedule-inspector')).getByRole('button', {
        name: 'Adjust Schedule',
      }),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Save override',
      }),
    );

    await waitFor(() => {
      expect(dailySpy).toHaveBeenCalledTimes(1);
      expect(availabilitySpy).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('schedule-action-adjust')).toBeNull();
    });
  });
});
