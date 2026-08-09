import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepSalon } from "@/components/onboarding/steps/StepSalon";
import type { SalonDraft } from "@/stores/onboarding";

describe("StepSalon", () => {
  it("pre-fills name, phone and email when initialData is available at mount", () => {
    const initialData: SalonDraft = {
      name: "Salão da Maria",
      type: "",
      phone: "(11) 99999-9999",
      city: "",
      state: "",
      email: "contato@salaodamaria.com.br",
    };

    render(
      <StepSalon
        initialData={initialData}
        onValidityChange={vi.fn()}
        onDataChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Nome do salão/)).toHaveValue("Salão da Maria");
    expect(screen.getByLabelText(/Telefone/)).toHaveValue("(11) 99999-9999");
    expect(screen.getByLabelText(/E-mail de contato/)).toHaveValue("contato@salaodamaria.com.br");
  });

  it("fills in the fields when initialData arrives asynchronously after mount", async () => {
    const { rerender } = render(
      <StepSalon
        initialData={null}
        onValidityChange={vi.fn()}
        onDataChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Nome do salão/)).toHaveValue("");

    const loadedData: SalonDraft = {
      name: "Barbearia do João",
      type: "",
      phone: "(21) 98888-7777",
      city: "",
      state: "",
      email: "joao@barbearia.com.br",
    };

    rerender(
      <StepSalon
        initialData={loadedData}
        onValidityChange={vi.fn()}
        onDataChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome do salão/)).toHaveValue("Barbearia do João");
    });
    expect(screen.getByLabelText(/Telefone/)).toHaveValue("(21) 98888-7777");
  });

  it("does not overwrite what the user already typed when initialData arrives late", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <StepSalon
        initialData={null}
        onValidityChange={vi.fn()}
        onDataChange={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/Nome do salão/), "Nome digitado pelo usuário");

    const loadedData: SalonDraft = {
      name: "Nome vindo do cadastro",
      type: "",
      phone: "(21) 98888-7777",
      city: "",
      state: "",
      email: "joao@barbearia.com.br",
    };

    rerender(
      <StepSalon
        initialData={loadedData}
        onValidityChange={vi.fn()}
        onDataChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Nome do salão/)).toHaveValue("Nome digitado pelo usuário");
  });
});
