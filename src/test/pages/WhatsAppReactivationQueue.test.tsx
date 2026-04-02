import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WhatsAppReactivationQueue } from "@/components/dashboard/WhatsAppReactivationQueue";
import { dashboardApi } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    dashboardApi: {
      ...actual.dashboardApi,
      getWhatsAppReactivationQueue: vi.fn(),
    },
  };
});

describe("WhatsAppReactivationQueue", () => {
  it("should render recent abandoned cycles with operational context", async () => {
    vi.mocked(dashboardApi.getWhatsAppReactivationQueue).mockResolvedValue({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      statusFilter: "ALL",
      limit: 12,
      exceptionItems: [
        {
          cycleId: "cycle-ex",
          clientId: "client-2",
          conversationId: "conv-2",
          customerName: "Ana Costa",
          status: "CANCELLED",
          statusLabel: "Cancelado",
          lastStage: "TIME_SELECTION",
          lastStageLabel: "Escolha de horario",
          lastServiceName: "Escova",
          cancelReason: "INVALID_DESTINATION",
          latestAttemptStatus: "CANCELLED",
          latestAttemptStatusLabel: "Cancelado",
          latestAttemptError: "INVALID_DESTINATION",
        },
      ],
      items: [
        {
          cycleId: "cycle-1",
          clientId: "client-1",
          conversationId: "conv-1",
          customerName: "Maria Silva",
          userIdentifier: "5511999999999",
          abandonedAt: "2026-03-28T12:30:00Z",
          status: "ACTIVE",
          statusLabel: "Ativo",
          lastStage: "TIME_SELECTION",
          lastStageLabel: "Escolha de horario",
          lastServiceName: "Corte",
          lastProfessionalName: "Phelipp",
          lastRequestedDate: "2026-03-30",
          lastRequestedTime: "15:00",
          customerLastMessage: "Quero agendar para segunda",
          assistantLastPrompt: "Posso te mostrar os horarios",
          nextAttemptNumber: 2,
          nextAttemptAt: "2026-03-30T13:00:00Z",
          latestAttemptNumber: 1,
          latestAttemptStatus: "SENT",
          latestAttemptStatusLabel: "Enviado",
          latestAttemptAt: "2026-03-29T13:00:00Z",
          manualInterventionSuggested: true,
          manualInterventionReason: "STAGE_RETRY_LIMIT",
          manualInterventionAttempts: 4,
        },
      ],
    });

    render(
      <MemoryRouter>
        <WhatsAppReactivationQueue />
      </MemoryRouter>
    );

    expect(await screen.findByText("Fila operacional de abandonos")).toBeInTheDocument();
    expect(screen.getByText("Excecoes que exigem acao humana")).toBeInTheDocument();
    expect(screen.getByText("Ana Costa")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("Escolha de horario")).toBeInTheDocument();
    expect(screen.getByText("Fluxo travado")).toBeInTheDocument();
    expect(screen.getByText("O assistente identificou travamento no fluxo apos 4 tentativas.")).toBeInTheDocument();
    expect(screen.getByText("Corte • Phelipp • 30/03/2026 • 15:00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir conversa/i })).toHaveAttribute("href", "/chat/conv-1");
    expect(screen.getAllByRole("link", { name: /Abrir cliente/i }).some((link) => link.getAttribute("href") === "/clientes/client-1")).toBe(true);
  });

  it("should render empty state when there are no cycles in the filter", async () => {
    vi.mocked(dashboardApi.getWhatsAppReactivationQueue).mockResolvedValue({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      statusFilter: "ALL",
      limit: 12,
      exceptionItems: [],
      items: [],
    });

    render(
      <MemoryRouter>
        <WhatsAppReactivationQueue />
      </MemoryRouter>
    );

    expect(await screen.findByText("Nenhum ciclo encontrado neste filtro")).toBeInTheDocument();
  });
});
