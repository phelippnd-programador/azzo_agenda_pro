import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Modulo 3 — Entradas e saidas: registro de movimentacao (mesmo dialogo
 * cobre entrada e saida, o tipo e escolhido em um campo), filtros do
 * historico e leitura das linhas de movimentacao.
 */
export const ENTRADAS_SAIDAS_STEPS: GuidedTourStep[] = [
  {
    route: "/estoque/movimentacoes",
    target: '[data-tour="stock-movement-new-button"]',
    title: "Registre uma movimentacao",
    content: 'Clique em "Nova movimentacao" para lancar uma entrada (compra, recebimento) ou uma saida (venda, consumo, perda).',
    placement: "bottom",
    spotlightClicks: true,
  },
  {
    route: "/estoque/movimentacoes/nova",
    target: '[data-tour="stock-movement-item-select"]',
    title: "Escolha o item",
    content: "Selecione o item de estoque que esta entrando ou saindo.",
    placement: "top",
  },
  {
    route: "/estoque/movimentacoes/nova",
    target: '[data-tour="stock-movement-type-select"]',
    title: "Entrada ou saida",
    content: 'Escolha "ENTRADA" quando o estoque aumenta (ex.: chegou mercadoria) ou "SAIDA" quando diminui (ex.: foi usado em um atendimento ou vendido).',
    placement: "top",
  },
  {
    route: "/estoque/movimentacoes/nova",
    target: '[data-tour="stock-movement-quantity-input"]',
    title: "Quantidade",
    content: "Informe a quantidade movimentada, na unidade de medida cadastrada para o item.",
    placement: "top",
  },
  {
    route: "/estoque/movimentacoes/nova",
    target: '[data-tour="stock-movement-reason-input"]',
    title: "Motivo",
    content: "O motivo e obrigatorio — descreva rapidamente por que essa movimentacao esta sendo feita. Isso fica registrado no historico.",
    placement: "top",
  },
  {
    route: "/estoque/movimentacoes/nova",
    target: '[data-tour="stock-movement-dialog-submit"]',
    title: "Registrar",
    content: 'Clique em "Registrar" para confirmar. O saldo do item e atualizado na hora.',
    placement: "top",
    spotlightClicks: true,
  },
  {
    route: "/estoque/movimentacoes",
    target: '[data-tour="stock-movements-filter-type"]',
    title: "Filtrar por tipo",
    content: "Veja todas as movimentacoes, ou filtre apenas entradas, apenas saidas ou apenas ajustes.",
    placement: "bottom",
  },
  {
    route: "/estoque/movimentacoes",
    target: '[data-tour="stock-movements-filter-item"]',
    title: "Filtrar por item",
    content: "Ou filtre o historico para ver apenas as movimentacoes de um item especifico.",
    placement: "bottom",
  },
  {
    route: "/estoque/movimentacoes",
    target: '[data-tour="stock-movement-row"]',
    title: "Historico de movimentacoes",
    content: 'Cada linha mostra o motivo, o tipo, o item e o "Saldo: antes -> depois", alem da data e hora.',
    placement: "top",
  },
];
