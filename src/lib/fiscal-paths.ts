/**
 * Rotas que só o OWNER pode acessar.
 * Centralizado aqui para não poluir o ProtectedRoute com lógica de domínio.
 * Para adicionar uma nova rota fiscal, basta incluir neste array.
 */
export const FISCAL_OWNER_ONLY_PATHS = [
  "/emitir-nota",
  "/nota-fiscal",
  "/apuracao-mensal",
  "/configuracoes/fiscal",
  "/fiscal/nfse",
  "/config-impostos",
] as const;

export const isFiscalOwnerPath = (pathname: string): boolean =>
  FISCAL_OWNER_ONLY_PATHS.some((p) => pathname.startsWith(p));
