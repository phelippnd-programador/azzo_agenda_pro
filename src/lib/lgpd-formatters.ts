export const LGPD_REQUEST_TYPES = [
  { value: "ACESSO",                  label: "Acesso aos dados" },
  { value: "CORRECAO",                label: "Correcao de dados" },
  { value: "ELIMINACAO",              label: "Eliminacao dos dados" },
  { value: "PORTABILIDADE",           label: "Portabilidade" },
  { value: "ANONIMIZACAO",            label: "Anonimizacao / Bloqueio" },
  { value: "INFORMACAO",              label: "Informacao sobre tratamento" },
  { value: "REVOGACAO_CONSENTIMENTO", label: "Revogacao de consentimento" },
  { value: "OPOSICAO",                label: "Oposicao ao tratamento" },
] as const;

export type LgpdRequestType = typeof LGPD_REQUEST_TYPES[number]["value"];

export function formatLgpdRequestType(type: string): string {
  const found = LGPD_REQUEST_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
}

export function formatLgpdStatus(status: string): string {
  const map: Record<string, string> = {
    ABERTO: "Aberto",
    EM_VALIDACAO: "Em validacao",
    RESPONDIDO: "Respondido",
    ENCERRADO: "Encerrado",
  };
  return map[status] ?? status;
}

export function formatLgpdEventType(eventType: string): string {
  const map: Record<string, string> = {
    REQUEST_CREATED: "Solicitacao criada",
    STATUS_UPDATED: "Status atualizado",
    RESPONSE_ADDED: "Resposta adicionada",
    REQUEST_CLOSED: "Solicitacao encerrada",
  };
  return map[eventType] ?? eventType;
}
