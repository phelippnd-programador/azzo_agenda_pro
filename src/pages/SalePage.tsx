import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SalesSection } from "@/components/sales/SalesSection";
import { useCheckoutProducts } from "@/hooks/useCheckoutProducts";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { maskPhoneBr } from "@/lib/input-masks";
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
    return { label: "Média", width: "66%", barClassName: "bg-amber-500", textClassName: "text-amber-600" };
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
  const { products } = useCheckoutProducts();
  const defaultProductId = products[0]?.id ?? "";
  const effectiveProductId = defaultProductId;
  const passwordStrength = getPasswordStrengthStatus(accountPassword);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === effectiveProductId) ?? null,
    [effectiveProductId, products]
  );

  useEffect(() => {
    document.title = "Azzo Agenda Pro | Sistema de Gestão para Salões de Beleza";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content =
      "Organize agenda, equipe e financeiro do seu salão em um só sistema. Mais de 200 salões já usam. Comece grátis hoje.";
  }, []);

  const handleCreateAccountAndContinue = async () => {
    if (!effectiveProductId) {
      toast.error("Nenhum produto disponível para continuar no momento.");
      return;
    }

    if (
      !accountName.trim() ||
      !accountEmail.trim() ||
      !accountPassword.trim() ||
      !accountConfirmPassword.trim() ||
      !accountSalonName.trim() ||
      !accountPhone.trim()
    ) {
      toast.error("Preencha todos os campos para criar sua conta.");
      return;
    }

    if (accountPassword.trim().length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (accountPassword.trim() !== accountConfirmPassword.trim()) {
      toast.error("As senhas não conferem.");
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
        cpfCnpj: "",
      });

      toast.success("Conta criada! Continue com o pagamento do plano.");
      navigate(
        `/financeiro/licenca?plan=${encodeURIComponent(effectiveProductId)}&mode=CHANGE`,
        { replace: true }
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        toast.error("Muitas tentativas. Aguarde um momento e tente novamente.");
      } else {
        const uiError = resolveUiError(error, "Não foi possível criar sua conta agora.");
        toast.error(uiError.message);
      }
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const dashboardPreviewImage = "/images/dashboard-preview.png";
  const painelDemoImage = "/images/painel-demo.png";

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-foreground">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
              A
            </span>
            Azzo Agenda Pro
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors md:inline-flex">
              Entrar
            </Link>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => scrollToSection("cadastro")}
            >
              Teste grátis
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <SalesSection className="pt-14 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
              Mais de 200 salões já usam o Azzo
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Seu salão{" "}
              <span className="text-emerald-600">faturando mais</span>,{" "}
              sua agenda sem caos
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              O Azzo Agenda Pro organiza agendamentos, equipe e financeiro em um único
              sistema — e você tem tudo sob controle do celular ou computador.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-base px-8"
                onClick={() => scrollToSection("cadastro")}
              >
                Começar teste grátis agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection("como-funciona")}>
                Ver como funciona
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Sem cartão de crédito agora
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Acesso imediato
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                7 dias de garantia
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-emerald-300/40 via-primary/20 to-accent opacity-60 blur-xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-2xl">
              <img
                src={dashboardPreviewImage}
                alt="Dashboard do Azzo Agenda Pro em uso real"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1400&auto=format&fit=crop";
                }}
                className="h-[300px] w-full rounded-2xl bg-muted/40 object-contain p-2 md:h-[380px]"
              />
            </div>
          </div>
        </div>
      </SalesSection>

      {/* ── SOCIAL PROOF BAR ── */}
      <div className="border-y border-border bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4 md:px-6">
          {[
            { stat: "200+", label: "Salões ativos" },
            { stat: "15 mil+", label: "Agendamentos/mês" },
            { stat: "98%", label: "Taxa de satisfação" },
            { stat: "< 5 min", label: "Para começar a usar" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-2xl font-bold text-foreground">{item.stat}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEÇÃO PROBLEMA ── */}
      <SalesSection className="bg-slate-50 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            <X className="h-3.5 w-3.5" />
            O jeito antigo custa caro
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
            Ainda gerencia seu salão no caderno, WhatsApp e memória?
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Conflito de horários, cliente que não foi avisado, profissional sem agenda
            clara, financeiro no achismo. Isso custa caro — em tempo, dinheiro e estresse.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              emoji: "😤",
              problem: "Conflito de horários",
              detail: "Dois clientes marcados no mesmo horário com o mesmo profissional.",
            },
            {
              emoji: "📵",
              problem: "Cliente sem confirmação",
              detail: "Falta do cliente porque ninguém lembrou de confirmar o agendamento.",
            },
            {
              emoji: "🤯",
              problem: "Financeiro no escuro",
              detail: "Não saber quanto faturou no mês sem contar tudo na mão.",
            },
          ].map((item) => (
            <div
              key={item.problem}
              className="rounded-xl border border-red-100 bg-white p-5 dark:border-red-900/40 dark:bg-red-950/20"
            >
              <p className="text-2xl">{item.emoji}</p>
              <p className="mt-2 font-semibold text-foreground">{item.problem}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </SalesSection>

      {/* ── SEÇÃO SOLUÇÃO ── */}
      <SalesSection className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          A solução
        </span>
        <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
          O Azzo resolve tudo isso em um painel só
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          Um sistema completo pensado para donos de salão, barbeiros e esteticistas que
          querem crescer sem depender de caderno, planilha ou memória.
        </p>
      </SalesSection>

      {/* ── FUNCIONALIDADES ── */}
      <SalesSection
        id="funcionalidades"
        title="Tudo que seu salão precisa em um lugar"
        subtitle="Funcionalidades que substituem 4 ferramentas diferentes de uma vez."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Agenda Inteligente",
              icon: <CalendarClock className="h-4 w-4 text-emerald-600" />,
              text: "Visualize todos os horários, evite conflitos e gerencie disponibilidade da equipe em tempo real.",
              highlight: "Zero conflitos de horário",
            },
            {
              title: "Gestão da Equipe",
              icon: <Users className="h-4 w-4 text-emerald-600" />,
              text: "Cada profissional tem seu próprio acesso e visualiza apenas sua agenda. Organizado e seguro.",
              highlight: "Equipe sempre alinhada",
            },
            {
              title: "Controle Financeiro",
              icon: <CreditCard className="h-4 w-4 text-emerald-600" />,
              text: "Acompanhe entradas, saídas e faturamento do dia ou do mês em segundos.",
              highlight: "Financeiro em tempo real",
            },
            {
              title: "Confirmação Automática",
              icon: <BellRing className="h-4 w-4 text-emerald-600" />,
              text: "Clientes recebem lembretes automáticos dos agendamentos. Menos faltas, mais faturamento.",
              highlight: "Reduza faltas em até 60%",
            },
            {
              title: "CRM de Clientes",
              icon: <BadgeCheck className="h-4 w-4 text-emerald-600" />,
              text: "Histórico completo de cada cliente: serviços, preferências e frequência de visita.",
              highlight: "Fidelização facilitada",
            },
            {
              title: "Painel de Controle",
              icon: <LayoutDashboard className="h-4 w-4 text-emerald-600" />,
              text: "Dashboard com métricas do salão ao vivo. Tome decisões com base em dados reais.",
              highlight: "Dados que geram resultado",
            },
          ].map((item) => (
            <Card key={item.title} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                <p className="mt-3 text-xs font-medium text-emerald-600">✓ {item.highlight}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SalesSection>

      {/* ── DEMO / DASHBOARD ── */}
      <SalesSection
        className="bg-card"
        title="Seu painel de controle completo"
        subtitle="Tudo o que acontece no salão visível numa única tela."
      >
        <div className="overflow-hidden rounded-3xl border border-border bg-background p-2 shadow-lg">
          <img
            src={painelDemoImage}
            alt="Painel de gestão do Azzo Agenda Pro"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1400&auto=format&fit=crop";
            }}
            className="h-[320px] w-full rounded-2xl bg-muted/40 object-contain p-2 md:h-[460px]"
          />
        </div>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
          {[
            { icon: "📅", label: "Agendamentos do dia em tempo real" },
            { icon: "💰", label: "Faturamento diário e mensal" },
            { icon: "👥", label: "Histórico completo de clientes" },
            { icon: "📊", label: "Produtividade da equipe" },
          ].map((m) => (
            <div key={m.label} className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-muted-foreground">
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </SalesSection>

      {/* ── COMO FUNCIONA ── */}
      <SalesSection
        id="como-funciona"
        title="Comece em menos de 5 minutos"
        subtitle="Três passos simples para seu salão estar no ar."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Crie sua conta grátis",
              description: "Preencha seu nome, e-mail e o nome do salão. Pronto — sua conta está criada.",
            },
            {
              step: "2",
              title: "Configure em minutos",
              description: "Adicione sua equipe, serviços e horários. Interface simples, sem precisar de TI.",
            },
            {
              step: "3",
              title: "Comece a lucrar",
              description: "Abra o dashboard e gerencie agenda, clientes e financeiro do celular ou computador.",
            },
          ].map((item) => (
            <Card key={item.step} className="border-border bg-card">
              <CardContent className="p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SalesSection>

      {/* ── RESULTADOS / BENEFÍCIOS ── */}
      <SalesSection
        className="bg-card"
        title="Resultados reais para seu faturamento"
        subtitle="Benefícios concretos que donos de salão sentem na primeira semana."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Zap className="h-5 w-5" />,
              stat: "80%",
              title: "Menos tempo administrativo",
              description: "Reduza o tempo gasto com agendamentos manuais e confirmações.",
            },
            {
              icon: <TrendingUp className="h-5 w-5" />,
              stat: "↑ 40%",
              title: "Mais agendamentos",
              description: "Agenda online disponível 24h reduz perdas por horário não preenchido.",
            },
            {
              icon: <Users className="h-5 w-5" />,
              stat: "100%",
              title: "Equipe alinhada",
              description: "Todos os profissionais veem a mesma agenda em tempo real.",
            },
            {
              icon: <Shield className="h-5 w-5" />,
              stat: "Zero",
              title: "Conflitos de horário",
              description: "A agenda inteligente bloqueia automaticamente horários ocupados.",
            },
          ].map((item) => (
            <Card key={item.title} className="border-border bg-background">
              <CardContent className="p-5">
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  {item.icon}
                </div>
                <p className="text-2xl font-bold text-emerald-600">{item.stat}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SalesSection>

      {/* ── DEPOIMENTOS ── */}
      <SalesSection
        id="depoimentos"
        title="O que donos de salão dizem sobre o Azzo"
        subtitle="Resultados reais de quem já usa no dia a dia."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: "Marina Silva",
              salon: "Studio Aurora — São Paulo, SP",
              result: "Aumentei meus agendamentos em 40% no primeiro mês",
              text: "Antes perdia muito tempo confirmando clientes pelo WhatsApp. Agora é automático e minha agenda está sempre cheia.",
              avatar: "MS",
              color: "bg-emerald-100 text-emerald-700",
            },
            {
              name: "Carlos Mendes",
              salon: "Salão Prime — Belo Horizonte, MG",
              result: "Reduzi em 2h por dia o trabalho administrativo",
              text: "O controle financeiro foi o que mais me surpreendeu. Consigo ver o faturamento do dia em segundos, sem planilha.",
              avatar: "CM",
              color: "bg-blue-100 text-blue-700",
            },
            {
              name: "Beatriz Costa",
              salon: "Bella Estética — Curitiba, PR",
              result: "Zero conflito de horário desde que comecei a usar",
              text: "Minha equipe de 5 profissionais se organizou sozinha depois do Azzo. Nunca mais dois clientes no mesmo horário.",
              avatar: "BC",
              color: "bg-purple-100 text-purple-700",
            },
          ].map((item) => (
            <Card key={item.name} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-3 text-sm font-semibold text-emerald-600">"{item.result}"</p>
                <p className="mt-2 text-sm text-muted-foreground">"{item.text}"</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${item.color}`}>
                    {item.avatar}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.salon}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SalesSection>

      {/* ── COMPARAÇÃO ── */}
      <SalesSection
        className="bg-card"
        title="Por que trocar o jeito antigo pelo Azzo?"
        subtitle="Compare o antes e o depois em cada área do seu salão."
      >
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Situação</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                  Caderno / WhatsApp
                </th>
                <th className="px-4 py-3 text-center font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">
                  Azzo Agenda Pro ✓
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Conflitos de horário", "Frequentes", "Zero — bloqueio automático"],
                ["Controle financeiro", "Planilha ou memória", "Painel em tempo real"],
                ["Confirmação de clientes", "Manual (você faz tudo)", "Automática"],
                ["Histórico de clientes", "Perdido ou espalhado", "Completo e acessível"],
                ["Relatórios de faturamento", "Inexistentes", "Diários e mensais"],
                ["Acesso pelo celular", "❌", "✅ Em qualquer lugar"],
                ["Gestão da equipe", "Impossível centralizar", "Cada um com seu acesso"],
              ].map(([situation, old, nw]) => (
                <tr key={situation} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{situation}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <X className="h-3.5 w-3.5 text-red-400" />
                      {old}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {nw}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SalesSection>

      {/* ── PREÇOS ── */}
      <SalesSection
        id="precos"
        title="Um investimento que se paga no primeiro mês"
        subtitle="Sem taxa de instalação. Sem contrato de fidelidade."
      >
        {selectedProduct ? (
          <div className="mx-auto max-w-md">
            <Card className="border-2 border-emerald-400 shadow-xl">
              <CardContent className="p-8 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  <Star className="h-3 w-3 fill-white" />
                  Mais popular
                </span>
                <h3 className="mt-4 text-xl font-bold text-foreground">{selectedProduct.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{selectedProduct.description}</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: selectedProduct.currency ?? "BRL",
                    }).format(selectedProduct.price)}
                  </span>
                  {selectedProduct.validityMonths && (
                    <span className="ml-1 text-sm text-muted-foreground">
                      /{selectedProduct.validityMonths === 1 ? "mês" : `${selectedProduct.validityMonths} meses`}
                    </span>
                  )}
                </div>
                <ul className="mt-6 space-y-2 text-left text-sm">
                  {(selectedProduct.features ?? [
                    "Agenda inteligente ilimitada",
                    "CRM de clientes completo",
                    "Controle financeiro",
                    "Confirmação automática",
                    "Suporte prioritário",
                  ]).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base"
                  onClick={() => scrollToSection("cadastro")}
                >
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  7 dias de garantia · Sem cartão agora · Cancele quando quiser
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <Card className="border-2 border-emerald-400 shadow-xl">
              <CardContent className="p-8 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  <Star className="h-3 w-3 fill-white" />
                  Mais popular
                </span>
                <h3 className="mt-4 text-xl font-bold text-foreground">Plano Pro Growth</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Agenda, equipe, clientes e financeiro em um único painel.
                </p>
                <ul className="mt-6 space-y-2 text-left text-sm">
                  {[
                    "Agenda inteligente ilimitada",
                    "CRM de clientes completo",
                    "Controle financeiro",
                    "Confirmação automática",
                    "Suporte prioritário via WhatsApp",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base"
                  onClick={() => scrollToSection("cadastro")}
                >
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  7 dias de garantia · Sem cartão agora · Cancele quando quiser
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </SalesSection>

      {/* ── GARANTIA ── */}
      <div className="border-y border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="mx-auto flex w-full max-w-3xl items-start gap-5 px-4 py-8 md:items-center md:px-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">Garantia total de 7 dias</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Experimente o Azzo por 7 dias. Se não gostar por qualquer motivo,{" "}
              <strong className="text-foreground">devolvemos cada centavo</strong> — sem perguntas,
              sem burocracia.
            </p>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <SalesSection
        title="Perguntas frequentes"
        subtitle="Tire suas dúvidas antes de começar."
      >
        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="space-y-2">
            {[
              {
                q: "Preciso instalar algum programa?",
                a: "Não. O Azzo funciona 100% pelo navegador — no computador, tablet ou celular. Sem instalação, sem configuração técnica.",
              },
              {
                q: "Minha equipe consegue usar sem dificuldade?",
                a: "Sim. Cada profissional tem seu próprio login e acessa apenas sua agenda. A interface é simples e intuitiva — sem necessidade de treinamento.",
              },
              {
                q: "E se eu já tiver clientes cadastrados em outro sistema?",
                a: "Você pode importar seus clientes facilmente. Se precisar de ajuda, nossa equipe de suporte auxilia na migração sem custo extra.",
              },
              {
                q: "Tem suporte em caso de dúvida?",
                a: "Sim. Oferecemos suporte via WhatsApp nos dias úteis para responder dúvidas e resolver problemas rapidamente.",
              },
              {
                q: "Posso cancelar quando quiser?",
                a: "Sim. Sem multa, sem contrato de fidelidade, sem burocracia. Cancele quando quiser diretamente pelo painel.",
              },
              {
                q: "Funciona para salão com vários profissionais?",
                a: "Sim. O Azzo foi pensado para equipes — cada profissional tem acesso próprio, e você como dono tem visão geral de tudo.",
              },
            ].map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-lg border border-border bg-card px-4"
              >
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SalesSection>

      {/* ── FORMULÁRIO DE CADASTRO ── */}
      <SalesSection id="cadastro" className="bg-card">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
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
          </div>

          <Card className="border-2 border-emerald-200 shadow-lg dark:border-emerald-900">
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sale-account-name">Nome completo</Label>
                  <Input
                    id="sale-account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
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
                    onChange={(e) => setAccountEmail(e.target.value)}
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
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    disabled={isCreatingAccount}
                  />
                  {accountPassword && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded bg-muted">
                        <div
                          className={`h-full rounded transition-all ${passwordStrength.barClassName}`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <p className={`text-xs ${passwordStrength.textClassName}`}>
                        Segurança da senha: {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-account-confirm-password">Confirmar senha</Label>
                  <Input
                    id="sale-account-confirm-password"
                    type="password"
                    value={accountConfirmPassword}
                    onChange={(e) => setAccountConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    disabled={isCreatingAccount}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-account-phone">Telefone / WhatsApp</Label>
                  <Input
                    id="sale-account-phone"
                    value={accountPhone}
                    onChange={(e) => setAccountPhone(maskPhoneBr(e.target.value))}
                    placeholder="(11) 99999-0000"
                    disabled={isCreatingAccount}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-account-salon">Nome do salão</Label>
                  <Input
                    id="sale-account-salon"
                    value={accountSalonName}
                    onChange={(e) => setAccountSalonName(e.target.value)}
                    placeholder="Ex.: Bella Studio"
                    disabled={isCreatingAccount}
                  />
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base"
                onClick={handleCreateAccountAndContinue}
                disabled={isCreatingAccount}
              >
                {isCreatingAccount ? (
                  "Criando sua conta..."
                ) : (
                  <>
                    Criar minha conta gratuitamente <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Dados protegidos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Sem cartão de crédito agora
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-emerald-500" />
                  7 dias de garantia
                </span>
              </div>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Entrar no sistema
            </Link>
          </p>
        </div>
      </SalesSection>

      {/* ── CTA FINAL ── */}
      <SalesSection>
        <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-6 py-14 text-center text-white shadow-lg">
          <h2 className="text-2xl font-bold md:text-4xl">
            Pronto para transformar seu salão?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 md:text-base">
            Mais de 200 salões já escolheram o Azzo. Comece hoje e veja a diferença
            em agendamentos, equipe e faturamento.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-white/90 text-base font-semibold px-8"
              onClick={() => scrollToSection("cadastro")}
            >
              Criar minha conta grátis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/60 text-white hover:bg-white/10"
              asChild
            >
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                Falar com suporte <MessageCircle className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          <p className="mt-5 text-xs text-white/70">
            Garantia de 7 dias · Sem fidelidade · Suporte via WhatsApp
          </p>
        </div>
      </SalesSection>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white">
                A
              </span>
              <p className="font-semibold text-white">Azzo Agenda Pro</p>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Sistema de gestão completo para salões de beleza, barbearias e estéticas.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Produto</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a></li>
              <li><a href="#precos" className="hover:text-white transition-colors">Preços</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Suporte</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Entrar no sistema</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><Link to="/politica-privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
              <li><Link to="/termos-de-uso" className="hover:text-white transition-colors">Termos de uso</Link></li>
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
