import { useState, useEffect, useCallback } from "react";
import { clientsApi, type Client, isPlanExpiredApiError } from "@/lib/api";
import { toast } from "sonner";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await clientsApi.getAll();
      setClients(data);
      setError(null);
    } catch (err) {
      if (isPlanExpiredApiError(err)) {
        setError(null);
        return;
      }
      setError("Erro ao carregar clientes");
      toast.error("Erro ao carregar clientes");
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
        toast.error("Erro ao cadastrar cliente");
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
        toast.error("Erro ao atualizar cliente");
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
        toast.error("Erro ao excluir cliente");
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
