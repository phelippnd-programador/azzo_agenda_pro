import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SystemAdminPage from "@/pages/SystemAdmin";

const {
  listPlansMock,
  createPlanMock,
  updatePlanMock,
  getMenuCatalogMock,
  getRoleRoutesMock,
  applyMenuOverridesBulkMock,
  adminListActiveTenantsMock,
} = vi.hoisted(() => ({
  listPlansMock: vi.fn(),
  createPlanMock: vi.fn(),
  updatePlanMock: vi.fn(),
  getMenuCatalogMock: vi.fn(),
  getRoleRoutesMock: vi.fn(),
  applyMenuOverridesBulkMock: vi.fn(),
  adminListActiveTenantsMock: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-1", role: "ADMIN", name: "Admin QA", email: "admin@qa.local" },
  }),
}));

vi.mock("@/contexts/MenuPermissionsContext", () => ({
  useMenuPermissions: () => ({
    isLoading: false,
    allowedRoutes: ["/configuracoes/admin-sistema"],
    menuItems: [],
    hasRoutePermission: () => true,
    refreshPermissions: vi.fn(),
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    configApi: {
      ...actual.configApi,
      getMenuCatalog: getMenuCatalogMock,
      createMenuCatalogItem: vi.fn(),
      updateMenuCatalogItem: vi.fn(),
      getRoleRoutes: getRoleRoutesMock,
      applyMenuOverridesBulk: applyMenuOverridesBulkMock,
    },
    billingApi: {
      ...actual.billingApi,
      adminListActiveTenants: adminListActiveTenantsMock,
      adminGetTenantPayments: vi.fn().mockResolvedValue({ items: [] }),
      adminActivateLicense: vi.fn(),
      adminDeactivateLicense: vi.fn(),
    },
    systemAdminApi: {
      ...actual.systemAdminApi,
      listPlans: listPlansMock,
      createPlan: createPlanMock,
      updatePlan: updatePlanMock,
      updatePlanActive: vi.fn(),
      getCommercialOverview: vi.fn().mockResolvedValue({
        totalTenants: 0,
        totalSignups30d: 0,
        payingTenants: 0,
        activeTenants: 0,
        expiredTenants: 0,
        suspendedTenants: 0,
        conversionRatePercent: 0,
        revenueReceived30d: 0,
        pendingAmount: 0,
        tenantsByPlanStatus: [],
      }),
      getGlobalAudits: vi.fn().mockResolvedValue({ items: [] }),
      getGlobalSuggestions: vi.fn().mockResolvedValue({ items: [] }),
      listSessions: vi.fn().mockResolvedValue({ items: [] }),
      getGlobalAuditDetail: vi.fn(),
      getGlobalSuggestionDetail: vi.fn(),
      updateGlobalSuggestion: vi.fn(),
      revokeSessions: vi.fn(),
    },
    usersApi: {
      ...actual.usersApi,
      updateCredentials: vi.fn(),
    },
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/chat/ChatInboxNotifier", () => ({ ChatInboxNotifier: () => null }));

describe("SystemAdminPage", () => {
  beforeEach(() => {
    listPlansMock.mockReset();
    createPlanMock.mockReset();
    updatePlanMock.mockReset();
    getMenuCatalogMock.mockReset();
    getRoleRoutesMock.mockReset();
    applyMenuOverridesBulkMock.mockReset();
    adminListActiveTenantsMock.mockReset();
    listPlansMock.mockResolvedValue({ items: [] });
    createPlanMock.mockResolvedValue({});
    updatePlanMock.mockResolvedValue({});
    getMenuCatalogMock.mockResolvedValue({ items: [] });
    getRoleRoutesMock.mockResolvedValue({ items: [] });
    applyMenuOverridesBulkMock.mockResolvedValue({ status: "OK", updated: 1, role: "OWNER", timestamp: "" });
    adminListActiveTenantsMock.mockResolvedValue({ items: [] });
  });

  it(
    "should render admin tabs and critical sections",
    async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={["/configuracoes/admin-sistema"]}>
          <SystemAdminPage />
        </MemoryRouter>
      );

      expect(await screen.findByRole("tab", { name: "Contexto" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Menus" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Financeiro" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Acesso" })).toBeInTheDocument();
      await user.click(screen.getByRole("tab", { name: "Menus" }));
      expect(screen.getByRole("button", { name: /Novo menu/i })).toBeInTheDocument();
      await user.click(screen.getByRole("tab", { name: "Financeiro" }));
      expect(screen.getByRole("button", { name: /Novo plano/i })).toBeInTheDocument();
    },
    10000
  );

  it(
    "should save effective tenant menu permission for owner",
    async () => {
      const user = userEvent.setup();
      adminListActiveTenantsMock.mockResolvedValue({
        items: [{ tenantId: "tenant-1", name: "Studio QA", planStatus: "ACTIVE" }],
      });
      getMenuCatalogMock.mockResolvedValue({
        items: [
          {
            id: "stock-root",
            route: "/estoque",
            label: "Estoque",
            parentId: null,
            parentRoute: null,
            parentLabel: null,
            displayOrder: 100,
            iconKey: "Boxes",
            active: true,
            sidebarVisible: true,
            childrenCount: 0,
            roleVisibilities: [
              { role: "ADMIN", enabled: false },
              { role: "OWNER", enabled: true },
              { role: "PROFESSIONAL", enabled: false },
            ],
          },
        ],
      });
      getRoleRoutesMock.mockResolvedValue({
        tenantId: "tenant-1",
        scope: "TENANT",
        role: "OWNER",
        items: [{ route: "/estoque", enabled: false, overridden: true, reason: "Teste" }],
      });

      render(
        <MemoryRouter initialEntries={["/configuracoes/admin-sistema"]}>
          <SystemAdminPage />
        </MemoryRouter>
      );

      await user.click(await screen.findByRole("tab", { name: "Menus" }));
      const stockPermission = await screen.findByRole("checkbox", {
        name: "Permitir Estoque para OWNER no tenant",
      });

      await waitFor(() => expect(stockPermission).toBeEnabled());
      await user.click(stockPermission);
      await user.click(screen.getByRole("button", { name: "Salvar permissoes do tenant" }));

      expect(applyMenuOverridesBulkMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-1",
          scope: "TENANT",
          role: "OWNER",
          items: [{ route: "/estoque", enabled: true }],
        })
      );
    },
    10000
  );

  it(
    "should send plan price in reais when editing with brazilian decimal input",
    async () => {
      const user = userEvent.setup();
      listPlansMock.mockResolvedValue({
        items: [
          {
            id: "plan-1",
            name: "Azzo Pro",
            description: "Plano teste",
            currency: "BRL",
            price: 49.9,
            validityMonths: 1,
            validityDays: null,
            highlight: null,
            featuresJson: "[]",
            active: true,
            trial: false,
            priority: 0,
            maxProfessionals: 5,
          },
        ],
      });

      render(
        <MemoryRouter initialEntries={["/configuracoes/admin-sistema"]}>
          <SystemAdminPage />
        </MemoryRouter>
      );

      await user.click(await screen.findByRole("tab", { name: "Financeiro" }));
      await user.click(await screen.findByRole("button", { name: /editar/i }));

      const priceInput = screen.getByPlaceholderText("0,00");
      expect(priceInput).toHaveValue("49,90");
      await user.clear(priceInput);
      await user.type(priceInput, "56,00");
      expect(priceInput).toHaveValue("56,00");

      await user.click(screen.getByRole("button", { name: "Salvar" }));

      expect(updatePlanMock).toHaveBeenCalledWith(
        "plan-1",
        expect.objectContaining({
          price: 56,
        })
      );
    },
    10000
  );
});
