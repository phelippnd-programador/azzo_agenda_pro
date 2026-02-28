import { useState, useEffect, useCallback } from "react";
import { clientsApi, type Client, isPlanExpiredApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

type PaginationState = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

type UseClientsOptions = {
  enabled?: boolean;
};

export function useClients(options?: UseClientsOptions) {
  const enabled = options?.enabled ?? true;
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    total: 0,
    hasMore: false,
  });

  const fetchClients = useCallback(async (options?: { page?: number; limit?: number }) => {
    if (!enabled) return;
    const page = options?.page ?? DEFAULT_PAGE;
    const limit = options?.limit ?? DEFAULT_LIMIT;
    try {
      setIsLoading(true);
      const data = await clientsApi.getAll({ page, limit });
      if (Array.isArray(data)) {
        setClients(data);
        setPagination({
          page,
          limit,
          total: data.length,
          hasMore: false,
        });
      } else {
        const items = data.items || [];
        const total = data.total ?? items.length;
        const hasMore = data.hasMore ?? page * limit < total;
        setClients(items);
        setPagination({
          page: data.page ?? page,
          limit: data.pageSize ?? limit,
          total,
          hasMore,
        });
      }
      setError(null);
    } catch (err) {
      if (isPlanExpiredApiError(err)) {
        setError(null);
        return;
      }
      const uiError = resolveUiError(err, "Erro ao carregar clientes");
      setError(uiError.message);
      toast.error(uiError.message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setClients([]);
      setPagination({
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        total: 0,
        hasMore: false,
      });
      setIsLoading(false);
      setError(null);
      return;
    }
    fetchClients({ page: DEFAULT_PAGE, limit: DEFAULT_LIMIT });
  }, [enabled, fetchClients]);

  const createClient = async (data: Omit<Client, "id" | "createdAt" | "totalVisits" | "totalSpent">) => {
    try {
      const newClient = await clientsApi.create(data);
      await fetchClients({ page: pagination.page, limit: pagination.limit });
      toast.success("Cliente cadastrado com sucesso!");
      return newClient;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao cadastrar cliente").message);
      }
      throw err;
    }
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    try {
      const updated = await clientsApi.update(id, data);
      await fetchClients({ page: pagination.page, limit: pagination.limit });
      toast.success("Cliente atualizado com sucesso!");
      return updated;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao atualizar cliente").message);
      }
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await clientsApi.delete(id);
      await fetchClients({ page: pagination.page, limit: pagination.limit });
      toast.success("Cliente excluido com sucesso!");
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao excluir cliente").message);
      }
      throw err;
    }
  };

  const goToPage = async (page: number) => {
    if (page < 1) return;
    await fetchClients({ page, limit: pagination.limit });
  };

  return {
    clients,
    pagination,
    isLoading,
    error,
    refetch: () => fetchClients({ page: pagination.page, limit: pagination.limit }),
    goToPage,
    createClient,
    updateClient,
    deleteClient,
  };
}
