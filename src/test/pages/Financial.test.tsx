import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Financial from "@/pages/Financial";

const { createTransactionMock, deleteTransactionMock, stockGetItemsMock } = vi.hoisted(() => ({
  createTransactionMock: vi.fn(),
  deleteTransactionMock: vi.fn(),
  stockGetItemsMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: () => ({
    transactions: [
      {
        id: "trx-1",
        type: "INCOME",
        description: "Venda de produto",
        amount: 45,
        category: "Produto",
        paymentMethod: "PIX",
        date: new Date().toISOString(),
        professionalId: "prof-1",
      },
    ],
    summary: { totalIncome: 45, totalExpenses: 0, balance: 45 },
    totalCount: 1,
    totalPages: 1,
    page: 0,
    setPage: vi.fn(),
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    createTransaction: createTransactionMock,
    updateTransaction: vi.fn(),
    deleteTransaction: deleteTransactionMock,
  }),
  useTransactionCategories: () => ({
    categories: [{ id: "cat-1", name: "Produto" }],
    isLoading: false,
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  }),
  getDateRangeFromFilter: vi.fn(() => ({
    from: "2026-03-01",
    to: "2026-03-31",
  })),
}));

vi.mock("@/hooks/useProfessionals", () => ({
  useProfessionals: () => ({
    professionals: [{ id: "prof-1", name: "Ana Profissional" }],
    isLoading: false,
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    stockApi: {
      ...actual.stockApi,
      getItems: stockGetItemsMock,
    },
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("Financial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stockGetItemsMock.mockResolvedValue({ items: [{ id: "item-1", nome: "Pomada" }] });
  });

  it("should render summary and existing transaction", async () => {
    render(
      <MemoryRouter initialEntries={["/financeiro"]}>
        <Financial />
      </MemoryRouter>
    );

    expect(await screen.findByText("Entradas")).toBeInTheDocument();
    expect(screen.getByText(/Sa.das/i)).toBeInTheDocument();
    expect(screen.getByText("Venda de produto")).toBeInTheDocument();
    expect(screen.getByText(/Comiss.o vinculada/i)).toBeInTheDocument();
  });

  it("should open income dialog", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/financeiro"]}>
        <Financial />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /Nova Entrada/i }));

    expect(await screen.findByText("Nova Entrada")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: Corte de cabelo - Maria")).toBeInTheDocument();
  });
});
