import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "@/pages/Login";

const mocks = vi.hoisted(() => ({
  login: vi.fn().mockResolvedValue(undefined),
  me: vi.fn().mockResolvedValue({ id: "owner-1", role: "OWNER" }),
  getCurrentBillingSubscription: vi.fn().mockResolvedValue({
    status: "ACTIVE",
    licenseStatus: "ACTIVE",
    currentPaymentStatus: "PAID",
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mocks.login,
  }),
}));

vi.mock("@/services/billingService", () => ({
  getCurrentBillingSubscription: mocks.getCurrentBillingSubscription,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      me: mocks.me,
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form and submit valid credentials", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("E-mail"), "owner@qa.local");
    await user.type(screen.getByLabelText("Senha"), "Pr14052019!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(mocks.login).toHaveBeenCalledWith("owner@qa.local", "Pr14052019!", undefined);
    expect(await screen.findByText("Bem-vindo de volta!")).toBeInTheDocument();
  });
});
