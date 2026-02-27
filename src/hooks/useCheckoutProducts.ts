import { useCallback, useEffect, useState } from "react";
import type { CheckoutProduct } from "@/types/checkout";
import { listCheckoutProducts } from "@/services/checkoutService";
import { isPlanExpiredApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";

export function useCheckoutProducts() {
  const [products, setProducts] = useState<CheckoutProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listCheckoutProducts();
      setProducts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (isPlanExpiredApiError(err)) {
        setError(null);
        return;
      }
      const uiError = resolveUiError(err, "Erro ao carregar produtos");
      setError(uiError.message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}
