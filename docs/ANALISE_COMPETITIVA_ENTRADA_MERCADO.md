# Analise Competitiva para Entrada Forte e Segura no Mercado

Projeto: Azzo Agenda Pro  
Data: 2026-02-28  
Escopo: estrategia de produto para entrar no mercado com tracao, seguranca e operacao sustentavel.

## 1. Objetivo
Definir o que e necessario para:
- entrar no mercado com proposta de valor clara,
- reduzir risco operacional e juridico no go-live,
- competir com plataformas ja estabelecidas em agendamento para saloes.

## 2. Hipotese de Posicionamento
Posicionamento recomendado:
- "Sistema de gestao para salao com foco em operacao diaria, controle financeiro/fiscal e governanca."

Mensagem central:
- Nao apenas agenda.
- Agenda + financeiro + fiscal + auditoria + controle por perfil.

## 3. Comparativo de Mercado (alto nivel)
Referencias comuns no segmento:
- plataformas com foco em agenda e aquisicao de clientes (marketplace),
- plataformas com foco em suite de gestao ampla,
- ERPs locais com foco em operacao e fiscal.

### 3.1 Onde o Azzo ja tem vantagem
- trilha de auditoria e padrao de erro documentado,
- controle de acesso por perfil e rotas dinamicas,
- base de fiscal/apuracao/nota no contexto Brasil,
- documentacao tecnica de regras, homologacao e arquitetura.

### 3.2 Onde os concorrentes ainda sao mais fortes
- CRM de retencao (campanhas automaticas, reativacao, segmentacao),
- canal de aquisicao de novos clientes (marketplace/parcerias),
- experiencias moveis maduras (app cliente e jornada completa),
- ecossistema de integracoes pronto (API publica + webhooks + parceiros).
- operacao de estoque integrada ao servico (consumo, reposicao e custo real por atendimento).

## 4. Gaps Criticos para Entrar Forte
G1. Distribuicao e crescimento:
- falta estrategia de aquisicao de demanda (alem do agendamento direto por link).

G2. Retencao e receita:
- falta automacao de recorrencia/reativacao e inteligencia de no-show.

G3. Confianca e risco:
- ha base de seguranca, mas go-live forte exige operacao de incidentes, observabilidade e SLO definidos.

G4. Produto comercial:
- necessidade de empacotamento claro de planos, limites por plano e politica de upgrade.

G5. Margem operacional:
- sem estoque integrado, o salao perde visibilidade de custo real por servico e risco de ruptura de insumo.

## 5. Pilares para Entrada Forte e Segura
P1. Produto minimo competitivo (MVP comercial):
- agenda, cadastros, financeiro, fiscal basico, permissoes, notificacoes essenciais.

P2. Seguranca e compliance:
- LGPD operacionalizada, trilha de auditoria ativa, politicas legais versionadas, resposta a incidente.

P3. Confiabilidade:
- monitoramento, alarmes, backup/restore testado, runbook de contingencia.

P4. Crescimento:
- funis de conversao, onboarding guiado, metricas de ativacao e retencao.

P5. Monetizacao:
- assinatura/licenca clara, regras de bloqueio gracioso por inadimplencia, cobranca previsivel.

P6. Eficiência operacional:
- controle de estoque com consumo por servico, alerta de minimo e rastreabilidade de movimentacao.

## 6. Estrategia de Entrada Recomendada
Fase 1 (0-60 dias): "Go-live controlado"
- foco em estabilidade, seguranca e sucesso operacional de primeiros clientes.
- pilotos com few tenants e onboarding assistido.

Fase 2 (60-120 dias): "Escala inicial"
- automacoes de retencao, melhoria de UX de agenda, relatorios executivos.
- controle de estoque fase 1 (cadastro, movimentacao, alerta de minimo, consumo manual).

Fase 3 (120-240 dias): "Competitividade forte"
- integracoes abertas, assistente WhatsApp maduro, inteligencia de negocio.
- controle de estoque fase 2 (consumo automatico por ficha tecnica e custo por servico).

## 7. Metrica de Sucesso para Entrada
KPI de produto:
- taxa de agendamento concluido,
- taxa de no-show,
- tempo medio de criacao de agendamento,
- erro de operacao por usuario ativo.
- percentual de atendimentos com insumo disponivel.
- taxa de ruptura de estoque por periodo.

KPI de negocio:
- MRR,
- churn logo no mes 1/2,
- ativacao (tenant que agenda e finaliza atendimento em ate 7 dias),
- expansao (upgrade de plano ou aumento de uso).
- margem por servico (receita - custo de insumo).

KPI de confiabilidade:
- disponibilidade,
- taxa de erro por endpoint critico,
- tempo de deteccao e tempo de resolucao de incidente.

## 8. Risco e Mitigacao
R1. Entrar cedo sem observabilidade:
- mitigacao: minimo de telemetria, dashboards e alerta antes de ampliar base.

R2. Escopo grande no inicio:
- mitigacao: priorizar funcionalidades que impactam receita e risco regulatorio.

R3. Dependencia de integracoes externas:
- mitigacao: fallback operacional, retentativa assicrona e fila para eventos.

## 9. Decisao Executiva Sugerida
Adotar estrategia "forte e segura" por ondas:
1. Consolidar base operacional/compliance.
2. Acelerar retencao e monetizacao.
3. Expandir crescimento e ecossistema.

Documento complementar:
- ver `PLANO_FEATURES_ENTRADA_FORTE_SEGURA.md`
- ver `CHECKLIST_GO_LIVE_FORTE_SEGURO.md`
