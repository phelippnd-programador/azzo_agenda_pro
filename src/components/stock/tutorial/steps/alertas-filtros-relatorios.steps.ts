import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Modulo 6 — Alertas, filtros e relatorios: configuracoes de alerta de
 * estoque minimo, o relatorio de estoque (filtros, resumo e exportacao
 * CSV) e a importacao em massa como recurso avancado.
 *
 * Configuracoes e Relatorio ficam fora da barra de abas do Estoque (rotas
 * `/configuracoes/estoque` e `/relatorio/estoque`) — os passos navegam
 * ate la via `route`, como ja acontece no tour do Fiscal entre abas.
 */
export const ALERTAS_FILTROS_RELATORIOS_STEPS: GuidedTourStep[] = [
  {
    route: "/configuracoes/estoque",
    target: '[data-tour="stock-settings-alerts"]',
    title: "Configure os alertas de estoque",
    content:
      'Ative o alerta de estoque minimo, decida se quer bloquear saidas sem saldo suficiente e se ajustes negativos exigem permissao especial.',
    placement: "bottom",
  },
  {
    route: "/configuracoes/estoque",
    target: '[data-tour="stock-settings-coverage"]',
    title: "Dias de cobertura meta",
    content: "Defina para quantos dias de uso o estoque deveria durar — essa referencia aparece nos relatorios de acompanhamento.",
    placement: "top",
  },
  {
    route: "/relatorio/estoque",
    target: '[data-tour="stock-report-filters"]',
    title: "Relatorio de estoque",
    content: "Escolha um periodo (7 dias, mes, trimestre ou datas customizadas) e filtre por tipo de movimentacao para consolidar o relatorio.",
    placement: "bottom",
  },
  {
    route: "/relatorio/estoque",
    target: '[data-tour="stock-report-summary"]',
    title: "Resumo do periodo",
    content: "Veja o total de entradas, saidas, ajustes e quantos itens estao abaixo do minimo no periodo filtrado.",
    placement: "top",
  },
  {
    route: "/relatorio/estoque",
    target: '[data-tour="stock-report-export"]',
    title: "Exportar para planilha",
    content: '"Exportar CSV" baixa o relatorio detalhado para abrir no Excel ou Google Planilhas.',
    placement: "top",
  },
  {
    route: "/estoque/importacoes",
    target: '[data-tour="stock-imports-form"]',
    title: "Recurso avancado: importacao em massa",
    content:
      "Para cadastrar muitos itens ou lancar muitas entradas/ajustes de uma vez, baixe o modelo de planilha, preencha e envie aqui. Voce pode simular antes (modo dry-run) sem alterar o estoque de verdade.",
    placement: "top",
  },
];
