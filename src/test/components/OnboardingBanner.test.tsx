import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";

const mocks = vi.hoisted(() => ({
  getStatus: vi.fn(),
}));

vi.mock("@/lib/api/onboarding", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/onboarding")>("@/lib/api/onboarding");
  return {
    ...actual,
    onboardingApi: { ...actual.onboardingApi, getStatus: mocks.getStatus },
  };
});

const baseStatus = {
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
};

function renderBanner() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OnboardingBanner />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("OnboardingBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the setup reminder when onboarding is pending", async () => {
    mocks.getStatus.mockResolvedValue(baseStatus);

    renderBanner();

    expect(await screen.findByText(/ainda não está completamente configurada/)).toBeInTheDocument();
  });

  it("stays hidden when the owner explicitly skipped onboarding", async () => {
    // skipOnboarding no backend marca apenas onboardingSkipped (nunca
    // onboardingComplete) — sem checar esse campo o aviso voltaria sempre.
    mocks.getStatus.mockResolvedValue({ ...baseStatus, onboardingSkipped: true });

    renderBanner();

    await waitFor(() => expect(mocks.getStatus).toHaveBeenCalled());
    expect(screen.queryByText(/ainda não está completamente configurada/)).not.toBeInTheDocument();
  });

  it("stays hidden once onboarding is complete", async () => {
    mocks.getStatus.mockResolvedValue({ ...baseStatus, onboardingComplete: true });

    renderBanner();

    await waitFor(() => expect(mocks.getStatus).toHaveBeenCalled());
    expect(screen.queryByText(/ainda não está completamente configurada/)).not.toBeInTheDocument();
  });
});
