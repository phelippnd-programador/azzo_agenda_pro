import type {
  Appointment,
  Client,
  DashboardMetrics,
  Professional,
  Specialty,
  Service,
  Transaction,
  User,
} from "@/types";
import type { Invoice, InvoiceFormData } from "@/types/invoice";
import type { ApuracaoMensal, ApuracaoResumo } from "@/types/apuracao";
import type { TaxRegime } from "@/types/fiscal";
import type {
  WhatsAppConfigRequest,
  WhatsAppConfigResponse,
  WhatsAppTestResponse,
} from "@/types/whatsapp";
import type { CurrentMenuPermissionsResponse } from "@/types/menu-permissions";
import type {
  CheckoutConfirmResponse,
  CheckoutIntentRequest,
  CheckoutIntentResponse,
  CheckoutProduct,
} from "@/types/checkout";
import type {
  CreateBillingSubscriptionRequest,
  CreateBillingSubscriptionResponse,
  BillingPaymentsResponse,
} from "@/types/billing";
import { toast } from "sonner";

export type {
  Appointment,
  Client,
  DashboardMetrics,
  Professional,
  Specialty,
  Service,
  Transaction,
  User,
};

export type ProfessionalLimits = {
  currentProfessionals: number;
  maxProfessionals: number;
  remaining: number;
};

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8080/api/v1";
const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

let refreshPromise: Promise<string | null> | null = null;
let lastPlanExpiredToastAt = 0;
let lastPlanExpiredRedirectAt = 0;

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const isPlanExpiredApiError = (error: unknown) =>
  error instanceof ApiError &&
  error.status === 402 &&
  !!error.details &&
  typeof error.details === "object" &&
  (error.details as { error?: string }).error === "PLAN_EXPIRED";

const shouldAttachAuthToken = (endpoint: string) =>
  !endpoint.startsWith("/auth/login") &&
  !endpoint.startsWith("/auth/register") &&
  !endpoint.startsWith("/auth/refresh");

const getErrorPayload = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  let errorMessage = "Erro na requisicao";
  let errorDetails: unknown = null;

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    errorDetails = data;
    if (data && typeof data === "object") {
      const maybeMessage = (data as { message?: string; error?: string }).message;
      const maybeError = (data as { message?: string; error?: string }).error;
      errorMessage = maybeMessage || maybeError || errorMessage;
    }
  } else {
    const text = await response.text();
    errorDetails = text;
    if (text) errorMessage = text;
  }

  return { errorMessage, errorDetails };
};

const notifyPlanExpired = (message: string) => {
  const now = Date.now();
  if (now - lastPlanExpiredToastAt < 8000) return;
  lastPlanExpiredToastAt = now;
  toast.error(message);
};

const redirectToLicensePage = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/financeiro/licenca") return;

  const now = Date.now();
  if (now - lastPlanExpiredRedirectAt < 1500) return;
  lastPlanExpiredRedirectAt = now;

  window.location.replace("/financeiro/licenca");
};

const saveSession = (
  token?: string,
  user?: User | null,
  refreshToken?: string
) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const refreshAccessToken = async (): Promise<string | null> => {
  const storedRefreshToken = getRefreshToken();
  if (!storedRefreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (!response.ok) {
        throw new Error("Falha ao renovar token");
      }

      const data = (await response.json()) as AuthResponse;
      const nextAccessToken = data.access_token || data.token || null;
      const nextRefreshToken = data.refresh_token || data.refreshToken;

      if (!nextAccessToken) {
        throw new Error("Resposta de refresh sem access token");
      }

      saveSession(nextAccessToken, undefined, nextRefreshToken);
      return nextAccessToken;
    })()
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryOnAuthError = true
): Promise<T> => {
  const token = getToken();

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token && shouldAttachAuthToken(endpoint)) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      retryOnAuthError &&
      endpoint !== "/auth/refresh" &&
      endpoint !== "/auth/login" &&
      endpoint !== "/auth/register"
    ) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return request<T>(endpoint, options, false);
      }
    }

    const { errorMessage, errorDetails } = await getErrorPayload(response);

    if (
      response.status === 402 &&
      errorDetails &&
      typeof errorDetails === "object" &&
      (errorDetails as { error?: string }).error === "PLAN_EXPIRED"
    ) {
      notifyPlanExpired(errorMessage);
      redirectToLicensePage();
    }

    throw new ApiError(errorMessage, response.status, errorDetails);
  }

  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
};

const requestBlob = async (
  endpoint: string,
  options: RequestInit = {},
  retryOnAuthError = true
): Promise<Blob> => {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && shouldAttachAuthToken(endpoint)) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      retryOnAuthError &&
      endpoint !== "/auth/refresh" &&
      endpoint !== "/auth/login" &&
      endpoint !== "/auth/register"
    ) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return requestBlob(endpoint, options, false);
      }
    }

    const contentType = response.headers.get("content-type") || "";
    let errorMessage = "Erro na requisicao";
    let errorCode: string | undefined;

    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      if (data && typeof data === "object") {
        errorMessage =
          (data as { message?: string; error?: string }).message ||
          (data as { message?: string; error?: string }).error ||
          errorMessage;
        errorCode = (data as { error?: string }).error;
      }
    } else {
      const text = await response.text();
      if (text) errorMessage = text;
    }

    if (response.status === 402 && errorCode === "PLAN_EXPIRED") {
      notifyPlanExpired(errorMessage);
      redirectToLicensePage();
    }

    throw new Error(errorMessage);
  }

  return response.blob();
};

const readStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export const initializeDemoData = () => {
  // Backend-driven app: keep as no-op for compatibility with pages that call it.
};

/* ================= AUTH ================= */

type AuthResponse = {
  access_token?: string;
  token?: string;
  refresh_token?: string;
  refreshToken?: string;
  user?: User;
};

export const authApi = {
  async login(email: string, password: string) {
    const data = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const token = data.access_token || data.token;
    saveSession(token, data.user || null, data.refresh_token || data.refreshToken);

    return {
      ...data,
      user: data.user || readStoredUser(),
    };
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    salonName?: string;
    phone?: string;
  }) {
    const response = await request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    const token = response.access_token || response.token;
    saveSession(token, response.user || null, response.refresh_token || response.refreshToken);

    return {
      ...response,
      user: response.user || readStoredUser(),
    };
  },

  getCurrentUser() {
    return readStoredUser();
  },

  async me() {
    const user = await request<User>("/auth/me");
    saveSession(undefined, user);
    return user;
  },

  async logout() {
    clearSession();
  },

  hasSession() {
    return !!getToken() || !!getRefreshToken();
  },
};

/* ================= DASHBOARD ================= */

export const dashboardApi = {
  getMetrics: () => request<DashboardMetrics>("/dashboard/metrics"),
  getWeeklyRevenue: (start: string, end: string) =>
    request<{
      points: Array<{ day: string; date: string; value: number }>;
      total: number;
      average: number;
    }>(`/dashboard/revenue/weekly?start=${start}&end=${end}`),
};

/* ================= SERVICES ================= */

export const servicesApi = {
  getAll: () => request<Service[]>("/services"),
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
  getAll: () => request<Professional[]>("/professionals"),
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
  create: (data: { name: string }) =>
    request<Specialty>("/specialties", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/specialties/${id}`, {
      method: "DELETE",
    }),
};

/* ================= CLIENTS ================= */

export const clientsApi = {
  getAll: () => request<Client[]>("/clients"),
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
  getAll: () => request<Appointment[]>("/appointments"),
  create: (data: Partial<Appointment>) =>
    request<Appointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, status: string) =>
    request<Appointment>(`/appointments/${id}/status?value=${status}`, {
      method: "PATCH",
    }),
  delete: (id: string) =>
    request<void>(`/appointments/${id}`, {
      method: "DELETE",
    }),
};

/* ================= FINANCE ================= */

export const transactionsApi = {
  getAll: () => request<Transaction[]>("/finance/transactions"),
  getSummary: () =>
    request<{ totalIncome: number; totalExpenses: number; balance: number }>(
      "/finance/transactions/summary"
    ),
  create: (data: Partial<Transaction>) =>
    request<Transaction>("/finance/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/finance/transactions/${id}`, {
      method: "DELETE",
    }),
};

/* ================= REPORTS ================= */

export const reportsApi = {
  getDaily: (date: string) => request(`/reports/daily?date=${date}`),
  getCommissions: (from: string, to: string, professionalUserId: string) =>
    request(
      `/reports/commissions?from=${from}&to=${to}&professionalUserId=${professionalUserId}`
    ),
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
  salonDescription?: string | null;
  salonPhone?: string | null;
  salonWhatsapp?: string | null;
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
  getPublicBySlug: (slug: string) =>
    request<Partial<SalonProfile> & { logo?: string | null }>(
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
  updateBusinessHours: (data: AppSettings["businessHours"]) =>
    request<AppSettings["businessHours"]>("/settings/business-hours", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const usersApi = {
  updateMe: (data: Partial<Pick<User, "name" | "email" | "phone">>) =>
    request<User>("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
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
};

export const tenantApi = {
  getWhatsAppConfig: () =>
    request<WhatsAppConfigResponse>("/tenant/whatsapp"),
  saveWhatsAppConfig: (data: WhatsAppConfigRequest) =>
    request<WhatsAppConfigResponse>("/tenant/whatsapp", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  testWhatsAppConnection: () =>
    request<WhatsAppTestResponse>("/tenant/whatsapp/test", {
      method: "POST",
    }),
};

export const configApi = {
  getCurrentMenus: () =>
    request<CurrentMenuPermissionsResponse>("/config/menus/current"),
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
};

export type TaxConfig = {
  regime: TaxRegime;
  icmsRate: number;
  pisRate: number;
  cofinsRate: number;
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
    if (params?.status) query.set("status", params.status);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query}` : "";
    return request<{ items: Invoice[]; total: number; page: number; pageSize: number }>(
      `/fiscal/invoices${suffix}`
    );
  },
  getInvoice: (id: string) => request<Invoice>(`/fiscal/invoices/${id}`),
  createInvoice: (data: InvoiceFormData & { status?: "DRAFT" | "ISSUED" }) =>
    request<Invoice>("/fiscal/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cancelInvoice: (id: string, reason?: string) =>
    request<Invoice>(`/fiscal/invoices/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify(reason ? { reason } : {}),
    }),
  authorizeInvoice: (id: string) =>
    request<Invoice>(`/fiscal/invoices/${id}/authorize`, {
      method: "POST",
    }),
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

export const publicBookingApi = {
  getServices: (slug: string) =>
    request<Service[]>(`/public/salons/${slug}/services`),
  getProfessionals: (slug: string) =>
    request<Professional[]>(`/public/salons/${slug}/professionals`),
  getAvailability: (params: {
    slug: string;
    date: string;
    serviceId?: string;
    professionalId?: string;
  }) => {
    const query = new URLSearchParams({ date: params.date });
    if (params.serviceId) query.set("serviceId", params.serviceId);
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
      serviceId: string;
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

