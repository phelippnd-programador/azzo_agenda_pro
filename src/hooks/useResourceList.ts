import { useState, useEffect, useCallback, useRef } from "react";
import { isPlanExpiredApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PaginationState = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

type PaginatedResponse<T> = {
  items?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
};

type FetchParams = { page: number; limit: number };

export type FetchFn<T> = (params: FetchParams) => Promise<T[] | PaginatedResponse<T>>;

export type UseResourceListOptions = {
  /** Desativa o fetch automático. Útil para catalogs carregados sob demanda. */
  enabled?: boolean;
  defaultLimit?: number;
};

export type ResourceListResult<T> = {
  items: T[];
  pagination: PaginationState;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  /** Exposto para os hooks de domínio chamarem após mutações (create/update/delete). */
  _fetch: (opts?: { page?: number; limit?: number }) => Promise<void>;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook genérico para listas paginadas com fetch, loading, erro e paginação.
 *
 * Eliminamos a duplicação entre useClients, useServices, useAppointments e
 * useProfessionals — todos seguiam o mesmo padrão, só mudava a entidade.
 *
 * @param fetchFn   Função estável (useCallback) que chama a API.
 * @param errorLabel Texto de fallback para o toast de erro. Ex: "Erro ao carregar clientes"
 * @param options   { enabled, defaultLimit }
 */
export function useResourceList<T>(
  fetchFn: FetchFn<T>,
  errorLabel: string,
  options?: UseResourceListOptions,
): ResourceListResult<T> {
  const enabled = options?.enabled ?? true;
  const defaultLimit = options?.defaultLimit ?? DEFAULT_LIMIT;

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: DEFAULT_PAGE,
    limit: defaultLimit,
    total: 0,
    hasMore: false,
  });

  // Ref para evitar setState em componente desmontado
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const _fetch = useCallback(
    async (opts?: { page?: number; limit?: number }) => {
      if (!enabled) return;

      const page = opts?.page ?? DEFAULT_PAGE;
      const limit = opts?.limit ?? defaultLimit;

      try {
        setIsLoading(true);
        const data = await fetchFn({ page, limit });

        if (!mountedRef.current) return;

        if (Array.isArray(data)) {
          setItems(data);
          setPagination({ page, limit, total: data.length, hasMore: false });
        } else {
          const fetched = data.items ?? [];
          const total = data.total ?? fetched.length;
          setItems(fetched);
          setPagination({
            page: data.page ?? page,
            limit: data.pageSize ?? limit,
            total,
            hasMore: data.hasMore ?? page * limit < total,
          });
        }
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        if (isPlanExpiredApiError(err)) {
          setError(null);
          return;
        }
        const msg = resolveUiError(err, errorLabel).message;
        setError(msg);
        toast.error(msg);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    // fetchFn deve ser estável (useCallback no consumidor) para não re-executar infinitamente
    [enabled, defaultLimit, fetchFn, errorLabel],
  );

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setPagination({ page: DEFAULT_PAGE, limit: defaultLimit, total: 0, hasMore: false });
      setIsLoading(false);
      setError(null);
      return;
    }
    _fetch({ page: DEFAULT_PAGE, limit: defaultLimit });
  }, [enabled, defaultLimit, _fetch]);

  const refetch = useCallback(
    () => _fetch({ page: pagination.page, limit: pagination.limit }),
    [_fetch, pagination.page, pagination.limit],
  );

  const goToPage = useCallback(
    async (page: number) => {
      if (page < 1) return;
      await _fetch({ page, limit: pagination.limit });
    },
    [_fetch, pagination.limit],
  );

  return { items, pagination, isLoading, error, refetch, goToPage, _fetch };
}
