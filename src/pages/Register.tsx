import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, Scissors } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, publicLegalApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { maskCpfCnpj, maskPhoneBr } from "@/lib/input-masks";
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
    return { label: "Fraca", width: "33%", barClassName: "bg-red-500", textClassName: "text-red-600" };
  }
  if (score <= 4) {
    return { label: "Media", width: "66%", barClassName: "bg-amber-500", textClassName: "text-amber-600" };
  }
  return { label: "Forte", width: "100%", barClassName: "bg-emerald-500", textClassName: "text-emerald-600" };
};

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [acceptedLegalTerms, setAcceptedLegalTerms] = useState(false);
  const [termsOfUseVersion, setTermsOfUseVersion] = useState("");
  const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState("");
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalType, setLegalType] = useState<TermsDocumentType>("TERMS_OF_USE");
  const [legalDocument, setLegalDocument] = useState<LegalDocumentResponse | null>(null);
  const [isLoadingLegal, setIsLoadingLegal] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);

  const passwordStrength = getPasswordStrengthStatus(password);

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

  const handleNextStep = () => {
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas nao conferem");
      return;
    }
    if (!acceptedLegalTerms) {
      toast.error("Voce precisa aceitar os Termos de Uso e a Politica de Privacidade");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cpfCnpjDigits = cpfCnpj.replace(/\D/g, "");
    if (!salonName || !phone || !cpfCnpjDigits) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (![11, 14].includes(cpfCnpjDigits.length)) {
      toast.error("Informe um CPF ou CNPJ valido");
      return;
    }
    if (!termsOfUseVersion || !privacyPolicyVersion) {
      toast.error("Nao foi possivel carregar a versao dos termos legais.");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name,
        email,
        password,
        salonName,
        phone,
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
        const uiError = resolveUiError(error, "Erro ao criar conta. Tente novamente.");
        toast.error(uiError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
      const uiError = resolveUiError(error, "Nao foi possivel carregar o documento.");
      setLegalError(uiError.message);
      setLegalDocument(null);
    } finally {
      setIsLoadingLegal(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-card p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Azzo</h1>
            <p className="text-xs sm:text-sm text-primary font-medium -mt-1">Agenda Pro</p>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl">Crie sua conta</CardTitle>
            <CardDescription className="text-sm">
              {step === 1 ? "Seus dados pessoais" : "Dados do seu salao"}
            </CardDescription>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <div className={`w-12 h-1 rounded ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
                  <Label htmlFor="name" className="text-sm">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 sm:h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
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
                          password ? passwordStrength.barClassName : "bg-muted-foreground/40"
                        }`}
                        style={{ width: password ? passwordStrength.width : "0%" }}
                      />
                    </div>
                    <p className={`text-xs ${password ? passwordStrength.textClassName : "text-muted-foreground"}`}>
                      Seguranca da senha: {password ? passwordStrength.label : "Nao definida"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="flex items-start gap-2 rounded-md border border-input p-3">
                  <Checkbox
                    id="acceptLegalTerms"
                    checked={acceptedLegalTerms}
                    onCheckedChange={(checked) => setAcceptedLegalTerms(Boolean(checked))}
                  />
                  <Label htmlFor="acceptLegalTerms" className="text-xs leading-relaxed text-muted-foreground">
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

                <Button type="button" className="w-full h-10 sm:h-11" onClick={handleNextStep}>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salonName" className="text-sm">Nome do Salao</Label>
                  <Input
                    id="salonName"
                    placeholder="Ex: Bella Studio"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    disabled={isLoading}
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">Telefone / WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-0000"
                    value={phone}
                    onChange={(e) => setPhone(maskPhoneBr(e.target.value))}
                    disabled={isLoading}
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj" className="text-sm">CPF/CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
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
                  <Button type="submit" className="flex-1 h-10 sm:h-11" disabled={isLoading}>
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
          </button>
          {" "}e{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => void openLegalDialog("PRIVACY_POLICY")}
          >
            Politica de Privacidade
          </button>
        </p>
      </div>

      <Dialog open={isLegalOpen} onOpenChange={setIsLegalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {legalDocument?.title ||
                (legalType === "PRIVACY_POLICY" ? "Politica de Privacidade" : "Termos de Uso")}
            </DialogTitle>
          </DialogHeader>
          {isLoadingLegal ? (
            <p className="text-sm text-muted-foreground">Carregando documento...</p>
          ) : legalError ? (
            <p className="text-sm text-destructive">{legalError}</p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>Versao: {legalDocument?.version || "-"}</p>
                <p>
                  Publicado em:{" "}
                  {legalDocument?.createdAt
                    ? new Date(legalDocument.createdAt).toLocaleString("pt-BR")
                    : "-"}
                </p>
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {legalDocument?.content || "Documento indisponivel no momento."}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
