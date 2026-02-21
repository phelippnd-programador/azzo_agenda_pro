import { ApiError, billingApi } from "@/lib/api";
import type {
  BillingPaymentsResponse,
  CreateBillingSubscriptionRequest,
  CreateBillingSubscriptionResponse,
} from "@/types/billing";

export function getBillingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return error.message || "Revise os dados enviados antes de continuar.";
    }
    if (error.status === 401) return "Sua sessao expirou. Entre novamente para assinar.";
    if (error.status === 403) return "Sua conta nao tem permissao para criar assinatura.";
    if (error.status === 404) return "Plano ou recurso de cobranca nao encontrado.";
    if (error.status === 409) return "Ja existe uma assinatura em processamento para este plano.";
    if (error.status === 422) return "Nao foi possivel processar o pagamento com os dados informados.";
    if (error.status >= 500) return "Erro interno no servidor de cobranca. Tente novamente.";
  }

  if (error instanceof Error && error.message) return error.message;
  return "Falha ao criar assinatura. Tente novamente em instantes.";
}

export async function createBillingSubscription(
  payload: CreateBillingSubscriptionRequest
): Promise<CreateBillingSubscriptionResponse> {
  return billingApi.createSubscription(payload);
}

export async function getCurrentBillingSubscription(): Promise<CreateBillingSubscriptionResponse> {
  return billingApi.getCurrentSubscription();
}

export async function getBillingPayments(): Promise<BillingPaymentsResponse> {
  return billingApi.getPayments();
}
