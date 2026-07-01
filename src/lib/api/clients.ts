import type { Client, ClientAppointmentHistoryResponse } from "@/types";
import type { ClientsPagedApiResponse, ListQueryParams, ListResponse } from "./contracts";
import { request } from "./core";

export const clientsApi = {
  getAll: (params?: ListQueryParams) => {
    const page = typeof params?.page === "number" && params.page > 0 ? params.page : 1;
    const size = typeof params?.limit === "number" && params.limit > 0 ? params.limit : undefined;
    const query = new URLSearchParams();
    query.set("page", String(page - 1));
    if (size) {
      query.set("size", String(size));
    }
    if (typeof params?.search === "string" && params.search.trim()) {
      query.set("search", params.search.trim());
    }

    return request<ClientsPagedApiResponse>(`/clients/paged?${query.toString()}`).then((response) => {
      const items = response.items ?? [];
      const totalCount = response.totalCount ?? items.length;
      const currentPage = (response.currentPage ?? 0) + 1;
      const pageSize = size ?? (items.length > 0 ? items.length : 20);
      const totalPages =
        response.totalPages ??
        (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0);

      return {
        items,
        total: totalCount,
        page: currentPage,
        pageSize,
        hasMore: currentPage < totalPages,
      } satisfies ListResponse<Client>;
    });
  },
  getById: (id: string) => request<Client>(`/clients/${id}`),
  getAppointmentHistory: (
    id: string,
    page = 0,
    size = 20,
    filters?: {
      from?: string;
      to?: string;
      serviceId?: string;
    }
  ) => {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (filters?.from) query.set("from", filters.from);
    if (filters?.to) query.set("to", filters.to);
    if (filters?.serviceId) query.set("serviceId", filters.serviceId);
    return request<ClientAppointmentHistoryResponse>(
      `/clients/${id}/appointment-history?${query.toString()}`
    );
  },
  create: (data: Partial<Client>) =>
    request<Client>("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Client>) =>
    request<Client>(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<Client>(`/clients/${id}/avatar`, {
      method: "POST",
      body: formData,
    });
  },
  removeAvatar: (id: string) =>
    request<Client>(`/clients/${id}/avatar`, {
      method: "DELETE",
    }),
  delete: (id: string) =>
    request<void>(`/clients/${id}`, {
      method: "DELETE",
    }),
};
