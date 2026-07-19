import {
  Joyride,
  type BeforeHook,
  type EventHandler,
  type Locale,
  type Options,
  type Step,
} from "react-joyride";
import type { GuidedTourStep } from "./types";

/**
 * Camada de apresentação do tutorial: react-joyride (v3) com textos em pt-BR
 * e visual alinhado ao design system (tokens CSS do tema — funciona em light
 * e dark). Navegação entre rotas e regras de encerramento ficam no
 * TutorialHost.
 */

export const TOUR_LOCALE: Locale = {
  back: "Voltar",
  close: "Fechar",
  last: "Finalizar",
  next: "Próximo",
  skip: "Pular",
};

const TOUR_OPTIONS: Partial<Options> = {
  // Botões exigidos pelo fluxo: Pular / Voltar / Próximo (vira Finalizar no último).
  buttons: ["skip", "back", "primary", "close"],
  // Sem beacon: o balão abre direto no alvo (tour didático, não descoberta).
  skipBeacon: true,
  // Fechar no X ou apertar Esc conta como "Pular": registra o tour como apresentado.
  closeButtonAction: "skip",
  dismissKeyAction: "close",
  // Clique fora não encerra o tour por acidente.
  overlayClickAction: false,
  blockTargetInteraction: true,
  // Abas/rotas podem demorar a montar o alvo — espera generosa antes de
  // reportar target_not_found (o host então PULA o passo, nunca trava).
  targetWaitTimeout: 5000,
  scrollOffset: 96,
  // Tema via tokens do design system.
  arrowColor: "hsl(var(--popover))",
  backgroundColor: "hsl(var(--popover))",
  textColor: "hsl(var(--popover-foreground))",
  primaryColor: "hsl(var(--primary))",
  overlayColor: "rgba(0, 0, 0, 0.55)",
  // Acima dos Dialog/Sheet (z-50) para o tour nunca ficar por baixo de overlays.
  zIndex: 10000,
};

const TOUR_STYLES = {
  tooltip: { borderRadius: 12, padding: 16 },
  tooltipTitle: { fontSize: 15, fontWeight: 600, textAlign: "left" as const },
  tooltipContent: { fontSize: 13, padding: "8px 0 0", textAlign: "left" as const },
  buttonPrimary: { borderRadius: 8, fontSize: 13, fontWeight: 600 },
  buttonBack: { fontSize: 13 },
  buttonSkip: { fontSize: 13 },
};

export function toJoyrideSteps(steps: GuidedTourStep[]): Step[] {
  return steps.map((step) => ({
    id: step.target,
    target: step.target,
    title: step.title,
    content: step.content,
    placement: step.placement ?? "auto",
    blockTargetInteraction: !(step.spotlightClicks ?? false),
    // A rota do passo viaja no `data`: o hook `before` (TutorialHost) navega
    // até ela antes de o Joyride procurar o alvo.
    data: { route: step.route },
  }));
}

interface GuidedTourProps {
  steps: Step[];
  onEvent: EventHandler;
  before: BeforeHook;
}

export function GuidedTour({ steps, onEvent, before }: GuidedTourProps) {
  return (
    <Joyride
      steps={steps}
      run
      continuous
      onEvent={onEvent}
      options={{ ...TOUR_OPTIONS, before }}
      locale={TOUR_LOCALE}
      styles={TOUR_STYLES}
    />
  );
}
