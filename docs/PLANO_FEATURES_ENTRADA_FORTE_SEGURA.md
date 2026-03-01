# Plano de Features para Entrada Forte e Segura

Projeto: Azzo Agenda Pro  
Data: 2026-02-28  
Referencia: `ANALISE_COMPETITIVA_ENTRADA_MERCADO.md`

## 1. Objetivo
Priorizar features por impacto em:
- receita,
- retencao,
- risco operacional/compliance,
- diferenciacao competitiva.

## 2. Matriz de Priorizacao (Impacto x Risco x Esforco)
Legenda:
- Impacto: Alto / Medio / Baixo
- Esforco: Alto / Medio / Baixo
- Prioridade final: P0, P1, P2

## 3. P0 - Obrigatorio para Entrada Forte e Segura

### F-001 RBAC de ponta a ponta
Objetivo:
- garantir que OWNER/PROFESSIONAL acessem somente dados permitidos.
Regras de negocio:
- backend deve filtrar por tenant e perfil em todas as consultas.
- frontend nao pode depender apenas de ocultar menu.
Criterio de aceite:
- teste de acesso direto por URL deve retornar 403/401 quando aplicavel.
Prioridade: P0

### F-002 Padrao de erro unico backend/frontend
Objetivo:
- reduzir ambiguidades de UX e suporte.
Regras de negocio:
- todo erro deve retornar `code`, `message`, `details`, `path`, `timestamp`.
- frontend deve exibir mensagem contextual e rastreavel.
KPI:
- reduzir tickets "erro generico" e retrabalho de suporte.
Prioridade: P0

### F-003 Observabilidade minima de producao
Objetivo:
- detectar e reagir rapido a falhas.
Escopo minimo:
- logs estruturados,
- metricas por endpoint critico,
- alertas para indisponibilidade e aumento de erro.
Prioridade: P0

### F-004 Fluxo legal completo no cadastro
Objetivo:
- conformidade legal e rastreabilidade de aceite.
Regras de negocio:
- salvar versao de Termos e Politica aceitos no cadastro.
- impedir cadastro sem aceite e versao valida.
Prioridade: P0

### F-005 Billing/licenca operacional
Objetivo:
- monetizacao confiavel.
Regras de negocio:
- ciclo de cobranca, status de assinatura e bloqueio gracioso.
- notificacoes de vencimento e inadimplencia.
Prioridade: P0

## 4. P1 - Necessario para Competir com Forca

### F-101 CRM de retencao
Escopo:
- lembretes de retorno,
- campanhas segmentadas,
- reativacao de clientes inativos.
KPI:
- reducao de no-show e aumento de recorrencia.
Prioridade: P1

### F-102 Agenda inteligente
Escopo:
- sugestao de horarios,
- remarcacao rapida,
- regras anti-conflito mais robustas.
KPI:
- menor tempo para encaixe e maior taxa de ocupacao.
Prioridade: P1

### F-103 Dashboard executivo
Escopo:
- receita, ocupacao, ticket medio, produtividade por profissional.
KPI:
- decisao gerencial mais rapida e embasada.
Prioridade: P1

### F-104 Integracao WhatsApp operacional
Escopo:
- confirmar, remarcar, cancelar e lembrar automaticamente.
Dependencia:
- regras de estado de agendamento e templates aprovados.
Prioridade: P1

### F-105 Controle de estoque (fase 1)
Objetivo:
- garantir continuidade de atendimento e visibilidade de custo operacional.
Escopo:
- cadastro de produto/insumo,
- estoque atual e estoque minimo,
- movimentacoes (entrada, saida, ajuste),
- alerta de baixo estoque.
Regras de negocio:
- toda movimentacao deve registrar: tipo, quantidade, motivo, usuario, data/hora.
- nao permitir saldo negativo (salvo perfil com permissao explicita de excecao).
- alerta quando saldo <= estoque minimo.
KPI:
- reducao de ruptura de insumos,
- reducao de perdas nao justificadas.
Prioridade: P1

### F-106 Consumo por servico (fase 2)
Objetivo:
- calcular custo real por servico e margem operacional.
Escopo:
- ficha tecnica por servico (insumo e quantidade padrao),
- baixa automatica de estoque ao concluir atendimento,
- relatorio de custo por servico/profissional.
Regras de negocio:
- baixa automatica somente em status `COMPLETED`.
- em cancelamento, nao deve haver consumo.
- em ajuste manual, exigir justificativa.
KPI:
- melhoria de margem por servico,
- acuracia entre estoque teorico e fisico.
Prioridade: P1

## 5. P2 - Diferenciacao e Escala

### F-201 API publica e webhooks
Objetivo:
- criar ecossistema de parceiros e integrações.
Prioridade: P2

### F-202 Programa de fidelidade
Objetivo:
- aumento de LTV e recorrencia.
Prioridade: P2

### F-203 Recomendacoes por IA (operacao)
Objetivo:
- previsao de no-show e sugestao de acao.
Prioridade: P2

## 6. Requisitos Nao Funcionais Minimos por Feature
Toda feature nova deve definir:
- RNF-01 Performance: tempo de resposta esperado.
- RNF-02 Seguranca: regras de acesso e dados sensiveis.
- RNF-03 Observabilidade: logs e metricas.
- RNF-04 Testabilidade: cenarios de homologacao e regressao.
- RNF-05 Operacao: fallback e comportamento em falha de integracao.

## 7. Sequencia Recomendada (Execucao)
1. P0 completo (base forte e segura).
2. P1 em ondas de 2-3 features por ciclo.
3. P2 apos estabilizar KPI de ativacao e retencao.

## 8. KPI de Gate por Fase
Para sair de P0 para P1:
- incidentes criticos controlados,
- cadastro/licenca operacional sem bloqueios funcionais,
- autorizacao por perfil validada ponta a ponta.
- modelo base de estoque aprovado (entidades, permissao e auditoria de movimentacao).

Para sair de P1 para P2:
- melhora de retencao comprovada,
- estabilidade dos fluxos principais,
- capacidade de entrega sem regressao alta.
- controle de estoque com inventario ciclico validado.
