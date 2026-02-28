# Handoff Frontend -> Backend (Estoque)

Objetivo: consolidar o contrato que o frontend ja implementou para o modulo de estoque, facilitando a entrega do backend sem retrabalho.

## 1. Endpoints consumidos pelo frontend

### 1.1 Itens
- `GET /api/v1/estoque/itens?page={n}&limit={n}&search={termo}&ativo={true|false}&abaixoMinimo={true|false}`
  - Resposta aceita pelo front:
    - Lista simples: `StockItem[]`
    - Ou paginada: `{ items: StockItem[], total, page, pageSize, hasMore }`
- `GET /api/v1/estoque/itens/{id}`
- `POST /api/v1/estoque/itens`
- `PUT /api/v1/estoque/itens/{id}`

### 1.2 Movimentacoes
- `GET /api/v1/estoque/movimentacoes?page={n}&limit={n}&itemId={id}&tipo={ENTRADA|SAIDA|AJUSTE}`
  - Resposta aceita pelo front:
    - Lista simples: `StockMovement[]`
    - Ou paginada: `{ items: StockMovement[], total, page, pageSize, hasMore }`
- `POST /api/v1/estoque/movimentacoes`

### 1.3 Dashboard
- `GET /api/v1/estoque/dashboard?inicio=YYYY-MM-DD&fim=YYYY-MM-DD&serviceId={id}&itemId={id}`
  - Resposta: `StockDashboardResponse`

### 1.4 Importacoes
- `GET /api/v1/estoque/importacoes`
  - Resposta: `StockImportJob[]`
- `GET /api/v1/estoque/importacoes/modelo?tipoImportacao={ITENS|ENTRADAS|AJUSTES}&formato={xlsx|csv}`
  - Resposta: arquivo binario
  - Header esperado: `Content-Disposition: attachment`
- `POST /api/v1/estoque/importacoes?tipoImportacao={ITENS|ENTRADAS|AJUSTES}&dryRun={true|false}`
  - `multipart/form-data` com campo `arquivo`
  - Resposta: `StockImportJob`
- `GET /api/v1/estoque/importacoes/{jobId}`
  - Resposta: `StockImportJob`
- `GET /api/v1/estoque/importacoes/{jobId}/erros`
  - Resposta: `StockImportErrorLine[]`
- `GET /api/v1/estoque/importacoes/{jobId}/arquivo-resultado`
  - Resposta: `{ downloadUrl: string, expiresAt: string }`
- `POST /api/v1/estoque/importacoes/{jobId}/cancelar`
  - Resposta: `StockImportJob`

## 2. DTOs esperados pelo frontend

Referencias:
- `src/types/stock.ts`
- `docs/CONTRATO_OPENAPI_ESTOQUE.md`

Campos principais (resumo):
- `StockItem`:
  - `id`, `nome`, `sku`, `unidadeMedida`, `saldoAtual`, `estoqueMinimo`, `custoMedioUnitario`, `ativo`, `createdAt`, `updatedAt`
- `StockMovement`:
  - `id`, `itemEstoqueId`, `tipo`, `quantidade`, `saldoAnterior`, `saldoPosterior`, `motivo`, `origem`, `valorUnitarioPago`, `valorTotalMovimentacao`, `gerarLancamentoFinanceiro`, `transacaoFinanceiraId`, `usuarioId`, `createdAt`
- `StockDashboardResponse`:
  - `atualizadoEm`, `itensAbaixoMinimo`, `itensZerados`, `valorEstoqueCustoMedio`, `rupturaTaxa`, `perdasValor`, `margemServicos[]`
- `StockImportJob`:
  - `jobId`, `tipoImportacao`, `status`, `dryRun`, `totalLinhas`, `linhasProcessadas`, `linhasComErro`, `arquivoSha256`, `arquivoStorageKey`, `createdAt`, `updatedAt`, `finishedAt`
- `StockImportErrorLine`:
  - `linha`, `coluna`, `codigoErro`, `mensagem`, `valorRecebido`

## 3. Comportamentos de UI que dependem do backend

- Paginacao:
  - Front suporta resposta paginada ou lista simples.
  - Para performance real, backend deve devolver formato paginado com `items + total`.
- Defasagem analitica:
  - Badge usa `atualizadoEm` do dashboard.
  - Se sem esse campo, aparece estado fallback.
- Importacao:
  - A tela faz polling automatico (10s) para jobs em status:
    - `RECEBIDO`, `EM_VALIDACAO`, `PROCESSANDO`
  - Botao cancelar so faz sentido nesses status.

## 4. Padrao de erro esperado

Frontend usa `resolveUiError` e suporta:
- erro padrao:
  - `{ code, message, details, path, timestamp }`
- validacao:
  - `{ title, status, violations: [{ field, message }] }`

Recomendacao:
- manter `code` estavel por regra de negocio.
- manter `message` amigavel para exibir em toast.

## 5. Status codes recomendados por fluxo

- `200`: consultas e updates bem sucedidos
- `201`: criacao de item/movimentacao/job
- `204`: delete sem corpo (quando houver)
- `400`: payload invalido
- `401`: nao autenticado
- `403`: sem permissao (RBAC)
- `404`: item/job nao encontrado
- `409`: conflito de negocio (ex.: saldo insuficiente, job ja finalizado)
- `422`: validacao semantica (opcional, se adotado no backend)
- `500`: erro inesperado

## 6. Proximos passos backend (ordem sugerida)

1. Entidades e migracoes (`itens_estoque`, `movimentacoes_estoque`, importacao job/erros).
2. Endpoints de itens e movimentacoes.
3. Endpoint de dashboard (com `atualizadoEm`).
4. Pipeline assincrono de importacao + polling de status.
5. Tratamento padrao de erro + RBAC.
