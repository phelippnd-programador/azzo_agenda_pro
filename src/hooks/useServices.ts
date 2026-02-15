import { useState, useEffect, useCallback } from 'react';
import { servicesApi, Service } from '@/lib/api';
import { toast } from 'sonner';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await servicesApi.getAll();
      setServices(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar serviços');
      toast.error('Erro ao carregar serviços');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const createService = async (data: Omit<Service, 'id' | 'createdAt'>) => {
    try {
      const newService = await servicesApi.create(data);
      setServices(prev => [...prev, newService]);
      toast.success('Serviço criado com sucesso!');
      return newService;
    } catch (err) {
      toast.error('Erro ao criar serviço');
      throw err;
    }
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    try {
      const updated = await servicesApi.update(id, data);
      setServices(prev => prev.map(s => s.id === id ? updated : s));
      toast.success('Serviço atualizado com sucesso!');
      return updated;
    } catch (err) {
      toast.error('Erro ao atualizar serviço');
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    try {
      await servicesApi.delete(id);
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success('Serviço excluído com sucesso!');
    } catch (err) {
      toast.error('Erro ao excluir serviço');
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