import { useCallback } from "react";
import { clientsApi, isPlanExpiredApiError, type Client } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { useResourceList, type UseResourceListOptions } from "@/hooks/useResourceList";
import { toast } from "sonner";

export function useClients(options?: UseResourceListOptions) {
  const fetchFn = useCallback(
    (params: { page: number; limit: number }) => clientsApi.getAll(params),
    [],
  );

  const { items: clients, pagination, isLoading, error, refetch, goToPage, _fetch } =
    useResourceList<Client>(fetchFn, "Erro ao carregar clientes", options);

  const createClient = async (
    data: Omit<Client, "id" | "createdAt" | "totalVisits" | "totalSpent">,
  ) => {
    try {
      const result = await clientsApi.create(data);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success("Cliente cadastrado com sucesso!");
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao cadastrar cliente").message);
      throw err;
    }
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    try {
      const result = await clientsApi.update(id, data);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success("Cliente atualizado com sucesso!");
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao atualizar cliente").message);
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await clientsApi.delete(id);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success("Cliente excluído com sucesso!");
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao excluir cliente").message);
      throw err;
    }
  };

  return {
    clients,
    pagination,
    isLoading,
    error,
    refetch,
    goToPage,
    createClient,
    updateClient,
    deleteClient,
  };
}
