import fs from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  "../backend/azzo-agenda-pro/docs/relatorio_ui_ux/assets/viewport_validacao_2026-04-21"
);

const cookieConsentRecord = {
  choice: "accepted",
  version: "2026-03-01",
  createdAt: "2026-04-21T10:00:00.000Z",
  expiresAt: "2026-10-18T10:00:00.000Z",
};

const ownerUser = {
  id: "user-owner-1",
  tenantId: "tenant-1",
  name: "Phelipp Nascimento",
  email: "phelipp@example.com",
  phone: "11999999999",
  role: "OWNER",
  salonName: "Studio QA",
  avatar: null,
  avatarUrl: null,
  mfaEnabled: true,
  createdAt: "2026-04-21T10:00:00.000Z",
};

const allowedRoutes = [
  "/dashboard",
  "/agenda",
  "/notificacoes",
  "/chat",
  "/clientes",
  "/servicos",
  "/especialidades",
  "/profissionais",
  "/configuracoes",
  "/configuracoes/integracoes/whatsapp",
  "/perfil-salao",
  "/perfil-usuario",
  "/financeiro/licenca",
  "/unauthorized",
];

const menuItems = [
  { id: "m1", route: "/dashboard", label: "Dashboard", parentId: null, displayOrder: 1, iconKey: "layout-dashboard", active: true },
  { id: "m2", route: "/agenda", label: "Agenda", parentId: null, displayOrder: 2, iconKey: "calendar", active: true },
  { id: "m3", route: "/chat", label: "Chat", parentId: null, displayOrder: 3, iconKey: "message-circle-more", active: true },
  { id: "m4", route: "/clientes", label: "Clientes", parentId: null, displayOrder: 4, iconKey: "users", active: true },
  { id: "m5", route: "/servicos", label: "Servicos", parentId: null, displayOrder: 5, iconKey: "scissors", active: true },
  { id: "m6", route: "/especialidades", label: "Especialidades", parentId: null, displayOrder: 6, iconKey: "tag", active: true },
  { id: "m7", route: "/profissionais", label: "Profissionais", parentId: null, displayOrder: 7, iconKey: "user-round", active: true },
  { id: "m8", route: "/configuracoes", label: "Configuracoes", parentId: null, displayOrder: 8, iconKey: "settings", active: true },
  { id: "m9", route: "/notificacoes", label: "Notificacoes", parentId: null, displayOrder: 9, iconKey: "bell", active: true },
  { id: "m10", route: "/perfil-salao", label: "Perfil do Salao", parentId: null, displayOrder: 10, iconKey: "building-2", active: true },
];

const services = [
  {
    id: "srv-1",
    tenantId: "tenant-1",
    name: "Corte premium",
    description: "Corte com acabamento e finalizacao.",
    duration: 60,
    price: 12000,
    category: "Cabelo",
    professionalIds: ["pro-1"],
    isActive: true,
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "srv-2",
    tenantId: "tenant-1",
    name: "Escova modelada",
    description: "Escova com modelagem e finalizacao.",
    duration: 45,
    price: 9000,
    category: "Cabelo",
    professionalIds: ["pro-1", "pro-2"],
    isActive: true,
    createdAt: "2026-04-01T10:00:00.000Z",
  },
];

const professionals = [
  {
    id: "pro-1",
    tenantId: "tenant-1",
    userId: "user-owner-1",
    name: "Phelipp Nascimento",
    email: "phelipp@example.com",
    phone: "11999999999",
    avatar: null,
    specialties: ["Corte", "Escova"],
    commissionRate: 0.45,
    workingHours: [],
    isActive: true,
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "pro-2",
    tenantId: "tenant-1",
    userId: "user-pro-2",
    name: "Marina Costa",
    email: "marina@example.com",
    phone: "11988888888",
    avatar: null,
    specialties: ["Coloracao"],
    commissionRate: 0.4,
    workingHours: [],
    isActive: true,
    createdAt: "2026-04-01T10:00:00.000Z",
  },
];

const clients = [
  {
    id: "cli-1",
    tenantId: "tenant-1",
    name: "Amanda Melo",
    email: "amanda@example.com",
    phone: "11977776666",
    avatar: null,
    avatarUrl: null,
    totalVisits: 8,
    totalSpent: 860,
    lastVisit: "2026-04-18T12:00:00.000Z",
    createdAt: "2026-01-10T12:00:00.000Z",
  },
  {
    id: "cli-2",
    tenantId: "tenant-1",
    name: "Bruno Lima",
    email: "bruno@example.com",
    phone: "11966665555",
    avatar: null,
    avatarUrl: null,
    totalVisits: 4,
    totalSpent: 410,
    lastVisit: "2026-04-12T12:00:00.000Z",
    createdAt: "2026-02-20T12:00:00.000Z",
  },
];

const specialties = [
  { id: "sp-1", tenantId: "tenant-1", name: "Coloracao", description: "Procedimentos de cor e tonalizacao", createdAt: "2026-04-01T10:00:00.000Z" },
  { id: "sp-2", tenantId: "tenant-1", name: "Escova", description: "Modelagem e finalizacao", createdAt: "2026-04-01T10:00:00.000Z" },
];

const appointments = [
  {
    id: "apt-1",
    tenantId: "tenant-1",
    clientId: "cli-1",
    client: clients[0],
    professionalId: "pro-1",
    professional: professionals[0],
    date: "2026-04-21",
    startTime: "09:30",
    endTime: "10:30",
    status: "CONFIRMED",
    totalPrice: 120,
    items: [
      {
        id: "apt-item-1",
        serviceId: "srv-1",
        service: services[0],
        durationMinutes: 60,
        unitPrice: 120,
        totalPrice: 120,
      },
    ],
    createdAt: "2026-04-21T08:00:00.000Z",
  },
  {
    id: "apt-2",
    tenantId: "tenant-1",
    clientId: "cli-2",
    client: clients[1],
    professionalId: "pro-2",
    professional: professionals[1],
    date: "2026-04-21",
    startTime: "11:00",
    endTime: "11:45",
    status: "PENDING",
    totalPrice: 90,
    items: [
      {
        id: "apt-item-2",
        serviceId: "srv-2",
        service: services[1],
        durationMinutes: 45,
        unitPrice: 90,
        totalPrice: 90,
      },
    ],
    createdAt: "2026-04-21T08:30:00.000Z",
  },
];

const dashboardMetrics = {
  todayAppointments: 9,
  todayRevenue: 1240,
  monthlyRevenue: 18350,
  totalClients: 48,
  todayAppointmentsGrowthPercent: 12,
  todayRevenueGrowthPercent: 8,
  totalClientsGrowthPercent: 5,
  monthlyRevenueGrowthPercent: 14,
  pendingAppointments: 3,
  completedToday: 4,
  notConcludedToday: 2,
  stoppedAtServiceSelection: 1,
  stoppedAtProfessionalSelection: 1,
  stoppedAtTimeSelection: 0,
  stoppedAtFinalReview: 0,
  whatsAppOpenFlowsToday: 2,
  whatsAppStoppedAtServiceSelection: 1,
  whatsAppStoppedAtProfessionalSelection: 1,
  whatsAppStoppedAtTimeSelection: 0,
  whatsAppStoppedAtFinalReview: 0,
};

const settingsPayload = {
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
    reminderHours: 24,
  },
  reactivation: {
    enabled: true,
    respectBusinessHours: true,
    sendWindowStart: "09:00",
    sendWindowEnd: "19:00",
    maxAttemptsEnabled: 3,
  },
  businessHours: {
    monday: { open: "09:00", close: "18:00", enabled: true },
    tuesday: { open: "09:00", close: "18:00", enabled: true },
    wednesday: { open: "09:00", close: "18:00", enabled: true },
    thursday: { open: "09:00", close: "18:00", enabled: true },
    friday: { open: "09:00", close: "18:00", enabled: true },
  },
};

const chatConversations = [
  {
    id: "chat-conv-1",
    clientId: "cli-1",
    clientName: "Amanda Melo",
    clientAvatar: null,
    clientProfileImageUrl: null,
    clientPhoneMasked: "(11) 97777-6666",
    channel: "WHATSAPP",
    appointmentMarker: "EM_ANDAMENTO",
    lastMessageAt: "2026-04-21T12:30:00.000Z",
    lastMessagePreview: "Perfeito, vou confirmar seu horario",
    unreadCount: 2,
    updatedAt: "2026-04-21T12:30:00.000Z",
    manualModeUntil: null,
    manualModeEnabled: false,
  },
  {
    id: "chat-conv-2",
    clientId: "cli-2",
    clientName: "Bruno Lima",
    clientAvatar: null,
    clientProfileImageUrl: null,
    clientPhoneMasked: "(11) 96666-5555",
    channel: "WHATSAPP",
    appointmentMarker: "PAUSADO",
    lastMessageAt: "2026-04-21T11:10:00.000Z",
    lastMessagePreview: "Vou te responder depois do almoco",
    unreadCount: 0,
    updatedAt: "2026-04-21T11:10:00.000Z",
    manualModeUntil: "2026-04-21T15:00:00.000Z",
    manualModeEnabled: true,
  },
];

const chatMessages = [
  {
    id: "msg-1",
    conversationId: "chat-conv-1",
    clientId: "cli-1",
    direction: "INBOUND",
    content: "Oi, consigo agendar corte hoje?",
    status: "READ",
    createdAt: "2026-04-21T12:10:00.000Z",
    readAt: "2026-04-21T12:11:00.000Z",
  },
  {
    id: "msg-2",
    conversationId: "chat-conv-1",
    clientId: "cli-1",
    direction: "OUTBOUND",
    content: "Consigo sim. Tenho horario as 15h.",
    status: "DELIVERED",
    createdAt: "2026-04-21T12:12:00.000Z",
    deliveredAt: "2026-04-21T12:12:30.000Z",
  },
];

async function ensureScreenshotDir() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
}

function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

async function installBrowserHarness(page: Page, authenticated: boolean) {
  await page.addInitScript(
    ({ authEnabled, user, consent }) => {
      const userKey = "auth_user";
      const consentKey = "azzo_cookie_consent_v2";
      if (authEnabled) {
        localStorage.setItem(userKey, JSON.stringify(user));
      } else {
        localStorage.removeItem(userKey);
      }
      localStorage.setItem("desktop_sidebar_open", "1");
      localStorage.setItem("salon_public_slug", "studio-qa");
      localStorage.setItem(consentKey, JSON.stringify(consent));

      class FakeEventSource {
        url: string;
        withCredentials = false;
        onerror: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        private listeners = new Map<string, Set<(event: MessageEvent) => void>>();

        constructor(url: string, init?: { withCredentials?: boolean }) {
          this.url = url;
          this.withCredentials = Boolean(init?.withCredentials);
        }

        addEventListener(type: string, listener: (event: MessageEvent) => void) {
          const current = this.listeners.get(type) || new Set();
          current.add(listener);
          this.listeners.set(type, current);
        }

        removeEventListener(type: string, listener: (event: MessageEvent) => void) {
          this.listeners.get(type)?.delete(listener);
        }

        close() {
          this.listeners.clear();
        }
      }

      Object.defineProperty(window, "EventSource", {
        configurable: true,
        writable: true,
        value: FakeEventSource,
      });
    },
    {
      authEnabled: authenticated,
      user: ownerUser,
      consent: cookieConsentRecord,
    }
  );
}

async function installApiMocks(page: Page, authenticated: boolean) {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.replace(/.*\/api\/v1/, "");
    const method = route.request().method().toUpperCase();

    if (endpoint === "/auth/me") {
      if (authenticated) {
        await route.fulfill(jsonResponse(ownerUser));
      } else {
        await route.fulfill(jsonResponse({ message: "Nao autenticado" }, 401));
      }
      return;
    }

    if (endpoint === "/config/menus/current") {
      await route.fulfill(
        jsonResponse({
          role: "OWNER",
          allowedRoutes,
          items: menuItems,
        })
      );
      return;
    }

    if (endpoint === "/billing/subscriptions/current") {
      await route.fulfill(
        jsonResponse({
          status: "ACTIVE",
          licenseStatus: "ACTIVE",
          currentPaymentStatus: "PAID",
        })
      );
      return;
    }

    if (endpoint.startsWith("/notifications")) {
      await route.fulfill(
        jsonResponse({
          items: [],
          hasMore: false,
          nextCursorCreatedAt: null,
          nextCursorId: null,
        })
      );
      return;
    }

    if (endpoint === "/checkout/products") {
      await route.fulfill(
        jsonResponse([
          {
            id: "product-pro",
            name: "Plano Pro Growth",
            description: "Agenda, clientes, equipe e financeiro em um unico painel.",
            price: 149,
            currency: "BRL",
            validityMonths: 1,
            features: [
              "Agenda inteligente ilimitada",
              "CRM de clientes completo",
              "Controle financeiro",
              "Confirmacao automatica",
              "Suporte prioritario",
            ],
          },
        ])
      );
      return;
    }

    if (endpoint === "/settings") {
      await route.fulfill(jsonResponse(settingsPayload));
      return;
    }

    if (endpoint === "/dashboard/metrics") {
      await route.fulfill(jsonResponse(dashboardMetrics));
      return;
    }

    if (endpoint.startsWith("/dashboard/revenue/weekly")) {
      await route.fulfill(
        jsonResponse({
          points: [
            { day: "Seg", date: "2026-04-21", value: 220 },
            { day: "Ter", date: "2026-04-22", value: 310 },
            { day: "Qua", date: "2026-04-23", value: 180 },
            { day: "Qui", date: "2026-04-24", value: 420 },
            { day: "Sex", date: "2026-04-25", value: 360 },
            { day: "Sab", date: "2026-04-26", value: 280 },
            { day: "Dom", date: "2026-04-27", value: 90 },
          ],
          total: 1860,
          average: 265.71,
        })
      );
      return;
    }

    if (endpoint.startsWith("/dashboard/metrics/customers")) {
      await route.fulfill(
        jsonResponse({
          startDate: "2026-04-01",
          endDate: "2026-04-21",
          lastUpdatedAt: "2026-04-21T14:00:00.000Z",
          items: [
            {
              rank: 1,
              clientId: "cli-1",
              clientName: "Amanda Melo",
              completedAppointments: 5,
              completedServices: 6,
              revenueTotal: 860,
              lastAppointmentDate: "2026-04-18",
            },
            {
              rank: 2,
              clientId: "cli-2",
              clientName: "Bruno Lima",
              completedAppointments: 3,
              completedServices: 4,
              revenueTotal: 410,
              lastAppointmentDate: "2026-04-12",
            },
          ],
        })
      );
      return;
    }

    if (endpoint === "/dashboard/metrics/no-show") {
      await route.fulfill(
        jsonResponse({
          startDate: "2026-04-01",
          endDate: "2026-04-21",
          lastUpdatedAt: "2026-04-21T12:00:00.000Z",
          totalNoShows: 2,
          previousPeriodNoShows: 3,
          noShowRate: 5.3,
          lastSevenDaysNoShows: 1,
          revenueAtRisk: 220,
          recentItems: [],
        })
      );
      return;
    }

    if (endpoint.startsWith("/dashboard/metrics/whatsapp-reactivation/queue")) {
      await route.fulfill(
        jsonResponse({
          startDate: "2026-03-22",
          endDate: "2026-04-21",
          statusFilter: "all",
          limit: 10,
          items: [],
          exceptionItems: [],
        })
      );
      return;
    }

    if (endpoint.startsWith("/dashboard/metrics/whatsapp-reactivation")) {
      await route.fulfill(
        jsonResponse({
          startDate: "2026-03-22",
          endDate: "2026-04-21",
          totalAbandoned: 4,
          totalReactivated: 3,
          totalConverted: 2,
          reactivationRate: 50,
          stoppedAtServiceSelection: 1,
          stoppedAtProfessionalSelection: 1,
          stoppedAtTimeSelection: 1,
          stoppedAtFinalReview: 1,
          points: [
            { metricDate: "2026-04-05", abandonedCount: 1, reactivatedCount: 1, convertedCount: 0 },
            { metricDate: "2026-04-10", abandonedCount: 1, reactivatedCount: 0, convertedCount: 0 },
            { metricDate: "2026-04-15", abandonedCount: 1, reactivatedCount: 1, convertedCount: 1 },
            { metricDate: "2026-04-20", abandonedCount: 1, reactivatedCount: 1, convertedCount: 1 },
          ],
        })
      );
      return;
    }

    if (endpoint.startsWith("/appointments")) {
      await route.fulfill(
        jsonResponse({
          items: appointments,
          total: appointments.length,
          page: 1,
          pageSize: 20,
          hasMore: false,
        })
      );
      return;
    }

    if (endpoint === "/professionals/limits") {
      await route.fulfill(
        jsonResponse({
          currentProfessionals: 2,
          maxProfessionals: 5,
          remaining: 3,
        })
      );
      return;
    }

    if (endpoint === "/professionals") {
      await route.fulfill(
        jsonResponse({
          items: professionals,
          total: professionals.length,
          page: 1,
          pageSize: 20,
          hasMore: false,
        })
      );
      return;
    }

    if (endpoint.startsWith("/clients/paged")) {
      await route.fulfill(
        jsonResponse({
          items: clients,
          totalCount: clients.length,
          currentPage: 0,
          totalPages: 1,
        })
      );
      return;
    }

    if (endpoint === "/services") {
      await route.fulfill(
        jsonResponse({
          items: services,
          total: services.length,
          page: 1,
          pageSize: 20,
          hasMore: false,
        })
      );
      return;
    }

    if (endpoint === "/specialties") {
      await route.fulfill(jsonResponse(specialties));
      return;
    }

    if (endpoint === "/public/salons/studio-qa") {
      await route.fulfill(
        jsonResponse({
          salonName: "Studio QA",
          salonSlug: "studio-qa",
          logo: null,
          logoUrl: null,
          businessHours: [],
          specialClosureDates: [],
        })
      );
      return;
    }

    if (endpoint === "/public/salons/studio-qa/services") {
      await route.fulfill(jsonResponse(services));
      return;
    }

    if (endpoint.startsWith("/public/salons/studio-qa/professionals")) {
      await route.fulfill(jsonResponse(professionals));
      return;
    }

    if (endpoint.startsWith("/public/salons/studio-qa/availability")) {
      await route.fulfill(
        jsonResponse({
          date: "2026-04-25",
          slots: [
            { time: "09:00", available: true },
            { time: "10:30", available: true },
            { time: "14:00", available: false },
            { time: "15:30", available: true },
          ],
        })
      );
      return;
    }

    if (endpoint.startsWith("/chat/conversations/chat-conv-1/messages")) {
      await route.fulfill(
        jsonResponse({
          items: chatMessages,
          total: chatMessages.length,
          page: 1,
          pageSize: 100,
        })
      );
      return;
    }

    if (endpoint.startsWith("/chat/conversations")) {
      await route.fulfill(
        jsonResponse({
          items: chatConversations,
          total: chatConversations.length,
          page: 1,
          pageSize: 100,
        })
      );
      return;
    }

    if (endpoint === "/chat/stream") {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: {
          "cache-control": "no-cache",
          connection: "keep-alive",
        },
        body: "retry: 10000\n\n",
      });
      return;
    }

    if (endpoint === "/users/me/avatar") {
      await route.fulfill(jsonResponse({ message: "Sem avatar" }, 404));
      return;
    }

    if (method !== "GET") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    await route.fulfill(jsonResponse({}));
  });
}

async function preparePage(page: Page, authenticated: boolean) {
  await installBrowserHarness(page, authenticated);
  await installApiMocks(page, authenticated);
}

async function captureViewport(
  page: Page,
  options: {
    width: number;
    height: number;
    route: string;
    filename: string;
    waitFor: string;
    authenticated: boolean;
  }
) {
  await preparePage(page, options.authenticated);
  await page.setViewportSize({ width: options.width, height: options.height });
  await page.goto(options.route, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(options.waitFor, { state: "visible", timeout: 20_000 });
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, options.filename),
    fullPage: false,
  });
}

test.describe("viewport validation", () => {
  test.beforeAll(async () => {
    await ensureScreenshotDir();
  });

  test("captura landing, auth e booking em 360x800", async ({ page }) => {
    await captureViewport(page, {
      width: 360,
      height: 800,
      route: "/compras",
      filename: "360x800-landing-compras.png",
      waitFor: "h1",
      authenticated: false,
    });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pare de perder agendamentos");

    await captureViewport(page, {
      width: 360,
      height: 800,
      route: "/login",
      filename: "360x800-login.png",
      waitFor: "form",
      authenticated: false,
    });
    await expect(page.getByText(/Salvar e-mail neste dispositivo|Salvar e-mail neste aparelho/i)).toBeVisible();

    await captureViewport(page, {
      width: 360,
      height: 800,
      route: "/cadastro",
      filename: "360x800-cadastro.png",
      waitFor: "text=Crie sua conta",
      authenticated: false,
    });
    await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();

    await captureViewport(page, {
      width: 360,
      height: 800,
      route: "/agendar/studio-qa",
      filename: "360x800-agendamento-publico.png",
      waitFor: "text=Agendamento online",
      authenticated: false,
    });
    await expect(page.getByRole("heading", { name: "Escolha os servicos" })).toBeVisible();
  });

  test("captura shell principal em 390x844", async ({ page }) => {
    await captureViewport(page, {
      width: 390,
      height: 844,
      route: "/dashboard",
      filename: "390x844-dashboard.png",
      waitFor: "text=O que exige atencao hoje",
      authenticated: true,
    });
    await expect(page.getByText("Resumo rapido do dia")).toBeVisible();

    await captureViewport(page, {
      width: 390,
      height: 844,
      route: "/configuracoes",
      filename: "390x844-settings.png",
      waitFor: "text=Configuracao detalhada",
      authenticated: true,
    });
    await expect(page.getByText("Acesso rapido por dominio")).toBeVisible();

    await captureViewport(page, {
      width: 390,
      height: 844,
      route: "/chat/chat-conv-1",
      filename: "390x844-chat.png",
      waitFor: "text=Todas as Conversas",
      authenticated: true,
    });
    await expect(page.getByRole("heading", { name: "Amanda Melo" })).toBeVisible();

    await captureViewport(page, {
      width: 390,
      height: 844,
      route: "/clientes",
      filename: "390x844-crud-clientes.png",
      waitFor: "text=Total de Clientes",
      authenticated: true,
    });
    await expect(page.getByText("Faturamento na pagina")).toBeVisible();

    await captureViewport(page, {
      width: 390,
      height: 844,
      route: "/servicos",
      filename: "390x844-crud-servicos.png",
      waitFor: "text=Selecionar todos da lista",
      authenticated: true,
    });
    await expect(page.getByText("Selecionar todos da lista")).toBeVisible();

    await captureViewport(page, {
      width: 390,
      height: 844,
      route: "/especialidades",
      filename: "390x844-crud-especialidades.png",
      waitFor: "text=Selecionar todas da lista",
      authenticated: true,
    });
    await expect(page.getByText("Selecionar todas da lista")).toBeVisible();

    await captureViewport(page, {
      width: 390,
      height: 844,
      route: "/profissionais",
      filename: "390x844-crud-profissionais.png",
      waitFor: "text=Comissao por profissional",
      authenticated: true,
    });
    await expect(page.getByText("Comissao por profissional")).toBeVisible();
  });

  test("captura fluxos principais em tablet 768x1024", async ({ page }) => {
    await captureViewport(page, {
      width: 768,
      height: 1024,
      route: "/compras",
      filename: "768x1024-landing-compras.png",
      waitFor: "h1",
      authenticated: false,
    });
    await captureViewport(page, {
      width: 768,
      height: 1024,
      route: "/dashboard",
      filename: "768x1024-dashboard.png",
      waitFor: "text=O que exige atencao hoje",
      authenticated: true,
    });
    await captureViewport(page, {
      width: 768,
      height: 1024,
      route: "/configuracoes",
      filename: "768x1024-settings.png",
      waitFor: "text=Configuracao detalhada",
      authenticated: true,
    });
    await captureViewport(page, {
      width: 768,
      height: 1024,
      route: "/chat/chat-conv-1",
      filename: "768x1024-chat.png",
      waitFor: "text=Historico completo de mensagens por cliente",
      authenticated: true,
    });
    await captureViewport(page, {
      width: 768,
      height: 1024,
      route: "/agendar/studio-qa",
      filename: "768x1024-agendamento-publico.png",
      waitFor: "text=Agendamento online",
      authenticated: false,
    });
  });

  test("captura desktop largo 1440x900 para auth e shell critico", async ({ page }) => {
    await captureViewport(page, {
      width: 1440,
      height: 900,
      route: "/compras",
      filename: "1440x900-landing-compras.png",
      waitFor: "h1",
      authenticated: false,
    });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pare de perder agendamentos");

    await captureViewport(page, {
      width: 1440,
      height: 900,
      route: "/login",
      filename: "1440x900-login.png",
      waitFor: "form",
      authenticated: false,
    });
    await expect(page.getByText(/Salvar e-mail neste dispositivo|Salvar e-mail neste aparelho/i)).toBeVisible();

    await captureViewport(page, {
      width: 1440,
      height: 900,
      route: "/cadastro",
      filename: "1440x900-cadastro.png",
      waitFor: "text=Crie sua conta",
      authenticated: false,
    });
    await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();

    await captureViewport(page, {
      width: 1440,
      height: 900,
      route: "/dashboard",
      filename: "1440x900-dashboard.png",
      waitFor: "text=O que exige atencao hoje",
      authenticated: true,
    });
    await expect(page.getByText("Resumo rapido do dia")).toBeVisible();

    await captureViewport(page, {
      width: 1440,
      height: 900,
      route: "/configuracoes",
      filename: "1440x900-settings.png",
      waitFor: "text=Configuracao detalhada",
      authenticated: true,
    });
    await expect(page.getByText("Acesso rapido por dominio")).toBeVisible();

    await captureViewport(page, {
      width: 1440,
      height: 900,
      route: "/chat/chat-conv-1",
      filename: "1440x900-chat.png",
      waitFor: "text=Historico completo de mensagens por cliente",
      authenticated: true,
    });
    await expect(page.getByRole("heading", { name: "Amanda Melo" })).toBeVisible();
  });
});
