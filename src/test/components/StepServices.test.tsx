import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepServices } from "@/components/onboarding/steps/StepServices";
import type { ServiceDraft } from "@/stores/onboarding";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("StepServices", () => {
  it("calls onAdd with the real fields (including category) and closes the sheet on success", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);

    render(<StepServices services={[]} businessType={undefined} onAdd={onAdd} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Adicionar serviço/ }));
    await user.type(screen.getByLabelText(/Nome do serviço/), "Corte feminino");

    await user.click(screen.getByRole("button", { name: /Salvar serviço/ }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Corte feminino",
          category: "Cabelo",
          durationMinutes: 30,
          professionalIds: [],
        })
      );
    });
  });

  it("keeps the sheet open and shows an error toast when creation fails", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    const onAdd = vi.fn().mockRejectedValue(new Error("network error"));

    render(<StepServices services={[]} businessType={undefined} onAdd={onAdd} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Adicionar serviço/ }));
    await user.type(screen.getByLabelText(/Nome do serviço/), "Corte feminino");
    await user.click(screen.getByRole("button", { name: /Salvar serviço/ }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(screen.getByLabelText(/Nome do serviço/)).toBeInTheDocument();
  });

  it("removing a service calls onRemove and shows an error toast on failure", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    const services: ServiceDraft[] = [
      { id: "svc-1", name: "Corte", durationMinutes: 30, price: 50, category: "Cabelo", professionalIds: [] },
    ];
    const onRemove = vi.fn().mockRejectedValue(new Error("boom"));

    render(<StepServices services={services} businessType={undefined} onAdd={vi.fn()} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remover Corte" }));

    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith(0);
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
