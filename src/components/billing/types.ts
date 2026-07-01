import type { BillingType } from "@/types/billing";

export interface BillingPlanOption {
  code: string;
  name: string;
  description: string;
  amount: number;
  validityDays?: number | null;
  validityMonths?: number | null;
  features: string[];
  highlight?: string;
}

export interface LicenseFormValues {
  planCode: string;
  billingType: BillingType;
  cpfCnpj: string;
  creditCardHolderName: string;
  creditCardNumber: string;
  creditCardExpiryMonth: string;
  creditCardExpiryYear: string;
  creditCardCcv: string;
  holderName: string;
  holderEmail: string;
  holderCpfCnpj: string;
  holderPostalCode: string;
  holderAddressNumber: string;
  holderAddressComplement: string;
  holderPhone: string;
}
