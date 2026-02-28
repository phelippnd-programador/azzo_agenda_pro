import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StockSuppliersPage from "@/pages/stock/StockSuppliersPage";

const { listSuppliersMock, createSupplierMock, updateSupplierMock } = vi.hoisted(() => ({
  listSuppliersMock: vi.fn(),
  createSupplierMock: vi.fn(),
  updateSupplierMock: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    stockApi: {
      listSuppliers: listSuppliersMock,
      createSupplier: createSupplierMock,
      updateSupplier: updateSupplierMock,
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const suppliers = new Array(11).fill(null).map((_, index) => ({
  id: `sup-${index + 1}`,
  nome: `Fornecedor ${index + 1}`,
  documento: `00.000.000/000${index + 1}-00`,
  email: `fornecedor${index + 1}@mail.com`,
  telefone: "(11) 1111-1111",
  contato: "Contato",
  ativo: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

describe("StockSuppliersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should paginate suppliers and create a new one", async () => {
    listSuppliersMock.mockResolvedValue(suppliers);
    createSupplierMock.mockResolvedValue({});
    const user = userEvent.setup();

    render(<StockSuppliersPage />);

    expect(await screen.findByText("Fornecedor 1")).toBeInTheDocument();
    expect(screen.getByText("Pagina 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Proxima" }));
    expect(await screen.findByText("Fornecedor 11")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Novo fornecedor" }));
    const dialog = screen.getByRole("dialog");
    const nameInput = within(dialog).getAllByRole("textbox")[0];
    await user.type(nameInput, "Fornecedor Novo");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(createSupplierMock).toHaveBeenCalled();
    });
  });
});
