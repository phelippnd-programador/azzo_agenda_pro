import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@/components/appointments/tutorial/agenda-tours";
import { TutorialHost } from "@/components/tutorial/TutorialHost";
import { hasSeenTour } from "@/components/tutorial/tour-storage";
import { useTourStore } from "@/components/tutorial/tour-store";

function AgendaFake() {
  return (
    <div>
      <div data-tour="agenda-summary">Resumo</div>
      <div data-tour="agenda-date-nav">Navegacao de datas</div>
      <div data-tour="agenda-view-toggle">Dia/Semana/Mes</div>
      <div data-tour="agenda-day-grid">Grade do dia</div>
      <div data-tour="agenda-filter-professional">Filtro profissional</div>
      <div data-tour="agenda-filter-status">Filtro status</div>
      <button data-tour="agenda-new-appointment-button">Novo Agendamento</button>
    </div>
  );
}

function renderHost() {
  return render(
    <MemoryRouter initialEntries={["/outra-rota"]}>
      <Routes>
        <Route path="/agenda" element={<AgendaFake />} />
        <Route path="/outra-rota" element={<div>Fora da agenda</div>} />
      </Routes>
      <TutorialHost />
    </MemoryRouter>
  );
}

describe("TutorialHost com o tour real Modulo 1 - Conhecendo a agenda", () => {
  beforeEach(() => {
    localStorage.clear();
    useTourStore.setState({ activeTourId: null, stepIndex: 0, runNonce: 0 });
  });

  it("navega ate /agenda e mostra o primeiro passo real do modulo", async () => {
    renderHost();
    act(() => useTourStore.getState().startTour("agenda-conhecendo"));

    expect(await screen.findByText("Bem-vinda à Agenda")).toBeInTheDocument();
  });

  it("avanca pelos passos reais e persiste o modulo como visto ao finalizar", async () => {
    const user = userEvent.setup();
    renderHost();
    act(() => useTourStore.getState().startTour("agenda-conhecendo"));

    expect(await screen.findByText("Bem-vinda à Agenda")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Próximo/ }));
    expect(await screen.findByText("Navegue entre os dias")).toBeInTheDocument();

    for (let i = 0; i < 5; i += 1) {
      const buttons = screen.queryAllByRole("button", { name: /Próximo/ });
      if (buttons.length === 0) break;
      await user.click(buttons[0]);
    }

    expect(await screen.findByText("Pronta para agendar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Finalizar/ }));

    expect(useTourStore.getState().activeTourId).toBeNull();
    expect(hasSeenTour("agenda-conhecendo", 1)).toBe(true);
  });
});
