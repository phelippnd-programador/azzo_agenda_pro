import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StockItemsPage from "@/pages/stock/StockItemsPage";

const { getItemsMock, updateItemMock } = vi.hoisted(() => ({
  getItemsMock: vi.fn(),
  updateItemMock: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    stockApi: {
      getItems: getItemsMock,
      createItem: vi.fn(),
      updateItem: updateItemMock,
      getMovements: vi.fn(),
      createMovement: vi.fn(),
      getDashboard: vi.fn(),
      listImportJobs: vi.fn(),
      createImportJob: vi.fn(),
      getImportJobById: vi.fn(),
      getImportErrors: vi.fn(),
      getImportResultFile: vi.fn(),
      cancelImportJob: vi.fn(),
      getItemById: vi.fn(),
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const buildItems = (count: number) =>
  new Array(count).fill(null).map((_, index) => ({
    id: `item-${index + 1}`,
    nome: `Item ${index + 1}`,
    sku: `SKU-${index + 1}`,
    unidadeMedida: "UN",
    saldoAtual: index + 1,
    estoqueMinimo: 2,
    custoMedioUnitario: 10,
    ativo: true,
  }));

describe("StockItemsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should paginate items and allow status toggle", async () => {
    getItemsMock.mockResolvedValue(buildItems(15));
    updateItemMock.mockResolvedValue({});
    const user = userEvent.setup();

    render(<StockItemsPage />);

    expect(await screen.findByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Pagina 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Proxima" }));
    expect(await screen.findByText("Item 13")).toBeInTheDocument();

    const toggleButtons = screen.getAllByRole("button", { name: /Inativar|Ativar/i });
    await user.click(toggleButtons[0]);

    await waitFor(() => {
      expect(updateItemMock).toHaveBeenCalled();
    });
  });
});
