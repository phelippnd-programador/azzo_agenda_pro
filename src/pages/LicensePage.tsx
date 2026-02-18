import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckBig, Clock3, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { CreateBillingSubscriptionResponse } from "@/types/billing";
import {
  createBillingSubscription,
  getBillingErrorMessage,
  getCurrentBillingSubscription,
} from "@/services/billingService";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { useCheckoutProducts } from "@/hooks/useCheckoutProducts";

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
  return value.replace(/\D/g, "");
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

function isOverdue(result: CreateBillingSubscriptionResponse) {
  const subscriptionStatus = String(result.status || "").toUpperCase();
  const paymentStatus = String(result.paymentStatus || "").toUpperCase();

  if (subscriptionStatus === "OVERDUE" || paymentStatus === "OVERDUE") return true;
  if (!result.nextDueDate) return false;

  const dueDate = new Date(result.nextDueDate);
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
  const normalizedStatus = String(result.status).toUpperCase();
  const normalizedPayment = String(result.paymentStatus || "").toUpperCase();
  const isActive =
    normalizedStatus === "ACTIVE" ||
    normalizedPayment === "CONFIRMED" ||
    normalizedPayment === "RECEIVED";

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

export default function LicensePage() {
  const { user } = useAuth();
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
    if (!plans.length) return;
    if (form.getValues("planCode")) return;
    form.setValue("planCode", plans[0].code, { shouldValidate: true });
  }, [form, plans]);

  const loadCurrentSubscription = useCallback(async () => {
    try {
      setFetchError(null);
      const current = await getCurrentBillingSubscription();
      setResult(current);
      if (current.planCode) {
        form.setValue("planCode", current.planCode);
      }
      if (current.billingType) {
        form.setValue("billingType", current.billingType);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setResult(null);
        return;
      }
      setFetchError(getBillingErrorMessage(error));
    }
  }, [form]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoadingCurrent(true);
      await loadCurrentSubscription();
      if (mounted) setIsLoadingCurrent(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [loadCurrentSubscription]);

  const billingType = form.watch("billingType");
  const selectedPlanCode = form.watch("planCode");
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === selectedPlanCode) ?? null,
    [plans, selectedPlanCode]
  );
  const managedPlan = useMemo(
    () => plans.find((plan) => plan.code === result?.planCode) ?? null,
    [plans, result?.planCode]
  );
  const hasOverdue = useMemo(() => (result ? isOverdue(result) : false), [result]);
  const licenseState = useMemo(
    () => (result ? resolveLicenseState(result) : null),
    [result]
  );

  const canPayNow = useMemo(() => {
    if (!result) return false;
    const subStatus = String(result.status || "").toUpperCase();
    const payStatus = String(result.paymentStatus || "").toUpperCase();
    return (
      hasOverdue ||
      subStatus === "PENDING" ||
      subStatus === "OVERDUE" ||
      payStatus === "PENDING" ||
      payStatus === "OVERDUE"
    );
  }, [result, hasOverdue]);

  const openPayNow = () => {
    if (!result) return;
    if (result.planCode) form.setValue("planCode", result.planCode);
    if (result.billingType) form.setValue("billingType", result.billingType);
    setActionMode("PAY");
  };

  const openChangePlan = () => {
    setActionMode("CHANGE");
  };

  const refreshStatus = async () => {
    try {
      setIsRefreshing(true);
      await loadCurrentSubscription();
      toast.success("Status da assinatura atualizado.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyPix = async () => {
    const payload = result?.pixPayload;
    if (!payload) {
      toast.error("Codigo PIX indisponivel.");
      return;
    }

    try {
      await navigator.clipboard.writeText(payload);
      toast.success("Codigo PIX copiado.");
    } catch {
      toast.error("Nao foi possivel copiar automaticamente.");
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const targetPlanCode =
      actionMode === "PAY"
        ? result?.planCode || managedPlan?.code || selectedPlan?.code
        : selectedPlan?.code;

    if (!targetPlanCode) {
      toast.error("Nenhum plano disponivel para pagamento no momento.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        planCode: targetPlanCode,
        billingType: values.billingType,
        cpfCnpj: toDigits(values.cpfCnpj),
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
      await loadCurrentSubscription();
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
              <p className="text-sm text-slate-600">Carregando planos...</p>
            ) : null}
            {plansError ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertTitle>Falha ao carregar planos</AlertTitle>
                <AlertDescription>{plansError}</AlertDescription>
              </Alert>
            ) : null}
            {isLoadingCurrent ? (
              <p className="text-sm text-slate-600">Carregando status da assinatura...</p>
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
                <strong>Pagamento:</strong> {result?.paymentStatus || "Nao informado"}
              </p>
              <p>
                <strong>Proximo vencimento:</strong> {formatDate(result?.nextDueDate)}
              </p>
              <p>
                <strong>Metodo atual:</strong> {result?.billingType || "Nao informado"}
              </p>
            </div>

            <Badge
              variant={!result ? "secondary" : hasOverdue ? "destructive" : "outline"}
              className={result && !hasOverdue ? "border-emerald-500 text-emerald-700" : ""}
            >
              {!result
                ? "Sem assinatura"
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
              <Button type="button" variant="outline" onClick={openChangePlan}>
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
                    Atualizar dados
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
                    : "border-amber-300 bg-amber-50"
                }
              >
                <div className="flex items-start gap-2">
                  {licenseState.variant === "active" ? (
                    <CircleCheckBig className="mt-0.5 h-4 w-4 text-emerald-700" />
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
                <Card className="border-slate-200">
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
                            <Input placeholder="Somente numeros" {...field} />
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
            onCopyPix={handleCopyPix}
          />
        ) : null}

        {result?.billingType === "BOLETO" ? (
          <BoletoPaymentView bankSlipUrl={result.bankSlipUrl} />
        ) : null}

        {result?.billingType === "CREDIT_CARD" && lastCardDigits ? (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Ultima confirmacao em cartao</CardTitle>
            </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>
                  <strong>Status do plano:</strong> {result.status}
                </p>
                <p>
                  <strong>Pagamento:</strong> {result.paymentStatus || "N/A"}
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
