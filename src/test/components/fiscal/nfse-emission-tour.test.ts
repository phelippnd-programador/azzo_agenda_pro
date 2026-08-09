import { NFSE_EMISSION_TOUR } from "@/components/fiscal/tutorial/nfse-emission-tour";
import { getNfseEmissionPendencies } from "@/lib/nfse-emission-pendencies";

describe("tour de emissao de NFS-e", () => {
  it("todos os passos tem titulo, descricao e alvo data-tour", () => {
    expect(NFSE_EMISSION_TOUR.steps.length).toBeGreaterThanOrEqual(6);
    for (const step of NFSE_EMISSION_TOUR.steps) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(step.content.trim().length).toBeGreaterThan(10);
      expect(step.target).toMatch(/^\[data-tour="[a-z0-9-]+"\]$/);
    }
  });

  it("passos declaram rota para o runner navegar entre telas/abas", () => {
    for (const step of NFSE_EMISSION_TOUR.steps) {
      expect(step.route).toBeTruthy();
      expect(step.route!.startsWith("/fiscal")).toBe(true);
    }
    // cobre as tres telas do fluxo: lista, configuracao e formulario
    const routes = NFSE_EMISSION_TOUR.steps.map((s) => s.route);
    expect(routes).toContain("/fiscal?tab=notas");
    expect(routes).toContain("/fiscal?tab=config&subtab=nfse");
    expect(routes.some((r) => r === "/fiscal/nfse/nova")).toBe(true);
  });

  it("alvos nao se repetem", () => {
    const targets = NFSE_EMISSION_TOUR.steps.map((s) => s.target);
    expect(new Set(targets).size).toBe(targets.length);
  });
});

describe("getNfseEmissionPendencies", () => {
  const validInput = {
    municipioCodigoIbge: "3304557",
    customerType: "CPF" as const,
    customerName: "Ana Silva",
    customerDocument: "123.456.789-01",
    descricaoServico: "Corte de cabelo",
    quantidade: 1,
    valorUnitario: 80,
  };

  it("sem pendencias quando tudo preenchido", () => {
    expect(getNfseEmissionPendencies(validInput)).toEqual([]);
  });

  it("aponta cada campo faltante em linguagem de usuario", () => {
    const pendencies = getNfseEmissionPendencies({
      municipioCodigoIbge: "12",
      customerType: "CNPJ",
      customerName: " ",
      customerDocument: "123",
      descricaoServico: "",
      quantidade: 1,
      valorUnitario: 0,
    });
    expect(pendencies).toEqual([
      "Município (código IBGE de 7 dígitos)",
      "Nome do tomador",
      "CNPJ do tomador (14 dígitos)",
      "Descrição do serviço",
      "Valor do serviço (quantidade × valor unitário deve ser maior que zero)",
    ]);
  });

  it("nao exige documento para tomador do exterior", () => {
    const pendencies = getNfseEmissionPendencies({
      ...validInput,
      customerType: "EXTERIOR",
      customerDocument: "",
    });
    expect(pendencies).toEqual([]);
  });

  it("valida CPF por quantidade de digitos ignorando mascara", () => {
    expect(
      getNfseEmissionPendencies({ ...validInput, customerDocument: "111.222" })
    ).toContain("CPF do tomador (11 dígitos)");
  });
});
