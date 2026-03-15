import { tenantApi } from "@/lib/api";
import type {
  WhatsAppConfigRequest,
  WhatsAppConfigResponse,
  WhatsAppEmbeddedSignupCompleteRequest,
  WhatsAppEmbeddedSignupStatusResponse,
  WhatsAppTestResponse,
} from "@/types/whatsapp";

export async function saveWhatsAppConfig(
  data: WhatsAppConfigRequest
): Promise<WhatsAppConfigResponse> {
  return tenantApi.saveWhatsAppConfig(data);
}

export async function getWhatsAppConfig(): Promise<WhatsAppConfigResponse> {
  return tenantApi.getWhatsAppConfig();
}

export async function testWhatsAppConnection(): Promise<WhatsAppTestResponse> {
  return tenantApi.testWhatsAppConnection();
}

export async function getWhatsAppEmbeddedSignupStatus(): Promise<WhatsAppEmbeddedSignupStatusResponse> {
  return tenantApi.getWhatsAppEmbeddedSignupStatus();
}

export async function completeWhatsAppEmbeddedSignup(
  data: WhatsAppEmbeddedSignupCompleteRequest
): Promise<WhatsAppEmbeddedSignupStatusResponse> {
  return tenantApi.completeWhatsAppEmbeddedSignup(data);
}
