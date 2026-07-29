import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepProfessionals } from "@/components/onboarding/steps/StepProfessionals";
import type { ProfessionalDraft } from "@/stores/onboarding";

const mocks = vi.hoisted(() => ({
  getLimits: vi.fn(),
  createSpecialty: vi.fn(),
  refetchSpecialties: vi.fn(),
  specialties: [] as Array<{ id: string; name: string }>,
}));

vi.mock("@/lib/api/professionals", () => ({
  professionalsApi: { getLimits: mocks.getLimits },
}));

vi.mock("@/hooks/useSpecialties", () => ({
  useSpecialties: () => ({
    specialties: mocks.specialties,
    isLoading: false,
    error: null,
    refetch: mocks.refetchSpecialties,
    createSpecialty: mocks.createSpecialty,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "owner-1", role: "OWNER", name: "Dona Maria" } }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("StepProfessionals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.specialties = [];
    mocks.getLimits.mockResolvedValue({ currentProfessionals: 1, maxProfessionals: 3, remaining: 2 });
    mocks.createSpecialty.mockResolvedValue({ id: "sp-novo", name: "Corte" });
    mocks.refetchSpecialties.mockResolvedValue(undefined);
  });

  it("usa o formulario real de profissional, com avancados recolhidos", async () => {
    const user = userEvent.setup();

    render(<StepProfessionals professionals={[]} onAdd={vi.fn()} onRemove={vi.fn()} />);

    expect(await screen.findByText(/1 de 3 usados/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Adicionar profissional/ }));

    expect(await screen.findByText("Novo Profissional")).toBeInTheDocument();
    // Toggle do cadastro real que faltava no wizard.
    expect(screen.getByText(/Este usuario tambem atende clientes\?/)).toBeInTheDocument();
    // "Profissional Ativo" existe, porem recolhido.
    expect(screen.getByRole("button", { name: /Opcoes avancadas/ })).toBeInTheDocument();
    expect(screen.queryByText("Profissional Ativo")).not.toBeInTheDocument();
  });

  it("permite criar especialidade sem sair do assistente (tenant novo tem catalogo vazio)", async () => {
    const user = userEvent.setup();

    render(<StepProfessionals professionals={[]} onAdd={vi.fn()} onRemove={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /Adicionar profissional/ }));

    expect(screen.getByText("Nenhuma especialidade cadastrada.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nova especialidade"), "Corte");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      expect(mocks.createSpecialty).toHaveBeenCalledWith({ name: "Corte" });
    });
  });

  it("desabilita adicionar quando o limite do plano foi atingido", async () => {
    mocks.getLimits.mockResolvedValue({ currentProfessionals: 3, maxProfessionals: 3, remaining: 0 });

    render(<StepProfessionals professionals={[]} onAdd={vi.fn()} onRemove={vi.fn()} />);

    expect(await screen.findByText(/Limite de profissionais do plano atingido/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar profissional/ })).toBeDisabled();
  });

  it("avisa sobre o login remanescente antes de remover", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const professionals: ProfessionalDraft[] = [
      { id: "pro-1", name: "Maria", email: "maria@x.com", phone: "119999", specialties: [], workingHours: [] },
    ];
    const onRemove = vi.fn().mockResolvedValue(undefined);

    render(<StepProfessionals professionals={professionals} onAdd={vi.fn()} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remover Maria" }));

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringMatching(/acesso criado.*continuará existindo/is));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith(0));

    confirmSpy.mockRestore();
  });

  it("nao remove quando a confirmacao e cancelada", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const professionals: ProfessionalDraft[] = [
      { id: "pro-1", name: "Maria", email: "maria@x.com", phone: "119999", specialties: [], workingHours: [] },
    ];
    const onRemove = vi.fn().mockResolvedValue(undefined);

    render(<StepProfessionals professionals={professionals} onAdd={vi.fn()} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remover Maria" }));

    expect(onRemove).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
