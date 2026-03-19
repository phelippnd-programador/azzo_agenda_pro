export type SystemAdminRole = "ADMIN" | "OWNER" | "PROFESSIONAL";
export type MenuConfigScope = "GLOBAL" | "TENANT";

export interface MenuRoleRouteItem {
  route: string;
  enabled: boolean;
  overridden: boolean;
  reason?: string | null;
}

export interface MenuRoleRoutesResponse {
  tenantId?: string;
  scope?: MenuConfigScope;
  role: string;
  items: MenuRoleRouteItem[];
}

export interface BulkMenuOverrideRequest {
  tenantId?: string;
  scope?: MenuConfigScope;
  role: SystemAdminRole;
  items: Array<{
    route: string;
    enabled: boolean;
  }>;
  reason?: string;
}

export interface MenuCatalogRoleVisibility {
  role: SystemAdminRole;
  enabled: boolean;
}

export interface MenuCatalogItem {
  id: string;
  route: string;
  label: string;
  parentId?: string | null;
  parentRoute?: string | null;
  parentLabel?: string | null;
  displayOrder: number;
  iconKey?: string | null;
  active: boolean;
  childrenCount: number;
  roleVisibilities: MenuCatalogRoleVisibility[];
}

export interface MenuCatalogResponse {
  items: MenuCatalogItem[];
}

export interface MenuCatalogItemRequest {
  id?: string;
  route: string;
  label: string;
  parentId?: string | null;
  displayOrder: number;
  iconKey?: string | null;
  active: boolean;
  roleVisibilities: MenuCatalogRoleVisibility[];
}

export interface AdminBillingActionResponse {
  status: string;
  tenantId?: string;
  licenseStatus?: string;
  message?: string;
  paymentId?: string;
  productId?: string;
  validUntil?: string;
}

export interface SystemPlanItem {
  id: string;
  name: string;
  description?: string | null;
  currency: string;
  priceCents: number;
  validityMonths: number;
  validityDays?: number | null;
  highlight?: string | null;
  featuresJson?: string | null;
  active: boolean;
  trial: boolean;
  priority: number;
  maxProfessionals?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemPlanListResponse {
  items: SystemPlanItem[];
}

export interface SystemPlanUpsertRequest {
  name: string;
  description?: string | null;
  currency: string;
  priceCents: number;
  validityMonths: number;
  validityDays?: number | null;
  highlight?: string | null;
  featuresJson?: string | null;
  active: boolean;
  trial: boolean;
  priority: number;
  maxProfessionals?: number | null;
}

export interface AdminTenantItem {
  tenantId: string;
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  planStatus?: string;
}

export interface CommercialOverview {
  totalTenants: number;
  totalSignups30d: number;
  payingTenants: number;
  activeTenants: number;
  expiredTenants: number;
  suspendedTenants: number;
  conversionRatePercent: number;
  revenueReceived30dCents: number;
  pendingAmountCents: number;
  tenantsByPlanStatus: Array<{
    planStatus: string;
    count: number;
  }>;
}

export interface GlobalAuditItem {
  id: string;
  tenantId?: string;
  tenantName?: string;
  actorUserId?: string;
  actorRole?: string;
  module?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  errorCode?: string;
  requestId?: string;
  sourceChannel?: string;
  ipAddress?: string;
  createdAt?: string;
}

export interface GlobalAuditListResponse {
  items: GlobalAuditItem[];
  limit: number;
}

export interface GlobalAuditDetail extends GlobalAuditItem {
  errorMessage?: string;
  userAgent?: string;
  beforeJson?: string;
  afterJson?: string;
  metadataJson?: string;
  hasChanges?: boolean;
  changedFieldsJson?: string;
  eventHash?: string;
  prevEventHash?: string;
}

export interface RevokeSessionsResponse {
  status: string;
  message?: string;
  tenantId?: string;
  userId?: string;
  revokedCount: number;
}

export interface SessionItem {
  refreshTokenId: string;
  tenantId?: string;
  tenantName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  createdAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  active: boolean;
}

export interface SessionListResponse {
  items: SessionItem[];
  limit: number;
}

export interface GlobalSuggestionItem {
  id: string;
  tenantId?: string;
  tenantName?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  category?: string;
  title: string;
  message: string;
  status?: string;
  adminResponse?: string;
  respondedByUserId?: string;
  respondedByUserName?: string;
  respondedAt?: string;
  closedAt?: string;
  sourcePage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuggestionUpdateRequest {
  adminResponse?: string;
  status?: string;
}

export interface GlobalSuggestionListResponse {
  items: GlobalSuggestionItem[];
  limit: number;
}

export interface EmailTemplateSummaryItem {
  templateType: string;
  label: string;
  configured: boolean;
  active: boolean;
  updatedAt?: string | null;
}

export interface EmailTemplateListResponse {
  items: EmailTemplateSummaryItem[];
}

export interface EmailTemplateDetailResponse {
  templateType: string;
  label: string;
  configured: boolean;
  active: boolean;
  fromEmail?: string | null;
  fromName?: string | null;
  replyTo?: string | null;
  subjectTemplate: string;
  htmlTemplate: string;
  placeholders: string[];
  updatedAt?: string | null;
  updatedBy?: string | null;
  sampleValues: Record<string, string>;
}

export interface EmailTemplateUpsertRequest {
  active?: boolean | null;
  fromEmail?: string | null;
  fromName?: string | null;
  replyTo?: string | null;
  subjectTemplate: string;
  htmlTemplate: string;
}

export interface EmailTemplateStatusUpdateRequest {
  active: boolean;
}

export interface EmailTemplatePreviewResponse {
  templateType: string;
  label: string;
  subject: string;
  html: string;
  fromEmail?: string | null;
  fromName?: string | null;
  replyTo?: string | null;
  placeholders: string[];
  sampleValues: Record<string, string>;
}
