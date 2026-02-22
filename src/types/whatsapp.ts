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
  webhookVerifyToken?: string;
  canSchedule?: boolean;
  canCancel?: boolean;
  canReschedule?: boolean;
}

export interface WhatsAppTestResponse {
  success: boolean;
  message: string;
}
