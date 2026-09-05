import {
  CalendarDays,
  BookmarkCheck,
  UserCheck,
  Users,
  CalendarRange,
  Truck,
  UserCog,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { NavModuleId } from '../types/auth';

export interface NavItemConfig {
  id: NavModuleId;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const AUTHORIZED_NAV_ITEMS: readonly NavItemConfig[] = [
  {
    id: 'today',
    label: 'Today',
    icon: CalendarDays,
    description: 'Today’s operational overview and live front-desk feed.',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: BookmarkCheck,
    description: 'Booking command center, reservations, and customer check-in.',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: UserCheck,
    description: 'Staff shift check-ins, QR scan verification, and exceptions.',
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    description: 'Customer profiles, visit history, and loyalty preferences.',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: CalendarRange,
    description:
      'Branch shift schedules, therapist availability, and room allocations.',
  },
  {
    id: 'home-service',
    label: 'Home Service',
    icon: Truck,
    description:
      'Home service dispatch, route coordination, and travel tracking.',
  },
  {
    id: 'staff',
    label: 'Staff',
    icon: UserCog,
    description:
      'Staff roster, provider capabilities, and service assignments.',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description:
      'Branch operational settings, booking rules, and service catalog.',
  },
] as const;
