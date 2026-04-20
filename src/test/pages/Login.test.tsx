import { act, render, screen } from "@testing-library/react";
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
  navigate: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mocks.login,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

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
    localStorage.clear();
    mocks.me.mockResolvedValue({ id: "owner-1", role: "OWNER" });
    mocks.getCurrentBillingSubscription.mockResolvedValue({
      status: "ACTIVE",
      licenseStatus: "ACTIVE",
      currentPaymentStatus: "PAID",
    });
  });

  it("should render login form and submit valid credentials", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("E-mail")).toHaveFocus();
    await user.type(screen.getByLabelText("E-mail"), "owner@qa.local");
    await user.type(screen.getByLabelText("Senha"), "Pr14052019!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(mocks.login).toHaveBeenCalledWith("owner@qa.local", "Pr14052019!", undefined);
    expect(mocks.navigate).toHaveBeenCalledWith("/dashboard");
    expect(await screen.findByText("Bem-vindo de volta!")).toBeInTheDocument();
  });

  it("should persist only the email locally when remember option is checked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("E-mail"), "owner@qa.local");
    await user.type(screen.getByLabelText("Senha"), "Pr14052019!");
    await user.click(screen.getByLabelText("Salvar e-mail neste dispositivo"));
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(JSON.parse(localStorage.getItem("azzo_remembered_login") || "{}")).toEqual({
      email: "owner@qa.local",
    });
  });

  it("should show loading state while login is in progress", async () => {
    const user = userEvent.setup();
    let resolveLogin: (() => void) | null = null;
    mocks.login.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveLogin = resolve;
        })
    );

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("E-mail"), "owner@qa.local");
    await user.type(screen.getByLabelText("Senha"), "Pr14052019!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByRole("button", { name: /Entrando/i })).toBeDisabled();

    await act(async () => {
      resolveLogin?.();
    });
  });

  it("should sanitize legacy remembered credentials and preload only the email", () => {
    localStorage.setItem(
      "azzo_remembered_login",
      JSON.stringify({
        email: "owner@qa.local",
        password: "Pr14052019!",
      })
    );

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("E-mail")).toHaveValue("owner@qa.local");
    expect(screen.getByLabelText("Senha")).toHaveValue("");
    expect(JSON.parse(localStorage.getItem("azzo_remembered_login") || "{}")).toEqual({
      email: "owner@qa.local",
    });
  });

  it("should redirect professional user to agenda after login", async () => {
    const user = userEvent.setup();
    mocks.me.mockResolvedValue({ id: "prof-1", role: "PROFESSIONAL" });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("E-mail"), "prof@qa.local");
    await user.type(screen.getByLabelText("Senha"), "Pr14052019!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(mocks.login).toHaveBeenCalledWith("prof@qa.local", "Pr14052019!", undefined);
    expect(mocks.navigate).toHaveBeenCalledWith("/agenda");
  });
});
