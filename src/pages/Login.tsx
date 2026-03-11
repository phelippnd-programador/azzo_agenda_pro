import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getCurrentBillingSubscription } from '@/services/billingService';
import { ApiError, authApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { setLicenseAccessStatus } from '@/lib/license-access';

const isDemoLoginEnabled =
  String(import.meta.env.VITE_ENABLE_DEMO_LOGIN ?? 'false').toLowerCase() === 'true';
const isLocalDemoQuickAccessEnabled =
  String(import.meta.env.VITE_ENABLE_LOCAL_DEMO ?? 'true').toLowerCase() !== 'false';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginLocalDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      const currentUser = await authApi.me();
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
      return '/dashboard';
    } catch (error) {
      if (error instanceof ApiError && (error.status === 402 || error.status === 404)) {
        setLicenseAccessStatus("BLOCKED");
        return '/financeiro/licenca';
      }
      setLicenseAccessStatus("UNKNOWN");
      return '/dashboard';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password, mfaRequired ? mfaCode : undefined);
      toast.success('Login realizado com sucesso!');
      setMfaRequired(false);
      setMfaCode('');
      const redirectPath = await getPostLoginRoute();
      navigate(redirectPath);
    } catch (error) {
      if (error instanceof ApiError && error.status === 428) {
        setMfaRequired(true);
        toast.error('Digite o codigo de 6 digitos do seu aplicativo autenticador.');
        return;
      }
      const uiError = resolveUiError(
        error,
        isDemoLoginEnabled
          ? 'Credenciais invalidas. Tente demo@azzo.com / demo123'
          : 'Credenciais invalidas.'
      );
      toast.error(uiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalDemoLogin = async (role: 'OWNER' | 'PROFESSIONAL') => {
    if (!isLocalDemoQuickAccessEnabled) return;
    setIsLoading(true);
    try {
      await loginLocalDemo(role);
      toast.success(
        role === 'PROFESSIONAL'
          ? 'Modo demo local (Profissional) ativado.'
          : 'Modo demo local (Owner) ativado.'
      );
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erro ao ativar demo local');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!isDemoLoginEnabled) return;
    setIsLoading(true);
    try {
      await login('demo@azzo.com', 'demo123');
      toast.success('Bem-vindo ao modo demonstracao!');
      const redirectPath = await getPostLoginRoute();
      navigate(redirectPath);
    } catch (error) {
      const uiError = resolveUiError(error, 'Erro ao fazer login de demonstracao');
      toast.error(uiError.message);
    } finally {
      setIsLoading(false);
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
            <CardTitle className="text-xl sm:text-2xl">Bem-vindo de volta!</CardTitle>
            <CardDescription className="text-sm">Entre na sua conta para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
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
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={isLoading}
                    className="h-10 sm:h-11"
                  />
                </div>
              ) : null}

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

            {isDemoLoginEnabled || isLocalDemoQuickAccessEnabled ? (
              <>
                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {isLocalDemoQuickAccessEnabled ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 sm:h-11"
                        onClick={() => handleLocalDemoLogin('OWNER')}
                        disabled={isLoading}
                      >
                        Demo Local Owner
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 sm:h-11"
                        onClick={() => handleLocalDemoLogin('PROFESSIONAL')}
                        disabled={isLoading}
                      >
                        Demo Local Profissional
                      </Button>
                    </>
                  ) : null}
                  {isDemoLoginEnabled ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 sm:h-11"
                      onClick={handleDemoLogin}
                      disabled={isLoading}
                    >
                      Login Demo Remoto
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}

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
