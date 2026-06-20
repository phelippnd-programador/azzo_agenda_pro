// Re-exporta tipos do local canônico — mantém compatibilidade com importações existentes
export type {
  WhatsAppConfigRequest,
  WhatsAppConfigResponse,
  WhatsAppTestResponse,
  WhatsAppEmbeddedSignupStatusResponse,
  WhatsAppEmbeddedSignupCompleteRequest,
  WhatsAppValidateConnectionRequest,
  WhatsAppValidateConnectionResponse,
  WhatsAppTestMessageRequest,
  WhatsAppTestMessageResponse,
} from "@/lib/api/whatsapp";
