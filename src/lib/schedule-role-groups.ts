import type {
  ScheduleAvailabilityItem,
  ScheduleStaffRow,
} from '../types/schedule';

export type ScheduleRoleGroup =
  | 'all'
  | 'therapist'
  | 'salon'
  | 'aesthetician'
  | 'front_desk'
  | 'driver'
  | 'managerial'
  | 'utility'
  | 'other';

export type ScheduleStaffState =
  'all' | 'on_duty' | 'scheduled' | 'off' | 'not_assigned';

export const SCHEDULE_ROLE_GROUPS: Array<{
  key: ScheduleRoleGroup;
  label: string;
  staffTypes: string[];
}> = [
  {
    key: 'all',
    label: 'All Staff',
    staffTypes: [],
  },
  {
    key: 'therapist',
    label: 'Therapists',
    staffTypes: ['therapist'],
  },
  {
    key: 'salon',
    label: 'Nail Tech / Salon',
    staffTypes: ['nail_tech', 'salon_head'],
  },
  {
    key: 'aesthetician',
    label: 'Aestheticians',
    staffTypes: ['aesthetician', 'facialist'],
  },
  {
    key: 'front_desk',
    label: 'CRM / Front Desk',
    staffTypes: ['csr'],
  },
  {
    key: 'driver',
    label: 'Drivers',
    staffTypes: ['driver'],
  },
  {
    key: 'managerial',
    label: 'Managers',
    staffTypes: ['managerial'],
  },
  {
    key: 'utility',
    label: 'Utility',
    staffTypes: ['utility'],
  },
  {
    key: 'other',
    label: 'Other',
    staffTypes: [],
  },
];

export const SCHEDULE_STAFF_STATES: Array<{
  key: ScheduleStaffState;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'on_duty', label: 'On Duty' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'off', label: 'Day Off' },
  { key: 'not_assigned', label: 'Not Assigned' },
];

export function getScheduleStaffType(
  item: ScheduleAvailabilityItem | undefined,
): string | null {
  return item?.staff.staff_type ?? item?.staff.system_role ?? null;
}

export function getScheduleRoleGroup(
  staffType: string | null | undefined,
): ScheduleRoleGroup {
  const normalized = staffType?.toLowerCase() ?? '';

  const match = SCHEDULE_ROLE_GROUPS.find(
    (group) =>
      group.key !== 'all' &&
      group.key !== 'other' &&
      group.staffTypes.includes(normalized),
  );

  return match?.key ?? 'other';
}

export function getScheduleStaffState(
  row: ScheduleStaffRow,
): Exclude<ScheduleStaffState, 'all'> {
  // Current authoritative attendance wins over schedule assignment state.
  // A checked-in staff member is operationally On Duty even when the
  // resolved schedule is missing or otherwise inconsistent.
  if (row.attendance_presence?.state === 'checked_in') {
    return 'on_duty';
  }

  if (row.schedule_is_day_off || row.schedule_status === 'day_off') {
    return 'off';
  }

  if (
    row.schedule_status === 'missing' ||
    row.schedule_source === 'none' ||
    row.schedule_windows.length === 0
  ) {
    return 'not_assigned';
  }

  return 'scheduled';
}

export function getScheduleStaffStateLabel(row: ScheduleStaffRow): string {
  const state = getScheduleStaffState(row);

  if (state === 'on_duty') return 'On Duty';
  if (state === 'off') return 'Day Off';
  if (state === 'not_assigned') return 'Not Assigned';

  if (row.attendance_presence?.state === 'checked_out') {
    return 'Scheduled · Checked Out';
  }

  return 'Scheduled · Not Checked In';
}

export function matchesScheduleRole(
  row: ScheduleStaffRow,
  availabilityByStaffId: Map<string, ScheduleAvailabilityItem>,
  role: ScheduleRoleGroup,
): boolean {
  if (role === 'all') return true;

  const availability = availabilityByStaffId.get(row.staff_id);
  const staffType = getScheduleStaffType(availability);

  return getScheduleRoleGroup(staffType) === role;
}

export function matchesScheduleState(
  row: ScheduleStaffRow,
  state: ScheduleStaffState,
): boolean {
  return state === 'all' || getScheduleStaffState(row) === state;
}
