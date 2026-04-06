import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Shield, Sparkles } from 'lucide-react';
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
import { toast } from 'sonner';

function getPasswordStrengthStatus(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (score <= 2) return { label: 'Fraca', width: '33%', barClassName: 'bg-red-500', textClassName: 'text-red-600' };
  if (score <= 4) return { label: 'Média', width: '66%', barClassName: 'bg-amber-500', textClassName: 'text-amber-600' };
  return { label: 'Forte', width: '100%', barClassName: 'bg-emerald-500', textClassName: 'text-emerald-600' };
}

export function SaleRegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { products } = useCheckoutProducts();
  const effectiveProductId = products[0]?.id ?? '';

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

  const handleCreateAccount = async () => {
    const cpfCnpjDigits = accountCpfCnpj.replace(/\D/g, '');
    if (
      !accountName.trim() || !accountEmail.trim() || !accountPassword.trim() ||
      !accountConfirmPassword.trim() || !accountSalonName.trim() ||
      !accountPhone.trim() || !cpfCnpjDigits
    ) {
      toast.error('Preencha todos os campos para criar sua conta.');
      return;
    }
    if (![11, 14].includes(cpfCnpjDigits.length)) {
      toast.error('Informe um CPF ou CNPJ valido.');
      return;
    }
    if (!acceptedLegalTerms) {
      toast.error('Voce precisa aceitar os Termos de Uso e a Politica de Privacidade.');
      return;
    }
    if (!termsOfUseVersion || !privacyPolicyVersion) {
      toast.error('Nao foi possivel carregar as versoes dos termos legais.');
      return;
    }
    if (accountPassword.trim().length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (accountPassword.trim() !== accountConfirmPassword.trim()) {
      toast.error('As senhas não conferem.');
      return;
    }

    setIsCreatingAccount(true);
    try {
      await register({
        name: accountName.trim(), email: accountEmail.trim(), password: accountPassword.trim(),
        salonName: accountSalonName.trim(), phone: accountPhone.trim(), cpfCnpj: cpfCnpjDigits,
        acceptedTermsOfUse: true, acceptedPrivacyPolicy: true,
        termsOfUseVersion, privacyPolicyVersion,
      });
      toast.success('Conta criada! Continue com o pagamento do plano.');
      const planQuery = effectiveProductId ? `?plan=${encodeURIComponent(effectiveProductId)}&mode=CHANGE` : '';
      navigate(`/financeiro/licenca${planQuery}`, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        toast.error('Muitas tentativas. Aguarde um momento e tente novamente.');
      } else {
        toast.error(resolveUiError(error, 'Não foi possível criar sua conta agora.').message);
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
        <header className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            Comece agora — é grátis para testar
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
            Crie sua conta e comece em minutos
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Após o cadastro, você escolhe o plano e faz o pagamento. Sem cartão agora.
          </p>
        </header>

        <Card className="border-2 border-emerald-200 shadow-lg dark:border-emerald-900">
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sale-account-name">Nome completo</Label>
                <Input id="sale-account-name" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Seu nome" disabled={isCreatingAccount} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-account-email">E-mail</Label>
                <Input id="sale-account-email" type="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} placeholder="seu@email.com" disabled={isCreatingAccount} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-account-password">Senha</Label>
                <Input id="sale-account-password" type="password" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} placeholder="Mínimo 8 caracteres" disabled={isCreatingAccount} />
                {accountPassword ? (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded bg-muted">
                      <div className={`h-full rounded transition-all ${passwordStrength.barClassName}`} style={{ width: passwordStrength.width }} />
                    </div>
                    <p className={`text-xs ${passwordStrength.textClassName}`}>
                      Segurança da senha: {passwordStrength.label}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-account-confirm-password">Confirmar senha</Label>
                <Input id="sale-account-confirm-password" type="password" value={accountConfirmPassword} onChange={(e) => setAccountConfirmPassword(e.target.value)} placeholder="Repita a senha" disabled={isCreatingAccount} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-account-phone">Telefone / WhatsApp</Label>
                <Input id="sale-account-phone" value={accountPhone} onChange={(e) => setAccountPhone(maskPhoneBr(e.target.value))} placeholder="(11) 99999-0000" disabled={isCreatingAccount} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-account-salon">Nome do salão</Label>
                <Input id="sale-account-salon" value={accountSalonName} onChange={(e) => setAccountSalonName(e.target.value)} placeholder="Ex.: Bella Studio" disabled={isCreatingAccount} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sale-account-cpf-cnpj">CPF/CNPJ</Label>
                <Input id="sale-account-cpf-cnpj" value={accountCpfCnpj} onChange={(e) => setAccountCpfCnpj(maskCpfCnpj(e.target.value))} placeholder="000.000.000-00 ou 00.000.000/0000-00" disabled={isCreatingAccount} />
              </div>
              </div>

              <Button
                type="submit" size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base"
                disabled={isCreatingAccount}
              >
                {isCreatingAccount ? 'Criando sua conta...' : (
                  <>Criar minha conta gratuitamente <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>

              <div className="flex items-start gap-2 rounded-md border border-input p-3">
              <Checkbox
                id="sale-accept-legal-terms"
                checked={acceptedLegalTerms}
                onCheckedChange={(checked) => setAcceptedLegalTerms(Boolean(checked))}
              />
              <Label htmlFor="sale-accept-legal-terms" className="text-xs leading-relaxed text-muted-foreground">
                Li e aceito os{' '}
                <Link to="/termos-de-uso" target="_blank" className="text-primary hover:underline">Termos de Uso</Link>{' '}
                e a{' '}
                <Link to="/politica-privacidade" target="_blank" className="text-primary hover:underline">Politica de Privacidade</Link>.
              </Label>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3 w-3" />Dados protegidos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />Sem cartão de crédito agora
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-emerald-500" />7 dias de garantia
              </span>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-primary hover:underline">Entrar no sistema</Link>
        </p>
      </div>
    </SalesSection>
  );
}
