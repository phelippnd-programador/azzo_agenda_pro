import { request } from "./core";

// ─── Types ────────────────────────────────────────────────────────────────────
// Espelham TenantTelegramDtos do backend (azzo-agenda-pro).

export interface TelegramWebhookInfo {
  configured: boolean;
  url?: string;
  hasCustomCertificate?: boolean;
  pendingUpdateCount?: number;
  lastErrorDate?: string;
  lastErrorMessage?: string;
  ipAddress?: string;
}

export interface TelegramConfigResponse {
  botUsername?: string;
  botTokenConfigured: boolean;
  webhookSecretTokenConfigured: boolean;
  webhookSecretToken?: string;
  telegramEnabled: boolean;
  inboundWebhookUrl?: string;
  webhook?: TelegramWebhookInfo | null;
}

export interface TelegramConfigRequest {
  /** Token do @BotFather. Opcional após a primeira configuração (mantém o armazenado). */
  botToken?: string;
  botUsername?: string;
  /** Secret do webhook. Opcional — o backend gera automaticamente se ausente. */
  webhookSecretToken?: string;
  telegramEnabled: boolean;
}

export interface TelegramValidateConnectionRequest {
  botToken: string;
}

export interface TelegramValidateConnectionResponse {
  success: boolean;
  message: string;
  botUsername?: string;
  botDisplayName?: string;
}

export interface TelegramTestResponse {
  success: boolean;
  telegramEnabled: boolean;
  message: string;
}

export interface TelegramTestMessageRequest {
  destinationChatId: string;
  message?: string;
}

export interface TelegramTestMessageResponse {
  success: boolean;
  message: string;
  providerMessageId?: string;
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const telegramApi = {
  getConfig: () => request<TelegramConfigResponse>("/tenant/telegram"),

  saveConfig: (data: TelegramConfigRequest) =>
    request<TelegramConfigResponse>("/tenant/telegram", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  testConnection: () =>
    request<TelegramTestResponse>("/tenant/telegram/test", { method: "POST" }),

  validateConnection: (data: TelegramValidateConnectionRequest) =>
    request<TelegramValidateConnectionResponse>("/tenant/telegram/validate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sendTestMessage: (data: TelegramTestMessageRequest) =>
    request<TelegramTestMessageResponse>("/tenant/telegram/test-message", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
