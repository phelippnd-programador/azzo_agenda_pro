import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepAssignments } from "@/components/onboarding/steps/StepAssignments";
import type { ProfessionalDraft, ServiceDraft } from "@/stores/onboarding";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const professionals: ProfessionalDraft[] = [
  { id: "pro-1", name: "Maria", email: "maria@x.com", phone: "1", specialties: [], workingHours: [] },
];

const services: ServiceDraft[] = [
  { id: "svc-1", name: "Corte", durationMinutes: 30, price: 50, category: "Cabelo", professionalIds: [] },
];

describe("StepAssignments", () => {
  it("toggling a checkbox calls onServiceProfessionalsChange with the updated professionalIds", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn().mockResolvedValue(undefined);

    render(
      <StepAssignments
        professionals={professionals}
        services={services}
        onServiceProfessionalsChange={onChange}
      />
    );

    await user.click(screen.getByRole("checkbox"));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(0, ["pro-1"]);
    });
  });

  it("shows a message when professionals or services are still empty", () => {
    render(
      <StepAssignments
        professionals={[]}
        services={services}
        onServiceProfessionalsChange={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Adicione profissionais e serviços nas etapas anteriores/)
    ).toBeInTheDocument();
  });

  it("shows an error toast when the update fails", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    const onChange = vi.fn().mockRejectedValue(new Error("boom"));

    render(
      <StepAssignments
        professionals={professionals}
        services={services}
        onServiceProfessionalsChange={onChange}
      />
    );

    await user.click(screen.getByRole("checkbox"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
