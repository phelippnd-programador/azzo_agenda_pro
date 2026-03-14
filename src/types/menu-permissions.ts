export interface CurrentMenuPermissionItem {
  id: string;
  route: string;
  label: string;
  parentId?: string | null;
  displayOrder: number;
  iconKey?: string | null;
  active: boolean;
}

export interface CurrentMenuPermissionsResponse {
  role: string;
  allowedRoutes: string[];
  items?: CurrentMenuPermissionItem[];
}
