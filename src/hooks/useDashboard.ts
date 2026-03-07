import { useState, useEffect, useCallback } from "react";
import { dashboardApi, isPlanExpiredApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

interface DashboardMetrics {
  todayAppointments: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  todayAppointmentsGrowthPercent?: number | null;
  todayRevenueGrowthPercent?: number | null;
  totalClientsGrowthPercent?: number | null;
  monthlyRevenueGrowthPercent?: number | null;
  pendingAppointments: number;
  completedToday: number;
  notConcludedToday: number;
  stoppedAtServiceSelection: number;
  stoppedAtProfessionalSelection: number;
  stoppedAtTimeSelection: number;
  stoppedAtFinalReview: number;
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayAppointments: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalClients: 0,
    todayAppointmentsGrowthPercent: null,
    todayRevenueGrowthPercent: null,
    totalClientsGrowthPercent: null,
    monthlyRevenueGrowthPercent: null,
    pendingAppointments: 0,
    completedToday: 0,
    notConcludedToday: 0,
    stoppedAtServiceSelection: 0,
    stoppedAtProfessionalSelection: 0,
    stoppedAtTimeSelection: 0,
    stoppedAtFinalReview: 0,
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
      if (isPlanExpiredApiError(err)) {
        setError(null);
        return;
      }
      const uiError = resolveUiError(err, "Erro ao carregar metricas");
      setError(uiError.message);
      toast.error(uiError.message);
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

type UseDashboardOptions = {
  enabled?: boolean;
};

export function useDashboardWithOptions(options: UseDashboardOptions = {}) {
  const enabled = options.enabled ?? true;
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayAppointments: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalClients: 0,
    todayAppointmentsGrowthPercent: null,
    todayRevenueGrowthPercent: null,
    totalClientsGrowthPercent: null,
    monthlyRevenueGrowthPercent: null,
    pendingAppointments: 0,
    completedToday: 0,
    notConcludedToday: 0,
    stoppedAtServiceSelection: 0,
    stoppedAtProfessionalSelection: 0,
    stoppedAtTimeSelection: 0,
    stoppedAtFinalReview: 0,
  });
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      setError(null);
      return;
    }
    try {
      setIsLoading(true);
      const data = await dashboardApi.getMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      if (isPlanExpiredApiError(err)) {
        setError(null);
        return;
      }
      const uiError = resolveUiError(err, "Erro ao carregar metricas");
      setError(uiError.message);
      toast.error(uiError.message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setError(null);
      return;
    }
    fetchMetrics();
  }, [enabled, fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}
