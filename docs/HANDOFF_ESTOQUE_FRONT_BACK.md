# Handoff Frontend -> Backend (Estoque)

Objetivo: consolidar o contrato que o frontend ja implementou para o modulo de estoque, facilitando a entrega do backend sem retrabalho.

## 1. Endpoints consumidos pelo frontend

### 1.1 Itens
- `GET /api/v1/estoque/itens?page={n}&limit={n}&search={termo}&ativo={true|false}&abaixoMinimo={true|false}`
  - Cursor opcional (keyset): `cursorCreatedAt={ISO-8601}&cursorId={uuid}`
  - Resposta aceita pelo front:
    - Lista simples: `StockItem[]`
    - Ou paginada: `{ items: StockItem[], total, page, pageSize, hasMore }`
- `GET /api/v1/estoque/itens/{id}`
- `POST /api/v1/estoque/itens`
- `PUT /api/v1/estoque/itens/{id}`

### 1.2 Movimentacoes
- `GET /api/v1/estoque/movimentacoes?page={n}&limit={n}&itemId={id}&tipo={ENTRADA|SAIDA|AJUSTE}`
  - Cursor opcional (keyset): `cursorCreatedAt={ISO-8601}&cursorId={uuid}`
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

### 1.5 Inventarios
- `GET /api/v1/estoque/inventarios?page={n}&limit={n}&cursorCreatedAt={ISO-8601}&cursorId={uuid}`
  - Resposta: `StockInventory[]`
- `POST /api/v1/estoque/inventarios`
  - Resposta: `StockInventory`
- `GET /api/v1/estoque/inventarios/{id}`
  - Resposta: `StockInventory`
- `POST /api/v1/estoque/inventarios/{id}/contagens`
  - Resposta: `StockInventory`
- `POST /api/v1/estoque/inventarios/{id}/fechamento`
  - Resposta: `StockInventory`

### 1.6 Fornecedores
- `GET /api/v1/estoque/fornecedores?page={n}&limit={n}&cursorCreatedAt={ISO-8601}&cursorId={uuid}`
  - Resposta: `StockSupplier[]`
- `POST /api/v1/estoque/fornecedores`
  - Resposta: `StockSupplier`
- `PUT /api/v1/estoque/fornecedores/{id}`
  - Resposta: `StockSupplier`

### 1.7 Pedidos de compra
- `GET /api/v1/estoque/pedidos-compra?page={n}&limit={n}&cursorCreatedAt={ISO-8601}&cursorId={uuid}`
  - Resposta: `StockPurchaseOrder[]`
- `POST /api/v1/estoque/pedidos-compra`
  - Resposta: `StockPurchaseOrder`
- `GET /api/v1/estoque/pedidos-compra/{id}`
  - Resposta: `StockPurchaseOrder`
- `POST /api/v1/estoque/pedidos-compra/{id}/recebimento`
  - Resposta: `StockPurchaseOrder`

### 1.8 Transferencias
- `GET /api/v1/estoque/transferencias?page={n}&limit={n}&cursorCreatedAt={ISO-8601}&cursorId={uuid}`
  - Resposta: `StockTransfer[]`
- `POST /api/v1/estoque/transferencias`
  - Resposta: `StockTransfer`
- `POST /api/v1/estoque/transferencias/{id}/enviar`
  - Resposta: `StockTransfer`
- `POST /api/v1/estoque/transferencias/{id}/receber`
  - Resposta: `StockTransfer`

### 1.9 Configuracoes de estoque
- `GET /api/v1/estoque/configuracoes`
  - Resposta: `StockSettings`
- `PUT /api/v1/estoque/configuracoes`
  - Resposta: `StockSettings`

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
- `StockInventory`:
  - `id`, `nome`, `status`, `observacao`, `dataAbertura`, `dataFechamento`, `createdAt`, `updatedAt`
- `StockSupplier`:
  - `id`, `nome`, `documento`, `email`, `telefone`, `contato`, `ativo`, `createdAt`, `updatedAt`
- `StockPurchaseOrder`:
  - `id`, `fornecedorId`, `fornecedorNome`, `status`, `valorTotal`, `quantidadeItens`, `quantidadePendente`, `observacao`, `createdAt`, `updatedAt`
- `StockTransfer`:
  - `id`, `origem`, `destino`, `status`, `itemEstoqueId`, `itemNome`, `quantidade`, `observacao`, `createdAt`, `updatedAt`
- `StockSettings`:
  - `alertaEstoqueMinimoAtivo`, `bloquearSaidaSemSaldo`, `permitirAjusteNegativoComPermissao`, `diasCoberturaMeta`, `updatedAt`

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

1. Consolidar endpoints da fase 3: inventarios, fornecedores, pedidos, transferencias e configuracoes.
2. Fechar validacoes de negocio (status transitions, recebimento parcial, bloqueios de saldo).
3. Garantir paginacao padrao para listas maiores (inventarios, fornecedores, pedidos, transferencias).
4. Unificar codigos de erro de negocio da fase 3 no mesmo padrao do modulo.
5. Homologacao fim a fim com evidencias de rede para a matriz RF.
