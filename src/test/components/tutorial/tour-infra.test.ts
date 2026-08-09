import { hasSeenTour, markTourSeen, resetTourSeen } from "@/components/tutorial/tour-storage";
import { locationMatchesRoute } from "@/components/tutorial/tour-dom";
import { registerTour, getTour } from "@/components/tutorial/registry";
import { useTourStore } from "@/components/tutorial/tour-store";

describe("tour-storage", () => {
  beforeEach(() => localStorage.clear());

  it("marca e consulta tour como visto por id+versao", () => {
    expect(hasSeenTour("demo", 1)).toBe(false);
    markTourSeen("demo", 1, "finished");
    expect(hasSeenTour("demo", 1)).toBe(true);
    // nova versao do tour reexibe
    expect(hasSeenTour("demo", 2)).toBe(false);
  });

  it("registra encerramento por pulo tambem", () => {
    markTourSeen("demo", 1, "skipped");
    expect(hasSeenTour("demo", 1)).toBe(true);
  });

  it("reset remove a marcacao", () => {
    markTourSeen("demo", 1, "finished");
    resetTourSeen("demo", 1);
    expect(hasSeenTour("demo", 1)).toBe(false);
  });
});

describe("locationMatchesRoute", () => {
  it("compara pathname e query params declarados", () => {
    const current = { pathname: "/fiscal", search: "?tab=config&subtab=nfse&extra=1" };
    expect(locationMatchesRoute(current, "/fiscal?tab=config&subtab=nfse")).toBe(true);
    expect(locationMatchesRoute(current, "/fiscal?tab=notas")).toBe(false);
    expect(locationMatchesRoute(current, "/outra?tab=config")).toBe(false);
    expect(locationMatchesRoute(current, "/fiscal")).toBe(true);
  });
});

describe("tour-store", () => {
  beforeEach(() => {
    localStorage.clear();
    useTourStore.setState({ activeTourId: null, stepIndex: 0, runNonce: 0 });
    registerTour({
      id: "store-demo",
      version: 1,
      steps: [{ target: "[data-x]", title: "T", content: "C" }],
    });
  });

  it("startTour ativa tour registrado e ignora id desconhecido", () => {
    useTourStore.getState().startTour("inexistente");
    expect(useTourStore.getState().activeTourId).toBeNull();
    useTourStore.getState().startTour("store-demo");
    expect(useTourStore.getState().activeTourId).toBe("store-demo");
    expect(useTourStore.getState().stepIndex).toBe(0);
  });

  it("reiniciar o mesmo tour troca o runNonce (remonta o runner do passo 1)", () => {
    useTourStore.getState().startTour("store-demo");
    const firstNonce = useTourStore.getState().runNonce;
    useTourStore.getState().startTour("store-demo");
    expect(useTourStore.getState().runNonce).toBe(firstNonce + 1);
  });

  it("startTourIfNeverSeen inicia apenas no primeiro acesso", () => {
    useTourStore.getState().startTourIfNeverSeen("store-demo");
    expect(useTourStore.getState().activeTourId).toBe("store-demo");

    useTourStore.getState().finishTour("finished");
    expect(useTourStore.getState().activeTourId).toBeNull();

    // segunda visita: ja visto, nao reinicia
    useTourStore.getState().startTourIfNeverSeen("store-demo");
    expect(useTourStore.getState().activeTourId).toBeNull();
  });

  it("finishTour com skip tambem persiste como apresentado", () => {
    useTourStore.getState().startTour("store-demo");
    useTourStore.getState().finishTour("skipped");
    expect(hasSeenTour("store-demo", 1)).toBe(true);
  });

  it("nao sobrepoe tour em andamento no auto-inicio", () => {
    registerTour({ id: "outro", version: 1, steps: [{ target: "[data-y]", title: "T", content: "C" }] });
    useTourStore.getState().startTour("store-demo");
    useTourStore.getState().startTourIfNeverSeen("outro");
    expect(useTourStore.getState().activeTourId).toBe("store-demo");
  });

  it("getTour resolve definicao registrada", () => {
    expect(getTour("store-demo")?.steps).toHaveLength(1);
  });
});
