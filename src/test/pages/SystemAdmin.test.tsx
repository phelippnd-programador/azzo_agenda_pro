import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SystemAdminPage from "@/pages/SystemAdmin";

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
      getMenuCatalog: vi.fn().mockResolvedValue({ items: [] }),
      createMenuCatalogItem: vi.fn(),
      updateMenuCatalogItem: vi.fn(),
    },
    billingApi: {
      ...actual.billingApi,
      adminListActiveTenants: vi.fn().mockResolvedValue({ items: [] }),
      adminGetTenantPayments: vi.fn().mockResolvedValue({ items: [] }),
      adminActivateLicense: vi.fn(),
      adminDeactivateLicense: vi.fn(),
    },
    systemAdminApi: {
      ...actual.systemAdminApi,
      listPlans: vi.fn().mockResolvedValue({ items: [] }),
      createPlan: vi.fn(),
      updatePlan: vi.fn(),
      updatePlanActive: vi.fn(),
      getCommercialOverview: vi.fn().mockResolvedValue({
        totalTenants: 0,
        totalSignups30d: 0,
        payingTenants: 0,
        activeTenants: 0,
        expiredTenants: 0,
        suspendedTenants: 0,
        conversionRatePercent: 0,
        revenueReceived30dCents: 0,
        pendingAmountCents: 0,
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
});
