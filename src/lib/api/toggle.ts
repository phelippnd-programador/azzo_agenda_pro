import { request } from "./core";

export type TenantToggleKey =
  | "WHATSAPP_ENABLED"
  | "WHATSAPP_USAGE_PROFILE"
  | "WHATSAPP_CAN_SCHEDULE"
  | "WHATSAPP_CAN_CANCEL"
  | "WHATSAPP_CAN_RESCHEDULE";

export interface ToggleResponse {
  key: TenantToggleKey;
  value: boolean | string;
  updatedAt: string;
}

export const toggleApi = {
  apply: (key: TenantToggleKey, value: boolean | string): Promise<ToggleResponse> =>
    request<ToggleResponse>("/tenant/toggle", {
      method: "PATCH",
      body: JSON.stringify({ key, value }),
    }),
};
