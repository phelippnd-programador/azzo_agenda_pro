import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NoShowInsights } from "@/components/dashboard/NoShowInsights";

const { getNoShowInsightsMock } = vi.hoisted(() => ({
  getNoShowInsightsMock: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    dashboardApi: {
      ...actual.dashboardApi,
      getNoShowInsights: getNoShowInsightsMock,
    },
  };
});

describe("NoShowInsights", () => {
  beforeEach(() => {
    getNoShowInsightsMock.mockResolvedValue({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      totalNoShows: 1,
      previousPeriodNoShows: 0,
      noShowRate: 50,
      lastSevenDaysNoShows: 1,
      revenueAtRisk: 100,
      recentItems: [
        {
          appointmentId: "appointment-1",
          clientId: "client-1",
          clientName: "Maria Silva",
          professionalId: "professional-1",
          professionalName: "Phelipp Nascimento",
          date: "2026-03-10",
          startTime: "09:00",
          endTime: "10:00",
          totalPrice: 100,
          status: "NO_SHOW",
          serviceNames: ["Corte"],
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render dedicated analytics and operational no-show views", async () => {
    render(
      <MemoryRouter>
        <NoShowInsights />
      </MemoryRouter>
    );

    expect(await screen.findByText("No-show no periodo")).toBeInTheDocument();
    expect(screen.getByText("Lista operacional de no-show")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("50.0%")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 100,00").length).toBeGreaterThan(0);
    expect(screen.getByText("Nao compareceu")).toBeInTheDocument();
  });

  it("should render empty state when there are no no-shows in the current period", async () => {
    getNoShowInsightsMock.mockResolvedValueOnce({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      totalNoShows: 0,
      previousPeriodNoShows: 0,
      noShowRate: 0,
      lastSevenDaysNoShows: 0,
      revenueAtRisk: 0,
      recentItems: [],
    });

    render(
      <MemoryRouter>
        <NoShowInsights />
      </MemoryRouter>
    );

    expect(await screen.findByText("Nenhum no-show registrado no periodo atual.")).toBeInTheDocument();
  });
});
