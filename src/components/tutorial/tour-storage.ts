/**
 * Persistência de tutoriais já apresentados. localStorage com chave por
 * tour+versão: mudar a versão de um tour faz ele ser reexibido uma vez.
 * Todas as operações são tolerantes a falha (modo privado, storage cheio).
 */
const PREFIX = "azzo:tour:";

const keyFor = (tourId: string, version: number) => `${PREFIX}${tourId}:v${version}`;

export function hasSeenTour(tourId: string, version: number): boolean {
  try {
    return localStorage.getItem(keyFor(tourId, version)) !== null;
  } catch {
    return true; // sem storage confiável, não auto-inicia (evita reexibir a cada visita)
  }
}

export function markTourSeen(tourId: string, version: number, outcome: "finished" | "skipped"): void {
  try {
    localStorage.setItem(keyFor(tourId, version), `${outcome}:${new Date().toISOString()}`);
  } catch {
    // sem storage: segue sem persistir
  }
}

export function resetTourSeen(tourId: string, version: number): void {
  try {
    localStorage.removeItem(keyFor(tourId, version));
  } catch {
    // sem storage: nada a remover
  }
}
