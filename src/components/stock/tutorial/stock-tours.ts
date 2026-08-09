import { registerTour } from "@/components/tutorial/registry";
import { CONHECENDO_ESTOQUE_STEPS } from "./steps/conhecendo-estoque.steps";
import { CADASTRANDO_PRODUTOS_STEPS } from "./steps/cadastrando-produtos.steps";
import { ENTRADAS_SAIDAS_STEPS } from "./steps/entradas-saidas.steps";
import { AJUSTES_MOVIMENTACOES_STEPS } from "./steps/ajustes-movimentacoes.steps";
import { INVENTARIO_STEPS } from "./steps/inventario.steps";
import { ALERTAS_FILTROS_RELATORIOS_STEPS } from "./steps/alertas-filtros-relatorios.steps";

/**
 * Tours guiados do modulo de Estoque, divididos em 6 modulos independentes
 * (mesmo padrao usado no tour da Agenda): cada um registra seu proprio id
 * e pode rodar isolado, alem de compor o tour completo abaixo.
 */
export const STOCK_TOUR_CONHECENDO = registerTour({
  id: "estoque-conhecendo",
  version: 1,
  steps: CONHECENDO_ESTOQUE_STEPS,
});

export const STOCK_TOUR_CADASTRANDO = registerTour({
  id: "estoque-cadastrando",
  version: 1,
  steps: CADASTRANDO_PRODUTOS_STEPS,
});

export const STOCK_TOUR_ENTRADAS_SAIDAS = registerTour({
  id: "estoque-entradas-saidas",
  version: 1,
  steps: ENTRADAS_SAIDAS_STEPS,
});

export const STOCK_TOUR_AJUSTES = registerTour({
  id: "estoque-ajustes-movimentacoes",
  version: 1,
  steps: AJUSTES_MOVIMENTACOES_STEPS,
});

export const STOCK_TOUR_INVENTARIO = registerTour({
  id: "estoque-inventario",
  version: 1,
  steps: INVENTARIO_STEPS,
});

export const STOCK_TOUR_ALERTAS = registerTour({
  id: "estoque-alertas-filtros-relatorios",
  version: 1,
  steps: ALERTAS_FILTROS_RELATORIOS_STEPS,
});

export const STOCK_TOUR_MODULES = [
  STOCK_TOUR_CONHECENDO,
  STOCK_TOUR_CADASTRANDO,
  STOCK_TOUR_ENTRADAS_SAIDAS,
  STOCK_TOUR_AJUSTES,
  STOCK_TOUR_INVENTARIO,
  STOCK_TOUR_ALERTAS,
];

export const STOCK_TOUR_FULL = registerTour({
  id: "estoque-completo",
  version: 1,
  steps: STOCK_TOUR_MODULES.flatMap((tour) => tour.steps),
});

export const STOCK_TOUR_FULL_ID = STOCK_TOUR_FULL.id;

export const STOCK_TOUR_MODULE_OPTIONS = [
  { id: STOCK_TOUR_CONHECENDO.id, label: "1. Conhecendo o estoque" },
  { id: STOCK_TOUR_CADASTRANDO.id, label: "2. Cadastrando produtos" },
  { id: STOCK_TOUR_ENTRADAS_SAIDAS.id, label: "3. Entradas e saidas" },
  { id: STOCK_TOUR_AJUSTES.id, label: "4. Ajustes e movimentacoes" },
  { id: STOCK_TOUR_INVENTARIO.id, label: "5. Inventario" },
  { id: STOCK_TOUR_ALERTAS.id, label: "6. Alertas, filtros e relatorios" },
];
