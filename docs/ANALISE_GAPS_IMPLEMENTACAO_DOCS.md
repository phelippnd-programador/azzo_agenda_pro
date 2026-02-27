# Analise de Gaps de Implementacao (Docs x Frontend)

Data: 2026-02-27

## Escopo da analise
- Documentos avaliados:
  - `docs/REQUISITOS_VALIDACAO_SISTEMA.md`
  - `docs/MATRIZ_HOMOLOGACAO_RF.md`
  - `docs/PADRAO_LABELS_E_TEXTOS.md`
  - `docs/checklist_front.md`

## Resumo executivo
- Frontend funcional principal: implementado e em execucao.
- Homologacao formal: pendente de evidencias para `APROVADO`.
- Gaps remanescentes: majoritariamente homologacao real, operacao (GLR/RNF) e features de roadmap.

## Gaps de implementacao identificados

### 1) Homologacao por RF ainda sem aprovacao formal
- Estado atual na matriz: blocos em `EM_EXECUCAO`.
- Gap: faltam prints/logs de rede e resultado esperado vs obtido por bloco RF para mover a `APROVADO`.
- Acao: preencher `docs/PACOTE_EVIDENCIAS_RF_FRONT.md` e atualizar `docs/MATRIZ_HOMOLOGACAO_RF.md`.

### 2) RBAC dinamico em backend real
- Frontend ja consome `allowedRoutes` e aplica guard.
- Gap: faltam cenarios com backend real:
  - `403` em URL direta sem permissao;
  - override por tenant;
  - recarga de cache;
  - auditoria de permissao.

### 3) Requisitos nao funcionais de operacao (GLR)
- Gap fora do frontend puro:
  - SLO/SLA, RTO/RPO, observabilidade, alertas, quality gates CI e release checklist assinado.
- Dependencia: backend/devops/processo de release.

### 4) Features competitivas (FC-001..FC-009)
- Documentadas, mas ainda nao implementadas.
- Dependencia: backlog de produto + backend + integracoes.

### 5) WhatsApp assistente (OpenNLP) e webhook fim a fim
- Front de configuracao existe.
- Gap: pipeline conversacional, idempotencia de mensagens, timeout de conversa, webhook validado na Meta.
- Dependencia: backend.

## Itens sem gap funcional relevante no frontend
- Cadastro com senha minima 8, confirmar senha e medidor de seguranca.
- Paginacao no frontend:
  - clientes, servicos, profissionais e agenda por filtros.
- Tratamento padrao de erro em fluxos principais.
- Restricoes de contexto publico (`/agendar/:slug`) sem chamadas internas indevidas.

## Proxima ordem sugerida
1. Fechar pacote de evidencias por RF e atualizar matriz para `APROVADO` por bloco validado.
2. Executar rodada com backend real para cenarios RBAC e financeiro/fiscal/licenca.
3. Planejar backlog das features FC-001..FC-009 com fatiamento por entrega.

