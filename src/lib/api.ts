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
  AppNotification,
  NotificationsCursor,
  NotificationsFilters,
  NotificationsListResponse,
} from "@/types/notification";
import type { AvailableSlotsParams, TimeSlotResponse } from "@/types/available-slots";
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
import {
  mockAppointments,
  mockClients,
  mockDashboardMetrics,
  mockProfessionals,
  mockServices,
  mockTransactions,
} from "@/lib/mockData";
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

export type ListQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
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
const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";
const LOCAL_DEMO_MODE_KEY = "local_demo_mode";
const LOCAL_DEMO_ROLE_KEY = "local_demo_role";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

let refreshPromise: Promise<string | null> | null = null;
let lastPlanExpiredToastAt = 0;
let lastPlanExpiredRedirectAt = 0;

const ALL_LOCAL_DEMO_ROUTES = [
  "/dashboard",
  "/notificacoes",
  "/agenda",
  "/servicos",
  "/especialidades",
  "/profissionais",
  "/clientes",
  "/financeiro",
  "/financeiro/profissionais",
  "/financeiro/licenca",
  "/emitir-nota",
  "/nota-fiscal",
  "/config-impostos",
  "/apuracao-mensal",
  "/configuracoes",
  "/configuracoes/integracoes/whatsapp",
  "/perfil-salao",
  "/unauthorized",
];

const PROFESSIONAL_LOCAL_DEMO_ROUTES = [
  "/dashboard",
  "/agenda",
  "/financeiro/profissionais",
  "/configuracoes",
  "/perfil-salao",
  "/unauthorized",
];

const LOCAL_DEMO_USER: User = {
  id: "demo-local-user",
  tenantId: "demo-local-tenant",
  name: "Demo Local",
  email: "demo.local@azzo.com",
  phone: "(11) 99999-0000",
  role: "OWNER",
  salonName: "Azzo Demo Local",
  createdAt: new Date(),
};

type LocalDemoRole = "OWNER" | "PROFESSIONAL";

const LOCAL_DEMO_ROLE_ROUTE_MAP: Record<LocalDemoRole, string[]> = {
  OWNER: ALL_LOCAL_DEMO_ROUTES,
  PROFESSIONAL: PROFESSIONAL_LOCAL_DEMO_ROUTES,
};

const getStoredLocalDemoRole = (): LocalDemoRole => {
  if (typeof window === "undefined") return "OWNER";
  const role = localStorage.getItem(LOCAL_DEMO_ROLE_KEY);
  return role === "PROFESSIONAL" ? "PROFESSIONAL" : "OWNER";
};

const setStoredLocalDemoRole = (role: LocalDemoRole) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_DEMO_ROLE_KEY, role);
};

const getLocalDemoUser = (): User => {
  const role = getStoredLocalDemoRole();
  if (role === "PROFESSIONAL") {
    return {
      ...LOCAL_DEMO_USER,
      id: "demo-local-professional-user",
      name: "Demo Local Profissional",
      email: "demo.profissional@azzo.com",
      role: "PROFESSIONAL",
    };
  }
  return LOCAL_DEMO_USER;
};

const getLocalDemoAllowedRoutes = () => {
  const role = getStoredLocalDemoRole();
  return LOCAL_DEMO_ROLE_ROUTE_MAP[role];
};

type DemoState = {
  professionals: Professional[];
  services: Service[];
  specialties: Specialty[];
  clients: Client[];
  appointments: Appointment[];
  transactions: Transaction[];
  notifications: AppNotification[];
  settings: AppSettings;
  salonProfile: SalonProfile;
  taxConfig: TaxConfig;
  invoices: Invoice[];
  billingCurrent: CreateBillingSubscriptionResponse;
  billingPayments: BillingPaymentItem[];
  apuracaoAtual: ApuracaoMensal;
  apuracaoHistorico: ApuracaoResumo[];
};

let demoState: DemoState | null = null;

const isLocalDemoEnvEnabled =
  String(import.meta.env.VITE_ENABLE_LOCAL_DEMO ?? "false").toLowerCase() === "true";

export const isLocalDemoModeEnabled = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOCAL_DEMO_MODE_KEY) === "true" || isLocalDemoEnvEnabled;
};

const setLocalDemoMode = (enabled: boolean) => {
  if (typeof window === "undefined") return;
  if (enabled) {
    localStorage.setItem(LOCAL_DEMO_MODE_KEY, "true");
    return;
  }
  localStorage.removeItem(LOCAL_DEMO_MODE_KEY);
  localStorage.removeItem(LOCAL_DEMO_ROLE_KEY);
};

const toSpecialties = (services: Service[]): Specialty[] => {
  const uniqueCategories = Array.from(
    new Set(services.map((service) => service.category).filter(Boolean))
  );
  return uniqueCategories.map((name, index) => ({
    id: `demo-specialty-${index + 1}`,
    tenantId: "demo-local-tenant",
    name,
    createdAt: new Date().toISOString(),
  }));
};

const createDemoState = (): DemoState => {
  const nowIso = new Date().toISOString();
  const services = mockServices.map((service) => ({ ...service }));
  const professionals = mockProfessionals.map((professional) => ({ ...professional }));
  const clients = mockClients.map((client) => ({ ...client }));
  const appointments = mockAppointments.map((appointment) => ({ ...appointment }));
  const transactions = mockTransactions.map((transaction) => ({ ...transaction }));
  const specialties = toSpecialties(services);

  const invoiceBase: Invoice = {
    id: "demo-invoice-1",
    number: "000001",
    series: "1",
    type: "NFCE",
    status: "ISSUED",
    customer: {
      type: "CPF",
      document: "11111111111",
      name: clients[0]?.name || "Cliente Demo",
      email: clients[0]?.email,
      phone: clients[0]?.phone,
    },
    items: [
      {
        id: "demo-invoice-item-1",
        description: services[0]?.name || "Servico Demo",
        quantity: 1,
        unitPrice: 80,
        totalPrice: 80,
        cfop: "5.933",
        cst: "00",
      },
    ],
    operationNature: "Prestacao de servicos",
    issueDate: nowIso,
    totalValue: 80,
    taxBreakdown: {
      icms: 4,
      pis: 0.52,
      cofins: 2.4,
    },
    notes: "Nota gerada em modo demo local.",
    accessKey: "DEMO-ACCESS-KEY-LOCAL",
    authorizationProtocol: "DEMO-PROTOCOL-LOCAL",
  };

  const billingCurrent: CreateBillingSubscriptionResponse = {
    tenantId: "demo-local-tenant",
    customerId: "demo-local-customer",
    subscriptionId: "demo-local-subscription",
    productId: "demo-plano-pro",
    planCode: "demo-plano-pro",
    status: "ACTIVE",
    billingType: "PIX",
    cycle: "MONTHLY",
    nextDueDate: nowIso,
    amountCents: 9900,
    currentPaymentId: "demo-payment-1",
    currentPaymentStatus: "CONFIRMED",
    currentPaymentDueDate: nowIso,
    paymentStatus: "CONFIRMED",
    licenseStatus: "ACTIVE",
    pixPayload: "00020126580014BR.GOV.BCB.PIX0114demo-local-azz05204000053039865802BR5925AZZO DEMO LOCAL6009SAO PAULO62070503***6304ABCD",
    pixQrCodeBase64: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const billingPayments: BillingPaymentItem[] = [
    {
      id: "demo-payment-1",
      tenantId: "demo-local-tenant",
      billingType: "PIX",
      status: "CONFIRMED",
      amountCents: 9900,
      dueDate: nowIso,
      referenceMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
      pixPayload: billingCurrent.pixPayload,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const apuracaoHistorico: ApuracaoResumo[] = [
    {
      id: "demo-apuracao-1",
      ano: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      status: "PARCIAL" as ApuracaoResumo["status"],
      regimeTributario: "SIMPLES_NACIONAL" as ApuracaoResumo["regimeTributario"],
      valorTotalServicos: 120000,
      valorTotalImpostos: 8400,
      quantidadeDocumentos: 12,
    },
  ];

  const apuracaoAtual: ApuracaoMensal = {
    id: "demo-apuracao-atual",
    ano: apuracaoHistorico[0].ano,
    mes: apuracaoHistorico[0].mes,
    status: apuracaoHistorico[0].status as ApuracaoMensal["status"],
    regimeTributario: apuracaoHistorico[0].regimeTributario as ApuracaoMensal["regimeTributario"],
    valorTotalServicos: apuracaoHistorico[0].valorTotalServicos,
    valorTotalImpostos: apuracaoHistorico[0].valorTotalImpostos,
    impostos: [
      {
        id: "demo-imposto-icms",
        tipoImposto: "ICMS" as ApuracaoMensal["impostos"][number]["tipoImposto"],
        descricao: "ICMS",
        baseCalculo: 120000,
        aliquota: 0.04,
        valorApurado: 4800,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: "demo-imposto-pis",
        tipoImposto: "PIS" as ApuracaoMensal["impostos"][number]["tipoImposto"],
        descricao: "PIS",
        baseCalculo: 120000,
        aliquota: 0.0065,
        valorApurado: 780,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    documentos: [],
    dataAbertura: nowIso,
    dataFechamento: null,
    quantidadeDocumentos: apuracaoHistorico[0].quantidadeDocumentos,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return {
    professionals,
    services,
    specialties,
    clients,
    appointments,
    transactions,
    notifications: [],
    settings: {
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        whatsappNotifications: true,
        reminderHours: 24,
      },
      businessHours: {
        monday: { open: "09:00", close: "18:00", enabled: true },
        tuesday: { open: "09:00", close: "18:00", enabled: true },
        wednesday: { open: "09:00", close: "18:00", enabled: true },
        thursday: { open: "09:00", close: "18:00", enabled: true },
        friday: { open: "09:00", close: "18:00", enabled: true },
        saturday: { open: "09:00", close: "14:00", enabled: true },
        sunday: { open: "09:00", close: "14:00", enabled: false },
      },
    },
    salonProfile: {
      salonName: "Azzo Demo Local",
      salonSlug: "azzo-demo",
      salonDescription: "Ambiente de demonstracao local sem backend.",
      salonPhone: "(11) 3333-4444",
      salonWhatsapp: "(11) 99999-0000",
      salonEmail: "demo.local@azzo.com",
      businessHours: [
        { day: "Segunda-feira", enabled: true, open: "09:00", close: "18:00" },
        { day: "Terca-feira", enabled: true, open: "09:00", close: "18:00" },
        { day: "Quarta-feira", enabled: true, open: "09:00", close: "18:00" },
        { day: "Quinta-feira", enabled: true, open: "09:00", close: "18:00" },
        { day: "Sexta-feira", enabled: true, open: "09:00", close: "18:00" },
        { day: "Sabado", enabled: true, open: "09:00", close: "14:00" },
        { day: "Domingo", enabled: false, open: "09:00", close: "14:00" },
      ],
    },
    taxConfig: {
      regime: "SIMPLES_NACIONAL" as TaxRegime,
      icmsRate: 4,
      pisRate: 0.65,
      cofinsRate: 3,
    },
    invoices: [invoiceBase],
    billingCurrent,
    billingPayments,
    apuracaoAtual,
    apuracaoHistorico,
  };
};

const getDemoState = () => {
  if (!demoState) {
    demoState = createDemoState();
  }
  return demoState;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details: unknown;

  constructor(message: string, status: number, details?: unknown, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const isPlanExpiredApiError = (error: unknown) =>
  error instanceof ApiError &&
  error.status === 402 &&
  !!error.details &&
  typeof error.details === "object" &&
  (error.details as { error?: string }).error === "PLAN_EXPIRED";

const extractPathAndQuery = (endpoint: string) => {
  const [path, queryString = ""] = endpoint.split("?");
  return {
    path,
    query: new URLSearchParams(queryString),
  };
};

const buildListQuery = (params?: ListQueryParams) => {
  const query = new URLSearchParams();
  if (!params) return query;
  if (params.page && params.page > 0) query.set("page", String(params.page));
  if (params.limit && params.limit > 0) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  return query;
};

const localDemoRequest = <T>(endpoint: string, options: RequestInit = {}): T => {
  const state = getDemoState();
  const method = String(options.method || "GET").toUpperCase();
  const { path, query } = extractPathAndQuery(endpoint);

  if (path === "/auth/me") return getLocalDemoUser() as T;
  if (path === "/config/menus/current") {
    return {
      role: getLocalDemoUser().role,
      allowedRoutes: getLocalDemoAllowedRoutes(),
    } as T;
  }

  if (path === "/dashboard/metrics") return mockDashboardMetrics as T;
  if (path === "/dashboard/revenue/weekly") {
    const points = [
      { day: "Seg", date: "", value: 1250 },
      { day: "Ter", date: "", value: 980 },
      { day: "Qua", date: "", value: 1450 },
      { day: "Qui", date: "", value: 1120 },
      { day: "Sex", date: "", value: 1680 },
      { day: "Sab", date: "", value: 890 },
      { day: "Dom", date: "", value: 0 },
    ];
    const total = points.reduce((sum, point) => sum + point.value, 0);
    return {
      points,
      total,
      average: points.length ? total / points.length : 0,
    } as T;
  }
  if (path === "/dashboard/metrics/professional") {
    return {
      startDate: query.get("start") || "",
      endDate: query.get("end") || "",
      professionalId: query.get("professionalId") || state.professionals[0]?.id || "",
      revenueTotal: 350000,
      commissionTotal: 140000,
      completedServices: 24,
      clientsServed: 18,
    } as T;
  }
  if (path === "/dashboard/metrics/services") {
    const items = state.services.slice(0, 5).map((service, index) => ({
      serviceId: service.id,
      serviceName: service.name,
      totalAppointments: 30 - index * 4,
      completedAppointments: 24 - index * 3,
      canceledAppointments: 3,
      revenueTotal: (30 - index * 4) * service.price * 100,
      completionRate: 80,
      cancellationRate: 10,
    }));
    return {
      startDate: query.get("start") || "",
      endDate: query.get("end") || "",
      professionalId: query.get("professionalId"),
      services: items,
      mostRequestedService: items[0] || null,
      leastRequestedService: items[items.length - 1] || null,
      mostCancelledService: items[0] || null,
      mostCompletedService: items[0] || null,
    } as T;
  }

  if (path === "/services") {
    if (method === "GET") return state.services as T;
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<Service>;
      const created: Service = {
        id: `demo-service-${Date.now()}`,
        tenantId: "demo-local-tenant",
        name: payload.name || "Servico demo",
        description: payload.description || "",
        duration: payload.duration || 30,
        price: payload.price || 0,
        category: payload.category || "Geral",
        professionalIds: payload.professionalIds || [],
        isActive: payload.isActive ?? true,
        createdAt: new Date(),
      };
      state.services = [created, ...state.services];
      return created as T;
    }
  }
  if (path.startsWith("/services/")) {
    const id = path.replace("/services/", "");
    if (method === "PUT") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<Service>;
      state.services = state.services.map((service) =>
        service.id === id ? { ...service, ...payload } : service
      );
      return (state.services.find((service) => service.id === id) || null) as T;
    }
    if (method === "DELETE") {
      state.services = state.services.filter((service) => service.id !== id);
      return {} as T;
    }
  }

  if (path === "/professionals") {
    if (method === "GET") return state.professionals as T;
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<Professional>;
      const created: Professional = {
        id: `demo-professional-${Date.now()}`,
        tenantId: "demo-local-tenant",
        userId: `demo-user-${Date.now()}`,
        name: payload.name || "Profissional demo",
        email: payload.email || "demo.profissional@azzo.com",
        phone: payload.phone || "",
        specialties: payload.specialties || [],
        commissionRate: payload.commissionRate || 40,
        workingHours: payload.workingHours || [],
        isActive: payload.isActive ?? true,
        avatar: payload.avatar,
        createdAt: new Date(),
      };
      state.professionals = [created, ...state.professionals];
      return created as T;
    }
  }
  if (path === "/professionals/limits") {
    return {
      currentProfessionals: state.professionals.length,
      maxProfessionals: 10,
      remaining: Math.max(10 - state.professionals.length, 0),
    } as T;
  }
  if (path.startsWith("/professionals/")) {
    const id = path.split("/")[2];
    if (path.endsWith("/reset-password")) {
      const professional = state.professionals.find((item) => item.id === id);
      return {
        professionalId: id,
        userId: professional?.userId || id,
        email: professional?.email || "",
        message: "Senha resetada em modo demo local.",
      } as T;
    }
    if (method === "PUT") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<Professional>;
      state.professionals = state.professionals.map((professional) =>
        professional.id === id ? { ...professional, ...payload } : professional
      );
      return (state.professionals.find((professional) => professional.id === id) || null) as T;
    }
    if (method === "DELETE") {
      state.professionals = state.professionals.filter((professional) => professional.id !== id);
      return {} as T;
    }
  }

  if (path === "/specialties") {
    if (method === "GET") return state.specialties as T;
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as { name?: string };
      const created: Specialty = {
        id: `demo-specialty-${Date.now()}`,
        tenantId: "demo-local-tenant",
        name: payload.name || "Especialidade demo",
        createdAt: new Date().toISOString(),
      };
      state.specialties = [created, ...state.specialties];
      return created as T;
    }
  }
  if (path.startsWith("/specialties/") && method === "DELETE") {
    const id = path.replace("/specialties/", "");
    state.specialties = state.specialties.filter((specialty) => specialty.id !== id);
    return {} as T;
  }

  if (path === "/clients") {
    if (method === "GET") return state.clients as T;
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<Client>;
      const created: Client = {
        id: `demo-client-${Date.now()}`,
        tenantId: "demo-local-tenant",
        name: payload.name || "Cliente demo",
        email: payload.email || "",
        phone: payload.phone || "",
        totalVisits: 0,
        totalSpent: 0,
        createdAt: new Date(),
      };
      state.clients = [created, ...state.clients];
      return created as T;
    }
  }
  if (path.startsWith("/clients/")) {
    const id = path.replace("/clients/", "");
    if (method === "PUT") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<Client>;
      state.clients = state.clients.map((client) => (client.id === id ? { ...client, ...payload } : client));
      return (state.clients.find((client) => client.id === id) || null) as T;
    }
    if (method === "DELETE") {
      state.clients = state.clients.filter((client) => client.id !== id);
      return {} as T;
    }
  }

  if (path === "/appointments") {
    if (method === "GET") return state.appointments as T;
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<Appointment>;
      const created: Appointment = {
        id: `demo-appointment-${Date.now()}`,
        tenantId: "demo-local-tenant",
        clientId: payload.clientId || state.clients[0]?.id || "",
        professionalId: payload.professionalId || state.professionals[0]?.id || "",
        serviceId: payload.serviceId || state.services[0]?.id || "",
        date: payload.date ? new Date(payload.date) : new Date(),
        startTime: payload.startTime || "09:00",
        endTime: payload.endTime || "09:30",
        status: (payload.status as Appointment["status"]) || "PENDING",
        totalPrice: payload.totalPrice || 0,
        notes: payload.notes,
        client: state.clients.find((client) => client.id === payload.clientId),
        professional: state.professionals.find((professional) => professional.id === payload.professionalId),
        service: state.services.find((service) => service.id === payload.serviceId),
        createdAt: new Date(),
      };
      state.appointments = [created, ...state.appointments];
      return created as T;
    }
  }
  if (path === "/appointments/available-slots") {
    return [
      { startTime: "09:00", endTime: "09:30" },
      { startTime: "09:30", endTime: "10:00" },
      { startTime: "10:00", endTime: "10:30" },
      { startTime: "10:30", endTime: "11:00" },
    ] as T;
  }
  if (path.includes("/reassign-professional")) {
    const appointmentId = path.split("/")[2];
    const professionalId = query.get("professionalId") || "";
    state.appointments = state.appointments.map((appointment) =>
      appointment.id === appointmentId ? { ...appointment, professionalId } : appointment
    );
    return (state.appointments.find((appointment) => appointment.id === appointmentId) || null) as T;
  }
  if (path.includes("/status")) {
    const appointmentId = path.split("/")[2];
    const status = (query.get("value") || "PENDING") as Appointment["status"];
    state.appointments = state.appointments.map((appointment) =>
      appointment.id === appointmentId ? { ...appointment, status } : appointment
    );
    return (state.appointments.find((appointment) => appointment.id === appointmentId) || null) as T;
  }
  if (path.startsWith("/appointments/") && method === "DELETE") {
    const id = path.replace("/appointments/", "");
    state.appointments = state.appointments.filter((appointment) => appointment.id !== id);
    return {} as T;
  }

  if (path === "/finance/transactions") {
    if (method === "GET") return state.transactions as T;
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<Transaction>;
      const created: Transaction = {
        id: `demo-transaction-${Date.now()}`,
        tenantId: "demo-local-tenant",
        appointmentId: payload.appointmentId,
        type: (payload.type as Transaction["type"]) || "INCOME",
        category: payload.category || "Servico",
        description: payload.description || "",
        amount: payload.amount || 0,
        paymentMethod: (payload.paymentMethod as Transaction["paymentMethod"]) || "PIX",
        date: payload.date ? new Date(payload.date) : new Date(),
        createdAt: new Date(),
      };
      state.transactions = [created, ...state.transactions];
      return created as T;
    }
  }
  if (path === "/finance/transactions/summary") {
    const totalIncome = state.transactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalExpenses = state.transactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    } as T;
  }
  if (path.startsWith("/finance/transactions/") && method === "DELETE") {
    const id = path.replace("/finance/transactions/", "");
    state.transactions = state.transactions.filter((transaction) => transaction.id !== id);
    return {} as T;
  }

  if (path === "/notifications") {
    return {
      items: state.notifications,
      hasMore: false,
      nextCursorCreatedAt: null,
      nextCursorId: null,
    } as T;
  }
  if (path === "/notifications/all" && method === "DELETE") {
    state.notifications = [];
    return {} as T;
  }
  if (path.startsWith("/notifications/") && method === "DELETE") {
    const id = path.replace("/notifications/", "");
    state.notifications = state.notifications.filter((notification) => notification.id !== id);
    return {} as T;
  }

  if (path === "/salon/profile") {
    if (method === "GET") return state.salonProfile as T;
    if (method === "PUT") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<SalonProfile>;
      state.salonProfile = { ...state.salonProfile, ...payload };
      return state.salonProfile as T;
    }
  }
  if (path.startsWith("/public/salons/") && path.endsWith("/services")) {
    return state.services.filter((service) => service.isActive) as T;
  }
  if (path.startsWith("/public/salons/") && path.endsWith("/professionals")) {
    const serviceId = query.get("serviceId");
    if (!serviceId) return state.professionals.filter((professional) => professional.isActive) as T;
    return state.professionals.filter((professional) => {
      const service = state.services.find((item) => item.id === serviceId);
      if (!service) return false;
      if (!service.professionalIds?.length) return true;
      return service.professionalIds.includes(professional.id);
    }) as T;
  }
  if (path.startsWith("/public/salons/") && path.endsWith("/availability")) {
    return {
      date: query.get("date") || "",
      slots: [
        { time: "09:00", available: true },
        { time: "10:00", available: true },
        { time: "11:00", available: false },
        { time: "14:00", available: true },
      ],
    } as T;
  }
  if (path.startsWith("/public/salons/") && path.endsWith("/appointments")) {
    return {
      appointmentId: `demo-public-appointment-${Date.now()}`,
      status: "CONFIRMED",
      message: "Agendamento criado em modo demo local.",
    } as T;
  }
  if (path.startsWith("/public/salons/") && path.split("/").length === 4) {
    return state.salonProfile as T;
  }

  if (path.startsWith("/utils/addresses/")) {
    return {
      cep: path.replace("/utils/addresses/", ""),
      street: "Rua Demo Local",
      complement: "",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
      source: "demo-local",
    } as T;
  }

  if (path === "/settings") {
    if (method === "GET") return state.settings as T;
    if (method === "PUT") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<AppSettings>;
      state.settings = { ...state.settings, ...payload };
      return state.settings as T;
    }
  }
  if (path === "/settings/notifications" && method === "PUT") {
    const payload = JSON.parse(String(options.body || "{}")) as AppSettings["notifications"];
    state.settings = { ...state.settings, notifications: payload };
    return state.settings.notifications as T;
  }
  if (path === "/settings/business-hours" && method === "PUT") {
    const payload = JSON.parse(String(options.body || "{}")) as AppSettings["businessHours"];
    state.settings = { ...state.settings, businessHours: payload };
    return state.settings.businessHours as T;
  }

  if (path === "/users/me" && method === "PUT") {
    const payload = JSON.parse(String(options.body || "{}")) as Partial<User>;
    const nextUser = { ...getLocalDemoUser(), ...payload };
    saveSession(undefined, nextUser);
    return nextUser as T;
  }
  if (path === "/users/me/password" && method === "PUT") return {} as T;

  if ((path === "/tenant/whatsapp" || path === "/whatsapp/config") && method === "GET") {
    return {
      enabled: true,
      whatsappEnabled: true,
      canSchedule: true,
      canCancel: true,
      canReschedule: true,
      accessTokenConfigured: true,
      phoneNumberId: "demo-phone-number-id",
      businessAccountId: "demo-business-account-id",
      webhookVerifyToken: "demo-verify-token",
    } as T;
  }
  if ((path === "/tenant/whatsapp" || path === "/whatsapp/config") && method === "PUT") {
    const payload = JSON.parse(String(options.body || "{}"));
    return {
      ...payload,
      accessTokenConfigured: true,
    } as T;
  }
  if (
    (path === "/tenant/whatsapp/test" || path === "/whatsapp/config/testar-conexao") &&
    method === "POST"
  ) {
    return {
      success: true,
      message: "Conexao validada em modo demo local.",
      checkedAt: new Date().toISOString(),
    } as T;
  }

  if (path === "/checkout/products") {
    return [
      {
        id: "demo-plano-start",
        name: "Plano Start",
        description: "Para iniciar a operacao.",
        currency: "BRL",
        price: 49,
        highlight: "Mais escolhido",
        maxProfessionals: 3,
        features: ["Agenda online", "Cadastro de clientes", "Financeiro basico"],
      },
      {
        id: "demo-plano-pro",
        name: "Plano Pro",
        description: "Para saloes com equipe.",
        currency: "BRL",
        price: 99,
        maxProfessionals: 10,
        features: ["Tudo do Start", "Fiscal completo", "Dashboards avancados"],
      },
    ] as T;
  }
  if (path === "/checkout/intents" && method === "POST") {
    const payload = JSON.parse(String(options.body || "{}")) as CheckoutIntentRequest;
    const product = (localDemoRequest<CheckoutProduct[]>("/checkout/products")).find(
      (item) => item.id === payload.productId
    );
    const unitPrice = product?.price || 99;
    return {
      intentId: `demo-intent-${Date.now()}`,
      productId: payload.productId,
      productName: product?.name || "Plano demo",
      quantity: payload.quantity || 1,
      currency: "BRL",
      unitPrice,
      totalPrice: unitPrice * (payload.quantity || 1),
      status: "PENDING",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    } as T;
  }
  if (path.includes("/checkout/intents/") && path.endsWith("/confirm") && method === "POST") {
    const intentId = path.split("/")[3];
    return {
      intentId,
      status: "CONFIRMED",
      redirectUrl: "/success",
      validUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    } as T;
  }

  if (path === "/billing/subscriptions/current") return state.billingCurrent as T;
  if (path === "/billing/payments") return { items: state.billingPayments } as T;
  if (path === "/billing/subscriptions" && method === "POST") {
    const payload = JSON.parse(String(options.body || "{}")) as CreateBillingSubscriptionRequest;
    state.billingCurrent = {
      ...state.billingCurrent,
      productId: payload.productId,
      planCode: payload.planCode || payload.productId,
      billingType: payload.billingType,
      status: "ACTIVE",
      currentPaymentStatus: payload.billingType === "CREDIT_CARD" ? "CONFIRMED" : "PENDING",
      paymentStatus: payload.billingType === "CREDIT_CARD" ? "CONFIRMED" : "PENDING",
      licenseStatus: payload.billingType === "CREDIT_CARD" ? "ACTIVE" : "EXPIRED",
      currentPaymentDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    return state.billingCurrent as T;
  }

  if (path === "/fiscal/tax-config") {
    if (method === "GET") return state.taxConfig as T;
    if (method === "PUT") {
      const payload = JSON.parse(String(options.body || "{}")) as TaxConfig;
      state.taxConfig = payload;
      return state.taxConfig as T;
    }
  }
  if (path === "/fiscal/invoices") {
    if (method === "GET") {
      return {
        items: state.invoices,
        total: state.invoices.length,
        page: 1,
        pageSize: state.invoices.length || 1,
      } as T;
    }
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as InvoiceFormData & {
        status?: "DRAFT" | "ISSUED";
      };
      const totalValue = payload.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const created: Invoice = {
        id: `demo-invoice-${Date.now()}`,
        number: String(state.invoices.length + 1).padStart(6, "0"),
        series: "1",
        type: payload.type,
        status: payload.status || "ISSUED",
        customer: payload.customer,
        items: payload.items,
        operationNature: payload.operationNature,
        issueDate: new Date().toISOString(),
        totalValue,
        taxBreakdown: {
          icms: totalValue * 0.04,
          pis: totalValue * 0.0065,
          cofins: totalValue * 0.03,
        },
        notes: payload.notes,
        appointmentId: payload.appointmentId,
      };
      state.invoices = [created, ...state.invoices];
      return created as T;
    }
  }
  if (path.startsWith("/fiscal/invoices/")) {
    const id = path.split("/")[3];
    if (path.endsWith("/cancel")) {
      state.invoices = state.invoices.map((invoice) =>
        invoice.id === id ? { ...invoice, status: "CANCELLED" } : invoice
      );
      return (state.invoices.find((invoice) => invoice.id === id) || null) as T;
    }
    if (path.endsWith("/authorize")) {
      state.invoices = state.invoices.map((invoice) =>
        invoice.id === id ? { ...invoice, status: "ISSUED" } : invoice
      );
      return (state.invoices.find((invoice) => invoice.id === id) || null) as T;
    }
    return (state.invoices.find((invoice) => invoice.id === id) || null) as T;
  }

  if (path === "/fiscal/apuracoes/current") return state.apuracaoAtual as T;
  if (path.startsWith("/fiscal/apuracoes/") && path.endsWith("/recalculate")) {
    return state.apuracaoAtual as T;
  }
  if (path.startsWith("/fiscal/apuracoes/") && path.split("/").length === 5) {
    return state.apuracaoAtual as T;
  }
  if (path === "/fiscal/apuracoes/historico") return state.apuracaoHistorico as T;
  if (path === "/fiscal/apuracoes/resumo-anual") {
    return {
      totalServicos: state.apuracaoAtual.valorTotalServicos,
      totalImpostos: state.apuracaoAtual.valorTotalImpostos,
      totalDocumentos: state.apuracaoAtual.quantidadeDocumentos,
      meses: state.apuracaoHistorico,
    } as T;
  }

  if (path === "/reports/daily") return {} as T;
  if (path === "/reports/commissions") return [] as T;

  return {} as T;
};

const shouldAttachAuthToken = (endpoint: string) =>
  !endpoint.startsWith("/auth/login") &&
  !endpoint.startsWith("/auth/register") &&
  !endpoint.startsWith("/auth/refresh");

const getErrorPayload = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  let errorMessage = "Erro na requisicao";
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
  if (isLocalDemoModeEnabled()) {
    return Promise.resolve(localDemoRequest<T>(endpoint, options));
  }

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

    const { errorMessage, errorDetails, errorCode } = await getErrorPayload(response);

    if (
      response.status === 402 &&
      errorDetails &&
      typeof errorDetails === "object" &&
      (errorDetails as { error?: string }).error === "PLAN_EXPIRED"
    ) {
      notifyPlanExpired(errorMessage);
      redirectToLicensePage();
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
  if (isLocalDemoModeEnabled()) {
    const emptyPdfBlob = new Blob(["%PDF-1.4\n% Demo local\n"], {
      type: "application/pdf",
    });
    return Promise.resolve(emptyPdfBlob);
  }

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

    const { errorMessage, errorCode, errorDetails } = await getErrorPayload(response);

    if (response.status === 402 && errorCode === "PLAN_EXPIRED") {
      notifyPlanExpired(errorMessage);
      redirectToLicensePage();
    }

    throw new ApiError(errorMessage, response.status, errorDetails, errorCode);
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
  if (!isLocalDemoModeEnabled()) return;
  getDemoState();
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
    if (isLocalDemoModeEnabled() || (email === "demo@azzo.com" && password === "demo123")) {
      setLocalDemoMode(true);
      if (!localStorage.getItem(LOCAL_DEMO_ROLE_KEY)) {
        setStoredLocalDemoRole("OWNER");
      }
      getDemoState();
      const localDemoUser = getLocalDemoUser();
      saveSession("demo-local-token", localDemoUser, "demo-local-refresh");
      return {
        access_token: "demo-local-token",
        refresh_token: "demo-local-refresh",
        user: localDemoUser,
      };
    }

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
    salonName: string;
    phone: string;
    cpfCnpj: string;
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
    if (isLocalDemoModeEnabled()) return getLocalDemoUser();
    return readStoredUser();
  },

  async me() {
    if (isLocalDemoModeEnabled()) {
      const localDemoUser = getLocalDemoUser();
      saveSession("demo-local-token", localDemoUser, "demo-local-refresh");
      return localDemoUser;
    }
    const user = await request<User>("/auth/me");
    saveSession(undefined, user);
    return user;
  },

  async loginLocalDemo(role: LocalDemoRole = "OWNER") {
    setLocalDemoMode(true);
    setStoredLocalDemoRole(role);
    getDemoState();
    const localDemoUser = getLocalDemoUser();
    saveSession("demo-local-token", localDemoUser, "demo-local-refresh");
    return localDemoUser;
  },

  async logout() {
    setLocalDemoMode(false);
    clearSession();
  },

  hasSession() {
    if (isLocalDemoModeEnabled()) return true;
    return !!getToken() || !!getRefreshToken();
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
  getAll: (params?: ListQueryParams) => {
    const query = buildListQuery(params);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<Client>>(`/clients${suffix}`);
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
  getAll: (params?: ListQueryParams) => {
    const query = buildListQuery(params);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<Appointment>>(`/appointments${suffix}`);
  },
  create: (data: Partial<Appointment>) =>
    request<Appointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAvailableSlots: (params: AvailableSlotsParams) => {
    const query = new URLSearchParams({
      professionalId: params.professionalId,
      date: params.date,
      serviceDurationMinutes: String(params.serviceDurationMinutes),
      bufferMinutes: String(params.bufferMinutes ?? 0),
    });
    return request<TimeSlotResponse[]>(`/appointments/available-slots?${query.toString()}`);
  },
  updateStatus: (id: string, status: string) =>
    request<Appointment>(`/appointments/${id}/status?value=${status}`, {
      method: "PATCH",
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
  getWhatsAppConfig: async () => {
    try {
      return await request<WhatsAppConfigResponse>("/whatsapp/config");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return request<WhatsAppConfigResponse>("/tenant/whatsapp");
      }
      throw error;
    }
  },
  saveWhatsAppConfig: async (data: WhatsAppConfigRequest) => {
    try {
      return await request<WhatsAppConfigResponse>("/whatsapp/config", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return request<WhatsAppConfigResponse>("/tenant/whatsapp", {
          method: "PUT",
          body: JSON.stringify(data),
        });
      }
      throw error;
    }
  },
  testWhatsAppConnection: async () => {
    try {
      return await request<WhatsAppTestResponse>("/whatsapp/config/testar-conexao", {
        method: "POST",
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return request<WhatsAppTestResponse>("/tenant/whatsapp/test", {
          method: "POST",
        });
      }
      throw error;
    }
  },
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
  getProfessionals: (slug: string, serviceId?: string) => {
    const query = new URLSearchParams();
    if (serviceId) query.set("serviceId", serviceId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Professional[]>(`/public/salons/${slug}/professionals${suffix}`);
  },
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

