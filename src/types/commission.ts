export type CommissionScopeType = "GLOBAL" | "PROFESSIONAL";
export type CommissionTargetType =
  | "GENERAL"
  | "SERVICE"
  | "SERVICE_CATEGORY"
  | "PRODUCT"
  | "PRODUCT_CATEGORY";
export type CommissionPercentBaseType = "GROSS" | "NET_OF_DISCOUNT";
export type CommissionRefundPolicy = "KEEP_COMMISSION" | "REVERSE_COMMISSION";
export type CommissionEntryStatus = "OPEN" | "REVERSED" | "PAID";
export type CommissionCycleStatus = "CLOSED" | "PAID";

export type CommissionRuleRequest = {
  targetType: CommissionTargetType;
  targetId?: string | null;
  targetCode?: string | null;
  percentValue: number;
  fixedAmount: number;
  percentBaseType: CommissionPercentBaseType;
  refundPolicy: CommissionRefundPolicy;
  active?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type CommissionRuleSetUpsertRequest = {
  scopeType: CommissionScopeType;
  professionalId?: string | null;
  name: string;
  active?: boolean;
  rules: CommissionRuleRequest[];
};

export type CommissionRuleItemResponse = {
  id: string;
  targetType: CommissionTargetType;
  targetId?: string | null;
  targetCode?: string | null;
  targetLabel?: string | null;
  percentValue: number;
  fixedAmount: number;
  percentBaseType: CommissionPercentBaseType;
  refundPolicy: CommissionRefundPolicy;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type CommissionRuleSetResponse = {
  id: string;
  scopeType: CommissionScopeType;
  professionalId?: string | null;
  professionalName?: string | null;
  name: string;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  rules: CommissionRuleItemResponse[];
};

export type CommissionRuleSetListResponse = {
  items: CommissionRuleSetResponse[];
};

export type CommissionEntryResponse = {
  id: string;
  professionalId: string;
  professionalName?: string | null;
  originType: string;
  originId?: string | null;
  originReference?: string | null;
  periodKey: string;
  baseAmount: number;
  percentValue: number;
  percentAmount: number;
  fixedAmount: number;
  totalAmount: number;
  entryStatus: CommissionEntryStatus;
  notes?: string | null;
  createdAt?: string | null;
  reversedAt?: string | null;
  cycleId?: string | null;
};

export type CommissionReportItemResponse = {
  professionalId: string;
  professionalName: string;
  serviceAmount: number;
  productAmount: number;
  manualAdjustmentAmount: number;
  totalAmount: number;
  openAmount: number;
  paidAmount: number;
  totalEntries: number;
};

export type CommissionReportResponse = {
  from: string;
  to: string;
  professionalId?: string | null;
  status?: CommissionEntryStatus | null;
  totalAmount: number;
  totalOpenAmount: number;
  totalPaidAmount: number;
  totalEntries: number;
  items: CommissionReportItemResponse[];
};

export type CommissionProfessionalReportResponse = {
  professionalId: string;
  professionalName: string;
  from: string;
  to: string;
  totalAmount: number;
  totalOpenAmount: number;
  totalPaidAmount: number;
  entries: CommissionEntryResponse[];
};

export type CommissionCycleResponse = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: CommissionCycleStatus;
  closedAt?: string | null;
  closedByUserId?: string | null;
  paidAt?: string | null;
  paidByUserId?: string | null;
  totalAmount: number;
  entryCount: number;
  createdAt?: string | null;
};

export type CommissionCycleListResponse = {
  items: CommissionCycleResponse[];
};

export type CommissionAdjustmentRequest = {
  professionalId: string;
  amount: number;
  effectiveAt?: string | null;
  reason: string;
};

export type CommissionAdjustmentResponse = {
  entry: CommissionEntryResponse;
  message: string;
};
