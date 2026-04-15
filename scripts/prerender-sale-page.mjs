import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const sourceIndexPath = path.join(distDir, "index.html");
const targetDir = path.join(distDir, "compras");
const targetIndexPath = path.join(targetDir, "index.html");

const canonicalUrl = "https://www.azzoholding.com.br/compras";
const ogImageUrl = "https://www.azzoholding.com.br/images/hero_salon_system.png";

const softwareStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Azzo Agenda Pro",
  url: canonicalUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  image: ogImageUrl,
  description:
    "Sistema de gestao para saloes de beleza, barbearias e esteticas com agenda, clientes, equipe e financeiro em um unico painel.",
  offers: {
    "@type": "Offer",
    availability: "https://schema.org/InStock",
  },
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Preciso instalar algum programa?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nao. O Azzo funciona pelo navegador, no computador, tablet ou celular.",
      },
    },
    {
      "@type": "Question",
      name: "Minha equipe consegue usar sem dificuldade?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sim. Cada profissional pode ter o proprio acesso e acompanhar a propria agenda.",
      },
    },
    {
      "@type": "Question",
      name: "Posso cancelar quando quiser?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sim. Sem multa e sem fidelidade. O cancelamento continua simples pelo fluxo atual.",
      },
    },
    {
      "@type": "Question",
      name: "Tem suporte em caso de duvida?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sim. O suporte continua disponivel para orientar implantacao e uso do sistema.",
      },
    },
  ],
};

const salePageSnapshot = `
  <div class="min-h-screen bg-background text-foreground">
    <main id="conteudo-principal">
      <section class="relative isolate overflow-hidden bg-emerald-950 text-white">
        <div class="absolute inset-0 bg-cover bg-center opacity-30" style="background-image:url('/images/hero_salon_system.png')"></div>
        <div class="absolute inset-0 bg-emerald-200/28 mix-blend-multiply"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-300/26 via-emerald-200/18 to-emerald-100/14"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-emerald-950/64 via-emerald-900/34 to-emerald-950/12"></div>
        <div class="relative mx-auto flex min-h-[640px] w-full max-w-6xl items-center px-4 py-20 md:px-6">
          <header class="max-w-3xl">
            <p class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              Sistema completo para salao de beleza
            </p>
            <h1 class="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Sistema para salao de beleza com agenda, clientes, equipe e financeiro em um so lugar
            </h1>
            <p class="mt-5 max-w-2xl text-base text-white/85 md:text-lg">
              O Azzo Agenda Pro organiza o dia a dia do seu salao com agenda online, cadastro de clientes, equipe e financeiro em uma unica plataforma.
            </p>
            <p class="mt-3 max-w-2xl text-sm text-white/70">
              Ideal para saloes de beleza, barbearias e esteticas que precisam reduzir faltas, organizar a equipe, confirmar horarios e enxergar melhor o faturamento.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a href="#cadastro" class="inline-flex items-center rounded-md bg-white px-6 py-3 text-base font-semibold text-emerald-700">Comecar teste gratis</a>
              <a href="#funcionalidades" class="inline-flex items-center rounded-md border border-white/60 px-6 py-3 text-base font-semibold text-white">Ver como funciona</a>
            </div>
          </header>
        </div>
      </section>

      <section class="bg-muted/40">
        <div class="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:px-6">
          <article class="text-center"><p class="text-3xl font-bold text-emerald-600">200+</p><p class="mt-1 text-sm text-muted-foreground">Saloes ativos</p></article>
          <article class="text-center"><p class="text-3xl font-bold text-emerald-600">15 mil+</p><p class="mt-1 text-sm text-muted-foreground">Agendamentos por mes</p></article>
          <article class="text-center"><p class="text-3xl font-bold text-emerald-600">98%</p><p class="mt-1 text-sm text-muted-foreground">Taxa media de satisfacao</p></article>
          <article class="text-center"><p class="text-3xl font-bold text-emerald-600">&lt; 5 min</p><p class="mt-1 text-sm text-muted-foreground">Tempo para comecar</p></article>
        </div>
      </section>

      <section id="software-salao" class="py-12 md:py-16">
        <div class="mx-auto w-full max-w-6xl px-4 md:px-6">
          <header class="mb-8 max-w-3xl">
            <h2 class="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Software para salao de beleza, barbearia e clinica de estetica</h2>
            <p class="mt-3 text-sm text-muted-foreground md:text-base">
              Conteudo direto para quem esta buscando no Google uma plataforma para organizar agenda, clientes, equipe e financeiro.
            </p>
          </header>
          <div class="grid gap-6 md:grid-cols-3">
            <article class="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-foreground">Para saloes de beleza</h3>
              <p class="mt-3 text-sm leading-6 text-muted-foreground">Organize escovas, cortes, coloracao, agenda da equipe e retorno de clientes em um sistema para salao de beleza pensado para a operacao diaria.</p>
            </article>
            <article class="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-foreground">Para barbearias</h3>
              <p class="mt-3 text-sm leading-6 text-muted-foreground">Controle barbeiros, horarios, encaixes, confirmacoes e recorrencia com uma agenda online para barbearia mais simples de acompanhar.</p>
            </article>
            <article class="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-foreground">Para estetica</h3>
              <p class="mt-3 text-sm leading-6 text-muted-foreground">Centralize atendimentos, historico de clientes, equipe e faturamento em um software para clinica de estetica com visao operacional e comercial.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="funcionalidades" class="py-12 md:py-16 bg-card">
        <div class="mx-auto w-full max-w-6xl px-4 md:px-6">
          <header class="mb-8 max-w-3xl">
            <h2 class="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Tudo que seu salao precisa</h2>
            <p class="mt-3 text-sm text-muted-foreground md:text-base">Agenda online, controle financeiro, equipe e clientes no mesmo sistema.</p>
          </header>
          <div class="grid gap-6 md:grid-cols-3">
            <article class="rounded-2xl border border-border bg-background p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-foreground">Agenda inteligente</h3>
              <p class="mt-3 text-sm leading-6 text-muted-foreground">Bloqueio de horarios ocupados, visualizacao do dia e menos conflitos na rotina do salao.</p>
            </article>
            <article class="rounded-2xl border border-border bg-background p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-foreground">Gestao da equipe</h3>
              <p class="mt-3 text-sm leading-6 text-muted-foreground">Cada profissional acompanha a propria agenda e o dono do salao tem visao geral da operacao.</p>
            </article>
            <article class="rounded-2xl border border-border bg-background p-5 shadow-sm">
              <h3 class="text-lg font-semibold text-foreground">Financeiro organizado</h3>
              <p class="mt-3 text-sm leading-6 text-muted-foreground">Entradas, saidas e faturamento em um fluxo mais simples para tomada de decisao.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="faq" class="py-12 md:py-16">
        <div class="mx-auto w-full max-w-6xl px-4 md:px-6">
          <header class="mb-8 max-w-3xl">
            <h2 class="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Perguntas frequentes</h2>
          </header>
          <div class="space-y-4">
            <article class="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 class="text-base font-semibold text-foreground">Preciso instalar algum programa?</h3><p class="mt-2 text-sm text-muted-foreground">Nao. O Azzo funciona pelo navegador, no computador, tablet ou celular.</p></article>
            <article class="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 class="text-base font-semibold text-foreground">Minha equipe consegue usar sem dificuldade?</h3><p class="mt-2 text-sm text-muted-foreground">Sim. Cada profissional pode ter o proprio acesso e acompanhar a propria agenda.</p></article>
            <article class="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 class="text-base font-semibold text-foreground">Posso cancelar quando quiser?</h3><p class="mt-2 text-sm text-muted-foreground">Sim. Sem multa e sem fidelidade. O cancelamento continua simples pelo fluxo atual.</p></article>
            <article class="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 class="text-base font-semibold text-foreground">Tem suporte em caso de duvida?</h3><p class="mt-2 text-sm text-muted-foreground">Sim. O suporte continua disponivel para orientar implantacao e uso do sistema.</p></article>
          </div>
        </div>
      </section>
    </main>
  </div>
`;

const injectIntoHead = (html, snippets) =>
  html.replace("</head>", `${snippets.join("\n")}\n</head>`);

const replaceRoot = (html, content) => html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);

const run = async () => {
  const sourceHtml = await fs.readFile(sourceIndexPath, "utf8");
  const withStructuredData = injectIntoHead(sourceHtml, [
    `<script type="application/ld+json">${JSON.stringify(softwareStructuredData)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(faqStructuredData)}</script>`,
  ]);
  const prerenderedHtml = replaceRoot(withStructuredData, salePageSnapshot);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetIndexPath, prerenderedHtml, "utf8");
};

run().catch((error) => {
  console.error("Falha ao prerenderizar /compras:", error);
  process.exitCode = 1;
});
