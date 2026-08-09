/**
 * Utilidades de rota do runner de tutoriais — puras e testáveis.
 * (A espera pelo alvo no DOM é nativa do react-joyride v3: `targetWaitTimeout`.)
 */

/**
 * Verifica se a localização atual satisfaz a rota declarada pelo passo:
 * mesmo pathname e todos os query params da rota do passo presentes com o
 * mesmo valor (params extras na URL atual não invalidam).
 */
export function locationMatchesRoute(
  current: { pathname: string; search: string },
  stepRoute: string
): boolean {
  const [stepPath, stepQuery = ""] = stepRoute.split("?");
  if (current.pathname !== stepPath) return false;
  const currentParams = new URLSearchParams(current.search);
  const stepParams = new URLSearchParams(stepQuery);
  for (const [key, value] of stepParams.entries()) {
    if (currentParams.get(key) !== value) return false;
  }
  return true;
}
