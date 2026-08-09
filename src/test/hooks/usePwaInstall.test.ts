import { act, renderHook } from "@testing-library/react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

function firePrompt() {
  const event = new Event("beforeinstallprompt") as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome: "accepted" });
  window.dispatchEvent(event);
  return event;
}

describe("usePwaInstall", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("permite instalar quando o navegador dispara beforeinstallprompt", () => {
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(false);

    act(() => {
      firePrompt();
    });

    expect(result.current.canInstall).toBe(true);
  });

  it("dismiss esconde o convite e persiste a escolha entre remontagens", () => {
    const { result, unmount } = renderHook(() => usePwaInstall());

    act(() => {
      firePrompt();
    });
    expect(result.current.canInstall).toBe(true);

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.canInstall).toBe(false);
    expect(localStorage.getItem("azzo-pwa-install-dismissed")).toBe("true");

    unmount();
    const { result: resultAfterRemount } = renderHook(() => usePwaInstall());

    act(() => {
      firePrompt();
    });
    // Mesmo com um novo evento do navegador, a decisao de dispensar
    // anterior (persistida) continua valendo apos remontar o hook.
    expect(resultAfterRemount.current.canInstall).toBe(false);
  });
});
