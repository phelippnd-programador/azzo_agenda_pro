import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  MessageCircle,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { BenefitCard } from "@/components/sales/BenefitCard";
import { SalesSection } from "@/components/sales/SalesSection";
import { useCheckoutProducts } from "@/hooks/useCheckoutProducts";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
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

export default function SalePage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountConfirmPassword, setAccountConfirmPassword] = useState("");
  const [accountSalonName, setAccountSalonName] = useState("");
  const [accountPhone, setAccountPhone] = useState("");
  const [accountCpfCnpj, setAccountCpfCnpj] = useState("");
  const { products } = useCheckoutProducts();
  const defaultProductId = products[0]?.id ?? "";
  const effectiveProductId = defaultProductId;
  const passwordStrength = getPasswordStrengthStatus(accountPassword);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === effectiveProductId) ?? null,
    [effectiveProductId, products]
  );

  useEffect(() => {
    const title = "Azzo Agenda Pro | Oferta para digitalizar seu salao";
    const description =
      "Converta atendimentos em faturamento com agenda inteligente, equipe conectada e checkout seguro.";
    document.title = title;

    let meta = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, []);

  const handleCreateAccountAndContinue = async () => {
    if (!effectiveProductId) {
      toast.error("Nenhum produto disponivel para continuar no momento.");
      return;
    }

    const accountCpfCnpjDigits = accountCpfCnpj.replace(/\D/g, "");
    if (
      !accountName.trim() ||
      !accountEmail.trim() ||
      !accountPassword.trim() ||
      !accountConfirmPassword.trim() ||
      !accountSalonName.trim() ||
      !accountPhone.trim() ||
      !accountCpfCnpjDigits
    ) {
      toast.error("Preencha todos os campos para criar sua conta.");
      return;
    }
    if (![11, 14].includes(accountCpfCnpjDigits.length)) {
      toast.error("Informe um CPF ou CNPJ valido.");
      return;
    }

    if (accountPassword.trim().length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (accountPassword.trim() !== accountConfirmPassword.trim()) {
      toast.error("As senhas nao conferem.");
      return;
    }

    try {
      setIsCreatingAccount(true);
      await register({
        name: accountName.trim(),
        email: accountEmail.trim(),
        password: accountPassword.trim(),
        salonName: accountSalonName.trim(),
        phone: accountPhone.trim(),
        cpfCnpj: accountCpfCnpjDigits,
      });

      toast.success("Conta criada. Continue com o pagamento do plano.");
      navigate(
        `/financeiro/licenca?plan=${encodeURIComponent(
          effectiveProductId
        )}&mode=CHANGE`,
        { replace: true }
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        toast.error("Muitas tentativas. Aguarde um momento e tente novamente.");
      } else {
        const uiError = resolveUiError(error, "Nao foi possivel criar sua conta agora.");
        toast.error(uiError.message);
      }
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const dashboardPreviewImage = "/images/dashboard-preview.png";
  const painelDemoImage = "/images/painel-demo.png";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-foreground">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
              A
            </span>
            Azzo Agenda Pro
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#funcionalidades" className="hover:text-foreground">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="hover:text-foreground">
              Como Funciona
            </a>
            <a href="#resultados" className="hover:text-foreground">
              Resultados
            </a>
          </nav>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={() => scrollToSection("offer")}
          >
            Comecar agora
          </Button>
        </div>
      </header>

      <SalesSection className="pt-12 md:pt-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Gestao completa do seu salao
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Organize sua agenda, equipe e{" "}
              <span className="text-primary">financeiro em um lugar</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              Azzo Agenda Pro e um sistema de gestao para saloes que une agenda,
              equipe, clientes e financeiro em um unico painel.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={() => scrollToSection("offer")}
              >
                Comecar teste gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection("como-funciona")}>
                Ver demo
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Entrar no sistema</Link>
              </Button>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Sem cartao de credito. Acesso imediato.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-primary/30 via-primary/20 to-accent opacity-60 blur-xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-2xl">
              <img
                src={dashboardPreviewImage}
                alt="Preview real do dashboard Azzo Agenda Pro"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.src =
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1400&auto=format&fit=crop";
                }}
                className="h-[300px] w-full rounded-2xl bg-muted/40 object-contain p-2 md:h-[380px]"
              />
            </div>
          </div>
        </div>
      </SalesSection>

      <SalesSection
        id="funcionalidades"
        title="Funcionalidades que seu salao precisa"
        subtitle="Tudo o que voce ve no dashboard esta pronto para usar."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Gestao da equipe",
              icon: <Users className="h-4 w-4 text-primary" />,
              text: "Organize profissionais, especialidades e disponibilidade em tempo real.",
            },
            {
              title: "Servicos e especialidades",
              icon: <Sparkles className="h-4 w-4 text-primary" />,
              text: "Configure servicos, duracao, preco e quem pode executar cada atendimento.",
            },
            {
              title: "Notificacoes",
              icon: <BellRing className="h-4 w-4 text-primary" />,
              text: "Receba alertas de novos agendamentos, confirmacoes e eventos importantes.",
            },
            {
              title: "Agenda inteligente",
              icon: <CalendarClock className="h-4 w-4 text-primary" />,
              text: "Visualizacao clara dos horarios com menos conflitos e mais produtividade.",
            },
            {
              title: "Financeiro centralizado",
              icon: <CreditCard className="h-4 w-4 text-primary" />,
              text: "Controle entradas e saidas com relatorios simples para tomada de decisao.",
            },
            {
              title: "Painel de controle",
              icon: <LayoutDashboard className="h-4 w-4 text-primary" />,
              text: "Dados importantes do salao em um unico lugar.",
            },
          ].map((item) => (
            <Card key={item.title} className="border-border bg-card shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SalesSection>

      <SalesSection title="Seu painel de controle" subtitle="Visao clara para toda a operacao do salao.">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-border bg-card p-2">
            <img
              src={painelDemoImage}
              alt="Painel demonstrativo de gestao"
              loading="lazy"
              onError={(event) => {
                  event.currentTarget.src =
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1400&auto=format&fit=crop";
                }}
              className="h-[320px] w-full rounded-2xl bg-muted/40 object-contain p-2 md:h-[460px]"
            />
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
            {[
              "Agendamentos: visao em tempo real",
              "Faturamento: metricas da loja",
              "Clientes ativos: historico completo",
              "Equipe: disponibilidade e produtividade",
            ].map((metric) => (
              <div key={metric} className="rounded-lg border bg-muted/40 p-3 text-muted-foreground">
                {metric}
              </div>
            ))}
          </div>
        </div>
      </SalesSection>

      <SalesSection id="como-funciona" title="Como comecar" subtitle="Tres passos simples para ativar seu salao.">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Crie sua conta",
              description: "Cadastre seu salao e dados de acesso em poucos minutos.",
            },
            {
              step: "2",
              title: "Configure seus dados",
              description: "Adicione equipe, servicos, especialidades e horarios.",
            },
            {
              step: "3",
              title: "Comece a usar",
              description: "Acesse o dashboard e gerencie agenda e financeiro.",
            },
          ].map((item) => (
            <Card key={item.step} className="border-border bg-card">
              <CardContent className="p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SalesSection>

      <SalesSection
        id="resultados"
        className="bg-card"
        title="Beneficios diretos em receita e produtividade"
        subtitle="Projetado para conversao: menos atrito e mais previsibilidade."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <BenefitCard
            icon={<Zap className="h-5 w-5" />}
            title="Menos tempo"
            description="Reduza tarefas manuais e ganhe organizacao na agenda."
          />
          <BenefitCard
            icon={<BadgeCheck className="h-5 w-5" />}
            title="Mais controle"
            description="Visao real das metricas de faturamento e produtividade."
          />
          <BenefitCard
            icon={<Users className="h-5 w-5" />}
            title="Equipe alinhada"
            description="Todos veem a mesma agenda em tempo real."
          />
          <BenefitCard
            icon={<Shield className="h-5 w-5" />}
            title="Sem erros"
            description="Evite conflitos de horario e agendamentos duplicados."
          />
        </div>
      </SalesSection>

      <SalesSection title="Depoimentos" subtitle="O que proprietarios de salao dizem sobre a plataforma.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: "Marina Silva",
              salon: "Studio Aurora",
              text: "Consegui organizar minha agenda de forma muito mais eficiente. Minha equipe trabalha muito melhor agora.",
            },
            {
              name: "Carlos Mendes",
              salon: "Salao Prime",
              text: "O controle financeiro ficou muito mais facil. Consigo acompanhar o faturamento do dia e do mes.",
            },
            {
              name: "Beatriz Costa",
              salon: "Bella Estetica",
              text: "Recorremos para todo o salao. Economiza tempo e deixa tudo organizado em um so lugar.",
            },
          ].map((item) => (
            <Card key={item.name} className="border-border bg-card">
              <CardContent className="p-5 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.salon}</p>
                <p className="mt-3">"{item.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SalesSection>

      <SalesSection id="offer" className="bg-card" title="Plano recomendado para iniciar hoje">
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
            <div>
              <p className="text-sm font-medium text-primary">Oferta ativa</p>
              <h3 className="mt-2 text-2xl font-bold">
                {selectedProduct?.name || "Plano Pro Growth"}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {selectedProduct?.description ||
                  "Inclui agenda inteligente, CRM de clientes, financeiro consolidado e checkout interno da licenca."}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-foreground">
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Usuarios da equipe
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Relatorios em tempo real
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Suporte prioritario
                </li>
              </ul>
            </div>
            <Card className="border-dashed border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  Crie sua conta e continue direto para o pagamento interno com o plano selecionado.
                </p>
                <Button className="mt-4 w-full" onClick={() => scrollToSection("account-signup")}>
                  Continuar para cadastro <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card id="account-signup" className="mt-6 border-primary/20 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Crie sua conta para seguir ao pagamento
              </p>
              <p className="text-sm text-muted-foreground">
                Depois do cadastro, voce sera levado para pagar a licenca do plano selecionado.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sale-account-name">Nome completo</Label>
                <Input
                  id="sale-account-name"
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder="Seu nome"
                  disabled={isCreatingAccount}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-account-email">E-mail</Label>
                <Input
                  id="sale-account-email"
                  type="email"
                  value={accountEmail}
                  onChange={(event) => setAccountEmail(event.target.value)}
                  placeholder="seu@email.com"
                  disabled={isCreatingAccount}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-account-password">Senha</Label>
                <Input
                  id="sale-account-password"
                  type="password"
                  value={accountPassword}
                  onChange={(event) => setAccountPassword(event.target.value)}
                  placeholder="Minimo 8 caracteres"
                  disabled={isCreatingAccount}
                />
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded bg-muted">
                    <div
                      className={`h-full rounded transition-all ${accountPassword ? passwordStrength.barClassName : "bg-muted-foreground/40"}`}
                      style={{ width: accountPassword ? passwordStrength.width : "0%" }}
                    />
                  </div>
                  <p className={`text-xs ${accountPassword ? passwordStrength.textClassName : "text-muted-foreground"}`}>
                    Seguranca da senha: {accountPassword ? passwordStrength.label : "Nao definida"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-account-confirm-password">Confirmar senha</Label>
                <Input
                  id="sale-account-confirm-password"
                  type="password"
                  value={accountConfirmPassword}
                  onChange={(event) => setAccountConfirmPassword(event.target.value)}
                  placeholder="Repita a senha"
                  disabled={isCreatingAccount}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-account-phone">Telefone / WhatsApp</Label>
                <Input
                  id="sale-account-phone"
                  value={accountPhone}
                  onChange={(event) => setAccountPhone(event.target.value)}
                  placeholder="(11) 99999-0000"
                  disabled={isCreatingAccount}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-account-cpf-cnpj">CPF/CNPJ</Label>
                <Input
                  id="sale-account-cpf-cnpj"
                  value={accountCpfCnpj}
                  onChange={(event) => setAccountCpfCnpj(event.target.value)}
                  placeholder="Somente numeros"
                  disabled={isCreatingAccount}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sale-account-salon">Nome do salao</Label>
                <Input
                  id="sale-account-salon"
                  value={accountSalonName}
                  onChange={(event) => setAccountSalonName(event.target.value)}
                  placeholder="Ex.: Bella Studio"
                  disabled={isCreatingAccount}
                />
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleCreateAccountAndContinue}
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? "Criando conta..." : "Criar conta e continuar"}
            </Button>
          </CardContent>
        </Card>
      </SalesSection>

      <SalesSection>
        <div className="rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/70 px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-bold md:text-4xl">Pronto para organizar seu salao?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 md:text-base">
            Comece seu teste gratuito agora e centralize agenda, equipe e financeiro em um so painel.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="text-primary"
              onClick={() => scrollToSection("offer")}
            >
              Comecar teste gratis
            </Button>
            <Button size="lg" variant="outline" className="border-white/60 text-white hover:bg-card/10">
              Agendar demonstracao <MessageCircle className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </SalesSection>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
          <div>
            <p className="font-semibold text-white">Azzo Agenda Pro</p>
            <p className="mt-2 text-sm text-slate-400">
              Sistema de gestao para saloes que oferece organizacao completa.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Produto</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Funcionalidades</li>
              <li>Como funciona</li>
              <li>Preco</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Empresa</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Sobre</li>
              <li>Blog</li>
              <li>Contato</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Privacidade</li>
              <li>Termos</li>
              <li>Cookies</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
          © {new Date().getFullYear()} Azzo Agenda Pro. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}



