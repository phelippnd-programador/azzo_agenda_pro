---
name: Azzo Agenda Pro
description: Painéis de vidro empilhados sobre uma luz fria — um sistema de operação de salão que fica calmo enquanto o salão não está.
colors:
  primary: "hsl(221 80% 56%)"
  primary-foreground: "hsl(0 0% 100%)"
  brand-accent: "hsl(186 86% 42%)"
  background: "hsl(214 29% 97%)"
  foreground: "hsl(222 33% 14%)"
  card: "hsl(0 0% 100%)"
  panel-muted: "hsl(214 40% 98%)"
  shell: "hsl(212 42% 98%)"
  secondary: "hsl(214 43% 95%)"
  muted: "hsl(215 32% 94%)"
  muted-foreground: "hsl(218 16% 43%)"
  border: "hsl(215 24% 87%)"
  destructive: "hsl(0 72% 51%)"
  dark-background: "hsl(222 39% 8%)"
  dark-card: "hsl(222 34% 10%)"
  dark-primary: "hsl(217 93% 68%)"
  dark-foreground: "hsl(210 36% 96%)"
  dark-border: "hsl(218 22% 20%)"
typography:
  display:
    fontFamily: "Manrope, Aptos, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: "36px"
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Manrope, Aptos, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, Aptos, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "1.25"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Aptos, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "normal"
  label:
    fontFamily: "Aptos, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: "1.4"
    letterSpacing: "0.18em"
rounded:
  sm: "calc(0.8rem - 4px)"
  md: "calc(0.8rem - 2px)"
  lg: "0.8rem"
  control: "0.75rem"
  surface: "1rem"
  panel: "1.5rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  panel: "1.75rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "hsl(221 80% 56% / 0.92)"
  button-outline:
    backgroundColor: "hsl(0 0% 100% / 0.92)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  input-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
  card-surface:
    backgroundColor: "hsl(0 0% 100% / 0.95)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  badge-default:
    backgroundColor: "hsl(221 80% 56% / 0.12)"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
  badge-outline:
    backgroundColor: "hsl(214 29% 97% / 0.8)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
---

# Design System: Azzo Agenda Pro

## Overview

**Creative North Star: "A Mesa de Vidro"**

O sistema não é feito de folhas de papel empilhadas — é feito de painéis de vidro
suspensos sobre uma luz fria. O material é literal, não metafórico: quase toda
superfície é translúcida (`bg-card/95`, `bg-card/82`, `bg-background/80`) e quase
toda superfície tem `backdrop-blur`. O fundo da página não é uma cor chapada: são
dois brilhos radiais vindos dos cantos superiores, azul à esquerda e turquesa à
direita, fixos na viewport. Quando um painel se sobrepõe a esse fundo, a luz
atravessa. É isso que dá ao sistema a sensação de profundidade sem uma única
borda pesada.

A densidade é generosa para uma ferramenta de operação. Raios grandes (0.8rem na
maioria das superfícies, 1.5rem nos painéis de módulo), respiro interno de 1.5rem
nos cards, e um vocabulário de sombra que é puramente atmosférico — deslocamentos
enormes com spread negativo agressivo (`0 24px 60px -32px`) produzem um halo
difuso sob o painel, nunca uma borda escura definida. Nada no sistema usa sombra
para dizer "isto está na frente daquilo". Tudo repousa levemente acima do fundo,
na mesma altura.

A personalidade vive em duas coisas pequenas e insistentes: o **eyebrow em caixa
alta** (11px, peso 600, tracking 0.18em) que abre praticamente toda seção, e a
**resposta física ao toque** — o botão sobe 2px no hover e a sombra cresce com
ele, o campo acende um anel suave de 2px no foco. O sistema é discreto em cor e
generoso em forma, mas responde quando tocado.

Três estéticas são explicitamente rejeitadas: **salão/beleza** (dourado, rosa,
script, mármore), **ERP denso e cinza** (tabela sem respiro, cinza institucional,
tela lotada) e **dashboard "dark tech"** (preto com néon, gráfico brilhante,
estética de trading). O tema escuro existe por conforto de leitura, não por
atitude.

**Key Characteristics:**
- Superfícies translúcidas com `backdrop-blur` sobre um wash radial fixo
- Sombra ambiente de spread negativo extremo — halo, nunca contorno
- Azul frio único como voz de ação; turquesa quase só em gradiente de marca
- Eyebrow em caixa alta com tracking largo como abertura recorrente de seção
- Elevação por movimento (`-translate-y-0.5`), não por camada de sombra
- Formas generosas: pílula completa em badges, 0.8rem em cards, 1.5rem em painéis

## Colors

Uma paleta fria de voz única: um azul faz todo o trabalho de ação e estado, e
todo o resto é neutro azulado. A saturação nos neutros é baixa mas nunca zero —
não há cinza puro em lugar nenhum do sistema.

### Primary
- **Azul Confiança** (`hsl(221 80% 56%)`): a única voz de ação do sistema. Botão
  primário, item ativo da sidebar, anel de foco, ícone de estado vazio, texto e
  fundo de badge padrão. No tema escuro clareia para `hsl(217 93% 68%)` para
  manter contraste sobre o fundo profundo. Também aparece a 8% de opacidade como
  o brilho radial superior esquerdo do fundo da página.

### Secondary
- **Turquesa Sinal** (`hsl(186 86% 42%)`): o segundo brilho. Não é uma cor de
  ação — quase nunca aparece sozinha. Vive no gradiente de marca (`brand-orbit-dot`,
  `brand-orbit-badge`), no brilho radial superior direito do fundo, e nada mais.
  No escuro, `hsl(186 75% 48%)`.

### Neutral
- **Névoa Fria** (`hsl(214 29% 97%)`): o fundo da aplicação. Nunca branco puro —
  é o azul lavado que faz o card branco parecer suspenso.
- **Vidro** (`hsl(0 0% 100%)`): a superfície do card e do popover, sempre servida
  com opacidade (0.95, 0.92, 0.82 conforme a camada).
- **Tinta Noturna** (`hsl(222 33% 14%)`): o texto principal. Azul-quase-preto,
  nunca `#000`.
- **Grafite Azulado** (`hsl(218 16% 43%)`): texto secundário, descrições,
  eyebrows, ícones inativos.
- **Fio de Vidro** (`hsl(215 24% 87%)`): borda e divisor. Na prática quase sempre
  servido a 70–80% de opacidade (`border-border/70`), o que o torna mais uma
  sugestão de aresta do que uma linha.

### Semantic
- **Vermelho Alerta** (`hsl(0 72% 51%)`): destrutivo e erro. É a única cor quente
  do sistema e a única exceção à voz única.

### Named Rules

**A Regra da Voz Única.** O azul primário é a única cor com autoridade de ação. Se
um elemento não é uma ação, um estado ativo ou um foco, ele não usa o primário.
Turquesa não substitui azul em botão nenhum.

**A Regra do Cinza Proibido.** Nenhum neutro do sistema tem saturação zero. Todo
cinza é azulado (matiz 212–222). Um `#808080` ou `#F5F5F5` na tela é bug, não
escolha.

**A Regra da Borda Translúcida.** Bordas são servidas a 70–80% de opacidade. Uma
borda em opacidade cheia lê como interface de formulário antigo e quebra o
material de vidro.

## Typography

**Display Font:** Manrope (com fallback Aptos, Segoe UI, ui-sans-serif, system-ui)
**Body Font:** Aptos / Segoe UI (com fallback ui-sans-serif, system-ui)

**Character:** Duas grotescas geométricas da mesma família de espírito — a
diferença é de peso e de largura, não de gênero. Manrope entra apenas em título,
sempre em 600–800 e sempre com `tracking-tight`, dando ao cabeçalho uma compressão
que a fonte de corpo não tem. A pilha nativa Aptos / Segoe UI carrega tudo que é
lido em sequência com boa renderização em Windows e fallback sólido nos demais
sistemas. A escala é pequena e fechada (12 → 30px em sete degraus), coerente com
uma ferramenta que mostra muitos números por tela.

Todo `h1`–`h4` recebe `font-display tracking-tight` automaticamente pela camada
base — não é preciso pedir, e sobrescrever isso é ir contra o sistema.

### Hierarchy
- **Display** (Manrope 700, 30px/36px, `-0.025em`): título de página. O maior tipo
  do sistema; não existe hero acima disso.
- **Headline** (Manrope 700, 24px/32px, `-0.025em`): título de seção maior e
  números de destaque em painel de métrica.
- **Title** (Manrope 600, 16px, `-0.025em`): título de card e de diálogo. É
  deliberadamente pequeno — o card se distingue por superfície, não por tamanho
  de título.
- **Body** (Inter 400, 16px/24px): texto corrido e valor de campo. Em tabela e
  lista densa o sistema desce para 14px/20px.
- **Label** (Inter 600, 11px, `0.18em`, caixa alta): o eyebrow. Abre seção, nomeia
  grupo na sidebar, rotula ponto de destaque.

### Named Rules

**A Regra do Eyebrow.** Toda seção de conteúdo abre com um rótulo de 11px em caixa
alta e tracking 0.18em antes do título. É o gesto tipográfico mais repetido do
sistema e o que mais o identifica.

**A Regra da Compressão.** Título usa Manrope com `tracking-tight`; texto corrido
usa Aptos / Segoe UI com tracking normal. Nunca o inverso — Manrope em corpo
longo fica apertado e a fonte de corpo em título grande fica frouxa.

## Layout

Shell fixo de aplicação: sidebar à esquerda com largura própria (colapsável para
uma faixa de ícones no desktop, gaveta sobreposta no mobile), conteúdo rolando à
direita. A sidebar é translúcida (`bg-sidebar/95`) com `backdrop-blur-xl` e uma
borda direita de fio único, então o wash radial do fundo atravessa ela.

Container central com padding de 2rem e teto de 1400px em `2xl`. Conteúdo de
formulário e leitura fica em `max-w-2xl` centralizado, mesmo em tela larga — o
sistema prefere uma coluna confortável a preencher a largura disponível.

O ritmo de espaço é de passo 4px seguindo Tailwind, com três degraus que carregam
quase tudo: `gap-3`/`space-y-3` (0.75rem) dentro de um bloco, `gap-4` (1rem)
entre blocos irmãos, `space-y-6` (1.5rem) entre seções de página. Card usa 1.5rem
de padding interno; diálogo usa 1.5rem no mobile e 1.75rem a partir de `sm`.

Responsivo por empilhamento, não por reflow: grades de 2–3 colunas colapsam para
uma, linhas de ação viram coluna de largura total (`flex-col sm:flex-row`), e
tabela densa vira lista de cards. Diálogos passam a largura quase total com
margem lateral no mobile (`mx-4`) e voltam a `max-w-2xl` centralizado a partir de
`sm`.

**A Regra da Coluna Confortável.** Conteúdo de leitura e formulário nunca passa de
`max-w-2xl`, mesmo com espaço sobrando. Largura total é para lista, tabela e
agenda — não para texto.

## Elevation & Depth

O sistema é **puramente ambiente**. Nenhuma sombra do vocabulário existe para
comunicar hierarquia de camada; todas existem para separar o painel do fundo
iluminado. As três sombras têm o mesmo desenho — deslocamento vertical grande,
blur grande, e spread negativo quase igual ao blur — o que produz um halo difuso
concentrado sob o elemento, sem nenhuma aresta escura. A diferença entre elas é de
intensidade atmosférica, não de altitude.

A profundidade real vem de outros três lugares: a translucidez das superfícies, o
`backdrop-blur` que borra o que está atrás, e o wash radial fixo do fundo.

Quando o sistema precisa dizer "isto está acontecendo agora", ele **move** em vez
de elevar: `hover:-translate-y-0.5` no botão, com a sombra crescendo de `soft`
para `panel` junto.

### Shadow Vocabulary
- **soft** (`0 10px 28px -20px rgba(15, 23, 42, 0.3)`): repouso de botão, badge de
  marca, painel raso. É o padrão.
- **panel** (`0 24px 60px -32px rgba(15, 23, 42, 0.28)`): superfície de card
  (`.surface-panel`) e estado hover do botão primário.
- **elevated** (`0 30px 80px -36px rgba(15, 23, 42, 0.36)`): shell de módulo e
  diálogo.

No tema escuro os três aumentam blur e opacidade (até `rgba(2, 6, 23, 0.84)`),
porque sombra sobre fundo escuro precisa trabalhar mais para existir.

### Named Rules

**A Regra do Halo.** Toda sombra tem spread negativo de pelo menos 2/3 do blur.
Uma sombra com spread 0 desenha contorno e mata o material de vidro.

**A Regra do Movimento como Elevação.** Estado ativo se comunica por deslocamento
de 2px, não por troca de nível de sombra. A sombra acompanha o movimento; não o
substitui.

## Shapes

Linguagem de canto generosa e escalonada por tamanho de superfície: quanto maior a
superfície, maior o raio. Campo e controle pequeno ficam em `calc(0.8rem - 2px)`,
card em 0.8rem, painel de módulo e bloco de destaque em 1rem–1.5rem, e o shell de
módulo chega a 1.75rem. Badge e chip são pílula completa, sem exceção.

Não há canto vivo em nenhum lugar do sistema, e não há forma decorativa: nenhuma
diagonal, nenhum recorte, nenhuma silhueta customizada. A geometria é inteiramente
retangular-arredondada.

Bordas são de 1px, sempre em `border` a 70–80% de opacidade. Estados vazios e de
erro usam a mesma borda **tracejada** — é o único uso de traço no sistema e ele
significa "aqui não há conteúdo ainda", nunca decoração.

**A Regra da Pílula.** Qualquer coisa que rotula (badge, chip, contador, tag de
status) é pílula completa. Qualquer coisa que age ou contém usa o raio da sua
escala.

**A Regra do Tracejado Reservado.** Borda tracejada significa ausência — estado
vazio, estado de erro, área de drop. Nunca aparece em superfície com conteúdo.

## Components

### Buttons
Leves e responsivos ao toque: o botão reage fisicamente antes de reagir por cor.

- **Shape:** cantos generosos (`0.75rem`), altura de 2.5rem no padrão, 2rem no
  pequeno, 2.75rem no grande.
- **Primary:** fundo Azul Confiança, texto branco, sombra `soft` em repouso.
- **Hover / Focus:** sobe 2px (`-translate-y-0.5`), fundo a 92% de opacidade e
  sombra cresce para `panel`, tudo em 200ms. `active` volta a 0. O foco de teclado
  é um anel de 2px na cor primária com offset de 2px.
- **Outline:** borda de input, fundo de card a 92%, mesma mecânica de subida.
- **Secondary:** borda a 80%, fundo secundário a 90%, mesma mecânica.
- **Ghost:** sem fundo e sem sombra em repouso; só troca de fundo no hover. É o
  único variante que não se move.
- **Link:** texto primário com sublinhado no hover.
- **Loading:** o botão troca o conteúdo por um `Loader2` girando mais o
  `loadingText`, e se desabilita sozinho. Estado de carregamento é do componente,
  não do consumidor.
- **Detalhe do sistema:** `size="icon"` força o variante `ghost` independentemente
  do que foi pedido. Botão de ícone nunca é sólido.

### Cards / Containers
- **Corner Style:** 0.8rem (`{rounded.lg}`).
- **Background:** branco a 95% com `backdrop-blur-sm`.
- **Shadow Strategy:** `panel` (via `.surface-panel`).
- **Border:** 1px em `border` a 70%.
- **Internal Padding:** 1.5rem; cabeçalho com 1.5rem e fundo reduzido para 0.75rem.
- **Título:** Manrope 600 em 16px — pequeno de propósito.

### Inputs / Fields
- **Style:** altura 2.25rem, fundo de card sólido, borda de input, raio
  `calc(0.8rem - 2px)`, texto 14px.
- **Focus:** a borda vira cor de anel e um anel de 2px a 30% de opacidade acende,
  **sem offset** — o anel encosta na borda em vez de flutuar. É deliberadamente
  mais suave que o foco do botão.
- **Placeholder:** texto secundário a 60% de opacidade.
- **Disabled:** cursor bloqueado e 50% de opacidade.

### Badges / Chips
- **Style:** pílula completa, 12px peso 600, padding 0.5rem × 0.125rem.
- **Default:** fundo primário a 12%, borda primária a 25%, texto primário — um
  chip tingido, nunca sólido.
- **Destructive:** mesma fórmula na cor de alerta (12% / 35%).
- **Outline:** fundo de página a 80%, borda cheia, texto padrão.

### Navigation (Sidebar)
- **Style:** painel fixo translúcido (`bg-sidebar/95`) com `backdrop-blur-xl`,
  borda direita de fio único e sombra rasa própria.
- **Grupos:** separados por um rótulo em caixa alta de 10px com tracking 0.18em e
  um fio de 8px quando colapsada.
- **Item:** altura 2.5rem, raio 0.75rem, 14px. Inativo em `sidebar-foreground`;
  hover troca para fundo de acento; ativo usa a cor primária.
- **Colapsada (desktop):** vira faixa de ícones centralizados de 2.5rem, com o
  logo em quadrado de 2.5rem e raio 1rem.
- **Mobile:** gaveta sobreposta com overlay, transição de 300ms em `width` e
  `transform`.

### ModuleIntro (componente de assinatura)
O bloco que abre a maioria dos módulos e concentra a identidade tipográfica do
sistema: eyebrow em caixa alta → título → descrição, com badges opcionais à
direita e uma grade de 2–3 "pontos" abaixo, cada ponto repetindo a mesma estrutura
eyebrow → título → descrição em escala menor. Usa card com sombra própria mais
rasa que a padrão. É o gesto que faz um módulo parecer parte deste sistema.

### Estados de página
`PageEmptyState` e `PageErrorState` compartilham uma anatomia fixa: card de borda
**tracejada** e sem sombra, ícone de 1.5rem dentro de um quadrado de 3rem com raio
1rem e anel de 1px na cor do estado, título de 16px, descrição em `max-w-md`
centralizada, e uma ação opcional. Vazio usa primário; erro usa destrutivo.

## Do's and Don'ts

### Do:
- **Do** servir superfícies com opacidade e `backdrop-blur` (`bg-card/95`,
  `backdrop-blur-sm`). A translucidez é o material do sistema, não um efeito.
- **Do** abrir seção com o eyebrow de 11px em caixa alta e tracking `0.18em`.
- **Do** usar o azul primário como voz única de ação, estado ativo e foco.
- **Do** comunicar estado ativo por movimento de 2px, com a sombra crescendo de
  `soft` para `panel` junto.
- **Do** manter conteúdo de leitura e formulário em `max-w-2xl`, mesmo com espaço
  sobrando.
- **Do** usar borda tracejada exclusivamente para ausência de conteúdo.
- **Do** manter os neutros azulados (matiz 212–222); nunca cinza dessaturado.
- **Do** deixar `h1`–`h4` herdarem `font-display tracking-tight` da camada base.

### Don't:
- **Don't** usar sombra com spread 0 ou próximo de 0 — ela desenha contorno e
  destrói o material de vidro. Todo `box-shadow` tem spread negativo de ao menos
  2/3 do blur.
- **Don't** usar sombra para indicar hierarquia de camada. A escala `soft` →
  `panel` → `elevated` é de atmosfera, não de altitude.
- **Don't** aplicar as classes `tone-amber-panel`, `tone-sky-panel`,
  `tone-emerald-panel` e `tone-rose-panel` em tela nova. São herança: cor
  semântica fica reservada a estado real (sucesso, alerta, erro), não a colorir
  seção ou identificar módulo.
- **Don't** usar o turquesa como cor de ação. Ele existe no gradiente de marca e
  no wash do fundo; não substitui o azul em botão nenhum.
- **Don't** usar borda em opacidade cheia em superfície de conteúdo — o padrão é
  70–80%.
- **Don't** deixar canto vivo em nenhuma superfície, nem introduzir forma
  decorativa (diagonal, recorte, silhueta).
- **Don't** fazer botão de ícone sólido; o componente força `ghost` de propósito.
- **Don't** trazer estética de salão/beleza: dourado, rosa, script cursivo,
  mármore ou ornamento feminino-decorativo. É ferramenta de operação.
- **Don't** cair em ERP denso e cinza: tabela sem respiro, cinza institucional,
  tela lotada de campo. O usuário é dono de salão pequeno, não operador treinado.
- **Don't** fazer "dark tech": preto com néon, gráfico brilhante, estética de
  painel de trading. O tema escuro é conforto de leitura, não atitude.
