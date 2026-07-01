import type {
  CreateLgpdRequestPayload,
  LgpdRequestDetail,
  LgpdRequestItem,
  LgpdRequestStatus,
  UpdateLgpdRequestStatusPayload,
} from "@/types/lgpd";
import type {
  LegalDocumentResponse,
  LgpdContactResponse,
  PublicLegalResponse,
} from "@/types/terms";
import { request } from "./core";

export const publicLegalApi = {
  getAll: () => request<PublicLegalResponse>("/public/legal"),
  getTermsOfUse: () => request<LegalDocumentResponse>("/public/legal/terms-of-use"),
  getPrivacyPolicy: () => request<LegalDocumentResponse>("/public/legal/privacy-policy"),
  getContact: () => request<LgpdContactResponse>("/public/legal/contact"),
};

export const lgpdApi = {
  list: (params?: { status?: LgpdRequestStatus; requestType?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.requestType) query.set("requestType", params.requestType);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<LgpdRequestItem[]>(`/lgpd/requests${suffix}`);
  },
  create: (payload: CreateLgpdRequestPayload) =>
    request<LgpdRequestItem>("/lgpd/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  detailById: (id: string) => request<LgpdRequestDetail>(`/lgpd/requests/${id}`),
  detailByProtocol: (protocolCode: string) =>
    request<LgpdRequestDetail>(`/lgpd/requests/protocol/${encodeURIComponent(protocolCode)}`),
  updateStatus: (id: string, payload: UpdateLgpdRequestStatusPayload) =>
    request<LgpdRequestItem>(`/lgpd/requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
