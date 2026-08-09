import { request } from "./core";

// F08 — programa de fidelidade

export type LoyaltySettings = {
  enabled: boolean;
  pointsPerReal: number;
  includeProducts: boolean;
  validityMonths: number;
  redeemPointsPerReal: number;
};

export type LoyaltySettingsRequest = {
  enabled?: boolean;
  pointsPerReal?: number;
  includeProducts?: boolean;
  validityMonths?: number;
  redeemPointsPerReal?: number;
};

export type LoyaltyBalance = {
  clientId: string;
  points: number;
  redeemableAmount: number;
};

export const loyaltyApi = {
  getSettings: () => request<LoyaltySettings>("/settings/loyalty"),

  updateSettings: (data: LoyaltySettingsRequest) =>
    request<LoyaltySettings>("/settings/loyalty", { method: "PUT", body: JSON.stringify(data) }),

  balance: (clientId: string) => request<LoyaltyBalance>(`/clients/${clientId}/loyalty`),
};
