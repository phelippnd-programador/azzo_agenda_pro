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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-card p-4">
      <div className="w-full max-w-md">
        <BrandLockup className="mb-6 sm:mb-8" />

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2 sm:pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
              Crie sua conta
            </CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-[15px]">
              {step === 1 ? "Seus dados pessoais" : "Dados do seu salao"}
            </CardDescription>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <div className={`w-12 h-1 rounded ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
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
                  />
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
                  />
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
                      className={`text-xs ${
                        watchedPassword
                          ? passwordStrength.textClassName
                          : "text-muted-foreground"
                      }`}
                    >
                      Seguranca da senha:{" "}
                      {watchedPassword ? passwordStrength.label : "Nao definida"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sua senha e usada apenas para autenticar a conta e nao fica salva no navegador.
                    </p>
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
                  />
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

                <Button
                  type="button"
                  className="w-full h-10 sm:h-11"
                  onClick={() => void handleNextStep()}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
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
                  />
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
                  />
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
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 sm:h-11"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-10 sm:h-11"
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

        <p className="text-center text-xs text-muted-foreground mt-4 sm:mt-6">
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
