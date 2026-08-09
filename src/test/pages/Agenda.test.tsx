import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Agenda from "@/pages/appointments/Agenda";
import type { Appointment } from "@/hooks/useAppointments";

const { getMonthlyMetricMock, getByIdMock, updateAppointmentStatusMock, getAllMock } = vi.hoisted(() => ({
  getMonthlyMetricMock: vi.fn(),
  getByIdMock: vi.fn(),
  updateAppointmentStatusMock: vi.fn(),
  getAllMock: vi.fn(),
}));

const baseAppointment: Appointment = {
  id: "apt-1",
  tenantId: "tenant-1",
  clientId: "client-1",
  client: { id: "client-1", name: "Maria Souza" } as Appointment["client"],
  professionalId: "prof-1",
  professional: { id: "prof-1", name: "Joana" } as Appointment["professional"],
  serviceId: "svc-1",
  service: { id: "svc-1", name: "Corte" } as Appointment["service"],
  items: [],
  date: new Date(),
  startTime: "10:00",
  endTime: "10:30",
  status: "PENDING",
  totalPrice: 80,
  createdAt: new Date(),
};

let mockAppointments: Appointment[] = [];

vi.mock("@/hooks/useAppointments", () => ({
  useAppointments: () => ({
    appointments: mockAppointments,
    pagination: { page: 1, limit: 20, total: mockAppointments.length, hasMore: false },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    goToPage: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointmentStatus: updateAppointmentStatusMock,
    deleteAppointment: vi.fn(),
    reassignAppointmentProfessional: vi.fn(),
  }),
}));

vi.mock("@/hooks/useProfessionals", () => ({
  useProfessionals: () => ({
    professionals: [{ id: "prof-1", name: "Joana", isActive: true, specialties: [] }],
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
      getById: getByIdMock,
      getAll: getAllMock,
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
    mockAppointments = [];
    getMonthlyMetricMock.mockResolvedValue([]);
    updateAppointmentStatusMock.mockResolvedValue({});
    getAllMock.mockResolvedValue([]);
  });

  const renderAgenda = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/agenda"]}>
          <Agenda />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("should render agenda main actions without runtime crash", async () => {
    renderAgenda();

    expect(await screen.findByRole("heading", { name: "Agenda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hoje/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Novo Agendamento/i }).length).toBeGreaterThan(0);
  }, 10000);

  it("asks for confirmation before cancelling an appointment, naming the client", async () => {
    mockAppointments = [{ ...baseAppointment, status: "PENDING" }];
    const user = userEvent.setup();
    renderAgenda();

    const menuTrigger = await screen.findByRole("button", { name: "Mais ações do agendamento" });
    expect(menuTrigger).toBeTruthy();
    await user.click(menuTrigger!);

    await user.click(await screen.findByText("Cancelar"));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/Maria Souza/)).toBeInTheDocument();
    // Ainda nao chamou a API - so mostrou a confirmacao.
    expect(updateAppointmentStatusMock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar agendamento" }));

    await waitFor(() => {
      expect(updateAppointmentStatusMock).toHaveBeenCalledWith("apt-1", "CANCELLED");
    });
  }, 15000);

  it("blocks completing an appointment without a care note instead of opening the money dialog", async () => {
    mockAppointments = [{ ...baseAppointment, status: "IN_PROGRESS" }];
    getByIdMock.mockResolvedValue({
      appointment: mockAppointments[0],
      careNotes: [],
      timeline: [],
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    renderAgenda();

    const menuTrigger = await screen.findByRole("button", { name: "Mais ações do agendamento" });
    await user.click(menuTrigger!);
    await user.click(await screen.findByText("Concluir atendimento"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Registre ao menos um detalhe do atendimento antes de concluir."
      );
    });
    expect(updateAppointmentStatusMock).not.toHaveBeenCalled();
    // O dialogo de dinheiro nao abre - o sheet de detalhes abre no lugar.
    expect(screen.queryByText("O que fazer com o valor deste atendimento?")).not.toBeInTheDocument();
    expect(await screen.findByText("Detalhes do Agendamento")).toBeInTheDocument();
  }, 15000);

  it("shows client, service and amount before confirming a completion", async () => {
    mockAppointments = [{ ...baseAppointment, status: "IN_PROGRESS" }];
    getByIdMock.mockResolvedValue({
      appointment: mockAppointments[0],
      careNotes: [{ noteId: "note-1", recordedAt: new Date().toISOString() }],
      timeline: [],
    });
    const user = userEvent.setup();
    renderAgenda();

    const menuTrigger = await screen.findByRole("button", { name: "Mais ações do agendamento" });
    await user.click(menuTrigger!);
    await user.click(await screen.findByText("Concluir atendimento"));

    const moneyDialog = (await screen.findByText("O que fazer com o valor deste atendimento?")).closest(
      '[role="dialog"]'
    ) as HTMLElement;
    expect(moneyDialog).toBeTruthy();
    expect(within(moneyDialog).getByText("Maria Souza")).toBeInTheDocument();
    expect(within(moneyDialog).getByText(/Corte/)).toBeInTheDocument();
    expect(within(moneyDialog).getByText("R$ 80,00")).toBeInTheDocument();
  }, 15000);

  it("caches the weekly view per filter instead of refetching all 7 days every time", async () => {
    const user = userEvent.setup();
    const { container } = renderAgenda();
    const statusTrigger = () =>
      container.querySelector('[data-tour="agenda-filter-status"]') as HTMLElement;

    await user.click(await screen.findByRole("button", { name: "Semana" }));
    await waitFor(() => {
      expect(getAllMock).toHaveBeenCalledTimes(7);
    });

    // Troca de status: filtro novo, precisa buscar de novo (mais 7 chamadas).
    await user.click(statusTrigger());
    await user.click(await screen.findByText("Confirmado"));
    await waitFor(() => {
      expect(getAllMock).toHaveBeenCalledTimes(14);
    });

    // Volta para "Todos status": chave ja usada antes (a primeira busca) -
    // react-query serve do cache, sem nenhuma chamada nova.
    await user.click(statusTrigger());
    await user.click(await screen.findByText("Todos status"));
    await waitFor(() => {
      expect(statusTrigger()).toHaveTextContent("Todos status");
    });
    expect(getAllMock).toHaveBeenCalledTimes(14);
  }, 15000);
});
