import { useState, useCallback, useEffect } from "react";
import { professionalsApi, isPlanExpiredApiError, type Professional, type ProfessionalLimits } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { useResourceList } from "@/hooks/useResourceList";
import { toast } from "sonner";

type UseProfessionalsOptions = {
  fetchLimits?: boolean;
};

export function useProfessionals(options?: UseProfessionalsOptions) {
  const shouldFetchLimits = options?.fetchLimits ?? false;

  const fetchFn = useCallback(
    (params: { page: number; limit: number }) => professionalsApi.getAll(params),
    [],
  );

  const { items: professionals, pagination, isLoading, error, refetch, goToPage, _fetch } =
    useResourceList<Professional>(fetchFn, "Erro ao carregar profissionais");

  // ─── Limits (feature separada da lista) ──────────────────────────────────────
  const [professionalLimits, setProfessionalLimits] = useState<ProfessionalLimits | null>(null);
  const [isLimitsLoading, setIsLimitsLoading] = useState(shouldFetchLimits);

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
      if (!isPlanExpiredApiError(err)) setProfessionalLimits(null);
    } finally {
      setIsLimitsLoading(false);
    }
  }, [shouldFetchLimits]);

  useEffect(() => {
    if (shouldFetchLimits) fetchProfessionalLimits();
    else setIsLimitsLoading(false);
  }, [shouldFetchLimits, fetchProfessionalLimits]);

  // ─── Mutações ─────────────────────────────────────────────────────────────────

  const createProfessional = async (data: Partial<Professional>) => {
    try {
      const result = await professionalsApi.create(data);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      await fetchProfessionalLimits();
      toast.success("Profissional adicionado com sucesso!");
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao adicionar profissional").message);
      throw err;
    }
  };

  const updateProfessional = async (id: string, data: Partial<Professional>) => {
    try {
      const result = await professionalsApi.update(id, data);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success("Profissional atualizado com sucesso!");
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao atualizar profissional").message);
      throw err;
    }
  };

  const deleteProfessional = async (id: string) => {
    try {
      await professionalsApi.delete(id);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      await fetchProfessionalLimits();
      toast.success("Profissional removido com sucesso!");
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao remover profissional").message);
      throw err;
    }
  };

  const resetProfessionalPassword = async (id: string) => {
    try {
      const response = await professionalsApi.resetPassword(id);
      toast.success(response.message || "Senha temporária gerada e enviada");
      return response;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao resetar senha do profissional").message);
      throw err;
    }
  };

  return {
    professionals,
    professionalLimits,
    pagination,
    isLoading,
    isLimitsLoading,
    error,
    refetch,
    goToPage,
    refetchProfessionalLimits: fetchProfessionalLimits,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    resetProfessionalPassword,
  };
}
