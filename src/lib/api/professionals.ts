import type { Professional } from "@/types";
import type { ListQueryParams, ListResponse, ProfessionalLimits } from "./contracts";
import { buildListQuery, request } from "./core";

export const professionalsApi = {
  getAll: (params?: ListQueryParams) => {
    const query = buildListQuery(params);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<Professional>>(`/professionals${suffix}`);
  },
  getById: (id: string) => request<Professional>(`/professionals/${id}`),
  getLimits: () => request<ProfessionalLimits>("/professionals/limits"),
  create: (data: Partial<Professional>) =>
    request<Professional>("/professionals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Professional>) =>
    request<Professional>(`/professionals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/professionals/${id}`, {
      method: "DELETE",
    }),
  resetPassword: (id: string) =>
    request<{
      professionalId: string;
      userId: string;
      email: string;
      message: string;
    }>(`/professionals/${id}/reset-password`, {
      method: "POST",
    }),
};
