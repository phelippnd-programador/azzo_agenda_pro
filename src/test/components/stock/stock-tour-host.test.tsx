import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@/components/stock/tutorial/stock-tours";
import { TutorialHost } from "@/components/tutorial/TutorialHost";
import { hasSeenTour } from "@/components/tutorial/tour-storage";
import { useTourStore } from "@/components/tutorial/tour-store";

function StockOverviewFake() {
  return (
    <div>
      <div data-tour="stock-tabs">Abas</div>
      <div data-tour="stock-summary-cards">Indicadores</div>
      <div data-tour="stock-recent-movements">Historico recente</div>
      <div data-tour="stock-charts">Graficos</div>
    </div>
  );
}

function renderHost() {
  return render(
    <MemoryRouter initialEntries={["/outra-rota"]}>
      <Routes>
        <Route path="/estoque/visao-geral" element={<StockOverviewFake />} />
        <Route path="/outra-rota" element={<div>Fora do estoque</div>} />
      </Routes>
      <TutorialHost />
    </MemoryRouter>
  );
}

describe("TutorialHost com o tour real Modulo 1 - Conhecendo o estoque", () => {
  beforeEach(() => {
    localStorage.clear();
    useTourStore.setState({ activeTourId: null, stepIndex: 0, runNonce: 0 });
  });

  it("navega ate /estoque/visao-geral e mostra o primeiro passo real do modulo", async () => {
    renderHost();
    act(() => useTourStore.getState().startTour("estoque-conhecendo"));

    expect(await screen.findByText("Bem-vinda ao Estoque")).toBeInTheDocument();
  });

  it("avanca pelos passos reais e persiste o modulo como visto ao finalizar", async () => {
    const user = userEvent.setup();
    renderHost();
    act(() => useTourStore.getState().startTour("estoque-conhecendo"));

    expect(await screen.findByText("Bem-vinda ao Estoque")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    expect(await screen.findByText("Indicadores do estoque")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    expect(await screen.findByText("Ultimas movimentacoes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    expect(await screen.findByText("Graficos de apoio")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Finalizar/ }));

    expect(useTourStore.getState().activeTourId).toBeNull();
    expect(hasSeenTour("estoque-conhecendo", 1)).toBe(true);
  });
});
