import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepServices } from "@/components/onboarding/steps/StepServices";
import type { ServiceDraft } from "@/stores/onboarding";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("StepServices", () => {
  it("usa o formulario real de servico, com duracao livre e avancados recolhidos", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);

    render(
      <StepServices
        services={[]}
        businessType={undefined}
        professionals={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /Adicionar serviço/ }));

    // Campos do cadastro consolidado (nao mais o form simplificado do wizard).
    expect(await screen.findByText("Novo serviço")).toBeInTheDocument();
    const duracao = screen.getByPlaceholderText("60");
    expect(duracao).toHaveAttribute("type", "number");

    // Sinal/PIX e "ativo" existem, porem dentro do bloco recolhido.
    expect(screen.getByRole("button", { name: /Opções avançadas/ })).toBeInTheDocument();
    expect(screen.queryByText(/Exigir sinal no agendamento online/)).not.toBeInTheDocument();
  });

  it("cria servico com duracao fora das opcoes fixas antigas (ex.: 180 min)", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);

    render(
      <StepServices
        services={[]}
        businessType={undefined}
        professionals={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /Adicionar serviço/ }));
    await user.type(screen.getByPlaceholderText("Ex: Corte Feminino"), "Progressiva");

    const duracao = screen.getByPlaceholderText("60");
    await user.clear(duracao);
    await user.type(duracao, "180");

    await user.clear(screen.getByPlaceholderText("0,00"));
    await user.type(screen.getByPlaceholderText("0,00"), "150,00");

    await user.click(screen.getByRole("button", { name: /Criar serviço/ }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Progressiva", duration: 180, price: 150 })
      );
    });
  });

  it("clicar numa sugestao pre-preenche o nome no formulario real", async () => {
    const user = userEvent.setup();

    render(
      <StepServices
        services={[]}
        businessType="BARBEARIA"
        professionals={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /\+ Barba/ }));

    expect(await screen.findByPlaceholderText("Ex: Corte Feminino")).toHaveValue("Barba");
  });

  it("remover servico chama onRemove e avisa em caso de falha", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    const services: ServiceDraft[] = [
      { id: "svc-1", name: "Corte", durationMinutes: 30, price: 50, category: "Cabelo", professionalIds: [] },
    ];
    const onRemove = vi.fn().mockRejectedValue(new Error("boom"));

    render(
      <StepServices
        services={services}
        businessType={undefined}
        professionals={[]}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remover Corte" }));

    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith(0);
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
