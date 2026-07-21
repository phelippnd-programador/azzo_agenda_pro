import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Modulo 1 — Conhecendo o estoque: abas do modulo, indicadores e resumos
 * da visao geral, ultimas movimentacoes e graficos.
 */
export const CONHECENDO_ESTOQUE_STEPS: GuidedTourStep[] = [
  {
    route: "/estoque/visao-geral",
    target: '[data-tour="stock-tabs"]',
    title: "Bem-vinda ao Estoque",
    content:
      "Aqui voce controla itens, entradas, saidas, ajustes, inventarios, fornecedores, pedidos e transferencias. Cada aba acima leva a uma parte do fluxo.",
    placement: "bottom",
  },
  {
    route: "/estoque/visao-geral",
    target: '[data-tour="stock-summary-cards"]',
    title: "Indicadores do estoque",
    content:
      "Acompanhe de relance quantos itens estao cadastrados, quantos estao abaixo do minimo ou zerados, o total de movimentacoes e o valor em estoque.",
    placement: "bottom",
  },
  {
    route: "/estoque/visao-geral",
    target: '[data-tour="stock-recent-movements"]',
    title: "Ultimas movimentacoes",
    content:
      "As entradas, saidas e ajustes mais recentes aparecem aqui, com o saldo antes e depois de cada movimentacao.",
    placement: "top",
  },
  {
    route: "/estoque/visao-geral",
    target: '[data-tour="stock-charts"]',
    title: "Graficos de apoio",
    content:
      "O grafico de barras mostra os itens com maior saldo. O grafico de pizza mostra a proporcao entre entradas, saidas e ajustes registrados.",
    placement: "top",
  },
];
