import { CircleCheckBig, Clock3, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CreateBillingSubscriptionResponse } from '@/types/billing';
import type { BillingPlanOption } from '@/components/billing/types';
import {
  SUBSCRIPTION_STATUS_LABELS, PAYMENT_STATUS_LABELS, BILLING_TYPE_LABELS,
  formatCurrency, formatDate, getCurrentPaymentStatus, getCurrentPaymentDueDate,
  isTrialSubscription, isOverdue, getLicenseStatus, resolveLicenseState,
} from '@/lib/billing-helpers';

interface SubscriptionStatusCardProps {
  result: CreateBillingSubscriptionResponse | null;
  managedPlan: BillingPlanOption | null;
  isLoadingCurrent: boolean;
  isLoadingPlans: boolean;
  isRefreshing: boolean;
  plansError: string | null;
  canPayNow: boolean;
  canChangePlanByWindow: boolean;
  onPayNow: () => void;
  onChangePlan: () => void;
  onRefreshStatus: () => void;
  onRefetchPlans: () => void;
}

export function SubscriptionStatusCard({
  result, managedPlan, isLoadingCurrent, isLoadingPlans,
  isRefreshing, plansError, canPayNow, canChangePlanByWindow,
  onPayNow, onChangePlan, onRefreshStatus, onRefetchPlans,
}: SubscriptionStatusCardProps) {
  const hasOverdue = result ? isOverdue(result) : false;
  const isLicenseExpired = result ? getLicenseStatus(result) === 'EXPIRED' : false;
  const licenseState = result ? resolveLicenseState(result) : null;
  const currentPaymentStatus = result ? getCurrentPaymentStatus(result) : '';

  const remainingDays = (() => {
    if (!result) return null;
    const dueDateValue = getCurrentPaymentDueDate(result);
    if (!dueDateValue) return null;
    const dueDate = new Date(dueDateValue);
    if (Number.isNaN(dueDate.getTime())) return null;
    const diffMs = dueDate.getTime() - new Date().getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assinatura atual</CardTitle>
        <CardDescription>Acompanhe aqui a situacao da sua assinatura em tempo real.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingPlans ? (
          <p className="text-sm text-muted-foreground">Carregando planos...</p>
        ) : null}
        {plansError ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertTitle>Falha ao carregar planos</AlertTitle>
            <AlertDescription>{plansError}</AlertDescription>
          </Alert>
        ) : null}
        {isLoadingCurrent ? (
          <p className="text-sm text-muted-foreground">Carregando status da assinatura...</p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <p>
            <strong>Seu plano:</strong>{' '}
            {managedPlan?.name || (result ? result.planCode || 'Plano cadastrado' : 'Nenhum')}
          </p>
          <p>
            <strong>Valor mensal:</strong>{' '}
            {result ? formatCurrency(result.amountCents) : 'Nao informado'}
          </p>
          <p>
            <strong>Status do plano:</strong>{' '}
            {result ? (SUBSCRIPTION_STATUS_LABELS[result.status] ?? result.status) : 'Sem assinatura'}
          </p>
          <p>
            <strong>Pagamento:</strong>{' '}
            {result
              ? (PAYMENT_STATUS_LABELS[currentPaymentStatus] ?? currentPaymentStatus ?? 'Nao informado')
              : 'Nao informado'}
          </p>
          <p>
            <strong>Proximo vencimento:</strong>{' '}
            {result ? formatDate(getCurrentPaymentDueDate(result)) : 'Nao informado'}
          </p>
          <p>
            <strong>Dias restantes:</strong>{' '}
            {result
              ? remainingDays == null ? 'Nao informado' : `${remainingDays} dia(s)`
              : 'Nao informado'}
          </p>
          <p>
            <strong>Metodo atual:</strong>{' '}
            {result ? (BILLING_TYPE_LABELS[result.billingType] ?? result.billingType) : 'Nao informado'}
          </p>
          <p>
            <strong>ID pagamento atual:</strong>{' '}
            {result?.currentPaymentId || result?.paymentId || 'Nao informado'}
          </p>
        </div>

        <Badge
          variant={!result ? 'secondary' : hasOverdue || isLicenseExpired ? 'destructive' : 'outline'}
          className={result && !hasOverdue && !isLicenseExpired ? 'border-emerald-500 text-emerald-700' : ''}
        >
          {!result
            ? 'Sem assinatura'
            : isTrialSubscription(result)
              ? 'Periodo trial ativo'
              : currentPaymentStatus === 'PENDING'
                ? 'Pagamento pendente'
                : isLicenseExpired
                  ? 'Licenca expirada'
                  : hasOverdue
                    ? 'Pagamento em atraso'
                    : 'Pagamento regular'}
        </Badge>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" onClick={onPayNow} disabled={!canPayNow || isLoadingCurrent || !result}>
            Pagar agora
          </Button>
          <Button type="button" variant="outline" onClick={onChangePlan} disabled={!canChangePlanByWindow}>
            Alterar plano
          </Button>
          <Button type="button" variant="ghost" onClick={onRefreshStatus} disabled={isRefreshing || isLoadingCurrent}>
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar status
              </>
            )}
          </Button>
          {plansError ? (
            <Button type="button" variant="outline" onClick={onRefetchPlans}>
              Tentar carregar planos
            </Button>
          ) : null}
        </div>

        {licenseState ? (
          <Alert
            className={
              licenseState.variant === 'active'
                ? 'border-emerald-300 bg-emerald-50'
                : licenseState.variant === 'expired'
                  ? 'border-red-300 bg-red-50'
                  : 'border-amber-300 bg-amber-50'
            }
          >
            <div className="flex items-start gap-2">
              {licenseState.variant === 'active' ? (
                <CircleCheckBig className="mt-0.5 h-4 w-4 text-emerald-700" />
              ) : (
                <Clock3 className={`mt-0.5 h-4 w-4 ${licenseState.variant === 'expired' ? 'text-red-700' : 'text-amber-700'}`} />
              )}
              <div>
                <AlertTitle>{licenseState.title}</AlertTitle>
                <AlertDescription>{licenseState.description}</AlertDescription>
              </div>
            </div>
          </Alert>
        ) : (
          <Alert>
            <AlertTitle>Sem assinatura ativa</AlertTitle>
            <AlertDescription>
              Clique em "Alterar plano" para contratar sua primeira assinatura.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
