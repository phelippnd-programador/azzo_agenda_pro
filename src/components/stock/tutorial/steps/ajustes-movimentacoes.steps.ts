import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Modulo 4 — Ajustes e movimentacoes: o mesmo dialogo de movimentacao do
 * Modulo 3 tambem cobre o tipo "AJUSTE" (correcao de saldo, ex.: apos uma
 * contagem manual ou perda nao registrada), alem de transferencias.
 *
 * Transferencias usam campos de origem/destino em TEXTO LIVRE — nao ha
 * cadastro de unidades/locais por tras, e o fluxo (Enviar -> Receber) e
 * generico. Isso e mencionado no tour com uma ressalva honesta, ja que
 * pode nao se aplicar a um salao com uma unica unidade.
 */
export const AJUSTES_MOVIMENTACOES_STEPS: GuidedTourStep[] = [
  {
    route: "/estoque/movimentacoes",
    target: '[data-tour="stock-movement-new-button"]',
    title: "Corrigindo o saldo com um ajuste",
    content:
      'Use o mesmo botao "Nova movimentacao" e escolha o tipo "AJUSTE" quando o saldo do sistema nao bate com o saldo real (ex.: apos uma contagem ou uma perda que nao foi lancada como saida).',
    placement: "bottom",
  },
  {
    route: "/estoque/movimentacoes",
    target: '[data-tour="stock-movement-row"]',
    title: "O motivo fica registrado",
    content: 'Assim como em entradas e saidas, todo ajuste exige um motivo, e o historico mostra o "Saldo: antes -> depois" da correcao.',
    placement: "top",
  },
  {
    route: "/estoque/transferencias",
    target: '[data-tour="stock-transfer-new-button"]',
    title: "Transferencias entre unidades",
    content:
      'Se o seu negocio tem mais de uma unidade, use "Nova transferencia" para registrar o envio de um item de um local para outro. Origem e destino sao preenchidos livremente.',
    placement: "bottom",
    spotlightClicks: true,
  },
  {
    route: "/estoque/transferencias",
    target: '[data-tour="stock-transfer-row"]',
    title: "Acompanhe o status",
    content: "Cada transferencia mostra origem, destino, item, quantidade e o status atual.",
    placement: "top",
  },
  {
    route: "/estoque/transferencias",
    target: '[data-tour="stock-transfer-actions"]',
    title: "Enviar e receber",
    content:
      '"Enviar" fica disponivel enquanto a transferencia esta em rascunho. Depois de enviada, "Receber" confirma a chegada do item na unidade de destino.',
    placement: "top",
  },
];
