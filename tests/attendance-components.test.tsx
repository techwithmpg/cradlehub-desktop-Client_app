import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '../src/types/auth';
import type { AttendanceWorkspaceResponse } from '../src/types/attendance';
import { AttendanceView } from '../src/components/attendance/AttendanceView';
import {
  updateAttendanceRules,
  fetchAttendanceHistory,
  fetchAttendanceWorkspace,
  mutateAttendanceException,
} from '../src/lib/attendance-service';

vi.mock('../src/lib/attendance-service', () => ({
  fetchAttendanceHistory: vi.fn(),
  fetchAttendanceWorkspace: vi.fn(),
  mutateAttendanceException: vi.fn(),
  updateAttendanceRules: vi.fn(),
}));

const mockedFetchAttendance = vi.mocked(fetchAttendanceWorkspace);
const mockedFetchHistory = vi.mocked(fetchAttendanceHistory);
const mockedMutateAttendance = vi.mocked(mutateAttendanceException);
const mockedUpdateAttendanceRules = vi.mocked(updateAttendanceRules);

const authContext: AuthContext = {
  userId: 'user-1',
  email: 'operator@example.com',
  staffId: 'operator-staff',
  fullName: 'Test Operator',
  canonicalRole: 'manager',
  rawRole: 'manager',
  branchId: 'branch-main',
  branchName: 'Main Spa',
  isCrmEligible: true,
};

function responseFixture(): AttendanceWorkspaceResponse {
  return {
    ok: true,
    branchId: 'branch-main',
    data: {
      branchId: 'branch-main',
      branchName: 'Main Spa',
      businessDate: '2026-09-10',
      timezone: 'Asia/Manila',
      serverNowMs: 1_757_470_000_000,
      settings: {
        branch_id: 'branch-main',
        late_grace_minutes: 20,
        clock_in_window_before_shift_minutes: 30,
        duplicate_scan_debounce_minutes: 2,
      },
      summary: {
        checkedInNow: 1,
        recordsToday: 1,
        openExceptions: 1,
        activeSessions: 0,
        activeDevices: 1,
      },
      records: [
        {
          id: 'attendance-1',
          branch_id: 'branch-main',
          staff_id: 'staff-1',
          staff_name: 'Test Therapist One',
          staff_nickname: null,
          staff_type: 'therapist',
          shift_date: '2026-09-10',
          scheduled_start_at: '2026-09-10T00:00:00.000Z',
          scheduled_end_at: '2026-09-10T09:00:00.000Z',
          checked_in_at: '2026-09-10T00:02:00.000Z',
          checked_out_at: null,
          status: 'checked_in',
          attendance_status: 'present',
          exception_state: null,
          worked_minutes: 120,
          late_minutes: 0,
          early_leave_minutes: 0,
          overtime_minutes: 0,
          source_label: 'Kiosk-01',
        },
      ],
      exceptions: [
        {
          id: 'exception-1',
          branch_id: 'branch-main',
          staff_id: 'staff-2',
          staff_name: 'Test Therapist Two',
          exception_type: 'late_arrival',
          severity: 'warning',
          status: 'open',
          message: 'Staff has not arrived after grace.',
          detected_at: '2026-09-10T00:20:00.000Z',
          resolved_at: null,
          category: 'arrival',
          priority: 'medium',
          resolution_status: 'open',
          recommended_action: 'Verify the schedule and scan history.',
          occurrence_count: 1,
          first_detected_at: '2026-09-10T00:20:00.000Z',
          last_detected_at: '2026-09-10T00:20:00.000Z',
          staff_response_required: false,
        },
      ],
      dailyStaffStates: [
        {
          staffId: 'staff-1',
          staffName: 'Test Therapist One',
          staffType: 'therapist',
          branchId: 'branch-main',
          businessDate: '2026-09-10',
          timezone: 'Asia/Manila',
          scheduleSource: 'weekly_schedule',
          scheduleState: 'expected_now',
          shiftWindows: [
            {
              id: 'window-1',
              shiftType: 'am',
              windowOrder: 1,
              startTime: '08:00:00',
              endTime: '17:00:00',
              scheduledStartAt: '2026-09-10T00:00:00.000Z',
              scheduledEndAt: '2026-09-10T09:00:00.000Z',
              endsNextDay: false,
            },
          ],
          currentShiftWindow: {
            id: 'window-1',
            shiftType: 'am',
            windowOrder: 1,
            startTime: '08:00:00',
            endTime: '17:00:00',
            scheduledStartAt: '2026-09-10T00:00:00.000Z',
            scheduledEndAt: '2026-09-10T09:00:00.000Z',
            endsNextDay: false,
          },
          nextShiftWindow: null,
          scheduledStart: '2026-09-10T00:00:00.000Z',
          scheduledEnd: '2026-09-10T09:00:00.000Z',
          attendanceRecordId: 'attendance-1',
          clockInAt: '2026-09-10T00:02:00.000Z',
          clockOutAt: null,
          currentAttendanceState: 'clocked_in',
          operationalStatus: 'clocked_in',
          workedMinutes: 120,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          overtimeMinutes: 0,
          activeBookingId: null,
          activeServiceSession: null,
          availabilityState: 'available',
          exceptionState: 'clear',
          currentExceptionIds: [],
          issueCodes: [],
          displayLabel: 'Clocked In',
          actionRequired: false,
        },
        {
          staffId: 'staff-2',
          staffName: 'Test Therapist Two',
          staffType: 'therapist',
          branchId: 'branch-main',
          businessDate: '2026-09-10',
          timezone: 'Asia/Manila',
          scheduleSource: 'weekly_schedule',
          scheduleState: 'expected_now',
          shiftWindows: [
            {
              id: 'window-2',
              shiftType: 'am',
              windowOrder: 1,
              startTime: '08:00:00',
              endTime: '17:00:00',
              scheduledStartAt: '2026-09-10T00:00:00.000Z',
              scheduledEndAt: '2026-09-10T09:00:00.000Z',
              endsNextDay: false,
            },
          ],
          currentShiftWindow: {
            id: 'window-2',
            shiftType: 'am',
            windowOrder: 1,
            startTime: '08:00:00',
            endTime: '17:00:00',
            scheduledStartAt: '2026-09-10T00:00:00.000Z',
            scheduledEndAt: '2026-09-10T09:00:00.000Z',
            endsNextDay: false,
          },
          nextShiftWindow: null,
          scheduledStart: '2026-09-10T00:00:00.000Z',
          scheduledEnd: '2026-09-10T09:00:00.000Z',
          attendanceRecordId: null,
          clockInAt: null,
          clockOutAt: null,
          currentAttendanceState: 'late_not_arrived',
          operationalStatus: 'missing',
          workedMinutes: 0,
          lateMinutes: 20,
          earlyLeaveMinutes: 0,
          overtimeMinutes: 0,
          activeBookingId: null,
          activeServiceSession: null,
          availabilityState: 'not_available',
          exceptionState: 'open',
          currentExceptionIds: ['exception-1'],
          issueCodes: ['late_arrival'],
          displayLabel: 'Late',
          actionRequired: true,
        },
      ],
    },
  };
}

describe('Attendance Today workspace', () => {
  beforeEach(() => {
    mockedFetchAttendance.mockReset();
    mockedFetchAttendance.mockResolvedValue(responseFixture());

    mockedFetchHistory.mockReset();

    const historyRecord = responseFixture().data.records[0];

    mockedFetchHistory.mockResolvedValue({
      ok: true,
      branchId: 'branch-main',
      fromDate: '2026-09-04',
      toDate: '2026-09-10',
      data: {
        fromDate: '2026-09-04',
        toDate: '2026-09-10',
        records: [historyRecord],
        corrections: [],
      },
    });

    mockedMutateAttendance.mockReset();
    mockedMutateAttendance.mockResolvedValue({
      ok: true,
      action: 'review_exception',
      message: 'Issue reviewed and kept open.',
      exceptionId: 'exception-1',
    });

    mockedUpdateAttendanceRules.mockReset();
    mockedUpdateAttendanceRules.mockResolvedValue({
      ok: true,
      action: 'update_rules',
      message: 'Attendance rules saved.',
      settings: {
        late_grace_minutes: 15,
        clock_in_window_before_shift_minutes: 30,
        duplicate_scan_debounce_minutes: 2,
      },
    });
  });

  it('renders real hosted Attendance states in the canonical workspace', async () => {
    render(<AttendanceView authContext={authContext} />);

    expect(
      await screen.findByRole('button', {
        name: 'View Test Therapist One',
      }),
    ).toBeTruthy();

    expect(screen.getByText('Test Therapist Two')).toBeTruthy();

    expect(screen.getByTestId('attendance-kpi-working').textContent).toContain(
      '1',
    );

    expect(screen.getByTestId('attendance-kpi-late').textContent).toContain(
      '1',
    );

    expect(screen.getByTestId('attendance-kpi-review').textContent).toContain(
      '1',
    );

    expect(
      screen.getByTestId('attendance-kpi-not-scanned').textContent,
    ).toContain('1');

    expect(
      within(screen.getByTestId('attendance-grid')).getByText('Kiosk-01'),
    ).toBeTruthy();
  });

  it('updates the persistent inspector without navigating away', async () => {
    render(<AttendanceView authContext={authContext} />);

    await screen.findByRole('button', {
      name: 'View Test Therapist One',
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'View Test Therapist Two',
      }),
    );

    const inspector = screen.getByTestId('attendance-inspector');

    expect(within(inspector).getByText('Test Therapist Two')).toBeTruthy();

    expect(within(inspector).getByText('Late Arrival')).toBeTruthy();
  });

  it('filters the Today table without changing branch authority', async () => {
    render(<AttendanceView authContext={authContext} />);

    await screen.findByRole('button', {
      name: 'View Test Therapist One',
    });

    fireEvent.change(screen.getByLabelText('Attendance status filter'), {
      target: {
        value: 'late',
      },
    });

    expect(
      within(screen.getByTestId('attendance-grid')).queryByText(
        'Test Therapist One',
      ),
    ).toBeNull();

    expect(screen.getByText('Test Therapist Two')).toBeTruthy();

    expect(screen.queryByLabelText('Attendance branch filter')).toBeNull();
  });

  it('renders the real Review queue and keeps reviewed issues open', async () => {
    render(<AttendanceView authContext={authContext} />);

    await screen.findByRole('button', {
      name: 'View Test Therapist One',
    });

    fireEvent.click(screen.getByTestId('attendance-tab-review'));

    expect(await screen.findByTestId('attendance-review-grid')).toBeTruthy();

    const inspector = screen.getByTestId('attendance-review-inspector');

    expect(
      within(inspector).getByText('Staff has not arrived after grace.'),
    ).toBeTruthy();

    expect(
      within(inspector).getByText('Verify the schedule and scan history.'),
    ).toBeTruthy();

    fireEvent.click(
      within(inspector).getByRole('button', {
        name: 'Review & Keep Open',
      }),
    );

    await waitFor(() => {
      expect(mockedMutateAttendance).toHaveBeenCalledWith({
        action: 'review_exception',
        exceptionId: 'exception-1',
        resolutionNote: undefined,
      });
    });
  });

  it('resolves an Attendance exception with the entered note', async () => {
    mockedMutateAttendance.mockResolvedValueOnce({
      ok: true,
      action: 'resolve_exception',
      message: 'Exception resolved.',
      exceptionId: 'exception-1',
    });

    render(<AttendanceView authContext={authContext} />);

    await screen.findByRole('button', {
      name: 'View Test Therapist One',
    });

    fireEvent.click(screen.getByTestId('attendance-tab-review'));

    const inspector = await screen.findByTestId('attendance-review-inspector');

    fireEvent.change(within(inspector).getByLabelText('Resolution note'), {
      target: {
        value: 'Verified with the manager.',
      },
    });

    fireEvent.click(
      within(inspector).getByRole('button', {
        name: 'Resolve Issue',
      }),
    );

    await waitFor(() => {
      expect(mockedMutateAttendance).toHaveBeenCalledWith({
        action: 'resolve_exception',
        exceptionId: 'exception-1',
        resolutionNote: 'Verified with the manager.',
      });
    });
  });

  it('loads real Attendance History only when History is opened', async () => {
    render(<AttendanceView authContext={authContext} />);

    await screen.findByRole('button', {
      name: 'View Test Therapist One',
    });

    expect(mockedFetchHistory).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('attendance-tab-history'));

    const grid = await screen.findByTestId('attendance-history-grid');

    await waitFor(() => {
      expect(mockedFetchHistory).toHaveBeenCalledWith(
        '2026-09-04',
        '2026-09-10',
      );
    });

    expect(within(grid).getByText('Test Therapist One')).toBeTruthy();

    expect(screen.getByTestId('attendance-history-pagination')).toBeTruthy();
  });

  it('renders only the three Desktop-authorized Attendance rules in Setup', async () => {
    render(<AttendanceView authContext={authContext} />);

    await screen.findByRole('button', {
      name: 'View Test Therapist One',
    });

    fireEvent.click(screen.getByTestId('attendance-tab-setup'));

    const setup = await screen.findByTestId('attendance-setup');

    expect(within(setup).getByLabelText('Late grace minutes')).toBeTruthy();

    expect(
      within(setup).getByLabelText('Clock-in window before shift minutes'),
    ).toBeTruthy();

    expect(
      within(setup).getByLabelText('Duplicate scan debounce minutes'),
    ).toBeTruthy();

    expect(setup.textContent).toContain('3 editable rules');
    expect(setup.textContent).not.toContain('Test Mode');
    expect(setup.textContent).not.toContain('Launch Recovery');
  });

  it('saves Attendance rules without renderer branch authority', async () => {
    render(<AttendanceView authContext={authContext} />);

    await screen.findByRole('button', {
      name: 'View Test Therapist One',
    });

    fireEvent.click(screen.getByTestId('attendance-tab-setup'));

    const setup = await screen.findByTestId('attendance-setup');

    fireEvent.change(within(setup).getByLabelText('Late grace minutes'), {
      target: {
        value: '15',
      },
    });

    fireEvent.change(
      within(setup).getByLabelText('Attendance rule change note'),
      {
        target: {
          value: 'Adjusted for front desk operations.',
        },
      },
    );

    fireEvent.click(
      within(setup).getByRole('button', {
        name: 'Save Attendance Rules',
      }),
    );

    await waitFor(() => {
      expect(mockedUpdateAttendanceRules).toHaveBeenCalledWith({
        settings: {
          late_grace_minutes: 15,
          clock_in_window_before_shift_minutes: 30,
          duplicate_scan_debounce_minutes: 2,
        },
        reason: 'Adjusted for front desk operations.',
      });
    });

    const payload = mockedUpdateAttendanceRules.mock.calls[0][0];

    expect(JSON.stringify(payload)).not.toContain('branchId');
  });

  it('paginates the Review queue at ten issues by default', async () => {
    const fixture = responseFixture();
    const baseException = fixture.data.exceptions[0];

    fixture.data.exceptions = Array.from({ length: 12 }, (_, index) => ({
      ...baseException,
      id: 'review-exception-' + (index + 1),
      staff_id: 'review-staff-' + (index + 1),
      staff_name: 'Review Staff ' + (index + 1),
      message: 'Review issue ' + (index + 1),
    }));

    fixture.data.summary.openExceptions = 12;

    mockedFetchAttendance.mockResolvedValue(fixture);

    render(<AttendanceView authContext={authContext} />);

    await screen.findByRole('button', {
      name: 'View Test Therapist One',
    });

    fireEvent.click(screen.getByTestId('attendance-tab-review'));

    const grid = await screen.findByTestId('attendance-review-grid');

    expect(within(grid).getByText('Review Staff 1')).toBeTruthy();

    expect(within(grid).queryByText('Review Staff 11')).toBeNull();

    const pagination = screen.getByTestId('attendance-review-pagination');

    expect(pagination.textContent).toContain('Showing 1–10 of 12 issues');

    fireEvent.click(
      within(pagination).getByRole('button', {
        name: 'Next Attendance Review page',
      }),
    );

    expect(within(grid).getByText('Review Staff 11')).toBeTruthy();

    expect(pagination.textContent).toContain('Showing 11–12 of 12 issues');
  });

  it('shows a truthful retryable error when Attendance cannot load', async () => {
    mockedFetchAttendance.mockRejectedValueOnce(
      new Error(
        'Attendance requires a connection. Please check your network and try again.',
      ),
    );

    render(<AttendanceView authContext={authContext} />);

    expect(
      (await screen.findByTestId('attendance-error')).textContent,
    ).toContain(
      'Attendance requires a connection. Please check your network and try again.',
    );
  });
});
