export interface WhatsAppConfigRequest {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  webhookVerifyToken?: string;
}

export interface WhatsAppConfigResponse {
  whatsappEnabled: boolean;
  phoneNumberId?: string;
}

export interface WhatsAppTestResponse {
  success: boolean;
  message: string;
}
