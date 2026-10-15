import type { NavModuleId } from '../types/auth';

/**
 * A successful booking-domain write can affect these operational views.
 * Invalidation marks retained data dirty; it does not discard or immediately
 * refetch hidden workspaces.
 */
export const BOOKING_WRITE_INVALIDATIONS: readonly NavModuleId[] = [
  'today',
  'bookings',
  'customers',
  'schedule',
  'home-service',
];

/**
 * Today operational progress mutations explicitly exclude Home Service.
 * They can change the Today queue, booking state, and schedule state.
 */
export const TODAY_OPERATIONAL_WRITE_INVALIDATIONS: readonly NavModuleId[] = [
  'today',
  'bookings',
  'schedule',
];
