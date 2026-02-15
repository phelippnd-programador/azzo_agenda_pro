export enum TaxRegime {
  SIMPLES_NACIONAL = 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
}

export interface TaxRate {
  id: string;
  regime: TaxRegime;
  icmsRate: number; // Percentage
  pisRate: number; // Percentage
  cofinsRate: number; // Percentage
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
  customerDocument: string; // CPF or CNPJ
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

// Common CFOP codes for services
export const CFOP_CODES = {
  '5.933': 'Prestação de serviço tributado pelo ISSQN (dentro do estado)',
  '6.933': 'Prestação de serviço tributado pelo ISSQN (fora do estado)',
  '5.949': 'Outra saída de mercadoria ou prestação de serviço não especificado',
};

// Common CST codes
export const CST_CODES = {
  '00': 'Tributada integralmente',
  '20': 'Com redução de base de cálculo',
  '40': 'Isenta',
  '41': 'Não tributada',
  '60': 'ICMS cobrado anteriormente por substituição tributária',
};