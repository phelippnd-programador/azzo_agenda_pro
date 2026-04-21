import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "@/pages/Register";

const mocks = vi.hoisted(() => ({
  register: vi.fn().mockResolvedValue(undefined),
  navigate: vi.fn(),
  getAll: vi.fn().mockResolvedValue({
    termsOfUse: { version: "2026.03" },
    privacyPolicy: { version: "2026.03" },
  }),
  getTermsOfUse: vi.fn().mockResolvedValue({
    title: "Termos de Uso",
    version: "2026.03",
    createdAt: "2026-03-14T10:00:00Z",
    content: "Conteudo termos",
  }),
  getPrivacyPolicy: vi.fn().mockResolvedValue({
    title: "Politica de Privacidade",
    version: "2026.03",
    createdAt: "2026-03-14T10:00:00Z",
    content: "Conteudo politica",
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ register: mocks.register }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    publicLegalApi: {
      ...actual.publicLegalApi,
      getAll: mocks.getAll,
      getTermsOfUse: mocks.getTermsOfUse,
      getPrivacyPolicy: mocks.getPrivacyPolicy,
    },
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    "should advance to salon step after valid personal data",
    async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={["/cadastro"]}>
          <Register />
        </MemoryRouter>
      );

      await user.type(screen.getByLabelText("Nome completo"), "Phelipp QA");
      await user.type(screen.getByLabelText("E-mail"), "qa@azzoholding.com.br");
      await user.type(screen.getByLabelText("Senha"), "Pr14052019!");
      await user.type(screen.getByLabelText("Confirmar senha"), "Pr14052019!");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: /Continuar/i }));

      expect(await screen.findByLabelText("Nome do Salao")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Criar Conta/i })).toBeInTheDocument();
      expect(screen.getByText(/Conta em preparacao/i)).toBeInTheDocument();
    },
    10000
  );

  it("should submit final salon data and redirect after successful register", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/cadastro"]}>
        <Register />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Nome completo"), "Phelipp QA");
    await user.type(screen.getByLabelText("E-mail"), "qa@azzoholding.com.br");
    await user.type(screen.getByLabelText("Senha"), "Pr14052019!");
    await user.type(screen.getByLabelText("Confirmar senha"), "Pr14052019!");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Continuar/i }));

    await user.type(await screen.findByLabelText("Nome do Salao"), "Studio Azzo");
    await user.type(screen.getByLabelText("Telefone / WhatsApp"), "11999990000");
    await user.type(screen.getByLabelText("CPF/CNPJ"), "52998224725");
    await user.click(screen.getByRole("button", { name: /Criar Conta/i }));

    expect(mocks.register).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Phelipp QA",
        email: "qa@azzoholding.com.br",
        salonName: "Studio Azzo",
        phone: "(11) 99999-0000",
        cpfCnpj: "52998224725",
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      })
    );
    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
