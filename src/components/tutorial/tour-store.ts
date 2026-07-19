import { create } from "zustand";
import { getTour } from "./registry";
import { hasSeenTour, markTourSeen } from "./tour-storage";

/**
 * Estado global do tutorial ativo. Vive fora das páginas de propósito: o
 * TutorialHost (montado no App) é quem renderiza o Joyride, então o tour
 * sobrevive a trocas de rota no meio do fluxo. As páginas apenas disparam
 * startTour()/startTourIfNeverSeen().
 */
interface TourState {
  activeTourId: string | null;
  stepIndex: number;
  /** Incrementado a cada início: remonta o runner para recomeçar do passo 1. */
  runNonce: number;
  /** Início do tutorial sob demanda (botão "Como emitir..."). */
  startTour: (tourId: string) => void;
  /** Auto-início apenas no primeiro acesso (persistido por tour+versão). */
  startTourIfNeverSeen: (tourId: string) => void;
  setStepIndex: (index: number) => void;
  /** Encerra registrando que o tutorial foi apresentado. */
  finishTour: (outcome: "finished" | "skipped") => void;
  /** Encerra sem registrar (ex.: página desmontou o contexto do tour). */
  abortTour: () => void;
}

export const useTourStore = create<TourState>((set, get) => ({
  activeTourId: null,
  stepIndex: 0,
  runNonce: 0,

  startTour: (tourId) => {
    if (!getTour(tourId)) return;
    set((state) => ({ activeTourId: tourId, stepIndex: 0, runNonce: state.runNonce + 1 }));
  },

  startTourIfNeverSeen: (tourId) => {
    const tour = getTour(tourId);
    if (!tour) return;
    if (get().activeTourId) return; // já existe tour em andamento
    if (hasSeenTour(tour.id, tour.version)) return;
    set((state) => ({ activeTourId: tourId, stepIndex: 0, runNonce: state.runNonce + 1 }));
  },

  setStepIndex: (index) => set({ stepIndex: index }),

  finishTour: (outcome) => {
    const { activeTourId } = get();
    const tour = activeTourId ? getTour(activeTourId) : undefined;
    if (tour) markTourSeen(tour.id, tour.version, outcome);
    set({ activeTourId: null, stepIndex: 0 });
  },

  abortTour: () => set({ activeTourId: null, stepIndex: 0 }),
}));
