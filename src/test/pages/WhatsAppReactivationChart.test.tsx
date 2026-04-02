import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { WhatsAppReactivationChart } from "@/components/dashboard/WhatsAppReactivationChart";
import { dashboardApi } from "@/lib/api";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
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
      getWhatsAppReactivationMetrics: vi.fn(),
    },
  };
});

describe("WhatsAppReactivationChart", () => {
  it("should render abandonment, reactivation and stage metrics", async () => {
    vi.mocked(dashboardApi.getWhatsAppReactivationMetrics).mockResolvedValue({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      totalAbandoned: 12,
      totalReactivated: 5,
      totalConverted: 3,
      reactivationRate: 41.7,
      stoppedAtServiceSelection: 2,
      stoppedAtProfessionalSelection: 3,
      stoppedAtTimeSelection: 5,
      stoppedAtFinalReview: 2,
      points: [
        {
          metricDate: "2026-03-28",
          abandonedCount: 3,
          reactivatedCount: 1,
          convertedCount: 1,
        },
      ],
    });

    render(<WhatsAppReactivationChart />);

    expect(await screen.findByText("Reativacao de abandono no WhatsApp")).toBeInTheDocument();
    expect(screen.getAllByText("Abandonos").length).toBeGreaterThan(0);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getAllByText("Reativados").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Convertidos").length).toBeGreaterThan(0);
    expect(screen.getByText("41.7%")).toBeInTheDocument();
    expect(screen.getByText("Servico")).toBeInTheDocument();
    expect(screen.getByText("Profissional")).toBeInTheDocument();
    expect(screen.getByText("Horario")).toBeInTheDocument();
    expect(screen.getByText("Revisao final")).toBeInTheDocument();
  });

  it("should render empty state when there is no abandonment data", async () => {
    vi.mocked(dashboardApi.getWhatsAppReactivationMetrics).mockResolvedValue({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      totalAbandoned: 0,
      totalReactivated: 0,
      totalConverted: 0,
      reactivationRate: 0,
      stoppedAtServiceSelection: 0,
      stoppedAtProfessionalSelection: 0,
      stoppedAtTimeSelection: 0,
      stoppedAtFinalReview: 0,
      points: [],
    });

    render(<WhatsAppReactivationChart />);

    expect(await screen.findByText("Sem abandonos capturados no periodo")).toBeInTheDocument();
  });
});
