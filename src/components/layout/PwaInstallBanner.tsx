import { Download, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function PwaInstallBanner() {
  const { canInstall, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  // Mostra apenas em dispositivos moveis
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!canInstall || dismissed || !isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] flex items-center gap-3 border-t bg-background px-4 py-3 shadow-lg safe-area-inset-bottom">
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm font-semibold">Instalar Azzo Agenda</p>
        <p className="truncate text-xs text-muted-foreground">
          Acesse mais rapido direto da tela inicial
        </p>
      </div>
      <Button size="sm" className="shrink-0 gap-1.5" onClick={install}>
        <Download className="h-3.5 w-3.5" />
        Instalar
      </Button>
      <button
        type="button"
        aria-label="Fechar"
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
