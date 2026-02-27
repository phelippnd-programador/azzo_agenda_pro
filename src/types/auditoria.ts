export const AUDIT_MODULES = ["FISCAL", "RBAC", "FINANCE", "AUTH", "SYSTEM"] as const;
export const AUDIT_STATUSES = ["SUCCESS", "ERROR", "DENIED"] as const;
export const AUDIT_SOURCE_CHANNELS = ["API", "WEBHOOK", "SCHEDULER", "SYSTEM"] as const;
export const AUDIT_EXPORT_FORMATS = ["CSV", "JSON"] as const;

export type AuditModule = (typeof AUDIT_MODULES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type AuditSourceChannel = (typeof AUDIT_SOURCE_CHANNELS)[number];
export type AuditExportFormat = (typeof AUDIT_EXPORT_FORMATS)[number];

export type AuditAggregationItem = {
  key: string;
  count: number;
};

export type AuditEventListItemDto = {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  module: AuditModule;
  action: string;
  entityType: string | null;
  entityId: string | null;
  status: AuditStatus;
  errorCode: string | null;
  requestId: string;
  sourceChannel: AuditSourceChannel;
  ipAddress: string | null;
  createdAt: string;
  alterado: boolean;
  camposAlterados?: string[];
};

export type AuditEventDetailDto = AuditEventListItemDto & {
  errorMessage: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  eventHash: string;
  prevEventHash: string | null;
  chainValid: boolean;
};

export type AuditSearchResponseDto = {
  items: AuditEventListItemDto[];
  nextCursor: string | null;
  limit: number;
  hasNext: boolean;
  aggregations: {
    byModule: AuditAggregationItem[];
    byStatus: AuditAggregationItem[];
    byAction: AuditAggregationItem[];
  };
};

export type AuditExportResponseDto = {
  exportId: string;
  format: AuditExportFormat;
  downloadUrl: string;
  expiresAt: string;
  checksumSha256: string;
};

export type AuditSearchQueryDto = {
  from: string;
  to: string;
  modules?: AuditModule[];
  actions?: string[];
  statuses?: AuditStatus[];
  entityTypes?: string[];
  entityId?: string;
  actorUserIds?: string[];
  requestId?: string;
  sourceChannels?: AuditSourceChannel[];
  ip?: string;
  hasChanges?: boolean;
  text?: string;
  cursor?: string;
  limit?: number;
  sortBy?: "createdAt";
  sortDir?: "desc";
};

export type AuditExportRequestDto = Omit<AuditSearchQueryDto, "cursor"> & {
  format: AuditExportFormat;
  columns?: string[];
};

export type AuditFiltersOptionsDto = {
  modules: string[];
  statuses: string[];
  actions: string[];
  entityTypes: string[];
  sourceChannels: string[];
};

export type AuditRetentionEventDto = {
  id: string;
  tenantId: string | null;
  policyVersion: string;
  retentionPeriodDays: number;
  windowStart: string;
  windowEnd: string;
  affectedRows: number;
  executedBy: string;
  executionId: string;
  evidenceHash: string;
  createdAt: string;
};

export type AuditRetentionListResponseDto = {
  items: AuditRetentionEventDto[];
  nextCursor: string | null;
  hasNext: boolean;
};

export type AuditRetentionQueryDto = {
  from: string;
  to: string;
  policyVersion?: string;
  executionId?: string;
  cursor?: string;
  limit?: number;
};
