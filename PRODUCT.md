# Product

<!-- impeccable:product-schema 1 -->

Escopo deste registro: **`frontend/` — Azzo Agenda Pro**, o app usado pelo salão e
pelo cliente final. O app irmão `gerenciamento/` (administração interna da Azzo)
tem operação e público próprios e não está coberto aqui.

## Platform

web

## Users

Três públicos confirmados, todos no mesmo app:

1. **Dono/gerente do salão (`OWNER` / `ADMIN`) — usuário primário.** Acumula
   funções: agenda, caixa, cadastros, fiscal, cobrança. Salão pequeno, sem
   recepção dedicada, então ele é quem opera o painel a maior parte do tempo e
   tem pouco tempo para cada tarefa.
2. **Profissional (`PROFESSIONAL`) — entre atendimentos.** Consulta a própria
   agenda e a própria produção, tipicamente no celular, entre um cliente e outro.
   **Também agenda**, não é um papel só de leitura.
3. **Cliente final — agendamento público (`/agendar/:slug`).** Sem login, sem
   treinamento, sem contexto do sistema. Chega por link compartilhado pelo salão
   ou conversando pelo WhatsApp.

Não há persona de recepcionista dedicada: o produto é desenhado para o salão que
não tem esse cargo.

## Product Purpose

SaaS multi-tenant que dá a um salão de beleza uma operação inteira em um lugar só:
agenda, clientes, profissionais, serviços, PDV/comanda, financeiro, comissão,
estoque, fidelidade, pacotes, assinaturas e nota fiscal — mais um canal de
agendamento por WhatsApp com assistente de IA.

Sucesso é o salão parar de operar em caderno, planilha e WhatsApp solto: o
agendamento entra sozinho, o atendimento vira comanda, a comanda vira receita e
comissão, e o fechamento do dia sai sem retrabalho.

## Positioning

Quatro afirmações que o usuário confirmou como o diferencial do produto:

- **Agendamento por IA no WhatsApp.** O cliente agenda conversando: o assistente
  coleta serviço, profissional, data e período, confirma explicitamente e o
  agendamento é criado. É a área mais desenvolvida do sistema (pool de LLM,
  robustez determinística, lock por conversa, anti-loop).
- **Operação fechada num sistema só.** Agenda → comanda → financeiro → comissão →
  estoque → NFS-e sem integrar ferramenta externa nem exportar planilha no meio
  do caminho.
- **Fiscal brasileiro de verdade.** NFS-e por prefeitura e impostos resolvidos
  dentro do fluxo do atendimento, não como módulo à parte.
- **Porte de entrada.** Atende o salão pequeno que hoje não usa sistema nenhum.

**Não confirmado:** nenhum preço, faixa de plano ou comparativo numérico com
concorrente existe no repositório. A referência a Trinks aparece só como
benchmark interno de paridade de features (branch `feat/paridade-trinks`).
Trabalho futuro não deve inventar valores, planos ou claims de comparação.

## Operating Context

- **Multi-tenant por salão.** Todo dado é isolado por `tenant_id`; um usuário
  pertence a exatamente um salão.
- **Entrada de agendamento por três caminhos:** painel interno (`/agenda`),
  link público (`/agendar/:slug`) e conversa de WhatsApp mediada por IA.
- **Ciclo do atendimento:** agendamento → "Iniciar atendimento" abre comanda →
  itens, desconto, gorjeta, pagamento → fechar comanda gera receita, comissão e
  baixa de estoque → fechamento de caixa do dia.
- **Primeiro acesso:** OWNER cai num onboarding guiado (termos → salão →
  profissionais → serviços → atribuições → extras). Telas consolidadas
  (Fiscal, Agendamento, Estoque, Integração WhatsApp) têm tutorial guiado
  React Joyride que precisa ser revisto a cada mudança de layout.
- **Uso real é misto desktop/celular:** dono no balcão ou no escritório,
  profissional no celular entre atendimentos. Instalável como PWA (manifest,
  service worker, tela offline).
- **Idioma:** português do Brasil. Moeda, datas, CPF/CNPJ e separador decimal
  brasileiro em toda a interface.

## Capabilities and Constraints

**Capacidades confirmadas** (rotas e módulos existentes): agenda e agendamentos;
clientes com histórico e importação em lote; profissionais com horários de
trabalho, especialidades e comissão; serviços com duração, preço e sinal/PIX;
PDV/comandas; financeiro com transações, categorias e fechamento de caixa;
comissões; pacotes; assinaturas/membership; fidelidade; estoque com compras,
transferências e inventários; relatórios e dashboard; NFS-e e impostos; chat
WhatsApp e Telegram; agendamento público; auditoria; LGPD; sugestões por IA;
notificações; onboarding.

**Papéis:** `OWNER`, `ADMIN`, `PROFESSIONAL`, `CLIENT`, com menu e rotas
derivados de permissões por papel (RBAC).

**Restrições confirmadas:**
- Não é possível agendar em data passada.
- Profissional só pode ser agendado dentro do seu horário de trabalho, e um slot
  livre exige que ele não tenha outro agendamento ativo no mesmo horário.
- Agendamento pelo assistente exige confirmação explícita do cliente.
- Conversa do assistente expira após 8h de inatividade.
- Planos limitam o número de profissionais (`maxProfessionals`); o limite bloqueia
  a criação na interface e no backend.
- `PUT /salon/profile` é substituição completa do perfil e exige CPF/CNPJ em toda
  chamada.
- A URL da API vem de `VITE_API_URL` injetada em runtime (`window.__ENV__` escrito
  pelo `docker-entrypoint.sh` na subida do container), não de arquivo `.env` no
  build.

**Terminologia do domínio** (usar as palavras do salão, não as do banco): salão,
agendamento, atendimento, comanda, serviço, profissional, especialidade, cliente,
comissão, sinal, fechamento de caixa.

**Decisões de produto explicitamente em aberto:** débito automático de sessão de
pacote e de benefício de assinatura ao consumir; pré-preenchimento da NFS-e a
partir da comanda.

## Brand Commitments

- **Nome fixo:** Azzo Agenda Pro (marca guarda-chuva Azzo Holding).
- **Logo fixo:** `public/logo.png`, mais os ícones PWA `icon-192.png` /
  `icon-512.png` e `favicon.ico`.
- **Paleta, tipografia e linguagem visual estão abertas a redesign.** O visual
  atual (azul primário `221 80% 56%`, Inter + Manrope, componentes shadcn com
  tokens em `src/index.css`) é implementação incumbente e ponto de partida, não
  compromisso de marca.
- Voz: português do Brasil, direta, sem jargão de sistema — o usuário lê "comanda"
  e "atendimento", não "entidade" ou "registro".

## Evidence on Hand

**Existe no repositório:**
- Documentação de negócio e arquitetura na raiz do workspace: `BUSINESS_CONTEXT.md`,
  `PROJECT_CONTEXT.md`, `DEVELOPMENT_GUIDE.md`, `ESTADO_ATUAL.md`, `AGENTS.md`,
  e histórico de sessões em `docs/sessions/`.
- Assets de marca: `public/logo.png`, ícones PWA, favicon.
- Documentos legais servidos pelo backend (`GET /public/legal`), com versão
  vigente em banco (ex.: `2026.03`).
- Suíte de testes Vitest/Testing Library e e2e Playwright.

**Não existe — não fabricar:** depoimentos, cases, logos de clientes, números de
adoção, benchmarks, tabela de preços, prazos comerciais, prêmios, ou qualquer
citação de imprensa. Nenhum dado real de salão está no repositório.

## Product Principles

1. **O dono acumula funções e tem pouco tempo.** Cada tela deve resolver a tarefa
   sem exigir que ele lembre de onde veio ou o que fazer depois.
2. **Um agendamento é a mesma coisa pelos três caminhos.** Painel, link público e
   WhatsApp podem ter interfaces diferentes, mas nunca regras ou resultados
   diferentes.
3. **O ciclo do dinheiro não pode ter buraco.** Atendimento, comanda, receita,
   comissão e caixa são um encadeamento — nenhuma etapa pode gerar receita
   duplicada nem sumir com ela.
4. **Telas consolidadas são a fonte de verdade.** Superfícies novas (onboarding,
   assistentes) se adaptam ao cadastro real; o cadastro real não se simplifica
   para caber numa superfície nova. Mudança em componente compartilhado é aditiva
   e opt-in.
5. **Fala-se a língua do salão.** Nada de vocabulário de banco de dados, sigla
   interna ou nome de endpoint na interface.

## Accessibility & Inclusion

Nenhum padrão formal (WCAG nível X) foi estabelecido como requisito do produto —
registrar como decisão em aberto, não presumir.

Necessidades específicas confirmadas pelo contexto de uso:
- **Uso no celular é primário para o profissional**, então alvos de toque e
  legibilidade em tela pequena não são um caso secundário.
- **O cliente final chega sem treinamento e sem login**; o agendamento público
  precisa ser compreensível sem nenhum contexto prévio do sistema.
- **Tema claro e escuro** já são suportados por token e devem continuar sendo.
