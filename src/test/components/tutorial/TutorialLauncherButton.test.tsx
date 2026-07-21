import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TutorialLauncherButton } from "@/components/tutorial/TutorialLauncherButton";
import { registerTour } from "@/components/tutorial/registry";
import { useTourStore } from "@/components/tutorial/tour-store";

registerTour({ id: "launcher-demo-full", version: 1, steps: [{ target: "[data-tour=\"x\"]", title: "T", content: "C" }] });
registerTour({ id: "launcher-demo-mod-1", version: 1, steps: [{ target: "[data-tour=\"y\"]", title: "T", content: "C" }] });

describe("TutorialLauncherButton", () => {
  beforeEach(() => {
    localStorage.clear();
    useTourStore.setState({ activeTourId: null, stepIndex: 0, runNonce: 0 });
  });

  it("mostra o tour completo e os modulos no menu", async () => {
    const user = userEvent.setup();
    render(
      <TutorialLauncherButton
        fullTour={{ id: "launcher-demo-full", label: "Tour completo" }}
        modules={[{ id: "launcher-demo-mod-1", label: "Modulo 1" }]}
      />
    );

    await user.click(screen.getByRole("button", { name: /Tutorial/ }));
    expect(await screen.findByText("Tour completo")).toBeInTheDocument();
    expect(screen.getByText("Modulo 1")).toBeInTheDocument();
  });

  it("clicar no tour completo inicia o tour completo", async () => {
    const user = userEvent.setup();
    render(
      <TutorialLauncherButton
        fullTour={{ id: "launcher-demo-full", label: "Tour completo" }}
        modules={[{ id: "launcher-demo-mod-1", label: "Modulo 1" }]}
      />
    );

    await user.click(screen.getByRole("button", { name: /Tutorial/ }));
    await user.click(await screen.findByText("Tour completo"));

    expect(useTourStore.getState().activeTourId).toBe("launcher-demo-full");
  });

  it("clicar num modulo inicia so aquele modulo", async () => {
    const user = userEvent.setup();
    render(
      <TutorialLauncherButton
        fullTour={{ id: "launcher-demo-full", label: "Tour completo" }}
        modules={[{ id: "launcher-demo-mod-1", label: "Modulo 1" }]}
      />
    );

    await user.click(screen.getByRole("button", { name: /Tutorial/ }));
    await user.click(await screen.findByText("Modulo 1"));

    expect(useTourStore.getState().activeTourId).toBe("launcher-demo-mod-1");
  });

  it("sem modulos, mostra so a opcao de tour completo", async () => {
    const user = userEvent.setup();
    render(
      <TutorialLauncherButton
        fullTour={{ id: "launcher-demo-full", label: "Tour completo" }}
        modules={[]}
      />
    );

    await user.click(screen.getByRole("button", { name: /Tutorial/ }));
    expect(await screen.findByText("Tour completo")).toBeInTheDocument();
    expect(screen.queryByText("Ou escolha um módulo")).not.toBeInTheDocument();
  });
});
