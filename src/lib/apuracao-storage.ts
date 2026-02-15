import { ApuracaoMensal, ApuracaoResumo, RegimeTributario } from '@/types/apuracao';
import { invoiceStorage } from './invoice-storage';
import { calcularApuracaoMensal, calcularFaturamento12Meses, convertTaxRegime } from './apuracao-calculator';
import { TaxRegime } from '@/types/fiscal';

const STORAGE_KEY = 'azzo_apuracoes';
const CONFIG_KEY = 'azzo_tax_config';

interface TaxConfig {
  regime: TaxRegime;
}

/**
 * Storage para gerenciamento de apurações mensais
 */
export const apuracaoStorage = {
  /**
   * Obtém o regime tributário configurado
   */
  getRegimeTributario(): RegimeTributario {
    if (typeof window === 'undefined') return RegimeTributario.SIMPLES_NACIONAL;
    const config = localStorage.getItem(CONFIG_KEY);
    if (config) {
      const parsed: TaxConfig = JSON.parse(config);
      return convertTaxRegime(parsed.regime);
    }
    return RegimeTributario.SIMPLES_NACIONAL;
  },

  /**
   * Obtém todas as apurações salvas
   */
  getAll(): ApuracaoMensal[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Obtém uma apuração por ano e mês
   */
  getByPeriodo(ano: number, mes: number): ApuracaoMensal | null {
    const apuracoes = this.getAll();
    return apuracoes.find((ap) => ap.ano === ano && ap.mes === mes) || null;
  },

  /**
   * Salva uma apuração
   */
  save(apuracao: ApuracaoMensal): void {
    const apuracoes = this.getAll();
    const index = apuracoes.findIndex((ap) => ap.ano === apuracao.ano && ap.mes === apuracao.mes);

    if (index >= 0) {
      apuracoes[index] = apuracao;
    } else {
      apuracoes.push(apuracao);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(apuracoes));
  },

  /**
   * Remove uma apuração
   */
  delete(ano: number, mes: number): void {
    const apuracoes = this.getAll().filter((ap) => !(ap.ano === ano && ap.mes === mes));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apuracoes));
  },

  /**
   * Obtém ou calcula a apuração do mês atual
   */
  getOrCalculateMesAtual(): ApuracaoMensal {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;

    return this.getOrCalculate(ano, mes);
  },

  /**
   * Obtém ou calcula a apuração de um período específico
   */
  getOrCalculate(ano: number, mes: number): ApuracaoMensal {
    // Sempre recalcular para garantir dados atualizados
    const invoices = invoiceStorage.getAll();
    const regime = this.getRegimeTributario();
    const faturamento12Meses = calcularFaturamento12Meses(invoices);

    const apuracao = calcularApuracaoMensal(invoices, ano, mes, regime, faturamento12Meses);

    // Salvar a apuração calculada
    this.save(apuracao);

    return apuracao;
  },

  /**
   * Força o recálculo de uma apuração
   */
  recalcular(ano: number, mes: number): ApuracaoMensal {
    // Deletar apuração existente
    this.delete(ano, mes);

    // Recalcular
    return this.getOrCalculate(ano, mes);
  },

  /**
   * Obtém o histórico de apurações (últimos N meses)
   */
  getHistorico(limite: number = 12): ApuracaoResumo[] {
    const hoje = new Date();
    const historico: ApuracaoResumo[] = [];

    for (let i = 0; i < limite; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const ano = data.getFullYear();
      const mes = data.getMonth() + 1;

      const apuracao = this.getOrCalculate(ano, mes);

      historico.push({
        id: apuracao.id,
        ano: apuracao.ano,
        mes: apuracao.mes,
        status: apuracao.status,
        regimeTributario: apuracao.regimeTributario,
        valorTotalServicos: apuracao.valorTotalServicos,
        valorTotalImpostos: apuracao.valorTotalImpostos,
        quantidadeDocumentos: apuracao.quantidadeDocumentos,
      });
    }

    return historico;
  },

  /**
   * Obtém resumo do ano atual
   */
  getResumoAno(ano: number): {
    totalServicos: number;
    totalImpostos: number;
    totalDocumentos: number;
    meses: ApuracaoResumo[];
  } {
    const meses: ApuracaoResumo[] = [];
    let totalServicos = 0;
    let totalImpostos = 0;
    let totalDocumentos = 0;

    const hoje = new Date();
    const mesAtual = hoje.getFullYear() === ano ? hoje.getMonth() + 1 : 12;

    for (let mes = 1; mes <= mesAtual; mes++) {
      const apuracao = this.getOrCalculate(ano, mes);

      meses.push({
        id: apuracao.id,
        ano: apuracao.ano,
        mes: apuracao.mes,
        status: apuracao.status,
        regimeTributario: apuracao.regimeTributario,
        valorTotalServicos: apuracao.valorTotalServicos,
        valorTotalImpostos: apuracao.valorTotalImpostos,
        quantidadeDocumentos: apuracao.quantidadeDocumentos,
      });

      totalServicos += apuracao.valorTotalServicos;
      totalImpostos += apuracao.valorTotalImpostos;
      totalDocumentos += apuracao.quantidadeDocumentos;
    }

    return {
      totalServicos: Math.round(totalServicos * 100) / 100,
      totalImpostos: Math.round(totalImpostos * 100) / 100,
      totalDocumentos,
      meses,
    };
  },
};