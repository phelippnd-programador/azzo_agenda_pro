import type {
  CommercialOverview,
  EmailTemplateDetailResponse,
  EmailTemplateListResponse,
  EmailTemplatePreviewResponse,
  EmailTemplateStatusUpdateRequest,
  EmailTemplateUpsertRequest,
  GlobalAuditDetail,
  GlobalAuditListResponse,
  GlobalSuggestionListResponse,
  RevokeSessionsResponse,
  SessionListResponse,
  SuggestionUpdateRequest,
  SystemPlanItem,
  SystemPlanListResponse,
  SystemPlanUpsertRequest,
} from "@/types/system-admin";
import { request } from "./core";

export const systemAdminApi = {
  getCommercialOverview: () => request<CommercialOverview>("/admin/system/commercial/overview"),
  listPlans: () => request<SystemPlanListResponse>("/admin/system/plans"),
  createPlan: (payload: SystemPlanUpsertRequest) =>
    request<SystemPlanItem>("/admin/system/plans", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePlan: (id: string, payload: SystemPlanUpsertRequest) =>
    request<SystemPlanItem>(`/admin/system/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updatePlanActive: (id: string, active: boolean) =>
    request<SystemPlanItem>(`/admin/system/plans/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  getGlobalAudits: (params?: {
    from?: string;
    to?: string;
    tenantId?: string;
    module?: string;
    action?: string;
    status?: string;
    sourceChannel?: string;
    entityType?: string;
    actorUserId?: string;
    requestId?: string;
    text?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.tenantId) query.set("tenantId", params.tenantId);
    if (params?.module) query.set("module", params.module);
    if (params?.action) query.set("action", params.action);
    if (params?.status) query.set("status", params.status);
    if (params?.sourceChannel) query.set("sourceChannel", params.sourceChannel);
    if (params?.entityType) query.set("entityType", params.entityType);
    if (params?.actorUserId) query.set("actorUserId", params.actorUserId);
    if (params?.requestId) query.set("requestId", params.requestId);
    if (params?.text) query.set("text", params.text);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<GlobalAuditListResponse>(`/admin/system/audits${suffix}`);
  },
  getGlobalAuditDetail: (id: string) => request<GlobalAuditDetail>(`/admin/system/audits/${id}`),
  revokeSessions: (payload: { tenantId?: string; userId?: string }) =>
    request<RevokeSessionsResponse>("/admin/system/sessions/revoke", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listSessions: (params?: { tenantId?: string; includeRevoked?: boolean; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.tenantId) query.set("tenantId", params.tenantId);
    if (params?.includeRevoked !== undefined) {
      query.set("includeRevoked", String(params.includeRevoked));
    }
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<SessionListResponse>(`/admin/system/sessions${suffix}`);
  },
  revokeSessionToken: (payload: { refreshTokenId: string; tenantId?: string }) =>
    request<RevokeSessionsResponse>("/admin/system/sessions/revoke-token", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getGlobalSuggestions: (params?: {
    tenantId?: string;
    status?: string;
    category?: string;
    text?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.tenantId) query.set("tenantId", params.tenantId);
    if (params?.status) query.set("status", params.status);
    if (params?.category) query.set("category", params.category);
    if (params?.text) query.set("text", params.text);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<GlobalSuggestionListResponse>(`/admin/system/suggestions${suffix}`);
  },
  getGlobalSuggestionDetail: (id: string) =>
    request<GlobalSuggestionListResponse["items"][number]>(`/admin/system/suggestions/${id}`),
  updateGlobalSuggestion: (id: string, payload: SuggestionUpdateRequest) =>
    request<GlobalSuggestionListResponse["items"][number]>(`/admin/system/suggestions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  listEmailTemplates: () => request<EmailTemplateListResponse>("/admin/system/email-templates"),
  getEmailTemplate: (type: string) =>
    request<EmailTemplateDetailResponse>(`/admin/system/email-templates/${type}`),
  updateEmailTemplate: (type: string, payload: EmailTemplateUpsertRequest) =>
    request<EmailTemplateDetailResponse>(`/admin/system/email-templates/${type}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  previewEmailTemplate: (type: string, payload: EmailTemplateUpsertRequest) =>
    request<EmailTemplatePreviewResponse>(`/admin/system/email-templates/${type}/preview`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  restoreDefaultEmailTemplate: (type: string) =>
    request<EmailTemplateDetailResponse>(`/admin/system/email-templates/${type}/restore-default`, {
      method: "POST",
    }),
  updateEmailTemplateStatus: (type: string, payload: EmailTemplateStatusUpdateRequest) =>
    request<EmailTemplateDetailResponse>(`/admin/system/email-templates/${type}/active`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
