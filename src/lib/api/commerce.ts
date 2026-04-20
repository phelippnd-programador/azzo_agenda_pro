import type {
  BillingPaymentsResponse,
  CreateBillingSubscriptionRequest,
  CreateBillingSubscriptionResponse,
} from "@/types/billing";
import type {
  CheckoutConfirmResponse,
  CheckoutIntentRequest,
  CheckoutIntentResponse,
  CheckoutProduct,
} from "@/types/checkout";
import type { AdminBillingActionResponse } from "@/types/system-admin";
import { request } from "./core";

export const checkoutApi = {
  listProducts: () => request<CheckoutProduct[]>("/checkout/products"),
  createIntent: (data: CheckoutIntentRequest) =>
    request<CheckoutIntentResponse>("/checkout/intents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  confirmIntent: (intentId: string) =>
    request<CheckoutConfirmResponse>(`/checkout/intents/${intentId}/confirm`, {
      method: "POST",
    }),
};

export const billingApi = {
  createSubscription: (data: CreateBillingSubscriptionRequest) =>
    request<CreateBillingSubscriptionResponse>("/billing/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getCurrentSubscription: () =>
    request<CreateBillingSubscriptionResponse>("/billing/subscriptions/current"),
  getPayments: () => request<BillingPaymentsResponse>("/billing/payments"),
  adminListActiveTenants: () =>
    request<{
      items: Array<{
        tenantId: string;
        name: string;
        slug?: string;
        email?: string;
        phone?: string;
        planStatus?: string;
      }>;
    }>("/billing/admin/tenants/active"),
  adminGetTenantPayments: (tenantId: string) =>
    request<BillingPaymentsResponse>(`/billing/admin/tenants/${tenantId}/payments`),
  adminExpireLicense: (tenantId: string, minutesAgo = 5) =>
    request<AdminBillingActionResponse>("/billing/admin/license/expire", {
      method: "POST",
      body: JSON.stringify({ tenantId, minutesAgo }),
    }),
  adminReleaseLicense: (payload?: {
    tenantId?: string;
    productId?: string;
    validityDays?: number;
    paymentId?: string;
  }) =>
    request<AdminBillingActionResponse>("/billing/admin/license/release", {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),
  adminMarkPaymentReceived: (tenantId: string, paymentId: string, validityDays?: number) =>
    request<AdminBillingActionResponse>("/billing/admin/payments/mark-received", {
      method: "POST",
      body: JSON.stringify({ tenantId, paymentId, validityDays }),
    }),
};
