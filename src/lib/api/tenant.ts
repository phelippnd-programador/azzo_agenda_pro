import type { CurrentMenuPermissionsResponse } from "@/types/menu-permissions";
import type {
  SuggestionCreateRequest,
  SuggestionItem,
  SuggestionListResponse,
} from "@/types/suggestion";
import type {
  BulkMenuOverrideRequest,
  MenuCatalogItem,
  MenuCatalogItemRequest,
  MenuCatalogResponse,
  MenuConfigScope,
  MenuRoleRoutesResponse,
  SystemAdminRole,
} from "@/types/system-admin";
import type {
  WhatsAppConfigRequest,
  WhatsAppConfigResponse,
  WhatsAppEmbeddedSignupCompleteRequest,
  WhatsAppEmbeddedSignupStatusResponse,
  WhatsAppTestMessageRequest,
  WhatsAppTestMessageResponse,
  WhatsAppTestResponse,
  WhatsAppValidateConnectionRequest,
  WhatsAppValidateConnectionResponse,
} from "@/types/whatsapp";
import { request } from "./core";

export const suggestionsApi = {
  list: (limit?: number) => {
    const query = new URLSearchParams();
    if (limit) query.set("limit", String(limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<SuggestionListResponse>(`/suggestions${suffix}`);
  },
  create: (payload: SuggestionCreateRequest) =>
    request<SuggestionItem>("/suggestions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const tenantApi = {
  getWhatsAppConfig: () => request<WhatsAppConfigResponse>("/tenant/whatsapp"),
  saveWhatsAppConfig: (data: WhatsAppConfigRequest) =>
    request<WhatsAppConfigResponse>("/tenant/whatsapp", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  testWhatsAppConnection: () =>
    request<WhatsAppTestResponse>("/tenant/whatsapp/test", {
      method: "POST",
    }),
  validateWhatsAppConnection: (data: WhatsAppValidateConnectionRequest) =>
    request<WhatsAppValidateConnectionResponse>("/tenant/whatsapp/validate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendWhatsAppTestMessage: (data: WhatsAppTestMessageRequest) =>
    request<WhatsAppTestMessageResponse>("/tenant/whatsapp/test-message", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getWhatsAppEmbeddedSignupStatus: () =>
    request<WhatsAppEmbeddedSignupStatusResponse>("/tenant/whatsapp/embedded-signup/status"),
  completeWhatsAppEmbeddedSignup: (data: WhatsAppEmbeddedSignupCompleteRequest) =>
    request<WhatsAppEmbeddedSignupStatusResponse>("/tenant/whatsapp/embedded-signup/complete", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const configApi = {
  getCurrentMenus: () => request<CurrentMenuPermissionsResponse>("/config/menus/current"),
  getMenuCatalog: () => request<MenuCatalogResponse>("/config/menus/catalog"),
  createMenuCatalogItem: (data: MenuCatalogItemRequest) =>
    request<MenuCatalogItem>("/config/menus/catalog", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMenuCatalogItem: (id: string, data: MenuCatalogItemRequest) =>
    request<MenuCatalogItem>(`/config/menus/catalog/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getRoleRoutes: (role: SystemAdminRole, scope: MenuConfigScope, tenantId?: string) =>
    request<MenuRoleRoutesResponse>(
      `/config/menus/roles/routes?role=${encodeURIComponent(role)}&scope=${encodeURIComponent(scope)}${
        scope === "TENANT" && tenantId ? `&tenantId=${encodeURIComponent(tenantId)}` : ""
      }`
    ),
  applyMenuOverridesBulk: (data: BulkMenuOverrideRequest) =>
    request<{ status: string; updated: number; role: string; timestamp: string }>(
      "/config/menus/overrides/bulk",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),
};
