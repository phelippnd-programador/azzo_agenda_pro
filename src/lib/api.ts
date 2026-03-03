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
  "/configuracoes/fiscal/impostos",
  "/apuracao-mensal",
  "/configuracoes",
  "/configuracoes/integracoes/whatsapp",
  "/auditoria",
  "/estoque",
  "/perfil-salao",
  "/unauthorized",
];

const PROFESSIONAL_LOCAL_DEMO_ROUTES = [
  "/dashboard",
  "/agenda",
  "/financeiro/profissionais",
  "/estoque",
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
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  stockInventories: StockInventory[];
  stockSuppliers: StockSupplier[];
  stockPurchaseOrders: StockPurchaseOrder[];
  stockTransfers: StockTransfer[];
  stockSettings: StockSettings;
  stockImportJobs: StockImportJob[];
  stockImportErrors: Record<string, StockImportErrorLine[]>;
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
  const stockItems: StockItem[] = [
    {
      id: "demo-stock-item-1",
      nome: "Shampoo Profissional",
      sku: "SHAMP-001",
      unidadeMedida: "ML",
      saldoAtual: 860,
      estoqueMinimo: 500,
      custoMedioUnitario: 0.45,
      ativo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "demo-stock-item-2",
      nome: "Pomada Modeladora",
      sku: "POMA-001",
      unidadeMedida: "G",
      saldoAtual: 120,
      estoqueMinimo: 80,
      custoMedioUnitario: 1.35,
      ativo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
  const stockMovements: StockMovement[] = [
    {
      id: "demo-stock-movement-1",
      itemEstoqueId: "demo-stock-item-1",
      tipo: "ENTRADA",
      quantidade: 1000,
      saldoAnterior: 0,
      saldoPosterior: 1000,
      motivo: "Carga inicial",
      origem: "COMPRA",
      valorUnitarioPago: 0.45,
      valorTotalMovimentacao: 450,
      gerarLancamentoFinanceiro: true,
      transacaoFinanceiraId: "demo-transaction-stock-1",
      usuarioId: "demo-local-user",
      createdAt: nowIso,
    },
    {
      id: "demo-stock-movement-2",
      itemEstoqueId: "demo-stock-item-1",
      tipo: "SAIDA",
      quantidade: 140,
      saldoAnterior: 1000,
      saldoPosterior: 860,
      motivo: "Consumo em atendimentos",
      origem: "SERVICO",
      valorUnitarioPago: 0.45,
      valorTotalMovimentacao: 63,
      usuarioId: "demo-local-user",
      createdAt: nowIso,
    },
  ];
  const stockInventories: StockInventory[] = [
    {
      id: "demo-stock-inventory-1",
      nome: "Inventario mensal - Fevereiro/2026",
      status: "EM_CONTAGEM",
      observacao: "Contagem ciclica de itens de alto giro.",
      dataAbertura: nowIso,
      dataFechamento: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
  const stockSuppliers: StockSupplier[] = [
    {
      id: "demo-stock-supplier-1",
      nome: "Distribuidora Alpha",
      documento: "12.345.678/0001-90",
      email: "contato@alpha.com.br",
      telefone: "(11) 3333-1111",
      contato: "Mariana",
      ativo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
  const stockPurchaseOrders: StockPurchaseOrder[] = [
    {
      id: "demo-stock-po-1",
      fornecedorId: "demo-stock-supplier-1",
      fornecedorNome: "Distribuidora Alpha",
      status: "PARCIALMENTE_RECEBIDO",
      valorTotal: 1450,
      quantidadeItens: 100,
      quantidadePendente: 40,
      observacao: "Pedido mensal de reposicao.",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
  const stockTransfers: StockTransfer[] = [
    {
      id: "demo-stock-transfer-1",
      origem: "Matriz",
      destino: "Filial Centro",
      status: "ENVIADA",
      itemEstoqueId: "demo-stock-item-1",
      itemNome: "Shampoo Profissional",
      quantidade: 80,
      observacao: "Reposicao semanal da filial.",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
  const stockSettings: StockSettings = {
    alertaEstoqueMinimoAtivo: true,
    bloquearSaidaSemSaldo: true,
    permitirAjusteNegativoComPermissao: false,
    diasCoberturaMeta: 15,
    updatedAt: nowIso,
  };
  const stockImportJobs: StockImportJob[] = [];
  const stockImportErrors: Record<string, StockImportErrorLine[]> = {};

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
    stockItems,
    stockMovements,
    stockInventories,
    stockSuppliers,
    stockPurchaseOrders,
    stockTransfers,
    stockSettings,
    stockImportJobs,
    stockImportErrors,
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

const decodeAuditCursor = (cursor?: string | null) => {
  if (!cursor) return null;
  try {
    const raw = atob(cursor);
    const [createdAt, id] = raw.split("|");
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
};

const buildAuditAggregations = (items: AuditEventListItemDto[]) => {
  const byModuleMap = new Map<string, number>();
  const byStatusMap = new Map<string, number>();
  const byActionMap = new Map<string, number>();

  items.forEach((item) => {
    byModuleMap.set(item.module, (byModuleMap.get(item.module) ?? 0) + 1);
    byStatusMap.set(item.status, (byStatusMap.get(item.status) ?? 0) + 1);
    byActionMap.set(item.action, (byActionMap.get(item.action) ?? 0) + 1);
  });

  const mapToList = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

  return {
    byModule: mapToList(byModuleMap),
    byStatus: mapToList(byStatusMap),
    byAction: mapToList(byActionMap).slice(0, 10),
  };
};

const getMockAuditEvents = (state: DemoState): AuditEventDetailDto[] => {
  const baseDate = new Date();
  const actors = [
    state.professionals[0]?.name || "Ana Silva",
    state.professionals[1]?.name || "Carlos Santos",
    "Azzo Owner",
  ];
  const actorIds = [
    state.professionals[0]?.userId || "demo-user-1",
    state.professionals[1]?.userId || "demo-user-2",
    "demo-local-user",
  ];
  const modules: AuditEventDetailDto["module"][] = [
    "FISCAL",
    "RBAC",
    "FINANCE",
    "AUTH",
    "SYSTEM",
  ];
  const statuses: AuditStatus[] = ["SUCCESS", "SUCCESS", "SUCCESS", "ERROR", "DENIED"];
  const actions = [
    "FISCAL_INVOICE_AUTHORIZE",
    "RBAC_PERMISSION_UPDATE",
    "FINANCE_TRANSACTION_CREATE",
    "AUTH_LOGIN",
    "SYSTEM_CONFIG_UPDATE",
  ];

  return new Array(24).fill(null).map((_, index) => {
    const createdAt = new Date(baseDate.getTime() - index * 1000 * 60 * 41).toISOString();
    const actorIndex = index % actors.length;
    const module = modules[index % modules.length];
    const status = statuses[index % statuses.length];
    const action = actions[index % actions.length];
    const eventId = `demo-audit-event-${index + 1}`;
    const prevEventHash = index > 0 ? `prev-hash-${index}` : null;
    const changed = module !== "AUTH";
    const errorCode = status === "SUCCESS" ? null : status === "DENIED" ? "ACCESS_DENIED" : "AUTH_401";
    const errorMessage =
      status === "SUCCESS"
        ? null
        : status === "DENIED"
          ? "Usuario sem permissao para executar a acao."
          : "Falha de autenticacao por credencial invalida.";

    return {
      id: eventId,
      tenantId: "demo-local-tenant",
      actorUserId: actorIds[actorIndex],
      actorName: actors[actorIndex],
      actorRole: actorIndex === 2 ? "OWNER" : "PROFESSIONAL",
      module,
      action,
      entityType: module === "AUTH" ? "USER_SESSION" : "ENTITY",
      entityId: `entity-${index + 1}`,
      status,
      errorCode,
      errorMessage,
      requestId: `req-${1000 + index}`,
      sourceChannel: index % 4 === 0 ? "WEBHOOK" : "API",
      ipAddress: "177.12.34.56",
      createdAt,
      alterado: changed,
      camposAlterados: changed ? ["status", "updatedAt"] : [],
      before: changed ? { status: "PENDING" } : null,
      after: changed ? { status: "COMPLETED" } : null,
      metadata: {
        endpoint: `/api/v1/${module.toLowerCase()}/resource`,
        method: index % 3 === 0 ? "POST" : "PATCH",
      },
      eventHash: `hash-${eventId}`,
      prevEventHash,
      chainValid: true,
    };
  });
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
  if (path.startsWith("/public/legal") && method === "GET") {
    const termsOfUse: LegalDocumentResponse = {
      documentType: "TERMS_OF_USE",
      version: "2026.02",
      title: "Termos de Uso",
      content: `# Termos de Uso

## 1. Aceitacao
Ao usar o **Azzo Agenda Pro**, voce concorda com este termo.

## 2. Regras de uso
- Nao compartilhar credenciais.
- Respeitar as politicas de seguranca.
- Nao usar o sistema para fins ilegais.

## 3. Responsabilidades
| Parte | Responsabilidade |
|---|---|
| Cliente | Manter dados corretos e acessos sob controle |
| Plataforma | Disponibilidade e seguranca operacional |

## 4. Auditoria
Eventos criticos podem ser registrados para seguranca e compliance.`,
      contentHash: "demo-hash-terms-of-use",
      createdAt: new Date().toISOString(),
    };
    const privacyPolicy: LegalDocumentResponse = {
      documentType: "PRIVACY_POLICY",
      version: "2026.02",
      title: "Politica de Privacidade",
      content: `# Politica de Privacidade

## 1. Dados coletados
- Nome, email e telefone
- Dados operacionais de agendamento
- Endereco IP para seguranca e auditoria

## 2. Finalidades
Usamos os dados para operacao do sistema, seguranca e cumprimento legal.

## 3. Retencao
Os dados sao mantidos conforme politica vigente e requisitos legais.

## 4. Direitos do titular
Voce pode solicitar revisao, correcao e exclusao quando aplicavel.`,
      contentHash: "demo-hash-privacy-policy",
      createdAt: new Date().toISOString(),
    };

    if (path === "/public/legal") {
      return {
        termsOfUse,
        privacyPolicy,
      } as T;
    }
    if (path === "/public/legal/terms-of-use") {
      return termsOfUse as T;
    }
    if (path === "/public/legal/privacy-policy") {
      return privacyPolicy as T;
    }
  }
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

  if (path === "/auditoria/events" && method === "GET") {
    const from = query.get("from");
    const to = query.get("to");
    if (!from || !to) {
      throw new ApiError(
        "Periodo obrigatorio para pesquisa de auditoria.",
        400,
        {
          code: "BAD_REQUEST",
          message: "Informe from e to para consultar eventos.",
          path: "/api/v1/auditoria/events",
          timestamp: new Date().toISOString(),
        },
        "BAD_REQUEST"
      );
    }

    const events = getMockAuditEvents(state);
    const modules = query.getAll("modules");
    const statuses = query.getAll("statuses");
    const actions = query.getAll("actions");
    const entityTypes = query.getAll("entityTypes");
    const actorUserIds = query.getAll("actorUserIds");
    const sourceChannels = query.getAll("sourceChannels");
    const entityId = query.get("entityId");
    const requestId = query.get("requestId");
    const ip = query.get("ip");
    const text = query.get("text")?.toLowerCase();
    const hasChangesRaw = query.get("hasChanges");
    const hasChanges =
      hasChangesRaw === "true" ? true : hasChangesRaw === "false" ? false : undefined;
    const cursor = decodeAuditCursor(query.get("cursor"));
    const limit = Math.min(Math.max(Number(query.get("limit") || 50), 1), 200);
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const filtered = events
      .filter((event) => {
        const createdAt = new Date(event.createdAt);
        const inPeriod = createdAt >= fromDate && createdAt <= toDate;
        if (!inPeriod) return false;
        if (modules.length && !modules.includes(event.module)) return false;
        if (statuses.length && !statuses.includes(event.status)) return false;
        if (actions.length && !actions.includes(event.action)) return false;
        if (entityTypes.length && !entityTypes.includes(event.entityType || "")) return false;
        if (actorUserIds.length && !actorUserIds.includes(event.actorUserId || "")) return false;
        if (sourceChannels.length && !sourceChannels.includes(event.sourceChannel)) return false;
        if (entityId && event.entityId !== entityId) return false;
        if (requestId && event.requestId !== requestId) return false;
        if (ip && event.ipAddress !== ip) return false;
        if (typeof hasChanges === "boolean" && event.alterado !== hasChanges) return false;
        if (
          text &&
          !`${event.action} ${event.errorMessage || ""} ${JSON.stringify(event.metadata || {})}`
            .toLowerCase()
            .includes(text)
        ) {
          return false;
        }
        if (!cursor) return true;
        const createdAtIso = event.createdAt;
        return (
          createdAtIso < cursor.createdAt ||
          (createdAtIso === cursor.createdAt && event.id < cursor.id)
        );
      })
      .sort((a, b) => {
        const dateDiff = b.createdAt.localeCompare(a.createdAt);
        if (dateDiff !== 0) return dateDiff;
        return b.id.localeCompare(a.id);
      });

    const items = filtered.slice(0, limit).map(({ errorMessage: _errorMessage, before: _before, after: _after, metadata: _metadata, eventHash: _eventHash, prevEventHash: _prevEventHash, chainValid: _chainValid, ...rest }) => rest);
    const last = items[items.length - 1];
    const nextCursor =
      filtered.length > limit && last
        ? btoa(`${last.createdAt}|${last.id}`)
        : null;

    return {
      items,
      nextCursor,
      limit,
      hasNext: Boolean(nextCursor),
      aggregations: buildAuditAggregations(filtered),
    } as T;
  }
  if (path.startsWith("/auditoria/events/") && method === "GET") {
    const id = path.replace("/auditoria/events/", "");
    const event = getMockAuditEvents(state).find((item) => item.id === id);
    if (!event) {
      throw new ApiError(
        "Evento de auditoria nao encontrado.",
        404,
        {
          code: "NOT_FOUND",
          message: "Evento de auditoria nao encontrado.",
          path: `/api/v1/auditoria/events/${id}`,
          timestamp: new Date().toISOString(),
        },
        "NOT_FOUND"
      );
    }
    return event as T;
  }
  if (path === "/auditoria/events/export" && method === "POST") {
    const payload = JSON.parse(String(options.body || "{}")) as AuditExportRequestDto;
    const format = payload.format || "CSV";
    return {
      exportId: `exp-${Date.now()}`,
      format,
      downloadUrl: `https://demo.local/downloads/auditoria.${format.toLowerCase()}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
      checksumSha256: `checksum-${Date.now()}`,
    } as T;
  }
  if (path === "/auditoria/filters/options" && method === "GET") {
    const events = getMockAuditEvents(state);
    return {
      modules: Array.from(new Set(events.map((item) => item.module))).sort(),
      statuses: Array.from(new Set(events.map((item) => item.status))).sort(),
      actions: Array.from(new Set(events.map((item) => item.action))).sort(),
      entityTypes: Array.from(new Set(events.map((item) => item.entityType).filter(Boolean))).sort(),
      sourceChannels: Array.from(new Set(events.map((item) => item.sourceChannel))).sort(),
    } as T;
  }
  if (path === "/auditoria/retention/events" && method === "GET") {
    const now = new Date();
    return {
      items: [
        {
          id: "ret-1",
          tenantId: "demo-local-tenant",
          policyVersion: "2026.01",
          retentionPeriodDays: 730,
          windowStart: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          windowEnd: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
          affectedRows: 128,
          executedBy: "SYSTEM",
          executionId: "ret-job-2026-02",
          evidenceHash: "evidence-hash-demo",
          createdAt: now.toISOString(),
        },
      ],
      nextCursor: null,
      hasNext: false,
    } as T;
  }

  if (path === "/estoque/itens") {
    if (method === "GET") {
      const search = (query.get("search") || "").toLowerCase();
      const ativo = query.get("ativo");
      const abaixoMinimo = query.get("abaixoMinimo");
      let items = state.stockItems;

      if (search) {
        items = items.filter((item) =>
          `${item.nome} ${item.sku || ""}`.toLowerCase().includes(search)
        );
      }
      if (ativo === "true") items = items.filter((item) => item.ativo);
      if (ativo === "false") items = items.filter((item) => !item.ativo);
      if (abaixoMinimo === "true") {
        items = items.filter((item) => item.saldoAtual <= item.estoqueMinimo);
      }
      return items as T;
    }
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as CreateStockItemRequest;
      const created: StockItem = {
        id: `demo-stock-item-${Date.now()}`,
        nome: payload.nome || "Item Estoque",
        sku: payload.sku || null,
        unidadeMedida: payload.unidadeMedida || "UN",
        saldoAtual: 0,
        estoqueMinimo: Number(payload.estoqueMinimo || 0),
        custoMedioUnitario: null,
        ativo: payload.ativo ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.stockItems = [created, ...state.stockItems];
      return created as T;
    }
  }
  if (path.startsWith("/estoque/itens/")) {
    const id = path.replace("/estoque/itens/", "");
    if (method === "GET") {
      return (state.stockItems.find((item) => item.id === id) || null) as T;
    }
    if (method === "PUT") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<CreateStockItemRequest>;
      state.stockItems = state.stockItems.map((item) =>
        item.id === id
          ? {
              ...item,
              ...payload,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      return (state.stockItems.find((item) => item.id === id) || null) as T;
    }
  }
  if (path === "/estoque/movimentacoes") {
    if (method === "GET") {
      const itemId = query.get("itemId");
      const tipo = query.get("tipo");
      let items = state.stockMovements;
      if (itemId) items = items.filter((movement) => movement.itemEstoqueId === itemId);
      if (tipo) items = items.filter((movement) => movement.tipo === tipo);
      return items as T;
    }
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as CreateStockMovementRequest;
      const target = state.stockItems.find((item) => item.id === payload.itemEstoqueId);
      if (!target) {
        throw new ApiError("Item de estoque nao encontrado.", 404, null, "ESTOQUE_ITEM_NAO_ENCONTRADO");
      }
      const quantidade = Number(payload.quantidade || 0);
      const saldoAnterior = Number(target.saldoAtual || 0);
      const isEntrada = payload.tipo === "ENTRADA";
      const saldoPosterior = isEntrada ? saldoAnterior + quantidade : saldoAnterior - quantidade;
      if (!isEntrada && saldoPosterior < 0) {
        throw new ApiError("Saldo insuficiente para movimentacao.", 409, null, "ESTOQUE_SALDO_INSUFICIENTE");
      }

      target.saldoAtual = saldoPosterior;
      target.updatedAt = new Date().toISOString();
      const valorUnitarioPago = payload.valorUnitarioPago ?? target.custoMedioUnitario ?? 0;
      const movement: StockMovement = {
        id: `demo-stock-movement-${Date.now()}`,
        itemEstoqueId: payload.itemEstoqueId,
        tipo: payload.tipo,
        quantidade,
        saldoAnterior,
        saldoPosterior,
        motivo: payload.motivo || "Movimentacao manual",
        origem: payload.origem || "MANUAL",
        valorUnitarioPago,
        valorTotalMovimentacao: Number((quantidade * Number(valorUnitarioPago || 0)).toFixed(2)),
        gerarLancamentoFinanceiro: payload.gerarLancamentoFinanceiro ?? false,
        transacaoFinanceiraId: null,
        usuarioId: "demo-local-user",
        createdAt: new Date().toISOString(),
      };
      state.stockMovements = [movement, ...state.stockMovements];
      return movement as T;
    }
  }
  if (path === "/estoque/dashboard" && method === "GET") {
    const itensAbaixoMinimo = state.stockItems.filter(
      (item) => item.saldoAtual <= item.estoqueMinimo
    ).length;
    const itensZerados = state.stockItems.filter((item) => item.saldoAtual <= 0).length;
    const valorEstoqueCustoMedio = state.stockItems.reduce(
      (sum, item) => sum + item.saldoAtual * Number(item.custoMedioUnitario || 0),
      0
    );
    return {
      atualizadoEm: new Date().toISOString(),
      itensAbaixoMinimo,
      itensZerados,
      valorEstoqueCustoMedio,
      rupturaTaxa: state.stockItems.length
        ? Number((itensZerados / state.stockItems.length).toFixed(2))
        : 0,
      perdasValor: 0,
      margemServicos: [],
    } satisfies StockDashboardResponse as T;
  }
  if (path === "/estoque/inventarios") {
    if (method === "GET") {
      return state.stockInventories as T;
    }
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as CreateStockInventoryRequest;
      const nowIso = new Date().toISOString();
      const created: StockInventory = {
        id: `demo-stock-inventory-${Date.now()}`,
        nome: payload.nome || "Inventario",
        status: "ABERTO",
        observacao: payload.observacao || null,
        dataAbertura: nowIso,
        dataFechamento: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      state.stockInventories = [created, ...state.stockInventories];
      return created as T;
    }
  }
  if (path.startsWith("/estoque/inventarios/")) {
    const suffix = path.replace("/estoque/inventarios/", "");
    const [inventoryId, subPath] = suffix.split("/");
    const inventory = state.stockInventories.find((item) => item.id === inventoryId);
    if (!inventory) {
      throw new ApiError("Inventario nao encontrado.", 404, null, "ESTOQUE_INVENTARIO_NAO_ENCONTRADO");
    }
    if (!subPath && method === "GET") {
      return inventory as T;
    }
    if (subPath === "contagens" && method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as StockInventoryCountRequest;
      const item = state.stockItems.find((stockItem) => stockItem.id === payload.itemEstoqueId);
      if (!item) {
        throw new ApiError("Item de estoque nao encontrado.", 404, null, "ESTOQUE_ITEM_NAO_ENCONTRADO");
      }
      item.saldoAtual = Number(payload.quantidadeContada || 0);
      item.updatedAt = new Date().toISOString();
      inventory.status = "EM_CONTAGEM";
      inventory.updatedAt = new Date().toISOString();
      return inventory as T;
    }
    if (subPath === "fechamento" && method === "POST") {
      if (inventory.status === "FECHADO") {
        throw new ApiError("Inventario ja fechado.", 409, null, "ESTOQUE_INVENTARIO_CONFLITO");
      }
      inventory.status = "FECHADO";
      inventory.dataFechamento = new Date().toISOString();
      inventory.updatedAt = inventory.dataFechamento;
      return inventory as T;
    }
  }
  if (path === "/estoque/fornecedores") {
    if (method === "GET") {
      return state.stockSuppliers as T;
    }
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as CreateStockSupplierRequest;
      const nowIso = new Date().toISOString();
      const created: StockSupplier = {
        id: `demo-stock-supplier-${Date.now()}`,
        nome: payload.nome || "Fornecedor",
        documento: payload.documento || null,
        email: payload.email || null,
        telefone: payload.telefone || null,
        contato: payload.contato || null,
        ativo: payload.ativo ?? true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      state.stockSuppliers = [created, ...state.stockSuppliers];
      return created as T;
    }
  }
  if (path.startsWith("/estoque/fornecedores/")) {
    const id = path.replace("/estoque/fornecedores/", "");
    const supplier = state.stockSuppliers.find((item) => item.id === id);
    if (!supplier) {
      throw new ApiError("Fornecedor nao encontrado.", 404, null, "ESTOQUE_FORNECEDOR_NAO_ENCONTRADO");
    }
    if (method === "PUT") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<CreateStockSupplierRequest>;
      const updated: StockSupplier = {
        ...supplier,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      state.stockSuppliers = state.stockSuppliers.map((item) => (item.id === id ? updated : item));
      return updated as T;
    }
  }
  if (path === "/estoque/pedidos-compra") {
    if (method === "GET") {
      return state.stockPurchaseOrders as T;
    }
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as CreateStockPurchaseOrderRequest;
      const supplier = state.stockSuppliers.find((item) => item.id === payload.fornecedorId);
      if (!supplier) {
        throw new ApiError("Fornecedor nao encontrado.", 404, null, "ESTOQUE_FORNECEDOR_NAO_ENCONTRADO");
      }
      const nowIso = new Date().toISOString();
      const created: StockPurchaseOrder = {
        id: `demo-stock-po-${Date.now()}`,
        fornecedorId: supplier.id,
        fornecedorNome: supplier.nome,
        status: "ENVIADO",
        valorTotal: Number(payload.valorTotal || 0),
        quantidadeItens: Number(payload.quantidadeItens || 0),
        quantidadePendente: Number(payload.quantidadeItens || 0),
        observacao: payload.observacao || null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      state.stockPurchaseOrders = [created, ...state.stockPurchaseOrders];
      return created as T;
    }
  }
  if (path.startsWith("/estoque/pedidos-compra/")) {
    const suffix = path.replace("/estoque/pedidos-compra/", "");
    const [orderId, subPath] = suffix.split("/");
    const order = state.stockPurchaseOrders.find((item) => item.id === orderId);
    if (!order) {
      throw new ApiError("Pedido de compra nao encontrado.", 404, null, "ESTOQUE_PEDIDO_NAO_ENCONTRADO");
    }
    if (!subPath && method === "GET") return order as T;
    if (subPath === "recebimento" && method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as ReceiveStockPurchaseOrderRequest;
      const recebida = Number(payload.quantidadeRecebida || 0);
      if (recebida <= 0) {
        throw new ApiError("Quantidade recebida invalida.", 422, null, "ESTOQUE_RECEBIMENTO_INVALIDO");
      }
      if (recebida > order.quantidadePendente) {
        throw new ApiError("Quantidade recebida maior que o pendente.", 422, null, "ESTOQUE_RECEBIMENTO_EXCEDENTE");
      }
      order.quantidadePendente = Math.max(0, order.quantidadePendente - recebida);
      order.status = order.quantidadePendente === 0 ? "RECEBIDO" : "PARCIALMENTE_RECEBIDO";
      order.updatedAt = new Date().toISOString();
      return order as T;
    }
  }
  if (path === "/estoque/transferencias") {
    if (method === "GET") {
      return state.stockTransfers as T;
    }
    if (method === "POST") {
      const payload = JSON.parse(String(options.body || "{}")) as CreateStockTransferRequest;
      const item = state.stockItems.find((stockItem) => stockItem.id === payload.itemEstoqueId);
      if (!item) {
        throw new ApiError("Item de estoque nao encontrado.", 404, null, "ESTOQUE_ITEM_NAO_ENCONTRADO");
      }
      const nowIso = new Date().toISOString();
      const created: StockTransfer = {
        id: `demo-stock-transfer-${Date.now()}`,
        origem: payload.origem || "Origem",
        destino: payload.destino || "Destino",
        status: "RASCUNHO",
        itemEstoqueId: item.id,
        itemNome: item.nome,
        quantidade: Number(payload.quantidade || 0),
        observacao: payload.observacao || null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      state.stockTransfers = [created, ...state.stockTransfers];
      return created as T;
    }
  }
  if (path.startsWith("/estoque/transferencias/")) {
    const suffix = path.replace("/estoque/transferencias/", "");
    const [transferId, subPath] = suffix.split("/");
    const transfer = state.stockTransfers.find((item) => item.id === transferId);
    if (!transfer) {
      throw new ApiError("Transferencia nao encontrada.", 404, null, "ESTOQUE_TRANSFERENCIA_NAO_ENCONTRADA");
    }
    if (!subPath && method === "GET") return transfer as T;
    if (subPath === "enviar" && method === "POST") {
      if (transfer.status !== "RASCUNHO") {
        throw new ApiError("Transferencia nao pode ser enviada neste status.", 409, null, "ESTOQUE_TRANSFERENCIA_CONFLITO");
      }
      transfer.status = "ENVIADA";
      transfer.updatedAt = new Date().toISOString();
      return transfer as T;
    }
    if (subPath === "receber" && method === "POST") {
      if (transfer.status !== "ENVIADA") {
        throw new ApiError("Transferencia precisa estar enviada para receber.", 409, null, "ESTOQUE_TRANSFERENCIA_CONFLITO");
      }
      transfer.status = "RECEBIDA";
      transfer.updatedAt = new Date().toISOString();
      return transfer as T;
    }
  }
  if (path === "/estoque/configuracoes") {
    if (method === "GET") {
      return state.stockSettings as T;
    }
    if (method === "PUT") {
      const payload = JSON.parse(String(options.body || "{}")) as Partial<StockSettings>;
      state.stockSettings = {
        ...state.stockSettings,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      return state.stockSettings as T;
    }
  }
  if (path === "/estoque/importacoes" && method === "GET") {
    return state.stockImportJobs as T;
  }
  if (path === "/estoque/importacoes" && method === "POST") {
    const tipoImportacao = (query.get("tipoImportacao") ||
      "ENTRADAS") as StockImportType;
    const dryRun = query.get("dryRun") === "true";
    const jobId = `demo-stock-job-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const hasError = dryRun;
    const job: StockImportJob = {
      jobId,
      tipoImportacao,
      status: hasError ? "CONCLUIDO_COM_ERROS" : "CONCLUIDO",
      dryRun,
      totalLinhas: 120,
      linhasProcessadas: 120,
      linhasComErro: hasError ? 2 : 0,
      arquivoSha256: `demo-hash-${jobId}`,
      arquivoStorageKey: `tenant/demo-local-tenant/estoque/importacoes/${jobId}/arquivo-origem.xlsx`,
      createdAt: nowIso,
      updatedAt: nowIso,
      finishedAt: nowIso,
    };
    state.stockImportJobs = [job, ...state.stockImportJobs];
    state.stockImportErrors[jobId] = hasError
      ? [
          {
            linha: 7,
            coluna: "quantidade",
            codigoErro: "ESTOQUE_VALOR_INVALIDO",
            mensagem: "Quantidade deve ser maior que zero.",
            valorRecebido: "-10",
          },
          {
            linha: 19,
            coluna: "itemEstoqueId",
            codigoErro: "ESTOQUE_ITEM_NAO_ENCONTRADO",
            mensagem: "Item nao localizado para o tenant atual.",
            valorRecebido: "xyz",
          },
        ]
      : [];
    return job as T;
  }
  if (path.startsWith("/estoque/importacoes/")) {
    const suffix = path.replace("/estoque/importacoes/", "");
    const [jobId, subPath] = suffix.split("/");
    const job = state.stockImportJobs.find((item) => item.jobId === jobId);
    if (!job) {
      throw new ApiError("Job de importacao nao encontrado.", 404, null, "NOT_FOUND");
    }
    if (!subPath && method === "GET") return job as T;
    if (subPath === "erros" && method === "GET") {
      return (state.stockImportErrors[jobId] || []) as T;
    }
    if (subPath === "arquivo-resultado" && method === "GET") {
      return {
        downloadUrl: `https://demo.local/storage/${jobId}/resultado.csv`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
      } as T;
    }
    if (subPath === "cancelar" && method === "POST") {
      if (job.status === "CONCLUIDO" || job.status === "CONCLUIDO_COM_ERROS") {
        throw new ApiError("Job ja finalizado.", 409, null, "ESTOQUE_IMPORTACAO_JOB_CONFLITO");
      }
      job.status = "CANCELADO";
      job.updatedAt = new Date().toISOString();
      job.finishedAt = new Date().toISOString();
      return job as T;
    }
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
    if (method === "GET") {
      const date = query.get("date") || undefined;
      const professionalId = query.get("professionalId") || undefined;
      const status = query.get("status") || undefined;
      const page = Math.max(Number(query.get("page") || 1), 1);
      const limit = Math.max(Number(query.get("limit") || 20), 1);

      const normalizeDate = (value: Date | string) => {
        const parsed = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(parsed.getTime())) return "";
        return parsed.toISOString().split("T")[0];
      };

      const filtered = state.appointments.filter((appointment) => {
        const matchesDate = !date || normalizeDate(appointment.date) === date;
        const matchesProfessional = !professionalId || appointment.professionalId === professionalId;
        const matchesStatus = !status || appointment.status === status;
        return matchesDate && matchesProfessional && matchesStatus;
      });

      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);
      const total = filtered.length;
      const hasMore = start + items.length < total;

      return {
        items,
        total,
        page,
        pageSize: limit,
        hasMore,
      } as T;
    }
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
  if (path === "/appointments/metric" && method === "GET") {
    const mes = Number(query.get("mes") || 0);
    const ano = Number(query.get("ano") || 0);
    const counts = new Map<number, number>();

    state.appointments.forEach((appointment) => {
      const date = appointment.date instanceof Date ? appointment.date : new Date(appointment.date);
      if (Number.isNaN(date.getTime())) return;
      if (date.getMonth() + 1 !== mes || date.getFullYear() !== ano) return;
      const day = date.getDate();
      counts.set(day, (counts.get(day) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dia, quantidadeAgendamentos]) => ({
        dia,
        mes,
        quantidadeAgendamentos,
      })) as T;
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
  if (path === "/users/me/mfa/status" && method === "GET") {
    return {
      enabled: false,
      enrolled: false,
      enrollmentUri: null,
      secretMasked: null,
    } as T;
  }
  if (path === "/users/me/mfa/setup" && method === "POST") {
    return {
      secret: "JBSWY3DPEHPK3PXP",
      otpauthUri:
        "otpauth://totp/Azzo%20Agenda%20Pro:demo.local%40azzo.com?secret=JBSWY3DPEHPK3PXP&issuer=Azzo%20Agenda%20Pro&digits=6&period=30",
      issuer: "Azzo Agenda Pro",
      accountName: "demo.local@azzo.com",
    } as T;
  }
  if (path === "/users/me/mfa/enable" && method === "POST") {
    return {
      enabled: true,
      enrolled: true,
      enrollmentUri: null,
      secretMasked: "******",
    } as T;
  }
  if (path === "/users/me/mfa/disable" && method === "POST") {
    return {
      enabled: false,
      enrolled: false,
      enrollmentUri: null,
      secretMasked: null,
    } as T;
  }

  if (path === "/tenant/whatsapp" && method === "GET") {
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
  if (path === "/tenant/whatsapp" && method === "PUT") {
    const payload = JSON.parse(String(options.body || "{}"));
    return {
      ...payload,
      accessTokenConfigured: true,
    } as T;
  }
  if (path === "/tenant/whatsapp/test" && method === "POST") {
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
  const hasBody = typeof options.body !== "undefined" && options.body !== null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData) {
    headers.set("Content-Type", "application/json");
  } else if (isFormData) {
    headers.delete("Content-Type");
  }

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
    if (endpoint.startsWith("/estoque/importacoes/modelo")) {
      const [, queryString = ""] = endpoint.split("?");
      const query = new URLSearchParams(queryString);
      const tipoImportacao = (query.get("tipoImportacao") || "ENTRADAS").toUpperCase();
      const formato = (query.get("formato") || "xlsx").toLowerCase();
      const cabecalho = {
        ITENS: "nome,sku,unidadeMedida,estoqueMinimo,ativo",
        ENTRADAS:
          "sku,quantidade,unidadeMedida,valorUnitarioPago,motivo,gerarLancamentoFinanceiro,categoriaFinanceira,formaPagamento,dataMovimento",
        AJUSTES: "sku,quantidade,motivo,origem,dataMovimento",
      }[tipoImportacao] || "sku,quantidade,motivo";
      const exemplo = {
        ITENS: "Shampoo Profissional,SHAMP-001,ML,500,true",
        ENTRADAS:
          "SHAMP-001,1000,ML,0.45,Reposicao mensal,true,Compra de insumos,PIX,2026-02-28",
        AJUSTES: "SHAMP-001,25,Ajuste inventario,INVENTARIO,2026-02-28",
      }[tipoImportacao] || "SHAMP-001,1,Ajuste";
      const csvContent = `${cabecalho}\n${exemplo}\n`;
      if (formato === "csv") {
        return Promise.resolve(new Blob([csvContent], { type: "text/csv" }));
      }
      return Promise.resolve(
        new Blob([csvContent], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      );
    }
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
      body: JSON.stringify({ email, password, mfaCode }),
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
    acceptedTermsOfUse: boolean;
    acceptedPrivacyPolicy: boolean;
    termsOfUseVersion: string;
    privacyPolicyVersion: string;
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
  getMonthlyMetric: (mes: number, ano: number) =>
    request<AppointmentMonthlyMetric[]>(`/appointments/metric?mes=${mes}&ano=${ano}`),
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
};

export const configApi = {
  getCurrentMenus: () =>
    request<CurrentMenuPermissionsResponse>("/config/menus/current"),
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

