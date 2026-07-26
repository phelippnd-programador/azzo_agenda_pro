import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "@/pages/Login";
import { ApiError } from "@/lib/api/core";

const mocks = vi.hoisted(() => ({
  login: vi.fn().mockResolvedValue(undefined),
  me: vi.fn().mockResolvedValue({ id: "owner-1", role: "OWNER" }),
  getCurrentBillingSubscription: vi.fn().mockResolvedValue({
    status: "ACTIVE",
    licenseStatus: "ACTIVE",
    currentPaymentStatus: "PAID",
  }),
  getOnboardingStatus: vi.fn().mockResolvedValue({
    onboardingComplete: true,
    onboardingSkipped: false,
    currentStep: 6,
    hasProfessionals: true,
    hasServices: true,
    hasAssignments: true,
    hasBusinessHours: true,
    termsAccepted: true,
    termsVersion: "1.0",
    completedAt: "2026-01-01T00:00:00Z",
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

vi.mock("@/lib/api/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/auth")>("@/lib/api/auth");
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      me: mocks.me,
    },
  };
});

vi.mock("@/lib/api/onboarding", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/onboarding")>("@/lib/api/onboarding");
  return {
    ...actual,
    onboardingApi: {
      ...actual.onboardingApi,
      getStatus: mocks.getOnboardingStatus,
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
    sessionStorage.clear();
    mocks.me.mockResolvedValue({ id: "owner-1", role: "OWNER" });
    mocks.getCurrentBillingSubscription.mockResolvedValue({
      status: "ACTIVE",
      licenseStatus: "ACTIVE",
      currentPaymentStatus: "PAID",
    });
    mocks.getOnboardingStatus.mockResolvedValue({
      onboardingComplete: true,
      onboardingSkipped: false,
      currentStep: 6,
      hasProfessionals: true,
      hasServices: true,
      hasAssignments: true,
      hasBusinessHours: true,
      termsAccepted: true,
      termsVersion: "1.0",
      completedAt: "2026-01-01T00:00:00Z",
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

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith("owner@qa.local", "Pr14052019!", undefined);
      expect(mocks.navigate).toHaveBeenCalledWith("/dashboard");
    });
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

    expect(JSON.parse(sessionStorage.getItem("azzo_remembered_login") || "{}")).toEqual({
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
    sessionStorage.setItem(
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
    expect(JSON.parse(sessionStorage.getItem("azzo_remembered_login") || "{}")).toEqual({
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

  it("should redirect owner to onboarding when it is not complete nor skipped", async () => {
    const user = userEvent.setup();
    mocks.getOnboardingStatus.mockResolvedValue({
      onboardingComplete: false,
      onboardingSkipped: false,
      currentStep: 0,
      hasProfessionals: false,
      hasServices: false,
      hasAssignments: false,
      hasBusinessHours: false,
      termsAccepted: false,
      termsVersion: null,
      completedAt: null,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("E-mail"), "owner@qa.local");
    await user.type(screen.getByLabelText("Senha"), "Pr14052019!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("should not redirect owner to onboarding when it was explicitly skipped", async () => {
    const user = userEvent.setup();
    mocks.getOnboardingStatus.mockResolvedValue({
      onboardingComplete: false,
      onboardingSkipped: true,
      currentStep: 0,
      hasProfessionals: false,
      hasServices: false,
      hasAssignments: false,
      hasBusinessHours: false,
      termsAccepted: true,
      termsVersion: "1.0",
      completedAt: null,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("E-mail"), "owner@qa.local");
    await user.type(screen.getByLabelText("Senha"), "Pr14052019!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should request MFA code when backend requires additional verification", async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValueOnce(new ApiError("MFA required", 428));

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("E-mail"), "owner@qa.local");
    await user.type(screen.getByLabelText("Senha"), "Pr14052019!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText(/Verifica/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/C.digo MFA/i)).toBeInTheDocument();
  });
});
