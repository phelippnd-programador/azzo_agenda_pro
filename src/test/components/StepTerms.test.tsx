import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepTerms } from "@/components/onboarding/steps/StepTerms";

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getTermsOfUse: vi.fn(),
  getPrivacyPolicy: vi.fn(),
}));

vi.mock("@/lib/api/legal", () => ({
  publicLegalApi: {
    getAll: mocks.getAll,
    getTermsOfUse: mocks.getTermsOfUse,
    getPrivacyPolicy: mocks.getPrivacyPolicy,
  },
}));

describe("StepTerms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAll.mockResolvedValue({
      termsOfUse: { version: "2026.03" },
      privacyPolicy: { version: "2026.02" },
    });
    mocks.getTermsOfUse.mockResolvedValue({
      documentType: "TERMS_OF_USE",
      version: "2026.03",
      title: "Termos de Uso",
      content: "Conteudo real dos termos.",
      contentHash: "abc",
      createdAt: "2026-03-01T00:00:00Z",
    });
  });

  it("loads the real current version and reports it to the parent", async () => {
    const onVersionsLoaded = vi.fn();

    render(
      <StepTerms
        termsRead={false}
        lgpdConsent={false}
        onReadComplete={vi.fn()}
        onLgpdConsent={vi.fn()}
        onVersionsLoaded={onVersionsLoaded}
      />
    );

    await waitFor(() => {
      expect(onVersionsLoaded).toHaveBeenCalledWith({
        termsVersion: "2026.03",
        privacyVersion: "2026.02",
      });
    });

    expect(screen.getByText(/Termos de Uso \(v2026\.03\)/)).toBeInTheDocument();
    expect(screen.getByText(/Política de Privacidade \(v2026\.02\)/)).toBeInTheDocument();
  });

  it("keeps the accept checkbox disabled until versions finish loading", async () => {
    let resolveVersions: (() => void) | null = null;
    mocks.getAll.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveVersions = () =>
            resolve({
              termsOfUse: { version: "2026.03" },
              privacyPolicy: { version: "2026.02" },
            });
        })
    );

    render(
      <StepTerms
        termsRead={false}
        lgpdConsent={false}
        onReadComplete={vi.fn()}
        onLgpdConsent={vi.fn()}
        onVersionsLoaded={vi.fn()}
      />
    );

    expect(screen.getByRole("checkbox", { name: /Li e aceito/i })).toBeDisabled();

    resolveVersions?.();
    await waitFor(() => {
      expect(mocks.getAll).toHaveBeenCalled();
    });
  });

  it("reports null to the parent when the versions request fails", async () => {
    mocks.getAll.mockRejectedValue(new Error("network error"));
    const onVersionsLoaded = vi.fn();

    render(
      <StepTerms
        termsRead={false}
        lgpdConsent={false}
        onReadComplete={vi.fn()}
        onLgpdConsent={vi.fn()}
        onVersionsLoaded={onVersionsLoaded}
      />
    );

    await waitFor(() => {
      expect(onVersionsLoaded).toHaveBeenCalledWith(null);
    });
    expect(
      screen.getByText(/Não foi possível carregar a versão vigente dos termos/)
    ).toBeInTheDocument();
  });

  it("opens the real document content when clicking the terms link", async () => {
    const user = userEvent.setup();

    render(
      <StepTerms
        termsRead={false}
        lgpdConsent={false}
        onReadComplete={vi.fn()}
        onLgpdConsent={vi.fn()}
        onVersionsLoaded={vi.fn()}
      />
    );

    await waitFor(() => expect(mocks.getAll).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /Termos de Uso/ }));

    expect(await screen.findByText("Conteudo real dos termos.")).toBeInTheDocument();
  });
});
