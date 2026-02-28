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

export type StockImportType = "ITENS" | "ENTRADAS" | "AJUSTES";
export type StockImportTemplateFormat = "xlsx" | "csv";
export type StockImportStatus =
  | "RECEBIDO"
  | "EM_VALIDACAO"
  | "PROCESSANDO"
  | "CONCLUIDO"
  | "CONCLUIDO_COM_ERROS"
  | "FALHOU"
  | "CANCELADO";

export type StockImportJob = {
  jobId: string;
  tipoImportacao: StockImportType;
  status: StockImportStatus;
  dryRun: boolean;
  totalLinhas: number;
  linhasProcessadas: number;
  linhasComErro: number;
  arquivoSha256?: string;
  arquivoStorageKey?: string;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string | null;
};

export type StockImportErrorLine = {
  linha: number;
  coluna: string;
  codigoErro: string;
  mensagem: string;
  valorRecebido: string;
};

export type StockInventoryStatus = "ABERTO" | "EM_CONTAGEM" | "FECHADO" | "CANCELADO";

export type StockInventory = {
  id: string;
  nome: string;
  status: StockInventoryStatus;
  observacao?: string | null;
  dataAbertura: string;
  dataFechamento?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateStockInventoryRequest = {
  nome: string;
  observacao?: string;
};

export type StockInventoryCountRequest = {
  itemEstoqueId: string;
  quantidadeContada: number;
  observacao?: string;
};
