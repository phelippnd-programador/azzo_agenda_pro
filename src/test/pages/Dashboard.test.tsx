import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Index";

const {
  logoutMock,
  refetchMock,
  getCustomerMetricsMock,
  getProfessionalMetricsMock,
  dashboardState,
  authState,
  professionalsState,
} = vi.hoisted(() => ({
  logoutMock: vi.fn(),
  refetchMock: vi.fn(),
  getCustomerMetricsMock: vi.fn(),
  getProfessionalMetricsMock: vi.fn(),
  dashboardState: {
    metrics: {
      todayAppointments: 4,
      todayRevenue: 250,
      monthlyRevenue: 3200,
      totalClients: 18,
      todayAppointmentsGrowthPercent: 10,
      todayRevenueGrowthPercent: 5,
      totalClientsGrowthPercent: 2,
      monthlyRevenueGrowthPercent: 12,
      pendingAppointments: 2,
      completedToday: 1,
      notConcludedToday: 3,
      stoppedAtServiceSelection: 1,
      stoppedAtProfessionalSelection: 1,
      stoppedAtTimeSelection: 1,
      stoppedAtFinalReview: 0,
    },
    isLoading: false,
    error: null as string | null,
    refetch: vi.fn(),
  },
  authState: {
    user: { id: "owner-1", role: "OWNER", name: "Owner QA" },
  },
  professionalsState: {
    professionals: [],
  },
}));

vi.mock("@/components/dashboard/UpcomingAppointments", () => ({
  UpcomingAppointments: () => <div>UpcomingAppointmentsMock</div>,
}));

vi.mock("@/components/dashboard/RevenueChart", () => ({
  RevenueChart: () => <div>RevenueChartMock</div>,
}));

vi.mock("@/components/dashboard/MonthlyRevenueLineChart", () => ({
  MonthlyRevenueLineChart: () => <div>MonthlyRevenueLineChartMock</div>,
}));

vi.mock("@/components/dashboard/WhatsAppReactivationChart", () => ({
  WhatsAppReactivationChart: () => <div>WhatsAppReactivationChartMock</div>,
}));

vi.mock("@/components/dashboard/WhatsAppReactivationQueue", () => ({
  WhatsAppReactivationQueue: () => <div>WhatsAppReactivationQueueMock</div>,
}));

vi.mock("@/hooks/useDashboard", () => ({
  useDashboardWithOptions: () => dashboardState,
}));

vi.mock("@/hooks/useAppointments", () => ({
  useAppointments: () => ({
    appointments: [],
    isLoading: false,
    updateAppointmentStatus: vi.fn(),
  }),
}));

vi.mock("@/hooks/useProfessionals", () => ({
  useProfessionals: () => ({
    professionals: professionalsState.professionals,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useClients", () => ({
  useClients: () => ({
    clients: [],
  }),
}));

vi.mock("@/hooks/useServices", () => ({
  useServices: () => ({
    services: [],
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: authState.user,
    logout: logoutMock,
  }),
}));

vi.mock("@/contexts/MenuPermissionsContext", () => ({
  useMenuPermissions: () => ({
    isLoading: false,
    allowedRoutes: ["/dashboard"],
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
    dashboardApi: {
      ...actual.dashboardApi,
      getCustomerMetrics: getCustomerMetricsMock,
      getProfessionalMetrics: getProfessionalMetricsMock,
    },
  };
});

describe("Dashboard", () => {
  beforeEach(() => {
    authState.user = { id: "owner-1", role: "OWNER", name: "Owner QA" };
    professionalsState.professionals = [];
    dashboardState.error = null;
    dashboardState.refetch = refetchMock;
    refetchMock.mockReset();
    logoutMock.mockReset();
    getCustomerMetricsMock.mockResolvedValue({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      lastUpdatedAt: "2026-03-30T10:00:00Z",
      items: [],
    });
    getProfessionalMetricsMock.mockResolvedValue({
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      professionalId: "professional-1",
      revenueTotal: 1800,
      commissionTotal: 540,
      completedServices: 22,
      clientsServed: 14,
    });
    window.localStorage.setItem("auth_user", JSON.stringify({ id: "owner-1", role: "OWNER" }));
  });

  it("should render fixed-period guidance and key metric cards", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText("Periodo das metricas")).toBeInTheDocument();
    expect(screen.getByText("Agendamentos Hoje")).toBeInTheDocument();
    expect(screen.getByText("Faturamento Hoje")).toBeInTheDocument();
    expect(screen.getByText("Nao Concluidos Hoje no Agendamento")).toBeInTheDocument();
    expect(screen.getByText("WhatsAppReactivationChartMock")).toBeInTheDocument();
    expect(screen.getByText("WhatsAppReactivationQueueMock")).toBeInTheDocument();
    expect(screen.getByText("No-show no periodo")).toBeInTheDocument();
    expect(screen.getByText("Top profissionais no dashboard")).toBeInTheDocument();
    expect(screen.getByText("RevenueChartMock")).toBeInTheDocument();
  });

  it("should load professional cards from materialized metrics endpoint", async () => {
    authState.user = { id: "user-prof-1", role: "PROFESSIONAL", name: "Prof QA" };
    professionalsState.professionals = [
      {
        id: "professional-1",
        userId: "user-prof-1",
        name: "Prof QA",
        isActive: true,
        specialties: [],
      },
    ];
    window.localStorage.setItem("auth_user", JSON.stringify({ id: "user-prof-1", role: "PROFESSIONAL" }));

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText("Servicos concluidos")).toBeInTheDocument();
    expect(screen.getByText("Faturamento no periodo")).toBeInTheDocument();
    expect(screen.getByText("Clientes atendidos")).toBeInTheDocument();
    expect(screen.getByText("Comissao no periodo")).toBeInTheDocument();
    expect(screen.queryByText("WhatsAppReactivationChartMock")).not.toBeInTheDocument();
    expect(screen.queryByText("No-show no periodo")).not.toBeInTheDocument();
    expect(getProfessionalMetricsMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      "professional-1"
    );
  });
});
