import type {
  Appointment,
  AppointmentManagementReportResponse,
  AppointmentDetailResponse,
  AppointmentCustomerNote,
  AppointmentCreateItemInput,
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
  Specialty,
  Service,
  Transaction,
  TransactionCategory,
  User,
} from "@/types";
import type { Invoice, InvoiceFormData } from "@/types/invoice";
import type { ApuracaoMensal, ApuracaoResumo } from "@/types/apuracao";
import type { TaxRegime } from "@/types/fiscal";
import type {
  WhatsAppConfigRequest,
  WhatsAppConfigResponse,
  WhatsAppEmbeddedSignupCompleteRequest,
  WhatsAppEmbeddedSignupStatusResponse,
  WhatsAppTestResponse,
} from "@/types/whatsapp";
import type { CurrentMenuPermissionsResponse } from "@/types/menu-permissions";
import type {
  AdminBillingActionResponse,
  CommercialOverview,
  EmailTemplateDetailResponse,
  EmailTemplateListResponse,
  EmailTemplatePreviewResponse,
  EmailTemplateStatusUpdateRequest,
  EmailTemplateUpsertRequest,
  GlobalAuditDetail,
  BulkMenuOverrideRequest,
  GlobalAuditListResponse,
  GlobalSuggestionListResponse,
  MenuCatalogItem,
  MenuCatalogItemRequest,
  MenuCatalogResponse,
  MenuConfigScope,
  RevokeSessionsResponse,
  SessionListResponse,
  SuggestionUpdateRequest,
  MenuRoleRoutesResponse,
  SystemPlanItem,
  SystemPlanListResponse,
  SystemPlanUpsertRequest,
  SystemAdminRole,
} from "@/types/system-admin";
import type {
  SuggestionCreateRequest,
  SuggestionItem,
  SuggestionListResponse,
} from "@/types/suggestion";
import type {
  AppNotification,
  NotificationsCursor,
  NotificationsFilters,
  NotificationsListResponse,
} from "@/types/notification";
import type {
  AppointmentConflictDetails,
  AppointmentSchedulingSettings,
  AvailableSlotsParams,
  ManualTimeSlotResponse,
  TimeSlotResponse,
} from "@/types/available-slots";
import type {
  CheckoutConfirmResponse,
  CheckoutIntentRequest,
  CheckoutIntentResponse,
  CheckoutProduct,
} from "@/types/checkout";
import type {
  CreateBillingSubscriptionRequest,
  CreateBillingSubscriptionResponse,
  BillingPaymentItem,
  BillingPaymentsResponse,
} from "@/types/billing";
import type {
  AuditEventDetailDto,
  AuditEventListItemDto,
  AuditExportRequestDto,
  AuditExportResponseDto,
  AuditFiltersOptionsDto,
  AuditRetentionListResponseDto,
  AuditRetentionQueryDto,
  AuditSearchQueryDto,
  AuditSearchResponseDto,
  AuditStatus,
} from "@/types/auditoria";
import type {
  LegalDocumentResponse,
  LgpdContactResponse,
  PublicLegalResponse,
} from "@/types/terms";
import type {
  CreateLgpdRequestPayload,
  LgpdRequestDetail,
  LgpdRequestItem,
  LgpdRequestStatus,
  UpdateLgpdRequestStatusPayload,
} from "@/types/lgpd";
import type {
  CreateStockInventoryRequest,
  CreateStockItemRequest,
  CreateStockPurchaseOrderRequest,
  CreateStockTransferRequest,
  CreateStockSupplierRequest,
  ReceiveStockPurchaseOrderRequest,
  StockInventory,
  StockInventoryCountRequest,
  StockPurchaseOrder,
  StockSettings,
  StockSupplier,
  StockTransfer,
  CreateStockMovementRequest,
  StockDashboardResponse,
  StockImportErrorLine,
  StockImportJob,
  StockImportTemplateFormat,
  StockImportType,
  StockItem,
  StockMovement,
} from "@/types/stock";
import type {
  ClientImportErrorLine,
  ClientImportJob,
  ClientImportMode,
  ClientImportTemplateFormat,
} from "@/types/client-import";
import type {
  ServiceImportErrorLine,
  ServiceImportJob,
  ServiceImportMode,
  ServiceImportTemplateFormat,
} from "@/types/service-import";
import type {
  ChatAppointmentMarker,
  ChatConversation,
  ChatConversationListResponse,
  ChatMessage,
  ChatMessageListResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
} from "@/types/chat";
import type {
  CommissionAdjustmentRequest,
  CommissionAdjustmentResponse,
  CommissionCycleListResponse,
  CommissionCycleResponse,
  CommissionEntryStatus,
  CommissionProfessionalReportResponse,
  CommissionReportResponse,
  CommissionRuleSetListResponse,
  CommissionRuleSetResponse,
  CommissionRuleSetUpsertRequest,
} from "@/types/commission";
import {
  isLicenseAccessBlocked,
  setLicenseAccessStatus,
  type LicenseAccessStatus,
} from "@/lib/license-access";
import { toast } from "sonner";

export type {
  Appointment,
  AppointmentManagementReportResponse,
  AppointmentDetailResponse,
  AppointmentCustomerNote,
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
  Specialty,
  Service,
  Transaction,
  User,
};

export type AppointmentCreateRequest = {
  clientId: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime?: string;
  status?: Appointment["status"];
  notes?: string;
  serviceId?: string;
  totalPrice?: number;
  items?: AppointmentCreateItemInput[];
  origin?: string;
  allowConflict?: boolean;
  conflictAcknowledged?: boolean;
};

export type AppointmentCustomerNoteRequest = {
  serviceExecutionNotes?: string;
  clientFeedbackNotes?: string;
  internalFollowupNotes?: string;
};

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

export type AppointmentMonthlyMetric = {
  dia: number;
  mes: number;
  quantidadeAgendamentos: number;
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

export type AppointmentManagementReportParams = {
  from?: string;
  to?: string;
  professionalId?: string;
  serviceId?: string;
  status?: string;
  limit?: number;
};

export type ListResponse<T> =
  | T[]
  | {
      items: T[];
      total?: number;
      page?: number;
      pageSize?: number;
      hasMore?: boolean;
    };

export type DashboardProfessionalMetricsResponse = {
  startDate: string;
  endDate: string;
  professionalId: string;
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

export type StandardApiErrorPayload = {
  code?: string;
  error?: string;
  message?: string;
  details?: unknown;
  timestamp?: string;
  path?: string;
};

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8080/api/v1";
const USER_KEY = "auth_user";
const SESSION_EXPIRED_REASON_KEY = "azzo_session_expired_reason";

let refreshPromise: Promise<boolean> | null = null;
let isForcingLogout = false;
let lastPlanExpiredToastAt = 0;

export class ApiError extends Error {
  status?: number;
  details?: unknown;
  code?: string;

  constructor(message: string, status?: number, details?: unknown, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export const isPlanExpiredApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  (error.status === 402 || String(error.code || "").toUpperCase() === "PLAN_EXPIRED");

const getErrorPayload = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  let errorMessage =
    response.status === 401
      ? "Sessao expirada ou token invalido. Faca login novamente."
      : response.status === 403
      ? "Voce nao tem permissao para executar esta acao."
      : response.status === 404
      ? "Recurso nao encontrado."
      : response.status === 409
      ? "Conflito de regra de negocio."
      : response.status === 429
      ? "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."
      : "Erro na requisicao";
  let errorDetails: unknown = null;
  let errorCode: string | undefined;

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    errorDetails = data;
    if (data && typeof data === "object") {
      const typed = data as StandardApiErrorPayload;
      const maybeMessage = typed.message;
      const maybeError = typed.error;
      const maybeCode = typed.code || typed.error;
      errorMessage = maybeMessage || maybeError || errorMessage;
      errorCode = maybeCode;
    }
  } else {
    const text = await response.text();
    errorDetails = text;
    if (text) errorMessage = text;
  }

  return { errorMessage, errorDetails, errorCode };
};

const notifyPlanExpired = (message: string) => {
  const now = Date.now();
  if (now - lastPlanExpiredToastAt < 8000) return;
  lastPlanExpiredToastAt = now;
  toast.error(message);
};

const setPlanExpiredBlocked = (blocked: boolean) => {
  setLicenseAccessStatus(blocked ? "BLOCKED" : "ACTIVE");
};

const ALLOWED_ENDPOINT_PREFIXES_WHEN_PLAN_BLOCKED = [
  "/billing/subscriptions/current",
  "/billing/subscriptions",
  "/billing/payments",
  "/checkout/products",
  "/auth/me",
  "/auth/logout",
  "/config/menus/current",
];

const isAllowedWhenPlanBlocked = (endpoint: string) =>
  ALLOWED_ENDPOINT_PREFIXES_WHEN_PLAN_BLOCKED.some((prefix) => endpoint.startsWith(prefix));

const PUBLIC_ENDPOINT_PREFIXES = [
  "/checkout/products",
  "/checkout/intents",
  "/public/",
];

const isPublicEndpoint = (endpoint: string) =>
  PUBLIC_ENDPOINT_PREFIXES.some((prefix) => endpoint.startsWith(prefix));

const buildListQuery = (params?: ListQueryParams) => {
  const query = new URLSearchParams();
  if (!params) return query;
  if (typeof params.page === "number" && params.page > 0) {
    query.set("page", String(params.page));
  }
  if (typeof params.limit === "number" && params.limit > 0) {
    query.set("limit", String(params.limit));
  }
  if (typeof params.search === "string" && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  return query;
};

const saveSession = (user?: User | null) => {
  // Cache apenas para UX (ex.: dados imediatos de perfil); nao define autenticacao.
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (String(user.role || "").toUpperCase() === "ADMIN") {
      setLicenseAccessStatus("ACTIVE");
    }
  }
};

const clearSession = () => {
  localStorage.removeItem(USER_KEY);
  setLicenseAccessStatus("UNKNOWN");
};

const isCurrentUserAdmin = () => {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { role?: string };
    return String(parsed?.role || "").toUpperCase() === "ADMIN";
  } catch {
    return false;
  }
};

const hasSessionUserHint = () => {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(USER_KEY));
  } catch {
    return false;
  }
};

const isPublicAppRoute = () => {
  if (typeof window === "undefined") return false;
  const pathname = window.location.pathname || "";
  return (
    pathname === "/compras" ||
    pathname.startsWith("/compras/") ||
    pathname === "/success" ||
    pathname === "/error" ||
    pathname === "/agendar" ||
    pathname.startsWith("/agendar/")
  );
};

const shouldAttemptAuthRefresh = (endpoint: string) =>
  !isPublicEndpoint(endpoint) && hasSessionUserHint();

const forceLogoutToLogin = (reason: string) => {
  clearSession();
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_EXPIRED_REASON_KEY, reason);
  } catch {
    // ignore storage errors
  }
  if (isForcingLogout) return;
  isForcingLogout = true;
  const target = "/login?reason=session-expired";
  if (window.location.pathname !== "/login") {
    window.location.assign(target);
    return;
  }
  window.dispatchEvent(new CustomEvent("azzo:session-expired", { detail: { reason } }));
};

const refreshAccessToken = async (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Falha ao renovar token");
      }
      return true;
    })()
      .catch(() => {
        if (!isPublicAppRoute()) {
          forceLogoutToLogin("Sessao expirada. Faca login novamente.");
        }
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const refreshLicenseAccessStatus = async (): Promise<LicenseAccessStatus> => {
  if (typeof window === "undefined") return "UNKNOWN";
  
  if (isCurrentUserAdmin()) {
    setLicenseAccessStatus("ACTIVE");
    return "ACTIVE";
  }

  try {
    const response = await fetch(`${API_URL}/billing/subscriptions/current`, {
      credentials: "include",
    });

    if (response.status === 402) {
      setLicenseAccessStatus("BLOCKED");
      return "BLOCKED";
    }
    if (!response.ok) {
      setLicenseAccessStatus("UNKNOWN");
      return "UNKNOWN";
    }

    const payload = (await response.json()) as {
      status?: string | null;
      licenseStatus?: string | null;
      paymentStatus?: string | null;
      currentPaymentStatus?: string | null;
    };

    const status = String(payload.status || "").toUpperCase();
    const licenseStatus = String(payload.licenseStatus || "").toUpperCase();
    const paymentStatus = String(payload.currentPaymentStatus || payload.paymentStatus || "").toUpperCase();
    const blocked =
      licenseStatus === "EXPIRED" ||
      status === "EXPIRED" ||
      status === "OVERDUE" ||
      paymentStatus === "OVERDUE";

    setLicenseAccessStatus(blocked ? "BLOCKED" : "ACTIVE");
    return blocked ? "BLOCKED" : "ACTIVE";
  } catch {
    setLicenseAccessStatus("UNKNOWN");
    return "UNKNOWN";
  }
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryOnAuthError = true
): Promise<T> => {
  

  if (!isCurrentUserAdmin() && isLicenseAccessBlocked() && !isAllowedWhenPlanBlocked(endpoint)) {
    throw new ApiError(
      "Plano vencido. Regularize o pagamento para continuar.",
      402,
      { error: "PLAN_EXPIRED" },
      "PLAN_EXPIRED"
    );
  }

  const headers = new Headers(options.headers || {});
  const hasBody = typeof options.body !== "undefined" && options.body !== null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData) {
    headers.set("Content-Type", "application/json");
  } else if (isFormData) {
    headers.delete("Content-Type");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      retryOnAuthError &&
      endpoint !== "/auth/refresh" &&
      endpoint !== "/auth/login" &&
      endpoint !== "/auth/register" &&
      endpoint !== "/auth/me" &&
      shouldAttemptAuthRefresh(endpoint)
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request<T>(endpoint, options, false);
      }
    }

    const { errorMessage, errorDetails, errorCode } = await getErrorPayload(response);

    if (
      response.status === 402 &&
      (
        (errorDetails &&
          typeof errorDetails === "object" &&
          (errorDetails as { error?: string }).error === "PLAN_EXPIRED") ||
        errorCode === "PLAN_EXPIRED"
      )
    ) {
      setPlanExpiredBlocked(true);
      notifyPlanExpired(errorMessage);
    }

    throw new ApiError(errorMessage, response.status, errorDetails, errorCode);
  }

  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
};

const requestBlob = async (
  endpoint: string,
  options: RequestInit = {},
  retryOnAuthError = true
): Promise<Blob> => {
  if (!isCurrentUserAdmin() && isLicenseAccessBlocked() && !isAllowedWhenPlanBlocked(endpoint)) {
    throw new ApiError(
      "Plano vencido. Regularize o pagamento para continuar.",
      402,
      { error: "PLAN_EXPIRED" },
      "PLAN_EXPIRED"
    );
  }

  const headers = new Headers(options.headers || {});

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      retryOnAuthError &&
      endpoint !== "/auth/refresh" &&
      endpoint !== "/auth/login" &&
      endpoint !== "/auth/register" &&
      endpoint !== "/auth/me" &&
      shouldAttemptAuthRefresh(endpoint)
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return requestBlob(endpoint, options, false);
      }
    }

    const { errorMessage, errorCode, errorDetails } = await getErrorPayload(response);

    if (response.status === 402 && errorCode === "PLAN_EXPIRED") {
      setPlanExpiredBlocked(true);
      notifyPlanExpired(errorMessage);
    }

    throw new ApiError(errorMessage, response.status, errorDetails, errorCode);
  }

  return response.blob();
};


/* ================= AUTH ================= */

type AuthResponse = {
  user?: User;
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

export const authApi = {
  async login(email: string, password: string, mfaCode?: string) {
    const data = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, mfaCode }),
    });

    saveSession(data.user || null);

    return {
      ...data,
      user: data.user,
    };
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    salonName: string;
    phone: string;
    cpfCnpj: string;
    acceptedTermsOfUse: boolean;
    acceptedPrivacyPolicy: boolean;
    termsOfUseVersion: string;
    privacyPolicyVersion: string;
  }) {
    const response = await request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    saveSession(response.user || null);

    return {
      ...response,
      user: response.user,
    };
  },

  async me() {
    
    const user = await request<User>("/auth/me");
    saveSession(user);
    return user;
  },

  async logout() {
    try {
      await request<void>("/auth/logout", { method: "DELETE" }, false);
    } catch {
      // Mesmo com erro no backend, limpar sessao local.
    }
    clearSession();
  },

  async forgotPassword(email: string) {
    return request<{ message: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
      false
    );
  },

  async resetPassword(token: string, password: string) {
    return request<{ message: string }>(
      "/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ token, password }),
      },
      false
    );
  },
};

/* ================= DASHBOARD ================= */

export const dashboardApi = {
  getMetrics: () => request<DashboardMetrics>("/dashboard/metrics"),
  getProfessionalMetrics: (start: string, end: string, professionalId: string) =>
    request<DashboardProfessionalMetricsResponse>(
      `/dashboard/metrics/professional?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&professionalId=${encodeURIComponent(professionalId)}`
    ),
  getServicesMetrics: (start: string, end: string, professionalId?: string) => {
    const query = new URLSearchParams({
      start,
      end,
    });
    if (professionalId) query.set("professionalId", professionalId);
    return request<DashboardServicesMetricsResponse>(
      `/dashboard/metrics/services?${query.toString()}`
    );
  },
  getWeeklyRevenue: (start: string, end: string) =>
    request<{
      points: Array<{ day: string; date: string; value: number }>;
      total: number;
      average: number;
    }>(`/dashboard/revenue/weekly?start=${start}&end=${end}`),
  getCustomerMetrics: (start: string, end: string, limit = 10) =>
    request<DashboardCustomerRankingResponse>(
      `/dashboard/metrics/customers?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=${encodeURIComponent(String(limit))}`
    ),
  getNoShowInsights: () =>
    request<DashboardNoShowInsightsResponse>("/dashboard/metrics/no-show"),
  getWhatsAppReactivationMetrics: (days = 30) =>
    request<DashboardWhatsAppReactivationResponse>(
      `/dashboard/metrics/whatsapp-reactivation?days=${encodeURIComponent(String(days))}`
    ),
  getWhatsAppReactivationQueue: (params?: { days?: number; status?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.days) query.set("days", String(params.days));
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<DashboardWhatsAppReactivationQueueResponse>(
      `/dashboard/metrics/whatsapp-reactivation/queue${suffix}`
    );
  },
};

/* ================= CHAT ================= */

export const chatApi = {
  listConversations: (params?: { page?: number; pageSize?: number; todayOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const base = params?.todayOnly ? "/chat/conversations/today" : "/chat/conversations";
    return request<ChatConversationListResponse>(`${base}${suffix}`);
  },
  listMessages: (conversationId: string, params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ChatMessageListResponse>(`/chat/conversations/${conversationId}/messages${suffix}`);
  },
  sendMessage: (payload: SendChatMessageRequest) =>
    request<SendChatMessageResponse>("/chat/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAppointmentMarker: (conversationId: string, appointmentMarker: ChatAppointmentMarker) =>
    request<{ conversationId: string; appointmentMarker: ChatAppointmentMarker; updatedAt: string }>(
      `/chat/conversations/${conversationId}/appointment-marker`,
      {
        method: "PATCH",
        body: JSON.stringify({ appointmentMarker }),
      }
    ),
};

const appendMultiValues = (query: URLSearchParams, key: string, values?: string[]) => {
  if (!values?.length) return;
  values.forEach((value) => {
    if (value?.trim()) query.append(key, value.trim());
  });
};

const buildAuditoriaSearchQuery = (filters: AuditSearchQueryDto) => {
  const query = new URLSearchParams();
  query.set("from", filters.from);
  query.set("to", filters.to);
  appendMultiValues(query, "modules", filters.modules);
  appendMultiValues(query, "actions", filters.actions);
  appendMultiValues(query, "statuses", filters.statuses);
  appendMultiValues(query, "entityTypes", filters.entityTypes);
  appendMultiValues(query, "actorUserIds", filters.actorUserIds);
  appendMultiValues(query, "sourceChannels", filters.sourceChannels);
  if (filters.entityId?.trim()) query.set("entityId", filters.entityId.trim());
  if (filters.requestId?.trim()) query.set("requestId", filters.requestId.trim());
  if (filters.ip?.trim()) query.set("ip", filters.ip.trim());
  if (filters.text?.trim()) query.set("text", filters.text.trim());
  if (typeof filters.hasChanges === "boolean") query.set("hasChanges", String(filters.hasChanges));
  if (filters.cursor?.trim()) query.set("cursor", filters.cursor.trim());
  if (filters.limit) query.set("limit", String(filters.limit));
  if (filters.sortBy) query.set("sortBy", filters.sortBy);
  if (filters.sortDir) query.set("sortDir", filters.sortDir);
  return query;
};

export const auditoriaApi = {
  listEvents: (filters: AuditSearchQueryDto) =>
    request<AuditSearchResponseDto>(`/auditoria/events?${buildAuditoriaSearchQuery(filters)}`),
  getEventDetail: (id: string) =>
    request<AuditEventDetailDto>(`/auditoria/events/${id}`),
  exportEvents: (payload: AuditExportRequestDto) =>
    request<AuditExportResponseDto>("/auditoria/events/export", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getFilterOptions: (from?: string, to?: string) => {
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<AuditFiltersOptionsDto>(`/auditoria/filters/options${suffix}`);
  },
  listRetentionEvents: (filters: AuditRetentionQueryDto) => {
    const query = new URLSearchParams({
      from: filters.from,
      to: filters.to,
    });
    if (filters.policyVersion?.trim()) query.set("policyVersion", filters.policyVersion.trim());
    if (filters.executionId?.trim()) query.set("executionId", filters.executionId.trim());
    if (filters.cursor?.trim()) query.set("cursor", filters.cursor.trim());
    if (filters.limit) query.set("limit", String(filters.limit));
    return request<AuditRetentionListResponseDto>(
      `/auditoria/retention/events?${query.toString()}`
    );
  },
};

/* ================= SERVICES ================= */

export const servicesApi = {
  getAll: (params?: ListQueryParams) => {
    const query = buildListQuery(params);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<Service>>(`/services${suffix}`);
  },
  create: (data: Partial<Service>) =>
    request<Service>("/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Service>) =>
    request<Service>(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/services/${id}`, {
      method: "DELETE",
    }),
};

/* ================= PROFESSIONALS ================= */

export const professionalsApi = {
  getAll: (params?: ListQueryParams) => {
    const query = buildListQuery(params);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<Professional>>(`/professionals${suffix}`);
  },
  getById: (id: string) => request<Professional>(`/professionals/${id}`),
  getLimits: () => request<ProfessionalLimits>("/professionals/limits"),
  create: (data: Partial<Professional>) =>
    request<Professional>("/professionals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Professional>) =>
    request<Professional>(`/professionals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/professionals/${id}`, {
      method: "DELETE",
    }),
  resetPassword: (id: string) =>
    request<{
      professionalId: string;
      userId: string;
      email: string;
      message: string;
    }>(`/professionals/${id}/reset-password`, {
      method: "POST",
    }),
};

export const specialtiesApi = {
  getAll: () => request<Specialty[]>("/specialties"),
  create: (data: { name: string; description?: string | null }) =>
    request<Specialty>("/specialties", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name: string; description?: string | null }) =>
    request<Specialty>(`/specialties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/specialties/${id}`, {
      method: "DELETE",
    }),
};

/* ================= CLIENTS ================= */

export const clientsApi = {
  getAll: (params?: ListQueryParams) => {
    const query = buildListQuery(params);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<Client>>(`/clients${suffix}`);
  },
  getById: (id: string) => request<Client>(`/clients/${id}`),
  getAppointmentHistory: (
    id: string,
    page = 0,
    size = 20,
    filters?: {
      from?: string;
      to?: string;
      serviceId?: string;
    }
  ) => {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (filters?.from) query.set("from", filters.from);
    if (filters?.to) query.set("to", filters.to);
    if (filters?.serviceId) query.set("serviceId", filters.serviceId);
    return request<ClientAppointmentHistoryResponse>(`/clients/${id}/appointment-history?${query.toString()}`);
  },
  create: (data: Partial<Client>) =>
    request<Client>("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Client>) =>
    request<Client>(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/clients/${id}`, {
      method: "DELETE",
    }),
};

/* ================= APPOINTMENTS ================= */

export const appointmentsApi = {
  getAll: (params?: AppointmentsListParams) => {
    const query = buildListQuery(params);
    if (params?.date) query.set("date", params.date);
    if (params?.professionalId && params.professionalId !== "all") {
      query.set("professionalId", params.professionalId);
    }
    if (params?.status && params.status !== "all") {
      query.set("status", params.status);
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<Appointment>>(`/appointments${suffix}`);
  },
  getById: (id: string) => request<AppointmentDetailResponse>(`/appointments/${id}`),
  create: (data: AppointmentCreateRequest) =>
    request<Appointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAvailableSlots: (params: AvailableSlotsParams) => {
    const query = new URLSearchParams({
      professionalId: params.professionalId,
      date: params.date,
      bufferMinutes: String(params.bufferMinutes ?? 0),
    });
    if (params.serviceIds?.length) {
      query.set("serviceIds", params.serviceIds.join(","));
    } else if (params.serviceDurationMinutes && params.serviceDurationMinutes > 0) {
      query.set("serviceDurationMinutes", String(params.serviceDurationMinutes));
    }
    return request<TimeSlotResponse[]>(`/appointments/available-slots?${query.toString()}`);
  },
  getManualSlots: (params: AvailableSlotsParams) => {
    const query = new URLSearchParams({
      professionalId: params.professionalId,
      date: params.date,
      bufferMinutes: String(params.bufferMinutes ?? 0),
    });
    if (params.serviceIds?.length) {
      query.set("serviceIds", params.serviceIds.join(","));
    } else if (params.serviceDurationMinutes && params.serviceDurationMinutes > 0) {
      query.set("serviceDurationMinutes", String(params.serviceDurationMinutes));
    }
    return request<ManualTimeSlotResponse[]>(`/appointments/manual-slots?${query.toString()}`);
  },
  getSettings: () => request<AppointmentSchedulingSettings>("/appointments/settings"),
  updateSettings: (payload: Partial<AppointmentSchedulingSettings>) =>
    request<AppointmentSchedulingSettings>("/appointments/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getMonthlyMetric: (mes: number, ano: number) =>
    request<AppointmentMonthlyMetric[]>(`/appointments/metric?mes=${mes}&ano=${ano}`),
  getManagementReport: (params?: AppointmentManagementReportParams) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.professionalId && params.professionalId !== "all") {
      query.set("professionalId", params.professionalId);
    }
    if (params?.serviceId && params.serviceId !== "all") {
      query.set("serviceId", params.serviceId);
    }
    if (params?.status && params.status !== "all") {
      query.set("status", params.status);
    }
    if (params?.limit) {
      query.set("limit", String(params.limit));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<AppointmentManagementReportResponse>(`/appointments/management-report${suffix}`);
  },
  exportManagementReport: (params?: AppointmentManagementReportParams) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.professionalId && params.professionalId !== "all") {
      query.set("professionalId", params.professionalId);
    }
    if (params?.serviceId && params.serviceId !== "all") {
      query.set("serviceId", params.serviceId);
    }
    if (params?.status && params.status !== "all") {
      query.set("status", params.status);
    }
    if (params?.limit) {
      query.set("limit", String(params.limit));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return requestBlob(`/appointments/management-report/export${suffix}`);
  },
  getNoShowReport: (params?: NoShowReportParams) => {
    const query = new URLSearchParams();
    if (params?.afterId) query.set("afterId", params.afterId);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.professionalId && params.professionalId !== "all") {
      query.set("professionalId", params.professionalId);
    }
    if (params?.serviceId && params.serviceId !== "all") {
      query.set("serviceId", params.serviceId);
    }
    if (params?.clientIds?.length) {
      query.set("clientIds", params.clientIds.join(","));
    }
    if (params?.clientQuery?.trim()) {
      query.set("clientQuery", params.clientQuery.trim());
    }
    if (params?.groupBy) {
      query.set("groupBy", params.groupBy);
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<NoShowReportPageResponse>(`/appointments/no-show${suffix}`);
  },
  exportNoShowReport: (params?: Omit<NoShowReportParams, "afterId" | "limit">) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.professionalId && params.professionalId !== "all") {
      query.set("professionalId", params.professionalId);
    }
    if (params?.serviceId && params.serviceId !== "all") {
      query.set("serviceId", params.serviceId);
    }
    if (params?.clientIds?.length) {
      query.set("clientIds", params.clientIds.join(","));
    }
    if (params?.clientQuery?.trim()) {
      query.set("clientQuery", params.clientQuery.trim());
    }
    if (params?.groupBy) {
      query.set("groupBy", params.groupBy);
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return requestBlob(`/appointments/no-show/export${suffix}`);
  },
  updateStatus: (id: string, status: string) =>
    request<Appointment>(`/appointments/${id}/status?value=${status}`, {
      method: "PATCH",
    }),
  addCustomerNote: (appointmentId: string, payload: AppointmentCustomerNoteRequest) =>
    request<AppointmentCustomerNote>(`/appointments/${appointmentId}/customer-notes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCustomerNote: (appointmentId: string, noteId: string, payload: AppointmentCustomerNoteRequest) =>
    request<AppointmentCustomerNote>(`/appointments/${appointmentId}/customer-notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  reassignProfessional: (appointmentId: string, professionalId: string) =>
    request<Appointment>(
      `/appointments/${appointmentId}/reassign-professional?professionalId=${encodeURIComponent(professionalId)}`,
      {
        method: "PATCH",
      }
    ),
  delete: (id: string) =>
    request<void>(`/appointments/${id}`, {
      method: "DELETE",
    }),
};

/* ================= STOCK ================= */

export const stockApi = {
  getItems: (
    params?: ListQueryParams & {
      ativo?: boolean;
      abaixoMinimo?: boolean;
      cursorCreatedAt?: string;
      cursorId?: string;
    }
  ) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    if (typeof params?.ativo === "boolean") query.set("ativo", String(params.ativo));
    if (typeof params?.abaixoMinimo === "boolean") {
      query.set("abaixoMinimo", String(params.abaixoMinimo));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<StockItem>>(`/estoque/itens${suffix}`);
  },
  getItemById: (id: string) => request<StockItem>(`/estoque/itens/${id}`),
  createItem: (payload: CreateStockItemRequest) =>
    request<StockItem>("/estoque/itens", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateItem: (id: string, payload: Partial<CreateStockItemRequest>) =>
    request<StockItem>(`/estoque/itens/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getMovements: (
    params?: ListQueryParams & { itemId?: string; tipo?: string; cursorCreatedAt?: string; cursorId?: string }
  ) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    if (params?.itemId) query.set("itemId", params.itemId);
    if (params?.tipo) query.set("tipo", params.tipo);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<StockMovement>>(`/estoque/movimentacoes${suffix}`);
  },
  createMovement: (payload: CreateStockMovementRequest) =>
    request<StockMovement>("/estoque/movimentacoes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getDashboard: (params?: { inicio?: string; fim?: string; serviceId?: string; itemId?: string }) => {
    const query = new URLSearchParams();
    if (params?.inicio) query.set("inicio", params.inicio);
    if (params?.fim) query.set("fim", params.fim);
    if (params?.serviceId) query.set("serviceId", params.serviceId);
    if (params?.itemId) query.set("itemId", params.itemId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<StockDashboardResponse>(`/estoque/dashboard${suffix}`);
  },
  listInventories: (params?: ListQueryParams & { cursorCreatedAt?: string; cursorId?: string }) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<StockInventory[]>(`/estoque/inventarios${suffix}`);
  },
  createInventory: (payload: CreateStockInventoryRequest) =>
    request<StockInventory>("/estoque/inventarios", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getInventoryById: (id: string) => request<StockInventory>(`/estoque/inventarios/${id}`),
  registerInventoryCount: (id: string, payload: StockInventoryCountRequest) =>
    request<StockInventory>(`/estoque/inventarios/${id}/contagens`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  closeInventory: (id: string) =>
    request<StockInventory>(`/estoque/inventarios/${id}/fechamento`, {
      method: "POST",
    }),
  listSuppliers: (params?: ListQueryParams & { cursorCreatedAt?: string; cursorId?: string }) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<StockSupplier[]>(`/estoque/fornecedores${suffix}`);
  },
  createSupplier: (payload: CreateStockSupplierRequest) =>
    request<StockSupplier>("/estoque/fornecedores", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateSupplier: (id: string, payload: Partial<CreateStockSupplierRequest>) =>
    request<StockSupplier>(`/estoque/fornecedores/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  listPurchaseOrders: (params?: ListQueryParams & { cursorCreatedAt?: string; cursorId?: string }) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<StockPurchaseOrder[]>(`/estoque/pedidos-compra${suffix}`);
  },
  createPurchaseOrder: (payload: CreateStockPurchaseOrderRequest) =>
    request<StockPurchaseOrder>("/estoque/pedidos-compra", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getPurchaseOrderById: (id: string) => request<StockPurchaseOrder>(`/estoque/pedidos-compra/${id}`),
  receivePurchaseOrder: (id: string, payload: ReceiveStockPurchaseOrderRequest) =>
    request<StockPurchaseOrder>(`/estoque/pedidos-compra/${id}/recebimento`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listTransfers: (params?: ListQueryParams & { cursorCreatedAt?: string; cursorId?: string }) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<StockTransfer[]>(`/estoque/transferencias${suffix}`);
  },
  createTransfer: (payload: CreateStockTransferRequest) =>
    request<StockTransfer>("/estoque/transferencias", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendTransfer: (id: string) =>
    request<StockTransfer>(`/estoque/transferencias/${id}/enviar`, {
      method: "POST",
    }),
  receiveTransfer: (id: string) =>
    request<StockTransfer>(`/estoque/transferencias/${id}/receber`, {
      method: "POST",
    }),
  getSettings: () => request<StockSettings>("/estoque/configuracoes"),
  updateSettings: (payload: Partial<StockSettings>) =>
    request<StockSettings>("/estoque/configuracoes", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  listImportJobs: () => request<StockImportJob[]>("/estoque/importacoes"),
  downloadImportTemplate: (params: {
    tipoImportacao: StockImportType;
    formato?: StockImportTemplateFormat;
  }) => {
    const query = new URLSearchParams();
    query.set("tipoImportacao", params.tipoImportacao);
    query.set("formato", params.formato ?? "xlsx");
    return requestBlob(`/estoque/importacoes/modelo?${query.toString()}`);
  },
  createImportJob: (params: { arquivo: File; tipoImportacao: StockImportType; dryRun?: boolean }) => {
    const query = new URLSearchParams();
    query.set("tipoImportacao", params.tipoImportacao);
    if (typeof params.dryRun === "boolean") query.set("dryRun", String(params.dryRun));
    const formData = new FormData();
    formData.append("arquivo", params.arquivo);
    return request<StockImportJob>(`/estoque/importacoes?${query.toString()}`, {
      method: "POST",
      body: formData,
    });
  },
  getImportJobById: (jobId: string) => request<StockImportJob>(`/estoque/importacoes/${jobId}`),
  getImportErrors: (jobId: string) =>
    request<StockImportErrorLine[]>(`/estoque/importacoes/${jobId}/erros`),
  getImportResultFile: (jobId: string) =>
    request<{ downloadUrl: string; expiresAt: string }>(
      `/estoque/importacoes/${jobId}/arquivo-resultado`
    ),
  cancelImportJob: (jobId: string) =>
    request<StockImportJob>(`/estoque/importacoes/${jobId}/cancelar`, {
      method: "POST",
    }),
};

export const clientImportApi = {
  listImportJobs: () => request<ClientImportJob[]>("/clients/importacoes"),
  downloadImportTemplate: (params?: { formato?: ClientImportTemplateFormat }) => {
    const query = new URLSearchParams();
    query.set("formato", params?.formato ?? "xlsx");
    return requestBlob(`/clients/importacoes/modelo?${query.toString()}`);
  },
  createImportJob: (params: { arquivo: File; modoImportacao: ClientImportMode; dryRun?: boolean }) => {
    const formData = new FormData();
    formData.append("arquivo", params.arquivo);
    formData.append("modoImportacao", params.modoImportacao);
    if (typeof params.dryRun === "boolean") formData.append("dryRun", String(params.dryRun));
    return request<ClientImportJob>("/clients/importacoes", {
      method: "POST",
      body: formData,
    });
  },
  getImportJobById: (jobId: string) => request<ClientImportJob>(`/clients/importacoes/${jobId}`),
  getImportErrors: (jobId: string) =>
    request<ClientImportErrorLine[]>(`/clients/importacoes/${jobId}/erros`),
  cancelImportJob: (jobId: string) =>
    request<ClientImportJob>(`/clients/importacoes/${jobId}/cancelar`, {
      method: "POST",
    }),
};

export const serviceImportApi = {
  listImportJobs: () => request<ServiceImportJob[]>("/services/importacoes"),
  downloadImportTemplate: (params?: { formato?: ServiceImportTemplateFormat }) => {
    const query = new URLSearchParams();
    query.set("formato", params?.formato ?? "xlsx");
    return requestBlob(`/services/importacoes/modelo?${query.toString()}`);
  },
  createImportJob: (params: { arquivo: File; modoImportacao: ServiceImportMode; dryRun?: boolean }) => {
    const formData = new FormData();
    formData.append("arquivo", params.arquivo);
    formData.append("modoImportacao", params.modoImportacao);
    if (typeof params.dryRun === "boolean") formData.append("dryRun", String(params.dryRun));
    return request<ServiceImportJob>("/services/importacoes", {
      method: "POST",
      body: formData,
    });
  },
  getImportJobById: (jobId: string) => request<ServiceImportJob>(`/services/importacoes/${jobId}`),
  getImportErrors: (jobId: string) =>
    request<ServiceImportErrorLine[]>(`/services/importacoes/${jobId}/erros`),
  cancelImportJob: (jobId: string) =>
    request<ServiceImportJob>(`/services/importacoes/${jobId}/cancelar`, {
      method: "POST",
    }),
};

/* ================= FINANCE ================= */

export type TransactionListParams = {
  from?: string;
  to?: string;
  type?: string;
  categoryId?: string;
  paymentMethod?: string;
  professionalId?: string;
  reconciled?: string;
  page?: number;
  limit?: number;
};

export type TransactionPagedResponse = {
  items: Transaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
};

export const transactionsApi = {
  getAll: (params?: TransactionListParams) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.type) query.set("type", params.type);
    if (params?.categoryId) query.set("categoryId", params.categoryId);
    if (params?.paymentMethod) query.set("paymentMethod", params.paymentMethod);
    if (params?.professionalId) query.set("professionalId", params.professionalId);
    if (params?.reconciled) query.set("reconciled", params.reconciled);
    if (typeof params?.page === "number") query.set("page", String(params.page));
    if (typeof params?.limit === "number") query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<TransactionPagedResponse>(`/finance/transactions${suffix}`);
  },
  getSummary: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<{ totalIncome: number; totalExpenses: number; balance: number }>(
      `/finance/transactions/summary${suffix}`
    );
  },
  create: (data: Partial<Transaction>) =>
    request<Transaction>("/finance/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Transaction>) =>
    request<Transaction>(`/finance/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  reconcile: (id: string) =>
    request<Transaction>(`/finance/transactions/${id}/reconcile`, {
      method: "PATCH",
    }),
  delete: (id: string) =>
    request<void>(`/finance/transactions/${id}`, {
      method: "DELETE",
    }),
  exportCsv: (params?: { from?: string; to?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.type) query.set("type", params.type);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return requestBlob(`/finance/transactions/export${suffix}`);
  },
  getCashFlow: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Array<{ date: string; income: number; expenses: number; balance: number }>>(
      `/finance/transactions/cash-flow${suffix}`
    );
  },
};

export const transactionCategoriesApi = {
  getAll: () => request<Array<TransactionCategory & { transactionCount: number }>>("/finance/transactions/categories"),
  create: (name: string) =>
    request<TransactionCategory & { transactionCount: number }>("/finance/transactions/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  update: (id: string, name: string) =>
    request<TransactionCategory & { transactionCount: number }>(`/finance/transactions/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),
  delete: (id: string) =>
    request<void>(`/finance/transactions/categories/${id}`, {
      method: "DELETE",
    }),
};

/* ================= RECURRING TRANSACTIONS ================= */

export type RecurringTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  categoryId?: string;
  categoryName?: string;
  description: string;
  amount: number;
  paymentMethod: string;
  frequency: "MONTHLY" | "WEEKLY";
  dayOfMonth?: number;
  dayOfWeek?: number;
  active: boolean;
  createdAt: string;
};

export type RecurringTransactionCreateInput = {
  type: "INCOME" | "EXPENSE";
  categoryId?: string;
  description: string;
  amount: number;
  paymentMethod: string;
  frequency: "MONTHLY" | "WEEKLY";
  dayOfMonth?: number;
  dayOfWeek?: number;
};

export const recurringTransactionsApi = {
  getAll: () => request<RecurringTransaction[]>("/finance/transactions/recurring"),
  create: (data: RecurringTransactionCreateInput) =>
    request<RecurringTransaction>("/finance/transactions/recurring", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/finance/transactions/recurring/${id}`, { method: "DELETE" }),
};

/* ================= REPORTS ================= */

export const reportsApi = {
  getDaily: (date: string) => request(`/reports/daily?date=${date}`),
  getCommissions: (from: string, to: string, professionalUserId: string) =>
    request(
      `/reports/commissions?from=${from}&to=${to}&professionalUserId=${professionalUserId}`
    ),
};

/* ================= NOTIFICATIONS ================= */

export const notificationsApi = {
  getAll: async (
    filters: NotificationsFilters = {},
    cursor?: NotificationsCursor
  ): Promise<NotificationsListResponse> => {
    const query = new URLSearchParams();
    if (filters.status) query.set("status", filters.status);
    if (filters.channel) query.set("channel", filters.channel);
    if (typeof filters.failedOnly === "boolean") {
      query.set("failedOnly", String(filters.failedOnly));
    }
    if (typeof filters.unreadOnly === "boolean") {
      query.set("unreadOnly", String(filters.unreadOnly));
    }
    const requestedLimit = filters.limit ?? 100;
    const normalizedLimit = Math.min(Math.max(requestedLimit, 1), 500);
    query.set("limit", String(normalizedLimit));

    if ((cursor?.cursorCreatedAt && !cursor.cursorId) || (!cursor?.cursorCreatedAt && cursor?.cursorId)) {
      throw new Error("Cursor invalido: cursorCreatedAt e cursorId devem ser enviados juntos.");
    }

    if (cursor?.cursorCreatedAt && cursor.cursorId) {
      query.set("cursorCreatedAt", cursor.cursorCreatedAt);
      query.set("cursorId", cursor.cursorId);
    }

    const response = await request<NotificationsListResponse | AppNotification[]>(
      `/notifications?${query.toString()}`
    );

    // Fallback para contratos legados sem cursor.
    if (Array.isArray(response)) {
      return {
        items: response,
        hasMore: false,
        nextCursorCreatedAt: null,
        nextCursorId: null,
      };
    }

    return response;
  },
  deleteById: (id: string) =>
    request<void>(`/notifications/${id}`, {
      method: "DELETE",
    }),
  deleteAll: () =>
    request<void>("/notifications/all", {
      method: "DELETE",
    }),
  markAsViewed: (id: string) =>
    request<{ updated: boolean }>(`/notifications/${id}/viewed`, {
      method: "PATCH",
    }),
  markAllAsViewed: () =>
    request<{ updated: number }>("/notifications/viewed/all", {
      method: "PATCH",
    }),
};

export type SalonBusinessHours = {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
};

export type SalonProfile = {
  salonName: string;
  salonSlug: string;
  publicBookingUrl?: string | null;
  logo?: string | null;
  logoUrl?: string | null;
  salonDescription?: string | null;
  salonPhone?: string | null;
  salonWhatsapp?: string | null;
  salonCpfCnpj?: string | null;
  salonEmail?: string | null;
  salonWebsite?: string | null;
  salonInstagram?: string | null;
  salonFacebook?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  businessHours: SalonBusinessHours[];
};

export const salonApi = {
  getProfile: () => request<SalonProfile>("/salon/profile"),
  updateProfile: (data: Partial<SalonProfile>) =>
    request<SalonProfile>("/salon/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<SalonProfile>("/salon/profile/logo", {
      method: "POST",
      body: formData,
    });
  },
  removeLogo: () =>
    request<SalonProfile>("/salon/profile/logo", {
      method: "DELETE",
    }),
  getPublicBySlug: (slug: string) =>
    request<Partial<SalonProfile> & { logo?: string | null; logoUrl?: string | null }>(
      `/public/salons/${slug}`
    ),
};

export type AddressLookup = {
  cep: string;
  street: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  source?: string | null;
};

export const utilsApi = {
  getAddressByCep: (cep: string) =>
    request<AddressLookup>(`/utils/addresses/${cep}`),
};

export type AppSettings = {
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    whatsappNotifications: boolean;
    reminderHours: number;
  };
  reactivation: {
    enabled: boolean;
    respectBusinessHours: boolean;
    sendWindowStart: string;
    sendWindowEnd: string;
    maxAttemptsEnabled: number;
  };
  businessHours: Record<
    string,
    {
      open: string;
      close: string;
      enabled: boolean;
    }
  >;
};

export const settingsApi = {
  get: () => request<AppSettings>("/settings"),
  update: (data: Partial<AppSettings>) =>
    request<AppSettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateNotifications: (data: AppSettings["notifications"]) =>
    request<AppSettings["notifications"]>("/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateReactivation: (data: AppSettings["reactivation"]) =>
    request<AppSettings["reactivation"]>("/settings/reactivation", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateBusinessHours: (data: AppSettings["businessHours"]) =>
    request<AppSettings["businessHours"]>("/settings/business-hours", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const usersApi = {
  getCurrent: () => request<User>("/users/me"),
  updateMe: (data: Partial<Pick<User, "name" | "email" | "phone">>) =>
    request<User>("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<User>("/users/me/avatar", {
      method: "POST",
      body: formData,
    });
  },
  removeAvatar: () =>
    request<User>("/users/me/avatar", {
      method: "DELETE",
    }),
  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    request<void>("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getMfaStatus: () => request<MfaStatusResponse>("/users/me/mfa/status"),
  setupMfa: () =>
    request<MfaSetupResponse>("/users/me/mfa/setup", {
      method: "POST",
    }),
  enableMfa: (code: string) =>
    request<MfaStatusResponse>("/users/me/mfa/enable", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  disableMfa: (currentPassword: string, code: string) =>
    request<MfaStatusResponse>("/users/me/mfa/disable", {
      method: "POST",
      body: JSON.stringify({ currentPassword, code }),
    }),
};

export const suggestionsApi = {
  list: (limit?: number) => {
    const query = new URLSearchParams();
    if (limit) query.set("limit", String(limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<SuggestionListResponse>(`/suggestions${suffix}`);
  },
  create: (payload: SuggestionCreateRequest) =>
    request<SuggestionItem>("/suggestions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const tenantApi = {
  getWhatsAppConfig: () => request<WhatsAppConfigResponse>("/tenant/whatsapp"),
  saveWhatsAppConfig: (data: WhatsAppConfigRequest) =>
    request<WhatsAppConfigResponse>("/tenant/whatsapp", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  testWhatsAppConnection: () =>
    request<WhatsAppTestResponse>("/tenant/whatsapp/test", {
      method: "POST",
    }),
  getWhatsAppEmbeddedSignupStatus: () =>
    request<WhatsAppEmbeddedSignupStatusResponse>("/tenant/whatsapp/embedded-signup/status"),
  completeWhatsAppEmbeddedSignup: (data: WhatsAppEmbeddedSignupCompleteRequest) =>
    request<WhatsAppEmbeddedSignupStatusResponse>("/tenant/whatsapp/embedded-signup/complete", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const configApi = {
  getCurrentMenus: () =>
    request<CurrentMenuPermissionsResponse>("/config/menus/current"),
  getMenuCatalog: () =>
    request<MenuCatalogResponse>("/config/menus/catalog"),
  createMenuCatalogItem: (data: MenuCatalogItemRequest) =>
    request<MenuCatalogItem>("/config/menus/catalog", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMenuCatalogItem: (id: string, data: MenuCatalogItemRequest) =>
    request<MenuCatalogItem>(`/config/menus/catalog/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getRoleRoutes: (role: SystemAdminRole, scope: MenuConfigScope, tenantId?: string) =>
    request<MenuRoleRoutesResponse>(
      `/config/menus/roles/routes?role=${encodeURIComponent(role)}&scope=${encodeURIComponent(scope)}${
        scope === "TENANT" && tenantId ? `&tenantId=${encodeURIComponent(tenantId)}` : ""
      }`
    ),
  applyMenuOverridesBulk: (data: BulkMenuOverrideRequest) =>
    request<{ status: string; updated: number; role: string; timestamp: string }>(
      "/config/menus/overrides/bulk",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),
};

export const systemAdminApi = {
  getCommercialOverview: () =>
    request<CommercialOverview>("/admin/system/commercial/overview"),
  listPlans: () =>
    request<SystemPlanListResponse>("/admin/system/plans"),
  createPlan: (payload: SystemPlanUpsertRequest) =>
    request<SystemPlanItem>("/admin/system/plans", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePlan: (id: string, payload: SystemPlanUpsertRequest) =>
    request<SystemPlanItem>(`/admin/system/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updatePlanActive: (id: string, active: boolean) =>
    request<SystemPlanItem>(`/admin/system/plans/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  getGlobalAudits: (params?: {
    from?: string;
    to?: string;
    tenantId?: string;
    module?: string;
    action?: string;
    status?: string;
    sourceChannel?: string;
    entityType?: string;
    actorUserId?: string;
    requestId?: string;
    text?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.tenantId) query.set("tenantId", params.tenantId);
    if (params?.module) query.set("module", params.module);
    if (params?.action) query.set("action", params.action);
    if (params?.status) query.set("status", params.status);
    if (params?.sourceChannel) query.set("sourceChannel", params.sourceChannel);
    if (params?.entityType) query.set("entityType", params.entityType);
    if (params?.actorUserId) query.set("actorUserId", params.actorUserId);
    if (params?.requestId) query.set("requestId", params.requestId);
    if (params?.text) query.set("text", params.text);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<GlobalAuditListResponse>(`/admin/system/audits${suffix}`);
  },
  getGlobalAuditDetail: (id: string) =>
    request<GlobalAuditDetail>(`/admin/system/audits/${id}`),
  revokeSessions: (payload: { tenantId?: string; userId?: string }) =>
    request<RevokeSessionsResponse>("/admin/system/sessions/revoke", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listSessions: (params?: { tenantId?: string; includeRevoked?: boolean; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.tenantId) query.set("tenantId", params.tenantId);
    if (params?.includeRevoked !== undefined) query.set("includeRevoked", String(params.includeRevoked));
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<SessionListResponse>(`/admin/system/sessions${suffix}`);
  },
  revokeSessionToken: (payload: { refreshTokenId: string; tenantId?: string }) =>
    request<RevokeSessionsResponse>("/admin/system/sessions/revoke-token", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getGlobalSuggestions: (params?: {
    tenantId?: string;
    status?: string;
    category?: string;
    text?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.tenantId) query.set("tenantId", params.tenantId);
    if (params?.status) query.set("status", params.status);
    if (params?.category) query.set("category", params.category);
    if (params?.text) query.set("text", params.text);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<GlobalSuggestionListResponse>(`/admin/system/suggestions${suffix}`);
  },
  getGlobalSuggestionDetail: (id: string) =>
    request<GlobalSuggestionListResponse["items"][number]>(`/admin/system/suggestions/${id}`),
  updateGlobalSuggestion: (id: string, payload: SuggestionUpdateRequest) =>
    request<GlobalSuggestionListResponse["items"][number]>(`/admin/system/suggestions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  listEmailTemplates: () =>
    request<EmailTemplateListResponse>("/admin/system/email-templates"),
  getEmailTemplate: (type: string) =>
    request<EmailTemplateDetailResponse>(`/admin/system/email-templates/${type}`),
  updateEmailTemplate: (type: string, payload: EmailTemplateUpsertRequest) =>
    request<EmailTemplateDetailResponse>(`/admin/system/email-templates/${type}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  previewEmailTemplate: (type: string, payload: EmailTemplateUpsertRequest) =>
    request<EmailTemplatePreviewResponse>(`/admin/system/email-templates/${type}/preview`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  restoreDefaultEmailTemplate: (type: string) =>
    request<EmailTemplateDetailResponse>(`/admin/system/email-templates/${type}/restore-default`, {
      method: "POST",
    }),
  updateEmailTemplateStatus: (type: string, payload: EmailTemplateStatusUpdateRequest) =>
    request<EmailTemplateDetailResponse>(`/admin/system/email-templates/${type}/active`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export const publicLegalApi = {
  getAll: () => request<PublicLegalResponse>("/public/legal"),
  getTermsOfUse: () => request<LegalDocumentResponse>("/public/legal/terms-of-use"),
  getPrivacyPolicy: () => request<LegalDocumentResponse>("/public/legal/privacy-policy"),
  getContact: () => request<LgpdContactResponse>("/public/legal/contact"),
};

export const lgpdApi = {
  list: (params?: { status?: LgpdRequestStatus; requestType?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.requestType) query.set("requestType", params.requestType);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<LgpdRequestItem[]>(`/lgpd/requests${suffix}`);
  },
  create: (payload: CreateLgpdRequestPayload) =>
    request<LgpdRequestItem>("/lgpd/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  detailById: (id: string) => request<LgpdRequestDetail>(`/lgpd/requests/${id}`),
  detailByProtocol: (protocolCode: string) =>
    request<LgpdRequestDetail>(
      `/lgpd/requests/protocol/${encodeURIComponent(protocolCode)}`
    ),
  updateStatus: (id: string, payload: UpdateLgpdRequestStatusPayload) =>
    request<LgpdRequestItem>(`/lgpd/requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export const checkoutApi = {
  listProducts: () => request<CheckoutProduct[]>("/checkout/products"),
  createIntent: (data: CheckoutIntentRequest) =>
    request<CheckoutIntentResponse>("/checkout/intents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  confirmIntent: (intentId: string) =>
    request<CheckoutConfirmResponse>(`/checkout/intents/${intentId}/confirm`, {
      method: "POST",
    }),
};

export const billingApi = {
  createSubscription: (data: CreateBillingSubscriptionRequest) =>
    request<CreateBillingSubscriptionResponse>("/billing/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getCurrentSubscription: () =>
  request<CreateBillingSubscriptionResponse>("/billing/subscriptions/current"),
  getPayments: () => request<BillingPaymentsResponse>("/billing/payments"),
  adminListActiveTenants: () =>
    request<{ items: Array<{ tenantId: string; name: string; slug?: string; email?: string; phone?: string; planStatus?: string }> }>(
      "/billing/admin/tenants/active"
    ),
  adminGetTenantPayments: (tenantId: string) =>
    request<BillingPaymentsResponse>(`/billing/admin/tenants/${tenantId}/payments`),
  adminExpireLicense: (tenantId: string, minutesAgo = 5) =>
    request<AdminBillingActionResponse>("/billing/admin/license/expire", {
      method: "POST",
      body: JSON.stringify({ tenantId, minutesAgo }),
    }),
  adminReleaseLicense: (payload?: {
    tenantId?: string;
    productId?: string;
    validityDays?: number;
    paymentId?: string;
  }) =>
    request<AdminBillingActionResponse>("/billing/admin/license/release", {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),
  adminMarkPaymentReceived: (tenantId: string, paymentId: string, validityDays?: number) =>
    request<AdminBillingActionResponse>("/billing/admin/payments/mark-received", {
      method: "POST",
      body: JSON.stringify({ tenantId, paymentId, validityDays }),
    }),
};

export const commissionApi = {
  listRuleSets: (params?: { professionalId?: string; activeOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.professionalId) query.set("professionalId", params.professionalId);
    if (typeof params?.activeOnly === "boolean") {
      query.set("activeOnly", String(params.activeOnly));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<CommissionRuleSetListResponse>(`/commissions/rules${suffix}`);
  },
  createRuleSet: (payload: CommissionRuleSetUpsertRequest) =>
    request<CommissionRuleSetResponse>("/commissions/rules", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateRuleSet: (ruleSetId: string, payload: CommissionRuleSetUpsertRequest) =>
    request<CommissionRuleSetResponse>(`/commissions/rules/${ruleSetId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  setRuleSetActive: (ruleSetId: string, active: boolean) =>
    request<CommissionRuleSetResponse>(`/commissions/rules/${ruleSetId}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  getReport: (params: {
    from: string;
    to: string;
    professionalId?: string;
    status?: CommissionEntryStatus;
  }) => {
    const query = new URLSearchParams({
      from: params.from,
      to: params.to,
    });
    if (params.professionalId) query.set("professionalId", params.professionalId);
    if (params.status) query.set("status", params.status);
    return request<CommissionReportResponse>(`/commissions/report?${query.toString()}`);
  },
  getProfessionalReport: (professionalId: string, from: string, to: string) =>
    request<CommissionProfessionalReportResponse>(
      `/commissions/report/${professionalId}?${new URLSearchParams({ from, to }).toString()}`
    ),
  listCycles: (status?: string) =>
    request<CommissionCycleListResponse>(
      `/commissions/cycles${status ? `?${new URLSearchParams({ status }).toString()}` : ""}`
    ),
  closeCycle: (periodStart: string, periodEnd: string) =>
    request<CommissionCycleResponse>("/commissions/cycles/close", {
      method: "POST",
      body: JSON.stringify({ periodStart, periodEnd }),
    }),
  payCycle: (cycleId: string, notes?: string) =>
    request<CommissionCycleResponse>(`/commissions/cycles/${cycleId}/pay`, {
      method: "POST",
      body: JSON.stringify(notes ? { notes } : {}),
    }),
  createAdjustment: (payload: CommissionAdjustmentRequest) =>
    request<CommissionAdjustmentResponse>("/commissions/adjustments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export type TaxConfig = {
  regime: TaxRegime;
  icmsRate: number;
  pisRate: number;
  cofinsRate: number;
  issuerRazaoSocial?: string;
  issuerNomeFantasia?: string;
  issuerCnpj?: string;
  issuerIe?: string;
  issuerIm?: string;
  issuerPhone?: string;
  issuerEmail?: string;
  issuerStreet?: string;
  issuerNumber?: string;
  issuerComplement?: string;
  issuerNeighborhood?: string;
  issuerCity?: string;
  issuerState?: string;
  issuerZipCode?: string;
  issuerUfCode?: string;
  nfceCscHomologation?: string;
  nfceCscIdTokenHomologation?: string;
  nfceCscProduction?: string;
  nfceCscIdTokenProduction?: string;
};

export type DanfeJobResponse = {
  jobId: string;
  invoiceId: string;
  status: "QUEUED" | "PROCESSING" | "DONE" | "ERROR";
  downloadUrl?: string;
  downloadAvailable?: boolean;
  downloadConsumed?: boolean;
  downloadExpiresAt?: string;
  errorCode?: string;
  errorMessage?: string;
  requestedAt?: string;
  finishedAt?: string;
};

export type FiscalCertificateResponse = {
  id: string;
  thumbprint: string;
  subjectName: string;
  validTo: string;
  status: "ACTIVE" | "INACTIVE" | "DELETED" | string;
  createdAt: string;
};

const generateIdempotencyKey = (prefix: string) => {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomPart}`;
};

const withIdempotencyHeader = (prefix: string) => ({
  "X-Idempotency-Key": generateIdempotencyKey(prefix),
});

type FiscalInvoiceApi = Partial<Invoice> & {
  numeroNf?: string;
  serieNf?: string;
  totalAmount?: number;
  createdAt?: string;
  status?: string;
  type?: string;
  items?: Array<{
    id?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    cfop?: string;
    cst?: string;
  }>;
};

const mapInvoiceStatusToUi = (status?: string): Invoice["status"] => {
  const normalized = (status || "").toUpperCase();
  if (normalized === "AUTHORIZED" || normalized === "ISSUED") return "ISSUED";
  if (normalized === "GENERATED") return "GENERATED";
  if (normalized === "SIGNED") return "SIGNED";
  if (normalized === "SUBMITTED") return "SUBMITTED";
  if (normalized === "CONTINGENCY_PENDING") return "CONTINGENCY_PENDING";
  if (normalized === "REJECTED") return "REJECTED";
  if (normalized === "CANCEL_PENDING") return "CANCEL_PENDING";
  if (normalized === "CANCELLED") return "CANCELLED";
  if (normalized === "INUTILIZED") return "INUTILIZED";
  if (normalized === "ERROR_FINAL") return "ERROR_FINAL";
  return "DRAFT";
};

const mapInvoiceTypeToUi = (type?: string): Invoice["type"] => {
  const normalized = (type || "").toUpperCase();
  if (normalized === "NFCE" || normalized === "65") return "NFCE";
  return "NFE";
};

const mapInvoiceStatusToApiFilter = (
  status?: "DRAFT" | "ISSUED" | "CANCELLED"
) => {
  if (!status) return undefined;
  if (status === "ISSUED") return "AUTHORIZED";
  return status;
};

const mapFiscalInvoiceToUi = (invoice: FiscalInvoiceApi): Invoice => {
  const items = Array.isArray(invoice.items)
    ? invoice.items.map((item, index) => ({
        id: item.id || String(index + 1),
        description: item.description || "Item fiscal",
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        totalPrice: Number(item.totalPrice || 0),
        cfop: item.cfop || "",
        cst: item.cst || "",
      }))
    : [];

  const totalValue =
    typeof invoice.totalValue === "number"
      ? invoice.totalValue
      : typeof invoice.totalAmount === "number"
      ? invoice.totalAmount
      : items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    id: invoice.id || "",
    number: invoice.number || invoice.numeroNf || "-",
    series: invoice.series || invoice.serieNf || "1",
    type: mapInvoiceTypeToUi(invoice.type),
    status: mapInvoiceStatusToUi(invoice.status),
    customer: invoice.customer || {
      type: "CPF",
      document: "",
      name: "Cliente",
    },
    items,
    operationNature: invoice.operationNature || "Prestacao de servicos",
    issueDate: invoice.issueDate || invoice.createdAt || new Date().toISOString(),
    totalValue,
    taxBreakdown: invoice.taxBreakdown || {
      icms: 0,
      pis: 0,
      cofins: 0,
    },
    notes: invoice.notes,
    appointmentId: invoice.appointmentId,
    accessKey: invoice.accessKey,
    authorizationProtocol: invoice.authorizationProtocol,
  };
};

export const fiscalApi = {
  getTaxConfig: () => request<TaxConfig>("/fiscal/tax-config"),
  updateTaxConfig: (data: TaxConfig) =>
    request<TaxConfig>("/fiscal/tax-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  listInvoices: (params?: {
    status?: "DRAFT" | "ISSUED" | "CANCELLED";
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    const mappedStatus = mapInvoiceStatusToApiFilter(params?.status);
    if (mappedStatus) query.set("status", mappedStatus);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query}` : "";
    return request<{ items: FiscalInvoiceApi[]; total: number; page: number; pageSize: number }>(
      `/fiscal/invoices${suffix}`
    ).then((response) => ({
      ...response,
      items: (response.items || []).map(mapFiscalInvoiceToUi),
    }));
  },
  getInvoice: (id: string) =>
    request<FiscalInvoiceApi>(`/fiscal/invoices/${id}`).then(mapFiscalInvoiceToUi),
  createInvoice: (data: InvoiceFormData & { status?: "DRAFT" | "ISSUED" }) =>
    request<FiscalInvoiceApi>("/fiscal/invoices", {
      method: "POST",
      headers: withIdempotencyHeader("fiscal-create-invoice"),
      body: JSON.stringify(data),
    }).then(mapFiscalInvoiceToUi),
  updateInvoice: (id: string, data: InvoiceFormData & { status?: "DRAFT" | "ISSUED" }) =>
    request<FiscalInvoiceApi>(`/fiscal/invoices/${id}`, {
      method: "PATCH",
      headers: withIdempotencyHeader(`fiscal-update-${id}`),
      body: JSON.stringify(data),
    }).then(mapFiscalInvoiceToUi),
  cancelInvoice: (id: string, reason?: string) =>
    request<FiscalInvoiceApi>(`/fiscal/invoices/${id}/cancel`, {
      method: "PATCH",
      headers: withIdempotencyHeader(`fiscal-cancel-${id}`),
      body: JSON.stringify(reason ? { reason } : {}),
    }).then(mapFiscalInvoiceToUi),
  authorizeInvoice: (id: string, certificatePassword?: string) =>
    request<FiscalInvoiceApi>(`/fiscal/invoices/${id}/authorize`, {
      method: "POST",
      headers: withIdempotencyHeader(`fiscal-authorize-${id}`),
      body: JSON.stringify({ certificatePassword }),
    }).then(mapFiscalInvoiceToUi),
  reprocessAuthorizeInvoice: (id: string, certificatePassword?: string) =>
    request<FiscalInvoiceApi>(`/fiscal/invoices/${id}/reprocess-authorize`, {
      method: "POST",
      headers: withIdempotencyHeader(`fiscal-reprocess-authorize-${id}`),
      body: JSON.stringify({ certificatePassword }),
    }).then(mapFiscalInvoiceToUi),
  listCertificates: () =>
    request<FiscalCertificateResponse[]>("/fiscal/certificates"),
  uploadCertificate: (pfxBase64: string, password: string) =>
    request<FiscalCertificateResponse>("/fiscal/certificates", {
      method: "POST",
      body: JSON.stringify({ pfxBase64, password }),
    }),
  activateCertificate: (id: string) =>
    request<FiscalCertificateResponse>(`/fiscal/certificates/${id}/activate`, {
      method: "POST",
    }),
  deleteCertificate: (id: string) =>
    request<void>(`/fiscal/certificates/${id}/delete`, {
      method: "PATCH",
    }),
  requestInvoicePdfJob: (id: string) =>
    request<DanfeJobResponse>(`/fiscal/invoices/${id}/pdf/jobs`, {
      method: "POST",
    }),
  getInvoicePdfJobStatus: (id: string, jobId: string) =>
    request<DanfeJobResponse>(`/fiscal/invoices/${id}/pdf/jobs/${jobId}`),
  downloadInvoicePdfJob: (id: string, jobId: string) =>
    requestBlob(`/fiscal/invoices/${id}/pdf/jobs/${jobId}/download`),
  getInvoicePdf: (id: string) => requestBlob(`/fiscal/invoices/${id}/pdf`),
  getCurrentApuracao: () => request<ApuracaoMensal>("/fiscal/apuracoes/current"),
  getApuracaoByPeriodo: (ano: number, mes: number) =>
    request<ApuracaoMensal>(`/fiscal/apuracoes/${ano}/${mes}`),
  recalculateApuracao: (ano: number, mes: number) =>
    request<ApuracaoMensal>(`/fiscal/apuracoes/${ano}/${mes}/recalculate`, {
      method: "POST",
    }),
  getHistoricoApuracoes: (limite = 12) =>
    request<ApuracaoResumo[]>(`/fiscal/apuracoes/historico?limite=${limite}`),
  getResumoAnual: (ano: number) =>
    request<{
      totalServicos: number;
      totalImpostos: number;
      totalDocumentos: number;
      meses: ApuracaoResumo[];
    }>(`/fiscal/apuracoes/resumo-anual?ano=${ano}`),
};

export type NfseConfig = {
  ambiente: "HOMOLOGACAO" | "PRODUCAO";
  municipioCodigoIbge: string;
  provedor: string;
  serieRps: string;
  aliquotaIssPadrao: number;
  itemListaServicoPadrao: string;
  codigoTributacaoMunicipio?: string;
  emissionMode: "MANUAL" | "ASK_ON_CLOSE" | "AUTO_ON_CLOSE";
  emitForCpfMode: "ALWAYS" | "ASK" | "NEVER_AUTO";
  autoIssueOnAppointmentClose: boolean;
};

export type NfseFiscalState = {
  codigoIbge: string;
  uf: string;
  nome: string;
  regiaoSigla?: string;
  regiaoNome?: string;
};

export type NfseFiscalMunicipality = {
  codigoIbge: string;
  nome: string;
  stateCodigoIbge: string;
  stateUf: string;
  stateNome: string;
  codigoTom?: string;
  codigoTomDv?: string;
  codigoTomComDv?: string;
};

export type NfseInvoiceCustomer = {
  type: "CPF" | "CNPJ" | "EXTERIOR";
  document?: string;
  countryCode?: string;
  documentType?: string;
  name: string;
  email?: string;
  phone?: string;
};

export type NfseInvoiceItem = {
  lineNumber: number;
  descricaoServico: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  itemListaServico: string;
  codigoTributacaoMunicipio?: string;
  aliquotaIss: number;
  valorIss: number;
};

export type NfseInvoice = {
  id: string;
  appointmentId?: string;
  ambiente: "HOMOLOGACAO" | "PRODUCAO";
  municipioCodigoIbge: string;
  provedor: string;
  fiscalStatus: string;
  operationalStatus?: string;
  numeroRps: number;
  serieRps: string;
  numeroNfse?: string;
  codigoVerificacao?: string;
  protocolo?: string;
  dataCompetencia: string;
  dataEmissao?: string;
  naturezaOperacao: string;
  itemListaServico: string;
  codigoTributacaoMunicipio?: string;
  valorServicos: number;
  valorDeducoes: number;
  valorIss: number;
  aliquotaIss: number;
  issRetido: boolean;
  notes?: string;
  customer: NfseInvoiceCustomer;
  items: NfseInvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type NfseInvoiceListResponse = {
  items: NfseInvoice[];
  total: number;
  page: number;
  pageSize: number;
};

export type NfsePdfJobResponse = {
  jobId: string;
  invoiceId: string;
  status: "QUEUED" | "PROCESSING" | "DONE" | "ERROR";
  errorCode?: string;
  errorMessage?: string;
  requestedAt?: string;
  finishedAt?: string;
  downloadAvailable?: boolean;
  downloadConsumed?: boolean;
  downloadExpiresAt?: string;
};

export type NfseCertificateUnlockStatus = {
  active: boolean;
  unlockTokenId?: string;
  issuedAt?: string;
  expiresAt?: string;
  status: string;
};

export type NfseProviderCapabilities = {
  municipioCodigoIbge: string;
  provedor: string;
  layoutVersion: string;
  cancelSupported: boolean;
  cancelWindowHours?: number;
  cancelMode: "SYNC" | "ASYNC";
  acceptedCancelReasonCodes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type NfseTomadorLookupAddress = {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export type NfseTomadorLookupResponse = {
  document: string;
  name: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  active?: boolean;
  address?: NfseTomadorLookupAddress;
};

export type NfseAccountingExportFormat = "CSV" | "XLSX" | "ZIP_XML";

export const nfseApi = {
  listStates: () => request<NfseFiscalState[]>("/fiscal/nfse/states"),
  listMunicipalities: (params?: { stateUf?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.stateUf) query.set("stateUf", params.stateUf);
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<NfseFiscalMunicipality[]>(`/fiscal/nfse/municipalities${suffix}`);
  },
  getConfig: (ambiente: "HOMOLOGACAO" | "PRODUCAO" = "HOMOLOGACAO") =>
      request<NfseConfig>(`/fiscal/nfse/config?ambiente=${ambiente}`),
  saveConfig: (data: NfseConfig) =>
    request<NfseConfig>("/fiscal/nfse/config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  listInvoices: (params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<NfseInvoiceListResponse>(`/fiscal/nfse/invoices${suffix}`);
  },
  getInvoice: (id: string) => request<NfseInvoice>(`/fiscal/nfse/invoices/${id}`),
  createInvoice: (payload: Omit<NfseInvoice, "id" | "fiscalStatus">) =>
    request<NfseInvoice>("/fiscal/nfse/invoices", {
      method: "POST",
      headers: withIdempotencyHeader("nfse-create-invoice"),
      body: JSON.stringify(payload),
    }),
  updateInvoice: (id: string, payload: Omit<NfseInvoice, "id" | "fiscalStatus">) =>
    request<NfseInvoice>(`/fiscal/nfse/invoices/${id}`, {
      method: "PUT",
      headers: withIdempotencyHeader(`nfse-update-${id}`),
      body: JSON.stringify(payload),
    }),
  authorizeInvoice: (
    id: string,
    payload: { certificatePassword?: string; unlockTokenId?: string }
  ) =>
    request<NfseInvoice>(`/fiscal/nfse/invoices/${id}/authorize`, {
      method: "POST",
      headers: withIdempotencyHeader(`nfse-authorize-${id}`),
      body: JSON.stringify(payload),
    }),
  cancelInvoice: (id: string, reason: string) =>
    request<NfseInvoice>(`/fiscal/nfse/invoices/${id}/cancel`, {
      method: "POST",
      headers: withIdempotencyHeader(`nfse-cancel-${id}`),
      body: JSON.stringify({ reason }),
    }),
  requestInvoicePdfJob: (id: string) =>
    request<NfsePdfJobResponse>(`/fiscal/nfse/invoices/${id}/pdf/jobs`, {
      method: "POST",
      headers: withIdempotencyHeader(`nfse-pdf-job-${id}`),
    }),
  getInvoicePdfJobStatus: (id: string, jobId: string) =>
    request<NfsePdfJobResponse>(`/fiscal/nfse/invoices/${id}/pdf/jobs/${jobId}`),
  downloadInvoicePdfJob: (id: string, jobId: string) =>
    requestBlob(`/fiscal/nfse/invoices/${id}/pdf/jobs/${jobId}/download`),
  createCertificateUnlock: (certificatePassword: string) =>
    request<NfseCertificateUnlockStatus>("/fiscal/nfse/certificate-unlock", {
      method: "POST",
      body: JSON.stringify({ certificatePassword }),
    }),
  getCertificateUnlockStatus: () =>
    request<NfseCertificateUnlockStatus>("/fiscal/nfse/certificate-unlock"),
  revokeCertificateUnlock: () =>
    request<void>("/fiscal/nfse/certificate-unlock", {
      method: "DELETE",
    }),
  listProviderCapabilities: (params?: { municipioCodigoIbge?: string; provedor?: string }) => {
    const query = new URLSearchParams();
    if (params?.municipioCodigoIbge) query.set("municipioCodigoIbge", params.municipioCodigoIbge);
    if (params?.provedor) query.set("provedor", params.provedor);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<NfseProviderCapabilities[]>(`/fiscal/nfse/provider-capabilities${suffix}`);
  },
  saveProviderCapabilities: (payload: NfseProviderCapabilities) =>
    request<NfseProviderCapabilities>("/fiscal/nfse/provider-capabilities", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  lookupTomadorByCnpj: (cnpj: string) =>
    request<NfseTomadorLookupResponse>(`/fiscal/nfse/tomador/cnpj/${encodeURIComponent(cnpj)}`),
  downloadAccountingExport: (params: {
    from: string;
    to: string;
    status?: string;
    format?: NfseAccountingExportFormat;
  }) => {
    const query = new URLSearchParams();
    query.set("from", params.from);
    query.set("to", params.to);
    if (params.status && params.status.trim().length > 0) query.set("status", params.status.trim());
    if (params.format) query.set("format", params.format);
    return requestBlob(`/fiscal/nfse/invoices/accounting-export?${query.toString()}`);
  },
};

export const publicBookingApi = {
  getServices: (slug: string) =>
    request<Service[]>(`/public/salons/${slug}/services`),
  getProfessionals: (slug: string, serviceId?: string, serviceIds?: string[]) => {
    const query = new URLSearchParams();
    if (serviceId) query.set("serviceId", serviceId);
    if (serviceIds?.length) query.set("serviceIds", serviceIds.join(","));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Professional[]>(`/public/salons/${slug}/professionals${suffix}`);
  },
  getAvailability: (params: {
    slug: string;
    date: string;
    serviceId?: string;
    serviceIds?: string[];
    professionalId?: string;
  }) => {
    const query = new URLSearchParams({ date: params.date });
    if (params.serviceId) query.set("serviceId", params.serviceId);
    if (params.serviceIds?.length) query.set("serviceIds", params.serviceIds.join(","));
    if (params.professionalId) query.set("professionalId", params.professionalId);
    return request<{ date: string; slots: Array<{ time: string; available: boolean }> }>(
      `/public/salons/${params.slug}/availability?${query.toString()}`
    );
  },
  createAppointment: (
    slug: string,
    data: {
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
    }
  ) =>
    request<{ appointmentId: string; status: string; message?: string }>(
      `/public/salons/${slug}/appointments`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),
};


