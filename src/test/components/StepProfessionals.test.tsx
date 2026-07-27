import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepProfessionals } from "@/components/onboarding/steps/StepProfessionals";
import type { ProfessionalDraft } from "@/stores/onboarding";

const mocks = vi.hoisted(() => ({
  getLimits: vi.fn(),
}));

vi.mock("@/lib/api/professionals", () => ({
  professionalsApi: { getLimits: mocks.getLimits },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("StepProfessionals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLimits.mockResolvedValue({ currentProfessionals: 1, maxProfessionals: 3, remaining: 2 });
  });

  it("shows the plan limit meter and calls onAdd with email/phone/specialties/workingHours", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);

    render(<StepProfessionals professionals={[]} onAdd={onAdd} onRemove={vi.fn()} />);

    expect(await screen.findByText(/1 de 3 usados/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Adicionar profissional/ }));
    await user.type(screen.getByLabelText(/Nome completo/), "Maria Silva");
    await user.type(screen.getByLabelText(/E-mail/), "maria@salao.com");
    await user.type(screen.getByLabelText(/Telefone/), "11999990000");

    await user.type(screen.getByLabelText(/Especialidades/), "Corte");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await user.click(screen.getByRole("button", { name: /Criar profissional/ }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Maria Silva",
          email: "maria@salao.com",
          specialties: ["Corte"],
        })
      );
    });
    const payload = onAdd.mock.calls[0][0];
    expect(payload.workingHours).toHaveLength(7);
  });

  it("disables adding a professional when the plan limit is reached", async () => {
    mocks.getLimits.mockResolvedValue({ currentProfessionals: 3, maxProfessionals: 3, remaining: 0 });

    render(<StepProfessionals professionals={[]} onAdd={vi.fn()} onRemove={vi.fn()} />);

    expect(await screen.findByText(/Limite de profissionais do plano atingido/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar profissional/ })).toBeDisabled();
  });

  it("removing a professional warns about the lingering login, then calls onRemove", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const professionals: ProfessionalDraft[] = [
      { id: "pro-1", name: "Maria", email: "maria@x.com", phone: "119999", specialties: [], workingHours: [] },
    ];
    const onRemove = vi.fn().mockResolvedValue(undefined);

    render(<StepProfessionals professionals={professionals} onAdd={vi.fn()} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remover Maria" }));

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringMatching(/acesso criado.*continuará existindo/is));
    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith(0);
    });

    confirmSpy.mockRestore();
  });

  it("does not remove the professional when the confirmation is dismissed", async () => {
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

  it("clears the form when the sheet is cancelled", async () => {
    const user = userEvent.setup();

    render(<StepProfessionals professionals={[]} onAdd={vi.fn()} onRemove={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /Adicionar profissional/ }));
    await user.type(screen.getByLabelText(/Nome completo/), "Descartado");
    await user.type(screen.getByLabelText(/Especialidades/), "Corte");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: /Adicionar profissional/ }));

    expect(screen.getByLabelText(/Nome completo/)).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Remover Corte" })).not.toBeInTheDocument();
  });
});
