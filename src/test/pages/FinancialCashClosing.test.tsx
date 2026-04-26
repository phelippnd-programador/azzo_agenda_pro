import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import FinancialCashClosing from "@/pages/FinancialCashClosing";

const {
  getAllMock,
  openMock,
  closeMock,
  reconcileMock,
  createTransactionMock,
  updateTransactionMock,
  deleteTransactionMock,
  refetchTransactionsMock,
} = vi.hoisted(() => ({
  getAllMock: vi.fn(),
  openMock: vi.fn(),
  closeMock: vi.fn(),
  reconcileMock: vi.fn(),
  createTransactionMock: vi.fn(),
  updateTransactionMock: vi.fn(),
  deleteTransactionMock: vi.fn(),
  refetchTransactionsMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/components/common/DeleteConfirmationDialog", () => ({
  DeleteConfirmationDialog: () => null,
}));

vi.mock("@/components/financial/TransactionDialog", () => ({
  TransactionDialog: () => null,
}));

vi.mock("@/components/financial/TransactionList", () => ({
  TransactionList: ({ transactions, readOnly }: { transactions: Array<{ description: string }>; readOnly?: boolean }) => (
    <div>
      <div>Lista de transacoes</div>
      <div>{readOnly ? "somente-leitura" : "operacao-aberta"}</div>
      {transactions.map((transaction) => (
        <div key={transaction.description}>{transaction.description}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: () => ({
    transactions: [
      {
        id: "tx-1",
        description: "Venda no caixa",
        category: "Servico",
        type: "INCOME",
        amount: 12000,
        paymentMethod: "PIX",
        date: new Date("2026-04-24T12:00:00Z"),
      },
    ],
    summary: { totalIncome: 12000, totalExpenses: 0, balance: 12000 },
    totalCount: 1,
    totalPages: 1,
    page: 0,
    setPage: vi.fn(),
    isLoading: false,
    createTransaction: createTransactionMock,
    updateTransaction: updateTransactionMock,
    deleteTransaction: deleteTransactionMock,
    refetch: refetchTransactionsMock,
  }),
  useTransactionCategories: () => ({
    categories: [{ id: "cat-1", name: "Servico" }],
    isLoading: false,
    createCategory: vi.fn(),
  }),
}));

vi.mock("@/hooks/useProfessionals", () => ({
  useProfessionals: () => ({
    professionals: [],
  }),
}));

vi.mock("@/lib/api/finance", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/finance")>("@/lib/api/finance");
  return {
    ...actual,
    cashClosingsApi: {
      getAll: getAllMock,
      open: openMock,
      close: closeMock,
      getById: vi.fn(),
    },
    transactionsApi: {
      ...actual.transactionsApi,
      reconcile: reconcileMock,
    },
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const openClosing = {
  id: "cash-1",
  tenantId: "tenant-1",
  businessDate: "2026-04-24",
  status: "OPEN" as const,
  openedAt: "2026-04-24T11:00:00Z",
  openedBy: "user-1",
  openingNotes: "Abertura inicial",
  closedAt: null,
  closedBy: null,
  closingNotes: null,
  expectedTotals: { CASH: 2500, CREDIT_CARD: 4000, DEBIT_CARD: 1500, PIX: 9000, OTHER: 0 },
  countedTotals: { CASH: 0, CREDIT_CARD: 0, DEBIT_CARD: 0, PIX: 0, OTHER: 0 },
  differenceTotals: { CASH: 0, CREDIT_CARD: 0, DEBIT_CARD: 0, PIX: 0, OTHER: 0 },
  totalExpected: 17000,
  totalCounted: 0,
  totalDifference: 0,
};

describe("FinancialCashClosing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllMock.mockResolvedValue([openClosing]);
    openMock.mockResolvedValue(openClosing);
    closeMock.mockResolvedValue({
      ...openClosing,
      status: "CLOSED",
      countedTotals: { CASH: 2500, CREDIT_CARD: 4000, DEBIT_CARD: 1500, PIX: 9000, OTHER: 0 },
      totalCounted: 17000,
      closedAt: "2026-04-24T22:00:00Z",
    });
  });

  it("should render operational cash view and details", async () => {
    render(
      <MemoryRouter initialEntries={["/financeiro/fechamento-caixa"]}>
        <FinancialCashClosing />
      </MemoryRouter>
    );

    expect(await screen.findByText("Historico")).toBeInTheDocument();
    expect(screen.getByText("Operacao do caixa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nova entrada/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nova saida/i })).toBeInTheDocument();
    expect(screen.getByText("Lista de transacoes")).toBeInTheDocument();
    expect(screen.getByText("Venda no caixa")).toBeInTheDocument();
  });

  it("should open cash closing dialog and submit new opening", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/financeiro/fechamento-caixa"]}>
        <FinancialCashClosing />
      </MemoryRouter>
    );

    await screen.findByText("Historico");
    await user.click(screen.getByRole("button", { name: /Abrir caixa/i }));
    await user.type(screen.getByLabelText("Observacoes"), "Abertura do turno da tarde");
    await user.click(screen.getByRole("button", { name: /Confirmar abertura/i }));

    await waitFor(() =>
      expect(openMock).toHaveBeenCalledWith(
        expect.objectContaining({
          businessDate: expect.any(String),
          notes: "Abertura do turno da tarde",
        })
      )
    );
  }, 10000);
});
