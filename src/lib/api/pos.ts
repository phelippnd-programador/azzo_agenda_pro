import { request } from "./core";

// F01 — comanda / fechamento de conta (POS)

export type ComandaStatus = "ABERTA" | "FECHADA" | "CANCELADA" | "ESTORNADA";
export type ComandaItemTipo = "SERVICO" | "PRODUTO" | "PACOTE";
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
  cancelMotivo?: string | null;
  estornoMotivo?: string | null;
  estornadoEm?: string | null;
  openedAt?: string;
  closedAt?: string | null;
  itens: ComandaItem[];
  pagamentos: ComandaPagamento[];
  totalPago: number;
  troco: number;
};

// Shape bruto devolvido pelo backend (ComandaDtos.ComandaResponse) — sem
// totalPago/troco, que o backend não calcula. O client deriva esses campos
// a partir de `pagamentos` para a UI nunca quebrar nem exibir valor errado.
type ComandaApiResponse = Omit<Comanda, "totalPago" | "troco">;

type ComandaPageApiResponse = {
  content: ComandaApiResponse[];
  totalElements: number;
  page: number;
  size: number;
};

function toComanda(raw: ComandaApiResponse): Comanda {
  const totalPago = (raw.pagamentos ?? [])
    .filter((p) => p.status === "CONFIRMADO")
    .reduce((sum, p) => sum + p.valor, 0);
  // O backend só fecha a comanda quando o pago == total + gorjeta (quitação exata,
  // sem troco) — ver ServicoComanda.fechar. Esse cálculo fica só como garantia
  // defensiva; na prática sempre resulta em 0.
  const troco = raw.status === "FECHADA" ? Math.max(0, totalPago - (raw.total + raw.gorjeta)) : 0;
  return { ...raw, totalPago, troco };
}

export const posApi = {
  abrir: (data: { appointmentId?: string; clientId?: string }) =>
    request<ComandaApiResponse>("/pos/comandas", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(toComanda),

  listar: (status: ComandaStatus = "ABERTA", page = 0, size = 20) =>
    request<ComandaPageApiResponse>(
      `/pos/comandas?status=${status}&page=${page}&size=${size}`
    ).then((res) => res.content.map(toComanda)),

  detalhe: (id: string) =>
    request<ComandaApiResponse>(`/pos/comandas/${id}`).then(toComanda),

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
    request<ComandaApiResponse>(`/pos/comandas/${id}/itens`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then(toComanda),

  removerItem: (id: string, itemId: string) =>
    request<ComandaApiResponse>(`/pos/comandas/${id}/itens/${itemId}`, {
      method: "DELETE",
    }).then(toComanda),

  // Backend só suporta desconto percentual (ComandaDtos.AplicarDescontoRequest).
  aplicarDesconto: (id: string, data: { percentual: number; motivo: string }) =>
    request<ComandaApiResponse>(`/pos/comandas/${id}/desconto`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then(toComanda),

  definirGorjeta: (id: string, data: { valor: number; professionalId: string }) =>
    request<ComandaApiResponse>(`/pos/comandas/${id}/gorjeta`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then(toComanda),

  registrarPagamento: (id: string, data: { meio: ComandaMeioPagamento; valor: number }) =>
    request<ComandaApiResponse>(`/pos/comandas/${id}/pagamentos`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then(toComanda),

  // Backend nao aceita corpo neste endpoint (ComandaResource.fechar so recebe o id).
  fechar: (id: string) =>
    request<ComandaApiResponse>(`/pos/comandas/${id}/fechar`, {
      method: "POST",
    }).then(toComanda),

  cancelar: (id: string, motivo: string) =>
    request<ComandaApiResponse>(`/pos/comandas/${id}/cancelar`, {
      method: "POST",
      body: JSON.stringify({ motivo }),
    }).then(toComanda),

  // Estorna uma comanda ja FECHADA: reverte pagamento, estoque, comissao e fidelidade.
  // Sem volta - a comanda fica ESTORNADA para sempre.
  estornar: (id: string, motivo: string) =>
    request<ComandaApiResponse>(`/pos/comandas/${id}/estornar`, {
      method: "POST",
      body: JSON.stringify({ motivo }),
    }).then(toComanda),

  // F08 — resgate de pontos de fidelidade como desconto na comanda.
  resgatarFidelidade: (id: string, pontos: number) =>
    request<ComandaApiResponse>(`/pos/comandas/${id}/fidelidade/resgatar`, {
      method: "POST",
      body: JSON.stringify({ pontos }),
    }).then(toComanda),
};
