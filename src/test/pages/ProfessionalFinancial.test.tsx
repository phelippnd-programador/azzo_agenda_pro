import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProfessionalFinancial from "@/pages/ProfessionalFinancial";

const {
  getProfessionalMetricsMock,
  getServicesMetricsMock,
  professionalsState,
  authState,
} = vi.hoisted(() => ({
  getProfessionalMetricsMock: vi.fn(),
  getServicesMetricsMock: vi.fn(),
  professionalsState: {
    professionals: [{ id: "professional-1", userId: "user-1", name: "Ana Costa", isActive: true }],
  },
  authState: {
    user: { id: "owner-1", role: "OWNER", name: "Owner QA" },
  },
}));

vi.mock("@/hooks/useProfessionals", () => ({
  useProfessionals: () => ({
    professionals: professionalsState.professionals,
    isLoading: false,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: authState.user,
  }),
}));

vi.mock("@/contexts/MenuPermissionsContext", () => ({
  useMenuPermissions: () => ({
    isLoading: false,
    allowedRoutes: ["/financeiro/profissionais"],
    menuItems: [],
    hasRoutePermission: () => true,
    refreshPermissions: vi.fn(),
  }),
}));

vi.mock("@/components/chat/ChatInboxNotifier", () => ({
  ChatInboxNotifier: () => null,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Legend: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Bar: () => null,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    dashboardApi: {
      ...actual.dashboardApi,
      getProfessionalMetrics: getProfessionalMetricsMock,
      getServicesMetrics: getServicesMetricsMock,
    },
  };
});

describe("ProfessionalFinancial", () => {
  beforeEach(() => {
    authState.user = { id: "owner-1", role: "OWNER", name: "Owner QA" };
    professionalsState.professionals = [
      { id: "professional-1", userId: "user-1", name: "Ana Costa", isActive: true },
    ];
    getProfessionalMetricsMock.mockReset();
    getServicesMetricsMock.mockReset();

    getProfessionalMetricsMock.mockResolvedValue({
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      professionalId: "professional-1",
      revenueTotal: 10000,
      commissionTotal: 3000,
      completedServices: 1,
      clientsServed: 1,
    });

    getServicesMetricsMock.mockResolvedValue({
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      professionalId: null,
      services: [],
      mostRequestedService: null,
      leastRequestedService: null,
      mostCancelledService: null,
      mostCompletedService: null,
    });
  });

  it("should render dashboard professional monetary values as cents-based financial values", async () => {
    render(
      <MemoryRouter initialEntries={["/financeiro/profissionais"]}>
        <ProfessionalFinancial />
      </MemoryRouter>
    );

    expect(await screen.findByText("Detalhamento por profissional")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 100,00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("R$ 30,00").length).toBeGreaterThan(0);
    expect(screen.queryByText("R$ 1,00")).not.toBeInTheDocument();
  });

  it("should allow manual refresh of professional financial metrics", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/financeiro/profissionais"]}>
        <ProfessionalFinancial />
      </MemoryRouter>
    );

    expect(await screen.findByText("Detalhamento por profissional")).toBeInTheDocument();
    const initialCalls = getProfessionalMetricsMock.mock.calls.length;

    await user.click(screen.getByRole("button", { name: /atualizar agora/i }));

    await waitFor(() => {
      expect(getProfessionalMetricsMock.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});
