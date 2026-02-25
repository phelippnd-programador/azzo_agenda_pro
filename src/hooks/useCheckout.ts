import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  CheckoutConfirmResponse,
  CheckoutIntentResponse,
} from "@/types/checkout";
import {
  confirmCheckoutIntent,
  createCheckoutIntent,
} from "@/services/checkoutService";
import { ApiError } from "@/lib/api";

type CheckoutViewState = "idle" | "loading" | "success" | "error" | "expired";

function isIntentExpired(intent?: CheckoutIntentResponse | null) {
  if (!intent?.expiresAt) return false;
  return new Date(intent.expiresAt).getTime() <= Date.now();
}

export function useCheckout(productId: string) {
  const [state, setState] = useState<CheckoutViewState>("idle");
  const [intent, setIntent] = useState<CheckoutIntentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const createIntent = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const nextIntent = await createCheckoutIntent({
        productId,
        quantity: 1,
      });

      if (isIntentExpired(nextIntent)) {
        setIntent(nextIntent);
        setState("expired");
        return nextIntent;
      }

      setIntent(nextIntent);
      setState("success");
      return nextIntent;
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 404
          ? "Plano indisponivel no momento."
          : err instanceof Error
            ? err.message
            : "Erro ao iniciar checkout";
      setError(message);
      setState("error");
      toast.error(message);
      return null;
    }
  }, [productId]);

  const revalidateIntent = useCallback(async () => {
    return createIntent();
  }, [createIntent]);

  const confirmIntent = useCallback(async (): Promise<CheckoutConfirmResponse | null> => {
    if (!intent?.intentId) {
      setError("Intent invalida");
      setState("error");
      return null;
    }

    if (isIntentExpired(intent)) {
      setState("expired");
      toast.error("Oferta expirada. Gere uma nova intent.");
      return null;
    }

    setIsConfirming(true);
    setError(null);
    try {
      const response = await confirmCheckoutIntent(intent.intentId);
      return response;
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 422
          ? "O produto ficou indisponivel. Gere uma nova intent."
          : err instanceof Error
            ? err.message
            : "Erro ao confirmar checkout";
      setError(message);
      setState("error");
      toast.error(message);
      return null;
    } finally {
      setIsConfirming(false);
    }
  }, [intent]);

  const formattedTotalPrice = useMemo(() => {
    if (!intent) return null;
    const currency = intent.currency || "BRL";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(intent.totalPrice);
  }, [intent]);

  return {
    state,
    intent,
    error,
    isConfirming,
    createIntent,
    revalidateIntent,
    confirmIntent,
    formattedTotalPrice,
    isExpired: isIntentExpired(intent),
  };
}
