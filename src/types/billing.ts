export type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

export type BillingSubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "OVERDUE"
  | "CANCELLED"
  | "INACTIVE"
  | "EXPIRED";

export type BillingPaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "FAILED"
  | "CANCELLED";

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone: string;
}

export interface CreateBillingSubscriptionRequest {
  planCode: string;
  billingType: BillingType;
  cpfCnpj: string;
  creditCard?: CreditCardData;
  creditCardHolderInfo?: CreditCardHolderInfo;
}

export interface CreateBillingSubscriptionResponse {
  tenantId: string;
  customerId: string;
  subscriptionId: string;
  planCode?: string | null;
  status: BillingSubscriptionStatus | string;
  billingType: BillingType;
  nextDueDate: string;
  amountCents: number;
  paymentId?: string | null;
  paymentStatus?: BillingPaymentStatus | string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  pixQrCodeBase64?: string | null;
  pixPayload?: string | null;
}
