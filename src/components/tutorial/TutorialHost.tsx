import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ACTIONS,
  EVENTS,
  STATUS,
  type BeforeHook,
  type EventHandler,
} from "react-joyride";
import { GuidedTour, toJoyrideSteps } from "./GuidedTour";
import { getTour } from "./registry";
import { locationMatchesRoute } from "./tour-dom";
import { useTourStore } from "./tour-store";

// Tours disponíveis — importar aqui registra no registry (side effect).
import "@/components/fiscal/tutorial/nfse-emission-tour";

/**
 * Runner global de tutoriais guiados. Montado UMA vez no App (dentro do
 * Router), fora das páginas — por isso o tour sobrevive a trocas de rota no
 * meio do fluxo (ex.: sair da lista de NFS-e para o formulário de emissão) e
 * re-renderizações das páginas não reiniciam nem avançam o progresso.
 *
 * Por passo:
 * - hook `before`: se o passo declara `route` e a URL não corresponde, navega.
 * - o próprio Joyride espera o alvo montar (targetWaitTimeout).
 * - alvo não apareceu → evento target_not_found → PULA o passo (nunca trava).
 *
 * Reinício sob demanda (botão "Como emitir uma NFS-e"): o `runNonce` do store
 * troca a key do Joyride, remontando o tour do primeiro passo.
 */
export function TutorialHost() {
  const navigate = useNavigate();
  const activeTourId = useTourStore((state) => state.activeTourId);
  const runNonce = useTourStore((state) => state.runNonce);
  const setStepIndex = useTourStore((state) => state.setStepIndex);
  const finishTour = useTourStore((state) => state.finishTour);

  const tour = activeTourId ? getTour(activeTourId) : undefined;

  const joyrideSteps = useMemo(() => (tour ? toJoyrideSteps(tour.steps) : []), [tour]);

  const before: BeforeHook = useCallback(
    async (data) => {
      const route = (data.step.data as { route?: string } | undefined)?.route;
      if (route && !locationMatchesRoute(window.location, route)) {
        navigate(route);
      }
    },
    [navigate]
  );

  const handleEvent: EventHandler = useCallback(
    (data, controls) => {
      const { action, index, size, status, type } = data;

      if (type === EVENTS.TARGET_NOT_FOUND) {
        // Alvo indisponível (permissão, estado da tela, feature desligada):
        // pula o passo; se era o último, encerra como concluído.
        if (index >= size - 1) {
          controls.stop();
          finishTour("finished");
        } else {
          controls.go(index + 1);
        }
        return;
      }

      if (type === EVENTS.STEP_BEFORE) {
        // Espelha o progresso no store (depuração/telemetria futura).
        setStepIndex(index);
        return;
      }

      if (type === EVENTS.TOUR_END) {
        const skipped =
          status === STATUS.SKIPPED || action === ACTIONS.SKIP || action === ACTIONS.CLOSE;
        finishTour(skipped ? "skipped" : "finished");
      }
    },
    [finishTour, setStepIndex]
  );

  if (!tour) return null;

  return (
    <GuidedTour
      key={`${tour.id}:${runNonce}`}
      steps={joyrideSteps}
      onEvent={handleEvent}
      before={before}
    />
  );
}
