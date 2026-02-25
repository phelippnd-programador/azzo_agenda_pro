export type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD" | "TRIAL";

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
  productId: string;
  planCode?: string;
  billingType: BillingType;
  cpfCnpj: string;
  description?: string;
  creditCard?: CreditCardData;
  creditCardHolderInfo?: CreditCardHolderInfo;
}

export interface CreateBillingSubscriptionResponse {
  id?: string;
  tenantId: string;
  customerId: string;
  subscriptionId: string | null;
  productId?: string | null;
  planCode?: string | null;
  status: BillingSubscriptionStatus | string;
  billingType: BillingType;
  cycle?: string | null;
  nextDueDate: string;
  amountCents: number;
  paymentLink?: string | null;
  cancelledAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  paymentId?: string | null;
  paymentStatus?: BillingPaymentStatus | string | null;
  currentPaymentId?: string | null;
  currentPaymentStatus?: BillingPaymentStatus | string | null;
  currentPaymentDueDate?: string | null;
  licenseStatus?: "ACTIVE" | "EXPIRED" | string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  boletoIdentificationField?: string | null;
  boletoBarCode?: string | null;
  boletoNossoNumero?: string | null;
  pixQrCodeBase64?: string | null;
  pixPayload?: string | null;
}

export interface BillingPaymentItem {
  id: string;
  tenantId: string;
  asaasPaymentId?: string | null;
  asaasSubscriptionId?: string | null;
  referenceMonth?: string | null;
  billingType: BillingType | string;
  status: BillingPaymentStatus | string;
  amountCents: number;
  netAmountCents?: number | null;
  dueDate?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  boletoIdentificationField?: string | null;
  boletoBarCode?: string | null;
  boletoNossoNumero?: string | null;
  pixQrCodeBase64?: string | null;
  pixPayload?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BillingPaymentsResponse {
  items: BillingPaymentItem[];
}
