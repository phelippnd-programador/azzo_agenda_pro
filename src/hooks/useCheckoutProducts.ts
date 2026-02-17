import { useCallback, useEffect, useState } from "react";
import type { CheckoutProduct } from "@/types/checkout";
import { listCheckoutProducts } from "@/services/checkoutService";

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
      const message =
        err instanceof Error ? err.message : "Erro ao carregar produtos";
      setError(message);
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
