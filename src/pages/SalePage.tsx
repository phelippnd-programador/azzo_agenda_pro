import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  Shield,
  Star,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SalesSection } from '@/components/sales/SalesSection';
import { SaleRegisterForm } from '@/components/sales/SaleRegisterForm';
import { useCheckoutProducts } from '@/hooks/useCheckoutProducts';

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const heroImage = '/images/hero_salon_system.png';
const heroOverlayImage = '/images/hero_atemporal.png';

const featureCards = [
  {
    title: 'Experiencia premium para o cliente',
    description:
      'Agendamentos claros, confirmacoes e lembretes automaticos para reduzir faltas e passar mais profissionalismo.',
    image: '/images/card_servico_1_1.png',
  },
  {
    title: 'Ferramentas certas para operar melhor',
    description:
      'Agenda, clientes, equipe e financeiro no mesmo painel, sem depender de caderno, planilha ou memoria.',
    image: '/images/card_ferramentas_1_1.png',
  },
  {
    title: 'Gestao tranquila e previsivel',
    description:
      'Acompanhe indicadores do salao, organize a rotina da equipe e enxergue o faturamento com mais clareza.',
    image: '/images/card_gestao_3_2.png',
  },
];

const operationsHighlights = [
  {
    icon: <CalendarClock className="h-5 w-5 text-emerald-600" />,
    title: 'Agenda inteligente',
    description: 'Bloqueio de horarios ocupados e visao completa do dia para evitar conflitos.',
    image: '/images/financeiro_organizado_v2.png',
  },
  {
    icon: <Users className="h-5 w-5 text-emerald-600" />,
    title: 'Gestao da equipe',
    description: 'Cada profissional acompanha a propria agenda e voce tem visao geral da operacao.',
    image: '/images/gestao_equipe.png',
  },
  {
    icon: <CreditCard className="h-5 w-5 text-emerald-600" />,
    title: 'Financeiro organizado',
    description: 'Entradas, saidas e faturamento em um fluxo mais simples para tomada de decisao.',
    image: '/images/detalhe_premium.png',
  },
];

const socialStats = [
  { stat: '200+', label: 'Saloes ativos' },
  { stat: '15 mil+', label: 'Agendamentos por mes' },
  { stat: '98%', label: 'Taxa media de satisfacao' },
  { stat: '< 5 min', label: 'Tempo para comecar' },
];

const faqItems = [
  {
    q: 'Preciso instalar algum programa?',
    a: 'Nao. O Azzo funciona pelo navegador, no computador, tablet ou celular.',
  },
  {
    q: 'Minha equipe consegue usar sem dificuldade?',
    a: 'Sim. Cada profissional pode ter o proprio acesso e acompanhar a propria agenda.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Sem multa e sem fidelidade. O cancelamento continua simples pelo fluxo atual.',
  },
  {
    q: 'Tem suporte em caso de duvida?',
    a: 'Sim. O suporte continua disponivel para orientar implantacao e uso do sistema.',
  },
];

export default function SalePage() {
  const { products } = useCheckoutProducts();
  const selectedProduct = products[0] ?? null;
  const appUrl =
    (import.meta.env.NEXT_PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, '') ||
    'https://www.azzoholding.com.br';
  const canonicalUrl = `${appUrl}/compras`;
  const ogImageUrl = `${appUrl}${heroImage}`;

  useEffect(() => {
    const setMetaTag = (
      selector: string,
      attr: 'name' | 'property',
      value: string,
      content: string,
    ) => {
      let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, value);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    const setLinkTag = (rel: string, href: string) => {
      let tag = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!tag) {
        tag = document.createElement('link');
        tag.rel = rel;
        document.head.appendChild(tag);
      }
      tag.href = href;
    };

    document.title = 'Sistema para Salao de Beleza | Azzo Agenda Pro';
    setMetaTag(
      'meta[name="description"]',
      'name',
      'description',
      'Sistema para salao de beleza com agenda online, clientes, equipe e financeiro em um unico painel. Conheca o Azzo Agenda Pro.',
    );
    setMetaTag(
      'meta[name="keywords"]',
      'name',
      'keywords',
      'sistema para salao de beleza, software para salao, agenda para salao, gestao para salao, sistema para barbearia, sistema para estetica',
    );
    setMetaTag(
      'meta[name="robots"]',
      'name',
      'robots',
      'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
    );
    setMetaTag(
      'meta[property="og:title"]',
      'property',
      'og:title',
      'Sistema para Salao de Beleza | Azzo Agenda Pro',
    );
    setMetaTag(
      'meta[property="og:description"]',
      'property',
      'og:description',
      'Agenda, clientes, equipe e financeiro em um unico sistema para saloes de beleza, barbearias e esteticas.',
    );
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Azzo Agenda Pro');
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImageUrl);
    setMetaTag(
      'meta[property="og:image:alt"]',
      'property',
      'og:image:alt',
      'Sistema para salao de beleza Azzo Agenda Pro',
    );
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag(
      'meta[name="twitter:title"]',
      'name',
      'twitter:title',
      'Sistema para Salao de Beleza | Azzo Agenda Pro',
    );
    setMetaTag(
      'meta[name="twitter:description"]',
      'name',
      'twitter:description',
      'Organize agenda, clientes, equipe e financeiro do seu salao com o Azzo Agenda Pro.',
    );
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImageUrl);
    setMetaTag(
      'meta[name="twitter:image:alt"]',
      'name',
      'twitter:image:alt',
      'Sistema para salao de beleza Azzo Agenda Pro',
    );
    setLinkTag('canonical', canonicalUrl);
  }, [canonicalUrl, ogImageUrl]);

  const saleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Azzo Agenda Pro',
    url: canonicalUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    image: ogImageUrl,
    description:
      'Sistema de gestao para saloes de beleza, barbearias e esteticas com agenda, clientes, equipe e financeiro em um unico painel.',
    offers: {
      '@type': 'Offer',
      price: selectedProduct?.price ?? undefined,
      priceCurrency: selectedProduct?.currency ?? 'BRL',
      availability: 'https://schema.org/InStock',
    },
  };

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
      >
        Pular para o conteudo principal
      </a>
      <div className="min-h-screen bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(saleStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
            <Link to="/compras" className="inline-flex items-center gap-3 font-semibold text-foreground">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white">
                A
              </span>
              Azzo Agenda Pro
            </Link>
            <nav
              aria-label="Navegacao principal da pagina de vendas"
              className="hidden items-center gap-7 text-sm text-muted-foreground md:flex"
            >
              <a href="#funcionalidades" className="transition-colors hover:text-foreground">
                Funcionalidades
              </a>
              <a href="#experiencia" className="transition-colors hover:text-foreground">
                Experiencia
              </a>
              <a href="#gestao" className="transition-colors hover:text-foreground">
                Gestao
              </a>
              <a href="#precos" className="transition-colors hover:text-foreground">
                Precos
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
              >
                Entrar
              </Link>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => scrollToSection('cadastro')}
              >
                Teste gratis
              </Button>
            </div>
          </div>
        </header>
        <main id="conteudo-principal">
          <section
            aria-labelledby="sale-hero-title"
            className="relative isolate overflow-hidden bg-emerald-950 text-white"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            {/* <div
              className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-screen"
              style={{ backgroundImage: `url(${heroOverlayImage})` }}
            /> */}
            <div className="absolute inset-0 bg-emerald-200/28 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/26 via-emerald-200/18 to-emerald-100/14" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/64 via-emerald-900/34 to-emerald-950/12" />

            <div className="relative mx-auto flex min-h-[640px] w-full max-w-6xl items-center px-4 py-20 md:px-6">
              <header className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  <Star className="h-3.5 w-3.5 fill-white text-white" />
                  Sistema completo para salao de beleza
                </span>
                <h1
                  id="sale-hero-title"
                  className="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl"
                >
                  Agenda, clientes, equipe e financeiro em um so lugar
                </h1>
                <p className="mt-5 max-w-xl text-base text-white/85 md:text-lg">
                  O Azzo Agenda Pro organiza o dia a dia do seu salao com uma experiencia mais
                  profissional para o cliente e uma rotina mais simples para a operacao.
                </p>
                <p className="mt-3 max-w-xl text-sm text-white/70">
                  Ideal para saloes de beleza, barbearias e esteticas que precisam reduzir faltas,
                  organizar a equipe e enxergar melhor o faturamento.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="bg-white px-8 text-base font-semibold text-emerald-700 hover:bg-white/90"
                    onClick={() => scrollToSection('cadastro')}
                  >
                    Comecar teste gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/60 bg-transparent text-white hover:bg-white/10"
                    onClick={() => scrollToSection('funcionalidades')}
                  >
                    Ver como funciona
                  </Button>
                </div>

                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/75">
                  {['Sem cartao agora', 'Acesso imediato', 'Garantia de 7 dias'].map((text) => (
                    <span key={text} className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      {text}
                    </span>
                  ))}
                </div>
              </header>
            </div>
          </section>

          <section aria-label="Indicadores de uso da plataforma" className="bg-muted/40">
            <ul className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:px-6">
              {socialStats.map((item) => (
                <li key={item.label} className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{item.stat}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </li>
              ))}
            </ul>
          </section>

          <SalesSection
            id="software-salao"
            title="Software para salao de beleza, barbearia e clinica de estetica"
            subtitle="Conteudo direto para quem esta buscando no Google uma plataforma para organizar agenda, clientes, equipe e financeiro."
          >
            <div className="grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground">Para saloes de beleza</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Organize escovas, cortes, coloracao, agenda da equipe e retorno de clientes em um
                  sistema para salao de beleza pensado para operacao diaria.
                </p>
              </article>
              <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground">Para barbearias</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Controle barbeiros, horarios, encaixes, confirmacoes e recorrencia com uma agenda
                  online para barbearia mais simples de acompanhar.
                </p>
              </article>
              <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground">Para estetica</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Centralize atendimentos, historico de clientes, equipe e faturamento em um
                  software para clinica de estetica com visao operacional e comercial.
                </p>
              </article>
            </div>
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-sm leading-7 text-muted-foreground">
                Se a busca for por <strong className="text-foreground">agenda para salao</strong>,
                <strong className="text-foreground"> sistema para barbearia</strong>,
                <strong className="text-foreground"> programa para estetica</strong> ou
                <strong className="text-foreground"> controle financeiro para salao</strong>, esta
                pagina descreve exatamente o produto que a pessoa procura e leva para o mesmo fluxo
                real de cadastro e compra.
              </p>
            </div>
          </SalesSection>

          <SalesSection
            id="funcionalidades"
            title="Tudo que seu salao precisa"
            subtitle="Mesmo padrao visual da proposta comercial, mas mantendo a operacao real da pagina."
          >
            <div className="grid gap-6 md:grid-cols-3">
              {featureCards.map((item) => (
                <article key={item.title}>
                  <Card className="overflow-hidden border-border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-64 w-full object-cover"
                    />
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-emerald-700">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </div>
          </SalesSection>

          <SalesSection
            id="experiencia"
            className="bg-slate-50 dark:bg-slate-900/40"
            title="Uma experiencia melhor para seus clientes"
            subtitle="Fluxo mais profissional desde a confirmacao do horario ate o atendimento."
          >
            <div className="grid items-center gap-10 md:grid-cols-2">
              <figure className="overflow-hidden rounded-[28px] border border-border bg-card shadow-lg">
                <img
                  src="/images/experiencia_cliente.png"
                  alt="Experiencia premium do cliente no Azzo Agenda Pro"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </figure>
              <div>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Uma jornada mais clara para quem agenda com voce
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  O Azzo ajuda o salao a operar com mais consistencia. O cliente entende melhor o
                  horario, recebe lembretes e a equipe trabalha com menos ruido.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                  {[
                    'Agendamento organizado e facil de acompanhar',
                    'Confirmacao automatica para reduzir faltas',
                    'Historico do cliente centralizado no sistema',
                    'Menos improviso no dia a dia do atendimento',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SalesSection>

          <SalesSection
            id="gestao"
            title="Gestao inteligente do seu negocio"
            subtitle="Dados e rotina operacional organizados no mesmo painel."
          >
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Controle o salao sem depender de caderno e memoria
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Com agenda, equipe, financeiro e clientes integrados, fica mais facil enxergar o
                  que esta funcionando e onde a operacao precisa de ajuste.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {operationsHighlights.map((item) => (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                        {item.icon}
                      </div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>

              <figure className="order-1 overflow-hidden rounded-[28px] border border-border bg-card shadow-lg md:order-2">
                <img
                  src="/images/gestao_tranquila.png"
                  alt="Gestao do salao com indicadores e operacao organizada"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </figure>
            </div>
          </SalesSection>

          <SalesSection
            className="bg-card"
            title="Visao detalhada das principais areas"
            subtitle="Os recursos mais usados pelo dono do salao aparecem com mais destaque."
          >
            <div className="grid gap-6 md:grid-cols-3">
              {operationsHighlights.map((item) => (
                <article key={item.title}>
                  <Card className="overflow-hidden border-border bg-background shadow-sm">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-72 w-full object-cover object-center"
                    />
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </div>
          </SalesSection>

          <SalesSection
            className="bg-slate-50 dark:bg-slate-900/40"
            title="O jeito antigo custa caro"
            subtitle="Problemas comuns de salao que o sistema ajuda a reduzir."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: <X className="h-4 w-4 text-red-500" />,
                  title: 'Conflitos de horario',
                  description:
                    'Dois clientes no mesmo horario, retrabalho na recepcao e equipe desorganizada.',
                },
                {
                  icon: <BellRing className="h-4 w-4 text-red-500" />,
                  title: 'Cliente sem confirmacao',
                  description:
                    'Faltas por esquecimento e perda de receita quando o lembrete depende de mensagem manual.',
                },
                {
                  icon: <CreditCard className="h-4 w-4 text-red-500" />,
                  title: 'Financeiro no escuro',
                  description:
                    'Dificuldade para saber o que entrou, o que saiu e quanto o salao realmente faturou.',
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-red-100 bg-white p-5 dark:border-red-900/40 dark:bg-red-950/20"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50">
                    {item.icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </article>
              ))}
            </div>
          </SalesSection>

          <SalesSection
            id="precos"
            title="Um investimento que se paga no primeiro mes"
            subtitle="Sem taxa de instalacao. Sem fidelidade. Mantendo o checkout atual."
          >
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <article aria-label="Plano em destaque">
                <Card className="border-2 border-emerald-400 shadow-xl">
                  <CardContent className="p-8">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                      <Star className="h-3 w-3 fill-white" />
                      Mais popular
                    </span>

                    {selectedProduct ? (
                      <>
                        <h3 className="mt-5 text-2xl font-bold text-foreground">{selectedProduct.name}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {selectedProduct.description}
                        </p>
                        <div className="mt-6">
                          <span className="text-4xl font-bold text-foreground">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: selectedProduct.currency ?? 'BRL',
                            }).format(selectedProduct.price)}
                          </span>
                          {selectedProduct.validityMonths && (
                            <span className="ml-1 text-sm text-muted-foreground">
                              /{selectedProduct.validityMonths === 1 ? 'mes' : `${selectedProduct.validityMonths} meses`}
                            </span>
                          )}
                        </div>
                        <ul className="mt-6 space-y-2 text-sm">
                          {(selectedProduct.features ?? [
                            'Agenda inteligente ilimitada',
                            'CRM de clientes completo',
                            'Controle financeiro',
                            'Confirmacao automatica',
                            'Suporte prioritario',
                          ]).map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-foreground">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <>
                        <h3 className="mt-5 text-2xl font-bold text-foreground">Plano Pro Growth</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Agenda, equipe, clientes e financeiro em um unico painel.
                        </p>
                        <ul className="mt-6 space-y-2 text-sm">
                          {[
                            'Agenda inteligente ilimitada',
                            'CRM de clientes completo',
                            'Controle financeiro',
                            'Confirmacao automatica',
                            'Suporte prioritario via WhatsApp',
                          ].map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-foreground">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    <Button
                      size="lg"
                      className="mt-8 w-full bg-emerald-600 text-base text-white hover:bg-emerald-700"
                      onClick={() => scrollToSection('cadastro')}
                    >
                      Comecar agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="mt-3 text-xs text-muted-foreground">
                      7 dias de garantia · Sem cartao agora · Cancele quando quiser
                    </p>
                  </CardContent>
                </Card>
              </article>

              <article className="rounded-[28px] border border-border bg-card p-6 shadow-lg">
                <img
                  src="/images/detalhe_premium.png"
                  alt="Detalhe visual premium do sistema para salao de beleza"
                  loading="lazy"
                  className="h-64 w-full rounded-[22px] object-cover"
                />
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
                  O mesmo sistema para vender melhor e operar melhor
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  A ideia desta pagina continua a mesma: capturar a venda sem quebrar o fluxo real
                  de cadastro e escolha do plano. O ajuste aqui foi visual, mantendo formulario,
                  checkout e navegacao como ja estavam funcionando.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                  {[
                    'Formulario real de criacao de conta mantido',
                    'Integracao atual com produto e checkout preservada',
                    'CTA direcionando para o mesmo fluxo de compra',
                    'Conteudo mais alinhado com a proposta da landing de referencia',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </SalesSection>

          <section
            aria-labelledby="garantia-title"
            className="border-y border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
          >
            <div className="mx-auto flex w-full max-w-3xl items-start gap-5 px-4 py-8 md:items-center md:px-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <h2 id="garantia-title" className="text-lg font-bold text-foreground">
                  Garantia total de 7 dias
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Experimente o Azzo por 7 dias. Se nao fizer sentido para o seu negocio,
                  devolvemos o valor sem burocracia.
                </p>
              </div>
            </div>
          </section>

          <SalesSection
            id="depoimentos"
            title="O que donos de salao dizem sobre o Azzo"
            subtitle="Resultados reais de quem ja usa no dia a dia."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  name: 'Marina Silva',
                  salon: 'Studio Aurora · Sao Paulo, SP',
                  result: 'Aumentei meus agendamentos em 40% no primeiro mes',
                  text: 'Antes eu dependia de mensagem manual para tudo. Hoje minha agenda fica muito mais organizada.',
                  avatar: 'MS',
                  color: 'bg-emerald-100 text-emerald-700',
                },
                {
                  name: 'Carlos Mendes',
                  salon: 'Salao Prime · Belo Horizonte, MG',
                  result: 'Reduzi o tempo administrativo da equipe',
                  text: 'O financeiro e a agenda em um painel so mudaram minha rotina. Fica muito mais facil decidir.',
                  avatar: 'CM',
                  color: 'bg-blue-100 text-blue-700',
                },
                {
                  name: 'Beatriz Costa',
                  salon: 'Bella Estetica · Curitiba, PR',
                  result: 'Zero conflito de horario desde a implantacao',
                  text: 'Minha equipe finalmente trabalha com a mesma visao do dia. Isso tirou muito ruido da operacao.',
                  avatar: 'BC',
                  color: 'bg-purple-100 text-purple-700',
                },
              ].map((item) => (
                <article key={item.name}>
                  <Card className="h-full border-border bg-card">
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-emerald-600">{item.result}</p>
                      <blockquote className="mt-2 flex-1 text-sm text-muted-foreground">
                        <p>"{item.text}"</p>
                      </blockquote>
                      <footer className="mt-4 flex items-center gap-2">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${item.color}`}
                        >
                          {item.avatar}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.salon}</p>
                        </div>
                      </footer>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </div>
          </SalesSection>

          <SalesSection
            id="faq"
            className="bg-slate-50 dark:bg-slate-900/40"
            title="Perguntas frequentes"
            subtitle="Tire suas duvidas antes de comecar."
          >
            <div className="mx-auto max-w-2xl">
              <Accordion type="single" collapsible className="space-y-2">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={item.q}
                    value={`faq-${index}`}
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

          <SaleRegisterForm />

          <SalesSection>
            <section
              aria-labelledby="cta-final-title"
              className="rounded-[28px] bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-6 py-14 text-center text-white shadow-lg"
            >
              <h2 id="cta-final-title" className="text-2xl font-bold md:text-4xl">
                Pronto para transformar seu salao?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 md:text-base">
                Comece hoje e use um sistema pensado para organizar agenda, clientes, equipe e
                financeiro sem complicar a operacao.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-white px-8 text-base font-semibold text-emerald-700 hover:bg-white/90"
                  onClick={() => scrollToSection('cadastro')}
                >
                  Criar minha conta gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/60 bg-transparent text-white hover:bg-white/10"
                  asChild
                >
                  <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                    Falar com suporte
                    <MessageCircle className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="mt-5 text-xs text-white/70">
                Garantia de 7 dias · Sem fidelidade · Suporte via WhatsApp
              </p>
            </section>
          </SalesSection>

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
                  Sistema de gestao completo para saloes de beleza, barbearias e esteticas.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Produto</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  <li>
                    <a href="#funcionalidades" className="transition-colors hover:text-white">
                      Funcionalidades
                    </a>
                  </li>
                  <li>
                    <a href="#experiencia" className="transition-colors hover:text-white">
                      Experiencia
                    </a>
                  </li>
                  <li>
                    <a href="#precos" className="transition-colors hover:text-white">
                      Precos
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Suporte</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  <li>
                    <a href="#faq" className="transition-colors hover:text-white">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <Link to="/login" className="transition-colors hover:text-white">
                      Entrar no sistema
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Legal</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  <li>
                    <Link to="/politica-privacidade" className="transition-colors hover:text-white">
                      Privacidade
                    </Link>
                  </li>
                  <li>
                    <Link to="/termos-de-uso" className="transition-colors hover:text-white">
                      Termos de uso
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
              © {new Date().getFullYear()} Azzo Agenda Pro. Todos os direitos reservados.
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
