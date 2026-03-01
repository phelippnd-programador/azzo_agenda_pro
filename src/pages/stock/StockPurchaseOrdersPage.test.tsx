import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StockPurchaseOrdersPage from "@/pages/stock/StockPurchaseOrdersPage";

const {
  listPurchaseOrdersMock,
  listSuppliersMock,
  createPurchaseOrderMock,
  receivePurchaseOrderMock,
} = vi.hoisted(() => ({
  listPurchaseOrdersMock: vi.fn(),
  listSuppliersMock: vi.fn(),
  createPurchaseOrderMock: vi.fn(),
  receivePurchaseOrderMock: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    stockApi: {
      listPurchaseOrders: listPurchaseOrdersMock,
      listSuppliers: listSuppliersMock,
      createPurchaseOrder: createPurchaseOrderMock,
      receivePurchaseOrder: receivePurchaseOrderMock,
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("StockPurchaseOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register order receiving from detail route", async () => {
    listPurchaseOrdersMock.mockResolvedValue([
      {
        id: "po-1",
        fornecedorId: "sup-1",
        fornecedorNome: "Fornecedor Alpha",
        status: "ENVIADO",
        valorTotal: 1000,
        quantidadeItens: 10,
        quantidadePendente: 10,
        observacao: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    listSuppliersMock.mockResolvedValue([
      {
        id: "sup-1",
        nome: "Fornecedor Alpha",
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    createPurchaseOrderMock.mockResolvedValue({});
    receivePurchaseOrderMock.mockResolvedValue({
      id: "po-1",
      fornecedorId: "sup-1",
      fornecedorNome: "Fornecedor Alpha",
      status: "PARCIALMENTE_RECEBIDO",
      valorTotal: 1000,
      quantidadeItens: 10,
      quantidadePendente: 5,
      observacao: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/estoque/pedidos-compra/po-1"]}>
        <Routes>
          <Route path="/estoque/pedidos-compra/:id" element={<StockPurchaseOrdersPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Pedido po-1/i)).toBeInTheDocument();

    const spinbutton = screen.getByRole("spinbutton");
    await user.clear(spinbutton);
    await user.type(spinbutton, "5");
    await user.click(screen.getByRole("button", { name: "Registrar recebimento" }));

    await waitFor(() => {
      expect(receivePurchaseOrderMock).toHaveBeenCalledWith("po-1", {
        quantidadeRecebida: 5,
        observacao: undefined,
      });
    });
  });
});
