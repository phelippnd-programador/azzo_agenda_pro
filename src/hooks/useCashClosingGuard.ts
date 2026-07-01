import { useCallback, useRef, useState } from "react";
import { cashClosingsApi, type CashClosing } from "@/lib/api/finance";

export type CashGuardState =
  | { mode: "none_open"; previousDate?: undefined }
  | { mode: "stale_open"; previousDate: string; previousId: string };

export interface CashGuardResult {
  guardState: CashGuardState | null;
  isCheckingCash: boolean;
  dismissGuard: () => void;
  openCashForToday: () => Promise<void>;
  closeStaleAndOpenToday: () => Promise<void>;
  keepStaleOpen: () => void;
}

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// Não incomoda mais de uma vez por sessão por dia
const SESSION_FLAG_KEY = "cash_guard_shown_date";
const alreadyShownToday = () => sessionStorage.getItem(SESSION_FLAG_KEY) === todayKey();
const markShownToday = () => sessionStorage.setItem(SESSION_FLAG_KEY, todayKey());

export function useCashClosingGuard() {
  const [guardState, setGuardState] = useState<CashGuardState | null>(null);
  const [isCheckingCash, setIsCheckingCash] = useState(false);
  const pendingResolveRef = useRef<(() => void) | null>(null);

  const checkAfterCompletion = useCallback(async () => {
    if (alreadyShownToday()) return;

    setIsCheckingCash(true);
    try {
      const closings: CashClosing[] = await cashClosingsApi.getAll();
      const today = todayKey();
      const todayCash = closings.find((c) => c.businessDate === today);

      if (todayCash?.status === "OPEN") {
        // Tudo certo, caixa já aberto para hoje
        return;
      }

      const staleCash = closings.find((c) => c.status === "OPEN" && c.businessDate !== today);

      markShownToday();

      if (staleCash) {
        setGuardState({ mode: "stale_open", previousDate: staleCash.businessDate, previousId: staleCash.id });
      } else {
        setGuardState({ mode: "none_open" });
      }
    } catch {
      // Silencioso — guard é auxiliar, não deve bloquear o fluxo
    } finally {
      setIsCheckingCash(false);
    }
  }, []);

  const dismissGuard = useCallback(() => {
    setGuardState(null);
    pendingResolveRef.current?.();
    pendingResolveRef.current = null;
  }, []);

  const openCashForToday = useCallback(async () => {
    await cashClosingsApi.open({ businessDate: todayKey() });
    dismissGuard();
  }, [dismissGuard]);

  const closeStaleAndOpenToday = useCallback(async () => {
    if (!guardState || guardState.mode !== "stale_open") return;
    await cashClosingsApi.close(guardState.previousId, { countedTotals: {} });
    await cashClosingsApi.open({ businessDate: todayKey() });
    dismissGuard();
  }, [guardState, dismissGuard]);

  const keepStaleOpen = useCallback(() => {
    dismissGuard();
  }, [dismissGuard]);

  return {
    guardState,
    isCheckingCash,
    checkAfterCompletion,
    dismissGuard,
    openCashForToday,
    closeStaleAndOpenToday,
    keepStaleOpen,
  };
}
