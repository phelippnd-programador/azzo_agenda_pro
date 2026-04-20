import { useCallback } from "react";
import { servicesApi, isPlanExpiredApiError, type Service } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { useResourceList, type UseResourceListOptions } from "@/hooks/useResourceList";
import { toast } from "sonner";

export function useServices(options?: UseResourceListOptions) {
  const fetchFn = useCallback(
    (params: { page: number; limit: number }) => servicesApi.getAll(params),
    [],
  );

  const { items: services, pagination, isLoading, error, refetch, goToPage, _fetch } =
    useResourceList<Service>(fetchFn, "Erro ao carregar serviços", options);

  const createService = async (data: Omit<Service, "id" | "createdAt">) => {
    try {
      const result = await servicesApi.create(data);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success("Serviço criado com sucesso!");
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao criar serviço").message);
      throw err;
    }
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    try {
      const result = await servicesApi.update(id, data);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success("Serviço atualizado com sucesso!");
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao atualizar serviço").message);
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    try {
      await servicesApi.delete(id);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success("Serviço excluído com sucesso!");
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao excluir serviço").message);
      throw err;
    }
  };

  const deleteSelectedServices = async (ids: string[]) => {
    try {
      const result = await servicesApi.removeSelected(ids);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success(`${result.removedCount} servico(s) removido(s) com sucesso!`);
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao remover servicos selecionados").message);
      throw err;
    }
  };

  const deleteAllServices = async () => {
    try {
      const result = await servicesApi.removeAll();
      await _fetch({ page: 1, limit: pagination.limit });
      toast.success(`${result.removedCount} servico(s) removido(s) com sucesso!`);
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao remover todos os servicos").message);
      throw err;
    }
  };

  return {
    services,
    pagination,
    isLoading,
    error,
    refetch,
    goToPage,
    createService,
    updateService,
    deleteService,
    deleteSelectedServices,
    deleteAllServices,
  };
}
