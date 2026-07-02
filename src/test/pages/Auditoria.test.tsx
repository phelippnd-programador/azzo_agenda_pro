import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Auditoria from "@/pages/Auditoria";

const { fetchNextPageMock, refetchMock, exportEventsMock, applyFiltersMock } = vi.hoisted(() => ({
  fetchNextPageMock: vi.fn(),
  refetchMock: vi.fn(),
  exportEventsMock: vi.fn(),
  applyFiltersMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

const mockItems = [
  {
    id: "audit-1",
    createdAt: new Date("2026-03-10T10:00:00Z").toISOString(),
    module: "RBAC",
    action: "RBAC_PERMISSION_UPDATE",
    entityType: "ENTITY",
    entityId: "entity-1",
    status: "SUCCESS",
    actorName: "Admin QA",
    actorUserId: "admin-1",
    actorRole: "OWNER",
    requestId: "req-1",
    sourceChannel: "API",
    ipAddress: "192.168.1.1",
    alterado: true,
    camposAlterados: ["role"],
  },
  {
    id: "audit-2",
    createdAt: new Date("2026-03-10T11:00:00Z").toISOString(),
    module: "WHATSAPP",
    action: "WHATSAPP_CONFIG_UPDATE",
    entityType: "WHATSAPP_CONFIG",
    entityId: "tenant-1",
    status: "SUCCESS",
    actorName: "Owner",
    actorUserId: "owner-1",
    actorRole: "OWNER",
    requestId: "req-2",
    sourceChannel: "API",
    ipAddress: "192.168.1.2",
    alterado: true,
    camposAlterados: ["phoneNumberId"],
  },
];

vi.mock("@/hooks/useAuditEvents", () => ({
  useAuditEvents: () => ({
    filters: {
      from: new Date("2026-03-01T00:00:00Z").toISOString(),
      to: new Date("2026-03-14T00:00:00Z").toISOString(),
    },
    applyFilters: applyFiltersMock,
    items: mockItems,
    aggregations: {
      byModule: [
        { key: "RBAC", count: 1 },
        { key: "WHATSAPP", count: 1 },
      ],
      byStatus: [{ key: "SUCCESS", count: 2 }],
      byAction: [
        { key: "RBAC_PERMISSION_UPDATE", count: 1 },
        { key: "WHATSAPP_CONFIG_UPDATE", count: 1 },
      ],
    },
    hasNext: true,
    nextCursor: "cursor-abc",
    isLoading: false,
    isLoadingMore: false,
    error: null,
    fetchNextPage: fetchNextPageMock,
    refetch: refetchMock,
  }),
}));

vi.mock("@/hooks/useAuditExport", () => ({
  useAuditExport: () => ({
    isExporting: false,
    lastExport: null,
    exportEvents: exportEventsMock,
  }),
}));

vi.mock("@/hooks/useAuditEventDetail", () => ({
  useAuditEventDetail: () => ({
    eventDetail: {
      id: "audit-1",
      createdAt: new Date("2026-03-10T10:00:00Z").toISOString(),
      module: "RBAC",
      action: "RBAC_PERMISSION_UPDATE",
      entityType: "ENTITY",
      entityId: "entity-1",
      requestId: "req-1",
      sourceChannel: "API",
      ipAddress: "192.168.1.1",
      actorName: "Admin QA",
      actorRole: "OWNER",
      status: "SUCCESS",
      eventHash: "hash-abc",
      prevEventHash: "hash-prev",
      chainValid: true,
      alterado: true,
      camposAlterados: ["role"],
      before: { role: "PROFESSIONAL" },
      after: { role: "OWNER" },
      metadata: { route: "/profissionais/:id" },
      errorCode: null,
      errorMessage: null,
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    auditoriaApi: {
      ...actual.auditoriaApi,
      getFilterOptions: vi.fn().mockResolvedValue({
        modules: ["RBAC", "WHATSAPP", "APPOINTMENT"],
        statuses: ["SUCCESS", "ERROR", "DENIED"],
        actions: ["RBAC_PERMISSION_UPDATE", "WHATSAPP_CONFIG_UPDATE", "APPOINTMENT_CREATE"],
        entityTypes: ["ENTITY", "WHATSAPP_CONFIG", "APPOINTMENT"],
        sourceChannels: ["API", "SCHEDULER"],
      }),
      listRetentionEvents: vi.fn().mockResolvedValue({
        items: [
          {
            id: "ret-1",
            tenantId: "tenant-1",
            policyVersion: "v1",
            retentionPeriodDays: 365,
            windowStart: "2025-01-01T00:00:00Z",
            windowEnd: "2025-03-01T00:00:00Z",
            affectedRows: 1500,
            executedBy: "SCHEDULER",
            executionId: "exec-1",
            evidenceHash: "hash-evidence",
            createdAt: "2025-03-01T00:00:00Z",
          },
        ],
        hasNext: false,
        nextCursor: null,
      }),
      downloadExport: vi.fn().mockReturnValue("/auditoria/events/export/export-1"),
    },
  };
});

describe("Auditoria", () => {
  it("renderiza filtros e tabela de eventos", async () => {
    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    expect(await screen.findByText("Filtros de consulta")).toBeInTheDocument();
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.getByText("Acoes mais executadas")).toBeInTheDocument();
  });

  it("exibe eventos na tabela com modulos corretos", async () => {
    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    // moduleLabel("RBAC") = "Permissões de acesso" aparece na tabela e nos cards
    const rbacTexts = await screen.findAllByText("Permissões de acesso");
    expect(rbacTexts.length).toBeGreaterThan(0);
    // moduleLabel("WHATSAPP") = "WhatsApp" aparece na tabela
    const waTexts = await screen.findAllByText("WhatsApp");
    expect(waTexts.length).toBeGreaterThan(0);
  });

  it("exibe cards de aggregacao com modulo WhatsApp", async () => {
    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    expect(await screen.findByText("Modulos mais frequentes")).toBeInTheDocument();
    expect(screen.getByText("Status dos eventos")).toBeInTheDocument();
    expect(screen.getByText("Acoes mais executadas")).toBeInTheDocument();
  });

  it("abre dialog de detalhe ao clicar no botao", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    const detailButtons = await screen.findAllByRole("button", { name: /Ver detalhe do evento/i });
    await user.click(detailButtons[0]);

    expect(await screen.findByText("Detalhe do evento")).toBeInTheDocument();
    expect(screen.getByText("Diff de alteracoes")).toBeInTheDocument();
  });

  it("exibe diff de campos alterados no dialog", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    const detailButtons = await screen.findAllByRole("button", { name: /Ver detalhe do evento/i });
    await user.click(detailButtons[0]);

    expect(await screen.findByText("role")).toBeInTheDocument();
  });

  it("botao Carregar mais chama fetchNextPage", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    const loadMore = await screen.findByRole("button", { name: /Carregar mais/i });
    await user.click(loadMore);

    expect(fetchNextPageMock).toHaveBeenCalledTimes(1);
  });

  it("botao Atualizar chama refetch", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Atualizar/i }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("botoes de exportacao chamam exportEvents com formato correto", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Exportar CSV/i }));
    expect(exportEventsMock).toHaveBeenCalledWith(expect.objectContaining({ format: "CSV" }));

    await user.click(screen.getByRole("button", { name: /Exportar JSON/i }));
    expect(exportEventsMock).toHaveBeenCalledWith(expect.objectContaining({ format: "JSON" }));
  });

  it("exibe eventos de retencao carregados", async () => {
    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    expect(await screen.findByText("Eventos de retencao e expurgo")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Linhas afetadas/i)).toBeInTheDocument();
    });
  });

  it("aplica filtros ao clicar em Aplicar filtros", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Aplicar filtros/i }));
    expect(applyFiltersMock).toHaveBeenCalledTimes(1);
  });
});
