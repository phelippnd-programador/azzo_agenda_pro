import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OnboardingPage from "@/pages/OnboardingPage";
import { useOnboardingStore } from "@/stores/onboarding";

const mocks = vi.hoisted(() => ({
  getStatus: vi.fn(),
  updateStep: vi.fn().mockResolvedValue(undefined),
  skip: vi.fn(),
  complete: vi.fn(),
  acceptTerms: vi.fn(),
  getSalonProfile: vi.fn(),
  updateSalonProfile: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock("@/lib/api/onboarding", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/onboarding")>("@/lib/api/onboarding");
  return {
    ...actual,
    onboardingApi: {
      ...actual.onboardingApi,
      getStatus: mocks.getStatus,
      updateStep: mocks.updateStep,
      skip: mocks.skip,
      complete: mocks.complete,
      acceptTerms: mocks.acceptTerms,
    },
  };
});

vi.mock("@/lib/api/salon", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/salon")>("@/lib/api/salon");
  return {
    ...actual,
    salonApi: {
      ...actual.salonApi,
      getProfile: mocks.getSalonProfile,
      updateProfile: mocks.updateSalonProfile,
    },
  };
});

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem("azzo:onboarding:draft");
    useOnboardingStore.setState({
      currentStep: 1,
      salonData: null,
      professionals: [],
      services: [],
    });

    mocks.getStatus.mockResolvedValue({
      onboardingComplete: false,
      onboardingSkipped: false,
      currentStep: 1,
      hasProfessionals: false,
      hasServices: false,
      hasAssignments: false,
      hasBusinessHours: false,
      termsAccepted: true,
      termsVersion: "2026.03",
      completedAt: null,
    });

    mocks.getSalonProfile.mockResolvedValue({
      salonName: "Salão da Maria",
      salonSlug: "salao-da-maria",
      salonPhone: "(11) 99999-9999",
      salonEmail: "contato@salaodamaria.com.br",
      city: "",
      state: "",
      businessHours: [],
      specialClosureDates: [],
    });
    mocks.updateSalonProfile.mockResolvedValue({});
  });

  it("renders the salon step with prefilled data and keeps the render loop stable", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/onboarding"]}>
          <OnboardingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Conte-nos sobre o seu salão")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome do salão/)).toHaveValue("Salão da Maria");
    });
    expect(screen.getByLabelText(/Telefone/)).toHaveValue("(11) 99999-9999");

    // salonInitialData e memoizado em OnboardingPage (useMemo) justamente para
    // o objeto de pre-preenchimento nao virar uma referencia nova a cada
    // render — o que, em producao, reacionava o efeito de reset() do
    // StepSalon em loop (React error #185, "Maximum update depth exceeded").
    // Este smoke test nao reproduz o loop de forma confiavel no ambiente de
    // teste (timing de watch()/reset() do react-hook-form aqui difere do
    // browser), mas serve como guarda basica: confere que o valor fica
    // estavel e que nenhum erro desse tipo foi logado.
    await new Promise((resolve) => setTimeout(resolve, 200));
    const loggedMaxUpdateDepthError = consoleErrorSpy.mock.calls.some((args) =>
      args.some((arg) => typeof arg === "string" && arg.includes("Maximum update depth exceeded"))
    );
    expect(loggedMaxUpdateDepthError).toBe(false);
    expect(screen.getByLabelText(/Nome do salão/)).toHaveValue("Salão da Maria");

    consoleErrorSpy.mockRestore();
  });

  it("persists the salon profile via salonApi.updateProfile before advancing to Serviços", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/onboarding"]}>
          <OnboardingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome do salão/)).toHaveValue("Salão da Maria");
    });

    await user.click(screen.getByLabelText(/Tipo de negócio/));
    await user.click(await screen.findByText("Salão Feminino"));
    await user.type(screen.getByLabelText(/Cidade/), "São Paulo");
    await user.click(screen.getByLabelText(/Estado/));
    await user.click(await screen.findByText("SP"));

    const nextButton = await screen.findByRole("button", { name: /Próxima etapa/ });
    await waitFor(() => expect(nextButton).toBeEnabled());
    await user.click(nextButton);

    await waitFor(() => {
      expect(mocks.updateSalonProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          salonName: "Salão da Maria",
          salonPhone: "(11) 99999-9999",
          salonEmail: "contato@salaodamaria.com.br",
          city: "São Paulo",
          state: "SP",
        })
      );
    });

    // Ordem pedida: Servicos antes de Profissionais.
    expect(await screen.findByText("Quais serviços vocês oferecem?")).toBeInTheDocument();
  });
});
