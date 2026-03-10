import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckBig, Clock3, Eye, Loader2, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CreditCardForm } from "@/components/billing/CreditCardForm";
import { PaymentMethodSelector } from "@/components/billing/PaymentMethodSelector";
import { PlanSelector } from "@/components/billing/PlanSelector";
import { PixPaymentView } from "@/components/billing/PixPaymentView";
import { BoletoPaymentView } from "@/components/billing/BoletoPaymentView";
import type { BillingPlanOption, LicenseFormValues } from "@/components/billing/types";
import type {
  BillingPaymentItem,
  CreateBillingSubscriptionResponse,
} from "@/types/billing";
import {
  createBillingSubscription,
  getBillingPayments,
  getBillingErrorMessage,
  getCurrentBillingSubscription,
} from "@/services/billingService";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, salonApi } from "@/lib/api";
import { useCheckoutProducts } from "@/hooks/useCheckoutProducts";
import { useLicenseAccess } from "@/hooks/useLicenseAccess";
import { maskCpfCnpj, onlyDigits } from "@/lib/input-masks";
import { setLicenseAccessStatus } from "@/lib/license-access";

type ActionMode = "IDLE" | "PAY" | "CHANGE";

const baseSchema = z.object({
  planCode: z.string().min(1, "Selecione um plano."),
  billingType: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
  cpfCnpj: z.string().min(11, "Informe CPF/CNPJ valido."),
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
  if (values.billingType !== "CREDIT_CARD") return;

  const requiredFields: Array<keyof LicenseFormValues> = [
    "creditCardHolderName",
    "creditCardNumber",
    "creditCardExpiryMonth",
    "creditCardExpiryYear",
    "creditCardCcv",
    "holderName",
    "holderEmail",
    "holderCpfCnpj",
    "holderPostalCode",
    "holderAddressNumber",
    "holderPhone",
  ];

  requiredFields.forEach((fieldName) => {
    const value = values[fieldName];
    if (!value || value.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [fieldName],
        message: "Campo obrigatorio para pagamento com cartao.",
      });
    }
  });
});

function toDigits(value: string) {
  return onlyDigits(value);
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "Nao informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatReferenceMonth(value?: string | null) {
  if (!value) return "Nao informado";
  const normalized = value.length === 7 ? `${value}-01` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getLicenseStatus(result: CreateBillingSubscriptionResponse) {
  const licenseStatus = String(result.licenseStatus || "").toUpperCase();
  if (licenseStatus === "ACTIVE" || licenseStatus === "EXPIRED") return licenseStatus;
  return String(result.status || "").toUpperCase();
}

function getCurrentPaymentStatus(result: CreateBillingSubscriptionResponse) {
  return String(result.currentPaymentStatus || result.paymentStatus || "").toUpperCase();
}

function getCurrentPaymentDueDate(result: CreateBillingSubscriptionResponse) {
  return result.currentPaymentDueDate || result.nextDueDate || null;
}

function isPaymentConfirmed(result: CreateBillingSubscriptionResponse) {
  const paymentStatus = getCurrentPaymentStatus(result);
  return paymentStatus === "RECEIVED" || paymentStatus === "CONFIRMED";
}

function hasPaidFeaturesAccess(result: CreateBillingSubscriptionResponse) {
  const licenseStatus = getLicenseStatus(result);
  if (licenseStatus !== "ACTIVE") return false;
  return true;
}

function isSupportedBillingType(
  billingType?: string | null
): billingType is "PIX" | "BOLETO" | "CREDIT_CARD" {
  return billingType === "PIX" || billingType === "BOLETO" || billingType === "CREDIT_CARD";
}

function isOverdue(result: CreateBillingSubscriptionResponse) {
  const subscriptionStatus = getLicenseStatus(result);
  const paymentStatus = getCurrentPaymentStatus(result);

  if (subscriptionStatus === "OVERDUE" || paymentStatus === "OVERDUE") return true;
  const dueDateValue = getCurrentPaymentDueDate(result);
  if (!dueDateValue) return false;

  const dueDate = new Date(dueDateValue);
  if (Number.isNaN(dueDate.getTime())) return false;

  const today = new Date();
  const normalizedToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  return dueDate.getTime() < normalizedToday;
}

function resolveLicenseState(result: CreateBillingSubscriptionResponse) {
  const normalizedLicenseStatus = getLicenseStatus(result);
  const normalizedPayment = getCurrentPaymentStatus(result);
  const isActive = hasPaidFeaturesAccess(result);

  if (normalizedLicenseStatus === "EXPIRED") {
    return {
      variant: "expired" as const,
      title: "Licenca expirada",
      description: "Funcionalidades pagas bloqueadas ate a regularizacao do pagamento.",
    };
  }

  if (normalizedPayment === "PENDING") {
    return {
      variant: "pending" as const,
      title: "Pagamento pendente",
      description: "Aguardando compensacao do pagamento atual.",
    };
  }

  if (isActive) {
    return {
      variant: "active" as const,
      title: "Assinatura ativa",
      description: "Pagamento confirmado. Sua licenca esta liberada para uso.",
    };
  }

  return {
    variant: "pending" as const,
    title: "Assinatura aguardando pagamento",
    description: "A assinatura sera ativada automaticamente apos a compensacao.",
  };
}

function isSubscriptionActive(result: CreateBillingSubscriptionResponse) {
  return hasPaidFeaturesAccess(result);
}

function syncPlanExpiredBlock(result: CreateBillingSubscriptionResponse | null) {
  const blocked = result ? getLicenseStatus(result) === "EXPIRED" || isOverdue(result) : false;
  setLicenseAccessStatus(blocked ? "BLOCKED" : "ACTIVE");
}

export default function LicensePage() {
  const { user } = useAuth();
  const { refreshStatus: refreshLicenseStatus } = useLicenseAccess();
  const [searchParams] = useSearchParams();
  const {
    products,
    isLoading: isLoadingPlans,
    error: plansError,
    refetch: refetchPlans,
  } = useCheckoutProducts();
  const [result, setResult] = useState<CreateBillingSubscriptionResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCardDigits, setLastCardDigits] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>("IDLE");
  const [paymentHistory, setPaymentHistory] = useState<BillingPaymentItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<BillingPaymentItem | null>(null);
  const [hasAppliedQueryDefaults, setHasAppliedQueryDefaults] = useState(false);
  const hasPaidAccess = useMemo(
    () => (result ? isSubscriptionActive(result) : false),
    [result]
  );
  const isLicenseExpired = useMemo(
    () => (result ? getLicenseStatus(result) === "EXPIRED" : false),
    [result]
  );

  const plans = useMemo<BillingPlanOption[]>(
    () =>
      products.map((product) => ({
        code: product.id,
        name: product.name,
        description: product.description || "Plano disponivel para assinatura.",
        amountCents: Math.round(product.price * 100),
        features: product.features || [],
        highlight: product.highlight || undefined,
      })),
    [products]
  );

  const loadPaymentHistory = useCallback(async () => {
    try {
      const response = await getBillingPayments();
      setPaymentHistory(response.items || []);
    } catch {
      setPaymentHistory([]);
    }
  }, []);

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      planCode: "",
      billingType: "PIX",
      cpfCnpj: "",
      creditCardHolderName: user?.name || "",
      creditCardNumber: "",
      creditCardExpiryMonth: "",
      creditCardExpiryYear: "",
      creditCardCcv: "",
      holderName: user?.name || "",
      holderEmail: user?.email || "",
      holderCpfCnpj: "",
      holderPostalCode: "",
      holderAddressNumber: "",
      holderAddressComplement: "",
      holderPhone: user?.phone || "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    const loadPayerDocument = async () => {
      try {
        const profile = await salonApi.getProfile();
        const profileDocument = onlyDigits(profile.salonCpfCnpj || "");
        if (!profileDocument || cancelled) return;

        const currentPayerDocument = onlyDigits(form.getValues("cpfCnpj"));
        if (!currentPayerDocument) {
          form.setValue("cpfCnpj", maskCpfCnpj(profileDocument), { shouldValidate: true });
        }
      } catch {
        // Sem bloqueio da tela de licenca caso o perfil nao esteja disponivel.
      }
    };

    loadPayerDocument();
    return () => {
      cancelled = true;
    };
  }, [form]);

  useEffect(() => {
    if (!plans.length) return;
    if (form.getValues("planCode")) return;
    form.setValue("planCode", plans[0].code, { shouldValidate: true });
  }, [form, plans]);

  useEffect(() => {
    if (hasAppliedQueryDefaults || !plans.length) return;

    const planFromQuery = searchParams.get("plan");
    const modeFromQuery = (searchParams.get("mode") || "").toUpperCase();

    if (planFromQuery && plans.some((plan) => plan.code === planFromQuery)) {
      form.setValue("planCode", planFromQuery, { shouldValidate: true });
    }

    if (modeFromQuery === "PAY") {
      setActionMode("PAY");
    }

    if (modeFromQuery === "CHANGE" && !hasPaidAccess) {
      setActionMode("CHANGE");
    }

    setHasAppliedQueryDefaults(true);
  }, [form, hasAppliedQueryDefaults, hasPaidAccess, plans, searchParams]);

  const loadCurrentSubscription = useCallback(async () => {
    try {
      setFetchError(null);
      const current = await getCurrentBillingSubscription();
      setResult(current);
      syncPlanExpiredBlock(current);
      const currentProductCode =
        current.productId && plans.some((plan) => plan.code === current.productId)
          ? current.productId
          : current.planCode && plans.some((plan) => plan.code === current.planCode)
            ? current.planCode
            : null;

      if (currentProductCode) {
        form.setValue("planCode", currentProductCode);
      }
      if (isSupportedBillingType(current.billingType)) {
        form.setValue("billingType", current.billingType);
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 402)) {
        setResult(null);
        syncPlanExpiredBlock(null);
        setFetchError(null);
        return;
      }
      setFetchError(getBillingErrorMessage(error));
    }
  }, [form, plans]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoadingCurrent(true);
      await Promise.all([loadCurrentSubscription(), loadPaymentHistory()]);
      if (mounted) setIsLoadingCurrent(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [loadCurrentSubscription, loadPaymentHistory]);

  const billingType = form.watch("billingType");
  const selectedPlanCode = form.watch("planCode");
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === selectedPlanCode) ?? null,
    [plans, selectedPlanCode]
  );
  const managedPlan = useMemo(
    () =>
      plans.find(
        (plan) => plan.code === (result?.productId || result?.planCode || "")
      ) ?? null,
    [plans, result?.planCode, result?.productId]
  );
  const hasOverdue = useMemo(() => (result ? isOverdue(result) : false), [result]);
  const licenseState = useMemo(
    () => (result ? resolveLicenseState(result) : null),
    [result]
  );
  const orderedHistory = useMemo(
    () =>
      [...paymentHistory].sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt || b.dueDate || 0).getTime() -
          new Date(a.createdAt || a.updatedAt || a.dueDate || 0).getTime()
      ),
    [paymentHistory]
  );

  const canPayNow = useMemo(() => {
    if (!result) return false;
    const subStatus = getLicenseStatus(result);
    const payStatus = getCurrentPaymentStatus(result);
    return (
      hasOverdue ||
      subStatus === "EXPIRED" ||
      subStatus === "PENDING" ||
      subStatus === "OVERDUE" ||
      payStatus === "PENDING" ||
      payStatus === "OVERDUE"
    );
  }, [result, hasOverdue]);

  const openPayNow = () => {
    if (!result) return;
    const currentProductCode = result.productId || result.planCode;
    if (currentProductCode) form.setValue("planCode", currentProductCode);
    if (isSupportedBillingType(result.billingType)) {
      form.setValue("billingType", result.billingType);
    }
    setActionMode("PAY");
  };

  const openChangePlan = () => {
    if (hasPaidAccess) {
      toast.info("Plano ativo nao pode ser alterado no momento.");
      return;
    }
    setActionMode("CHANGE");
  };

  const refreshStatus = async () => {
    try {
      setIsRefreshing(true);
      await refreshLicenseStatus();
      await Promise.all([loadCurrentSubscription(), loadPaymentHistory()]);
      toast.success("Status da assinatura atualizado.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyText = async (value?: string | null, label = "Codigo") => {
    if (!value) {
      toast.error(`${label} indisponivel.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error("Nao foi possivel copiar automaticamente.");
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (actionMode === "CHANGE" && hasPaidAccess) {
      toast.error("Nao e possivel trocar de plano com assinatura ativa.");
      return;
    }

    const targetPlanCode =
      actionMode === "PAY"
        ? result?.productId || result?.planCode || managedPlan?.code || selectedPlan?.code
        : selectedPlan?.code;

    if (!targetPlanCode) {
      toast.error("Nenhum plano disponivel para pagamento no momento.");
      return;
    }

    try {
      setIsSubmitting(true);
      const planNameForDescription =
        selectedPlan?.name || managedPlan?.name || result?.planCode || "plano";
      const payload = {
        productId: targetPlanCode,
        planCode: targetPlanCode,
        billingType: values.billingType,
        cpfCnpj: toDigits(values.cpfCnpj),
        description: `Assinatura ${planNameForDescription}`,
      } as const;

      const requestBody =
        values.billingType === "CREDIT_CARD"
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
                name: values.holderName.trim(),
                email: values.holderEmail.trim(),
                cpfCnpj: toDigits(values.holderCpfCnpj),
                postalCode: toDigits(values.holderPostalCode),
                addressNumber: values.holderAddressNumber.trim(),
                addressComplement: values.holderAddressComplement.trim() || undefined,
                phone: toDigits(values.holderPhone),
              },
            }
          : payload;

      const response = await createBillingSubscription(requestBody);
      setResult(response);
      setLastCardDigits(
        values.billingType === "CREDIT_CARD"
          ? toDigits(values.creditCardNumber).slice(-4)
          : null
      );
      await Promise.all([loadCurrentSubscription(), loadPaymentHistory()]);
      setActionMode("IDLE");
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
        <Card>
          <CardHeader>
            <CardTitle>Assinatura atual</CardTitle>
            <CardDescription>
              Acompanhe aqui a situacao da sua assinatura em tempo real.
            </CardDescription>
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

            {fetchError ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertTitle>Nao foi possivel carregar sua assinatura</AlertTitle>
                <AlertDescription>{fetchError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <p>
                <strong>Seu plano:</strong>{" "}
                {managedPlan?.name || (result ? result.planCode || "Plano cadastrado" : "Nenhum")}
              </p>
              <p>
                <strong>Valor mensal:</strong>{" "}
                {result ? formatCurrency(result.amountCents) : "Nao informado"}
              </p>
              <p>
                <strong>Status do plano:</strong> {result?.status || "Sem assinatura"}
              </p>
              <p>
                <strong>Pagamento:</strong>{" "}
                {result ? getCurrentPaymentStatus(result) || "Nao informado" : "Nao informado"}
              </p>
              <p>
                <strong>Proximo vencimento:</strong>{" "}
                {result ? formatDate(getCurrentPaymentDueDate(result)) : "Nao informado"}
              </p>
              <p>
                <strong>Metodo atual:</strong> {result?.billingType || "Nao informado"}
              </p>
              <p>
                <strong>ID pagamento atual:</strong>{" "}
                {result?.currentPaymentId || result?.paymentId || "Nao informado"}
              </p>
            </div>

            <Badge
              variant={
                !result ? "secondary" : hasOverdue || isLicenseExpired ? "destructive" : "outline"
              }
              className={result && !hasOverdue && !isLicenseExpired ? "border-emerald-500 text-emerald-700" : ""}
            >
              {!result
                ? "Sem assinatura"
                : result && getCurrentPaymentStatus(result) === "PENDING"
                  ? "Pagamento pendente"
                  : isLicenseExpired
                    ? "Licenca expirada"
                : hasOverdue
                  ? "Pagamento em atraso"
                  : "Pagamento regular"}
            </Badge>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                onClick={openPayNow}
                disabled={!canPayNow || isLoadingCurrent || !result}
              >
                Pagar agora
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={openChangePlan}
                disabled={hasPaidAccess}
              >
                Alterar plano
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={refreshStatus}
                disabled={isRefreshing || isLoadingCurrent}
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
                <Button type="button" variant="outline" onClick={refetchPlans}>
                  Tentar carregar planos
                </Button>
              ) : null}
            </div>

            {licenseState ? (
              <Alert
                className={
                  licenseState.variant === "active"
                    ? "border-emerald-300 bg-emerald-50"
                    : licenseState.variant === "expired"
                      ? "border-red-300 bg-red-50"
                    : "border-amber-300 bg-amber-50"
                }
              >
                <div className="flex items-start gap-2">
                  {licenseState.variant === "active" ? (
                    <CircleCheckBig className="mt-0.5 h-4 w-4 text-emerald-700" />
                  ) : licenseState.variant === "expired" ? (
                    <Clock3 className="mt-0.5 h-4 w-4 text-red-700" />
                  ) : (
                    <Clock3 className="mt-0.5 h-4 w-4 text-amber-700" />
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

        {actionMode !== "IDLE" ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {actionMode === "PAY" ? "Regularizar pagamento" : "Trocar de plano"}
              </CardTitle>
              <CardDescription>
                {actionMode === "PAY"
                  ? "Escolha como deseja pagar para manter seu acesso ativo."
                  : "Escolha o plano ideal para o momento do seu negocio."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {actionMode === "CHANGE" ? (
                plans.length ? (
                  <PlanSelector
                    plans={plans}
                    selectedPlanCode={selectedPlanCode}
                    onSelect={(code) => form.setValue("planCode", code, { shouldValidate: true })}
                  />
                ) : (
                  <Alert>
                    <AlertTitle>Nenhum plano disponivel</AlertTitle>
                    <AlertDescription>
                      Nao foi possivel carregar os planos no backend.
                    </AlertDescription>
                  </Alert>
                )
              ) : (
                <Card className="border-border">
                  <CardContent className="pt-6 text-sm space-y-1">
                    <p>
                      <strong>Plano para pagamento:</strong>{" "}
                      {managedPlan?.name ||
                        selectedPlan?.name ||
                        result?.planCode ||
                        "Plano atual"}
                    </p>
                    <p>
                      <strong>Valor:</strong>{" "}
                      {formatCurrency(result?.amountCents || selectedPlan?.amountCents || 0)}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <FormLabel>Metodo de pagamento</FormLabel>
                    <PaymentMethodSelector
                      value={billingType}
                      onChange={(value) =>
                        form.setValue("billingType", value, { shouldValidate: true })
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cpfCnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF/CNPJ do pagador</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00 ou 00.000.000/0000-00"
                              {...field}
                              onChange={(event) =>
                                field.onChange(maskCpfCnpj(event.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {billingType === "CREDIT_CARD" ? <CreditCardForm form={form} /> : null}

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : actionMode === "PAY" ? (
                        "Pagar fatura"
                      ) : (
                        "Confirmar alteracao"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActionMode("IDLE")}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : null}

        {result?.billingType === "PIX" ? (
          <PixPaymentView
            pixQrCodeBase64={result.pixQrCodeBase64}
            pixPayload={result.pixPayload}
            onCopyPix={() => handleCopyText(result.pixPayload, "Codigo PIX")}
          />
        ) : null}

        {result?.billingType === "BOLETO" ? (
          <BoletoPaymentView
            bankSlipUrl={result.bankSlipUrl}
            boletoIdentificationField={result.boletoIdentificationField}
            boletoBarCode={result.boletoBarCode}
            boletoNossoNumero={result.boletoNossoNumero}
          />
        ) : null}

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Historico de pagamentos</CardTitle>
            <CardDescription>
              Consulte os pagamentos gerados e abra detalhes para pagar quando necessario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!orderedHistory.length ? (
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
            ) : (
              orderedHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(payment.amountCents)}  -  {payment.billingType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {payment.status}  -  Competencia:{" "}
                      {formatReferenceMonth(payment.referenceMonth)}  -  Vencimento:{" "}
                      {formatDate(payment.dueDate)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedPayment(payment)}
                    aria-label="Ver detalhes do pagamento"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Dialog
          open={!!selectedPayment}
          onOpenChange={(open) => {
            if (!open) setSelectedPayment(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do pagamento</DialogTitle>
              <DialogDescription>
                Acompanhe os dados de cobranca e use os atalhos para concluir o pagamento.
              </DialogDescription>
            </DialogHeader>

            {selectedPayment ? (
              <div className="space-y-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <strong>Valor:</strong> {formatCurrency(selectedPayment.amountCents)}
                  </p>
                  <p>
                    <strong>Metodo:</strong> {selectedPayment.billingType}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedPayment.status}
                  </p>
                  <p>
                    <strong>ID pagamento:</strong>{" "}
                    {selectedPayment.asaasPaymentId || selectedPayment.id}
                  </p>
                  <p>
                    <strong>Vencimento:</strong> {formatDate(selectedPayment.dueDate)}
                  </p>
                  <p>
                    <strong>Competencia:</strong>{" "}
                    {formatReferenceMonth(selectedPayment.referenceMonth)}
                  </p>
                  <p>
                    <strong>Gerado em:</strong>{" "}
                    {formatDate(selectedPayment.createdAt || selectedPayment.updatedAt)}
                  </p>
                </div>

                {selectedPayment.billingType === "PIX" ? (
                  <PixPaymentView
                    pixQrCodeBase64={selectedPayment.pixQrCodeBase64}
                    pixPayload={selectedPayment.pixPayload}
                    onCopyPix={() =>
                      handleCopyText(selectedPayment.pixPayload, "Codigo PIX")
                    }
                  />
                ) : null}

                {selectedPayment.billingType === "BOLETO" ? (
                  <BoletoPaymentView
                    bankSlipUrl={selectedPayment.bankSlipUrl}
                    boletoIdentificationField={selectedPayment.boletoIdentificationField}
                    boletoBarCode={selectedPayment.boletoBarCode}
                    boletoNossoNumero={selectedPayment.boletoNossoNumero}
                  />
                ) : null}

                {selectedPayment.invoiceUrl ? (
                  <Button type="button" variant="outline" asChild>
                    <a href={selectedPayment.invoiceUrl} target="_blank" rel="noreferrer">
                      Abrir fatura
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {result?.billingType === "CREDIT_CARD" && lastCardDigits ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Ultima confirmacao em cartao</CardTitle>
            </CardHeader>
              <CardContent className="space-y-2 text-sm text-foreground">
                <p>
                  <strong>Status do plano:</strong> {result.status}
                </p>
                <p>
                  <strong>Pagamento:</strong> {getCurrentPaymentStatus(result) || "N/A"}
                </p>
              <p>
                <strong>Cartao:</strong> final {lastCardDigits}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </MainLayout>
  );
}


