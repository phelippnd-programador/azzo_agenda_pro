import type { Specialty } from "@/types";
import type {
  SpecialtyImportErrorLine,
  SpecialtyImportJob,
  SpecialtyImportMode,
  SpecialtyImportTemplateFormat,
} from "@/types/specialty-import";
import { request, requestBlob } from "./core";

export const specialtiesApi = {
  getAll: () => request<Specialty[]>("/specialties"),
  create: (data: { name: string; description?: string | null }) =>
    request<Specialty>("/specialties", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name: string; description?: string | null }) =>
    request<Specialty>(`/specialties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/specialties/${id}`, {
      method: "DELETE",
    }),
  removeSelected: (ids: string[]) =>
    request<{ removedCount: number }>("/specialties/remove-selected", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
  removeAll: () =>
    request<{ removedCount: number }>("/specialties/remove-all", {
      method: "POST",
    }),
};

export const specialtyImportApi = {
  listImportJobs: () => request<SpecialtyImportJob[]>("/specialties/importacoes"),
  downloadImportTemplate: (params?: { formato?: SpecialtyImportTemplateFormat }) => {
    const query = new URLSearchParams();
    query.set("formato", params?.formato ?? "xlsx");
    return requestBlob(`/specialties/importacoes/modelo?${query.toString()}`);
  },
  createImportJob: (params: { arquivo: File; modoImportacao: SpecialtyImportMode; dryRun?: boolean }) => {
    const formData = new FormData();
    formData.append("arquivo", params.arquivo);
    formData.append("modoImportacao", params.modoImportacao);
    if (typeof params.dryRun === "boolean") formData.append("dryRun", String(params.dryRun));
    return request<SpecialtyImportJob>("/specialties/importacoes", {
      method: "POST",
      body: formData,
    });
  },
  getImportJobById: (jobId: string) =>
    request<SpecialtyImportJob>(`/specialties/importacoes/${jobId}`),
  getImportErrors: (jobId: string) =>
    request<SpecialtyImportErrorLine[]>(`/specialties/importacoes/${jobId}/erros`),
  cancelImportJob: (jobId: string) =>
    request<SpecialtyImportJob>(`/specialties/importacoes/${jobId}/cancelar`, {
      method: "POST",
    }),
};
