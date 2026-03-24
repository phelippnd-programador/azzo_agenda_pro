import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ClientProfile from "@/pages/ClientProfile";

const { clientsGetByIdMock, getAppointmentHistoryMock, appointmentGetByIdMock, servicesGetAllMock } = vi.hoisted(() => ({
  clientsGetByIdMock: vi.fn(),
  getAppointmentHistoryMock: vi.fn(),
  appointmentGetByIdMock: vi.fn(),
  servicesGetAllMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </div>
  ),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    clientsApi: {
      ...actual.clientsApi,
      getById: clientsGetByIdMock,
      getAppointmentHistory: getAppointmentHistoryMock,
    },
    appointmentsApi: {
      ...actual.appointmentsApi,
      getById: appointmentGetByIdMock,
    },
    servicesApi: {
      ...actual.servicesApi,
      getAll: servicesGetAllMock,
    },
  };
});

describe("ClientProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    clientsGetByIdMock.mockResolvedValue({
      id: "client-1",
      name: "Maria Cliente",
      email: "maria@qa.local",
      phone: "11999999999",
      notes: "Cliente recorrente",
      totalVisits: 8,
      totalSpent: 540,
      createdAt: "2026-01-10T12:00:00Z",
      topServices: [],
    });

    getAppointmentHistoryMock.mockResolvedValue({
      clientId: "client-1",
      page: 1,
      size: 10,
      totalItems: 1,
      items: [
        {
          appointmentId: "apt-1",
          date: "2026-03-20",
          status: "COMPLETED",
          professionalName: "Ana Profissional",
          notes: "Atendimento concluido com sucesso",
          services: [
            {
              serviceId: "svc-1",
              service: { id: "svc-1", name: "Corte", category: "Cabelo" },
              durationMinutes: 60,
              unitPrice: 120,
              totalPrice: 120,
            },
          ],
          careNotes: [],
        },
      ],
    });

    servicesGetAllMock.mockResolvedValue({
      items: [
        {
          id: "svc-1",
          tenantId: "tenant-1",
          name: "Corte",
          description: "Corte feminino",
          duration: 60,
          price: 120,
          category: "Cabelo",
          professionalIds: [],
          isActive: true,
          createdAt: "2026-01-01T12:00:00Z",
        },
      ],
    });

    appointmentGetByIdMock.mockResolvedValue({
      appointment: {
        id: "apt-1",
        tenantId: "tenant-1",
        clientId: "client-1",
        client: {
          id: "client-1",
          tenantId: "tenant-1",
          name: "Maria Cliente",
          email: "maria@qa.local",
          phone: "11999999999",
          totalVisits: 8,
          totalSpent: 540,
          createdAt: "2026-01-10T12:00:00Z",
        },
        professionalId: "prof-1",
        professional: {
          id: "prof-1",
          tenantId: "tenant-1",
          userId: "user-1",
          name: "Ana Profissional",
          email: "ana@qa.local",
          phone: "11888888888",
          specialties: ["Corte"],
          commissionRate: 40,
          workingHours: [],
          isActive: true,
          createdAt: "2026-01-01T12:00:00Z",
        },
        items: [
          {
            serviceId: "svc-1",
            service: {
              id: "svc-1",
              tenantId: "tenant-1",
              name: "Corte",
              description: "Corte feminino",
              duration: 60,
              price: 120,
              category: "Cabelo",
              professionalIds: [],
              isActive: true,
              createdAt: "2026-01-01T12:00:00Z",
            },
            durationMinutes: 60,
            unitPrice: 120,
            totalPrice: 120,
          },
        ],
        date: "2026-03-20",
        startTime: "14:00",
        endTime: "15:00",
        status: "COMPLETED",
        notes: "Cliente aprovou o resultado",
        totalPrice: 120,
        createdAt: "2026-03-19T12:00:00Z",
      },
      careNotes: [
        {
          noteId: "note-1",
          appointmentId: "apt-1",
          clientId: "client-1",
          recordedAt: "2026-03-20T15:05:00Z",
          serviceExecutionNotes: "Corte finalizado sem intercorrencias",
          clientFeedbackNotes: "Cliente gostou do acabamento",
          internalFollowupNotes: "Oferecer pacote de hidratacao",
        },
      ],
      timeline: [
        {
          eventId: "event-1",
          action: "APPOINTMENT_STATUS_UPDATED",
          actionLabel: "Status atualizado",
          actorName: "Ana Profissional",
          actorRole: "PROFESSIONAL",
          status: "COMPLETED",
          sourceChannel: "WEB",
          createdAt: "2026-03-20T15:00:00Z",
          changedFields: ["status"],
          before: { status: "IN_PROGRESS" },
          after: { status: "COMPLETED" },
          metadata: { route: "/agenda" },
        },
      ],
    });
  });

  it("should open appointment detail dialog from client history", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/clientes/client-1"]}>
        <Routes>
          <Route path="/clientes/:id" element={<ClientProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Perfil do Cliente" })).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Detalhe do atendimento em/i }));

    expect(await screen.findByText("Detalhes do Agendamento")).toBeInTheDocument();
    expect(screen.getByText("Timeline do agendamento")).toBeInTheDocument();
    expect(screen.getByText("Status atualizado")).toBeInTheDocument();
    expect(screen.getByText(/Execucao: Corte finalizado sem intercorrencias/i)).toBeInTheDocument();
    expect(appointmentGetByIdMock).toHaveBeenCalledWith("apt-1");
  });
});
