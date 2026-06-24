import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateOnly } from "@/lib/format";
import type { CashGuardState } from "@/hooks/useCashClosingGuard";
import { toast } from "sonner";

interface CashClosingGuardDialogProps {
  guardState: CashGuardState | null;
  onOpenToday: () => Promise<void>;
  onCloseStaleAndOpenToday: () => Promise<void>;
  onKeepStaleOpen: () => void;
  onDismiss: () => void;
}

export function CashClosingGuardDialog({
  guardState,
  onOpenToday,
  onCloseStaleAndOpenToday,
  onKeepStaleOpen,
  onDismiss,
}: CashClosingGuardDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: () => Promise<void>, successMsg: string) => {
    setIsSubmitting(true);
    try {
      await action();
      toast.success(successMsg);
    } catch {
      toast.error("Não foi possível realizar a operação. Tente pelo menu Fechamento de Caixa.");
      onDismiss();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!guardState) return null;

  const isStale = guardState.mode === "stale_open";

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !isSubmitting) onDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-amber-500" />
            <DialogTitle>
              {isStale ? "Caixa de outro dia em aberto" : "Nenhum caixa aberto para hoje"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isStale
              ? `Há um caixa aberto do dia ${formatDateOnly(guardState.previousDate)}. O que deseja fazer?`
              : "Para registrar a movimentação do dia, é necessário abrir o caixa. Deseja abrir agora?"}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {isStale ? (
            <>
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={() =>
                  handleAction(
                    onCloseStaleAndOpenToday,
                    "Caixa anterior encerrado e novo caixa aberto para hoje.",
                  )
                }
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Encerrar o anterior e abrir hoje
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
                onClick={onKeepStaleOpen}
              >
                Continuar com o caixa de {formatDateOnly(guardState.previousDate)}
              </Button>
            </>
          ) : (
            <>
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={() => handleAction(onOpenToday, "Caixa aberto para hoje!")}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Abrir caixa para hoje
              </Button>
              <Button variant="outline" className="w-full" disabled={isSubmitting} onClick={onDismiss}>
                Agora não
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
