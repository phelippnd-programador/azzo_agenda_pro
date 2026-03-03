export enum TaxRegime {
  SIMPLES_NACIONAL = 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
}

export interface TaxRate {
  id: string;
  regime: TaxRegime;
  icmsRate: number;
  pisRate: number;
  cofinsRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface TaxCalculation {
  serviceValue: number;
  icmsBase: number;
  icmsValue: number;
  pisValue: number;
  cofinsValue: number;
  totalTaxes: number;
  netValue: number;
}

export interface InvoiceData {
  customerName: string;
  customerDocument: string;
  services: ServiceItem[];
  cfop: string;
  cst: string;
  taxRegime: TaxRegime;
  taxRates: {
    icms: number;
    pis: number;
    cofins: number;
  };
}

export interface InvoicePreview extends InvoiceData {
  calculation: TaxCalculation;
  issueDate: Date;
  invoiceNumber?: string;
}

export const CFOP_CODES = {
  '5.933': 'Prestacao de servico tributado pelo ISSQN (dentro do estado)',
  '6.933': 'Prestacao de servico tributado pelo ISSQN (fora do estado)',
  '5.949': 'Outra saida de mercadoria ou prestacao de servico nao especificado',
};

export const CST_CODES = {
  '00': 'Tributada integralmente',
  '10': 'Tributada e com cobranca do ICMS por substituicao tributaria',
  '20': 'Com reducao de base de calculo',
  '30': 'Isenta ou nao tributada e com cobranca do ICMS por ST',
  '40': 'Isenta',
  '41': 'Nao tributada',
  '50': 'Suspensao',
  '51': 'Diferimento',
  '60': 'ICMS cobrado anteriormente por substituicao tributaria',
  '70': 'Com reducao de base e cobranca do ICMS por ST',
  '90': 'Outros',
};

export const CSOSN_CODES = {
  '101': 'Tributada pelo Simples Nacional com credito de ICMS',
  '102': 'Tributada pelo Simples Nacional sem permissao de credito',
  '103': 'Isencao no Simples Nacional para faixa de receita bruta',
  '201': 'Simples com credito e com cobranca de ICMS por ST',
  '202': 'Simples sem credito e com cobranca de ICMS por ST',
  '203': 'Isencao no Simples com cobranca de ICMS por ST',
  '300': 'Imune',
  '400': 'Nao tributada pelo Simples Nacional',
  '500': 'ICMS cobrado anteriormente por ST (substituido) ou antecipacao',
  '900': 'Outros',
};
