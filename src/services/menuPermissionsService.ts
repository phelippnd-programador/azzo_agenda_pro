import { configApi } from "@/lib/api/tenant";
import type { CurrentMenuPermissionsResponse } from "@/types/menu-permissions";

export async function getCurrentMenuPermissions(): Promise<CurrentMenuPermissionsResponse> {
  return configApi.getCurrentMenus();
}
