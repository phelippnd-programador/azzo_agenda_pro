import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanSelector } from "@/components/billing/PlanSelector";

describe("PlanSelector", () => {
  it("should show billing cycle and validity based on the plan duration", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PlanSelector
        plans={[
          {
            code: "premium",
            name: "Azzo Premium",
            description: "Plano disponivel para assinatura.",
            amount: 10,
            validityMonths: 2,
            features: ["Agenda", "Financeiro"],
          },
        ]}
        selectedPlanCode=""
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("R$ 10,00")).toBeInTheDocument();
    expect(screen.getByText("por 2 meses")).toBeInTheDocument();
    expect(screen.getByText("Validade de 2 meses apos a contratacao.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Selecionar plano" }));

    expect(onSelect).toHaveBeenCalledWith("premium");
  });
});
