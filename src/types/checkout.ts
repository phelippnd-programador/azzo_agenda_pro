export type CheckoutIntentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

export interface CheckoutIntentRequest {
  productId: string;
  quantity: number;
}

export interface CheckoutIntentResponse {
  intentId: string;
  productId: string;
  productName: string;
  quantity: number;
  currency: string;
  unitPrice: number;
  totalPrice: number;
  status: CheckoutIntentStatus;
  expiresAt: string;
}

export interface CheckoutConfirmResponse {
  intentId: string;
  status: CheckoutIntentStatus;
  redirectUrl?: string | null;
}

export interface CheckoutProduct {
  id: string;
  name: string;
  description?: string | null;
  currency: string;
  price: number;
  highlight?: string | null;
  features?: string[] | null;
}
