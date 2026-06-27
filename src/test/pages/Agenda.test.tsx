import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Agenda from "@/pages/appointments/Agenda";

const { getMonthlyMetricMock } = vi.hoisted(() => ({
  getMonthlyMetricMock: vi.fn(),
}));

vi.mock("@/hooks/useAppointments", () => ({
  useAppointments: () => ({
    appointments: [],
    pagination: { page: 1, limit: 20, total: 0, hasMore: false },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    goToPage: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointmentStatus: vi.fn(),
    deleteAppointment: vi.fn(),
    reassignAppointmentProfessional: vi.fn(),
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
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useServices", () => ({
  useServices: () => ({
    services: [],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useAvailableSlots", () => ({
  useAvailableSlots: () => ({
    slots: [],
    isLoading: false,
    error: null,
    canFetch: false,
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
    allowedRoutes: ["/agenda"],
    menuItems: [],
    hasRoutePermission: () => true,
    refreshPermissions: vi.fn(),
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    appointmentsApi: {
      ...actual.appointmentsApi,
      getMonthlyMetric: getMonthlyMetricMock,
    },
    nfseApi: {
      getByAppointmentId: vi.fn(),
      issue: vi.fn(),
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/chat/ChatInboxNotifier", () => ({
  ChatInboxNotifier: () => null,
}));

describe("Agenda", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMonthlyMetricMock.mockResolvedValue([]);
  });

  it("should render agenda main actions without runtime crash", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/agenda"]}>
          <Agenda />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole("heading", { name: "Agenda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hoje/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Novo Agendamento/i }).length).toBeGreaterThan(0);
  }, 10000);
});
