export type HomeServiceDispatchStatus =
  | 'awaiting_driver'
  | 'ready'
  | 'scheduled'
  | 'released_to_driver'
  | 'in_route'
  | 'arrived_at_customer'
  | 'service_started'
  | 'completed'
  | 'cancelled';

export interface HomeServiceLocationSnapshot {
  lat: number;
  lng: number;
  recorded_at: string;
  staffId: string | null;
  source: string;
}

export interface HomeServiceQueueItem {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  serviceName: string;
  area: string | null;
  formattedAddress: string | null;
  lat: number | null;
  lng: number | null;
  branchName: string | null;
  needsLocationReview: boolean;
  driverId: string | null;
  driverName: string | null;
  therapistId: string | null;
  therapistName: string | null;
  dispatchStatus: HomeServiceDispatchStatus;
  bookingStatus: string;
  bookingProgressStatus: string;
  paymentStatus: string;
  eta: {
    minutes: number;
    source: 'stored_routes_api' | 'stored_dispatch_estimate';
    calculatedAt: string | null;
    origin: string | null;
  } | null;
  travelStartedAt: string | null;
  arrivedAt: string | null;
  sessionStartedAt: string | null;
  completedAt: string | null;
  latestDriverLocation: HomeServiceLocationSnapshot | null;
}

export interface HomeServiceAlert {
  id: string;
  bookingId: string;
  title: string;
  description: string;
  severity: 'warning' | 'danger';
  timeAgo: string;
}

export interface HomeServiceResponse {
  ok: true;
  data: {
    context: { branchId: string; branchName: string; date: string };
    summary: {
      totalToday: number;
      awaitingDispatch: number;
      activeTrips: number;
      completedToday: number;
      cancelledToday: number;
    };
    items: HomeServiceQueueItem[];
    alerts: HomeServiceAlert[];
    locationSemantics: string;
  };
}

export interface HomeServiceDriver {
  id: string;
  name: string;
  systemRole: string | null;
  staffType: string | null;
  isActive: boolean;
}

export interface HomeServiceBookingDetail {
  id: string;
  branchId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  customer: {
    id: string | null;
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  service: {
    id: string | null;
    name: string | null;
    durationMinutes: number | null;
  };
  therapist: { id: string | null; name: string | null };
  driver: { id: string | null; name: string | null };
  status: string;
  progressStatus: string | null;
  paymentStatus: string | null;
  type: string | null;
  deliveryType: string | null;
  bookingMode: string | null;
  homeServiceAddress: {
    fullAddress: string | null;
    accessNote: string | null;
    barangay: string | null;
    city: string | null;
    landmark: string | null;
    lat: number | null;
    lng: number | null;
  };
  lifecycle: {
    checkedInAt: string | null;
    travelStartedAt: string | null;
    arrivedAt: string | null;
    sessionStartedAt: string | null;
    sessionCompletedAt: string | null;
    completedAt: string | null;
  };
  events: Array<{
    id: string | null;
    fromStatus: string | null;
    toStatus: string | null;
    notes: string | null;
    createdAt: string | null;
  }>;
}

export interface HomeServiceRecommendation {
  id: string;
  name: string;
  score?: number;
  reasons?: string[];
}

export interface HomeServiceRecommendations {
  therapists: HomeServiceRecommendation[];
  drivers: HomeServiceRecommendation[];
}

export interface HomeServiceMutationResult {
  ok: true;
  data: { releasedNow?: boolean; releaseAt?: string | null };
}
