import {
  AGENDA_TOUR_FULL_ID,
  AGENDA_TOUR_MODULES,
  AGENDA_TOUR_MODULE_OPTIONS,
} from "@/components/appointments/tutorial/agenda-tours";
import { getTour } from "@/components/tutorial/registry";

describe("tours da agenda", () => {
  it("registra os 6 modulos e o tour completo", () => {
    expect(AGENDA_TOUR_MODULES).toHaveLength(6);
    for (const module of AGENDA_TOUR_MODULES) {
      expect(getTour(module.id)).toBe(module);
      expect(module.steps.length).toBeGreaterThan(0);
    }
    expect(getTour(AGENDA_TOUR_FULL_ID)).toBeDefined();
  });

  it("o tour completo e a concatenacao exata dos modulos, na ordem", () => {
    const full = getTour(AGENDA_TOUR_FULL_ID)!;
    const expectedSteps = AGENDA_TOUR_MODULES.flatMap((m) => m.steps);
    expect(full.steps).toHaveLength(expectedSteps.length);
    expect(full.steps).toEqual(expectedSteps);
  });

  it("todo passo tem titulo, descricao, alvo data-tour e rota /agenda", () => {
    const full = getTour(AGENDA_TOUR_FULL_ID)!;
    for (const step of full.steps) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(step.content.trim().length).toBeGreaterThan(10);
      expect(step.target).toMatch(/^\[data-tour="[a-z-]+"\]$/);
      expect(step.route).toBe("/agenda");
    }
  });

  it("as opcoes de modulo batem 1:1 com os modulos registrados", () => {
    expect(AGENDA_TOUR_MODULE_OPTIONS).toHaveLength(AGENDA_TOUR_MODULES.length);
    const moduleIds = new Set(AGENDA_TOUR_MODULES.map((m) => m.id));
    for (const option of AGENDA_TOUR_MODULE_OPTIONS) {
      expect(moduleIds.has(option.id)).toBe(true);
      expect(option.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("passos de wizard multi-etapa liberam interacao para nao bloquear o botao Continuar", () => {
    const criando = getTour("agenda-criando")!;
    const wizardInternalSteps = criando.steps.filter((step) =>
      ["apt-client-step", "apt-service-step", "apt-professional-step", "apt-date-step", "apt-slots-step"].some(
        (id) => step.target === `[data-tour="${id}"]`
      )
    );
    expect(wizardInternalSteps).toHaveLength(5);
    for (const step of wizardInternalSteps) {
      expect(step.allowInteraction).toBe(true);
    }
  });

  it("modulo de reagendar nao forca clique real em Realocar profissional (evita fechar a ficha)", () => {
    const modulo = getTour("agenda-reagendando-cancelando")!;
    const reassignStep = modulo.steps.find(
      (step) => step.target === '[data-tour="apt-details-reassign"]'
    );
    expect(reassignStep).toBeDefined();
    expect(reassignStep?.spotlightClicks).not.toBe(true);
  });

  it("modulo de disponibilidade usa apenas alvos de pagina (nao exige navegar no wizard sem instrucao)", () => {
    const modulo = getTour("agenda-disponibilidade")!;
    const wizardOnlyTargets = ['[data-tour="apt-date-step"]', '[data-tour="apt-slots-step"]'];
    for (const step of modulo.steps) {
      expect(wizardOnlyTargets).not.toContain(step.target);
    }
  });
});
