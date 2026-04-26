import type {
  Client,
  NoShowGroupBy,
  Professional,
  Service,
} from "@/types";

export type ProfessionalLimits = {
  currentProfessionals: number;
  maxProfessionals: number;
  remaining: number;
};

export type ListQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type AppointmentsListParams = ListQueryParams & {
  date?: string;
  professionalId?: string;
  status?: string;
};

export type ListResponse<T> =
  | T[]
  | {
      items: T[];
      total?: number;
      page?: number;
      pageSize?: number;
      hasMore?: boolean;
      totalCount?: number;
      currentPage?: number;
      totalPages?: number;
    };

export type DashboardProfessionalMetricsResponse = {
  startDate: string;
  endDate: string;
  professionalId: string;
  // Monetary values from dashboard/report endpoints are currently returned in cents.
  revenueTotal: number;
  commissionTotal: number;
  completedServices: number;
  clientsServed: number;
};

export type DashboardServiceMetricItem = {
  serviceId: string;
  serviceName: string;
  totalAppointments: number;
  completedAppointments: number;
  canceledAppointments: number;
  // Monetary values from dashboard/report endpoints are currently returned in cents.
  revenueTotal: number;
  completionRate: number;
  cancellationRate: number;
};

export type DashboardServicesMetricsResponse = {
  startDate: string;
  endDate: string;
  professionalId?: string | null;
  services: DashboardServiceMetricItem[];
  mostRequestedService: DashboardServiceMetricItem | null;
  leastRequestedService: DashboardServiceMetricItem | null;
  mostCancelledService: DashboardServiceMetricItem | null;
  mostCompletedService: DashboardServiceMetricItem | null;
};

export type MfaStatusResponse = {
  enabled: boolean;
  enrolled: boolean;
  enrollmentUri?: string | null;
  secretMasked?: string | null;
};

export type MfaSetupResponse = {
  secret: string;
  otpauthUri: string;
  issuer: string;
  accountName: string;
};

export type NoShowReportParams = {
  afterId?: string;
  limit?: number;
  from?: string;
  to?: string;
  professionalId?: string;
  serviceId?: string;
  clientIds?: string[];
  clientQuery?: string;
  groupBy?: NoShowGroupBy;
};

export type PublicBookingAvailabilityResponse = {
  date: string;
  slots: Array<{ time: string; available: boolean }>;
};

export type PublicBookingCreateAppointmentRequest = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  professionalId: string;
  serviceId?: string;
  items?: Array<{
    serviceId: string;
    quantity?: number;
  }>;
  date: string;
  startTime: string;
};

export type PublicBookingCreateAppointmentResponse = {
  appointmentId: string;
  status: string;
  message?: string;
};

export type ClientsPagedApiResponse = {
  items?: Client[];
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
};

export type ClientsListResponse = ListResponse<Client>;

export type PublicBookingServicesResponse = Service[];
export type PublicBookingProfessionalsResponse = Professional[];
