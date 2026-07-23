import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CatalogReportPage from "@/pages/report/CatalogReportPage";

const { getCatalogMock, exportCatalogMock, getProfessionalsMock } = vi.hoisted(() => ({
  getCatalogMock: vi.fn(),
  exportCatalogMock: vi.fn(),
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

vi.mock("@/lib/api/professionals", () => ({
  professionalsApi: {
    getAll: getProfessionalsMock,
  },
}));

vi.mock("@/lib/api/reports", () => ({
  reportsApi: {
    getCatalog: getCatalogMock,
    exportCatalog: exportCatalogMock,
  },
}));

describe("CatalogReportPage", () => {
  beforeEach(() => {
    getProfessionalsMock.mockResolvedValue({
      items: [{ id: "prof-1", name: "Maria", isActive: true }],
    });
    getCatalogMock.mockResolvedValue({
      reportKey: "faturamento-servico",
      title: "Faturamento por servico",
      dependencies: ["agenda"],
      columns: ["servico", "quantidade", "receita"],
      rows: [
        {
          servico: "Corte",
          quantidade: 4,
          receita: 320,
        },
      ],
      pageIndex: 0,
      pageSize: 50,
      hasMore: false,
    });
    exportCatalogMock.mockResolvedValue(new Blob(["csv"], { type: "text/csv" }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render catalog report rows from generic reports endpoint", async () => {
    render(
      <MemoryRouter initialEntries={["/relatorio/catalogo"]}>
        <CatalogReportPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Catalogo avancado de relatorios")).toBeInTheDocument();
    expect(await screen.findAllByText("Faturamento por servico")).toHaveLength(2);
    expect(await screen.findByText("Corte")).toBeInTheDocument();
    expect(await screen.findByText("R$ 320,00")).toBeInTheDocument();
    expect(getCatalogMock).toHaveBeenCalledWith(
      "faturamento-servico",
      expect.objectContaining({
        dataInicio: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        dataFim: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        pageIndex: 0,
        pageSize: 50,
      })
    );
  });
});
