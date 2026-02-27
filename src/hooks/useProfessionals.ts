import { useState, useEffect, useCallback } from "react";
import {
  professionalsApi,
  type Professional,
  type ProfessionalLimits,
  isPlanExpiredApiError,
} from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionalLimits, setProfessionalLimits] = useState<ProfessionalLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLimitsLoading, setIsLimitsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await professionalsApi.getAll({ page: 1, limit: 100 });
      setProfessionals(Array.isArray(data) ? data : data.items || []);
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
  }, []);

  useEffect(() => {
    fetchProfessionals();
    fetchProfessionalLimits();
  }, [fetchProfessionals, fetchProfessionalLimits]);

  const createProfessional = async (data: Partial<Professional>) => {
    try {
      const newProfessional = await professionalsApi.create(data);
      setProfessionals((prev) => [...prev, newProfessional]);
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
      setProfessionals((prev) => prev.map((p) => (p.id === id ? updated : p)));
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
      setProfessionals((prev) => prev.filter((p) => p.id !== id));
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

  return {
    professionals,
    professionalLimits,
    isLoading,
    isLimitsLoading,
    error,
    refetch: fetchProfessionals,
    refetchProfessionalLimits: fetchProfessionalLimits,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    resetProfessionalPassword,
  };
}
