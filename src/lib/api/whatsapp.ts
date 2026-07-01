import { request } from "./core";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WhatsAppUsageProfile = "REACTIVE_ONLY" | "NOTIFICATIONS" | "COMPLETE";

export interface WhatsAppConfigRequest {
  whatsappEnabled: boolean;
  accessToken?: string;
  phoneNumberId: string;
  businessAccountId?: string;
  businessId?: string;
  displayPhoneNumber?: string;
  webhookVerifyToken?: string;
  usageProfile?: WhatsAppUsageProfile;
  canSchedule?: boolean;
  canCancel?: boolean;
  canReschedule?: boolean;
  confirmationMessageTemplate?: string;
  cancellationMessageTemplate?: string;
  reminderMessageTemplate?: string;
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
  usageProfile?: WhatsAppUsageProfile;
  canSchedule?: boolean;
  canCancel?: boolean;
  canReschedule?: boolean;
  confirmationMessageTemplate?: string;
  cancellationMessageTemplate?: string;
  reminderMessageTemplate?: string;
}

export interface WhatsAppMessageLogItem {
  id: string;
  eventType: string;
  destinationPhone: string;
  messageText?: string;
  providerMessageId?: string;
  status: string;
  errorMessage?: string;
  sentAt: string;
  appointmentId?: string;
}

export interface WhatsAppMessageLogResponse {
  items: WhatsAppMessageLogItem[];
  hasMore: boolean;
  nextCursorSentAt?: string;
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

export interface WhatsAppSettingsPatch {
  whatsappEnabled?: boolean;
  usageProfile?: WhatsAppUsageProfile;
  canSchedule?: boolean;
  canCancel?: boolean;
  canReschedule?: boolean;
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

  patchSettings: (data: WhatsAppSettingsPatch) =>
    request<WhatsAppConfigResponse>("/tenant/whatsapp/settings", {
      method: "PATCH",
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

  getMessageLog: (limit = 50) =>
    request<WhatsAppMessageLogResponse>(`/tenant/whatsapp/message-log?limit=${limit}`),
};
