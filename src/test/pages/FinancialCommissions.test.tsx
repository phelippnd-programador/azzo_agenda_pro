import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FinancialCommissions from "@/pages/FinancialCommissions";

vi.mock("@/hooks/useProfessionals", () => ({
  useProfessionals: () => ({
    professionals: [{ id: "pro-1", name: "Ana Costa" }],
    isLoading: false,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "owner-1", role: "OWNER", name: "Owner QA" },
  }),
}));

vi.mock("@/contexts/MenuPermissionsContext", () => ({
  useMenuPermissions: () => ({
    isLoading: false,
    allowedRoutes: ["/financeiro/comissoes"],
    menuItems: [],
    hasRoutePermission: () => true,
    refreshPermissions: vi.fn(),
  }),
}));

vi.mock("@/components/chat/ChatInboxNotifier", () => ({
  ChatInboxNotifier: () => null,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    commissionApi: {
      ...actual.commissionApi,
      getReport: vi.fn().mockResolvedValue({
        totalAmount: 129,
        totalOpenAmount: 80,
        totalPaidAmount: 49,
        totalEntries: 3,
        items: [
          {
            professionalId: "pro-1",
            professionalName: "Ana Costa",
            serviceAmount: 90,
            productAmount: 30,
            manualAdjustmentAmount: 9,
            openAmount: 80,
            paidAmount: 49,
            totalAmount: 129,
          },
        ],
      }),
      listRuleSets: vi.fn().mockResolvedValue({
        items: [],
      }),
      listCycles: vi.fn().mockResolvedValue({
        items: [],
      }),
      createRuleSet: vi.fn(),
      updateRuleSet: vi.fn(),
      createAdjustment: vi.fn(),
      closeCycle: vi.fn(),
      payCycle: vi.fn(),
    },
    servicesApi: {
      ...actual.servicesApi,
      getAll: vi.fn().mockResolvedValue([]),
    },
    stockApi: {
      ...actual.stockApi,
      getItems: vi.fn().mockResolvedValue({ items: [] }),
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("FinancialCommissions", () => {
  it("should render summary and global commission tabs", async () => {
    render(
      <MemoryRouter initialEntries={["/financeiro/comissoes"]}>
        <FinancialCommissions />
      </MemoryRouter>
    );

    expect(await screen.findByText("Resumo por profissional")).toBeInTheDocument();
    expect(screen.getAllByText("Ana Costa").length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: "Regra global" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ciclos" })).toBeInTheDocument();
    expect(screen.getByText("Total apurado")).toBeInTheDocument();
  });
});
