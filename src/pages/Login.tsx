import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrandLockup } from '@/components/common/BrandLockup';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getCurrentBillingSubscription } from '@/services/billingService';
import { ApiError, authApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { setLicenseAccessStatus } from '@/lib/license-access';
import { loginSchema, type LoginForm } from '@/schemas/auth';

const REMEMBER_LOGIN_STORAGE_KEY = "azzo_remembered_login";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      mfaCode: '',
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(REMEMBER_LOGIN_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { email?: string };
      if (parsed.email) {
        form.setValue("email", parsed.email);
        setRememberPassword(true);
        localStorage.setItem(
          REMEMBER_LOGIN_STORAGE_KEY,
          JSON.stringify({ email: parsed.email })
        );
        return;
      }
      localStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
    } catch {
      localStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
    }
  }, [form]);

  useEffect(() => {
    const showSessionExpiredToast = (message?: string) => {
      toast.error(message || "Sessao expirada. Faca login novamente.");
    };

    const consumeReason = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const queryReason = params.get("reason");
      const storedReason = sessionStorage.getItem("azzo_session_expired_reason");
      if (queryReason === "session-expired" || storedReason) {
        showSessionExpiredToast(storedReason || undefined);
      }
      sessionStorage.removeItem("azzo_session_expired_reason");
      if (queryReason === "session-expired") {
        params.delete("reason");
        const qs = params.toString();
        const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash || ""}`;
        window.history.replaceState({}, "", nextUrl);
      }
    };

    const onSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ reason?: string }>;
      showSessionExpiredToast(customEvent.detail?.reason);
    };

    consumeReason();
    window.addEventListener("azzo:session-expired", onSessionExpired as EventListener);
    return () => window.removeEventListener("azzo:session-expired", onSessionExpired as EventListener);
  }, []);

  const getPostLoginRoute = async (): Promise<string> => {
    let currentUserRole: string | null = null;
    try {
      const currentUser = await authApi.me();
      currentUserRole = currentUser?.role ?? null;
      if (currentUser?.role === "ADMIN") {
        setLicenseAccessStatus("ACTIVE");
        return "/configuracoes/admin-sistema";
      }
      const subscription = await getCurrentBillingSubscription();
      const subscriptionStatus = String(subscription.status || '').toUpperCase();
      const licenseStatus = String(subscription.licenseStatus || '').toUpperCase();
      const paymentStatus = String(
        subscription.currentPaymentStatus || subscription.paymentStatus || ''
      ).toUpperCase();

      if (
        licenseStatus === 'EXPIRED' ||
        subscriptionStatus === 'EXPIRED' ||
        subscriptionStatus === 'OVERDUE' ||
        paymentStatus === 'OVERDUE'
      ) {
        setLicenseAccessStatus("BLOCKED");
        return '/financeiro/licenca';
      }
      setLicenseAccessStatus("ACTIVE");
      if (currentUser?.role === "PROFESSIONAL") {
        return "/agenda";
      }
      return '/dashboard';
    } catch (error) {
      if (error instanceof ApiError && (error.status === 402 || error.status === 404)) {
        setLicenseAccessStatus("BLOCKED");
        return '/financeiro/licenca';
      }
      setLicenseAccessStatus("UNKNOWN");
      return currentUserRole === "PROFESSIONAL" ? "/agenda" : "/dashboard";
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setIsLoading(true);

    try {
      const mfaCode = values.mfaCode?.trim();
      if (mfaRequired && (!mfaCode || mfaCode.length !== 6)) {
        toast.error('Digite o codigo de 6 digitos do seu aplicativo autenticador.');
        return;
      }

      if (typeof window !== "undefined") {
        if (rememberPassword) {
          localStorage.setItem(
            REMEMBER_LOGIN_STORAGE_KEY,
            JSON.stringify({
              email: values.email.trim(),
            })
          );
        } else {
          localStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
        }
      }

      await login(values.email, values.password, mfaRequired ? mfaCode : undefined);
      toast.success('Login realizado com sucesso!');
      setMfaRequired(false);
      form.setValue('mfaCode', '');
      const redirectPath = await getPostLoginRoute();
      navigate(redirectPath);
    } catch (error) {
      if (error instanceof ApiError && error.status === 428) {
        setMfaRequired(true);
        toast.error('Digite o codigo de 6 digitos do seu aplicativo autenticador.');
        return;
      }
      const uiError = resolveUiError(error, 'Credenciais invalidas.');
      toast.error(uiError.message);
    } finally {
      setIsLoading(false);
    }
  }, (errors) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-card p-4">
      <div className="w-full max-w-md">
        <BrandLockup className="mb-6 sm:mb-8" />

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2 sm:pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
              Bem-vindo de volta!
            </CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-[15px]">
              Entre na sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="username"
                  autoFocus
                  {...form.register('email')}
                  disabled={isLoading}
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm">Senha</Label>
                  <Link
                    to="/recuperar-senha"
                    className="text-xs sm:text-sm text-primary hover:opacity-90"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="........"
                    autoComplete="current-password"
                    {...form.register('password')}
                    disabled={isLoading}
                    className="h-10 sm:h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {mfaRequired ? (
                <div className="space-y-2">
                  <Label htmlFor="mfaCode" className="text-sm">Codigo MFA (6 digitos)</Label>
                  <Input
                    id="mfaCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    {...form.register('mfaCode', {
                      onChange: (event) => {
                        const target = event.target as HTMLInputElement;
                        target.value = target.value.replace(/\D/g, '').slice(0, 6);
                      },
                    })}
                    disabled={isLoading}
                    className="h-10 sm:h-11"
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberPassword"
                  checked={rememberPassword}
                  onCheckedChange={(checked) => setRememberPassword(Boolean(checked))}
                  disabled={isLoading}
                />
                <Label htmlFor="rememberPassword" className="text-sm text-muted-foreground">
                  Salvar e-mail neste dispositivo
                </Label>
              </div>

              <p className="text-xs text-muted-foreground">
                Apenas seu e-mail pode ser lembrado neste navegador. Sua senha nunca e salva localmente.
              </p>

              <Button
                type="submit"
                className="w-full h-10 sm:h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">
              Nao tem uma conta?{' '}
              <Link to="/cadastro" className="text-primary hover:opacity-90 font-medium">
                Cadastre-se gratis
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4 sm:mt-6">
          Ao entrar, voce concorda com nossos{' '}
          <Link to="/termos-de-uso" className="text-primary hover:underline">Termos de Uso</Link>
          {' '}e{' '}
          <Link to="/politica-privacidade" className="text-primary hover:underline">Politica de Privacidade</Link>
        </p>
      </div>
    </div>
  );
}
