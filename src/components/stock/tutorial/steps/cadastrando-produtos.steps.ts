import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Modulo 2 — Cadastrando produtos: busca/filtros da lista de itens,
 * cadastro (nome, SKU, unidade, estoque minimo), edicao e ativar/inativar.
 *
 * O modelo de item deste sistema e enxuto: nao existe campo separado de
 * codigo de barras (o SKU cobre essa funcao), nem categoria, marca,
 * fornecedor, preco de custo/venda editaveis no formulario do item — o
 * vinculo com fornecedor acontece via Pedidos de compra, nao no cadastro
 * do item. O tour reflete o formulario real, sem inventar campos.
 */
export const CADASTRANDO_PRODUTOS_STEPS: GuidedTourStep[] = [
  {
    route: "/estoque/itens",
    target: '[data-tour="stock-items-search"]',
    title: "Encontre um item rapidamente",
    content: "Busque por nome ou por SKU (codigo interno) para localizar um item na lista.",
    placement: "bottom",
  },
  {
    route: "/estoque/itens",
    target: '[data-tour="stock-items-status-filter"]',
    title: "Filtrar por status",
    content: "Veja todos os itens, ou filtre apenas os ativos ou apenas os inativos.",
    placement: "bottom",
  },
  {
    route: "/estoque/itens",
    target: '[data-tour="stock-items-new-button"]',
    title: "Cadastre um novo item",
    content: 'Clique em "Novo item" para abrir o formulario de cadastro.',
    placement: "bottom",
    spotlightClicks: true,
  },
  {
    route: "/estoque/itens/novo",
    target: '[data-tour="stock-items-form"]',
    title: "Dados do item",
    content:
      "Preencha o nome, o SKU (codigo interno, opcional) e a unidade de medida (ex.: UN, ML, KG). O estoque minimo define quando o item aparece como \"abaixo do minimo\".",
    placement: "top",
  },
  {
    route: "/estoque/itens/novo",
    target: '[data-tour="stock-items-dialog-submit"]',
    title: "Salve o cadastro",
    content: 'Clique em "Salvar" para concluir. O item entra na lista com saldo zero, ate a primeira entrada de estoque.',
    placement: "top",
    spotlightClicks: true,
  },
  {
    route: "/estoque/itens",
    target: '[data-tour="stock-item-row"]',
    title: "Leitura rapida do item",
    content:
      'Cada item mostra o saldo atual, o estoque minimo e um selo: "Abaixo do minimo" (vermelho) ou "Normal".',
    placement: "top",
  },
  {
    route: "/estoque/itens",
    target: '[data-tour="stock-item-edit-button"]',
    title: "Editar um item",
    content: 'Use "Editar" para corrigir nome, SKU, unidade ou estoque minimo a qualquer momento.',
    placement: "top",
  },
  {
    route: "/estoque/itens",
    target: '[data-tour="stock-item-toggle-button"]',
    title: "Ativar ou inativar",
    content:
      "Nao existe exclusao de item — apenas ativar/inativar. Um item inativo some das opcoes de movimentacao, mas mantem o historico.",
    placement: "top",
  },
];
