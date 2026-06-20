// Re-exporta do novo local canônico — mantém compatibilidade com importações existentes
export {
  whatsappApi as default,
  whatsappApi,
} from "@/lib/api/whatsapp";

import { whatsappApi } from "@/lib/api/whatsapp";
import type {
  WhatsAppConfigRequest,
  WhatsAppConfigResponse,
  WhatsAppEmbeddedSignupCompleteRequest,
  WhatsAppEmbeddedSignupStatusResponse,
  WhatsAppTestResponse,
  WhatsAppTestMessageRequest,
  WhatsAppTestMessageResponse,
  WhatsAppValidateConnectionRequest,
  WhatsAppValidateConnectionResponse,
} from "@/lib/api/whatsapp";

export async function saveWhatsAppConfig(data: WhatsAppConfigRequest): Promise<WhatsAppConfigResponse> {
  return whatsappApi.saveConfig(data);
}

export async function getWhatsAppConfig(): Promise<WhatsAppConfigResponse> {
  return whatsappApi.getConfig();
}

export async function testWhatsAppConnection(): Promise<WhatsAppTestResponse> {
  return whatsappApi.testConnection();
}

export async function validateWhatsAppConnection(
  data: WhatsAppValidateConnectionRequest
): Promise<WhatsAppValidateConnectionResponse> {
  return whatsappApi.validateConnection(data);
}

export async function sendWhatsAppTestMessage(
  data: WhatsAppTestMessageRequest
): Promise<WhatsAppTestMessageResponse> {
  return whatsappApi.sendTestMessage(data);
}

export async function getWhatsAppEmbeddedSignupStatus(): Promise<WhatsAppEmbeddedSignupStatusResponse> {
  return whatsappApi.getEmbeddedSignupStatus();
}

export async function completeWhatsAppEmbeddedSignup(
  data: WhatsAppEmbeddedSignupCompleteRequest
): Promise<WhatsAppEmbeddedSignupStatusResponse> {
  return whatsappApi.completeEmbeddedSignup(data);
}
