import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { specialtiesApi, isPlanExpiredApiError } from "@/lib/api";
import type { Specialty } from "@/types";

export function useSpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialties = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await specialtiesApi.getAll();
      setSpecialties(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (isPlanExpiredApiError(err)) {
        setError(null);
        return;
      }
      setSpecialties([]);
      setError("Erro ao carregar especialidades");
      toast.error("Erro ao carregar especialidades");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const createSpecialty = async (name: string) => {
    const payload = name.trim();
    if (!payload) {
      throw new Error("Nome da especialidade obrigatorio");
    }

    try {
      const created = await specialtiesApi.create({ name: payload });
      setSpecialties((prev) => [...prev, created]);
      toast.success("Especialidade criada com sucesso!");
      return created;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error("Erro ao criar especialidade");
      }
      throw err;
    }
  };

  const deleteSpecialty = async (id: string) => {
    try {
      await specialtiesApi.delete(id);
      setSpecialties((prev) => prev.filter((item) => item.id !== id));
      toast.success("Especialidade removida com sucesso!");
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error("Erro ao remover especialidade");
      }
      throw err;
    }
  };

  return {
    specialties,
    isLoading,
    error,
    refetch: fetchSpecialties,
    createSpecialty,
    deleteSpecialty,
  };
}
