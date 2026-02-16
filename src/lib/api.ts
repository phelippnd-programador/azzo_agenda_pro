import type {
  Appointment,
  Client,
  DashboardMetrics,
  Professional,
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

export type {
  Appointment,
  Client,
  DashboardMetrics,
  Professional,
  Service,
  Transaction,
  User,
};

const API_URL = "http://localhost:8080/api/v1";
const TOKEN_KEY = "token";
const USER_KEY = "auth_user";

const getToken = () => localStorage.getItem(TOKEN_KEY);

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  // 🚨 NÃO enviar token no login/register
  if (
    token &&
    !endpoint.startsWith("/auth/login") &&
    !endpoint.startsWith("/auth/register")
  ) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Erro na requisicao");
  }

  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
};

const requestBlob = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Blob> => {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (
    token &&
    !endpoint.startsWith("/auth/login") &&
    !endpoint.startsWith("/auth/register")
  ) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Erro na requisicao");
  }

  return response.blob();
};


const saveSession = (token?: string, user?: User | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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
  user?: User;
};

export const authApi = {
  async login(email: string, password: string) {
    const data = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const token = data.access_token || data.token;
    saveSession(token, data.user || null);

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
    saveSession(token, response.user || null);

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
