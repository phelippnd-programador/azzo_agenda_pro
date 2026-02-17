import { checkoutApi } from "@/lib/api";
import type {
  CheckoutConfirmResponse,
  CheckoutIntentRequest,
  CheckoutIntentResponse,
  CheckoutProduct,
} from "@/types/checkout";

export async function listCheckoutProducts(): Promise<CheckoutProduct[]> {
  return checkoutApi.listProducts();
}

export async function createCheckoutIntent(
  payload: CheckoutIntentRequest
): Promise<CheckoutIntentResponse> {
  return checkoutApi.createIntent(payload);
}

export async function confirmCheckoutIntent(
  intentId: string
): Promise<CheckoutConfirmResponse> {
  return checkoutApi.confirmIntent(intentId);
}
