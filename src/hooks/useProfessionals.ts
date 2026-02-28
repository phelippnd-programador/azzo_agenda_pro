import { useState, useEffect, useCallback } from "react";
import {
  professionalsApi,
  type Professional,
  type ProfessionalLimits,
  isPlanExpiredApiError,
} from "@/lib/api";
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

type UseProfessionalsOptions = {
  fetchLimits?: boolean;
};

export function useProfessionals(options?: UseProfessionalsOptions) {
  const shouldFetchLimits = options?.fetchLimits ?? false;
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionalLimits, setProfessionalLimits] = useState<ProfessionalLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLimitsLoading, setIsLimitsLoading] = useState(shouldFetchLimits);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    total: 0,
    hasMore: false,
  });

  const fetchProfessionals = useCallback(async (options?: { page?: number; limit?: number }) => {
    const page = options?.page ?? DEFAULT_PAGE;
    const limit = options?.limit ?? DEFAULT_LIMIT;
    try {
      setIsLoading(true);
      const data = await professionalsApi.getAll({ page, limit });
      if (Array.isArray(data)) {
        setProfessionals(data);
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
        setProfessionals(items);
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
      const uiError = resolveUiError(err, "Erro ao carregar profissionais");
      setError(uiError.message);
      toast.error(uiError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProfessionalLimits = useCallback(async () => {
    if (!shouldFetchLimits) {
      setIsLimitsLoading(false);
      return;
    }

    try {
      setIsLimitsLoading(true);
      const data = await professionalsApi.getLimits();
      setProfessionalLimits(data);
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        setProfessionalLimits(null);
      }
    } finally {
      setIsLimitsLoading(false);
    }
  }, [shouldFetchLimits]);

  useEffect(() => {
    fetchProfessionals({ page: DEFAULT_PAGE, limit: DEFAULT_LIMIT });
    if (shouldFetchLimits) {
      fetchProfessionalLimits();
    } else {
      setIsLimitsLoading(false);
    }
  }, [fetchProfessionals, fetchProfessionalLimits, shouldFetchLimits]);

  const createProfessional = async (data: Partial<Professional>) => {
    try {
      const newProfessional = await professionalsApi.create(data);
      await fetchProfessionals({ page: pagination.page, limit: pagination.limit });
      await fetchProfessionalLimits();
      toast.success("Profissional adicionado com sucesso!");
      return newProfessional;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao adicionar profissional").message);
      }
      throw err;
    }
  };

  const updateProfessional = async (id: string, data: Partial<Professional>) => {
    try {
      const updated = await professionalsApi.update(id, data);
      await fetchProfessionals({ page: pagination.page, limit: pagination.limit });
      toast.success("Profissional atualizado com sucesso!");
      return updated;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao atualizar profissional").message);
      }
      throw err;
    }
  };

  const deleteProfessional = async (id: string) => {
    try {
      await professionalsApi.delete(id);
      await fetchProfessionals({ page: pagination.page, limit: pagination.limit });
      await fetchProfessionalLimits();
      toast.success("Profissional removido com sucesso!");
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao remover profissional").message);
      }
      throw err;
    }
  };

  const resetProfessionalPassword = async (id: string) => {
    try {
      const response = await professionalsApi.resetPassword(id);
      toast.success(response.message || "Senha temporaria gerada e enviada");
      return response;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao resetar senha do profissional").message);
      }
      throw err;
    }
  };

  const goToPage = async (page: number) => {
    if (page < 1) return;
    await fetchProfessionals({ page, limit: pagination.limit });
  };

  return {
    professionals,
    professionalLimits,
    pagination,
    isLoading,
    isLimitsLoading,
    error,
    refetch: () => fetchProfessionals({ page: pagination.page, limit: pagination.limit }),
    goToPage,
    refetchProfessionalLimits: fetchProfessionalLimits,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    resetProfessionalPassword,
  };
}
