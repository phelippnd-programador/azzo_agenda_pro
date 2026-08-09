import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeatmapReportPage from "@/pages/report/HeatmapReportPage";

const { getHeatmapMock, getProfessionalsMock } = vi.hoisted(() => ({
  getHeatmapMock: vi.fn(),
  getProfessionalsMock: vi.fn(),
}));

vi.mock("@/components/chat/ChatInboxNotifier", () => ({
  ChatInboxNotifier: () => null,
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({
    children,
    title,
    subtitle,
  }: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </div>
  ),
}));

vi.mock("@/contexts/MenuPermissionsContext", () => ({
  useMenuPermissions: () => ({
    allowedRoutes: ["/relatorio/ocupacao"],
  }),
}));

vi.mock("@/lib/api/professionals", () => ({
  professionalsApi: {
    getAll: getProfessionalsMock,
  },
}));

vi.mock("@/lib/api/reports", () => ({
  reportsApi: {
    getHeatmap: getHeatmapMock,
  },
}));

describe("HeatmapReportPage", () => {
  beforeEach(() => {
    getProfessionalsMock.mockResolvedValue({
      items: [{ id: "prof-1", name: "Maria", isActive: true }],
    });
    getHeatmapMock.mockResolvedValue({
      dataInicio: "2026-03-01",
      dataFim: "2026-03-31",
      professionalId: null,
      matrix: [
        null,
        [
          null,
          {
            diaSemana: 1,
            hora: 9,
            agendamentos: 3,
            minutosOcupados: 150,
            minutosDisponiveis: 240,
            ocupacaoPercent: 62.5,
          },
        ],
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render heatmap filters, summary and occupied slot", async () => {
    render(
      <MemoryRouter initialEntries={["/relatorio/ocupacao"]}>
        <HeatmapReportPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Mapa de ocupacao")).toBeInTheDocument();
    expect(await screen.findByText("Ocupacao media")).toBeInTheDocument();
    expect(await screen.findAllByText("62.5%")).toHaveLength(2);
    expect(await screen.findByText("Seg 09h")).toBeInTheDocument();
    expect(getHeatmapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dataInicio: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        dataFim: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        professionalId: undefined,
      })
    );
  });
});
