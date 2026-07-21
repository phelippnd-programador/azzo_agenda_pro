import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@/components/settings/tutorial/whatsapp-integration-tour";
import { TutorialHost } from "@/components/tutorial/TutorialHost";
import { hasSeenTour } from "@/components/tutorial/tour-storage";
import { useTourStore } from "@/components/tutorial/tour-store";

function WhatsAppIntegrationFake() {
  return (
    <div>
      <div data-tour="whatsapp-integration-card">Card</div>
      <div data-tour="whatsapp-status-badge">Nao conectado</div>
      <div data-tour="whatsapp-setup-tabs">Abas</div>
      <div data-tour="whatsapp-wizard-progress">Progresso</div>
      <div data-tour="whatsapp-wizard-step-content">Conteudo da etapa</div>
      <div data-tour="whatsapp-wizard-nav">Navegacao</div>
      {/* status-panel, templates e message-log ficam de fora de propósito:
          so existem quando o WhatsApp ja esta conectado, e o tour deve
          pular (target_not_found) sem travar quando o usuario ainda nao
          conectou. */}
      <div data-tour="whatsapp-activate-switch">Ativar</div>
      <div data-tour="whatsapp-usage-profile">Perfil de uso</div>
      <div data-tour="whatsapp-permissions">Permissoes</div>
    </div>
  );
}

function renderHost() {
  return render(
    <MemoryRouter initialEntries={["/outra-rota"]}>
      <Routes>
        <Route path="/configuracoes/integracoes/whatsapp" element={<WhatsAppIntegrationFake />} />
        <Route path="/outra-rota" element={<div>Fora da integracao</div>} />
      </Routes>
      <TutorialHost />
    </MemoryRouter>
  );
}

describe("TutorialHost com o tour real da integracao WhatsApp", () => {
  beforeEach(() => {
    localStorage.clear();
    useTourStore.setState({ activeTourId: null, stepIndex: 0, runNonce: 0 });
  });

  it("navega ate a rota da integracao e mostra o primeiro passo real", async () => {
    renderHost();
    act(() => useTourStore.getState().startTour("whatsapp-integracao"));

    expect(await screen.findByText("Conectando o WhatsApp")).toBeInTheDocument();
  });

  it("pula os passos sem alvo (painel de conectado, templates, historico) sem travar e finaliza persistindo o tour como visto", async () => {
    const user = userEvent.setup();
    renderHost();
    act(() => useTourStore.getState().startTour("whatsapp-integracao"));

    expect(await screen.findByText("Conectando o WhatsApp")).toBeInTheDocument();
    // Avanca por todos os passos disponiveis nesta tela (12 no total, 3 sem
    // alvo no estado "nao conectado" — devem ser pulados automaticamente).
    for (let i = 0; i < 15; i += 1) {
      const primary = screen.queryByRole("button", { name: /Próximo|Finalizar/ });
      if (!primary) break;
      const isFinish = primary.getAttribute("aria-label") === "Finalizar";
      await user.click(primary);
      if (isFinish) break;
    }

    expect(useTourStore.getState().activeTourId).toBeNull();
    expect(hasSeenTour("whatsapp-integracao", 1)).toBe(true);
  });
});
