# Audit Técnico — Azzo Agenda Pro (frontend, projeto inteiro)

**Escopo:** todas as rotas (`src/app/route-manifest.ts`), páginas (`src/pages/**`), layouts, componentes compartilhados (`src/components/**`), formulários, modais/sheets e fluxos de navegação. Auditoria estática de código — não houve execução da aplicação em browser.

**Método:** leitura de `PRODUCT.md`/`DESIGN.md`, detector mecânico (`detect.mjs --json src/`), e varredura sistemática por grep + leitura de contexto nos 5 eixos do playbook, incluindo verificação assistida por sub-agente para achados amostrados em maior volume (botões ícone, formulários, hierarquia de heading, tabelas, memoização, overflow responsivo, largura de diálogo).

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | `ModuleIntro`/`CardTitle` não usam tags de heading reais — hierarquia semântica ausente na maioria das páginas de CRUD/relatório |
| 2 | Performance | 3 | Rotas com code-splitting completo e paginação server-side; poucos gaps de memoização em gráficos/listas |
| 3 | Responsive Design | 3 | Padrão consistente de `overflow-x-auto` e `DialogContent` mobile-safe; 1 diálogo com `max-w-4xl` sem margem mobile |
| 4 | Theming | 2 | Cores de gráfico (Recharts) hardcoded em hex em 3 arquivos, sem token — sistema de token não cobre a camada de gráficos |
| 5 | Implementation Integrity | 3 | Um achado real de "AI slop" (`text-violet-600` fora da Voz Única) e dois `border-l-4` de side-tab; resto do sistema é coerente e intencional |
| **Total** | | **13/20** | **Acceptable (trabalho significativo necessário)** |

## Implementation Integrity Verdict

**PASSA, com ressalva pontual.** O sistema expressa um design system coerente e específico do produto — "A Mesa de Vidro" (translucidez, halo de sombra, eyebrow, voz única de azul) está implementado de forma consistente em `src/index.css`, `tailwind.config.ts` e nos componentes shadcn customizados (`button.tsx`, `card.tsx`, `dialog.tsx`). Não há evidência de estrutura genérica intercambiável com outro produto: terminologia de domínio (comanda, atendimento, comissão), fluxos de agendamento e telas fiscais são específicos do negócio.

A ressalva: o detector mecânico encontrou 1 uso de `text-violet-600` (`ManagementReportPage.tsx:296`) que viola diretamente a Regra da Voz Única do próprio `DESIGN.md` ("o azul primário é a única cor com autoridade de ação"), e 2 usos de `border-l-4` (side-tab, `src/lib/appointment-status.ts`) — um tell clássico de UI gerada por IA que o próprio DESIGN.md rejeita implicitamente ao não descrever esse padrão em nenhum componente. Isolados, não sistêmicos, mas verificados e reais.

## Executive Summary

- **Audit Health Score: 13/20 (Acceptable — trabalho significativo necessário)**
- **Total de problemas: 13** — P0: 0 · P1: 2 · P2: 7 · P3: 4
- **Top 5 achados críticos:**
  1. **Heading semântico ausente** — `ModuleIntro` e `CardTitle` (usados em praticamente todo módulo) renderizam título como `<p>`, não `<h1>`–`<h4>`; a maioria das páginas de CRUD/relatório não tem hierarquia de heading real, prejudicando navegação por leitor de tela.
  2. **Botões de ícone sem `aria-label`** — 4+ ocorrências confirmadas (`CommissionRuleSetEditor.tsx`, `MembershipPlansPage.tsx`, `PackagesPage.tsx`, `Auditoria.tsx`) de botões só-ícone (excluir/detalhar) sem rótulo acessível.
  3. **Cores de gráfico hardcoded** — 6 ocorrências de hex cru (`#22c55e`, `#ef4444`, `#f59e0b`, `#10b981`, `#3b82f6`, `#0ea5e9`) em 3 componentes Recharts, sem token e sem adaptação a tema escuro.
  4. **Alvo de toque abaixo de 44px** — `size="icon"` do Button (padrão em ~134 usos/60 arquivos) é `h-9 w-9` (36px), e há overrides explícitos para `h-8 w-8` (32px); PRODUCT.md confirma uso mobile primário para o profissional.
  5. **`text-violet-600` fora da Voz Única** — quebra a regra nomeada mais rígida do próprio DESIGN.md, num relatório gerencial visível ao dono do salão.
- **Próximos passos recomendados:** ver seção "Recommended Actions" abaixo, começar por `/impeccable clarify` (heading semântico) e `/impeccable harden` (aria-labels), depois `/impeccable colorize`/`typeset` para tokens de gráfico, fechar com `/impeccable polish`.

## Detailed Findings by Severity

### P1 — Major

**[P1] Título de página/card sem tag de heading semântica**
- **Location**: `src/components/layout/module-surfaces.tsx:43` (`ModuleIntro`, usado por praticamente todo módulo — stock, report, appointments, clients); `src/components/ui/card.tsx:19` (`CardTitle`, implementado como `<p>` tipado `HTMLParagraphElement`, usado em toda a superfície de card do sistema)
- **Category**: Accessibility
- **Impact**: Leitores de tela navegam por landmarks e headings (`h1`–`h6`) para pular direto ao conteúdo relevante. Sem heading real, um usuário de leitor de tela não tem como pular para "Itens de Estoque" ou o título de um card de relatório — precisa ouvir a página inteira em sequência linear. Apenas um punhado de páginas isoladas (`SalePage.tsx:353`, `MinhaProducao.tsx:115`, `tax/*.tsx`) têm `<h1>` real; a maioria das telas de CRUD/relatório não tem hierarquia de heading alguma.
- **WCAG/Standard**: WCAG 2.4.6 (Headings and Labels, AA), 1.3.1 (Info and Relationships, A), 2.4.1 (Bypass Blocks, A)
- **Recommendation**: `ModuleIntro` deve renderizar o título como `<h1>` (página raiz de módulo) ou `<h2>` (subseção), mantendo a classe visual atual. `CardTitle` deve renderizar `<h3>` por padrão, com uma prop opcional `as` para os casos raros onde outro nível é correto — sem alterar aparência, só a tag semântica.
- **Suggested command**: `/impeccable clarify`

**[P1] Cores de gráfico hardcoded em hex, sem token de tema**
- **Location**: `src/components/financial/CashFlowChart.tsx:85-86` (`fill="#22c55e"`, `fill="#ef4444"`), `src/components/dashboard/WhatsAppReactivationChart.tsx:288-290` (`fill="#f59e0b"`, `fill="#10b981"`, `fill="#3b82f6"`), `src/pages/stock/StockOverview.tsx:231` (`fill="#0ea5e9"`)
- **Category**: Theming
- **Impact**: Nenhum desses hex tem variante para tema escuro nem passa pelo sistema de tokens (`tailwind.config.ts` não define `chart-1..5`). Em tema escuro os gráficos ficam com a mesma saturação/luminância calibrada para fundo claro, potencialmente com contraste pior contra o fundo `dark-background` (`hsl(222 39% 8%)`). Também é o único ponto do sistema onde uma cor de ação/estado (verde receita, vermelho despesa) não é derivada da paleta documentada em DESIGN.md — a "Voz Única" e a regra de neutros azulados não cobrem esses valores porque eles nunca passam pelo CSS.
- **WCAG/Standard**: 1.4.3 (Contrast, AA) — risco não confirmado sem renderização, mas o padrão de token ausente é o problema estrutural
- **Recommendation**: Definir tokens `--chart-positive`, `--chart-negative`, `--chart-1..5` (ou reaproveitar `--chart-*` do shadcn) em `src/index.css` com variantes claro/escuro, e trocar os hex por `fill="hsl(var(--chart-positive))"` etc. nos 3 componentes.
- **Suggested command**: `/impeccable colorize`

### P2 — Minor

**[P2] Botões de ícone sem `aria-label`**
- **Location**: `src/components/commissions/CommissionRuleSetEditor.tsx:179-186` (botão remover regra, só `Trash2`), `src/pages/memberships/MembershipPlansPage.tsx:265-267` (remover benefício), `src/pages/packages/PackagesPage.tsx:191-193` (remover item), `src/pages/Auditoria.tsx:294` e `:399` (usam `title=` em vez de `aria-label=`, inconsistente com o padrão de `aria-label` usado no resto do sistema, ex. `Header.tsx:100` `aria-label="Abrir notificacoes"`)
- **Category**: Accessibility
- **Impact**: Botão só-ícone sem `aria-label` é anunciado por leitor de tela sem nome (ou lê o `title`, que tem suporte inconsistente entre leitores/navegadores). Em fluxos de exclusão isso é particularmente arriscado — o usuário de leitor de tela não sabe o que o botão faz antes de ativá-lo.
- **WCAG/Standard**: WCAG 4.1.2 (Name, Role, Value, A), 2.5.3 (Label in Name, A)
- **Recommendation**: Adicionar `aria-label` descritivo (ex. `aria-label="Remover regra de comissão"`) nos 5 pontos listados; padronizar em `Auditoria.tsx` para usar `aria-label` em vez de/além de `title`.
- **Suggested command**: `/impeccable harden`

**[P2] Alvo de toque do botão-ícone abaixo de 44px**
- **Location**: `src/components/ui/button.tsx:24` (`icon: "h-9 w-9"` = 36px, padrão para ~134 usos em 60 arquivos), com overrides pontuais menores como `src/components/layout/Header.tsx:64` (`h-8 w-8` = 32px)
- **Category**: Responsive Design / Accessibility
- **Impact**: PRODUCT.md confirma que o uso no celular é primário para o profissional ("consulta a própria agenda... tipicamente no celular, entre um cliente e outro"). 36px passa no mínimo AA (WCAG 2.5.8, 24×24) mas fica abaixo da recomendação AAA de 44×44 e abaixo do padrão de conforto de toque em iOS HIG/Material (44/48px) — em uma ferramenta operada com o polegar entre atendimentos, aumenta erro de toque.
- **WCAG/Standard**: WCAG 2.5.5 (Target Size Enhanced, AAA) — não obrigatório, mas relevante dado o contexto de uso confirmado em PRODUCT.md
- **Recommendation**: Considerar elevar o `size="icon"` padrão para `h-10 w-10` (40px) ou `h-11 w-11` (44px) nas superfícies de uso móvel prioritário (sidebar, header, cards de agenda do profissional), mantendo `h-9 w-9` apenas onde o contexto é comprovadamente desktop-only.
- **Suggested command**: `/impeccable adapt`

**[P2] `React.memo`/`useMemo` ausente em cálculo de série de gráfico e card de agendamento semanal**
- **Location**: `src/pages/report/ManagementReportPage.tsx:118-127` (`serieChartData`/`topServicosChart` calculados via `.map()` direto no corpo de render, alimentando `BarChart`/`ResponsiveContainer` nas linhas 309/329), `src/components/appointments/AgendaWeekView.tsx:183-187` e `:209` (`WeekAppointmentCard` não envolto em `React.memo`, com `onClick={() => onAppointmentClick(apt)}` recriado a cada render dentro do `.map()`)
- **Category**: Performance
- **Impact**: Recalcula/re-renderiza gráfico e grade semanal completa a cada render do componente pai, mesmo quando os dados de entrada não mudaram. Em contraste, `AgendaDayView.tsx` (linhas 179-190) e `StockItemsPage.tsx` (linhas 90-102/455-479) já aplicam `useMemo` corretamente — o padrão existe no projeto, só não foi aplicado aqui.
- **WCAG/Standard**: n/a
- **Recommendation**: Envolver `serieChartData`/`topServicosChart` em `useMemo` com as dependências corretas; extrair `WeekAppointmentCard` com `React.memo` e mover o handler de clique para uma referência estável (`useCallback` no pai ou passar `apt.id` em vez de closure).
- **Suggested command**: `/impeccable optimize`

**[P2] Diálogo com largura fixa sem margem mobile**
- **Location**: `src/components/auditoria/AuditEventDetailDialog.tsx:46` (`className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0"`)
- **Category**: Responsive Design
- **Impact**: O `DialogContent` base (`src/components/ui/dialog.tsx:39`) já resolve isso corretamente com `w-full max-w-[calc(100%-2rem)] sm:max-w-2xl`, mas este componente sobrescreve com `max-w-4xl` (56rem) sem breakpoint e sem `mx-4`/margem de segurança — em viewport menor que 56rem + a margem esperada, o diálogo pode ultrapassar a viewport horizontalmente. `src/pages/tax/InvoiceEmission.tsx:363` tem o mesmo padrão de `max-w-4xl` mas mitiga com `mx-4 sm:mx-auto`.
- **WCAG/Standard**: WCAG 1.4.10 (Reflow, AA)
- **Recommendation**: Trocar para `sm:max-w-4xl` (deixando o mobile herdar o `max-w-[calc(100%-2rem)]` da base) ou adicionar `mx-4 sm:mx-auto` como em `InvoiceEmission.tsx`.
- **Suggested command**: `/impeccable adapt`

**[P2] `text-violet-600` fora da Voz Única**
- **Location**: `src/pages/report/ManagementReportPage.tsx:296` (achado pelo detector mecânico, categoria `ai-color-palette`)
- **Category**: Implementation Integrity / Theming
- **Impact**: DESIGN.md define explicitamente que o azul primário é "a única voz de ação do sistema" e turquesa "quase nunca aparece sozinha" — nenhuma regra prevê roxo/violeta em lugar nenhum da paleta. Um heading em `text-violet-600` no relatório gerencial (tela vista pelo dono do salão) quebra a regra nomeada mais rígida do sistema e é reconhecido pelo próprio detector como tell de paleta genérica de IA.
- **WCAG/Standard**: n/a (consistência de marca, não WCAG)
- **Recommendation**: Trocar para `text-primary` (Azul Confiança) ou, se for para diferenciar uma métrica secundária, `text-muted-foreground` — nunca uma cor fora da paleta documentada.
- **Suggested command**: `/impeccable colorize`

**[P2] `border-l-4` (side-tab) em utilitário de status de agendamento**
- **Location**: `src/lib/appointment-status.ts:2` e `:5`
- **Category**: Implementation Integrity
- **Impact**: Borda grossa de um lado só é o tell mais reconhecível de UI gerada por IA segundo o próprio detector do skill, e não tem equivalente em nenhuma regra nomeada de DESIGN.md (que usa halo de sombra e borda translúcida uniforme de 1px, nunca acento lateral grosso). Se esse token é usado para colorir badges de status de agendamento na agenda, ele introduz um vocabulário visual paralelo ao halo/pílula documentado.
- **WCAG/Standard**: n/a
- **Recommendation**: Verificar onde esse token é consumido (provavelmente `AgendaDayView`/`AgendaWeekView`) e substituir por um selo de pílula com fundo tingido (mesma fórmula de `badge-default`: 12% de fundo, 25% de borda), consistente com a Regra da Pílula.
- **Suggested command**: `/impeccable layout`

### P3 — Polish

**[P3] Fonte "overused" (Inter) como face principal do corpo**
- **Location**: `src/index.css:1` (Google Fonts: Inter), achado pelo detector mecânico, categoria `overused-font`
- **Category**: Implementation Integrity (advisory)
- **Impact**: Baixo — Inter é usado propositalmente como fonte de leitura corrida em DESIGN.md, com Manrope reservado para títulos como diferenciação. O detector sinaliza Inter por ubiquidade em UIs geradas por IA, mas aqui a combinação Inter+Manrope é uma decisão documentada e intencional, não um atalho.
- **WCAG/Standard**: n/a
- **Recommendation**: Nenhuma ação necessária — falso positivo relativo ao contexto do projeto (decisão de marca documentada), mas registrado porque o detector sinalizou.
- **Suggested command**: (nenhum — não acionável)

**[P3] Background decorativo de grid detectado em `index.css`**
- **Location**: `src/index.css:210`, achado pelo detector mecânico, categoria `codex-grid-background` (advisory)
- **Category**: Implementation Integrity (advisory)
- **Impact**: Baixo — grid-lines decorativos são um tell de UI genérica de IA quando usados sem propósito funcional. Não verificado neste passe se o uso aqui é o wash radial documentado em DESIGN.md ("dois brilhos radiais... fixos na viewport") ou uma grade de linhas separada; requer inspeção visual (fora do escopo desta auditoria estática) para confirmar.
- **WCAG/Standard**: n/a
- **Recommendation**: Confirmar visualmente se o padrão é o wash radial documentado (aceitável, mantém) ou uma grade de linhas adicional (avaliar remoção).
- **Suggested command**: `/impeccable critique`

**[P3] Título de item de auditoria usando `title=` como único rótulo acessível**
- **Location**: mesmos pontos do achado P2 de `aria-label` ausente (`Auditoria.tsx:294`, `:399`) — listado aqui separadamente apenas como lembrete de padronização de longo prazo, não duplicar correção
- **Category**: Accessibility
- **Impact**: Baixo isoladamente (coberto pela correção P2 acima); registrado para reforçar que o padrão `title`-only não deve se espalhar para novas telas.
- **WCAG/Standard**: 4.1.2
- **Recommendation**: Ver correção P2 correspondente.
- **Suggested command**: `/impeccable harden`

**[P3] Overrides explícitos de `size="icon"` menores que o padrão do componente**
- **Location**: `src/components/layout/Header.tsx:64` (`h-8 w-8`) e outros pontos onde `className` sobrescreve a altura/largura do ícone padrão
- **Category**: Implementation Integrity
- **Impact**: Baixo — indica que o botão-ícone não é um componente fechado; consumidores redefinem dimensão livremente, o que dificulta uma correção centralizada do achado P2 de alvo de toque (a mudança no `button.tsx` não cobre esses overrides).
- **WCAG/Standard**: n/a
- **Recommendation**: Ao corrigir o P2 de alvo de toque, também varrer overrides de `h-8 w-8`/`h-7 w-7` em botões-ícone e alinhar ao novo padrão, em vez de deixá-los menores que a base.
- **Suggested command**: `/impeccable adapt`

## Patterns & Systemic Issues

- **Heading semântico ausente é sistêmico, não isolado**: como `ModuleIntro` e `CardTitle` são os dois componentes que abrem a esmagadora maioria das telas e cards do sistema, a ausência de tag de heading real se propaga para virtualmente todo módulo (stock, report, appointments, clients, financeiro) — não é um bug de tela, é um bug de dois componentes de base.
- **Cores de gráfico hardcoded em hex aparecem em todo componente Recharts revisado** (`CashFlowChart`, `WhatsAppReactivationChart`, `StockOverview`) — não existe token `--chart-*` no projeto; qualquer novo gráfico provavelmente repetirá o padrão até um token existir.
- **O padrão de memoização (`useMemo`/`React.memo`) existe e é bem aplicado em algumas telas** (`AgendaDayView`, `StockItemsPage`) **mas não é uniforme** — telas de relatório com gráfico pesado (`ManagementReportPage`) e a grade semanal de agenda (`AgendaWeekView`) ficaram de fora.
- **`aria-label` é o padrão dominante e corretamente aplicado** na esmagadora maioria dos ~134 botões-ícone amostrados; os poucos gaps encontrados (ações de exclusão) são justamente os de maior risco por serem irreversíveis.

## Positive Findings

- **Nenhum `useEffect` + `fetch`/`axios` direto encontrado em todo `src/`** — o padrão de React Query documentado em `DEVELOPMENT_GUIDE.md` é seguido de forma completa e consistente.
- **`prefers-reduced-motion: reduce` tratado globalmente** em `src/index.css:234`, com comentário explícito registrando que a decisão veio de pedido do usuário — trata-se de acessibilidade de movimento tratada com intenção, não um kill genérico de `0.01ms`.
- **Code-splitting completo por rota** (`src/app/routes/lazy-pages.ts`) — todas as páginas de módulo carregam via `lazy()`, reduzindo o bundle inicial.
- **Paginação server-side** confirmada em telas de lista potencialmente longas (`StockItemsPage`, entre outras) — evita a necessidade de virtualização de lista.
- **`overflow-x-auto`/`overflow-auto` presente de forma consistente** em toda tabela/grade densa amostrada (Auditoria, painéis de admin, relatórios, agenda semanal) — nenhum caso confirmado de overflow horizontal sem contenção.
- **`DialogContent` base já mobile-safe** (`w-full max-w-[calc(100%-2rem)] sm:max-w-2xl`) — a maioria dos diálogos herda o comportamento correto sem esforço extra do consumidor.
- **Tabelas usam `TableHead` corretamente para cabeçalho** em toda ocorrência verificada — nenhuma tabela com `TableCell` fazendo o papel de `th`.
- **Zero `console.log`** em todo o código de produção do `src/`.
- **Sistema de tema claro/escuro com cobertura ampla** (`dark:` em 38 arquivos, 211 ocorrências) — a base de tokens de cor (exceto gráficos) está bem integrada ao tema.
- **Regras nomeadas do DESIGN.md são majoritariamente respeitadas na implementação real** — halo de sombra, borda translúcida a 70-80%, coluna confortável e tracejado reservado para vazio/erro aparecem consistentemente nos componentes verificados.

## Recommended Actions

1. **[P1] `/impeccable clarify`**: Corrigir `ModuleIntro` (`module-surfaces.tsx:43`) e `CardTitle` (`card.tsx:19`) para renderizar tags de heading reais (`h1`/`h2` e `h3`), preservando a aparência visual atual — restaura a hierarquia semântica em praticamente todo o produto de uma vez.
2. **[P1] `/impeccable colorize`**: Definir tokens `--chart-*` claro/escuro em `src/index.css` e substituir os 6 hex crus em `CashFlowChart.tsx`, `WhatsAppReactivationChart.tsx` e `StockOverview.tsx`.
3. **[P2] `/impeccable harden`**: Adicionar `aria-label` nos 5 botões-ícone sem rótulo (`CommissionRuleSetEditor.tsx`, `MembershipPlansPage.tsx`, `PackagesPage.tsx`, `Auditoria.tsx` ×2).
4. **[P2] `/impeccable adapt`**: Revisar `size="icon"` do `button.tsx` (36px → considerar 40-44px nas superfícies mobile-first) e normalizar overrides menores (`h-8 w-8` em `Header.tsx` e afins); corrigir a largura de `AuditEventDetailDialog.tsx` para `sm:max-w-4xl` ou `mx-4 sm:mx-auto`.
5. **[P2] `/impeccable optimize`**: Aplicar `useMemo` em `ManagementReportPage.tsx` (linhas 118-127) e `React.memo`/`useCallback` em `WeekAppointmentCard` (`AgendaWeekView.tsx`).
6. **[P2] `/impeccable colorize`**: Trocar `text-violet-600` (`ManagementReportPage.tsx:296`) por `text-primary` ou `text-muted-foreground`.
7. **[P2] `/impeccable layout`**: Substituir `border-l-4` (`appointment-status.ts:2,5`) pelo padrão de pílula tingida do sistema.
8. **[P3] `/impeccable critique`**: Confirmar visualmente se o grid decorativo de `index.css:210` é o wash radial documentado ou uma grade separada a remover.
9. **[Fechamento] `/impeccable polish`**: Passe final depois das correções acima, para garantir que nenhuma delas introduziu regressão visual nas regras nomeadas do DESIGN.md.

> Você pode pedir para eu rodar esses itens um de cada vez, todos de uma vez, ou na ordem que preferir.
>
> Rode `/impeccable audit` novamente depois das correções para ver a pontuação melhorar.
