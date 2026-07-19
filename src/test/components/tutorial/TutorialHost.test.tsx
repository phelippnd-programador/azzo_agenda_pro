import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TutorialHost } from "@/components/tutorial/TutorialHost";
import { registerTour } from "@/components/tutorial/registry";
import { hasSeenTour } from "@/components/tutorial/tour-storage";
import { useTourStore } from "@/components/tutorial/tour-store";

registerTour({
  id: "host-demo",
  version: 1,
  steps: [
    {
      target: '[data-tour="demo-alvo-1"]',
      title: "Primeiro passo",
      content: "Descricao do primeiro passo para o teste.",
    },
    {
      target: '[data-tour="demo-alvo-2"]',
      title: "Segundo passo",
      content: "Descricao do segundo passo para o teste.",
    },
  ],
});

function renderHost() {
  return render(
    <MemoryRouter initialEntries={["/fiscal?tab=notas"]}>
      <div data-tour="demo-alvo-1">Alvo um</div>
      <div data-tour="demo-alvo-2">Alvo dois</div>
      <TutorialHost />
    </MemoryRouter>
  );
}

describe("TutorialHost", () => {
  beforeEach(() => {
    localStorage.clear();
    useTourStore.setState({ activeTourId: null, stepIndex: 0, runNonce: 0 });
  });

  it("exibe o balao com titulo, descricao e acoes em portugues", async () => {
    renderHost();
    act(() => useTourStore.getState().startTour("host-demo"));

    expect(await screen.findByText("Primeiro passo")).toBeInTheDocument();
    expect(screen.getByText("Descricao do primeiro passo para o teste.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Próximo/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pular/ })).toBeInTheDocument();
  });

  it("avanca com Proximo e finaliza registrando o tour como apresentado", async () => {
    const user = userEvent.setup();
    renderHost();
    act(() => useTourStore.getState().startTour("host-demo"));

    await user.click(await screen.findByRole("button", { name: /Próximo/ }));

    expect(await screen.findByText("Segundo passo")).toBeInTheDocument();
    // ultimo passo → botao primario vira "Finalizar" e ha "Voltar"
    expect(screen.getByRole("button", { name: /Voltar/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Finalizar/ }));

    expect(useTourStore.getState().activeTourId).toBeNull();
    expect(hasSeenTour("host-demo", 1)).toBe(true);
  });

  it("pular encerra e tambem registra como apresentado", async () => {
    const user = userEvent.setup();
    renderHost();
    act(() => useTourStore.getState().startTour("host-demo"));

    await user.click(await screen.findByRole("button", { name: /Pular/ }));

    expect(useTourStore.getState().activeTourId).toBeNull();
    expect(hasSeenTour("host-demo", 1)).toBe(true);
  });

  it("nao renderiza nada sem tour ativo", () => {
    renderHost();
    expect(screen.queryByText("Primeiro passo")).not.toBeInTheDocument();
  });
});
