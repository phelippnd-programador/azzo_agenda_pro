import { TaxRegime, TaxCalculation, ServiceItem } from '@/types/fiscal';

/**
 * Rounds a number to 2 decimal places (Brazilian tax standard)
 */
export function roundTax(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculates ICMS for Simples Nacional
 * Formula: ICMS = serviceValue * (aliquota / 100)
 */
function calculateICMSSimples(serviceValue: number, rate: number): number {
  return roundTax(serviceValue * (rate / 100));
}

/**
 * Calculates ICMS for Lucro Presumido (Normal regime)
 * Formula: Base = serviceValue, ICMS = base * (aliquota / 100)
 */
function calculateICMSNormal(serviceValue: number, rate: number): number {
  const base = serviceValue;
  return roundTax(base * (rate / 100));
}

/**
 * Calculates PIS
 * Formula: PIS = serviceValue * (aliquota / 100)
 */
function calculatePIS(serviceValue: number, rate: number): number {
  return roundTax(serviceValue * (rate / 100));
}

/**
 * Calculates COFINS
 * Formula: COFINS = serviceValue * (aliquota / 100)
 */
function calculateCOFINS(serviceValue: number, rate: number): number {
  return roundTax(serviceValue * (rate / 100));
}

/**
 * Main tax calculation function
 */
export function calculateTaxes(
  serviceValue: number,
  regime: TaxRegime,
  rates: { icms: number; pis: number; cofins: number }
): TaxCalculation {
  // Calculate ICMS based on regime
  const icmsValue =
    regime === TaxRegime.SIMPLES_NACIONAL
      ? calculateICMSSimples(serviceValue, rates.icms)
      : calculateICMSNormal(serviceValue, rates.icms);

  // Calculate PIS and COFINS
  const pisValue = calculatePIS(serviceValue, rates.pis);
  const cofinsValue = calculateCOFINS(serviceValue, rates.cofins);

  // Calculate totals
  const totalTaxes = roundTax(icmsValue + pisValue + cofinsValue);
  const netValue = roundTax(serviceValue - totalTaxes);

  return {
    serviceValue: roundTax(serviceValue),
    icmsBase: roundTax(serviceValue),
    icmsValue,
    pisValue,
    cofinsValue,
    totalTaxes,
    netValue,
  };
}

/**
 * Calculates total value from service items
 */
export function calculateServiceTotal(items: ServiceItem[]): number {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  return roundTax(total);
}

/**
 * Formats currency to BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Validates CFOP format (X.XXX)
 */
export function validateCFOP(cfop: string): boolean {
  const cfopRegex = /^[1-7]\.\d{3}$/;
  return cfopRegex.test(cfop);
}

/**
 * Validates CST format (XX)
 */
export function validateCST(cst: string): boolean {
  const cstRegex = /^\d{2}$/;
  return cstRegex.test(cst);
}

/**
 * Validates CPF format
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.length === 11;
}

/**
 * Validates CNPJ format
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.length === 14;
}