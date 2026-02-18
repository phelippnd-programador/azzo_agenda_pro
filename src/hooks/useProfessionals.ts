import { useState, useEffect, useCallback } from 'react';
import { professionalsApi, Professional } from '@/lib/api';
import { toast } from 'sonner';

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await professionalsApi.getAll();
      setProfessionals(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar profissionais');
      toast.error('Erro ao carregar profissionais');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const createProfessional = async (data: Omit<Professional, 'id' | 'createdAt'>) => {
    try {
      const newProfessional = await professionalsApi.create(data);
      setProfessionals(prev => [...prev, newProfessional]);
      toast.success('Profissional adicionado com sucesso!');
      return newProfessional;
    } catch (err) {
      toast.error('Erro ao adicionar profissional');
      throw err;
    }
  };

  const updateProfessional = async (id: string, data: Partial<Professional>) => {
    try {
      const updated = await professionalsApi.update(id, data);
      setProfessionals(prev => prev.map(p => p.id === id ? updated : p));
      toast.success('Profissional atualizado com sucesso!');
      return updated;
    } catch (err) {
      toast.error('Erro ao atualizar profissional');
      throw err;
    }
  };

  const deleteProfessional = async (id: string) => {
    try {
      await professionalsApi.delete(id);
      setProfessionals(prev => prev.filter(p => p.id !== id));
      toast.success('Profissional removido com sucesso!');
    } catch (err) {
      toast.error('Erro ao remover profissional');
      throw err;
    }
  };

  const resetProfessionalPassword = async (id: string) => {
    try {
      const response = await professionalsApi.resetPassword(id);
      toast.success(response.message || 'Senha temporaria gerada e enviada');
      return response;
    } catch (err) {
      toast.error('Erro ao resetar senha do profissional');
      throw err;
    }
  };

  return {
    professionals,
    isLoading,
    error,
    refetch: fetchProfessionals,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    resetProfessionalPassword,
  };
}
