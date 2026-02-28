# Especificacao da Feature: Controle de Estoque

Projeto: Azzo Agenda Pro  
Data: 2026-02-28  
Status: proposta para implementacao faseada (P1)

## 1. Objetivo
Controlar insumos/produtos para:
- evitar ruptura de atendimento,
- reduzir perdas,
- apurar custo real por servico,
- integrar custo de reposicao ao financeiro.

## 2. Escopo por Fase

### Fase 1 (obrigatoria)
- cadastro de itens de estoque,
- entradas, saídas e ajustes,
- saldo atual e estoque minimo,
- alerta de estoque baixo.

### Fase 2 (evolutiva)
- ficha tecnica por servico (consumo padrao),
- baixa automatica no `COMPLETED`,
- relatorio de custo por servico/profissional.

## 3. Regras de Negocio
- RB-EST-001: cada item pertence a um tenant.
- RB-EST-002: movimentacao deve registrar `tipo`, `quantidade`, `motivo`, `usuario`, `dataHora`.
- RB-EST-003: nao permitir saldo negativo por padrao.
- RB-EST-004: ajuste manual exige justificativa.
- RB-EST-005: alerta quando `saldoAtual <= estoqueMinimo`.
- RB-EST-006: baixa automatica somente quando agendamento vira `COMPLETED` (fase 2).
- RB-EST-007: cancelamento nao consome estoque.
- RB-EST-008: em `ENTRADA`, pode informar `valorUnitarioPago` e o sistema calcula `valorTotalMovimentacao`.
- RB-EST-009: ao registrar `ENTRADA`, pode gerar lancamento financeiro automatico do tipo `EXPENSE`.
- RB-EST-010: quando `gerarLancamentoFinanceiro=true`, deve existir categoria de despesa e conta de pagamento validas.

## 4. Modelo de Dados (resumo)
Tabela `itens_estoque`
- id (UUID)
- tenant_id (UUID)
- nome (string)
- sku (string, opcional)
- unidade_medida (string: UN, ML, G, KG, etc)
- saldo_atual (decimal)
- estoque_minimo (decimal)
- ativo (boolean)
- created_at, updated_at

Tabela `movimentacoes_estoque`
- id (UUID)
- tenant_id (UUID)
- item_estoque_id (UUID)
- tipo (ENTRADA, SAIDA, AJUSTE)
- quantidade (decimal)
- saldo_anterior (decimal)
- saldo_posterior (decimal)
- motivo (string)
- origem (MANUAL, COMPRA, SERVICO, INVENTARIO)
- referencia_origem_id (UUID opcional)
- usuario_id (UUID)
- valor_unitario_pago (decimal opcional)
- valor_total_movimentacao (decimal opcional)
- gerar_lancamento_financeiro (boolean default false)
- transacao_financeira_id (UUID opcional)
- created_at

Tabela `servico_insumo` (fase 2)
- id (UUID)
- tenant_id (UUID)
- servico_id (UUID)
- item_estoque_id (UUID)
- quantidade_consumo (decimal)
- created_at, updated_at

## 5. API (proposta)

### 5.1 Itens de estoque
- GET `/api/v1/estoque/itens?page=1&limit=20&search=...&ativo=true`
- POST `/api/v1/estoque/itens`
- PUT `/api/v1/estoque/itens/{id}`
- GET `/api/v1/estoque/itens/{id}`

Payload create/update:
```json
{
  "nome": "Shampoo Profissional",
  "sku": "SHAMP-001",
  "unidadeMedida": "ML",
  "estoqueMinimo": 500,
  "ativo": true
}
```

### 5.2 Movimentacoes
- GET `/api/v1/estoque/movimentacoes?page=1&limit=20&itemId=...&tipo=...&inicio=...&fim=...`
- POST `/api/v1/estoque/movimentacoes`

Payload movimentacao:
```json
{
  "itemEstoqueId": "uuid-item",
  "tipo": "ENTRADA",
  "quantidade": 1000,
  "valorUnitarioPago": 0.45,
  "motivo": "Reposicao mensal",
  "origem": "MANUAL",
  "gerarLancamentoFinanceiro": true,
  "financeiro": {
    "categoria": "Compra de insumos",
    "descricao": "Compra shampoo profissional",
    "formaPagamento": "PIX",
    "dataPagamento": "2026-02-28"
  }
}
```

Comportamento:
- se `tipo=ENTRADA` e `valorUnitarioPago` informado, calcular `valorTotalMovimentacao = quantidade * valorUnitarioPago`.
- se `gerarLancamentoFinanceiro=true`, criar transacao em financeiro com `type=EXPENSE` e vincular `transacao_financeira_id`.
- se a criacao da transacao falhar, a API deve:
1. abortar a operacao inteira (transacao unica), ou
2. registrar evento de compensacao e retornar erro rastreavel.
Recomendado: opcao 1 (transacao unica).

### 5.3 Ficha tecnica por servico (fase 2)
- GET `/api/v1/servicos/{id}/insumos`
- PUT `/api/v1/servicos/{id}/insumos`

Payload:
```json
{
  "insumos": [
    {
      "itemEstoqueId": "uuid-item",
      "quantidadeConsumo": 30
    }
  ]
}
```

## 6. Status HTTP (minimo)
- `200`: consulta/sucesso
- `201`: criado
- `204`: sem conteudo (quando aplicavel)
- `400`: validacao de payload
- `401`: nao autenticado
- `403`: sem permissao
- `404`: recurso nao encontrado
- `409`: conflito de negocio (ex.: saldo insuficiente)
- `422`: regra de negocio invalida (opcional se padrao do backend usar 422)
- `500`: erro interno

## 7. Permissoes por Perfil
- OWNER:
  - total em itens e movimentacoes.
- PROFESSIONAL:
  - leitura opcional por politica da empresa.
  - sem ajuste manual por padrao.

## 8. Criterios de Aceite (fase 1)
- CA-EST-001: cadastrar item e visualizar saldo/minimo.
- CA-EST-002: registrar entrada e atualizar saldo corretamente.
- CA-EST-003: registrar saida sem permitir saldo negativo.
- CA-EST-004: exibir alerta para item abaixo do minimo.
- CA-EST-005: movimentacao com auditoria completa.
- CA-EST-006: entrada com valor pago gera custo total corretamente.
- CA-EST-007: entrada com `gerarLancamentoFinanceiro=true` cria despesa vinculada.
- CA-EST-008: falha no financeiro nao deixa estoque inconsistente.

## 9. KPI da Feature
- taxa de ruptura de estoque,
- perda por ajuste nao planejado,
- cobertura de estoque (dias),
- margem por servico (fase 2).

## 10. Evolucao Avancada (fase 3)

### 10.1 Custo medio ponderado (PMC)
Objetivo:
- manter custo unitario atualizado para calcular margem real.

Regra:
- ao registrar `ENTRADA`, recalcular `custo_medio_unitario`.
- ao registrar `SAIDA`, nao alterar custo medio (somente reduzir saldo).

Formula sugerida:
- `novo_custo_medio = ((saldo_anterior * custo_medio_anterior) + (qtd_entrada * valor_unitario_pago)) / (saldo_anterior + qtd_entrada)`

Dados adicionais em `itens_estoque`:
- `custo_medio_unitario` (decimal)
- `ultimo_valor_compra` (decimal)
- `ultima_data_compra` (timestamp)

Criterio de aceite:
- CA-EST-201: custo medio recalcula corretamente apos multiplas entradas com valores diferentes.

### 10.2 Lote e validade
Objetivo:
- reduzir perda por vencimento e garantir rastreabilidade.

Escopo:
- registrar lote e data de validade nas entradas.
- consumir por FEFO (first expiry, first out), quando habilitado.

Dados adicionais:
- tabela `estoque_lotes`:
  - id, tenant_id, item_estoque_id, lote, validade, quantidade_atual, custo_unitario_lote, created_at.

Regras:
- entrada pode gerar 1 ou mais lotes.
- saida deve priorizar lote com validade mais proxima quando politica FEFO ativa.
- bloquear uso de lote vencido (com permissao de excecao opcional).

Criterio de aceite:
- CA-EST-202: sistema alerta itens/lotes vencendo em janela configuravel (ex.: 30 dias).

### 10.3 Inventario ciclico
Objetivo:
- aumentar acuracia entre estoque fisico e sistemico sem parar operacao.

Escopo:
- plano de contagem por grupos de itens (A/B/C).
- contagem parcial recorrente.
- ajuste automatico com justificativa.

Regras:
- toda divergencia deve gerar movimentacao `AJUSTE` com motivo e responsavel.
- itens com divergencia recorrente entram em lista de monitoramento.

API sugerida:
- POST `/api/v1/estoque/inventarios`
- POST `/api/v1/estoque/inventarios/{id}/contagens`
- POST `/api/v1/estoque/inventarios/{id}/fechamento`

Criterio de aceite:
- CA-EST-203: inventario gera ajuste auditavel sem perda de historico.

### 10.4 Fornecedores e pedidos de compra
Objetivo:
- organizar reposicao e reduzir ruptura.

Escopo:
- cadastro de fornecedores.
- pedido de compra (rascunho, emitido, recebido, cancelado).
- recebimento parcial e total.

Dados:
- tabela `fornecedores`
- tabela `pedidos_compra`
- tabela `pedido_compra_itens`

Regras:
- recebimento de pedido cria movimentacoes `ENTRADA`.
- custo da compra pode gerar lancamento financeiro por pedido ou por item.

Criterio de aceite:
- CA-EST-204: recebimento parcial atualiza saldo e valor financeiro proporcional.

### 10.5 Ponto de compra inteligente
Objetivo:
- sugerir compra no momento certo.

Escopo:
- consumo medio diario/semanal por item.
- lead time medio por fornecedor.
- calculo de ponto de reposicao.

Formula base:
- `ponto_reposicao = (consumo_medio_diario * lead_time_dias) + estoque_seguranca`

Regras:
- gerar sugestao quando saldo <= ponto_reposicao.
- permitir aprovacao manual antes de virar pedido.

Criterio de aceite:
- CA-EST-205: lista de sugestoes exibe prioridade por risco de ruptura.

### 10.6 Centro de custo e classificacao financeira
Objetivo:
- melhorar DRE e analise gerencial.

Escopo:
- associar entrada de estoque a centro de custo, conta contabil e categoria.

Regras:
- quando `gerarLancamentoFinanceiro=true`, enviar metadados contabeis obrigatorios.

Payload financeiro estendido:
```json
{
  "categoria": "Compra de insumos",
  "centroCusto": "Operacao Salao",
  "contaContabil": "3.1.2.05",
  "descricao": "Compra de reposicao",
  "formaPagamento": "PIX",
  "dataPagamento": "2026-02-28"
}
```

Criterio de aceite:
- CA-EST-206: despesa gerada no financeiro contem centro de custo e conta contabil.

### 10.7 Transferencia entre unidades (multiunidade)
Objetivo:
- balancear estoque entre filiais.

Escopo:
- solicitacao, envio, recebimento e conferencia.

Regras:
- gerar `SAIDA_TRANSFERENCIA` na origem e `ENTRADA_TRANSFERENCIA` no destino.
- manter vinculo entre as duas movimentacoes.

API sugerida:
- POST `/api/v1/estoque/transferencias`
- POST `/api/v1/estoque/transferencias/{id}/enviar`
- POST `/api/v1/estoque/transferencias/{id}/receber`

Criterio de aceite:
- CA-EST-207: transferencia parcial e total com saldos corretos nas duas unidades.

### 10.8 Permissoes finas e segregacao de funcao
Objetivo:
- reduzir fraude e erro operacional.

Permissoes sugeridas:
- `ESTOQUE_LEITURA`
- `ESTOQUE_ENTRADA`
- `ESTOQUE_SAIDA`
- `ESTOQUE_AJUSTE`
- `ESTOQUE_INVENTARIO`
- `ESTOQUE_PARAMETROS`

Regra:
- ajuste e inventario devem exigir perfil autorizado e trilha de aprovacao opcional.

Criterio de aceite:
- CA-EST-208: usuario sem permissao recebe `403` em endpoints restritos.

### 10.9 Dashboard de estoque e margem
Objetivo:
- suportar decisao rapida.

Indicadores:
- cobertura (dias),
- giro de estoque,
- itens criticos (baixo saldo),
- perdas por ajuste,
- top insumos por consumo,
- margem por servico e profissional.

API sugerida:
- GET `/api/v1/estoque/dashboard?inicio=...&fim=...`

Criterio de aceite:
- CA-EST-209: dashboard bate com dados de movimentacao e financeiro.

### 10.10 Eventos e automacao
Objetivo:
- habilitar integracoes e alertas externos.

Eventos sugeridos:
- `estoque.item.baixo`
- `estoque.item.zerado`
- `estoque.lote.vencendo`
- `estoque.movimentacao.criada`
- `estoque.inventario.fechado`

Entrega:
- webhook por tenant, com retentativa e assinatura de payload.

Criterio de aceite:
- CA-EST-210: evento entregue com idempotencia e rastreabilidade.

## 11. Roadmap sugerido de implementacao
- Sprint 1-2: fase 1 completa + financeiro integrado em `ENTRADA`.
- Sprint 3-4: fase 2 (ficha tecnica e consumo automatico em `COMPLETED`).
- Sprint 5-6: fase 3 parcial (PMC, lote/validade, inventario ciclico).
- Sprint 7+: fornecedores/pedidos, ponto de compra, dashboard avancado e webhooks.

## 12. Riscos e mitigacoes
- R-EST-01: inconsistencias entre estoque e financeiro.
  - mitigacao: transacao unica e reconciliacao periodica.
- R-EST-02: baixa acuracia de estoque fisico.
  - mitigacao: inventario ciclico obrigatorio e auditoria de ajuste.
- R-EST-03: complexidade excessiva no inicio.
  - mitigacao: liberar por fase e ativar features por flag por tenant.

## 13. Importacao por XLSX

### 13.1 Objetivo
Permitir carga em lote para:
- cadastro inicial de itens,
- atualizacao de estoque minimo,
- entrada de estoque com custo e opcional de lancamento financeiro.

### 13.2 Escopo da importacao
Tipos suportados (fase inicial):
- `ITENS`: cria/atualiza itens de estoque.
- `ENTRADAS`: cria movimentacoes de entrada.
- `AJUSTES`: cria movimentacoes de ajuste (com justificativa obrigatoria).

### 13.3 Layout de arquivo (modelo)
Colunas minimas para `ENTRADAS`:
- `sku` ou `nomeItem`
- `quantidade`
- `unidadeMedida`
- `valorUnitarioPago` (opcional, recomendado)
- `motivo`
- `gerarLancamentoFinanceiro` (true/false)
- `categoriaFinanceira` (obrigatorio quando gerar financeiro=true)
- `formaPagamento` (opcional)
- `dataMovimento` (YYYY-MM-DD, opcional)

Regras:
- valores numericos devem usar ponto como separador decimal.
- linhas em branco devem ser ignoradas.
- primeira linha deve conter cabecalho.

### 13.4 Analise de bibliotecas Java (Quarkus)

#### Opcao A - `org.dhatim:fastexcel-reader` (recomendada para importacao)
Vantagens:
- streaming simples para leitura tabular.
- baixo uso de memoria.
- boa performance para arquivos grandes.
- licenca Apache 2.0.

Limitacoes:
- foco em conteudo de celula (nao em estilo/formatacao avancada).

Quando usar:
- importacao operacional de estoque (caso principal).

#### Opcao B - Apache POI com Event Model (`XSSFReader` + SAX)
Vantagens:
- biblioteca mais madura e completa.
- controle fino de leitura em streaming.
- licenca Apache 2.0.

Limitacoes:
- implementacao mais complexa.
- maior custo de manutencao do parser.

Quando usar:
- necessidade de compatibilidade maxima com arquivos heterogeneos/complexos.

#### Opcao C - Wrapper de streaming baseado em POI (ex.: `xlsx-streamer`)
Vantagens:
- API simples para quem ja usa POI.

Limitacoes:
- ciclo de atualizacao mais lento em comparacao a alternativas recomendadas.
- historico de dependencia mais sensivel a vulnerabilidades transitivas se versoes antigas forem usadas.

Quando usar:
- apenas em legado existente; nao recomendado como padrao novo.

### 13.5 Decisao recomendada para Quarkus
Padrao:
- usar `fastexcel-reader` para leitura principal.
- fallback opcional com POI Event Model quando houver casos nao cobertos.

Motivo tecnico:
- melhor equilibrio entre performance, simplicidade e custo operacional para carga tabular de estoque.

### 13.6 Carga assincrona vs sincrona

#### Recomendacao
Padrao de producao: **assincrona**.

Sincrona somente para arquivos pequenos e validacao rapida.

#### Criterios objetivos
Processar **assincrono** quando qualquer condicao ocorrer:
- arquivo > 1 MB,
- mais de 2.000 linhas,
- importacao com `gerarLancamentoFinanceiro=true`,
- ambiente multiusuario com risco de bloqueio de worker.

Permitir **sincrono** quando:
- ate 500 linhas,
- somente validacao ou carga simples sem integracao financeira.

### 13.7 Arquitetura de processamento recomendada (Quarkus)
Fluxo:
1. endpoint de upload recebe arquivo (multipart) e cria `job`.
2. arquivo e salvo em storage temporario.
3. worker assincrono processa em batches (ex.: 200 linhas por lote).
4. persistencia em transacao por lote.
5. gera relatorio de erros por linha.
6. status final: `CONCLUIDO`, `CONCLUIDO_COM_ERROS` ou `FALHOU`.

Boas praticas:
- idempotencia por hash do arquivo + tenant + tipo importacao.
- lock por job para evitar dupla execucao.
- limite de concorrencia configuravel por tenant.

### 13.8 API sugerida para importacao
- `POST /api/v1/estoque/importacoes` (upload + criacao de job)
- `GET /api/v1/estoque/importacoes/{jobId}` (status e progresso)
- `GET /api/v1/estoque/importacoes/{jobId}/erros` (lista paginada de erros)
- `GET /api/v1/estoque/importacoes/{jobId}/arquivo-resultado` (xlsx/csv com retorno por linha)
- `POST /api/v1/estoque/importacoes/{jobId}/cancelar`

Payload (metadados):
```json
{
  "tipoImportacao": "ENTRADAS",
  "dryRun": false,
  "executarAssincrono": true
}
```

Status de job:
- `RECEBIDO`
- `EM_VALIDACAO`
- `PROCESSANDO`
- `CONCLUIDO`
- `CONCLUIDO_COM_ERROS`
- `FALHOU`
- `CANCELADO`

### 13.9 Estrutura de erro por linha
Campos minimos:
- `linha`
- `coluna`
- `codigoErro`
- `mensagem`
- `valorRecebido`

Exemplo:
```json
{
  "linha": 27,
  "coluna": "valorUnitarioPago",
  "codigoErro": "ESTOQUE_VALOR_INVALIDO",
  "mensagem": "Valor unitario deve ser maior que zero",
  "valorRecebido": "-12.5"
}
```

### 13.10 Regras de consistencia transacional
- por lote, estoque e financeiro devem ser gravados em transacao unica.
- em erro de financeiro, rollback do lote.
- linhas validas de outros lotes nao devem ser perdidas.
- sempre registrar auditoria de inicio/fim, usuario e resumo do job.

### 13.11 Criterios de aceite da importacao
- CA-EST-301: importar 10.000 linhas sem estouro de memoria.
- CA-EST-302: retornar progresso em tempo real por job.
- CA-EST-303: gerar relatorio de erros por linha.
- CA-EST-304: em `dryRun=true`, nao persistir dados.
- CA-EST-305: com financeiro habilitado, manter consistencia estoque+financeiro.

## 14. Camada Analitica com Materialized View

### 14.1 Decisao arquitetural
Para o dashboard de estoque e analises agregadas, adotar **Materialized Views** no banco relacional.

Objetivo:
- reduzir custo de consulta em paines analiticos,
- manter resposta rapida para filtros por periodo, item, servico e profissional.

### 14.2 Regra de uso
- operacao transacional (entrada/saida/ajuste) deve consultar tabelas base.
- dashboard analitico deve consultar materialized views.
- nao usar materialized view como fonte unica para tela operacional em tempo real.

### 14.3 Materialized views sugeridas
- `mv_estoque_indicadores_diarios`
  - tenant_id, data_referencia, itens_abaixo_minimo, itens_zerados, valor_estoque_custo_medio.
- `mv_estoque_consumo_servico`
  - tenant_id, periodo, servico_id, item_estoque_id, quantidade_consumida, custo_total_consumo.
- `mv_estoque_perdas_ajustes`
  - tenant_id, periodo, item_estoque_id, quantidade_ajuste, valor_ajuste, motivo_principal.
- `mv_estoque_margem_servico`
  - tenant_id, periodo, servico_id, receita_total, custo_insumos_total, margem_bruta.

### 14.4 Politica de refresh
Padrao recomendado:
- refresh assincrono agendado (ex.: a cada 5 minutos) para KPIs gerais.
- refresh sob demanda apos eventos de alto impacto (importacao finalizada, inventario fechado).

Regras:
- registrar `ultima_atualizacao` para exibir no frontend.
- nao bloquear operacao transacional durante refresh.
- preferir `REFRESH MATERIALIZED VIEW CONCURRENTLY` quando suportado e com indice apropriado.

### 14.5 Consistencia e UX
- dashboard deve mostrar selo: `Atualizado em HH:mm`.
- se view estiver desatualizada alem do SLA (ex.: >15 min), exibir aviso de dados atrasados.
- telas operacionais continuam refletindo dado real via tabelas base.

### 14.6 KPI e SLO da camada analitica
- SLO-EST-AN-001: 95% das consultas de dashboard < 500 ms.
- SLO-EST-AN-002: defasagem de materialized view <= 10 min em horario comercial.
- SLO-EST-AN-003: falha de refresh deve gerar alerta operacional.

### 14.7 Criterios de aceite
- CA-EST-401: dashboard utiliza apenas materialized views para blocos agregados.
- CA-EST-402: operacoes de estoque nao ficam indisponiveis durante refresh.
- CA-EST-403: timestamp de ultima atualizacao exibido em tela.
- CA-EST-404: alerta emitido quando refresh falha ou atrasa alem do limite.

## 15. SQL Base das Materialized Views (PostgreSQL)

Observacoes:
- SQL abaixo e referencia inicial e deve ser ajustado ao schema real.
- para `REFRESH ... CONCURRENTLY`, cada MV precisa de indice unico.
- todas as consultas devem filtrar por `tenant_id`.

### 15.1 MV de indicadores diarios
```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estoque_indicadores_diarios AS
SELECT
  i.tenant_id,
  CURRENT_DATE AS data_referencia,
  COUNT(*) FILTER (WHERE i.saldo_atual <= i.estoque_minimo) AS itens_abaixo_minimo,
  COUNT(*) FILTER (WHERE i.saldo_atual <= 0) AS itens_zerados,
  COALESCE(SUM(i.saldo_atual * COALESCE(i.custo_medio_unitario, 0)), 0) AS valor_estoque_custo_medio
FROM itens_estoque i
WHERE i.ativo = TRUE
GROUP BY i.tenant_id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_estoque_indicadores_diarios
  ON mv_estoque_indicadores_diarios (tenant_id, data_referencia);
```

### 15.2 MV de consumo por servico
```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estoque_consumo_servico AS
SELECT
  m.tenant_id,
  date_trunc('month', m.created_at)::date AS periodo,
  a.service_id,
  m.item_estoque_id,
  SUM(m.quantidade) AS quantidade_consumida,
  SUM(m.quantidade * COALESCE(m.valor_unitario_pago, i.custo_medio_unitario, 0)) AS custo_total_consumo
FROM movimentacoes_estoque m
JOIN itens_estoque i
  ON i.id = m.item_estoque_id
LEFT JOIN appointments a
  ON a.id = m.referencia_origem_id
WHERE m.tipo = 'SAIDA'
  AND m.origem = 'SERVICO'
GROUP BY
  m.tenant_id,
  date_trunc('month', m.created_at)::date,
  a.service_id,
  m.item_estoque_id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_estoque_consumo_servico
  ON mv_estoque_consumo_servico (tenant_id, periodo, service_id, item_estoque_id);
```

### 15.3 MV de perdas e ajustes
```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estoque_perdas_ajustes AS
SELECT
  m.tenant_id,
  date_trunc('month', m.created_at)::date AS periodo,
  m.item_estoque_id,
  SUM(m.quantidade) AS quantidade_ajuste,
  SUM(m.quantidade * COALESCE(m.valor_unitario_pago, i.custo_medio_unitario, 0)) AS valor_ajuste,
  MIN(m.motivo) AS motivo_principal
FROM movimentacoes_estoque m
JOIN itens_estoque i
  ON i.id = m.item_estoque_id
WHERE m.tipo = 'AJUSTE'
GROUP BY
  m.tenant_id,
  date_trunc('month', m.created_at)::date,
  m.item_estoque_id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_estoque_perdas_ajustes
  ON mv_estoque_perdas_ajustes (tenant_id, periodo, item_estoque_id);
```

### 15.4 MV de margem por servico
```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estoque_margem_servico AS
WITH receita AS (
  SELECT
    a.tenant_id,
    date_trunc('month', a.date)::date AS periodo,
    a.service_id,
    SUM(a.total_price) AS receita_total
  FROM appointments a
  WHERE a.status = 'COMPLETED'
  GROUP BY a.tenant_id, date_trunc('month', a.date)::date, a.service_id
),
custo AS (
  SELECT
    c.tenant_id,
    c.periodo,
    c.service_id,
    SUM(c.custo_total_consumo) AS custo_insumos_total
  FROM mv_estoque_consumo_servico c
  GROUP BY c.tenant_id, c.periodo, c.service_id
)
SELECT
  r.tenant_id,
  r.periodo,
  r.service_id,
  r.receita_total,
  COALESCE(c.custo_insumos_total, 0) AS custo_insumos_total,
  (r.receita_total - COALESCE(c.custo_insumos_total, 0)) AS margem_bruta
FROM receita r
LEFT JOIN custo c
  ON c.tenant_id = r.tenant_id
 AND c.periodo = r.periodo
 AND c.service_id = r.service_id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_estoque_margem_servico
  ON mv_estoque_margem_servico (tenant_id, periodo, service_id);
```

### 15.5 Tabela de controle de refresh
```sql
CREATE TABLE IF NOT EXISTS estoque_mv_refresh_log (
  id BIGSERIAL PRIMARY KEY,
  nome_view TEXT NOT NULL,
  status TEXT NOT NULL,
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalizado_em TIMESTAMPTZ NULL,
  erro TEXT NULL
);
```

### 15.6 Funcao de refresh (com log)
```sql
CREATE OR REPLACE FUNCTION fn_refresh_estoque_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_views TEXT[] := ARRAY[
    'mv_estoque_indicadores_diarios',
    'mv_estoque_consumo_servico',
    'mv_estoque_perdas_ajustes',
    'mv_estoque_margem_servico'
  ];
  v_view TEXT;
  v_log_id BIGINT;
BEGIN
  FOREACH v_view IN ARRAY v_views
  LOOP
    INSERT INTO estoque_mv_refresh_log (nome_view, status)
    VALUES (v_view, 'INICIADO')
    RETURNING id INTO v_log_id;

    BEGIN
      EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', v_view);
      UPDATE estoque_mv_refresh_log
      SET status = 'SUCESSO', finalizado_em = NOW()
      WHERE id = v_log_id;
    EXCEPTION WHEN OTHERS THEN
      UPDATE estoque_mv_refresh_log
      SET status = 'FALHA', finalizado_em = NOW(), erro = SQLERRM
      WHERE id = v_log_id;
    END;
  END LOOP;
END;
$$;
```

### 15.7 Agendamento de refresh
Opcoes comuns:
- `pg_cron` no banco:
```sql
SELECT cron.schedule('refresh_estoque_mvs', '*/5 * * * *', 'SELECT fn_refresh_estoque_materialized_views();');
```
- job no backend Quarkus (recomendado quando quiser controle por tenant e observabilidade centralizada).

### 15.8 Consulta do timestamp de atualizacao
Opcoes:
- usar `MAX(finalizado_em)` da tabela `estoque_mv_refresh_log` por view.
- ou manter tabela de metadados com `ultima_atualizacao`.

Exemplo:
```sql
SELECT nome_view, MAX(finalizado_em) AS ultima_atualizacao
FROM estoque_mv_refresh_log
WHERE status = 'SUCESSO'
GROUP BY nome_view;
```

## 16. Paths detalhados (descricao e regra de negocio)

Convencao:
- todos os endpoints abaixo sao privados e exigem autenticacao.
- escopo multi-tenant obrigatorio por `tenant_id` extraido da sessao/token.
- respostas de erro devem seguir padrao global (`code`, `message`, `details`, `path`, `timestamp`).

### 16.1 Itens de estoque

#### GET `/api/v1/estoque/itens`
Descricao:
- lista itens com paginacao e filtros.

Query params:
- `page`, `limit`, `search`, `ativo`, `abaixoMinimo`.

Regras:
- filtrar por tenant.
- `abaixoMinimo=true` retorna apenas `saldo_atual <= estoque_minimo`.

Resposta 200 (exemplo):
```json
{
  "items": [
    {
      "id": "uuid",
      "nome": "Shampoo Profissional",
      "sku": "SHAMP-001",
      "unidadeMedida": "ML",
      "saldoAtual": 860,
      "estoqueMinimo": 500,
      "custoMedioUnitario": 0.45,
      "ativo": true,
      "createdAt": "2026-02-28T10:00:00Z",
      "updatedAt": "2026-02-28T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20,
  "hasMore": false
}
```

#### GET `/api/v1/estoque/itens/{id}`
Descricao:
- detalha item por id.

Regras:
- `404` se nao existir no tenant.

#### POST `/api/v1/estoque/itens`
Descricao:
- cria item de estoque.

Regras:
- `nome` obrigatorio.
- `unidadeMedida` obrigatorio.
- `estoqueMinimo >= 0`.
- `sku` unico por tenant quando informado.

Payload:
```json
{
  "nome": "Shampoo Profissional",
  "sku": "SHAMP-001",
  "unidadeMedida": "ML",
  "estoqueMinimo": 500,
  "ativo": true
}
```

#### PUT `/api/v1/estoque/itens/{id}`
Descricao:
- atualiza metadados do item.

Regras:
- nao altera saldo por este endpoint.
- ajuste de saldo deve ocorrer apenas via movimentacao.

#### PATCH `/api/v1/estoque/itens/{id}/status`
Descricao:
- ativa/inativa item.

Regras:
- item inativo nao pode ser usado em nova ficha tecnica (fase 2).

### 16.2 Movimentacoes de estoque

#### GET `/api/v1/estoque/movimentacoes`
Descricao:
- lista movimentacoes com filtros.

Query params:
- `page`, `limit`, `itemId`, `tipo`, `origem`, `inicio`, `fim`.

Regras:
- ordenar por `createdAt desc` por padrao.

#### POST `/api/v1/estoque/movimentacoes`
Descricao:
- cria movimentacao (`ENTRADA`, `SAIDA`, `AJUSTE`).

Regras de negocio:
- `quantidade > 0`.
- `SAIDA` e `AJUSTE` de reducao nao podem gerar saldo negativo (salvo permissao de excecao).
- `AJUSTE` exige `motivo`.
- `ENTRADA` com custo pode gerar lancamento financeiro (`EXPENSE`).
- operacao estoque+financeiro deve ser transacional.

Payload:
```json
{
  "itemEstoqueId": "uuid-item",
  "tipo": "ENTRADA",
  "quantidade": 1000,
  "valorUnitarioPago": 0.45,
  "motivo": "Reposicao mensal",
  "origem": "MANUAL",
  "gerarLancamentoFinanceiro": true,
  "financeiro": {
    "categoria": "Compra de insumos",
    "centroCusto": "Operacao Salao",
    "contaContabil": "3.1.2.05",
    "descricao": "Compra shampoo profissional",
    "formaPagamento": "PIX",
    "dataPagamento": "2026-02-28"
  }
}
```

### 16.3 Ficha tecnica de insumos por servico (fase 2)

#### GET `/api/v1/servicos/{id}/insumos`
Descricao:
- lista insumos associados ao servico.

Regras:
- apenas itens ativos devem retornar como disponiveis para inclusao.

#### PUT `/api/v1/servicos/{id}/insumos`
Descricao:
- substitui lista de insumos do servico.

Regras:
- `quantidadeConsumo > 0`.
- nao permitir duplicidade de `itemEstoqueId`.

Payload:
```json
{
  "insumos": [
    {
      "itemEstoqueId": "uuid-item-1",
      "quantidadeConsumo": 30
    },
    {
      "itemEstoqueId": "uuid-item-2",
      "quantidadeConsumo": 15
    }
  ]
}
```

### 16.4 Importacao XLSX

#### POST `/api/v1/estoque/importacoes`
Descricao:
- recebe arquivo e cria job de importacao.

Regras:
- valida tipo de arquivo.
- suporta `dryRun`.
- por padrao processar assincrono para cargas grandes.

#### GET `/api/v1/estoque/importacoes/{jobId}`
Descricao:
- retorna status/progresso.

#### GET `/api/v1/estoque/importacoes/{jobId}/erros`
Descricao:
- retorna erros por linha, paginado.

#### GET `/api/v1/estoque/importacoes/{jobId}/arquivo-resultado`
Descricao:
- baixa retorno consolidado da importacao (csv/xlsx).

#### POST `/api/v1/estoque/importacoes/{jobId}/cancelar`
Descricao:
- solicita cancelamento do job.

### 16.5 Dashboard e analitico

#### GET `/api/v1/estoque/dashboard`
Descricao:
- retorna indicadores agregados (MVs).

Query params:
- `inicio`, `fim`, `serviceId`, `itemId`.

Regras:
- resposta deve incluir `atualizadoEm`.
- se defasagem acima do SLA, incluir aviso no payload.

Resposta 200 (exemplo):
```json
{
  "atualizadoEm": "2026-02-28T14:05:00Z",
  "itensAbaixoMinimo": 8,
  "itensZerados": 2,
  "valorEstoqueCustoMedio": 12500.45,
  "rupturaTaxa": 0.03,
  "perdasValor": 580.0,
  "margemServicos": [
    {
      "serviceId": "uuid-servico",
      "receitaTotal": 15000.0,
      "custoInsumosTotal": 4300.0,
      "margemBruta": 10700.0
    }
  ]
}
```

### 16.6 Inventario ciclico (fase 3)

#### POST `/api/v1/estoque/inventarios`
Descricao:
- cria inventario.

#### POST `/api/v1/estoque/inventarios/{id}/contagens`
Descricao:
- registra contagens fisicas por item.

#### POST `/api/v1/estoque/inventarios/{id}/fechamento`
Descricao:
- fecha inventario e gera ajustes necessarios.

Regras:
- divergencias devem gerar `AJUSTE` com justificativa.

### 16.7 Fornecedores e pedidos (fase 3)

#### GET/POST `/api/v1/estoque/fornecedores`
Descricao:
- listar e criar fornecedores.

#### GET/POST `/api/v1/estoque/pedidos-compra`
Descricao:
- listar e criar pedidos.

#### POST `/api/v1/estoque/pedidos-compra/{id}/recebimento`
Descricao:
- recebe pedido (parcial ou total) e gera entradas de estoque.

Regras:
- recebimento parcial atualiza status do pedido.
- pode gerar despesa vinculada.

### 16.8 Transferencia entre unidades (fase 3)

#### POST `/api/v1/estoque/transferencias`
Descricao:
- cria solicitacao de transferencia.

#### POST `/api/v1/estoque/transferencias/{id}/enviar`
Descricao:
- baixa estoque na origem.

#### POST `/api/v1/estoque/transferencias/{id}/receber`
Descricao:
- entrada no destino.

Regras:
- origem e destino devem pertencer ao mesmo tenant multiunidade.

## 17. DTOs (request/response)

### 17.1 ItemEstoqueDto
```java
public class ItemEstoqueDto {
  public String id;
  public String nome;
  public String sku;
  public String unidadeMedida;
  public BigDecimal saldoAtual;
  public BigDecimal estoqueMinimo;
  public BigDecimal custoMedioUnitario;
  public Boolean ativo;
  public Instant createdAt;
  public Instant updatedAt;
}
```

### 17.2 CriarItemEstoqueRequest
```java
public class CriarItemEstoqueRequest {
  @NotBlank public String nome;
  public String sku;
  @NotBlank public String unidadeMedida;
  @NotNull @DecimalMin("0") public BigDecimal estoqueMinimo;
  public Boolean ativo = true;
}
```

### 17.3 AtualizarItemEstoqueRequest
```java
public class AtualizarItemEstoqueRequest {
  public String nome;
  public String sku;
  public String unidadeMedida;
  @DecimalMin("0") public BigDecimal estoqueMinimo;
  public Boolean ativo;
}
```

### 17.4 MovimentacaoFinanceiroRequest
```java
public class MovimentacaoFinanceiroRequest {
  @NotBlank public String categoria;
  public String centroCusto;
  public String contaContabil;
  public String descricao;
  public String formaPagamento;
  public LocalDate dataPagamento;
}
```

### 17.5 CriarMovimentacaoEstoqueRequest
```java
public class CriarMovimentacaoEstoqueRequest {
  @NotBlank public String itemEstoqueId;
  @NotBlank public String tipo; // ENTRADA, SAIDA, AJUSTE
  @NotNull @DecimalMin("0.0001") public BigDecimal quantidade;
  public BigDecimal valorUnitarioPago;
  @NotBlank public String motivo;
  @NotBlank public String origem; // MANUAL, COMPRA, SERVICO, INVENTARIO
  public String referenciaOrigemId;
  public Boolean gerarLancamentoFinanceiro = false;
  public MovimentacaoFinanceiroRequest financeiro;
}
```

### 17.6 MovimentacaoEstoqueDto
```java
public class MovimentacaoEstoqueDto {
  public String id;
  public String itemEstoqueId;
  public String tipo;
  public BigDecimal quantidade;
  public BigDecimal saldoAnterior;
  public BigDecimal saldoPosterior;
  public String motivo;
  public String origem;
  public String referenciaOrigemId;
  public BigDecimal valorUnitarioPago;
  public BigDecimal valorTotalMovimentacao;
  public Boolean gerarLancamentoFinanceiro;
  public String transacaoFinanceiraId;
  public String usuarioId;
  public Instant createdAt;
}
```

### 17.7 ServicoInsumoDto
```java
public class ServicoInsumoDto {
  public String id;
  public String servicoId;
  public String itemEstoqueId;
  public BigDecimal quantidadeConsumo;
}
```

### 17.8 ImportacaoEstoqueJobDto
```java
public class ImportacaoEstoqueJobDto {
  public String id;
  public String tipoImportacao; // ITENS, ENTRADAS, AJUSTES
  public String status; // RECEBIDO, EM_VALIDACAO, PROCESSANDO, CONCLUIDO, CONCLUIDO_COM_ERROS, FALHOU, CANCELADO
  public Boolean dryRun;
  public Integer totalLinhas;
  public Integer linhasProcessadas;
  public Integer linhasComErro;
  public Instant criadoEm;
  public Instant atualizadoEm;
  public Instant finalizadoEm;
}
```

### 17.9 ErroImportacaoLinhaDto
```java
public class ErroImportacaoLinhaDto {
  public Integer linha;
  public String coluna;
  public String codigoErro;
  public String mensagem;
  public String valorRecebido;
}
```

## 18. Entidades de dominio (modelo sugerido)

### 18.1 EstoqueItem
```java
public class EstoqueItem {
  public UUID id;
  public UUID tenantId;
  public String nome;
  public String sku;
  public String unidadeMedida;
  public BigDecimal saldoAtual;
  public BigDecimal estoqueMinimo;
  public BigDecimal custoMedioUnitario;
  public Boolean ativo;
  public Instant createdAt;
  public Instant updatedAt;
}
```

### 18.2 EstoqueMovimentacao
```java
public class EstoqueMovimentacao {
  public UUID id;
  public UUID tenantId;
  public UUID itemEstoqueId;
  public TipoMovimentacao tipo; // ENTRADA, SAIDA, AJUSTE
  public BigDecimal quantidade;
  public BigDecimal saldoAnterior;
  public BigDecimal saldoPosterior;
  public String motivo;
  public OrigemMovimentacao origem; // MANUAL, COMPRA, SERVICO, INVENTARIO, TRANSFERENCIA
  public UUID referenciaOrigemId;
  public BigDecimal valorUnitarioPago;
  public BigDecimal valorTotalMovimentacao;
  public Boolean gerarLancamentoFinanceiro;
  public UUID transacaoFinanceiraId;
  public UUID usuarioId;
  public Instant createdAt;
}
```

### 18.3 ServicoInsumo
```java
public class ServicoInsumo {
  public UUID id;
  public UUID tenantId;
  public UUID servicoId;
  public UUID itemEstoqueId;
  public BigDecimal quantidadeConsumo;
  public Instant createdAt;
  public Instant updatedAt;
}
```

### 18.4 ImportacaoEstoqueJob
```java
public class ImportacaoEstoqueJob {
  public UUID id;
  public UUID tenantId;
  public TipoImportacao tipoImportacao; // ITENS, ENTRADAS, AJUSTES
  public StatusImportacao status;
  public Boolean dryRun;
  public String arquivoNomeOriginal;
  public String arquivoStoragePath;
  public Integer totalLinhas;
  public Integer linhasProcessadas;
  public Integer linhasComErro;
  public UUID solicitadoPorUsuarioId;
  public Instant criadoEm;
  public Instant atualizadoEm;
  public Instant finalizadoEm;
}
```

## 19. Relacionamentos (cardinalidade)

### 19.1 Relacoes principais
- `tenant` 1:N `itens_estoque`
- `itens_estoque` 1:N `movimentacoes_estoque`
- `servicos` N:N `itens_estoque` via `servico_insumo`
- `importacao_estoque_job` 1:N `importacao_estoque_erro_linha`
- `movimentacoes_estoque` 0:1 `finance_transactions` (quando gerar financeiro=true)
- `movimentacoes_estoque` N:1 `users` (autor da operacao)

### 19.2 Regras de integridade
- FK obrigatoria de `movimentacoes_estoque.item_estoque_id`.
- FK opcional de `movimentacoes_estoque.transacao_financeira_id`.
- unique `(tenant_id, sku)` em `itens_estoque` quando sku nao nulo.
- unique `(tenant_id, servico_id, item_estoque_id)` em `servico_insumo`.

### 19.3 Diagrama textual (ER simplificado)
```text
TENANT
  |--< ITENS_ESTOQUE
  |      |--< MOVIMENTACOES_ESTOQUE >--| USERS
  |      |                             
  |      |--< SERVICO_INSUMO >--| SERVICOS
  |
  |--< IMPORTACAO_ESTOQUE_JOB
         |--< IMPORTACAO_ESTOQUE_ERRO_LINHA

MOVIMENTACOES_ESTOQUE --(opcional)--> FINANCE_TRANSACTIONS
```

## 20. Rotas de paginas (frontend) e perfis

Objetivo:
- definir rotas de UI do modulo de estoque para cadastro em migration de menus/permissoes por perfil.

Observacao:
- nomes/paths abaixo devem ser tratados como `route_key` oficial no backend.
- o frontend deve consumir menu dinamico por perfil sem hardcode de autorizacao.

### 20.1 Rotas de paginas do modulo estoque

#### `/estoque`
Descricao:
- dashboard de estoque (cards, alertas, giro, cobertura, perdas, margem).
Permissoes:
- OWNER: permitido
- PROFESSIONAL: opcional (somente leitura, conforme politica)

#### `/estoque/itens`
Descricao:
- listagem de itens de estoque com filtros e busca.
Permissoes:
- OWNER: permitido
- PROFESSIONAL: opcional leitura

#### `/estoque/itens/novo`
Descricao:
- cadastro de novo item.
Permissoes:
- OWNER: permitido
- PROFESSIONAL: negado por padrao

#### `/estoque/itens/:id/editar`
Descricao:
- edicao de metadados do item.
Permissoes:
- OWNER: permitido
- PROFESSIONAL: negado por padrao

#### `/estoque/movimentacoes`
Descricao:
- listagem de movimentacoes de estoque.
Permissoes:
- OWNER: permitido
- PROFESSIONAL: opcional leitura

#### `/estoque/movimentacoes/nova`
Descricao:
- tela de nova movimentacao manual (entrada/saida/ajuste).
Permissoes:
- OWNER: permitido
- PROFESSIONAL: restrito por permissao fina

#### `/estoque/importacoes`
Descricao:
- upload e acompanhamento de importacao XLSX.
Permissoes:
- OWNER: permitido
- PROFESSIONAL: negado por padrao

#### `/estoque/importacoes/:jobId`
Descricao:
- detalhe do job de importacao (status, progresso e erros por linha).
Permissoes:
- OWNER: permitido
- PROFESSIONAL: negado por padrao

#### `/estoque/inventarios`
Descricao:
- listagem de inventarios ciclicos (fase 3).
Permissoes:
- OWNER: permitido
- PROFESSIONAL: opcional leitura

#### `/estoque/inventarios/novo`
Descricao:
- abertura de novo inventario.
Permissoes:
- OWNER: permitido
- PROFESSIONAL: negado por padrao

#### `/estoque/inventarios/:id`
Descricao:
- execucao e fechamento de inventario.
Permissoes:
- OWNER: permitido
- PROFESSIONAL: restrito se houver permissao `ESTOQUE_INVENTARIO`

#### `/estoque/fornecedores`
Descricao:
- CRUD de fornecedores (fase 3).
Permissoes:
- OWNER: permitido
- PROFESSIONAL: negado por padrao

#### `/estoque/pedidos-compra`
Descricao:
- listagem e criacao de pedidos de compra (fase 3).
Permissoes:
- OWNER: permitido
- PROFESSIONAL: negado por padrao

#### `/estoque/pedidos-compra/:id`
Descricao:
- detalhe e recebimento do pedido.
Permissoes:
- OWNER: permitido
- PROFESSIONAL: negado por padrao

#### `/estoque/transferencias`
Descricao:
- transferencias entre unidades (fase 3).
Permissoes:
- OWNER: permitido
- PROFESSIONAL: negado por padrao

#### `/estoque/configuracoes`
Descricao:
- parametros do modulo (politica FEFO, janela de alerta, limites).
Permissoes:
- OWNER: permitido
- PROFESSIONAL: negado por padrao

### 20.2 Matriz de perfil x rota (baseline)

Regra baseline:
- OWNER: acesso total ao modulo estoque.
- PROFESSIONAL: leitura e operacoes pontuais somente quando explicitamente liberado.

Matriz resumida:
- OWNER:
  - `/estoque`
  - `/estoque/itens`
  - `/estoque/itens/novo`
  - `/estoque/itens/:id/editar`
  - `/estoque/movimentacoes`
  - `/estoque/movimentacoes/nova`
  - `/estoque/importacoes`
  - `/estoque/importacoes/:jobId`
  - `/estoque/inventarios`
  - `/estoque/inventarios/novo`
  - `/estoque/inventarios/:id`
  - `/estoque/fornecedores`
  - `/estoque/pedidos-compra`
  - `/estoque/pedidos-compra/:id`
  - `/estoque/transferencias`
  - `/estoque/configuracoes`

- PROFESSIONAL (minimo sugerido):
  - `/estoque` (leitura)
  - `/estoque/itens` (leitura)
  - `/estoque/movimentacoes` (leitura)
  - `/estoque/inventarios` (leitura opcional)

### 20.3 Permissoes finas vinculadas as rotas

Mapeamento sugerido:
- `ESTOQUE_LEITURA`: `/estoque`, `/estoque/itens`, `/estoque/movimentacoes`
- `ESTOQUE_ENTRADA`: `/estoque/movimentacoes/nova` (tipo ENTRADA)
- `ESTOQUE_SAIDA`: `/estoque/movimentacoes/nova` (tipo SAIDA)
- `ESTOQUE_AJUSTE`: `/estoque/movimentacoes/nova` (tipo AJUSTE)
- `ESTOQUE_IMPORTACAO`: `/estoque/importacoes`, `/estoque/importacoes/:jobId`
- `ESTOQUE_INVENTARIO`: `/estoque/inventarios/novo`, `/estoque/inventarios/:id`
- `ESTOQUE_PARAMETROS`: `/estoque/configuracoes`
- `ESTOQUE_FORNECEDOR_COMPRA`: `/estoque/fornecedores`, `/estoque/pedidos-compra`, `/estoque/pedidos-compra/:id`
- `ESTOQUE_TRANSFERENCIA`: `/estoque/transferencias`

### 20.4 Estrutura de migration (menus e permissoes)

Tabela esperada (exemplo):
- `menu_item` (id, route_key, label, parent_id, icon, ordem, ativo)
- `perfil_menu_item` (perfil, menu_item_id)
- `permissao` (codigo, descricao)
- `perfil_permissao` (perfil, permissao_id)

Regras:
- `route_key` deve ser unico.
- menu de estoque deve respeitar hierarquia visual:
  - `/estoque` (raiz)
  - filhos: itens, movimentacoes, importacoes, inventarios, fornecedores, pedidos, transferencias, configuracoes.

### 20.5 Exemplo de dados para migration (SQL de referencia)
```sql
-- menu raiz
INSERT INTO menu_item (route_key, label, icon, ordem, ativo)
VALUES ('/estoque', 'Estoque', 'Boxes', 70, true)
ON CONFLICT (route_key) DO NOTHING;

-- filhos principais
INSERT INTO menu_item (route_key, label, parent_id, icon, ordem, ativo)
SELECT '/estoque/itens', 'Itens', m.id, 'Package', 1, true
FROM menu_item m
WHERE m.route_key = '/estoque'
ON CONFLICT (route_key) DO NOTHING;

INSERT INTO menu_item (route_key, label, parent_id, icon, ordem, ativo)
SELECT '/estoque/movimentacoes', 'Movimentacoes', m.id, 'ArrowLeftRight', 2, true
FROM menu_item m
WHERE m.route_key = '/estoque'
ON CONFLICT (route_key) DO NOTHING;

INSERT INTO menu_item (route_key, label, parent_id, icon, ordem, ativo)
SELECT '/estoque/importacoes', 'Importacoes', m.id, 'FileSpreadsheet', 3, true
FROM menu_item m
WHERE m.route_key = '/estoque'
ON CONFLICT (route_key) DO NOTHING;
```

### 20.6 Criterios de aceite para rotas/perfis
- CA-EST-501: rotas do modulo estoque retornam no endpoint de menu conforme perfil.
- CA-EST-502: usuario PROFESSIONAL sem permissao fina recebe bloqueio ao tentar acessar rota restrita.
- CA-EST-503: menu renderiza sem hardcode, apenas pelo retorno do backend.
- CA-EST-504: alteracao de permissao em banco reflete no frontend sem deploy.

## 21. Status HTTP por endpoint (detalhado)

### 21.1 Itens de estoque

#### GET `/api/v1/estoque/itens`
- `200`: lista retornada com sucesso.
- `400`: query params invalidos (ex.: page/limit fora do padrao).
- `401`: token ausente/invalido.
- `403`: perfil sem permissao de leitura.
- `500`: erro inesperado ao consultar.

#### GET `/api/v1/estoque/itens/{id}`
- `200`: item encontrado.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: item nao existe para o tenant.
- `500`: erro inesperado.

#### POST `/api/v1/estoque/itens`
- `201`: item criado.
- `400`: payload invalido (campos obrigatorios/formatacao).
- `401`: token ausente/invalido.
- `403`: perfil sem permissao de criacao.
- `409`: conflito de unicidade (ex.: SKU duplicado por tenant).
- `422`: regra de negocio invalida (ex.: estoque minimo negativo, se adotado).
- `500`: erro inesperado.

#### PUT `/api/v1/estoque/itens/{id}`
- `200`: item atualizado.
- `400`: payload invalido.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao de edicao.
- `404`: item nao encontrado no tenant.
- `409`: conflito de unicidade (SKU).
- `422`: regra de negocio invalida.
- `500`: erro inesperado.

#### PATCH `/api/v1/estoque/itens/{id}/status`
- `200`: status atualizado (ativo/inativo).
- `400`: status solicitado invalido.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: item nao encontrado.
- `422`: regra de negocio bloqueando inativacao (ex.: item vinculado e politica restritiva).
- `500`: erro inesperado.

### 21.2 Movimentacoes

#### GET `/api/v1/estoque/movimentacoes`
- `200`: lista retornada com sucesso.
- `400`: filtros invalidos (datas/formato/tipo).
- `401`: token ausente/invalido.
- `403`: perfil sem permissao de leitura.
- `500`: erro inesperado.

#### POST `/api/v1/estoque/movimentacoes`
- `201`: movimentacao criada com sucesso.
- `400`: payload invalido (quantidade/tipo/motivo).
- `401`: token ausente/invalido.
- `403`: perfil sem permissao para o tipo da movimentacao.
- `404`: item de estoque nao encontrado.
- `409`: conflito de negocio (saldo insuficiente; falha de concorrencia otimista).
- `422`: regra de negocio invalida (ex.: ajuste sem justificativa; financeiro incompleto).
- `500`: erro inesperado.

### 21.3 Ficha tecnica de servico (fase 2)

#### GET `/api/v1/servicos/{id}/insumos`
- `200`: lista de insumos do servico.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao de leitura.
- `404`: servico nao encontrado no tenant.
- `500`: erro inesperado.

#### PUT `/api/v1/servicos/{id}/insumos`
- `200`: ficha tecnica atualizada.
- `400`: payload invalido (insumos vazios/duplicados/formato).
- `401`: token ausente/invalido.
- `403`: perfil sem permissao de editar ficha.
- `404`: servico ou item nao encontrado.
- `422`: regra de negocio invalida (quantidade <= 0, item inativo, etc.).
- `500`: erro inesperado.

### 21.4 Importacao XLSX

#### POST `/api/v1/estoque/importacoes`
- `202`: job aceito para processamento assincrono.
- `201`: importacao processada imediatamente (somente modo sincrono).
- `400`: arquivo/payload invalido (layout, tipo, metadados).
- `401`: token ausente/invalido.
- `403`: perfil sem permissao de importacao.
- `409`: conflito (job duplicado/idempotencia detectada).
- `413`: arquivo acima do limite permitido.
- `415`: tipo de arquivo nao suportado.
- `422`: regra de negocio invalida no pre-check.
- `500`: erro inesperado.

#### GET `/api/v1/estoque/importacoes/{jobId}`
- `200`: status/progresso retornado.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: job nao encontrado no tenant.
- `500`: erro inesperado.

#### GET `/api/v1/estoque/importacoes/{jobId}/erros`
- `200`: erros por linha retornados.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: job nao encontrado.
- `500`: erro inesperado.

#### GET `/api/v1/estoque/importacoes/{jobId}/arquivo-resultado`
- `200`: arquivo de resultado gerado.
- `202`: processamento ainda em andamento (arquivo nao disponivel).
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: job/arquivo nao encontrado.
- `500`: erro inesperado.

#### POST `/api/v1/estoque/importacoes/{jobId}/cancelar`
- `200`: cancelamento solicitado/efetivado.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: job nao encontrado.
- `409`: job ja finalizado (nao cancelavel).
- `500`: erro inesperado.

### 21.5 Dashboard

#### GET `/api/v1/estoque/dashboard`
- `200`: indicadores retornados.
- `400`: periodo/filtros invalidos.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao de leitura analitica.
- `500`: erro inesperado.
- `503`: camada analitica indisponivel (MV/refresh comprometido), quando adotado.

### 21.6 Inventario ciclico (fase 3)

#### POST `/api/v1/estoque/inventarios`
- `201`: inventario criado.
- `400`: payload invalido.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `422`: regra de negocio invalida (periodo/scope/conflito com inventario aberto).
- `500`: erro inesperado.

#### POST `/api/v1/estoque/inventarios/{id}/contagens`
- `200`: contagens registradas.
- `400`: payload invalido.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: inventario nao encontrado.
- `409`: inventario fechado/cancelado.
- `422`: regra de negocio invalida.
- `500`: erro inesperado.

#### POST `/api/v1/estoque/inventarios/{id}/fechamento`
- `200`: inventario fechado e ajustes aplicados.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao de fechamento.
- `404`: inventario nao encontrado.
- `409`: inventario ja fechado.
- `422`: regra de negocio invalida (faltam contagens obrigatorias).
- `500`: erro inesperado.

### 21.7 Fornecedores e pedidos (fase 3)

#### GET `/api/v1/estoque/fornecedores`
- `200`: lista retornada.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `500`: erro inesperado.

#### POST `/api/v1/estoque/fornecedores`
- `201`: fornecedor criado.
- `400`: payload invalido.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `409`: conflito de unicidade (documento/codigo).
- `422`: regra de negocio invalida.
- `500`: erro inesperado.

#### GET `/api/v1/estoque/pedidos-compra`
- `200`: lista retornada.
- `400`: filtros invalidos.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `500`: erro inesperado.

#### POST `/api/v1/estoque/pedidos-compra`
- `201`: pedido criado.
- `400`: payload invalido.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: fornecedor/item nao encontrado.
- `422`: regra de negocio invalida.
- `500`: erro inesperado.

#### POST `/api/v1/estoque/pedidos-compra/{id}/recebimento`
- `200`: recebimento realizado (total/parcial).
- `400`: payload invalido.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: pedido nao encontrado.
- `409`: pedido em status nao recebivel.
- `422`: regra de negocio invalida (quantidade superior ao pendente).
- `500`: erro inesperado.

### 21.8 Transferencias (fase 3)

#### POST `/api/v1/estoque/transferencias`
- `201`: transferencia criada.
- `400`: payload invalido.
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: unidade/item nao encontrado.
- `422`: regra de negocio invalida.
- `500`: erro inesperado.

#### POST `/api/v1/estoque/transferencias/{id}/enviar`
- `200`: envio concluido (saida origem).
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: transferencia nao encontrada.
- `409`: status nao permite envio.
- `422`: saldo insuficiente ou validacao de negocio.
- `500`: erro inesperado.

#### POST `/api/v1/estoque/transferencias/{id}/receber`
- `200`: recebimento concluido (entrada destino).
- `401`: token ausente/invalido.
- `403`: perfil sem permissao.
- `404`: transferencia nao encontrada.
- `409`: status nao permite recebimento.
- `422`: regra de negocio invalida.
- `500`: erro inesperado.

### 21.9 Mapeamento de erros de negocio (code)

Sugestao de `code` para padrao de erro:
- `ESTOQUE_ITEM_NAO_ENCONTRADO` -> 404
- `ESTOQUE_SALDO_INSUFICIENTE` -> 409
- `ESTOQUE_SKU_DUPLICADO` -> 409
- `ESTOQUE_AJUSTE_SEM_JUSTIFICATIVA` -> 422
- `ESTOQUE_IMPORTACAO_LAYOUT_INVALIDO` -> 400
- `ESTOQUE_IMPORTACAO_ARQUIVO_GRANDE` -> 413
- `ESTOQUE_IMPORTACAO_TIPO_NAO_SUPORTADO` -> 415
- `ESTOQUE_IMPORTACAO_JOB_CONFLITO` -> 409
- `ESTOQUE_ANALITICO_INDISPONIVEL` -> 503

## 22. Metodo de storage para importacao assincrona (detalhado)

Decisao:
- armazenar arquivo de importacao em **MinIO** (object storage padrao do projeto).
- armazenar no banco **somente metadados do job e referencia do arquivo**.
- nao armazenar binario XLSX em tabela transacional como padrao.

### 22.1 Motivacao da decisao
- reduz crescimento do banco principal.
- melhora tempo de backup/restore.
- reduz custo de I/O no banco.
- facilita escalabilidade horizontal dos workers.
- simplifica politica de retencao e limpeza por TTL.

### 22.2 Componentes
- API de upload (`POST /api/v1/estoque/importacoes`)
- Tabela de jobs (`importacao_estoque_job`)
- Storage bucket/pasta (`estoque-importacoes`)
- Worker assincrono (consumidor de fila/job scheduler)
- Tabela de erros de linha (`importacao_estoque_erro_linha`)
- Rotina de limpeza (TTL)

### 22.3 Estrutura sugerida no storage
Padrao de chave:
`tenant/{tenantId}/estoque/importacoes/{jobId}/arquivo-origem.xlsx`

Arquivos derivados:
- `.../resultado.csv`
- `.../erros.csv` (opcional)
- `.../manifest.json` (hash, tamanho, schema-version, layout-version)

### 22.4 Campos de metadados do job (banco)
Tabela `importacao_estoque_job` (campos relevantes):
- `id` (UUID)
- `tenant_id` (UUID)
- `tipo_importacao` (ITENS, ENTRADAS, AJUSTES)
- `status` (RECEBIDO, EM_VALIDACAO, PROCESSANDO, CONCLUIDO, CONCLUIDO_COM_ERROS, FALHOU, CANCELADO)
- `dry_run` (boolean)
- `arquivo_nome_original` (string)
- `arquivo_storage_key` (string)  -> caminho no storage
- `arquivo_sha256` (string)
- `arquivo_tamanho_bytes` (bigint)
- `mime_type` (string)
- `schema_versao` (string)
- `total_linhas` (int)
- `linhas_processadas` (int)
- `linhas_com_erro` (int)
- `solicitado_por_usuario_id` (UUID)
- `criado_em`, `atualizado_em`, `finalizado_em`
- `expira_em` (timestamp para limpeza)

### 22.5 Fluxo ponta a ponta
1. Cliente envia arquivo via multipart.
2. API valida:
   - autenticacao/autorizacao,
   - tipo de arquivo,
   - tamanho maximo.
3. API calcula SHA-256 do arquivo.
4. API grava arquivo no storage com chave do job.
5. API cria registro de job no banco (`RECEBIDO`), incluindo `arquivo_storage_key`.
6. API enfileira processamento e retorna `202` com `jobId`.
7. Worker consome job:
   - baixa stream do storage,
   - valida layout,
   - processa em lotes (batch),
   - grava erros por linha,
   - atualiza progresso.
8. Worker finaliza:
   - `CONCLUIDO` ou `CONCLUIDO_COM_ERROS` ou `FALHOU`,
   - opcionalmente gera arquivo de resultado.
9. Rotina de limpeza remove arquivo fisico apos `expira_em`.

### 22.6 Politica de retencao e limpeza
Padrao sugerido:
- manter arquivo original por 7 dias (ajustavel por tenant/plano).
- manter erros/resumo no banco por 90 dias (ajustavel).

Regras:
- se job `FALHOU`, manter arquivo por janela de diagnostico (ex.: 14 dias).
- nunca remover antes de `finalizado_em`.
- limpeza deve ser idempotente.

### 22.7 Seguranca do storage
- bucket privado (sem acesso publico).
- URL assinada curta para download de resultado (ex.: 5 minutos).
- criptografia em repouso (server-side encryption).
- TLS em transito.
- segregacao por tenant no path.
- sanitizacao do nome do arquivo original.
- validacao de extensao + MIME + assinatura de arquivo quando aplicavel.

### 22.8 Consistencia e idempotencia
Idempotencia recomendada:
- chave: (`tenant_id`, `tipo_importacao`, `arquivo_sha256`, janela_tempo).
- se mesmo arquivo for enviado novamente em curta janela:
  - retornar job existente (`409` ou `200` com referencia), ou
  - permitir reprocessamento explicito com flag `force=true`.

Consistencia:
- gravar progresso por lote.
- em falha, job permanece auditavel com erro tecnico.
- estoque e financeiro em transacao unica por lote.

### 22.9 Processamento em lotes (batch)
Tamanho sugerido:
- 100 a 500 linhas por lote (iniciar com 200).

Regra:
- commit por lote para evitar transacao gigante.
- erro em uma linha nao invalida todo job (exceto falha estrutural).
- manter contador de sucesso/erro por lote.

### 22.10 Concurrency control
- lock por `jobId` para impedir dupla execucao.
- limite global de workers configuravel.
- limite por tenant para evitar monopolio de recursos.
- cancelamento cooperativo: worker verifica status antes de cada lote.

### 22.11 Recovery e resiliencia
- retry com backoff para falhas temporarias de storage/rede.
- numero maximo de retries configuravel.
- dead-letter para jobs com falha recorrente.
- monitoramento de tempo maximo de execucao (timeout por job).

### 22.12 Observabilidade
Metricas minimas:
- jobs criados por minuto,
- tempo medio de processamento,
- taxa de falha,
- taxa de linhas com erro,
- tamanho medio de arquivo.

Logs estruturados:
- `jobId`, `tenantId`, `tipoImportacao`, `batch`, `status`, `durationMs`, `errorCode`.

Alertas:
- fila acumulada acima do limite,
- job parado sem progresso,
- falhas consecutivas no worker.

### 22.13 Exemplo de contrato de upload (resumo)
Request:
- multipart:
  - `file` (xlsx)
  - `tipoImportacao` (ITENS|ENTRADAS|AJUSTES)
  - `dryRun` (boolean)
  - `executarAssincrono` (boolean)

Response `202`:
```json
{
  "jobId": "uuid-job",
  "status": "RECEBIDO",
  "arquivoSha256": "hash",
  "arquivoStorageKey": "tenant/..../arquivo-origem.xlsx",
  "mensagem": "Importacao recebida e enfileirada para processamento."
}
```

### 22.14 Recomendacoes para Quarkus
- upload streaming para nao carregar arquivo inteiro em memoria.
- cliente de storage desacoplado via adapter (`StorageService`).
- job runner usando scheduler/fila (ex.: Quartz, RabbitMQ, Kafka, SQS).
- transacoes por lote com `@Transactional`.
- feature flag por tenant para habilitar importacao.

### 22.15 Criterios de aceite
- CA-EST-601: arquivo nao e armazenado como BLOB em tabela principal.
- CA-EST-602: job persiste `arquivo_storage_key`, `sha256` e `expira_em`.
- CA-EST-603: limpeza remove arquivo fisico apos TTL sem quebrar rastreabilidade.
- CA-EST-604: download de resultado usa URL assinada e expira.
- CA-EST-605: reprocessamento do mesmo arquivo respeita idempotencia definida.

## 25. Politica operacional de limpeza e processamento (MinIO)

### 25.1 Ferramenta oficial
- Storage oficial para importacao XLSX: **MinIO**.
- Arquivos ficam em disco/volume persistente do MinIO (nao em memoria do app).

### 25.2 Regras de expiracao (TTL)
- Regra base: todo arquivo de importacao possui expiracao.
- Job concluido com sucesso:
  - ao finalizar processamento, definir `expira_em = finalizado_em + 1 hora`.
- Job com falha:
  - definir `expira_em = finalizado_em + 24 horas`.
- Job sem finalizacao (estado intermediario por timeout/queda):
  - manter regra de seguranca de 24 horas para diagnostico.

### 25.3 Agendamento de limpeza
- Job de limpeza executa a cada **20 minutos**.
- Nao pode haver sobreposicao de execucao.
- Controle obrigatorio de concorrencia:
  - lock distribuido (preferencial) ou lock transacional no banco.
  - se lock ja estiver ativo, a nova execucao deve encerrar sem processar.

### 25.4 Limite por execucao
- Cada rodada de limpeza processa no maximo **100 jobs** vencidos.
- Se houver mais de 100, o restante fica para a proxima janela.
- Ordem sugerida: `expira_em asc` (mais antigos primeiro).

### 25.5 Processamento paralelo com seguranca
- Permitido processar jobs em paralelo.
- Concorrencia deve considerar CPU e recursos de banco/rede.
- Regra inicial recomendada:
  - `paralelismo = min(2 * numero_de_cores, limite_configurado)`.
  - valor minimo 2, valor maximo definido por ambiente.
- Deve existir semaphore/rate limit para nao saturar sistema.

### 25.6 Virtual threads
- Recomendado usar **virtual threads** para tarefas I/O-bound (download/upload MinIO, parse e escrita em lotes).
- Concordancia tecnica:
  - sim, virtual threads ajudam escalabilidade sem criar excesso de threads de plataforma.
- Restricoes:
  - manter limite de concorrencia mesmo com virtual threads.
  - respeitar tamanho do pool de conexoes de banco.
  - cada lote continua com transacao curta para evitar contenção.

### 25.7 Criterios de aceite operacionais
- CA-EST-701: arquivos de jobs com sucesso sao removidos em ate 1 hora apos finalizacao.
- CA-EST-702: arquivos de jobs com falha permanecem disponiveis por 24 horas.
- CA-EST-703: scheduler de 20 em 20 minutos nao sobrepoe execucoes.
- CA-EST-704: limpeza respeita limite de 100 jobs por rodada.
- CA-EST-705: processamento paralelo nao degrada endpoints transacionais (SLO mantido).

## 26. MinIO com Docker Compose (referencia)

### 26.1 Compose base (dev/homolog)
```yaml
version: "3.9"

services:
  minio:
    image: minio/minio:RELEASE.2026-02-18T16-25-55Z
    container_name: azzo-minio
    restart: unless-stopped
    ports:
      - "9000:9000"   # API S3
      - "9001:9001"   # Console web
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 20s
      timeout: 5s
      retries: 5

volumes:
  minio_data:
```

### 26.2 Como funciona
- Porta `9000`: endpoint S3 compatível (usado pelo backend Quarkus).
- Porta `9001`: console administrativo web.
- Dados ficam em volume persistente (`/data`), nao apenas em memoria.
- Bucket privado recomendado (ex.: `estoque-importacoes`).

Fluxo no sistema:
1. backend envia arquivo para bucket MinIO.
2. salva `storage_key` no banco.
3. worker baixa por `storage_key` e processa.
4. rotina de limpeza remove do bucket conforme TTL.

### 26.3 Funcionalidades relevantes do MinIO
- API compatível com S3 (facil trocar para AWS S3 no futuro).
- Buckets privados com controle de acesso.
- Versionamento de objetos (opcional).
- Lifecycle/retencao para expirar objetos automaticamente.
- URL assinada para download temporario.
- Criptografia server-side (SSE) quando configurada.

### 26.4 Configuracoes recomendadas para este modulo
- Bucket: `estoque-importacoes`.
- Prefixo por tenant/job:
  - `tenant/{tenantId}/estoque/importacoes/{jobId}/arquivo-origem.xlsx`
- Objeto de resultado:
  - `.../resultado.csv`
- Politica:
  - bucket privado (sem acesso publico).
  - download apenas via URL assinada.

### 26.5 Politica de expiracao no MinIO (lifecycle)
Regras recomendadas:
- objetos de jobs `CONCLUIDO`: expirar em 1 hora (via limpeza ativa do app) ou lifecycle curto equivalente.
- objetos de jobs `FALHOU`: expirar em 24 horas.

Observacao:
- como a expiracao depende do status do job, a estrategia principal deve ser a rotina de limpeza da aplicacao.
- lifecycle do MinIO funciona como camada adicional de seguranca para objetos "orfãos".

### 26.6 Configuracao do backend (Quarkus) para MinIO
```properties
# MinIO endpoint local
quarkus.s3.endpoint-override=http://localhost:9000
quarkus.s3.path-style-access=true
quarkus.s3.aws.region=us-east-1
quarkus.s3.aws.credentials.type=static
quarkus.s3.aws.credentials.static-provider.access-key-id=minioadmin
quarkus.s3.aws.credentials.static-provider.secret-access-key=minioadmin123

# bucket da importacao
app.storage.bucket=estoque-importacoes
```

### 26.7 Operacao e seguranca minima
- trocar credenciais padrao em qualquer ambiente nao-local.
- restringir acesso de rede ao MinIO (somente backend e console admin).
- habilitar HTTPS em ambiente de producao.
- aplicar backup do volume `minio_data`.
- monitorar disponibilidade (`/minio/health/live`) e erro de I/O.

### 26.8 Criterios de aceite
- CA-EST-801: compose sobe MinIO com API e console funcionais.
- CA-EST-802: upload/download por backend funciona com bucket privado.
- CA-EST-803: objeto persiste apos restart do container (volume).
- CA-EST-804: limpeza remove objetos conforme politica de status/TTL.

## 23. Diagrama de sequencia (texto)

### 23.1 Upload e enfileiramento
```text
Usuario/Frontend -> API Estoque: POST /estoque/importacoes (multipart file + metadados)
API Estoque -> Auth/RBAC: validar token e permissao ESTOQUE_IMPORTACAO
Auth/RBAC --> API Estoque: ok
API Estoque -> Validator: validar extensao, mime, tamanho, layout basico
Validator --> API Estoque: ok
API Estoque -> HashService: calcular SHA-256
HashService --> API Estoque: hash
API Estoque -> StorageService: upload arquivo (tenant/{tenantId}/.../{jobId}/arquivo-origem.xlsx)
StorageService --> API Estoque: storageKey
API Estoque -> DB: INSERT importacao_estoque_job(status=RECEBIDO, storageKey, hash, expiraEm)
DB --> API Estoque: jobId
API Estoque -> Queue/Scheduler: enfileirar jobId
Queue/Scheduler --> API Estoque: ack
API Estoque --> Usuario/Frontend: 202 Accepted (jobId, status=RECEBIDO)
```

### 23.2 Processamento assincrono por worker
```text
Worker Importacao -> DB: lock job (status RECEBIDO/EM_VALIDACAO)
DB --> Worker Importacao: lock ok
Worker Importacao -> DB: UPDATE status=EM_VALIDACAO
Worker Importacao -> StorageService: download stream do arquivo
StorageService --> Worker Importacao: stream xlsx
Worker Importacao -> Parser XLSX: leitura streaming por linha
loop batches (ex.: 200 linhas)
  Worker Importacao -> Business Validator: validar regra de negocio por linha
  alt linha valida
    Worker Importacao -> DB (transacao por lote): gravar estoque e financeiro
    DB --> Worker Importacao: commit
  else linha invalida
    Worker Importacao -> DB: gravar importacao_estoque_erro_linha
  end
  Worker Importacao -> DB: atualizar progresso (linhasProcessadas/linhasComErro)
end
alt houve erros em algumas linhas
  Worker Importacao -> DB: UPDATE status=CONCLUIDO_COM_ERROS
else sem erros
  Worker Importacao -> DB: UPDATE status=CONCLUIDO
end
Worker Importacao -> StorageService: upload arquivo de resultado (opcional)
StorageService --> Worker Importacao: resultadoKey
Worker Importacao -> DB: salvar resultadoKey/finalizadoEm
```

### 23.3 Consulta de status e erros
```text
Frontend -> API Estoque: GET /estoque/importacoes/{jobId}
API Estoque -> DB: ler job por tenant
DB --> API Estoque: status/progresso
API Estoque --> Frontend: 200 (status, progresso, resumo)

Frontend -> API Estoque: GET /estoque/importacoes/{jobId}/erros?page=1&limit=50
API Estoque -> DB: ler erros por linha
DB --> API Estoque: lista paginada
API Estoque --> Frontend: 200 (erros)
```

### 23.4 Download de resultado
```text
Frontend -> API Estoque: GET /estoque/importacoes/{jobId}/arquivo-resultado
API Estoque -> DB: validar job finalizado e resultadoKey
DB --> API Estoque: ok
API Estoque -> StorageService: gerar URL assinada (expiracao curta)
StorageService --> API Estoque: signedUrl
API Estoque --> Frontend: 200 (downloadUrl, expiresAt)
```

### 23.5 Limpeza por TTL
```text
Scheduler Limpeza -> DB: buscar jobs finalizados com expiraEm vencido
DB --> Scheduler Limpeza: lista de jobs
loop jobs vencidos
  Scheduler Limpeza -> StorageService: remover arquivo-origem e derivados
  StorageService --> Scheduler Limpeza: ok/nao encontrado
  Scheduler Limpeza -> DB: registrar limpeza e marcar removidoEm
end
Scheduler Limpeza -> Observabilidade: emitir metricas e logs
```

### 23.6 Fluxo de falha e retry
```text
Worker Importacao -> StorageService/DB/Financeiro: operacao falha
Worker Importacao -> RetryPolicy: aplicar backoff exponencial
alt retries esgotados
  Worker Importacao -> DB: status=FALHOU + motivo
  Worker Importacao -> DLQ/Alerta: publicar evento de falha critica
else retry bem-sucedido
  Worker Importacao -> fluxo normal
end
```

## 24. O que fica no navegador vs backend (importacao)

Objetivo:
- evitar ambiguidade sobre armazenamento do arquivo XLSX.

### 24.1 Navegador (frontend)
Pode armazenar:
- `jobId` da importacao.
- filtros de tela (opcional).
- estado de UI (progresso exibido, aba selecionada).

Nao deve armazenar:
- arquivo XLSX no `localStorage`.
- conteudo bruto da planilha persistido no browser.
- dados sensiveis de processamento.

Observacao:
- o arquivo pode existir em memoria apenas durante o envio HTTP (multipart), sem persistencia local.

### 24.2 Backend + Storage
Deve armazenar:
- binario do arquivo XLSX no storage servidor (S3/MinIO/filesystem temporario).
- metadados do job no banco (`jobId`, `storageKey`, hash, status, progresso).
- erros por linha e resumo de processamento.

### 24.3 Fluxo resumido correto
1. Front seleciona arquivo no input.
2. Front envia para `POST /api/v1/estoque/importacoes` (multipart).
3. Backend salva arquivo no storage e cria job.
4. Backend retorna `202` com `jobId`.
5. Front consulta `GET /api/v1/estoque/importacoes/{jobId}` ate finalizar.
6. Front pode baixar resultado por URL assinada.

### 24.4 Boas praticas de frontend
- manter apenas `jobId` em `sessionStorage` (ou `localStorage`) se precisar recuperar tela apos refresh.
- limpar `jobId` local quando job finalizar/cancelar.
- nunca serializar `File` em `localStorage`.
