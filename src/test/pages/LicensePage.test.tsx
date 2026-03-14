import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LicensePage from "@/pages/LicensePage";

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </div>
  ),
}));

vi.mock("@/components/billing/CreditCardForm", () => ({ CreditCardForm: () => <div>CreditCardFormMock</div> }));
vi.mock("@/components/billing/PaymentMethodSelector", () => ({ PaymentMethodSelector: ({ value }: { value: string }) => <div>Metodo atual: {value}</div> }));
vi.mock("@/components/billing/PlanSelector", () => ({ PlanSelector: () => <div>PlanSelectorMock</div> }));
vi.mock("@/components/billing/PixPaymentView", () => ({ PixPaymentView: () => <div>PixPaymentViewMock</div> }));
vi.mock("@/components/billing/BoletoPaymentView", () => ({ BoletoPaymentView: () => <div>BoletoPaymentViewMock</div> }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "owner-1", name: "Owner QA", email: "owner@qa.local", phone: "11999999999" } }),
}));

vi.mock("@/hooks/useCheckoutProducts", () => ({
  useCheckoutProducts: () => ({
    products: [{ id: "plan-pro", name: "Plano Pro", description: "Plano principal", price: 99, features: ["Agenda", "Financeiro"] }],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useLicenseAccess", () => ({
  useLicenseAccess: () => ({ refreshStatus: vi.fn().mockResolvedValue("ACTIVE") }),
}));

vi.mock("@/services/billingService", () => ({
  createBillingSubscription: vi.fn(),
  getBillingPayments: vi.fn().mockResolvedValue({ items: [{ id: "pay-1", amountCents: 9900, billingType: "PIX", status: "PENDING", referenceMonth: "2026-03", dueDate: "2026-03-20", createdAt: "2026-03-14T00:00:00Z", pixPayload: "pix-code" }] }),
  getBillingErrorMessage: vi.fn().mockImplementation(() => "Erro billing"),
  getCurrentBillingSubscription: vi.fn().mockResolvedValue({
    productId: "plan-pro",
    planCode: "plan-pro",
    amountCents: 9900,
    status: "ACTIVE",
    paymentStatus: "CONFIRMED",
    currentPaymentStatus: "CONFIRMED",
    billingType: "PIX",
    currentPaymentId: "pay-1",
    currentPaymentDueDate: "2026-03-20",
    nextDueDate: "2026-03-20",
    cycle: "MONTHLY",
    licenseStatus: "ACTIVE",
    pixPayload: "pix-code",
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    salonApi: {
      ...actual.salonApi,
      getProfile: vi.fn().mockResolvedValue({ salonCpfCnpj: "12345678901" }),
    },
  };
});

vi.mock("sonner", () => ({ toast: { success: toastSuccessMock, error: toastErrorMock, info: vi.fn() } }));

describe("LicensePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render current subscription and payment history", async () => {
    render(
      <MemoryRouter initialEntries={["/financeiro/licenca"]}>
        <LicensePage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Assinatura atual")).toBeInTheDocument();
    expect(screen.getAllByText(/Plano Pro/).length).toBeGreaterThan(0);
    expect(screen.getByText("Historico de pagamentos")).toBeInTheDocument();
    expect(screen.getByText(/Metodo atual:/)).toBeInTheDocument();
  });

  it("should open payment details dialog", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/financeiro/licenca"]}>
        <LicensePage />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Ver detalhes do pagamento/i }));

    expect(await screen.findByText("Detalhes do pagamento")).toBeInTheDocument();
    expect(screen.getAllByText("PixPaymentViewMock").length).toBeGreaterThan(1);
  });
});
