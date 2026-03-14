import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StockInventoriesPage from "@/pages/stock/StockInventoriesPage";

const {
  listInventoriesMock,
  getItemsMock,
  createInventoryMock,
  registerInventoryCountMock,
  closeInventoryMock,
} = vi.hoisted(() => ({
  listInventoriesMock: vi.fn(),
  getItemsMock: vi.fn(),
  createInventoryMock: vi.fn(),
  registerInventoryCountMock: vi.fn(),
  closeInventoryMock: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    stockApi: {
      listInventories: listInventoriesMock,
      getItems: getItemsMock,
      createInventory: createInventoryMock,
      registerInventoryCount: registerInventoryCountMock,
      closeInventory: closeInventoryMock,
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("StockInventoriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create inventory and register count", async () => {
    listInventoriesMock.mockResolvedValue([
      {
        id: "inv-1",
        nome: "Inventario 1",
        status: "ABERTO",
        observacao: null,
        dataAbertura: new Date().toISOString(),
        dataFechamento: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    getItemsMock.mockResolvedValue([
      {
        id: "item-1",
        nome: "Shampoo",
        unidadeMedida: "UN",
        saldoAtual: 10,
        estoqueMinimo: 1,
        ativo: true,
      },
    ]);
    createInventoryMock.mockResolvedValue({
      id: "inv-2",
      nome: "Inventario novo",
      status: "ABERTO",
      observacao: null,
      dataAbertura: new Date().toISOString(),
      dataFechamento: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    registerInventoryCountMock.mockResolvedValue({
      id: "inv-1",
      nome: "Inventario 1",
      status: "EM_CONTAGEM",
      observacao: null,
      dataAbertura: new Date().toISOString(),
      dataFechamento: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    closeInventoryMock.mockResolvedValue({
      id: "inv-1",
      nome: "Inventario 1",
      status: "FECHADO",
      observacao: null,
      dataAbertura: new Date().toISOString(),
      dataFechamento: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/estoque/inventarios/inv-1"]}>
        <Routes>
          <Route path="/estoque/inventarios/:id" element={<StockInventoriesPage />} />
          <Route path="/estoque/inventarios/novo" element={<StockInventoriesPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Inventarios de estoque")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "item-1");
    await user.clear(screen.getByRole("spinbutton"));
    await user.type(screen.getByRole("spinbutton"), "12");
    await user.click(screen.getByRole("button", { name: "Registrar contagem" }));

    await waitFor(() => {
      expect(registerInventoryCountMock).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Fechar inventario" }));
    await waitFor(() => {
      expect(closeInventoryMock).toHaveBeenCalled();
    });
  });
});
