import { useState, useEffect, useCallback } from "react";
import { clientsApi, type Client, isPlanExpiredApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await clientsApi.getAll({ page: 1, limit: 100 });
      setClients(Array.isArray(data) ? data : data.items || []);
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
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (data: Omit<Client, "id" | "createdAt" | "totalVisits" | "totalSpent">) => {
    try {
      const newClient = await clientsApi.create(data);
      setClients((prev) => [...prev, newClient]);
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
      setClients((prev) => prev.map((client) => (client.id === id ? updated : client)));
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
      setClients((prev) => prev.filter((client) => client.id !== id));
      toast.success("Cliente excluido com sucesso!");
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao excluir cliente").message);
      }
      throw err;
    }
  };

  return {
    clients,
    isLoading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}
