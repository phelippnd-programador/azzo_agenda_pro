import type {
  AuditEventDetailDto,
  AuditExportRequestDto,
  AuditExportResponseDto,
  AuditFiltersOptionsDto,
  AuditRetentionListResponseDto,
  AuditRetentionQueryDto,
  AuditSearchQueryDto,
  AuditSearchResponseDto,
} from "@/types/auditoria";
import { request } from "./core";

const appendMultiValues = (query: URLSearchParams, key: string, values?: string[]) => {
  if (!values?.length) return;
  values.forEach((value) => {
    if (value?.trim()) query.append(key, value.trim());
  });
};

const buildAuditoriaSearchQuery = (filters: AuditSearchQueryDto) => {
  const query = new URLSearchParams();
  query.set("from", filters.from);
  query.set("to", filters.to);
  appendMultiValues(query, "modules", filters.modules);
  appendMultiValues(query, "actions", filters.actions);
  appendMultiValues(query, "statuses", filters.statuses);
  appendMultiValues(query, "entityTypes", filters.entityTypes);
  appendMultiValues(query, "actorUserIds", filters.actorUserIds);
  appendMultiValues(query, "sourceChannels", filters.sourceChannels);
  if (filters.entityId?.trim()) query.set("entityId", filters.entityId.trim());
  if (filters.requestId?.trim()) query.set("requestId", filters.requestId.trim());
  if (filters.ip?.trim()) query.set("ip", filters.ip.trim());
  if (filters.text?.trim()) query.set("text", filters.text.trim());
  if (typeof filters.hasChanges === "boolean") query.set("hasChanges", String(filters.hasChanges));
  if (filters.cursor?.trim()) query.set("cursor", filters.cursor.trim());
  if (filters.limit) query.set("limit", String(filters.limit));
  if (filters.sortBy) query.set("sortBy", filters.sortBy);
  if (filters.sortDir) query.set("sortDir", filters.sortDir);
  return query;
};

export const auditoriaApi = {
  listEvents: (filters: AuditSearchQueryDto) =>
    request<AuditSearchResponseDto>(`/auditoria/events?${buildAuditoriaSearchQuery(filters)}`),
  getEventDetail: (id: string) => request<AuditEventDetailDto>(`/auditoria/events/${id}`),
  exportEvents: (payload: AuditExportRequestDto) =>
    request<AuditExportResponseDto>("/auditoria/events/export", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getFilterOptions: (from?: string, to?: string) => {
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<AuditFiltersOptionsDto>(`/auditoria/filters/options${suffix}`);
  },
  listRetentionEvents: (filters: AuditRetentionQueryDto) => {
    const query = new URLSearchParams({
      from: filters.from,
      to: filters.to,
    });
    if (filters.policyVersion?.trim()) query.set("policyVersion", filters.policyVersion.trim());
    if (filters.executionId?.trim()) query.set("executionId", filters.executionId.trim());
    if (filters.cursor?.trim()) query.set("cursor", filters.cursor.trim());
    if (filters.limit) query.set("limit", String(filters.limit));
    return request<AuditRetentionListResponseDto>(
      `/auditoria/retention/events?${query.toString()}`
    );
  },
};
