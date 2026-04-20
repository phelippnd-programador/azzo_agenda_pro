import type {
  DashboardWhatsAppReactivationQueueResponse,
  Transaction,
  TransactionCategory,
} from "@/types";
import type {
  CommissionAdjustmentRequest,
  CommissionAdjustmentResponse,
  CommissionCycleListResponse,
  CommissionCycleResponse,
  CommissionEntryStatus,
  CommissionProfessionalReportResponse,
  CommissionReportResponse,
  CommissionRuleSetListResponse,
  CommissionRuleSetResponse,
  CommissionRuleSetUpsertRequest,
} from "@/types/commission";
import { request, requestBlob } from "./core";

export type TransactionListParams = {
  from?: string;
  to?: string;
  type?: string;
  categoryId?: string;
  paymentMethod?: string;
  professionalId?: string;
  reconciled?: string;
  page?: number;
  limit?: number;
};

export type TransactionPagedResponse = {
  items: Transaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
};

export type RecurringTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  categoryId?: string;
  categoryName?: string;
  description: string;
  amount: number;
  paymentMethod: string;
  frequency: "MONTHLY" | "WEEKLY";
  dayOfMonth?: number;
  dayOfWeek?: number;
  active: boolean;
  createdAt: string;
};

export type RecurringTransactionCreateInput = {
  type: "INCOME" | "EXPENSE";
  categoryId?: string;
  description: string;
  amount: number;
  paymentMethod: string;
  frequency: "MONTHLY" | "WEEKLY";
  dayOfMonth?: number;
  dayOfWeek?: number;
};

export const transactionsApi = {
  getAll: (params?: TransactionListParams) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.type) query.set("type", params.type);
    if (params?.categoryId) query.set("categoryId", params.categoryId);
    if (params?.paymentMethod) query.set("paymentMethod", params.paymentMethod);
    if (params?.professionalId) query.set("professionalId", params.professionalId);
    if (params?.reconciled) query.set("reconciled", params.reconciled);
    if (typeof params?.page === "number") query.set("page", String(params.page));
    if (typeof params?.limit === "number") query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<TransactionPagedResponse>(`/finance/transactions${suffix}`);
  },
  getSummary: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<{ totalIncome: number; totalExpenses: number; balance: number }>(
      `/finance/transactions/summary${suffix}`
    );
  },
  create: (data: Partial<Transaction>) =>
    request<Transaction>("/finance/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Transaction>) =>
    request<Transaction>(`/finance/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  reconcile: (id: string) =>
    request<Transaction>(`/finance/transactions/${id}/reconcile`, {
      method: "PATCH",
    }),
  delete: (id: string) =>
    request<void>(`/finance/transactions/${id}`, {
      method: "DELETE",
    }),
  exportCsv: (params?: { from?: string; to?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.type) query.set("type", params.type);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return requestBlob(`/finance/transactions/export${suffix}`);
  },
  getCashFlow: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Array<{ date: string; income: number; expenses: number; balance: number }>>(
      `/finance/transactions/cash-flow${suffix}`
    );
  },
};

export const transactionCategoriesApi = {
  getAll: () =>
    request<Array<TransactionCategory & { transactionCount: number }>>(
      "/finance/transactions/categories"
    ),
  create: (name: string) =>
    request<TransactionCategory & { transactionCount: number }>(
      "/finance/transactions/categories",
      {
        method: "POST",
        body: JSON.stringify({ name }),
      }
    ),
  update: (id: string, name: string) =>
    request<TransactionCategory & { transactionCount: number }>(
      `/finance/transactions/categories/${id}`,
      {
        method: "PUT",
        body: JSON.stringify({ name }),
      }
    ),
  delete: (id: string) =>
    request<void>(`/finance/transactions/categories/${id}`, {
      method: "DELETE",
    }),
};

export const recurringTransactionsApi = {
  getAll: () => request<RecurringTransaction[]>("/finance/transactions/recurring"),
  create: (data: RecurringTransactionCreateInput) =>
    request<RecurringTransaction>("/finance/transactions/recurring", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/finance/transactions/recurring/${id}`, { method: "DELETE" }),
};

export const reportsApi = {
  getDaily: (date: string) => request(`/reports/daily?date=${date}`),
  getCommissions: (from: string, to: string, professionalUserId: string) =>
    request(
      `/reports/commissions?from=${from}&to=${to}&professionalUserId=${professionalUserId}`
    ),
  getAbandonment: (params?: {
    from?: string;
    to?: string;
    days?: number;
    status?: string;
    stage?: string;
    search?: string;
    pageIndex?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (typeof params?.days === "number") query.set("days", String(params.days));
    if (params?.status?.trim()) query.set("status", params.status.trim());
    if (params?.stage?.trim()) query.set("stage", params.stage.trim());
    if (params?.search?.trim()) query.set("search", params.search.trim());
    if (typeof params?.pageIndex === "number") query.set("pageIndex", String(params.pageIndex));
    if (typeof params?.pageSize === "number") query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<DashboardWhatsAppReactivationQueueResponse>(`/reports/abandonment${suffix}`);
  },
};

export const commissionApi = {
  listRuleSets: (params?: { professionalId?: string; activeOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.professionalId) query.set("professionalId", params.professionalId);
    if (typeof params?.activeOnly === "boolean") {
      query.set("activeOnly", String(params.activeOnly));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<CommissionRuleSetListResponse>(`/commissions/rules${suffix}`);
  },
  createRuleSet: (payload: CommissionRuleSetUpsertRequest) =>
    request<CommissionRuleSetResponse>("/commissions/rules", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateRuleSet: (ruleSetId: string, payload: CommissionRuleSetUpsertRequest) =>
    request<CommissionRuleSetResponse>(`/commissions/rules/${ruleSetId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  setRuleSetActive: (ruleSetId: string, active: boolean) =>
    request<CommissionRuleSetResponse>(`/commissions/rules/${ruleSetId}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  getReport: (params: {
    from: string;
    to: string;
    professionalId?: string;
    status?: CommissionEntryStatus;
  }) => {
    const query = new URLSearchParams({
      from: params.from,
      to: params.to,
    });
    if (params.professionalId) query.set("professionalId", params.professionalId);
    if (params.status) query.set("status", params.status);
    return request<CommissionReportResponse>(`/commissions/report?${query.toString()}`);
  },
  getProfessionalReport: (professionalId: string, from: string, to: string) =>
    request<CommissionProfessionalReportResponse>(
      `/commissions/report/${professionalId}?${new URLSearchParams({ from, to }).toString()}`
    ),
  listCycles: (status?: string) =>
    request<CommissionCycleListResponse>(
      `/commissions/cycles${status ? `?${new URLSearchParams({ status }).toString()}` : ""}`
    ),
  closeCycle: (periodStart: string, periodEnd: string) =>
    request<CommissionCycleResponse>("/commissions/cycles/close", {
      method: "POST",
      body: JSON.stringify({ periodStart, periodEnd }),
    }),
  payCycle: (cycleId: string, notes?: string) =>
    request<CommissionCycleResponse>(`/commissions/cycles/${cycleId}/pay`, {
      method: "POST",
      body: JSON.stringify(notes ? { notes } : {}),
    }),
  createAdjustment: (payload: CommissionAdjustmentRequest) =>
    request<CommissionAdjustmentResponse>("/commissions/adjustments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
