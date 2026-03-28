import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Index";

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

vi.mock("@/hooks/useDashboard", () => ({
  useDashboardWithOptions: () => ({
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
    error: null,
    refetch: vi.fn(),
  }),
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
    professionals: [],
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
    user: { id: "owner-1", role: "OWNER", name: "Owner QA" },
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

describe("Dashboard", () => {
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
    expect(screen.getByText("RevenueChartMock")).toBeInTheDocument();
  });
});
