import { useState, useEffect, useCallback } from "react";
import { servicesApi, type Service, isPlanExpiredApiError } from "@/lib/api";
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

type UseServicesOptions = {
  enabled?: boolean;
};

export function useServices(options?: UseServicesOptions) {
  const enabled = options?.enabled ?? true;
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    total: 0,
    hasMore: false,
  });

  const fetchServices = useCallback(async (options?: { page?: number; limit?: number }) => {
    if (!enabled) return;
    const page = options?.page ?? DEFAULT_PAGE;
    const limit = options?.limit ?? DEFAULT_LIMIT;
    try {
      setIsLoading(true);
      const data = await servicesApi.getAll({ page, limit });
      if (Array.isArray(data)) {
        setServices(data);
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
        setServices(items);
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
      const uiError = resolveUiError(err, "Erro ao carregar servicos");
      setError(uiError.message);
      toast.error(uiError.message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setServices([]);
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
    fetchServices({ page: DEFAULT_PAGE, limit: DEFAULT_LIMIT });
  }, [enabled, fetchServices]);

  const createService = async (data: Omit<Service, "id" | "createdAt">) => {
    try {
      const newService = await servicesApi.create(data);
      await fetchServices({ page: pagination.page, limit: pagination.limit });
      toast.success("Servico criado com sucesso!");
      return newService;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao criar servico").message);
      }
      throw err;
    }
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    try {
      const updated = await servicesApi.update(id, data);
      await fetchServices({ page: pagination.page, limit: pagination.limit });
      toast.success("Servico atualizado com sucesso!");
      return updated;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao atualizar servico").message);
      }
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    try {
      await servicesApi.delete(id);
      await fetchServices({ page: pagination.page, limit: pagination.limit });
      toast.success("Servico excluido com sucesso!");
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao excluir servico").message);
      }
      throw err;
    }
  };

  const goToPage = async (page: number) => {
    if (page < 1) return;
    await fetchServices({ page, limit: pagination.limit });
  };

  return {
    services,
    pagination,
    isLoading,
    error,
    refetch: () => fetchServices({ page: pagination.page, limit: pagination.limit }),
    goToPage,
    createService,
    updateService,
    deleteService,
  };
}
