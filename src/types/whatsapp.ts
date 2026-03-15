export interface WhatsAppConfigRequest {
  whatsappEnabled: boolean;
  enabled?: boolean;
  accessToken?: string;
  phoneNumberId: string;
  businessAccountId?: string;
  webhookVerifyToken?: string;
  canSchedule?: boolean;
  canCancel?: boolean;
  canReschedule?: boolean;
}

export interface WhatsAppConfigResponse {
  whatsappEnabled: boolean;
  enabled?: boolean;
  accessTokenConfigured?: boolean;
  phoneNumberId?: string;
  businessAccountId?: string;
  businessId?: string;
  displayPhoneNumber?: string;
  webhookVerifyToken?: string;
  webhookVerifyTokenConfigured?: boolean;
  onboardingStatus?: string;
  tokenSource?: string;
  canSchedule?: boolean;
  canCancel?: boolean;
  canReschedule?: boolean;
}

export interface WhatsAppTestResponse {
  success: boolean;
  message: string;
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
