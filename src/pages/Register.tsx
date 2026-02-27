import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Eye, EyeOff, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';

const getPasswordStrengthStatus = (value: string) => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 2) {
    return { label: 'Fraca', width: '33%', barClassName: 'bg-red-500', textClassName: 'text-red-600' };
  }
  if (score <= 4) {
    return { label: 'Media', width: '66%', barClassName: 'bg-amber-500', textClassName: 'text-amber-600' };
  }
  return { label: 'Forte', width: '100%', barClassName: 'bg-emerald-500', textClassName: 'text-emerald-600' };
};

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 1 - Personal data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2 - Salon data
  const [salonName, setSalonName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const passwordStrength = getPasswordStrengthStatus(password);

  const handleNextStep = () => {
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas nao conferem');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cpfCnpjDigits = cpfCnpj.replace(/\D/g, "");
    if (!salonName || !phone || !cpfCnpjDigits) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (![11, 14].includes(cpfCnpjDigits.length)) {
      toast.error('Informe um CPF ou CNPJ valido');
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
      });
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        toast.error('Muitas tentativas. Aguarde um momento e tente novamente.');
      } else {
        const uiError = resolveUiError(error, 'Erro ao criar conta. Tente novamente.');
        toast.error(uiError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-card p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
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
              {step === 1 ? 'Seus dados pessoais' : 'Dados do seu salão'}
            </CardDescription>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className={`w-12 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
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
                      type={showPassword ? 'text' : 'password'}
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
                        className={`h-full rounded transition-all ${password ? passwordStrength.barClassName : 'bg-muted-foreground/40'}`}
                        style={{ width: password ? passwordStrength.width : '0%' }}
                      />
                    </div>
                    <p className={`text-xs ${password ? passwordStrength.textClassName : 'text-muted-foreground'}`}>
                      Seguranca da senha: {password ? passwordStrength.label : 'Nao definida'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 sm:h-11"
                  />
                </div>

                <Button
                  type="button"
                  className="w-full h-10 sm:h-11 "
                  onClick={handleNextStep}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salonName" className="text-sm">Nome do Salão</Label>
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
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj" className="text-sm">CPF/CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    placeholder="Somente numeros"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
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
                    className="flex-1 h-10 sm:h-11 "
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </div>
              </form>
            )}

            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:opacity-90 font-medium">
                Faça login
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4 sm:mt-6">
          Ao criar sua conta, você concorda com nossos{' '}
          <a href="#" className="text-primary hover:underline">Termos de Uso</a>
          {' '}e{' '}
          <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
}

