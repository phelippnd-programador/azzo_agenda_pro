import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Modulo 5 — Inventario: criar um inventario, registrar contagens,
 * conferir divergencias na tabela de contagens e fechar (ou cancelar,
 * com senha) o ciclo.
 *
 * O passo de "Gerenciar" fica sem `spotlightClicks` porque depende de
 * existir pelo menos um inventario na lista — nao forcamos o clique para
 * o tour nao travar em uma lista vazia. Da mesma forma, o cancelamento
 * (que exige senha) e apenas descrito dentro do passo de acoes do ciclo,
 * sem abrir de fato o dialogo de confirmacao — evita pedir senha real
 * durante o tutorial.
 */
export const INVENTARIO_STEPS: GuidedTourStep[] = [
  {
    route: "/estoque/inventarios",
    target: '[data-tour="stock-inventory-manage-button"]',
    title: "Gerenciando um inventario existente",
    content: 'Qualquer inventario da lista pode ser reaberto a qualquer momento clicando em "Gerenciar".',
    placement: "top",
  },
  {
    route: "/estoque/inventarios",
    target: '[data-tour="stock-inventory-new-button"]',
    title: "Comece um novo inventario",
    content: 'Clique em "Novo inventario" para iniciar uma contagem ciclica. Basta dar um nome (ex.: "Inventario mensal").',
    placement: "bottom",
    spotlightClicks: true,
  },
  {
    route: "/estoque/inventarios/novo",
    target: '[data-tour="stock-inventory-count-form"]',
    title: "Registre a contagem de cada item",
    content:
      "Escolha um item ainda nao contado neste ciclo e informe a quantidade que voce contou fisicamente. Repita para cada item que quiser conferir.",
    placement: "top",
  },
  {
    route: "/estoque/inventarios/novo",
    target: '[data-tour="stock-inventory-counts-table"]',
    title: "Divergencias ficam visiveis na hora",
    content:
      'A tabela compara o saldo esperado (o que o sistema tinha) com o que foi contado, e destaca a diferenca em verde (sobra) ou vermelho (falta).',
    placement: "top",
  },
  {
    route: "/estoque/inventarios/novo",
    target: '[data-tour="stock-inventory-lifecycle-actions"]',
    title: "Fechar ou cancelar o inventario",
    content:
      '"Fechar inventario" finaliza o ciclo e aplica as contagens ao saldo do estoque. "Cancelar inventario" descarta tudo — e uma acao irreversivel que pede sua senha para confirmar.',
    placement: "top",
  },
];
