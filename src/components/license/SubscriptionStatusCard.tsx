import { CircleCheckBig, Clock3, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CreateBillingSubscriptionResponse } from '@/types/billing';
import type { BillingPlanOption } from '@/components/billing/types';
import { formatCurrency } from '@/lib/format';
import {
  SUBSCRIPTION_STATUS_LABELS, PAYMENT_STATUS_LABELS, BILLING_TYPE_LABELS,
  formatDate, getCurrentPaymentStatus, getCurrentPaymentDueDate,
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
          <Alert className="border-red-200 bg-red-50 dark:border-red-900/70 dark:bg-red-950/40">
            <AlertTitle>Falha ao carregar planos</AlertTitle>
            <AlertDescription>{plansError}</AlertDescription>
          </Alert>
        ) : null}
        {isLoadingCurrent ? (
          <p className="text-sm text-muted-foreground">Carregando status da assinatura...</p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Seu plano</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {managedPlan?.name || (result ? result.planCode || 'Plano cadastrado' : 'Nenhum')}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Valor mensal</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {result ? formatCurrency(result.amount) : 'Nao informado'}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Status do plano</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {result ? (SUBSCRIPTION_STATUS_LABELS[result.status] ?? result.status) : 'Sem assinatura'}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Pagamento</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {result
                ? (PAYMENT_STATUS_LABELS[currentPaymentStatus] ?? currentPaymentStatus ?? 'Nao informado')
                : 'Nao informado'}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Proximo vencimento</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {result ? formatDate(getCurrentPaymentDueDate(result)) : 'Nao informado'}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Dias restantes</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {result
                ? remainingDays == null ? 'Nao informado' : `${remainingDays} dia(s)`
                : 'Nao informado'}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Metodo atual</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {result ? (BILLING_TYPE_LABELS[result.billingType] ?? result.billingType) : 'Nao informado'}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">ID pagamento atual</p>
            <p className="mt-1 break-all text-sm font-semibold text-foreground">
              {result?.currentPaymentId || result?.paymentId || 'Nao informado'}
            </p>
          </div>
        </div>

        <Badge
          variant={!result ? 'secondary' : hasOverdue || isLicenseExpired ? 'destructive' : 'outline'}
          className={result && !hasOverdue && !isLicenseExpired ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400' : ''}
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

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            onClick={onPayNow}
            disabled={!canPayNow || isLoadingCurrent || !result}
            className="w-full sm:w-auto"
          >
            Pagar agora
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onChangePlan}
            disabled={!canChangePlanByWindow}
            className="w-full sm:w-auto"
          >
            Alterar plano
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onRefreshStatus}
            disabled={isRefreshing || isLoadingCurrent}
            className="w-full sm:w-auto"
          >
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
            <Button type="button" variant="outline" onClick={onRefetchPlans} className="w-full sm:w-auto">
              Tentar carregar planos
            </Button>
          ) : null}
        </div>

        {licenseState ? (
          <Alert
            className={
              licenseState.variant === 'active'
                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/40'
                : licenseState.variant === 'expired'
                  ? 'border-red-300 bg-red-50 dark:border-red-900/70 dark:bg-red-950/40'
                  : 'border-amber-300 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/40'
            }
          >
            <div className="flex items-start gap-2">
              {licenseState.variant === 'active' ? (
                <CircleCheckBig className="mt-0.5 h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <Clock3 className={`mt-0.5 h-4 w-4 ${licenseState.variant === 'expired' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`} />
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
