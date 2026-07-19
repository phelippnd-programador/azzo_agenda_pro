import type { GuidedTourDefinition } from "./types";

/**
 * Registro central de tutoriais. Cada módulo define seus passos em arquivo
 * próprio (ex.: components/fiscal/tutorial/nfse-emission-tour.ts) e chama
 * registerTour() no escopo do módulo; o TutorialHost importa esses arquivos
 * e resolve o tour ativo por id.
 */
const tours = new Map<string, GuidedTourDefinition>();

export function registerTour(definition: GuidedTourDefinition): GuidedTourDefinition {
  tours.set(definition.id, definition);
  return definition;
}

export function getTour(id: string): GuidedTourDefinition | undefined {
  return tours.get(id);
}

export function listTours(): GuidedTourDefinition[] {
  return [...tours.values()];
}
