import { request } from "./core";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppConfigRequest {
  whatsappEnabled: boolean;
  accessToken?: string;
  phoneNumberId: string;
  businessAccountId?: string;
  businessId?: string;
  displayPhoneNumber?: string;
  webhookVerifyToken?: string;
  canSchedule?: boolean;
  canCancel?: boolean;
  canReschedule?: boolean;
}

export interface WhatsAppConfigResponse {
  whatsappEnabled: boolean;
  accessTokenConfigured?: boolean;
  phoneNumberId?: string;
  businessAccountId?: string;
  businessId?: string;
  displayPhoneNumber?: string;
  webhookVerifyToken?: string;
  webhookVerifyTokenConfigured?: boolean;
  onboardingStatus?: string;
  tokenSource?: string;
  embeddedSignupEnabled?: boolean;
  canSchedule?: boolean;
  canCancel?: boolean;
  canReschedule?: boolean;
}

export interface WhatsAppTestResponse {
  success: boolean;
  message: string;
  whatsappEnabled?: boolean;
}

export interface WhatsAppEmbeddedSignupStatusResponse {
  connected: boolean;
  whatsappEnabled: boolean;
  accessTokenConfigured: boolean;
  webhookVerifyTokenConfigured: boolean;
  webhookVerifyToken?: string;
  onboardingStatus: string;
  tokenSource: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  businessId?: string;
  displayPhoneNumber?: string;
  lastError?: string;
  embeddedSignupEnabled?: boolean;
}

export interface WhatsAppEmbeddedSignupCompleteRequest {
  code: string;
  setupInfo: {
    wabaId: string;
    phoneNumberId: string;
    businessId?: string;
    phoneNumber?: string;
  };
}

export interface WhatsAppValidateConnectionRequest {
  accessToken: string;
  phoneNumberId: string;
}

export interface WhatsAppValidateConnectionResponse {
  success: boolean;
  message: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
}

export interface WhatsAppTestMessageRequest {
  destinationPhone: string;
  message?: string;
}

export interface WhatsAppTestMessageResponse {
  success: boolean;
  message: string;
  providerMessageId?: string;
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const whatsappApi = {
  getConfig: () =>
    request<WhatsAppConfigResponse>("/tenant/whatsapp"),

  saveConfig: (data: WhatsAppConfigRequest) =>
    request<WhatsAppConfigResponse>("/tenant/whatsapp", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  testConnection: () =>
    request<WhatsAppTestResponse>("/tenant/whatsapp/test", { method: "POST" }),

  validateConnection: (data: WhatsAppValidateConnectionRequest) =>
    request<WhatsAppValidateConnectionResponse>("/tenant/whatsapp/validate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sendTestMessage: (data: WhatsAppTestMessageRequest) =>
    request<WhatsAppTestMessageResponse>("/tenant/whatsapp/test-message", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getEmbeddedSignupStatus: () =>
    request<WhatsAppEmbeddedSignupStatusResponse>("/tenant/whatsapp/embedded-signup/status"),

  completeEmbeddedSignup: (data: WhatsAppEmbeddedSignupCompleteRequest) =>
    request<WhatsAppEmbeddedSignupStatusResponse>("/tenant/whatsapp/embedded-signup/complete", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
