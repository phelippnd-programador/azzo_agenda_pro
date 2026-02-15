import { Invoice } from '@/types/invoice';
import { TaxRegime } from '@/types/fiscal';
import {
  ApuracaoMensal,
  ApuracaoImposto,
  ApuracaoDocumento,
  StatusApuracao,
  TipoImposto,
  RegimeTributario,
  TIPO_IMPOSTO_DESCRICAO,
} from '@/types/apuracao';
import { roundTax } from './tax-calculator';

/**
 * Converte TaxRegime para RegimeTributario
 */
export function convertTaxRegime(regime: TaxRegime | undefined): RegimeTributario {
  if (regime === TaxRegime.SIMPLES_NACIONAL) {
    return RegimeTributario.SIMPLES_NACIONAL;
  }
  return RegimeTributario.LUCRO_PRESUMIDO;
}

/**
 * Determina o status da apuração baseado no ano e mês
 */
export function determinarStatus(ano: number, mes: number): StatusApuracao {
  const hoje = new Date();
  const primeiroDiaMes = new Date(ano, mes - 1, 1);
  const ultimoDiaMes = new Date(ano, mes, 0); // Último dia do mês

  if (hoje < primeiroDiaMes) {
    // Mês futuro - não deveria acontecer, mas tratamos como aberta
    return StatusApuracao.ABERTA;
  }

  if (hoje > ultimoDiaMes) {
    // Mês passado - apuração fechada
    return StatusApuracao.FECHADA;
  }

  // Mês corrente - apuração parcial
  return StatusApuracao.PARCIAL;
}

/**
 * Verifica se o mês ainda permite alterações
 */
export function isMesAberto(ano: number, mes: number): boolean {
  const status = determinarStatus(ano, mes);
  return status === StatusApuracao.ABERTA || status === StatusApuracao.PARCIAL;
}

/**
 * Retorna os tipos de imposto aplicáveis ao regime tributário
 */
export function getImpostosPorRegime(regime: RegimeTributario): TipoImposto[] {
  switch (regime) {
    case RegimeTributario.SIMPLES_NACIONAL:
      return [TipoImposto.DAS, TipoImposto.ISS];
    case RegimeTributario.MEI:
      return [TipoImposto.DAS];
    case RegimeTributario.LUCRO_PRESUMIDO:
    case RegimeTributario.LUCRO_REAL:
      return [
        TipoImposto.ICMS,
        TipoImposto.PIS,
        TipoImposto.COFINS,
        TipoImposto.ISS,
        TipoImposto.IRPJ,
        TipoImposto.CSLL,
      ];
    default:
      return [TipoImposto.ICMS, TipoImposto.PIS, TipoImposto.COFINS, TipoImposto.ISS];
  }
}

/**
 * Calcula alíquota efetiva do Simples Nacional baseado no faturamento dos últimos 12 meses
 * Anexo III - Serviços
 */
export function calcularAliquotaSimples(faturamento12Meses: number): number {
  if (faturamento12Meses <= 180000) {
    return 0.06; // 6%
  } else if (faturamento12Meses <= 360000) {
    return 0.112; // 11.2%
  } else if (faturamento12Meses <= 720000) {
    return 0.135; // 13.5%
  } else if (faturamento12Meses <= 1800000) {
    return 0.16; // 16%
  } else if (faturamento12Meses <= 3600000) {
    return 0.21; // 21%
  } else {
    return 0.33; // 33%
  }
}

/**
 * Filtra documentos fiscais por período (ano/mês)
 */
export function filtrarDocumentosPorPeriodo(
  invoices: Invoice[],
  ano: number,
  mes: number
): Invoice[] {
  return invoices.filter((invoice) => {
    const dataEmissao = new Date(invoice.issueDate);
    return (
      dataEmissao.getFullYear() === ano &&
      dataEmissao.getMonth() + 1 === mes
    );
  });
}

/**
 * Filtra apenas documentos válidos (emitidos, não cancelados)
 */
export function filtrarDocumentosValidos(invoices: Invoice[]): Invoice[] {
  return invoices.filter((invoice) => invoice.status === 'ISSUED');
}

/**
 * Cria um objeto ApuracaoImposto zerado
 */
function criarImpostoZerado(tipo: TipoImposto): ApuracaoImposto {
  return {
    id: `${tipo}-${Date.now()}`,
    tipoImposto: tipo,
    descricao: TIPO_IMPOSTO_DESCRICAO[tipo],
    baseCalculo: 0,
    aliquota: 0,
    valorApurado: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calcula impostos para regime Simples Nacional
 */
function calcularImpostosSimples(
  documentos: Invoice[],
  faturamento12Meses: number
): ApuracaoImposto[] {
  const aliquotaDAS = calcularAliquotaSimples(faturamento12Meses);
  const totalServicos = documentos.reduce((sum, doc) => sum + doc.totalValue, 0);

  const das: ApuracaoImposto = {
    id: `DAS-${Date.now()}`,
    tipoImposto: TipoImposto.DAS,
    descricao: TIPO_IMPOSTO_DESCRICAO[TipoImposto.DAS],
    baseCalculo: roundTax(totalServicos),
    aliquota: aliquotaDAS,
    valorApurado: roundTax(totalServicos * aliquotaDAS),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // ISS geralmente já está incluído no DAS para Simples Nacional
  const iss: ApuracaoImposto = {
    id: `ISS-${Date.now()}`,
    tipoImposto: TipoImposto.ISS,
    descricao: TIPO_IMPOSTO_DESCRICAO[TipoImposto.ISS],
    baseCalculo: roundTax(totalServicos),
    aliquota: 0, // Já incluído no DAS
    valorApurado: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return [das, iss];
}

/**
 * Calcula impostos para regime Lucro Presumido
 */
function calcularImpostosLucroPresumido(documentos: Invoice[]): ApuracaoImposto[] {
  const impostos: Map<TipoImposto, ApuracaoImposto> = new Map();

  // Inicializar todos os tipos de imposto
  const tiposImposto = getImpostosPorRegime(RegimeTributario.LUCRO_PRESUMIDO);
  tiposImposto.forEach((tipo) => {
    impostos.set(tipo, criarImpostoZerado(tipo));
  });

  // Acumular valores de cada documento
  documentos.forEach((doc) => {
    const totalValue = doc.totalValue;
    const taxes = doc.taxBreakdown;

    // ICMS
    const icms = impostos.get(TipoImposto.ICMS)!;
    icms.baseCalculo = roundTax(icms.baseCalculo + totalValue);
    icms.valorApurado = roundTax(icms.valorApurado + taxes.icms);
    if (totalValue > 0) {
      icms.aliquota = roundTax(taxes.icms / totalValue);
    }

    // PIS
    const pis = impostos.get(TipoImposto.PIS)!;
    pis.baseCalculo = roundTax(pis.baseCalculo + totalValue);
    pis.valorApurado = roundTax(pis.valorApurado + taxes.pis);
    if (totalValue > 0) {
      pis.aliquota = roundTax(taxes.pis / totalValue);
    }

    // COFINS
    const cofins = impostos.get(TipoImposto.COFINS)!;
    cofins.baseCalculo = roundTax(cofins.baseCalculo + totalValue);
    cofins.valorApurado = roundTax(cofins.valorApurado + taxes.cofins);
    if (totalValue > 0) {
      cofins.aliquota = roundTax(taxes.cofins / totalValue);
    }
  });

  // ISS - calcular com alíquota padrão de 5%
  const iss = impostos.get(TipoImposto.ISS)!;
  const totalServicos = documentos.reduce((sum, doc) => sum + doc.totalValue, 0);
  iss.baseCalculo = roundTax(totalServicos);
  iss.aliquota = 0.05;
  iss.valorApurado = roundTax(totalServicos * 0.05);

  // IRPJ - base presumida de 32% para serviços, alíquota de 15%
  const irpj = impostos.get(TipoImposto.IRPJ)!;
  const basePresumidaIRPJ = roundTax(totalServicos * 0.32);
  irpj.baseCalculo = basePresumidaIRPJ;
  irpj.aliquota = 0.15;
  irpj.valorApurado = roundTax(basePresumidaIRPJ * 0.15);

  // CSLL - base presumida de 32% para serviços, alíquota de 9%
  const csll = impostos.get(TipoImposto.CSLL)!;
  const basePresumidaCSLL = roundTax(totalServicos * 0.32);
  csll.baseCalculo = basePresumidaCSLL;
  csll.aliquota = 0.09;
  csll.valorApurado = roundTax(basePresumidaCSLL * 0.09);

  return Array.from(impostos.values());
}

/**
 * Calcula a apuração mensal completa
 */
export function calcularApuracaoMensal(
  invoices: Invoice[],
  ano: number,
  mes: number,
  regime: RegimeTributario,
  faturamento12Meses: number = 0
): ApuracaoMensal {
  // Filtrar documentos do período
  const documentosPeriodo = filtrarDocumentosPorPeriodo(invoices, ano, mes);
  const documentosValidos = filtrarDocumentosValidos(documentosPeriodo);

  // Calcular impostos baseado no regime
  let impostos: ApuracaoImposto[];
  if (regime === RegimeTributario.SIMPLES_NACIONAL || regime === RegimeTributario.MEI) {
    impostos = calcularImpostosSimples(documentosValidos, faturamento12Meses);
  } else {
    impostos = calcularImpostosLucroPresumido(documentosValidos);
  }

  // Calcular totais
  const valorTotalServicos = roundTax(
    documentosValidos.reduce((sum, doc) => sum + doc.totalValue, 0)
  );
  const valorTotalImpostos = roundTax(
    impostos.reduce((sum, imp) => sum + imp.valorApurado, 0)
  );

  // Criar referências de documentos
  const documentosRef: ApuracaoDocumento[] = documentosValidos.map((doc) => ({
    id: `ref-${doc.id}`,
    documentoFiscalId: doc.id,
    valorDocumento: doc.totalValue,
    statusDocumento: doc.status,
    incluidoEm: new Date().toISOString(),
  }));

  // Determinar status
  const status = determinarStatus(ano, mes);

  // Criar apuração
  const apuracao: ApuracaoMensal = {
    id: `apuracao-${ano}-${mes}-${Date.now()}`,
    ano,
    mes,
    status,
    regimeTributario: regime,
    valorTotalServicos,
    valorTotalImpostos,
    impostos,
    documentos: documentosRef,
    dataAbertura: new Date(ano, mes - 1, 1).toISOString(),
    dataFechamento: status === StatusApuracao.FECHADA ? new Date(ano, mes, 0).toISOString() : null,
    quantidadeDocumentos: documentosValidos.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return apuracao;
}

/**
 * Calcula o faturamento dos últimos 12 meses para determinar alíquota do Simples
 */
export function calcularFaturamento12Meses(invoices: Invoice[]): number {
  const hoje = new Date();
  const dataLimite = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);

  const documentosValidos = invoices.filter((invoice) => {
    const dataEmissao = new Date(invoice.issueDate);
    return invoice.status === 'ISSUED' && dataEmissao >= dataLimite;
  });

  return roundTax(documentosValidos.reduce((sum, doc) => sum + doc.totalValue, 0));
}