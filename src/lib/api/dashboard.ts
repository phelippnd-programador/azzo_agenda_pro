import type {
  DashboardCustomerRankingResponse,
  DashboardMetrics,
  DashboardNoShowInsightsResponse,
  DashboardWhatsAppReactivationQueueResponse,
  DashboardWhatsAppReactivationResponse,
} from "@/types";
import type {
  DashboardProfessionalMetricsResponse,
  DashboardServicesMetricsResponse,
} from "./contracts";
import { request } from "./core";

export const dashboardApi = {
  getMetrics: () => request<DashboardMetrics>("/dashboard/metrics"),
  getProfessionalMetrics: (start: string, end: string, professionalId: string) =>
    request<DashboardProfessionalMetricsResponse>(
      `/dashboard/metrics/professional?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&professionalId=${encodeURIComponent(professionalId)}`
    ),
  getServicesMetrics: (start: string, end: string, professionalId?: string) => {
    const query = new URLSearchParams({
      start,
      end,
    });
    if (professionalId) query.set("professionalId", professionalId);
    return request<DashboardServicesMetricsResponse>(
      `/dashboard/metrics/services?${query.toString()}`
    );
  },
  getWeeklyRevenue: (start: string, end: string) =>
    request<{
      points: Array<{ day: string; date: string; value: number }>;
      total: number;
      average: number;
    }>(`/dashboard/revenue/weekly?start=${start}&end=${end}`),
  getCustomerMetrics: (start: string, end: string, limit = 10) =>
    request<DashboardCustomerRankingResponse>(
      `/dashboard/metrics/customers?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=${encodeURIComponent(String(limit))}`
    ),
  getNoShowInsights: () =>
    request<DashboardNoShowInsightsResponse>("/dashboard/metrics/no-show"),
  getWhatsAppReactivationMetrics: (days = 30) =>
    request<DashboardWhatsAppReactivationResponse>(
      `/dashboard/metrics/whatsapp-reactivation?days=${encodeURIComponent(String(days))}`
    ),
  getWhatsAppReactivationQueue: (params?: { days?: number; status?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.days) query.set("days", String(params.days));
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<DashboardWhatsAppReactivationQueueResponse>(
      `/dashboard/metrics/whatsapp-reactivation/queue${suffix}`
    );
  },
};
