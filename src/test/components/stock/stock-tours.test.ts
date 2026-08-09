import {
  STOCK_TOUR_FULL_ID,
  STOCK_TOUR_MODULES,
  STOCK_TOUR_MODULE_OPTIONS,
} from "@/components/stock/tutorial/stock-tours";
import { getTour } from "@/components/tutorial/registry";

describe("tours do estoque", () => {
  it("registra os 6 modulos e o tour completo", () => {
    expect(STOCK_TOUR_MODULES).toHaveLength(6);
    for (const module of STOCK_TOUR_MODULES) {
      expect(getTour(module.id)).toBe(module);
      expect(module.steps.length).toBeGreaterThan(0);
    }
    expect(getTour(STOCK_TOUR_FULL_ID)).toBeDefined();
  });

  it("o tour completo e a concatenacao exata dos modulos, na ordem", () => {
    const full = getTour(STOCK_TOUR_FULL_ID)!;
    const expectedSteps = STOCK_TOUR_MODULES.flatMap((m) => m.steps);
    expect(full.steps).toHaveLength(expectedSteps.length);
    expect(full.steps).toEqual(expectedSteps);
  });

  it("todo passo tem titulo, descricao e alvo data-tour", () => {
    const full = getTour(STOCK_TOUR_FULL_ID)!;
    for (const step of full.steps) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(step.content.trim().length).toBeGreaterThan(10);
      expect(step.target).toMatch(/^\[data-tour="[a-z-]+"\]$/);
    }
  });

  it("todo passo aponta para uma rota valida do modulo de estoque", () => {
    const full = getTour(STOCK_TOUR_FULL_ID)!;
    const validRoutePrefixes = ["/estoque", "/configuracoes/estoque", "/relatorio/estoque"];
    for (const step of full.steps) {
      expect(step.route).toBeDefined();
      expect(validRoutePrefixes.some((prefix) => step.route!.startsWith(prefix))).toBe(true);
    }
  });

  it("as opcoes de modulo batem 1:1 com os modulos registrados, numeradas de 1 a 6", () => {
    expect(STOCK_TOUR_MODULE_OPTIONS).toHaveLength(STOCK_TOUR_MODULES.length);
    const moduleIds = new Set(STOCK_TOUR_MODULES.map((m) => m.id));
    STOCK_TOUR_MODULE_OPTIONS.forEach((option, index) => {
      expect(moduleIds.has(option.id)).toBe(true);
      expect(option.label.startsWith(`${index + 1}.`)).toBe(true);
    });
  });

  it("modulo de cadastro de produtos nao referencia campos inexistentes no formulario (categoria, marca, preco)", () => {
    const cadastro = getTour("estoque-cadastrando")!;
    const forbiddenTargets = [
      "stock-item-category",
      "stock-item-brand",
      "stock-item-supplier",
      "stock-item-cost-price",
      "stock-item-sale-price",
      "stock-item-barcode",
    ];
    for (const step of cadastro.steps) {
      expect(forbiddenTargets).not.toContain(step.target.replace(/\[data-tour="|"\]/g, ""));
    }
  });

  it("modulo de inventario nao forca clique no botao Gerenciar (lista pode estar vazia)", () => {
    const inventario = getTour("estoque-inventario")!;
    const manageStep = inventario.steps.find(
      (step) => step.target === '[data-tour="stock-inventory-manage-button"]'
    );
    expect(manageStep).toBeDefined();
    expect(manageStep?.spotlightClicks).not.toBe(true);
  });

  it("modulo de inventario nao abre o dialogo de cancelamento (evita pedir senha real no tour)", () => {
    const inventario = getTour("estoque-inventario")!;
    const cancelFormStep = inventario.steps.find(
      (step) => step.target === '[data-tour="stock-inventory-cancel-form"]'
    );
    expect(cancelFormStep).toBeUndefined();
  });
});
