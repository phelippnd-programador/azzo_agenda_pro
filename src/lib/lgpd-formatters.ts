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
