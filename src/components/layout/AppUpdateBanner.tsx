import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppUpdateCheck } from "@/hooks/useAppUpdateCheck";

export function AppUpdateBanner() {
  const { updateAvailable, applyUpdate } = useAppUpdateCheck();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-primary px-4 py-2.5 text-primary-foreground shadow-md">
      <div className="flex items-center gap-2 text-sm font-medium">
        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
        Nova versao disponivel
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 shrink-0 text-xs"
        onClick={applyUpdate}
      >
        Atualizar agora
      </Button>
    </div>
  );
}
