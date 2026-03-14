import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StockTransfersPage from "@/pages/stock/StockTransfersPage";

const { listTransfersMock, getItemsMock, sendTransferMock, receiveTransferMock } = vi.hoisted(() => ({
  listTransfersMock: vi.fn(),
  getItemsMock: vi.fn(),
  sendTransferMock: vi.fn(),
  receiveTransferMock: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    stockApi: {
      listTransfers: listTransfersMock,
      getItems: getItemsMock,
      createTransfer: vi.fn(),
      sendTransfer: sendTransferMock,
      receiveTransfer: receiveTransferMock,
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("StockTransfersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send and receive transfer based on status", async () => {
    listTransfersMock.mockResolvedValue([
      {
        id: "tr-1",
        origem: "Matriz",
        destino: "Filial",
        status: "RASCUNHO",
        itemEstoqueId: "item-1",
        itemNome: "Shampoo",
        quantidade: 10,
        observacao: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tr-2",
        origem: "Matriz",
        destino: "Filial",
        status: "ENVIADA",
        itemEstoqueId: "item-1",
        itemNome: "Shampoo",
        quantidade: 5,
        observacao: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    getItemsMock.mockResolvedValue([
      {
        id: "item-1",
        nome: "Shampoo",
        unidadeMedida: "UN",
        saldoAtual: 100,
        estoqueMinimo: 10,
        ativo: true,
      },
    ]);
    sendTransferMock.mockResolvedValue({});
    receiveTransferMock.mockResolvedValue({});
    const user = userEvent.setup();

    render(<StockTransfersPage />);

    expect(await screen.findByText("Transferencias")).toBeInTheDocument();

    const sendButtons = screen.getAllByRole("button", { name: "Enviar" });
    await user.click(sendButtons[0]);
    await waitFor(() => expect(sendTransferMock).toHaveBeenCalledWith("tr-1"));

    const receiveButtons = screen.getAllByRole("button", { name: "Receber" });
    await user.click(receiveButtons[1]);
    await waitFor(() => expect(receiveTransferMock).toHaveBeenCalledWith("tr-2"));
  });
});
