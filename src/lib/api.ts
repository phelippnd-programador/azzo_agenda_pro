import type {
  Appointment,
  AppointmentDetailResponse,
  AppointmentManagementReportResponse,
  AppointmentTimelineEvent,
  Client,
  ClientAppointmentHistoryResponse,
  DashboardCustomerRankingResponse,
  DashboardMetrics,
  DashboardNoShowInsightsResponse,
  DashboardWhatsAppReactivationQueueResponse,
  DashboardWhatsAppReactivationResponse,
  NoShowGroupBy,
  NoShowReportPageResponse,
  Professional,
  Service,
  Specialty,
  Transaction,
  TransactionCategory,
  User,
} from "@/types";

export type {
  Appointment,
  AppointmentDetailResponse,
  AppointmentManagementReportResponse,
  AppointmentTimelineEvent,
  Client,
  ClientAppointmentHistoryResponse,
  DashboardCustomerRankingResponse,
  DashboardMetrics,
  DashboardNoShowInsightsResponse,
  DashboardWhatsAppReactivationQueueResponse,
  DashboardWhatsAppReactivationResponse,
  NoShowGroupBy,
  NoShowReportPageResponse,
  Professional,
  Service,
  Specialty,
  Transaction,
  TransactionCategory,
  User,
};

export type {
  AppointmentsListParams,
  DashboardProfessionalMetricsResponse,
  DashboardServicesMetricsResponse,
  ListQueryParams,
  ListResponse,
  MfaSetupResponse,
  MfaStatusResponse,
  NoShowReportParams,
  ProfessionalLimits,
} from "./api/contracts";

export type {
  AppointmentCreateRequest,
  AppointmentCustomerNoteRequest,
  AppointmentManagementReportParams,
  AppointmentMonthlyMetric,
} from "./api/appointments";
export type {
  RecurringTransaction,
  RecurringTransactionCreateInput,
  TransactionListParams,
  TransactionPagedResponse,
} from "./api/finance";
export type {
  AddressLookup,
  SalonBusinessHours,
  SalonProfile,
  SalonSpecialClosureDate,
} from "./api/salon";
export type { AppSettings } from "./api/settings";
export type {
  DanfeJobResponse,
  FiscalCertificateResponse,
  NfseAccountingExportFormat,
  NfseCertificateUnlockStatus,
  NfseConfig,
  NfseFiscalMunicipality,
  NfseFiscalState,
  NfseInvoice,
  NfseInvoiceCustomer,
  NfseInvoiceItem,
  NfseInvoiceListResponse,
  NfsePdfJobResponse,
  NfseProviderCapabilities,
  NfseTomadorLookupAddress,
  NfseTomadorLookupResponse,
  TaxConfig,
} from "./api/fiscal";

export { ApiError, isPlanExpiredApiError, refreshLicenseAccessStatus } from "./api/core";
export { authApi } from "./api/auth";
export { dashboardApi } from "./api/dashboard";
export { chatApi } from "./api/chat";
export { servicesApi } from "./api/services";
export { professionalsApi } from "./api/professionals";
export { specialtiesApi, specialtyImportApi } from "./api/specialties";
export { clientsApi } from "./api/clients";
export { notificationsApi } from "./api/notifications";
export { auditoriaApi } from "./api/audit";
export { appointmentsApi } from "./api/appointments";
export { stockApi, clientImportApi, serviceImportApi } from "./api/stock";
export {
  transactionsApi,
  transactionCategoriesApi,
  recurringTransactionsApi,
  reportsApi,
  commissionApi,
} from "./api/finance";
export { salonApi, utilsApi } from "./api/salon";
export { settingsApi, usersApi } from "./api/settings";
export { suggestionsApi, tenantApi, configApi } from "./api/tenant";
export { systemAdminApi } from "./api/system-admin";
export { publicLegalApi, lgpdApi } from "./api/legal";
export { checkoutApi, billingApi } from "./api/commerce";
export { fiscalApi, nfseApi } from "./api/fiscal";
export { publicBookingApi } from "./api/public-booking";
export { resolveApiMediaUrl } from "./api/media";
