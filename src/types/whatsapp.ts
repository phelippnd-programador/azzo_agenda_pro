export interface WhatsAppConfigRequest {
  whatsappEnabled: boolean;
  enabled?: boolean;
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
  embeddedSignupEnabled?: boolean;
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
