import { request } from "./core";
import type {
  ReactivationConfig,
  ReactivationCycleFilters,
  ReactivationCyclesPagedResponse,
  OptOutPagedResponse,
  ReactivationMetrics,
} from "@/types/reactivation";

export const reactivationApi = {
  getConfig: () =>
    request<ReactivationConfig>("/reactivation/config"),

  updateConfig: (config: ReactivationConfig) =>
    request<void>("/reactivation/config", {
      method: "PUT",
      body: JSON.stringify(config),
    }),

  getCycles: (filters?: ReactivationCycleFilters) => {
    const query = new URLSearchParams();
    if (filters?.status) query.set("status", filters.status);
    if (filters?.from) query.set("from", filters.from);
    if (filters?.to) query.set("to", filters.to);
    if (filters?.page !== undefined) query.set("page", String(filters.page));
    if (filters?.size !== undefined) query.set("size", String(filters.size));
    const qs = query.toString();
    return request<ReactivationCyclesPagedResponse>(
      `/reactivation/cycles${qs ? `?${qs}` : ""}`
    );
  },

  cancelCycle: (id: string) =>
    request<void>(`/reactivation/cycles/${id}/cancel`, {
      method: "POST",
    }),

  getOptOuts: (page = 0, size = 20) => {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    return request<OptOutPagedResponse>(`/reactivation/opt-outs?${query.toString()}`);
  },

  getMetrics: (period?: string) => {
    const query = period ? `?period=${encodeURIComponent(period)}` : "";
    return request<ReactivationMetrics>(`/reactivation/metrics${query}`);
  },

  optOutCustomer: (clientId: string) =>
    request<void>(`/reactivation/opt-out/${clientId}`, {
      method: "POST",
    }),

  optInCustomer: (clientId: string) =>
    request<void>(`/reactivation/opt-in/${clientId}`, {
      method: "POST",
    }),
};
