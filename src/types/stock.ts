export type StockItem = {
  id: string;
  nome: string;
  sku?: string | null;
  unidadeMedida: string;
  saldoAtual: number;
  estoqueMinimo: number;
  custoMedioUnitario?: number | null;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type StockMovementType = "ENTRADA" | "SAIDA" | "AJUSTE";
export type StockMovementOrigin = "MANUAL" | "COMPRA" | "SERVICO" | "INVENTARIO";

export type StockMovement = {
  id: string;
  itemEstoqueId: string;
  tipo: StockMovementType;
  quantidade: number;
  saldoAnterior: number;
  saldoPosterior: number;
  motivo: string;
  origem: StockMovementOrigin;
  valorUnitarioPago?: number | null;
  valorTotalMovimentacao?: number | null;
  gerarLancamentoFinanceiro?: boolean;
  transacaoFinanceiraId?: string | null;
  usuarioId?: string | null;
  createdAt: string;
};

export type CreateStockItemRequest = {
  nome: string;
  sku?: string;
  unidadeMedida: string;
  estoqueMinimo: number;
  ativo?: boolean;
};

export type CreateStockMovementRequest = {
  itemEstoqueId: string;
  tipo: StockMovementType;
  quantidade: number;
  motivo: string;
  origem?: StockMovementOrigin;
  valorUnitarioPago?: number;
  gerarLancamentoFinanceiro?: boolean;
  financeiro?: {
    categoria: string;
    descricao?: string;
    formaPagamento?: string;
    dataPagamento?: string;
  };
};

export type StockDashboardResponse = {
  atualizadoEm: string;
  itensAbaixoMinimo: number;
  itensZerados: number;
  valorEstoqueCustoMedio: number;
  rupturaTaxa: number;
  perdasValor: number;
  margemServicos: Array<{
    serviceId: string;
    receitaTotal: number;
    custoInsumosTotal: number;
    margemBruta: number;
  }>;
};
