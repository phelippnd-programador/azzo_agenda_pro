---
target: /dashboard
total_score: 22
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
timestamp: 2026-07-31T03-13-48Z
slug: src-pages-index-tsx
---
Method: dual-agent (A: 019fb627-04ce-7590-9d13-2df21d1c1967 · B: 019fb627-24d2-71c2-b14f-cd2bbf82342f)

Design Health Score: 22/40 — Acceptable

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Alguns cards/gráficos transformam erro em zero ou fallback. |
| 2 | Match System / Real World | 3 | Linguagem é do salão, mas há copy sem acento e textos explicativos longos. |
| 3 | User Control and Freedom | 2 | Cancelamento de agendamento aparece sem confirmação visível. |
| 4 | Consistency and Standards | 2 | Cores/painéis semânticos divergem do DESIGN.md e competem entre si. |
| 5 | Error Prevention | 2 | Ações sensíveis e dados indisponíveis precisam de mais guardrails. |
| 6 | Recognition Rather Than Recall | 3 | A estrutura por seções ajuda, mas ações principais ficam escondidas em menu. |
| 7 | Flexibility and Efficiency | 2 | Dashboard informa bem, mas poucas ações diretas para operação rápida. |
| 8 | Aesthetic and Minimalist Design | 2 | Primeiro viewport tem orientação demais antes dos indicadores acionáveis. |
| 9 | Error Recovery | 2 | Falhas parciais não explicam o problema nem recuperação em todos os widgets. |
| 10 | Help and Documentation | 2 | Há orientação, mas ela ocupa espaço operacional em vez de ser contextual. |

Design Specificity Verdict
O dashboard já é específico para operação de salão: agenda, equipe, funil WhatsApp, no-show, receita e profissional. O problema não é falta de domínio; é excesso de explicação e pouca condução operacional. Ele parece mais um painel analítico comentado do que uma mesa de comando para o dono agir rápido.

Deterministic Scan
Detector Impeccable: 0 findings em src/pages/Index.tsx e src/components/dashboard. A inspeção manual encontrou riscos reais: textos sem acentuação, uso amplo de cores semânticas diretas, tabs com risco de overflow, cancelamento direto e fallback silencioso em gráficos.

What's Working
- Boa separação por perfil: PROFESSIONAL recebe leitura diferente de OWNER/ADMIN.
- Métricas principais têm boa leitura rápida com ícones, valores grandes e labels curtos.
- A página já tenta ordenar a jornada: operação hoje, agenda/equipe, risco/conversão, depois performance.

Priority Issues
[P1] Primeiro viewport explica demais antes de mostrar decisão.
Why it matters: dono/gerente tem pouco tempo; precisa ver agora pendências, agenda, receita e risco, não ler instruções recorrentes.
Fix: transformar o topo em painel de comando com 4 métricas críticas, próximo atendimento/pendência e CTA primário. Reduzir ModuleIntro/WorkspaceNotice ou mostrar só em primeiro acesso.
Suggested command: $impeccable distill

[P1] Estados de erro podem parecer dado real.
Why it matters: fallback de receita ou zero por falha pode levar o dono a concluir que não faturou ou que está tudo bem.
Fix: remover dados fictícios em RevenueChart, diferenciar vazio real de erro, mostrar skeleton/estado indisponível e botão Atualizar.
Suggested command: $impeccable harden

[P2] Ações principais da agenda estão escondidas.
Why it matters: confirmar e iniciar atendimento são ações diárias; menu de três pontos reduz velocidade e descoberta.
Fix: expor Confirmar/Iniciar como botões visíveis por status; manter Reagendar/Cancelar no menu, com confirmação para cancelar.
Suggested command: $impeccable layout

[P2] Blocos de risco informam, mas não conduzem.
Why it matters: números de funil, WhatsApp e no-show pedem ação; sem CTA contextual o usuário precisa descobrir para onde ir.
Fix: adicionar ações por bloco: Ver clientes travados, Assumir conversas abertas, Abrir relatório no-show, Filtrar por etapa.
Suggested command: $impeccable clarify

[P3] Paleta e superfícies estão ruidosas.
Why it matters: muitos tons fortes fazem todos os alertas parecerem igualmente importantes.
Fix: reduzir rose/amber/emerald/blue diretos, usar tokens semânticos e reservar cor forte para prioridade real.
Suggested command: $impeccable quieter

Persona Red Flags
OWNER/ADMIN: abre a tela e recebe muita orientação antes do que fazer agora. O risco operacional aparece, mas sem comando claro.
Profissional: ainda recebe blocos analíticos que competem com o essencial: próximo atendimento, pendências e comissão estimada.
Usuário mobile: tabs com w-max/whitespace-nowrap e muitos cards empilhados podem gerar rolagem longa antes da ação principal.

Minor Observations
- Corrigir copy sem acento em textos como Proximos, Evolucao, Excecoes, acao.
- Padronizar erro parcial entre RevenueChart, MonthlyRevenueLineChart, NoShowInsights e WhatsAppReactivationChart.
- Revisar status da equipe: Livre/Ocupado/Próx é útil, mas poderia destacar atraso, ociosidade e conflito.

Questions to Consider
- O dashboard deve ser uma tela de leitura ou uma tela de ação?
- O dono precisa ver onboarding toda vez ou só quando algo realmente bloquear a operação?
- Qual é a decisão mais importante nos primeiros 5 segundos: agenda, caixa, equipe ou risco de abandono?
