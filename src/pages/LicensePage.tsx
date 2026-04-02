import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { CreditCardForm } from '@/components/billing/CreditCardForm';
import { PaymentMethodSelector } from '@/components/billing/PaymentMethodSelector';
import { PlanSelector } from '@/components/billing/PlanSelector';
import { PixPaymentView } from '@/components/billing/PixPaymentView';
import { BoletoPaymentView } from '@/components/billing/BoletoPaymentView';
import type { BillingPlanOption, LicenseFormValues } from '@/components/billing/types';
import type { BillingPaymentItem, CreateBillingSubscriptionResponse } from '@/types/billing';
import {
  createBillingSubscription, getBillingPayments,
  getBillingErrorMessage, getCurrentBillingSubscription,
} from '@/services/billingService';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, salonApi } from '@/lib/api';
import { useCheckoutProducts } from '@/hooks/useCheckoutProducts';
import { useLicenseAccess } from '@/hooks/useLicenseAccess';
import { maskCpfCnpj } from '@/lib/input-masks';
import {
  toDigits, formatCurrency, formatDate,
  getLicenseStatus, getCurrentPaymentStatus, getCurrentPaymentDueDate,
  isTrialSubscription, isSupportedBillingType, isOverdue, getRemainingDaysUntilDue,
  getScheduledPlanStartDate, resolveLicenseState, isSubscriptionActive,
  syncPlanExpiredBlock, SUBSCRIPTION_STATUS_LABELS, PAYMENT_STATUS_LABELS,
  BILLING_TYPE_LABELS,
} from '@/lib/billing-helpers';
import { SubscriptionStatusCard } from '@/components/license/SubscriptionStatusCard';
import { PaymentHistoryCard } from '@/components/license/PaymentHistoryCard';

type ActionMode = 'IDLE' | 'PAY' | 'CHANGE';

const baseSchema = z.object({
  planCode: z.string().min(1, 'Selecione um plano.'),
  billingType: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD']),
  cpfCnpj: z.string().min(11, 'Informe CPF/CNPJ valido.'),
  creditCardHolderName: z.string().optional(),
  creditCardNumber: z.string().optional(),
  creditCardExpiryMonth: z.string().optional(),
  creditCardExpiryYear: z.string().optional(),
  creditCardCcv: z.string().optional(),
  holderName: z.string().optional(),
  holderEmail: z.string().optional(),
  holderCpfCnpj: z.string().optional(),
  holderPostalCode: z.string().optional(),
  holderAddressNumber: z.string().optional(),
  holderAddressComplement: z.string().optional(),
  holderPhone: z.string().optional(),
});

const formSchema = baseSchema.superRefine((values, ctx) => {
  if (values.billingType !== 'CREDIT_CARD') return;
  const requiredFields: Array<keyof LicenseFormValues> = [
    'creditCardHolderName', 'creditCardNumber', 'creditCardExpiryMonth',
    'creditCardExpiryYear', 'creditCardCcv',
    'holderName', 'holderEmail', 'holderCpfCnpj', 'holderPostalCode',
    'holderAddressNumber', 'holderPhone',
  ];
  requiredFields.forEach((fieldName) => {
    const value = values[fieldName];
    if (!value || value.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [fieldName], message: 'Campo obrigatorio para pagamento com cartao.' });
    }
  });
});

export default function LicensePage() {
  const { user } = useAuth();
  const { refreshStatus: refreshLicenseStatus } = useLicenseAccess();
  const [searchParams] = useSearchParams();
  const { products, isLoading: isLoadingPlans, error: plansError, refetch: refetchPlans } = useCheckoutProducts();

  const [result, setResult] = useState<CreateBillingSubscriptionResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCardDigits, setLastCardDigits] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>('IDLE');
  const [paymentHistory, setPaymentHistory] = useState<BillingPaymentItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [hasAppliedQueryDefaults, setHasAppliedQueryDefaults] = useState(false);

  const plans = useMemo<BillingPlanOption[]>(
    () => products.map((product) => ({
      code: product.id, name: product.name,
      description: product.description || 'Plano disponivel para assinatura.',
      amountCents: Math.round(product.price * 100),
      features: product.features || [], highlight: product.highlight || undefined,
    })),
    [products]
  );

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      planCode: '', billingType: 'PIX', cpfCnpj: '',
      creditCardHolderName: user?.name || '', creditCardNumber: '',
      creditCardExpiryMonth: '', creditCardExpiryYear: '', creditCardCcv: '',
      holderName: user?.name || '', holderEmail: user?.email || '',
      holderCpfCnpj: '', holderPostalCode: '', holderAddressNumber: '',
      holderAddressComplement: '', holderPhone: user?.phone || '',
    },
  });

  const loadPaymentHistory = useCallback(async () => {
    setHistoryError(null);
    try {
      const response = await getBillingPayments();
      setPaymentHistory(response.items || []);
    } catch (error) {
      setPaymentHistory([]);
      setHistoryError(getBillingErrorMessage(error));
    }
  }, []);

  const loadCurrentSubscription = useCallback(async () => {
    try {
      setFetchError(null);
      const current = await getCurrentBillingSubscription();
      setResult(current);
      syncPlanExpiredBlock(current);
      const currentProductCode =
        current.productId && plans.some((p) => p.code === current.productId) ? current.productId
        : current.planCode && plans.some((p) => p.code === current.planCode) ? current.planCode : null;
      if (currentProductCode) form.setValue('planCode', currentProductCode);
      if (isSupportedBillingType(current.billingType)) form.setValue('billingType', current.billingType);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 402)) {
        setResult(null); syncPlanExpiredBlock(null); setFetchError(null); return;
      }
      setFetchError(getBillingErrorMessage(error));
    }
  }, [form, plans]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const profile = await salonApi.getProfile();
        const profileDocument = toDigits(profile.salonCpfCnpj || '');
        if (!profileDocument || cancelled) return;
        if (!toDigits(form.getValues('cpfCnpj'))) {
          form.setValue('cpfCnpj', maskCpfCnpj(profileDocument), { shouldValidate: true });
        }
      } catch { /* non-blocking */ }
    };
    load();
    return () => { cancelled = true; };
  }, [form]);

  useEffect(() => {
    if (!plans.length) return;
    if (form.getValues('planCode')) return;
    form.setValue('planCode', plans[0].code, { shouldValidate: true });
  }, [form, plans]);

  useEffect(() => {
    if (hasAppliedQueryDefaults || !plans.length) return;
    const planFromQuery = searchParams.get('plan');
    const modeFromQuery = (searchParams.get('mode') || '').toUpperCase();
    if (planFromQuery && plans.some((p) => p.code === planFromQuery)) {
      form.setValue('planCode', planFromQuery, { shouldValidate: true });
    }
    if (modeFromQuery === 'PAY') setActionMode('PAY');
    if (modeFromQuery === 'CHANGE' && !hasPaidAccess) setActionMode('CHANGE');
    setHasAppliedQueryDefaults(true);
  }, [form, hasAppliedQueryDefaults, plans, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoadingCurrent(true);
      await Promise.all([loadCurrentSubscription(), loadPaymentHistory()]);
      if (mounted) setIsLoadingCurrent(false);
    };
    load();
    return () => { mounted = false; };
  }, [loadCurrentSubscription, loadPaymentHistory]);

  const billingType = form.watch('billingType');
  const selectedPlanCode = form.watch('planCode');

  const selectedPlan = useMemo(() => plans.find((p) => p.code === selectedPlanCode) ?? null, [plans, selectedPlanCode]);
  const managedPlan = useMemo(() => plans.find((p) => p.code === (result?.productId || result?.planCode || '')) ?? null, [plans, result?.planCode, result?.productId]);
  const hasPaidAccess = useMemo(() => (result ? isSubscriptionActive(result) : false), [result]);
  const hasOverdue = useMemo(() => (result ? isOverdue(result) : false), [result]);
  const remainingDaysUntilDue = useMemo(() => (result ? getRemainingDaysUntilDue(result) : null), [result]);
  const scheduledPlanStartDate = useMemo(() => getScheduledPlanStartDate(result), [result]);

  const canChangePlanByWindow = useMemo(() => {
    if (!result) return true;
    if (isTrialSubscription(result)) return true;
    if (remainingDaysUntilDue == null) return false;
    return remainingDaysUntilDue <= 10;
  }, [remainingDaysUntilDue, result]);

  const canPayNow = useMemo(() => {
    if (!result) return false;
    if (isTrialSubscription(result)) return true;
    const subStatus = getLicenseStatus(result);
    const payStatus = getCurrentPaymentStatus(result);
    return (
      hasOverdue || subStatus === 'EXPIRED' || subStatus === 'PENDING' ||
      subStatus === 'OVERDUE' || payStatus === 'PENDING' || payStatus === 'OVERDUE'
    );
  }, [result, hasOverdue]);

  const openPayNow = () => {
    if (!result) return;
    if (isTrialSubscription(result)) { setActionMode('CHANGE'); return; }
    const code = result.productId || result.planCode;
    if (code) form.setValue('planCode', code);
    if (isSupportedBillingType(result.billingType)) form.setValue('billingType', result.billingType);
    setActionMode('PAY');
  };

  const openChangePlan = () => {
    if (!canChangePlanByWindow) {
      toast.info('Troca de plano liberada apenas no trial ou nos ultimos 10 dias antes do vencimento.');
      return;
    }
    setActionMode('CHANGE');
  };

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      await refreshLicenseStatus();
      await Promise.all([loadCurrentSubscription(), loadPaymentHistory()]);
      toast.success('Status da assinatura atualizado.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyText = async (value?: string | null, label = 'Codigo') => {
    if (!value) { toast.error(`${label} indisponivel.`); return; }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error('Nao foi possivel copiar automaticamente.');
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (actionMode === 'CHANGE' && hasPaidAccess) {
      toast.error('Nao e possivel trocar de plano com assinatura ativa.'); return;
    }
    const targetPlanCode =
      actionMode === 'PAY'
        ? result?.productId || result?.planCode || managedPlan?.code || selectedPlan?.code
        : selectedPlan?.code;
    if (!targetPlanCode) { toast.error('Nenhum plano disponivel para pagamento no momento.'); return; }

    try {
      setIsSubmitting(true);
      const planName = selectedPlan?.name || managedPlan?.name || result?.planCode || 'plano';
      const payload = {
        productId: targetPlanCode, planCode: targetPlanCode,
        billingType: values.billingType, cpfCnpj: toDigits(values.cpfCnpj),
        description: `Assinatura ${planName}`,
      } as const;

      const requestBody =
        values.billingType === 'CREDIT_CARD'
          ? {
              ...payload,
              creditCard: {
                holderName: values.creditCardHolderName.trim(),
                number: toDigits(values.creditCardNumber),
                expiryMonth: toDigits(values.creditCardExpiryMonth),
                expiryYear: toDigits(values.creditCardExpiryYear),
                ccv: toDigits(values.creditCardCcv),
              },
              creditCardHolderInfo: {
                name: values.holderName.trim(), email: values.holderEmail.trim(),
                cpfCnpj: toDigits(values.holderCpfCnpj), postalCode: toDigits(values.holderPostalCode),
                addressNumber: values.holderAddressNumber.trim(),
                addressComplement: values.holderAddressComplement.trim() || undefined,
                phone: toDigits(values.holderPhone),
              },
            }
          : payload;

      const response = await createBillingSubscription(requestBody);
      setResult(response);
      setLastCardDigits(values.billingType === 'CREDIT_CARD' ? toDigits(values.creditCardNumber).slice(-4) : null);
      await Promise.all([loadCurrentSubscription(), loadPaymentHistory()]);
      setActionMode('IDLE');
      toast.success(resolveLicenseState(response).title);
    } catch (error) {
      toast.error(getBillingErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <MainLayout
      title="Gerenciador de Licenca"
      subtitle="Veja sua assinatura, regularize pagamentos e ajuste seu plano quando quiser."
    >
      <div className="space-y-6">
        {fetchError ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertTitle>Nao foi possivel carregar sua assinatura</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        ) : null}

        <SubscriptionStatusCard
          result={result}
          managedPlan={managedPlan}
          isLoadingCurrent={isLoadingCurrent}
          isLoadingPlans={isLoadingPlans}
          isRefreshing={isRefreshing}
          plansError={plansError}
          canPayNow={canPayNow}
          canChangePlanByWindow={canChangePlanByWindow}
          onPayNow={openPayNow}
          onChangePlan={openChangePlan}
          onRefreshStatus={handleRefreshStatus}
          onRefetchPlans={refetchPlans}
        />

        {actionMode !== 'IDLE' ? (
          <Card>
            <CardHeader>
              <CardTitle>{actionMode === 'PAY' ? 'Regularizar pagamento' : 'Trocar de plano'}</CardTitle>
              <CardDescription>
                {actionMode === 'PAY'
                  ? 'Escolha como deseja pagar para manter seu acesso ativo.'
                  : 'Escolha o plano ideal para o momento do seu negocio.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {actionMode === 'CHANGE' ? (
                plans.length ? (
                  <div className="space-y-3">
                    <PlanSelector
                      plans={plans}
                      selectedPlanCode={selectedPlanCode}
                      onSelect={(code) => form.setValue('planCode', code, { shouldValidate: true })}
                    />
                    {scheduledPlanStartDate ? (
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertTitle>Inicio programado do novo plano</AlertTitle>
                        <AlertDescription>
                          O novo plano iniciara em <strong>{formatDate(scheduledPlanStartDate.toISOString())}</strong>,
                          quando o plano atual encerrar.
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                ) : (
                  <Alert>
                    <AlertTitle>Nenhum plano disponivel</AlertTitle>
                    <AlertDescription>Nao foi possivel carregar os planos no backend.</AlertDescription>
                  </Alert>
                )
              ) : (
                <Card className="border-border">
                  <CardContent className="pt-6 text-sm space-y-1">
                    <p><strong>Plano para pagamento:</strong> {managedPlan?.name || selectedPlan?.name || result?.planCode || 'Plano atual'}</p>
                    <p><strong>Valor:</strong> {formatCurrency(result?.amountCents || selectedPlan?.amountCents || 0)}</p>
                  </CardContent>
                </Card>
              )}

              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <FormLabel>Metodo de pagamento</FormLabel>
                    <PaymentMethodSelector
                      value={billingType}
                      onChange={(value) => form.setValue('billingType', value, { shouldValidate: true })}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control} name="cpfCnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF/CNPJ do pagador</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00 ou 00.000.000/0000-00"
                              {...field}
                              onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {billingType === 'CREDIT_CARD' ? <CreditCardForm form={form} /> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</>
                      ) : actionMode === 'PAY' ? 'Pagar fatura' : 'Confirmar alteracao'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setActionMode('IDLE')} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : null}

        {result?.billingType === 'PIX' ? (
          <PixPaymentView
            pixQrCodeBase64={result.pixQrCodeBase64}
            pixPayload={result.pixPayload}
            onCopyPix={() => handleCopyText(result.pixPayload, 'Codigo PIX')}
          />
        ) : null}

        {result?.billingType === 'BOLETO' ? (
          <BoletoPaymentView
            bankSlipUrl={result.bankSlipUrl}
            boletoIdentificationField={result.boletoIdentificationField}
            boletoBarCode={result.boletoBarCode}
            boletoNossoNumero={result.boletoNossoNumero}
          />
        ) : null}

        <PaymentHistoryCard paymentHistory={paymentHistory} historyError={historyError} />

        {result?.billingType === 'CREDIT_CARD' && lastCardDigits ? (
          <Card className="border-border">
            <CardHeader><CardTitle>Ultima confirmacao em cartao</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground">
              <p><strong>Status do plano:</strong> {SUBSCRIPTION_STATUS_LABELS[result.status] ?? result.status}</p>
              <p><strong>Pagamento:</strong> {PAYMENT_STATUS_LABELS[getCurrentPaymentStatus(result)] ?? getCurrentPaymentStatus(result) ?? 'N/A'}</p>
              <p><strong>Cartao:</strong> final {lastCardDigits}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </MainLayout>
  );
}
