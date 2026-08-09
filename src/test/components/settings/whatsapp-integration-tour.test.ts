import {
  WHATSAPP_INTEGRATION_TOUR,
  WHATSAPP_INTEGRATION_TOUR_ID,
} from "@/components/settings/tutorial/whatsapp-integration-tour";
import { getTour } from "@/components/tutorial/registry";

describe("tour da integracao WhatsApp", () => {
  it("registra o tour com o id esperado", () => {
    expect(WHATSAPP_INTEGRATION_TOUR_ID).toBe("whatsapp-integracao");
    expect(getTour(WHATSAPP_INTEGRATION_TOUR_ID)).toBe(WHATSAPP_INTEGRATION_TOUR);
    expect(WHATSAPP_INTEGRATION_TOUR.steps.length).toBeGreaterThan(0);
  });

  it("todo passo tem titulo, descricao, alvo data-tour e aponta para a rota da integracao", () => {
    for (const step of WHATSAPP_INTEGRATION_TOUR.steps) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(step.content.trim().length).toBeGreaterThan(10);
      expect(step.target).toMatch(/^\[data-tour="[a-z-]+"\]$/);
      expect(step.route).toBe("/configuracoes/integracoes/whatsapp");
    }
  });

  it("os alvos sao unicos (sem passo duplicado por engano)", () => {
    const targets = WHATSAPP_INTEGRATION_TOUR.steps.map((step) => step.target);
    expect(new Set(targets).size).toBe(targets.length);
  });
});
