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
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getCurrentBillingSubscription } from '@/services/billingService';
import { ApiError } from '@/lib/api/core';
import { authApi } from '@/lib/api/auth';
import { resolveUiError } from '@/lib/error-utils';
import { setLicenseAccessStatus } from '@/lib/license-access';
import { loginSchema, type LoginForm } from '@/schemas/auth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
  const errors = form.formState.errors;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(REMEMBER_LOGIN_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { email?: string };
      if (parsed.email) {
        form.setValue("email", parsed.email);
        setRememberPassword(true);
        sessionStorage.setItem(
          REMEMBER_LOGIN_STORAGE_KEY,
          JSON.stringify({ email: parsed.email })
        );
        return;
      }
      sessionStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
    } catch {
      sessionStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
    }
  }, [form]);

  useEffect(() => {
    const showSessionExpiredToast = (message?: string) => {
      toast.error(message || "Sessão expirada. Faça login novamente.");
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
      toast.error('Digite o código de 6 dígitos do seu aplicativo autenticador.');
        return;
      }

      if (typeof window !== "undefined") {
        if (rememberPassword) {
          sessionStorage.setItem(
            REMEMBER_LOGIN_STORAGE_KEY,
            JSON.stringify({
              email: values.email.trim(),
            })
          );
        } else {
          sessionStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
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
        toast.error('Digite o código de 6 dígitos do seu aplicativo autenticador.');
        return;
      }
      const uiError = resolveUiError(error, 'Credenciais inválidas.');
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
    <div className="auth-shell flex items-center justify-center">
      <div className="absolute right-3 top-3 z-20">
        <ThemeToggle className="theme-toggle-shell h-8 w-8" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-3 space-y-1.5 text-center">
          <BrandLockup className="justify-center" caption="Operating System" />
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-primary">
              Acesso único
            </span>
            <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
              Sessão protegida
            </span>
            <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
              Retomada rápida
            </span>
          </div>
        </div>

        <Card className="auth-panel border-border/80">
          <CardHeader className="text-center pb-1 pt-4">
            <CardTitle className="text-xl font-semibold tracking-tight">
              Bem-vindo de volta!
            </CardTitle>
            <CardDescription className="text-xs leading-5">
              Acesse sua operação sem perder contexto e retome de onde parou.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="username"
                  autoFocus
                  {...form.register('email')}
                  disabled={isLoading}
                  className="h-9"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                />
                {errors.email ? (
                  <p id="login-email-error" className="text-xs text-destructive" aria-live="polite">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs">Senha</Label>
                  <Link
                    to="/recuperar-senha"
                    className="text-xs text-primary hover:opacity-90"
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
                    className="h-9 pr-10"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
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
                {errors.password ? (
                  <p id="login-password-error" className="text-xs text-destructive" aria-live="polite">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              {mfaRequired ? (
                <div className="space-y-2">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Verificação adicional necessária</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Digite o código do aplicativo autenticador para concluir o acesso com segurança.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Label htmlFor="mfaCode" className="text-sm">Código MFA (6 dígitos)</Label>
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
                    className="h-9"
                    aria-invalid={Boolean(errors.mfaCode)}
                    aria-describedby={errors.mfaCode ? 'login-mfa-error' : undefined}
                  />
                  {errors.mfaCode ? (
                    <p id="login-mfa-error" className="text-xs text-destructive" aria-live="polite">
                      {errors.mfaCode.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberPassword"
                  checked={rememberPassword}
                  onCheckedChange={(checked) => setRememberPassword(Boolean(checked))}
                  disabled={isLoading}
                />
                <Label htmlFor="rememberPassword" className="text-xs text-muted-foreground">
                  Salvar e-mail neste dispositivo
                </Label>
              </div>

              <Button
                type="submit"
                className="h-9 w-full"
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

            <p className="text-center text-xs text-muted-foreground mt-3">
              Não tem uma conta?{' '}
              <Link to="/cadastro" className="text-primary hover:opacity-90 font-medium">
                Cadastre-se gratis
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Ao entrar, você concorda com nossos{' '}
          <Link to="/termos-de-uso" className="text-primary hover:underline">Termos de Uso</Link>
          {' '}e{' '}
          <Link to="/politica-privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
        </p>
      </div>
    </div>
  );
}
