import type { CreateBillingSubscriptionResponse } from '@/types/billing';
import { setLicenseAccessStatus } from '@/lib/license-access';
import { onlyDigits } from '@/lib/input-masks';

// ─── Labels ──────────────────────────────────────────────────────────────────

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa',
  PENDING: 'Pendente',
  OVERDUE: 'Em atraso',
  EXPIRED: 'Expirada',
  TRIAL: 'Trial',
  INACTIVE: 'Inativa',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  OVERDUE: 'Em atraso',
  RECEIVED: 'Pago',
  CONFIRMED: 'Confirmado',
  REFUNDED: 'Estornado',
  CANCELLED: 'Cancelado',
};

export const BILLING_TYPE_LABELS: Record<string, string> = {
  PIX: 'PIX',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão de crédito',
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export function toDigits(value: string) {
  return onlyDigits(value);
}

export function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountCents / 100);
}

export function formatDate(value?: string | null) {
  if (!value) return 'Nao informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function formatReferenceMonth(value?: string | null) {
  if (!value) return 'Nao informado';
  const normalized = value.length === 7 ? `${value}-01` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { month: '2-digit', year: 'numeric' }).format(date);
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export function getLicenseStatus(result: CreateBillingSubscriptionResponse) {
  const licenseStatus = String(result.licenseStatus || '').toUpperCase();
  if (licenseStatus === 'ACTIVE' || licenseStatus === 'EXPIRED') return licenseStatus;
  return String(result.status || '').toUpperCase();
}

export function getCurrentPaymentStatus(result: CreateBillingSubscriptionResponse) {
  return String(result.currentPaymentStatus || result.paymentStatus || '').toUpperCase();
}

export function getCurrentPaymentDueDate(result: CreateBillingSubscriptionResponse) {
  return result.currentPaymentDueDate || result.nextDueDate || null;
}

export function isTrialSubscription(result: CreateBillingSubscriptionResponse) {
  const billingType = String(result.billingType || '').toUpperCase();
  const status = String(result.status || '').toUpperCase();
  const cycle = String(result.cycle || '').toUpperCase();
  return billingType === 'TRIAL' || status.includes('TRIAL') || cycle === 'TRIAL';
}

export function isPaymentConfirmed(result: CreateBillingSubscriptionResponse) {
  const paymentStatus = getCurrentPaymentStatus(result);
  return paymentStatus === 'RECEIVED' || paymentStatus === 'CONFIRMED';
}

export function hasPaidFeaturesAccess(result: CreateBillingSubscriptionResponse) {
  if (isTrialSubscription(result)) return false;
  return getLicenseStatus(result) === 'ACTIVE';
}

export function isSupportedBillingType(
  billingType?: string | null
): billingType is 'PIX' | 'BOLETO' | 'CREDIT_CARD' {
  return billingType === 'PIX' || billingType === 'BOLETO' || billingType === 'CREDIT_CARD';
}

export function isOverdue(result: CreateBillingSubscriptionResponse) {
  const subscriptionStatus = getLicenseStatus(result);
  const paymentStatus = getCurrentPaymentStatus(result);
  if (subscriptionStatus === 'OVERDUE' || paymentStatus === 'OVERDUE') return true;
  const dueDateValue = getCurrentPaymentDueDate(result);
  if (!dueDateValue) return false;
  const dueDate = new Date(dueDateValue);
  if (Number.isNaN(dueDate.getTime())) return false;
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return dueDate.getTime() < normalizedToday;
}

export function getRemainingDaysUntilDue(result: CreateBillingSubscriptionResponse) {
  const dueDateValue = getCurrentPaymentDueDate(result);
  if (!dueDateValue) return null;
  const dueDate = new Date(dueDateValue);
  if (Number.isNaN(dueDate.getTime())) return null;
  const diffMs = dueDate.getTime() - new Date().getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getScheduledPlanStartDate(result: CreateBillingSubscriptionResponse | null) {
  if (!result) return null;
  const dueDateValue = getCurrentPaymentDueDate(result);
  if (!dueDateValue) return null;
  const dueDate = new Date(dueDateValue);
  return Number.isNaN(dueDate.getTime()) ? null : dueDate;
}

export function isSubscriptionActive(result: CreateBillingSubscriptionResponse) {
  return hasPaidFeaturesAccess(result);
}

export function resolveLicenseState(result: CreateBillingSubscriptionResponse) {
  const normalizedLicenseStatus = getLicenseStatus(result);
  const normalizedPayment = getCurrentPaymentStatus(result);
  const isActive = hasPaidFeaturesAccess(result);

  if (isTrialSubscription(result)) {
    return {
      variant: 'pending' as const,
      title: 'Periodo trial ativo',
      description: 'Seu trial esta ativo. Voce ja pode escolher e contratar um plano pago.',
    };
  }
  if (normalizedLicenseStatus === 'EXPIRED') {
    return {
      variant: 'expired' as const,
      title: 'Licenca expirada',
      description: 'Funcionalidades pagas bloqueadas ate a regularizacao do pagamento.',
    };
  }
  if (normalizedPayment === 'PENDING') {
    return {
      variant: 'pending' as const,
      title: 'Pagamento pendente',
      description: 'Aguardando compensacao do pagamento atual.',
    };
  }
  if (isActive) {
    return {
      variant: 'active' as const,
      title: 'Assinatura ativa',
      description: 'Pagamento confirmado. Sua licenca esta liberada para uso.',
    };
  }
  return {
    variant: 'pending' as const,
    title: 'Assinatura aguardando pagamento',
    description: 'A assinatura sera ativada automaticamente apos a compensacao.',
  };
}

export function syncPlanExpiredBlock(result: CreateBillingSubscriptionResponse | null) {
  const blocked = result ? getLicenseStatus(result) === 'EXPIRED' || isOverdue(result) : false;
  setLicenseAccessStatus(blocked ? 'BLOCKED' : 'ACTIVE');
}
