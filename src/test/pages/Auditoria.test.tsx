import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Auditoria from "@/pages/Auditoria";

const { fetchNextPageMock, refetchMock, exportEventsMock } = vi.hoisted(() => ({
  fetchNextPageMock: vi.fn(),
  refetchMock: vi.fn(),
  exportEventsMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => <div><h1>{title}</h1>{children}</div>,
}));

vi.mock("@/hooks/useAuditEvents", () => ({
  useAuditEvents: () => ({
    filters: {
      from: new Date("2026-03-01T00:00:00Z").toISOString(),
      to: new Date("2026-03-14T00:00:00Z").toISOString(),
    },
    applyFilters: vi.fn(),
    items: [{
      id: "audit-1",
      createdAt: new Date().toISOString(),
      module: "RBAC",
      action: "RBAC_PERMISSION_UPDATE",
      entityType: "ENTITY",
      status: "SUCCESS",
      actorName: "Admin QA",
      actorUserId: "admin-1",
      requestId: "req-1",
    }],
    aggregations: {
      byModule: [{ key: "RBAC", count: 1 }],
      byStatus: [{ key: "SUCCESS", count: 1 }],
      byAction: [{ key: "RBAC_PERMISSION_UPDATE", count: 1 }],
    },
    hasNext: false,
    nextCursor: null,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    fetchNextPage: fetchNextPageMock,
    refetch: refetchMock,
  }),
}));

vi.mock("@/hooks/useAuditExport", () => ({
  useAuditExport: () => ({ isExporting: false, lastExport: null, exportEvents: exportEventsMock }),
}));

vi.mock("@/hooks/useAuditEventDetail", () => ({
  useAuditEventDetail: () => ({
    eventDetail: {
      id: "audit-1",
      createdAt: new Date().toISOString(),
      module: "RBAC",
      action: "RBAC_PERMISSION_UPDATE",
      entityType: "ENTITY",
      requestId: "req-1",
      sourceChannel: "WEB",
      ipAddress: "127.0.0.1",
      eventHash: "hash-1",
      prevEventHash: null,
      chainValid: true,
      before: { role: "PROFESSIONAL" },
      after: { role: "OWNER" },
      metadata: { route: "/profissionais/:id" },
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
        modules: ["RBAC"],
        statuses: ["SUCCESS"],
        actions: ["RBAC_PERMISSION_UPDATE"],
        entityTypes: ["ENTITY"],
        sourceChannels: ["WEB"],
      }),
      listRetentionEvents: vi.fn().mockResolvedValue({ items: [] }),
    },
  };
});

describe("Auditoria", () => {
  it("should render audit filters and events", async () => {
    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    expect(await screen.findByText("Filtros de consulta")).toBeInTheDocument();
    expect(screen.getByText("Eventos")).toBeInTheDocument();
    expect(screen.getByText("Acoes mais executadas")).toBeInTheDocument();
  });

  it("should open event detail dialog", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auditoria"]}>
        <Auditoria />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Ver detalhe do evento/i }));

    expect(await screen.findByText("Detalhe do evento")).toBeInTheDocument();
    expect(screen.getByText("Diff de alteracoes")).toBeInTheDocument();
  });
});
