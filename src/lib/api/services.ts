import type { Service } from "@/types";
import type { ListQueryParams, ListResponse } from "./contracts";
import { buildListQuery, request } from "./core";

export const servicesApi = {
  getAll: (params?: ListQueryParams) => {
    const query = buildListQuery(params);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<Service>>(`/services${suffix}`);
  },
  create: (data: Partial<Service>) =>
    request<Service>("/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Service>) =>
    request<Service>(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/services/${id}`, {
      method: "DELETE",
    }),
  removeSelected: (ids: string[]) =>
    request<{ removedCount: number }>("/services/remove-selected", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
  removeAll: () =>
    request<{ removedCount: number }>("/services/remove-all", {
      method: "POST",
    }),
};
