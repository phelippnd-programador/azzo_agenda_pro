// Status da apuração mensal
export enum StatusApuracao {
  ABERTA = 'ABERTA',           // Mês corrente, em andamento
  PARCIAL = 'PARCIAL',         // Calculada parcialmente (até a data atual)
  FECHADA = 'FECHADA',         // Mês encerrado, valores finalizados
  RETIFICADA = 'RETIFICADA',   // Apuração foi recalculada após fechamento
}

// Tipos de imposto suportados
export enum TipoImposto {
  ICMS = 'ICMS',       // Imposto sobre Circulação de Mercadorias e Serviços
  PIS = 'PIS',         // Programa de Integração Social
  COFINS = 'COFINS',   // Contribuição para Financiamento da Seguridade Social
  ISS = 'ISS',         // Imposto Sobre Serviços
  IRPJ = 'IRPJ',       // Imposto de Renda Pessoa Jurídica
  CSLL = 'CSLL',       // Contribuição Social sobre o Lucro Líquido
  DAS = 'DAS',         // Documento de Arrecadação do Simples Nacional
}

// Regime tributário
export enum RegimeTributario {
  SIMPLES_NACIONAL = 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
  MEI = 'MEI',
}

// Descrições dos tipos de imposto
export const TIPO_IMPOSTO_DESCRICAO: Record<TipoImposto, string> = {
  [TipoImposto.ICMS]: 'Imposto sobre Circulação de Mercadorias e Serviços',
  [TipoImposto.PIS]: 'Programa de Integração Social',
  [TipoImposto.COFINS]: 'Contribuição para Financiamento da Seguridade Social',
  [TipoImposto.ISS]: 'Imposto Sobre Serviços',
  [TipoImposto.IRPJ]: 'Imposto de Renda Pessoa Jurídica',
  [TipoImposto.CSLL]: 'Contribuição Social sobre o Lucro Líquido',
  [TipoImposto.DAS]: 'Documento de Arrecadação do Simples Nacional',
};

// Detalhe de um imposto apurado
export interface ApuracaoImposto {
  id: string;
  tipoImposto: TipoImposto;
  descricao: string;
  baseCalculo: number;
  aliquota: number;        // Decimal (ex: 0.06 = 6%)
  valorApurado: number;
  createdAt: string;
  updatedAt: string;
}

// Referência a documento fiscal incluído na apuração
export interface ApuracaoDocumento {
  id: string;
  documentoFiscalId: string;
  valorDocumento: number;
  statusDocumento: string;
  incluidoEm: string;
}

// Apuração mensal consolidada
export interface ApuracaoMensal {
  id: string;
  ano: number;
  mes: number;
  status: StatusApuracao;
  regimeTributario: RegimeTributario;
  valorTotalServicos: number;
  valorTotalImpostos: number;
  impostos: ApuracaoImposto[];
  documentos: ApuracaoDocumento[];
  dataAbertura: string;
  dataFechamento: string | null;
  quantidadeDocumentos: number;
  createdAt: string;
  updatedAt: string;
}

// DTO para exibição resumida
export interface ApuracaoResumo {
  id: string;
  ano: number;
  mes: number;
  status: StatusApuracao;
  regimeTributario: RegimeTributario;
  valorTotalServicos: number;
  valorTotalImpostos: number;
  quantidadeDocumentos: number;
}

// Nomes dos meses em português
export const MESES_PT: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

// Cores para status
export const STATUS_COLORS: Record<StatusApuracao, { bg: string; text: string; border: string }> = {
  [StatusApuracao.ABERTA]: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  [StatusApuracao.PARCIAL]: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  [StatusApuracao.FECHADA]: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  [StatusApuracao.RETIFICADA]: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

// Labels para status
export const STATUS_LABELS: Record<StatusApuracao, string> = {
  [StatusApuracao.ABERTA]: 'Aberta',
  [StatusApuracao.PARCIAL]: 'Parcial',
  [StatusApuracao.FECHADA]: 'Fechada',
  [StatusApuracao.RETIFICADA]: 'Retificada',
};