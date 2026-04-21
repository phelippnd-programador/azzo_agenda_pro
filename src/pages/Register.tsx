import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandLockup } from "@/components/common/BrandLockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LegalDocumentDialog } from "@/components/register/LegalDocumentDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, publicLegalApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { maskCpfCnpj, maskPhoneBr } from "@/lib/input-masks";
import { registerSchema, type RegisterForm } from "@/schemas/auth";
import type { LegalDocumentResponse, TermsDocumentType } from "@/types/terms";
import { toast } from "sonner";

const getPasswordStrengthStatus = (value: string) => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (score <= 2) {
    return { label: "Fraca", width: "33%", barClassName: "bg-red-600", textClassName: "text-red-700" };
  }
  if (score <= 4) {
    return { label: "Media", width: "66%", barClassName: "bg-amber-500", textClassName: "text-amber-700" };
  }
  return { label: "Forte", width: "100%", barClassName: "bg-emerald-600", textClassName: "text-emerald-700" };
};

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsOfUseVersion, setTermsOfUseVersion] = useState("");
  const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState("");
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalType, setLegalType] = useState<TermsDocumentType>("TERMS_OF_USE");
  const [legalDocument, setLegalDocument] = useState<LegalDocumentResponse | null>(null);
  const [isLoadingLegal, setIsLoadingLegal] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      salonName: "",
      phone: "",
      cpfCnpj: "",
      acceptedLegalTerms: false,
    },
  });

  const watchedPassword = form.watch("password");
  const watchedAcceptedLegalTerms = form.watch("acceptedLegalTerms");
  const watchedPhone = form.watch("phone");
  const watchedCpfCnpj = form.watch("cpfCnpj");
  const passwordStrength = getPasswordStrengthStatus(watchedPassword || "");
  const errors = form.formState.errors;

  useEffect(() => {
    const loadLegalVersions = async () => {
      try {
        const legal = await publicLegalApi.getAll();
        setTermsOfUseVersion(legal.termsOfUse?.version || "");
        setPrivacyPolicyVersion(legal.privacyPolicy?.version || "");
      } catch {
        setTermsOfUseVersion("");
        setPrivacyPolicyVersion("");
      }
    };
    void loadLegalVersions();
  }, []);

  const handleNextStep = async () => {
    const isValid = await form.trigger([
      "name",
      "email",
      "password",
      "confirmPassword",
      "acceptedLegalTerms",
    ]);
    if (!isValid) {
      const firstError = Object.values(form.formState.errors)[0];
      if (firstError?.message) toast.error(firstError.message);
      return;
    }
    setStep(2);
  };

  const onSubmit = form.handleSubmit(
    async (values) => {
      const cpfCnpjDigits = values.cpfCnpj.replace(/\D/g, "");
      if (!termsOfUseVersion || !privacyPolicyVersion) {
        toast.error("Nao foi possivel carregar a versao dos termos legais.");
        return;
      }
      setIsLoading(true);
      try {
        await register({
          name: values.name,
          email: values.email,
          password: values.password,
          salonName: values.salonName,
          phone: values.phone,
          cpfCnpj: cpfCnpjDigits,
          acceptedTermsOfUse: true,
          acceptedPrivacyPolicy: true,
          termsOfUseVersion,
          privacyPolicyVersion,
        });
        toast.success("Conta criada com sucesso!");
        navigate("/", { replace: true });
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          toast.error("Muitas tentativas. Aguarde um momento e tente novamente.");
        } else {
          toast.error(resolveUiError(error, "Erro ao criar conta. Tente novamente.").message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    (errors) => {
      const firstError = Object.values(errors)[0];
      if (firstError?.message) toast.error(firstError.message);
    },
  );

  const openLegalDialog = async (type: TermsDocumentType) => {
    try {
      setIsLegalOpen(true);
      setIsLoadingLegal(true);
      setLegalError(null);
      setLegalType(type);
      const data =
        type === "PRIVACY_POLICY"
          ? await publicLegalApi.getPrivacyPolicy()
          : await publicLegalApi.getTermsOfUse();
      setLegalDocument(data);
    } catch (error) {
      setLegalError(resolveUiError(error, "Nao foi possivel carregar o documento.").message);
      setLegalDocument(null);
    } finally {
      setIsLoadingLegal(false);
    }
  };

  return (
    <div className="auth-shell flex items-start justify-center sm:items-center">
      <div className="relative z-10 w-full max-w-md pt-2 sm:pt-0">
        <div className="mb-6 space-y-3 text-center sm:mb-8">
          <p className="section-eyebrow">Comeco guiado</p>
          <BrandLockup className="justify-center" />
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
            Crie sua conta em duas etapas e chegue rapido ao ambiente real de operacao.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium tracking-wide text-primary">
              Cadastro guiado
            </span>
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground">
              Dados claros
            </span>
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground">
              Termos visiveis
            </span>
          </div>
        </div>

        <Card className="auth-panel border-border/80">
          <CardHeader className="text-center pb-2 sm:pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight sm:text-[2.1rem]">
              Crie sua conta
            </CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-[15px]">
              {step === 1 ? "Seus dados pessoais e termos legais" : "Dados do seu salao"}
            </CardDescription>
            <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <div className={`h-1 w-16 rounded sm:w-12 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {step === 1 ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                  <p className="text-sm font-medium text-foreground">Primeiro configuramos seu acesso.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Depois voce informa os dados do salao e ja entra no ambiente principal com a conta pronta.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">
                    Nome completo
                  </Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    autoComplete="name"
                    autoFocus
                    {...form.register("name")}
                    className="h-10 sm:h-11"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "register-name-error" : undefined}
                  />
                  {errors.name ? (
                    <p id="register-name-error" className="text-xs text-destructive" aria-live="polite">
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    {...form.register("email")}
                    className="h-10 sm:h-11"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "register-email-error" : undefined}
                  />
                  {errors.email ? (
                    <p id="register-email-error" className="text-xs text-destructive" aria-live="polite">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimo 8 caracteres"
                      autoComplete="new-password"
                      {...form.register("password")}
                      className="h-10 sm:h-11 pr-10"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby="register-password-strength register-password-storage register-password-error"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded bg-muted">
                      <div
                        className={`h-full rounded transition-all ${
                          watchedPassword
                            ? passwordStrength.barClassName
                            : "bg-muted-foreground/40"
                        }`}
                        style={{ width: watchedPassword ? passwordStrength.width : "0%" }}
                      />
                    </div>
                    <p
                      id="register-password-strength"
                      className={`text-xs ${
                        watchedPassword
                          ? passwordStrength.textClassName
                          : "text-muted-foreground"
                      }`}
                    >
                      Seguranca da senha:{" "}
                      {watchedPassword ? passwordStrength.label : "Nao definida"}
                    </p>
                    <p id="register-password-storage" className="text-xs text-muted-foreground">
                      Sua senha e usada apenas para autenticar a conta e nao fica salva no navegador.
                    </p>
                    {errors.password ? (
                      <p id="register-password-error" className="text-xs text-destructive" aria-live="polite">
                        {errors.password.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">
                    Confirmar senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    {...form.register("confirmPassword")}
                    className="h-10 sm:h-11"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
                  />
                  {errors.confirmPassword ? (
                    <p
                      id="register-confirm-password-error"
                      className="text-xs text-destructive"
                      aria-live="polite"
                    >
                      {errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-start gap-2 rounded-md border border-input p-3">
                  <Checkbox
                    id="acceptLegalTerms"
                    checked={watchedAcceptedLegalTerms}
                    onCheckedChange={(checked) =>
                      form.setValue("acceptedLegalTerms", Boolean(checked), {
                        shouldValidate: true,
                      })
                    }
                    aria-invalid={Boolean(errors.acceptedLegalTerms)}
                    aria-describedby={errors.acceptedLegalTerms ? "register-legal-error" : undefined}
                  />
                  <Label
                    htmlFor="acceptLegalTerms"
                    className="text-xs leading-relaxed text-muted-foreground"
                  >
                    Li e aceito os{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => void openLegalDialog("TERMS_OF_USE")}
                    >
                      Termos de Uso
                    </button>{" "}
                    e a{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => void openLegalDialog("PRIVACY_POLICY")}
                    >
                      Politica de Privacidade
                    </button>
                    .
                  </Label>
                </div>
                {errors.acceptedLegalTerms ? (
                  <p id="register-legal-error" className="text-xs text-destructive" aria-live="polite">
                    {errors.acceptedLegalTerms.message}
                  </p>
                ) : null}

                <Button
                  type="button"
                  className="w-full h-10 sm:h-11"
                  onClick={() => void handleNextStep()}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Na proxima etapa voce informa apenas nome do salao, telefone e CPF/CNPJ.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        Conta em preparacao
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {form.getValues("name") || "Responsavel"} · {form.getValues("email") || "E-mail"}
                      </p>
                    </div>
                    <span className="rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-[11px] font-medium text-primary">
                      Etapa final
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salonName" className="text-sm">
                    Nome do Salao
                  </Label>
                  <Input
                    id="salonName"
                    placeholder="Ex: Bella Studio"
                    autoComplete="organization"
                    {...form.register("salonName")}
                    disabled={isLoading}
                    className="h-10 sm:h-11"
                    aria-invalid={Boolean(errors.salonName)}
                    aria-describedby={errors.salonName ? "register-salon-name-error" : undefined}
                  />
                  {errors.salonName ? (
                    <p id="register-salon-name-error" className="text-xs text-destructive" aria-live="polite">
                      {errors.salonName.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">
                    Telefone / WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-0000"
                    autoComplete="tel"
                    value={watchedPhone}
                    onChange={(e) =>
                      form.setValue("phone", maskPhoneBr(e.target.value), {
                        shouldValidate: true,
                      })
                    }
                    disabled={isLoading}
                    className="h-10 sm:h-11"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "register-phone-error" : undefined}
                  />
                  {errors.phone ? (
                    <p id="register-phone-error" className="text-xs text-destructive" aria-live="polite">
                      {errors.phone.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj" className="text-sm">
                    CPF/CNPJ
                  </Label>
                  <Input
                    id="cpfCnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={watchedCpfCnpj}
                    onChange={(e) =>
                      form.setValue("cpfCnpj", maskCpfCnpj(e.target.value), {
                        shouldValidate: true,
                      })
                    }
                    disabled={isLoading}
                    className="h-10 sm:h-11"
                    aria-invalid={Boolean(errors.cpfCnpj)}
                    aria-describedby={errors.cpfCnpj ? "register-cpf-cnpj-error" : undefined}
                  />
                  {errors.cpfCnpj ? (
                    <p id="register-cpf-cnpj-error" className="text-xs text-destructive" aria-live="polite">
                      {errors.cpfCnpj.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full sm:h-11 sm:flex-1"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 w-full sm:h-11 sm:flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground" aria-live="polite">
                  {isLoading
                    ? "Criando sua conta e preparando o primeiro acesso..."
                    : "Depois do envio, voce entra no fluxo principal sem precisar repetir o cadastro."}
                </p>
              </form>
            )}

            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">
              Ja tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:opacity-90 font-medium">
                Faca login
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground sm:mt-6">
          Ao criar sua conta, voce concorda com nossos{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => void openLegalDialog("TERMS_OF_USE")}
          >
            Termos de Uso
          </button>{" "}
          e{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => void openLegalDialog("PRIVACY_POLICY")}
          >
            Politica de Privacidade
          </button>
        </p>
      </div>

      <LegalDocumentDialog
        open={isLegalOpen}
        onOpenChange={setIsLegalOpen}
        legalType={legalType}
        legalDocument={legalDocument}
        isLoadingLegal={isLoadingLegal}
        legalError={legalError}
      />
    </div>
  );
}
