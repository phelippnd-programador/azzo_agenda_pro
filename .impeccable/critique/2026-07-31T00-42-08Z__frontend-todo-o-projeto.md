---
target: frontend inteiro (todas as rotas)
total_score: 30
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
timestamp: 2026-07-31T00-42-08Z
slug: frontend-todo-o-projeto
---
Method: dual-agent (A: a7f8e382a2972cab8 · B: ac13354e8945cd9d0)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | `PosPage.tsx` usa texto puro "Carregando..." em vez do padrão de skeleton/`PageListLoadingState`; `Index.tsx` não tem loading state para `customerRanking` (falha silenciosa). |
| 2 | Match System / Real World | 4 | Vocabulário do domínio ("comanda", "atendimento", "sinal") consistente em todo o fluxo. |
| 3 | User Control and Freedom | 3 | Cancelar/voltar existem na maioria dos fluxos; onboarding não tem link de volta claro após travar em CPF/CNPJ ausente (ver Jordan abaixo). |
| 4 | Consistency and Standards | 2 | Maior achado estrutural: gestão de formulário dividida — `Login`/`Register`/`StepSalon` usam RHF+Zod; `ServiceFormDialog`, `ProfessionalFormDialog`, `ClientUpsertDialog`, `StockItemsPage`, `MembershipPlansPage` usam `useState` manual por campo, contrariando a convenção do próprio `DEVELOPMENT_GUIDE.md`. Tokens semânticos `--success`/`--warning` existem mas são amplamente ignorados fora do módulo Estoque. |
| 5 | Error Prevention | 3 | Diálogos de confirmação padronizados para ações destrutivas; formulários manuais validam só no submit, sem feedback ao vivo. |
| 6 | Recognition Rather Than Recall | 3 | Badges de status, filtros e `ModuleIntro` orientam bem a navegação entre telas. |
| 7 | Flexibility and Efficiency | 3 | Toggle dia/semana/mês, tour guiado; sem evidência de ações em lote fora de import de estoque/clientes. |
| 8 | Aesthetic and Minimalist Design | 2 | `Index.tsx` empilha `ModuleIntro` → `WorkspaceNotice` → `OnboardingChecklist` → cabeçalho de seção antes de qualquer dado real; paletas ad-hoc (amber/sky/emerald/blue) competem com a voz única azul em vários cards do dashboard. |
| 9 | Error Recovery | 3 | `resolveUiError` centraliza mensagens e toasts; "Failed to fetch" aparece cru na tela de agendamento público quando a API falha (achado do Assessment B), sem estado de erro amigável. |
| 10 | Help and Documentation | 4 | Tours React Joyride em Fiscal/Agenda/Estoque/WhatsApp são um diferencial real e consistentemente reusados via `TutorialLauncherButton`. |
| **Total** | | **30/40** | **Good (75%)** |

## Design Specificity Verdict

**LLM assessment (Assessment A):** O sistema é genuinamente autoral na camada de primitivos — `button.tsx` reproduz a especificação do DESIGN.md quase byte a byte (translate-y-0.5, sombra soft→panel, `size="icon"` forçando `ghost`), `page-states.tsx` bate com a anatomia fixa de vazio/erro, e `ModuleIntro` é um componente de assinatura genuinamente reusado. Mas a especificidade se corrói rápido fora da camada de primitivos: telas de alto tráfego (`Index.tsx`, `Register.tsx`, `FinancialCashClosing.tsx`) recorrem a classes Tailwind cruas (`amber-50`, `sky-700`, `emerald-600`, `blue-600`) em vez dos tokens `--success`/`--warning`/`--destructive` que o próprio sistema define — o resultado lê como "Mesa de Vidro na casca, kit-inicial Tailwind ad-hoc no conteúdo" em telas que lidam com dinheiro.

**Deterministic scan (Assessment B):** `detect.mjs --json src` rodou limpo (exit 2 = achados, não erro): **25 achados**, todos `advisory`/`warning`, nenhum `error`.
- `design-system-font-size`: 16 ocorrências — tamanhos fora do ramp tipográfico (ex.: `BrandLockup.tsx:36,45` com `1.35rem`/`1.55rem`/`0.72rem`; `ForgotPassword.tsx`/`Register.tsx`/`ResetPassword.tsx` com pares `2rem`/`15px`).
- `design-system-color`: 4 ocorrências — cores fora da paleta documentada, incluindo `#000`/`rgba(0,0,0,0.55)` em `src/index.css:217,271,303`.
- `side-tab` (warning): 2 — `src/lib/appointment-status.ts:2,5` (`border-l-4` no mapa de tons de status; o Assessment B confirmou manualmente que o padrão se repete nos 6 status, não só 2, mas julgou que aqui é codificação semântica intencional, não decoração — achado válido mecanicamente, mas com nuance de intenção).
- `overused-font` (warning): 1 — `src/index.css:1` (Inter).
- `codex-grid-background` (advisory): 1 — grid decorativo em `src/index.css:210`.
- `ai-color-palette` (warning): 1 — `text-violet-600` em `src/pages/report/ManagementReportPage.tsx:296` no card "Taxa de Ocupação", **confirmado como drift real** (não falso positivo): os cards vizinhos (linhas 240-284) usam tokens do sistema (`text-destructive`, `text-success`, `text-sky-500`), só este usa violet cru.

Nenhum falso positivo relevante identificado além da nuance do `side-tab`. Os achados de `design-system-font-size`/`design-system-color` batem exatamente com o que o Assessment A encontrou de forma independente na leitura de código (drift de tokens semânticos em telas de dinheiro), o que reforça a confiança no achado combinado.

**Visual overlays:** Não aplicável nesta rodada — a arquitetura de sub-agentes usada não expôs um overlay visual único injetado no navegador do usuário (`[Human]` tab); a evidência de navegador do Assessment B veio de `read_page`/`get_page_text`/console, não de screenshot pixel-level (a ferramenta de screenshot retornou erro de compositing neste ambiente). Rotas autenticadas (dashboard, agenda, financeiro, estoque) ficaram fora do alcance da inspeção visual por falta de credenciais de teste — avaliação dessas rotas é só leitura de código.

## Overall Impression

O frontend tem uma espinha dorsal de design forte e bem documentada (Mesa de Vidro) e a camada de componentes primitivos (`button`, `card`, `page-states`, `ModuleIntro`) segue essa espinha com fidelidade real — isso não é retórica de DESIGN.md sem lastro no código. A rodada anterior de correções (tokens `--success`/`--warning`, Estoque reestruturado, tipografia acima do piso de 12px) claramente pegou. Mas o padrão não se propagou para todas as telas de alto tráfego: Dashboard, Cadastro e Fechamento de Caixa — exatamente as telas que o dono do salão mais usa, segundo o próprio PRODUCT.md — ainda usam cor Tailwind crua em vez de tokens semânticos, e a gestão de formulário está dividida entre RHF+Zod (convenção do projeto) e `useState` manual nos diálogos de CRUD mais usados (Serviço, Profissional, Cliente). A maior oportunidade não é achar problema novo de vidro/sombra — a rodada anterior já resolveu a maior parte disso — é fechar o desvio entre "módulo mais recente segue a regra" (Estoque) e "módulo mais usado ainda não segue" (Dashboard/Financeiro/Cadastros).

## What's Working

1. **`src/components/ui/button.tsx`** — implementa a spec do DESIGN.md sem desvio: mecânica de translate/sombra, regra de `size="icon"` forçando `ghost`.
2. **`src/pages/appointments/Agenda.tsx`** — o seletor de ação "Concluir atendimento" (Adicionar em comanda vs Pagar agora) e a cópia de confirmação de cancelamento (com nome/data/hora do cliente) são exemplos de manual de prevenção de erro + reasseguramento num momento crítico de receita.
3. **`src/components/layout/module-surfaces.tsx` (`ModuleIntro`)** — componente de assinatura genuinamente reusado, exatamente como o DESIGN.md o descreve ("gesto que faz um módulo parecer parte deste sistema").
4. **Módulo Estoque** — é o único módulo com paridade completa entre código e tokens semânticos (`text-success`/`text-warning` via `hsl(var(--success))`), confirmando que a rodada de correção anterior funcionou onde foi aplicada.

## Priority Issues

**[P1] Gestão de formulário dividida entre RHF+Zod e `useState` manual, contrariando a convenção do projeto**
- **Why it matters**: `ServiceFormDialog.tsx`, `ProfessionalFormDialog.tsx`, `ClientUpsertDialog.tsx`, `StockItemsPage.tsx`, `MembershipPlansPage.tsx` usam estado manual por campo com validação só no submit — exatamente o padrão que `DEVELOPMENT_GUIDE.md`/CLAUDE.md do frontend probem ("Formulários sempre com React Hook Form + Zod, nunca useState isolado"). São alguns dos diálogos mais usados do app (todo onboarding passa por pelo menos dois deles).
- **Fix**: migrar incrementalmente para RHF+Zod, começando por Serviço/Profissional/Cliente (maior tráfego).
- **Suggested command**: `/impeccable harden` (arquivos: `src/components/services/ServiceFormDialog.tsx:92-120`, `src/components/professionals/ProfessionalFormDialog.tsx:1-60`, `src/components/clients/ClientUpsertDialog.tsx:60-75`).

**[P1] Tokens semânticos `--success`/`--warning` existem mas são amplamente ignorados fora do Estoque**
- **Why it matters**: `Index.tsx` (linhas 117-159), `Register.tsx` (linhas 23-52) e `FinancialCashClosing.tsx` (linhas 452-487) usam `amber-*`/`orange-*`/`sky-*`/`emerald-*`/`blue-*`/`red-*` crus em vez de `text-warning`/`text-success`/`text-destructive`. Confirmado de forma independente pelo detector (`design-system-color`, `ai-color-palette` em `ManagementReportPage.tsx:296`). Isso é exatamente a disciplina que a Regra da Voz Única e a Regra do Cinza Proibido do DESIGN.md existem para garantir — e ela quebra justo nas telas de dinheiro (Dashboard, Fechamento de Caixa, Cadastro), que são as de maior tráfego do dono do salão.
- **Fix**: substituir classes Tailwind cruas pelos tokens semânticos em todo o sistema; considerar lint de classnames banidas para prevenir regressão.
- **Suggested command**: `/impeccable harden` ou `/impeccable polish` (arquivos: `src/pages/Index.tsx:117-159`, `src/pages/Register.tsx:23-52`, `src/pages/FinancialCashClosing.tsx:452-487`, `src/pages/report/ManagementReportPage.tsx:296`, `src/index.css:217,271,303`).

**[P2] Estados vazios reimplementados fora da anatomia fixa (`PageEmptyState`)**
- **Why it matters**: `PosPage.tsx:76-87` monta seu próprio card de estado vazio sem borda tracejada em vez de usar `PageEmptyState`. A Regra do Tracejado Reservado existe justamente para que a borda tracejada só signifique "sem conteúdo" — um estado vazio improvisado enfraquece esse sinal em todo o resto do app, além de duplicar código que já existe como componente compartilhado.
- **Fix**: trocar o bloco manual por `<PageEmptyState title=... description=... action={{...}} />`.
- **Suggested command**: `/impeccable polish` (arquivo: `src/pages/pos/PosPage.tsx:76-87`).

**[P2] Dashboard (`Index.tsx`) tem excesso de preâmbulo antes dos dados reais**
- **Why it matters**: `ModuleIntro` → `WorkspaceNotice` → `OnboardingChecklist` → cabeçalho de seção se empilham (linhas 403-472) antes do primeiro card de métrica. Isso tensiona diretamente com o Princípio de Produto #1 ("o dono acumula funções e tem pouco tempo") — quatro blocos de enquadramento antes dos números que ele abre o app para ver.
- **Fix**: consolidar `ModuleIntro`+`WorkspaceNotice` em um bloco só, ou tornar `WorkspaceNotice` condicional a risco real em vez de sempre visível.
- **Suggested command**: `/impeccable distill` (arquivo: `src/pages/Index.tsx:403-472`).

**[P3] Estado de erro cru ("Failed to fetch") vazando na tela pública de agendamento**
- **Why it matters**: confirmado por evidência de navegador (Assessment B) na rota `/agendar/:slug` — quando a API falha, o texto técnico "Failed to fetch" aparece na tela sem um estado de erro amigável. Essa é a rota usada por clientes sem login e sem contexto do sistema (persona Jordan/Casey), então um erro técnico cru é o pior lugar do produto para isso aparecer.
- **Fix**: capturar o erro de rede e renderizar via `PageErrorState` com linguagem em português voltada ao cliente final ("Não conseguimos carregar os serviços agora, tente novamente").
- **Suggested command**: `/impeccable clarify` (arquivo: página de agendamento público, ex.: `src/pages/appointments/PublicBooking.tsx` — confirmar caminho exato).

## Persona Red Flags

**Jordan (First-Timer, dono em onboarding)**: `OnboardingPage.tsx` — quando falta CPF/CNPJ do salão (linhas 238-241), o wizard mostra um toast de erro mandando "Cadastre em Perfil do Salão antes de continuar", mas não oferece link/botão para ir até lá — o usuário é mandado para fora do wizard sem caminho de volta claro. `Login.tsx:131` engole silenciosamente falhas ao checar status de onboarding (`catch { // segue para o dashboard normalmente }`) — um first-timer cujo check falhar por qualquer motivo cai num dashboard não configurado sem explicação nenhuma.

**Riley (Stress-Tester)**: `FinancialCashClosing.tsx` só bloqueia data futura no cliente (`openingDate > todayDateKey()`), sem guarda contra abrir caixa numa data que já tem caixa fechado — depende inteiramente do backend rejeitar e aparecer como toast genérico. `Agenda.tsx:406` (`handleStatusChange` para `COMPLETED`) refaz uma chamada de rede só para checar `careNotes` a cada conclusão — numa conexão instável isso falha silenciosamente a conclusão do atendimento com um toast genérico em vez de usar dado já carregado.

**Sam (Acessibilidade)**: `Register.tsx:320-331` — a barra de força de senha comunica força por cor (`bg-red-600`/`bg-amber-500`/`bg-emerald-600`) mais um rótulo de texto abaixo (o texto salva do problema de "cor só", mas a barra não tem `role`/`aria-valuenow`, então leitor de tela não recebe sinal de progresso ao vivo, só o texto estático). Itens de navegação ícone-apenas da sidebar colapsada (`Sidebar.tsx`) merecem checagem de `aria-label` em cada ícone — não confirmado nesta rodada, sinalizado como gap comum a verificar.

## Minor Observations

- `Register.tsx` repete o link de Termos/Privacidade em três lugares (badge no topo, checkbox no meio, rodapé) — redundante mas inofensivo.
- `Index.tsx` reimplementa `normalizeDateToIso`/matemática de data por arquivo em vez de usar `lib/format` (que já existe e é usado em outros lugares) — risco pequeno de duplicação/bug de fuso horário.
- `PosPage.tsx` usa texto puro "Carregando..." em vez do padrão `Skeleton`/`PageListLoadingState` usado no resto do app.
- `MembershipPlansPage.tsx` valida só no submit com uma única mensagem de toast combinada — não aponta qual campo falhou.
- Detector: `overused-font` (Inter, `index.css:1`) e `codex-grid-background` (`index.css:210`) são achados de baixa severidade (advisory) que provavelmente não justificam ação isolada.
- `src/lib/appointment-status.ts` usa `border-l-4` como codificação semântica de status em 6 variantes — o detector sinaliza como `side-tab`, mas é provavelmente um padrão intencional; vale uma decisão explícita de manter ou promover a token nomeado, não uma correção automática.

## Questions to Consider

- Se o Estoque (módulo mais recentemente redesenhado) é o único que segue corretamente os tokens `--success`/`--warning`, existe plano de retroportar essa disciplina para Dashboard, Fechamento de Caixa e Cadastro — ou cada módulo novo vai reinventar sua própria lógica de cor até a próxima auditoria global?
- Por que a adoção de RHF+Zod parou nas telas de autenticação em vez de começar pelos diálogos de CRUD mais usados (Serviço/Profissional/Cliente), que tocam todo onboarding?
- `WorkspaceNotice` e `ModuleIntro` parecem duplicar a mesma mensagem de "por que você está aqui" no topo do dashboard — é intencional ou sobra de duas passadas de design que nunca foram consolidadas?
- O beco sem saída do CPF/CNPJ no onboarding (achado da persona Jordan) é uma lacuna conhecida, ou ninguém testou onboarding com um perfil de salão sem esse campo preenchido?
