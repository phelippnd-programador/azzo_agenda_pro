import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardMetrics {
  todayAppointments: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  pendingAppointments: number;
  completedToday: number;
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayAppointments: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalClients: 0,
    pendingAppointments: 0,
    completedToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await dashboardApi.getMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar métricas');
      toast.error('Erro ao carregar métricas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}