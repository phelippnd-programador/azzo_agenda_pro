export interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  logo?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'OWNER' | 'PROFESSIONAL' | 'CLIENT';
  avatar?: string;
  avatarUrl?: string | null;
  salonName?: string | null;
  mfaEnabled?: boolean;
  createdAt: Date;
}

export interface Professional {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  specialties: string[];
  commissionRate: number;
  workingHours: WorkingHours[];
  isActive: boolean;
  createdAt: Date;
}

export interface Specialty {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  createdAt: string | Date;
}

export interface WorkingHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  professionalIds: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface AppointmentItem {
  id?: string;
  serviceId: string;
  service?: Service;
  orderIndex?: number;
  durationMinutes: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AppointmentCreateItemInput {
  serviceId: string;
  durationMinutes?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  birthDate?: Date | string;
  notes?: string;
  address?: ClientAddress;
  topServices?: ClientTopService[];
  totalVisits: number;
  totalSpent: number;
  lastVisit?: Date | string;
  createdAt: Date | string;
}

export interface ClientAddress {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface ClientTopService {
  serviceId: string;
  serviceName: string;
  topProfessionalId?: string;
  topProfessionalName?: string;
  completedAppointments: number;
  completedServices: number;
  revenueTotal: number;
  lastAppointmentDate?: string;
}

export interface AppointmentCustomerNote {
  noteId: string;
  appointmentId: string;
  clientId: string;
  recordedByUserId?: string;
  recordedAt: string;
  updatedAt?: string;
  serviceExecutionNotes?: string;
  clientFeedbackNotes?: string;
  internalFollowupNotes?: string;
}

export interface AppointmentTimelineEvent {
  eventId: string;
  action: string;
  actionLabel: string;
  actorUserId?: string;
  actorName?: string;
  actorRole?: string;
  status?: string;
  sourceChannel?: string;
  createdAt: string;
  changedFields: string[];
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}

export interface AppointmentDetailResponse {
  appointment: Appointment;
  careNotes: AppointmentCustomerNote[];
  timeline: AppointmentTimelineEvent[];
}

export interface NoShowReportItem {
  appointmentId: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  professionalId?: string;
  professionalName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  totalPrice: number;
  totalServices: number;
  serviceNames: string[];
  createdAt?: string;
}

export type NoShowGroupBy = "DAY" | "PROFESSIONAL" | "CLIENT" | "SERVICE";

export interface NoShowReportPoint {
  date: string;
  totalNoShows: number;
  revenueAtRisk: number;
}

export interface NoShowReportGroup {
  key: string;
  label: string;
  totalNoShows: number;
  revenueAtRisk: number;
}

export interface NoShowReportPageResponse {
  startDate?: string;
  endDate?: string;
  lastUpdatedAt?: string | null;
  groupBy?: NoShowGroupBy;
  totalNoShows?: number;
  previousPeriodNoShows?: number;
  lastSevenDaysNoShows?: number;
  completedAppointments?: number;
  noShowRate?: number;
  revenueAtRisk?: number;
  limit: number;
  afterId?: string | null;
  nextAfterId?: string | null;
  hasMore: boolean;
  totalItems: number;
  items: NoShowReportItem[];
  points?: NoShowReportPoint[];
  groups?: NoShowReportGroup[];
}

export interface AppointmentManagementReportItem {
  appointmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  clientId?: string;
  clientName?: string;
  professionalId?: string;
  professionalName?: string;
  serviceLabel?: string;
  status: AppointmentStatus;
  origin?: string;
  totalPrice: number;
  flagHorarioVago: boolean;
  flagNaoConfirmado: boolean;
  flagAbandonoFluxo: boolean;
}

export interface AppointmentManagementReportSignal {
  code: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical" | "opportunity";
}

export interface AppointmentManagementReportResponse {
  startDate?: string;
  endDate?: string;
  lastUpdatedAt?: string | null;
  totalAppointments: number;
  totalConfirmed: number;
  totalPending: number;
  totalCancelled: number;
  totalNoShow: number;
  totalCompleted: number;
  totalRevenue: number;
  totalGapOpportunities: number;
  totalUnconfirmed: number;
  totalAbandonmentSignalDays: number;
  occupancyRate: number;
  cancellationRate: number;
  noShowRate: number;
  limit: number;
  totalItems: number;
  alerts: AppointmentManagementReportSignal[];
  opportunities: AppointmentManagementReportSignal[];
  items: AppointmentManagementReportItem[];
}

export interface ClientAppointmentHistoryItem {
  appointmentId: string;
  date: string;
  status: AppointmentStatus;
  professionalId?: string;
  professionalName?: string;
  notes?: string;
  services: AppointmentItem[];
  careNotes: AppointmentCustomerNote[];
}

export interface ClientAppointmentHistoryResponse {
  clientId: string;
  page: number;
  size: number;
  totalItems: number;
  items: ClientAppointmentHistoryItem[];
}

export interface DashboardCustomerRankingItem {
  rank: number;
  clientId: string;
  clientName: string;
  completedAppointments: number;
  completedServices: number;
  revenueTotal: number;
  lastAppointmentDate?: string;
}

export interface DashboardCustomerRankingResponse {
  startDate: string;
  endDate: string;
  lastUpdatedAt?: string;
  items: DashboardCustomerRankingItem[];
}

export interface DashboardWhatsAppReactivationPoint {
  metricDate: string;
  abandonedCount: number;
  reactivatedCount: number;
  convertedCount: number;
}

export interface DashboardWhatsAppReactivationResponse {
  startDate: string;
  endDate: string;
  totalAbandoned: number;
  totalReactivated: number;
  totalConverted: number;
  reactivationRate: number;
  stoppedAtServiceSelection: number;
  stoppedAtProfessionalSelection: number;
  stoppedAtTimeSelection: number;
  stoppedAtFinalReview: number;
  points: DashboardWhatsAppReactivationPoint[];
}

export interface DashboardWhatsAppReactivationQueueItem {
  cycleId: string;
  clientId?: string | null;
  conversationId?: string | null;
  appointmentIdCreatedAfterAbandonment?: string | null;
  customerName?: string | null;
  userIdentifier?: string | null;
  abandonedAt?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  lastStage?: string | null;
  lastStageLabel?: string | null;
  lastServiceName?: string | null;
  lastProfessionalName?: string | null;
  lastRequestedDate?: string | null;
  lastRequestedTime?: string | null;
  assistantLastPrompt?: string | null;
  customerLastMessage?: string | null;
  nextAttemptNumber?: number | null;
  nextAttemptAt?: string | null;
  reactivatedAt?: string | null;
  convertedAt?: string | null;
  respondedAt?: string | null;
  cancelReason?: string | null;
  latestAttemptNumber?: number | null;
  latestAttemptStatus?: string | null;
  latestAttemptStatusLabel?: string | null;
  latestAttemptAt?: string | null;
  latestAttemptError?: string | null;
  manualInterventionSuggested?: boolean | null;
  manualInterventionReason?: string | null;
  manualInterventionAttempts?: number | null;
}

export interface DashboardWhatsAppReactivationQueueResponse {
  startDate: string;
  endDate: string;
  statusFilter: string;
  limit: number;
  items: DashboardWhatsAppReactivationQueueItem[];
  exceptionItems: DashboardWhatsAppReactivationQueueItem[];
}

export interface DashboardNoShowInsightItem {
  appointmentId: string;
  clientId?: string;
  clientName?: string;
  professionalId?: string;
  professionalName?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  serviceNames: string[];
}

export interface DashboardNoShowInsightsResponse {
  startDate: string;
  endDate: string;
  lastUpdatedAt?: string | null;
  totalNoShows: number;
  previousPeriodNoShows?: number | null;
  noShowRate: number;
  lastSevenDaysNoShows: number;
  revenueAtRisk: number;
  recentItems: DashboardNoShowInsightItem[];
}

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  client?: Client;
  professionalId: string;
  professional?: Professional;
  serviceId?: string;
  service?: Service;
  items?: AppointmentItem[];
  date: Date;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  totalPrice: number;
  createdAt: Date;
}

export interface TransactionCategory {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  tenantId: string;
  appointmentId?: string;
  professionalId?: string;
  productId?: string;
  productCategory?: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'OTHER';
  date: Date;
  createdAt: Date;
  reconciled?: boolean;
  reconciledAt?: string;
  source?: string;
  recurringId?: string;
}

export interface DashboardMetrics {
  todayAppointments: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  todayAppointmentsGrowthPercent?: number | null;
  todayRevenueGrowthPercent?: number | null;
  totalClientsGrowthPercent?: number | null;
  monthlyRevenueGrowthPercent?: number | null;
  pendingAppointments: number;
  completedToday: number;
  notConcludedToday: number;
  stoppedAtServiceSelection: number;
  stoppedAtProfessionalSelection: number;
  stoppedAtTimeSelection: number;
  stoppedAtFinalReview: number;
}

export type AppointmentStatus = Appointment['status'];
export type TransactionType = Transaction['type'];
export type PaymentMethod = Transaction['paymentMethod'];
export type UserRole = User['role'];
