import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppointmentManagementReport from "@/pages/report/AppointmentManagementReport";

const {
  getManagementReportMock,
  exportManagementReportMock,
  getProfessionalsMock,
  getServicesMock,
} = vi.hoisted(() => ({
  getManagementReportMock: vi.fn(),
  exportManagementReportMock: vi.fn(),
  getProfessionalsMock: vi.fn(),
  getServicesMock: vi.fn(),
}));

vi.mock("@/components/chat/ChatInboxNotifier", () => ({
  ChatInboxNotifier: () => null,
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    appointmentsApi: {
      ...actual.appointmentsApi,
      getManagementReport: getManagementReportMock,
      exportManagementReport: exportManagementReportMock,
    },
    professionalsApi: {
      ...actual.professionalsApi,
      getAll: getProfessionalsMock,
    },
    servicesApi: {
      ...actual.servicesApi,
      getAll: getServicesMock,
    },
  };
});

describe("AppointmentManagementReport", () => {
  const createObjectUrlSpy = vi.spyOn(URL, "createObjectURL");
  const revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL");

  beforeEach(() => {
    getProfessionalsMock.mockResolvedValue({
      items: [{ id: "prof-1", name: "Maria", isActive: true }],
    });
    getServicesMock.mockResolvedValue({
      items: [{ id: "service-1", name: "Corte", isActive: true }],
    });
    getManagementReportMock.mockResolvedValue({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      lastUpdatedAt: "2026-03-30T10:00:00Z",
      totalAppointments: 12,
      totalConfirmed: 5,
      totalPending: 2,
      totalCancelled: 2,
      totalNoShow: 1,
      totalCompleted: 2,
      totalRevenue: 1200,
      totalGapOpportunities: 3,
      totalUnconfirmed: 2,
      totalAbandonmentSignalDays: 1,
      occupancyRate: 58.3,
      cancellationRate: 16.7,
      noShowRate: 8.3,
      limit: 100,
      totalItems: 12,
      alerts: [
        {
          code: "UNCONFIRMED_APPOINTMENTS",
          title: "Agendamentos sem confirmacao",
          description: "2 agendamento(s) ainda estao pendentes e exigem confirmacao manual.",
          severity: "warning",
        },
      ],
      opportunities: [
        {
          code: "GAP_OPPORTUNITIES",
          title: "Janelas livres entre atendimentos",
          description: "3 agendamento(s) possuem intervalo livre relevante apos o atendimento.",
          severity: "opportunity",
        },
      ],
      items: [
        {
          appointmentId: "app-1",
          date: "2026-03-25",
          startTime: "09:00",
          endTime: "10:00",
          clientName: "Ana Souza",
          professionalName: "Maria",
          serviceLabel: "Corte | Barba",
          status: "PENDING",
          origin: "MANUAL",
          totalPrice: 120,
          flagHorarioVago: true,
          flagNaoConfirmado: true,
          flagAbandonoFluxo: false,
        },
      ],
    });
    exportManagementReportMock.mockResolvedValue(new Blob(["csv"], { type: "text/csv" }));
    createObjectUrlSpy.mockReturnValue("blob:test");
    revokeObjectUrlSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render management report page", async () => {
    render(
      <MemoryRouter initialEntries={["/relatorio/agendamento"]}>
        <AppointmentManagementReport />
      </MemoryRouter>
    );

    expect(await screen.findByText("Relatorio gerencial de agendamentos")).toBeInTheDocument();
    expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
    expect(await screen.findByText("Agendamentos sem confirmacao")).toBeInTheDocument();
    expect(getManagementReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        limit: 100,
      })
    );
  });

  it("should apply filters", async () => {
    render(
      <MemoryRouter initialEntries={["/relatorio/agendamento"]}>
        <AppointmentManagementReport />
      </MemoryRouter>
    );

    await screen.findByText("Ana Souza");

    fireEvent.click(screen.getByRole("button", { name: /Aplicar filtros/i }));

    await waitFor(() => {
      expect(getManagementReportMock).toHaveBeenCalled();
    });
  });

  it("should export filtered report as csv", async () => {
    render(
      <MemoryRouter initialEntries={["/relatorio/agendamento"]}>
        <AppointmentManagementReport />
      </MemoryRouter>
    );

    await screen.findByText("Ana Souza");
    fireEvent.click(screen.getByRole("button", { name: /Baixar CSV/i }));

    await waitFor(() => {
      expect(exportManagementReportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          status: "all",
        })
      );
      expect(createObjectUrlSpy).toHaveBeenCalled();
      expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:test");
    });
  });
});
