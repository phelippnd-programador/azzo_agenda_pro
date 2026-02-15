import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Eye, EyeOff, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  
  // Step 2 - Salon data
  const [salonName, setSalonName] = useState('');
  const [phone, setPhone] = useState('');

  const handleNextStep = () => {
    if (!name || !email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!salonName || !phone) {
      toast.error('Preencha todos os campos');
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
      });
      toast.success('Conta criada com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-600 to-pink-500 rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Azzo</h1>
            <p className="text-xs sm:text-sm text-violet-600 font-medium -mt-1">Agenda Pro</p>
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
                step >= 1 ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className={`w-12 h-1 rounded ${step >= 2 ? 'bg-violet-600' : 'bg-gray-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'
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
                      placeholder="Mínimo 6 caracteres"
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
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full h-10 sm:h-11 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600"
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
                    className="flex-1 h-10 sm:h-11 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600"
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

            <p className="text-center text-xs sm:text-sm text-gray-600 mt-4 sm:mt-6">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-violet-600 hover:text-violet-700 font-medium">
                Faça login
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-4 sm:mt-6">
          Ao criar sua conta, você concorda com nossos{' '}
          <a href="#" className="text-violet-600 hover:underline">Termos de Uso</a>
          {' '}e{' '}
          <a href="#" className="text-violet-600 hover:underline">Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
}