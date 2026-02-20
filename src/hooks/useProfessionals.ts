import { useState, useEffect, useCallback } from 'react';
import { professionalsApi, Professional, ProfessionalLimits } from '@/lib/api';
import { toast } from 'sonner';

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionalLimits, setProfessionalLimits] = useState<ProfessionalLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLimitsLoading, setIsLimitsLoading] = useState(true);
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

  const fetchProfessionalLimits = useCallback(async () => {
    try {
      setIsLimitsLoading(true);
      const data = await professionalsApi.getLimits();
      setProfessionalLimits(data);
    } catch {
      setProfessionalLimits(null);
    } finally {
      setIsLimitsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessionals();
    fetchProfessionalLimits();
  }, [fetchProfessionals, fetchProfessionalLimits]);

  const createProfessional = async (data: Omit<Professional, 'id' | 'createdAt'>) => {
    try {
      const newProfessional = await professionalsApi.create(data);
      setProfessionals(prev => [...prev, newProfessional]);
      await fetchProfessionalLimits();
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
      await fetchProfessionalLimits();
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
