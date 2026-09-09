import { describe, expect, it } from 'vitest';
import {
  getScheduleStaffState,
  getScheduleStaffStateLabel,
} from '../src/lib/schedule-role-groups';
import type { ScheduleStaffRow } from '../src/types/schedule';

// Stage 06B Schedule staff-state authority

function row(overrides: Record<string, unknown> = {}): ScheduleStaffRow {
  return {
    staff_id: 'staff-1',
    staff_name: 'Test Staff',
    schedule_status: 'scheduled',
    schedule_source: 'weekly',
    schedule_is_day_off: false,
    schedule_windows: [
      {
        startTime: '09:00',
        endTime: '17:00',
      },
    ],
    work_start: '09:00',
    work_end: '17:00',
    attendance_presence: null,
    current_override: null,
    blocks: [],
    bookings: [],
    schedule_conflict_code: null,
    schedule_conflict_reason: null,
    ...overrides,
  } as unknown as ScheduleStaffRow;
}

describe('Stage 06B Schedule staff-state authority', () => {
  it('treats authoritative checked_in attendance as On Duty even without a schedule assignment', () => {
    const staff = row({
      schedule_status: 'missing',
      schedule_source: 'none',
      schedule_windows: [],
      work_start: null,
      work_end: null,
      attendance_presence: {
        state: 'checked_in',
      },
    });

    expect(getScheduleStaffState(staff)).toBe('on_duty');
    expect(getScheduleStaffStateLabel(staff)).toBe('On Duty');
  });

  it('classifies an authoritative day off when the staff member is not checked in', () => {
    const staff = row({
      schedule_status: 'day_off',
      schedule_is_day_off: true,
      schedule_windows: [],
      work_start: null,
      work_end: null,
    });

    expect(getScheduleStaffState(staff)).toBe('off');
    expect(getScheduleStaffStateLabel(staff)).toBe('Day Off');
  });

  it('classifies a staff member with no valid schedule as Not Assigned', () => {
    const staff = row({
      schedule_status: 'missing',
      schedule_source: 'none',
      schedule_windows: [],
      work_start: null,
      work_end: null,
    });

    expect(getScheduleStaffState(staff)).toBe('not_assigned');
    expect(getScheduleStaffStateLabel(staff)).toBe('Not Assigned');
  });

  it('keeps a valid scheduled but not checked-in staff member in Scheduled state', () => {
    const staff = row();

    expect(getScheduleStaffState(staff)).toBe('scheduled');
    expect(getScheduleStaffStateLabel(staff)).toBe(
      'Scheduled · Not Checked In',
    );
  });
});
