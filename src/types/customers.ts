export type CustomerTabType = 'all' | 'repeat' | 'lapsed' | 'followup';

export interface CustomerListItem {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  totalBookings: number;
  firstBookingDate: string | null;
  lastBookingDate: string | null;
  preferredStaffId: string | null;
  preferredStaffName: string | null;
  loyaltyTier?: string | null;
}

export interface WaitlistFollowupItem {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string | null;
  serviceName: string | null;
  visitType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  email?: string | null;
}

export interface CustomerKpis {
  totalCustomers: number;
  repeatClients: number;
  lapsedClients: number;
  newThisMonth: number;
  totalVisits: number;
}

export interface CustomerPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CustomerBookingHistoryItem {
  id: string;
  bookingDate: string;
  startTime: string;
  status: string;
  type: string;
  deliveryType?: string | null;
  serviceName: string;
  staffName: string;
  branchName: string;
}

export interface CustomerDetail {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  firstBookingDate: string | null;
  lastBookingDate: string | null;
  totalBookings: number;
  notes: string | null;
  preferredStaffId: string | null;
  preferredStaffName: string | null;
  preferredVisitType: string | null;
  pressurePreference: string | null;
  healthNotes: string | null;
  birthday: string | null;
  loyaltyTier: string | null;
  bookingHistory?: CustomerBookingHistoryItem[];
}

export interface FetchCustomersParams {
  branchId: string;
  tab?: CustomerTabType;
  q?: string;
  page?: number;
  pageSize?: number;
}

export type FetchCustomersResult =
  | {
      ok: true;
      tab: CustomerTabType;
      data: CustomerListItem[];
      waitlist: WaitlistFollowupItem[];
      pagination: CustomerPagination;
      kpis: CustomerKpis;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

export type FetchCustomerDetailResult =
  | {
      ok: true;
      customer: CustomerDetail;
      bookingHistory: CustomerBookingHistoryItem[];
    }
  | {
      ok: false;
      code: string;
      message: string;
    };
