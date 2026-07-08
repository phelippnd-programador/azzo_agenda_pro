import { request } from "./core";

// F01 — comanda / fechamento de conta (POS)

export type ComandaStatus = "ABERTA" | "FECHADA" | "CANCELADA";
export type ComandaItemTipo = "SERVICO" | "PRODUTO";
export type ComandaMeioPagamento =
  | "DINHEIRO"
  | "PIX_ASAAS"
  | "CARTAO_CREDITO_EXTERNO"
  | "CARTAO_DEBITO_EXTERNO"
  | "CREDITO_SINAL";

export type ComandaItem = {
  id: string;
  tipo: ComandaItemTipo;
  referenciaId: string;
  descricao: string;
  professionalId?: string | null;
  quantidade: number;
  precoUnitario: number;
  total: number;
};

export type ComandaPagamento = {
  id: string;
  meio: ComandaMeioPagamento;
  valor: number;
  status: "PENDENTE" | "CONFIRMADO" | "ESTORNADO";
  pixPayload?: string | null;
  paidAt?: string | null;
};

export type Comanda = {
  id: string;
  appointmentId?: string | null;
  clientId?: string | null;
  status: ComandaStatus;
  subtotal: number;
  desconto: number;
  descontoMotivo?: string | null;
  gorjeta: number;
  gorjetaProfessionalId?: string | null;
  total: number;
  openedAt?: string;
  closedAt?: string | null;
  itens: ComandaItem[];
  pagamentos: ComandaPagamento[];
  totalPago: number;
  troco: number;
};

export const posApi = {
  abrir: (data: { appointmentId?: string; clientId?: string }) =>
    request<Comanda>("/pos/comandas", { method: "POST", body: JSON.stringify(data) }),

  listar: (status: ComandaStatus = "ABERTA", page = 0, size = 20) =>
    request<Comanda[]>(`/pos/comandas?status=${status}&page=${page}&size=${size}`),

  detalhe: (id: string) => request<Comanda>(`/pos/comandas/${id}`),

  adicionarItem: (
    id: string,
    data: {
      tipo: ComandaItemTipo;
      referenciaId: string;
      quantidade?: number;
      precoUnitario?: number;
      professionalId?: string;
    }
  ) =>
    request<Comanda>(`/pos/comandas/${id}/itens`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removerItem: (id: string, itemId: string) =>
    request<Comanda>(`/pos/comandas/${id}/itens/${itemId}`, { method: "DELETE" }),

  aplicarDesconto: (
    id: string,
    data: { descontoValor?: number; descontoPercent?: number; motivo?: string }
  ) =>
    request<Comanda>(`/pos/comandas/${id}/desconto`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  definirGorjeta: (id: string, data: { gorjeta: number; professionalId?: string }) =>
    request<Comanda>(`/pos/comandas/${id}/gorjeta`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  registrarPagamento: (id: string, data: { meio: ComandaMeioPagamento; valor: number }) =>
    request<Comanda>(`/pos/comandas/${id}/pagamentos`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  fechar: (id: string, meioPredominante?: ComandaMeioPagamento) =>
    request<Comanda>(`/pos/comandas/${id}/fechar`, {
      method: "POST",
      body: JSON.stringify({ meioPredominante }),
    }),

  cancelar: (id: string, motivo: string) =>
    request<Comanda>(`/pos/comandas/${id}/cancelar`, {
      method: "POST",
      body: JSON.stringify({ motivo }),
    }),
};
