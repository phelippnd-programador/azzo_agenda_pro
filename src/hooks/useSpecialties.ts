import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { specialtiesApi, isPlanExpiredApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
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
      const uiError = resolveUiError(err, "Erro ao carregar especialidades");
      setSpecialties([]);
      setError(uiError.message);
      toast.error(uiError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const createSpecialty = async (input: { name: string; description?: string }) => {
    const name = input.name.trim();
    const description = input.description?.trim() || undefined;
    if (!name) {
      throw new Error("Nome da especialidade obrigatorio");
    }

    try {
      const created = await specialtiesApi.create({ name, description });
      setSpecialties((prev) => [...prev, created]);
      toast.success("Especialidade criada com sucesso!");
      return created;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao criar especialidade").message);
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
        toast.error(resolveUiError(err, "Erro ao remover especialidade").message);
      }
      throw err;
    }
  };

  const updateSpecialty = async (
    id: string,
    input: { name: string; description?: string }
  ) => {
    const name = input.name.trim();
    const description = input.description?.trim() || undefined;
    if (!name) {
      throw new Error("Nome da especialidade obrigatorio");
    }

    try {
      const updated = await specialtiesApi.update(id, { name, description });
      setSpecialties((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      toast.success("Especialidade atualizada com sucesso!");
      return updated;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao atualizar especialidade").message);
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
    updateSpecialty,
    deleteSpecialty,
  };
}
