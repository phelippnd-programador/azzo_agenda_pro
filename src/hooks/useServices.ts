import { useState, useEffect, useCallback } from "react";
import { servicesApi, type Service, isPlanExpiredApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await servicesApi.getAll({ page: 1, limit: 100 });
      setServices(Array.isArray(data) ? data : data.items || []);
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
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const createService = async (data: Omit<Service, "id" | "createdAt">) => {
    try {
      const newService = await servicesApi.create(data);
      setServices((prev) => [...prev, newService]);
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
      setServices((prev) => prev.map((service) => (service.id === id ? updated : service)));
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
      setServices((prev) => prev.filter((service) => service.id !== id));
      toast.success("Servico excluido com sucesso!");
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao excluir servico").message);
      }
      throw err;
    }
  };

  return {
    services,
    isLoading,
    error,
    refetch: fetchServices,
    createService,
    updateService,
    deleteService,
  };
}
