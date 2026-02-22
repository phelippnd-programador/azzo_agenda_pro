import { tenantApi } from "@/lib/api";
import type {
  WhatsAppConfigRequest,
  WhatsAppConfigResponse,
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
