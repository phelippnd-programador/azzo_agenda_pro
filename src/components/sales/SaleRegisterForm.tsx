import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SalesSection } from '@/components/sales/SalesSection';
import { useCheckoutProducts } from '@/hooks/useCheckoutProducts';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, publicLegalApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { maskCpfCnpj, maskPhoneBr } from '@/lib/input-masks';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { toast } from 'sonner';

type SaleRegisterErrors = {
  accountName?: string;
  accountEmail?: string;
  accountPassword?: string;
  accountConfirmPassword?: string;
  acceptedLegalTerms?: string;
  accountSalonName?: string;
  accountPhone?: string;
  accountCpfCnpj?: string;
};

function getPasswordStrengthStatus(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (score <= 2) {
    return {
      label: 'Fraca',
      width: '33%',
      barClassName: 'bg-red-600',
      textClassName: 'text-red-700',
    };
  }
  if (score <= 4) {
    return {
      label: 'Media',
      width: '66%',
      barClassName: 'bg-amber-500',
      textClassName: 'text-amber-700',
    };
  }
  return {
    label: 'Forte',
    width: '100%',
    barClassName: 'bg-emerald-600',
    textClassName: 'text-emerald-700',
  };
}

export function SaleRegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { products } = useCheckoutProducts();
  const effectiveProductId = products[0]?.id ?? '';

  const [step, setStep] = useState<1 | 2>(1);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [accountSalonName, setAccountSalonName] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [accountCpfCnpj, setAccountCpfCnpj] = useState('');
  const [acceptedLegalTerms, setAcceptedLegalTerms] = useState(false);
  const [termsOfUseVersion, setTermsOfUseVersion] = useState('');
  const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState('');
  const [errors, setErrors] = useState<SaleRegisterErrors>({});

  const passwordStrength = useMemo(() => getPasswordStrengthStatus(accountPassword), [accountPassword]);

  useEffect(() => {
    const load = async () => {
      try {
        const legal = await publicLegalApi.getAll();
        setTermsOfUseVersion(legal.termsOfUse?.version || '');
        setPrivacyPolicyVersion(legal.privacyPolicy?.version || '');
      } catch {
        setTermsOfUseVersion('');
        setPrivacyPolicyVersion('');
      }
    };
    void load();
  }, []);

  const validateStepOne = () => {
    const nextErrors: SaleRegisterErrors = {};

    if (!accountName.trim()) nextErrors.accountName = 'Informe seu nome completo.';
    if (!accountEmail.trim()) nextErrors.accountEmail = 'Informe um e-mail valido.';
    if (!accountPassword.trim()) nextErrors.accountPassword = 'Informe uma senha.';
    if (!accountConfirmPassword.trim()) nextErrors.accountConfirmPassword = 'Confirme a senha.';
    if (!acceptedLegalTerms) nextErrors.acceptedLegalTerms = 'Voce precisa aceitar os termos para continuar.';

    if (accountPassword.trim() && accountPassword.trim().length < 8) {
      nextErrors.accountPassword = 'A senha deve ter pelo menos 8 caracteres.';
    }
    if (
      accountPassword.trim() &&
      accountConfirmPassword.trim() &&
      accountPassword.trim() !== accountConfirmPassword.trim()
    ) {
      nextErrors.accountConfirmPassword = 'As senhas nao conferem.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors((current) => ({ ...current, ...nextErrors }));
      toast.error('Preencha nome, e-mail e senha para continuar.');
      return false;
    }

    setErrors((current) => ({
      ...current,
      accountName: undefined,
      accountEmail: undefined,
      accountPassword: undefined,
      accountConfirmPassword: undefined,
      acceptedLegalTerms: undefined,
    }));
    return true;
  };

  const handleNextStep = () => {
    if (!validateStepOne()) return;
    trackMarketingEvent('sale_signup_step_advanced', {
      step: 1,
      nextStep: 2,
    });
    setStep(2);
  };

  const handleCreateAccount = async () => {
    const cpfCnpjDigits = accountCpfCnpj.replace(/\D/g, '');
    if (!validateStepOne()) return;
    const nextErrors: SaleRegisterErrors = {};
    if (!accountSalonName.trim()) nextErrors.accountSalonName = 'Informe o nome do salao.';
    if (!accountPhone.trim()) nextErrors.accountPhone = 'Informe telefone ou WhatsApp.';
    if (!cpfCnpjDigits) {
      nextErrors.accountCpfCnpj = 'Informe um CPF ou CNPJ valido.';
    } else if (![11, 14].includes(cpfCnpjDigits.length)) {
      nextErrors.accountCpfCnpj = 'Informe um CPF ou CNPJ valido.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors((current) => ({ ...current, ...nextErrors }));
      toast.error('Informe os dados do salao para concluir a criacao da conta.');
      return;
    }

    setErrors((current) => ({
      ...current,
      accountSalonName: undefined,
      accountPhone: undefined,
      accountCpfCnpj: undefined,
    }));
    if (!termsOfUseVersion || !privacyPolicyVersion) {
      toast.error('Nao foi possivel carregar as versoes dos termos legais.');
      return;
    }

    setIsCreatingAccount(true);
    try {
      await register({
        name: accountName.trim(),
        email: accountEmail.trim(),
        password: accountPassword.trim(),
        salonName: accountSalonName.trim(),
        phone: accountPhone.trim(),
        cpfCnpj: cpfCnpjDigits,
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
        termsOfUseVersion,
        privacyPolicyVersion,
      });
      toast.success('Conta criada! Continue com o pagamento do plano.');
      trackMarketingEvent('sale_signup_completed', {
        productId: effectiveProductId || null,
        step: 2,
      });
      const planQuery = effectiveProductId
        ? `?plan=${encodeURIComponent(effectiveProductId)}&mode=CHANGE`
        : '';
      navigate(`/financeiro/licenca${planQuery}`, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        toast.error('Muitas tentativas. Aguarde um momento e tente novamente.');
      } else {
        toast.error(resolveUiError(error, 'Nao foi possivel criar sua conta agora.').message);
      }
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleCreateAccount();
  };

  return (
    <SalesSection id="cadastro" className="bg-card">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 text-center md:mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Comece agora em 2 passos
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
            Ative seu teste e siga para o plano sem friccao
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Primeiro criamos seu acesso. Depois voce informa os dados do salao e segue para escolher o plano.
          </p>
        </header>

        <Card className="border-2 border-primary/15 shadow-panel">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-[1.5rem] border border-primary/10 bg-primary/5 px-4 py-3 sm:w-auto sm:max-w-none sm:flex-row sm:rounded-full sm:py-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    step === 1 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                  }`}
                >
                  1
                </div>
                <span className="text-sm font-medium text-foreground">Acesso</span>
                <div className={`h-1 w-full max-w-[3.5rem] rounded-full ${step === 2 ? 'bg-primary' : 'bg-primary/10'}`} />
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    step === 2 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                  }`}
                >
                  2
                </div>
                <span className="text-sm font-medium text-foreground">Salao</span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {step === 1 ? 'Passo 1 de 2' : 'Passo 2 de 2'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step === 1
                    ? 'Crie seu acesso com o minimo necessario para seguir.'
                    : 'Agora informe os dados do salao para concluir a criacao da conta.'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sale-account-name">Nome completo</Label>
                  <Input
                    id="sale-account-name"
                    data-sale-register-focus="true"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value);
                      if (errors.accountName) setErrors((current) => ({ ...current, accountName: undefined }));
                    }}
                    placeholder="Seu nome"
                    disabled={isCreatingAccount}
                    aria-invalid={Boolean(errors.accountName)}
                  />
                  {errors.accountName ? <p className="text-xs text-destructive">{errors.accountName}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-account-email">E-mail</Label>
                  <Input
                    id="sale-account-email"
                    type="email"
                    value={accountEmail}
                    onChange={(e) => {
                      setAccountEmail(e.target.value);
                      if (errors.accountEmail) setErrors((current) => ({ ...current, accountEmail: undefined }));
                    }}
                    placeholder="seu@email.com"
                    disabled={isCreatingAccount}
                    aria-invalid={Boolean(errors.accountEmail)}
                  />
                  {errors.accountEmail ? <p className="text-xs text-destructive">{errors.accountEmail}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-account-password">Senha</Label>
                  <Input
                    id="sale-account-password"
                    type="password"
                    value={accountPassword}
                    onChange={(e) => {
                      setAccountPassword(e.target.value);
                      if (errors.accountPassword) setErrors((current) => ({ ...current, accountPassword: undefined }));
                    }}
                    placeholder="Minimo 8 caracteres"
                    disabled={isCreatingAccount}
                    aria-invalid={Boolean(errors.accountPassword)}
                  />
                  {errors.accountPassword ? (
                    <p className="text-xs text-destructive">{errors.accountPassword}</p>
                  ) : null}
                  {accountPassword ? (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded bg-muted">
                        <div
                          className={`h-full rounded transition-all ${passwordStrength.barClassName}`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <p className={`text-xs ${passwordStrength.textClassName}`}>
                        Seguranca da senha: {passwordStrength.label}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-account-confirm-password">Confirmar senha</Label>
                  <Input
                    id="sale-account-confirm-password"
                    type="password"
                    value={accountConfirmPassword}
                    onChange={(e) => {
                      setAccountConfirmPassword(e.target.value);
                      if (errors.accountConfirmPassword) {
                        setErrors((current) => ({ ...current, accountConfirmPassword: undefined }));
                      }
                    }}
                    placeholder="Repita a senha"
                    disabled={isCreatingAccount}
                    aria-invalid={Boolean(errors.accountConfirmPassword)}
                  />
                  {errors.accountConfirmPassword ? (
                    <p className="text-xs text-destructive">{errors.accountConfirmPassword}</p>
                  ) : null}
                </div>

                {step === 2 ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="sale-account-phone">Telefone / WhatsApp</Label>
                      <Input
                        id="sale-account-phone"
                        value={accountPhone}
                        onChange={(e) => {
                          setAccountPhone(maskPhoneBr(e.target.value));
                          if (errors.accountPhone) setErrors((current) => ({ ...current, accountPhone: undefined }));
                        }}
                        placeholder="(11) 99999-0000"
                        disabled={isCreatingAccount}
                        aria-invalid={Boolean(errors.accountPhone)}
                      />
                      {errors.accountPhone ? <p className="text-xs text-destructive">{errors.accountPhone}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sale-account-salon">Nome do salao</Label>
                      <Input
                        id="sale-account-salon"
                        value={accountSalonName}
                        onChange={(e) => {
                          setAccountSalonName(e.target.value);
                          if (errors.accountSalonName) {
                            setErrors((current) => ({ ...current, accountSalonName: undefined }));
                          }
                        }}
                        placeholder="Ex.: Bella Studio"
                        disabled={isCreatingAccount}
                        aria-invalid={Boolean(errors.accountSalonName)}
                      />
                      {errors.accountSalonName ? (
                        <p className="text-xs text-destructive">{errors.accountSalonName}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="sale-account-cpf-cnpj">CPF/CNPJ</Label>
                      <Input
                        id="sale-account-cpf-cnpj"
                        value={accountCpfCnpj}
                        onChange={(e) => {
                          setAccountCpfCnpj(maskCpfCnpj(e.target.value));
                          if (errors.accountCpfCnpj) {
                            setErrors((current) => ({ ...current, accountCpfCnpj: undefined }));
                          }
                        }}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        disabled={isCreatingAccount}
                        aria-invalid={Boolean(errors.accountCpfCnpj)}
                      />
                      {errors.accountCpfCnpj ? (
                        <p className="text-xs text-destructive">{errors.accountCpfCnpj}</p>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="flex items-start gap-2 rounded-md border border-input p-3">
                <Checkbox
                  id="sale-accept-legal-terms"
                  checked={acceptedLegalTerms}
                  onCheckedChange={(checked) => {
                    setAcceptedLegalTerms(Boolean(checked));
                    if (errors.acceptedLegalTerms) {
                      setErrors((current) => ({ ...current, acceptedLegalTerms: undefined }));
                    }
                  }}
                />
                <Label htmlFor="sale-accept-legal-terms" className="text-xs leading-relaxed text-muted-foreground">
                  Li e aceito os{' '}
                  <Link to="/termos-de-uso" target="_blank" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link to="/politica-privacidade" target="_blank" className="text-primary hover:underline">
                    Politica de Privacidade
                  </Link>
                  .
                </Label>
              </div>
              {errors.acceptedLegalTerms ? (
                <p className="text-xs text-destructive">{errors.acceptedLegalTerms}</p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                {step === 2 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="sm:flex-1"
                    onClick={() => setStep(1)}
                    disabled={isCreatingAccount}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                ) : null}

                <Button
                  type={step === 1 ? 'button' : 'submit'}
                  size="lg"
                  className="w-full text-base sm:flex-1"
                  disabled={isCreatingAccount}
                  onClick={step === 1 ? handleNextStep : undefined}
                >
                  {step === 1 ? (
                    <>
                      Continuar para dados do salao
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : isCreatingAccount ? (
                    'Criando sua conta...'
                  ) : (
                    <>
                      Criar minha conta gratuitamente
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-col items-start gap-2 pt-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-5 sm:gap-y-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Dados protegidos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  Sem cartao de credito agora
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-primary" />7 dias de garantia
                </span>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ja tem uma conta?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Entrar no sistema
          </Link>
        </p>
      </div>
    </SalesSection>
  );
}
