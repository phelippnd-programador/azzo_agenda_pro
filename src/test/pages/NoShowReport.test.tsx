import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NoShowReport from "@/pages/report/NoShowReport";

const {
  getNoShowReportMock,
  exportNoShowReportMock,
  getClientsMock,
  getProfessionalsMock,
  getServicesMock,
} = vi.hoisted(() => ({
  getNoShowReportMock: vi.fn(),
  exportNoShowReportMock: vi.fn(),
  getClientsMock: vi.fn(),
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
      getNoShowReport: getNoShowReportMock,
      exportNoShowReport: exportNoShowReportMock,
    },
    clientsApi: {
      ...actual.clientsApi,
      getAll: getClientsMock,
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

describe("NoShowReport", () => {
  const createObjectUrlSpy = vi.spyOn(URL, "createObjectURL");
  const revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL");

  beforeEach(() => {
    getClientsMock.mockResolvedValue({
      items: [{ id: "client-1", name: "Ana Souza", isActive: true }],
    });
    getProfessionalsMock.mockResolvedValue({
      items: [{ id: "prof-1", name: "Maria", isActive: true }],
    });
    getServicesMock.mockResolvedValue({
      items: [{ id: "service-1", name: "Corte", isActive: true }],
    });
    getNoShowReportMock.mockResolvedValue({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      lastUpdatedAt: "2026-03-30T10:00:00Z",
      groupBy: "DAY",
      totalNoShows: 2,
      previousPeriodNoShows: 1,
      lastSevenDaysNoShows: 2,
      completedAppointments: 8,
      noShowRate: 20,
      revenueAtRisk: 200,
      limit: 20,
      afterId: null,
      nextAfterId: null,
      hasMore: false,
      totalItems: 2,
      items: [],
      points: [
        {
          date: "2026-03-25",
          totalNoShows: 1,
          revenueAtRisk: 100,
        },
        {
          date: "2026-03-26",
          totalNoShows: 1,
          revenueAtRisk: 100,
        },
      ],
      groups: [
        {
          key: "2026-03-25",
          label: "2026-03-25",
          totalNoShows: 1,
          revenueAtRisk: 100,
        },
        {
          key: "2026-03-26",
          label: "2026-03-26",
          totalNoShows: 1,
          revenueAtRisk: 100,
        },
      ],
    });
    exportNoShowReportMock.mockResolvedValue(new Blob(["csv"], { type: "text/csv" }));
    createObjectUrlSpy.mockReturnValue("blob:test");
    revokeObjectUrlSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render quantitative report page", async () => {
    render(
      <MemoryRouter initialEntries={["/relatorio/no-show"]}>
        <NoShowReport />
      </MemoryRouter>
    );

    expect(await screen.findByText("Relatorio de no-show")).toBeInTheDocument();
    expect(await screen.findByText("2 no-show(s) no periodo")).toBeInTheDocument();
    expect(await screen.findByText("25/03/2026")).toBeInTheDocument();
    expect(getNoShowReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        groupBy: "DAY",
      })
    );
  });

  it("should export filtered data", async () => {
    render(
      <MemoryRouter initialEntries={["/relatorio/no-show"]}>
        <NoShowReport />
      </MemoryRouter>
    );

    await screen.findByText("2 no-show(s) no periodo");
    fireEvent.click(screen.getByRole("button", { name: /Baixar dados/i }));

    await waitFor(() => {
      expect(exportNoShowReportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          groupBy: "DAY",
        })
      );
      expect(createObjectUrlSpy).toHaveBeenCalled();
      expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:test");
    });
  });
});
