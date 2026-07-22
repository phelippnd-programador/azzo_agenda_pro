import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePwaInstall() {
  const dismissedKey = "azzo-pwa-install-dismissed";
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissedState] = useState(() => {
    try {
      return localStorage.getItem(dismissedKey) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Ja esta rodando como PWA instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      if (dismissed) return;
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => setIsInstalled(true);

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, [dismissed]);

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setPromptEvent(null);
      setIsInstalled(true);
    }
  };

  const dismiss = () => {
    setDismissedState(true);
    setPromptEvent(null);
    try {
      localStorage.setItem(dismissedKey, "true");
    } catch {
      // ignore storage issues
    }
  };

  const canInstall = !dismissed && !isInstalled && promptEvent !== null;

  return { canInstall, install, dismiss };
}
