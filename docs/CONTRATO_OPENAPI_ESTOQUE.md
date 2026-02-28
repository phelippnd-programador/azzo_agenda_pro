# CONTRATO OPENAPI - MODULO ESTOQUE

Projeto: Azzo Agenda Pro  
Versao API: `v1`  
Data: 2026-02-28  
Base path: `/api/v1`

## 1. Convencoes gerais
- Autenticacao: `Authorization: Bearer <token>`
- Multi-tenant: escopo por tenant vindo do token/sessao.
- Erro padrao:
```json
{
  "code": "STRING",
  "message": "STRING",
  "details": null,
  "path": "/api/v1/...",
  "timestamp": "2026-02-28T21:15:01.667Z"
}
```

## 2. Schemas principais

### 2.1 ItemEstoqueResponse
```json
{
  "id": "uuid",
  "nome": "Shampoo Profissional",
  "sku": "SHAMP-001",
  "unidadeMedida": "ML",
  "saldoAtual": 860.0,
  "estoqueMinimo": 500.0,
  "custoMedioUnitario": 0.45,
  "ativo": true,
  "createdAt": "2026-02-28T10:00:00Z",
  "updatedAt": "2026-02-28T10:00:00Z"
}
```

### 2.2 CriarItemEstoqueRequest
```json
{
  "nome": "Shampoo Profissional",
  "sku": "SHAMP-001",
  "unidadeMedida": "ML",
  "estoqueMinimo": 500.0,
  "ativo": true
}
```

### 2.3 CriarMovimentacaoEstoqueRequest
```json
{
  "itemEstoqueId": "uuid-item",
  "tipo": "ENTRADA",
  "quantidade": 1000.0,
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

### 2.4 MovimentacaoEstoqueResponse
```json
{
  "id": "uuid",
  "itemEstoqueId": "uuid-item",
  "tipo": "ENTRADA",
  "quantidade": 1000.0,
  "saldoAnterior": 200.0,
  "saldoPosterior": 1200.0,
  "motivo": "Reposicao mensal",
  "origem": "MANUAL",
  "valorUnitarioPago": 0.45,
  "valorTotalMovimentacao": 450.0,
  "gerarLancamentoFinanceiro": true,
  "transacaoFinanceiraId": "uuid-transacao",
  "usuarioId": "uuid-user",
  "createdAt": "2026-02-28T12:00:00Z"
}
```

### 2.5 ImportacaoJobResponse
```json
{
  "jobId": "uuid-job",
  "tipoImportacao": "ENTRADAS",
  "status": "RECEBIDO",
  "dryRun": false,
  "totalLinhas": 0,
  "linhasProcessadas": 0,
  "linhasComErro": 0,
  "arquivoSha256": "hash",
  "arquivoStorageKey": "tenant/uuid/estoque/importacoes/uuid-job/arquivo-origem.xlsx",
  "createdAt": "2026-02-28T12:00:00Z",
  "updatedAt": "2026-02-28T12:00:00Z",
  "finishedAt": null
}
```

### 2.6 ErroImportacaoLinhaResponse
```json
{
  "linha": 27,
  "coluna": "valorUnitarioPago",
  "codigoErro": "ESTOQUE_VALOR_INVALIDO",
  "mensagem": "Valor unitario deve ser maior que zero",
  "valorRecebido": "-12.5"
}
```

## 3. Endpoints

### 3.1 Itens

#### GET `/estoque/itens`
Descricao:
- lista itens de estoque (paginado).

Query:
- `page`, `limit`, `search`, `ativo`, `abaixoMinimo`.

Responses:
- `200` lista retornada.
- `400` query invalida.
- `401` nao autenticado.
- `403` sem permissao.
- `500` erro interno.

#### GET `/estoque/itens/{id}`
Responses:
- `200`, `401`, `403`, `404`, `500`.

#### POST `/estoque/itens`
Body: `CriarItemEstoqueRequest`
Responses:
- `201`, `400`, `401`, `403`, `409`, `422`, `500`.

#### PUT `/estoque/itens/{id}`
Body: `AtualizarItemEstoqueRequest`
Responses:
- `200`, `400`, `401`, `403`, `404`, `409`, `422`, `500`.

#### PATCH `/estoque/itens/{id}/status`
Body:
```json
{ "ativo": false }
```
Responses:
- `200`, `400`, `401`, `403`, `404`, `422`, `500`.

### 3.2 Movimentacoes

#### GET `/estoque/movimentacoes`
Query:
- `page`, `limit`, `itemId`, `tipo`, `origem`, `inicio`, `fim`.

Responses:
- `200`, `400`, `401`, `403`, `500`.

#### POST `/estoque/movimentacoes`
Body: `CriarMovimentacaoEstoqueRequest`
Responses:
- `201`, `400`, `401`, `403`, `404`, `409`, `422`, `500`.

### 3.3 Ficha tecnica por servico (fase 2)

#### GET `/servicos/{id}/insumos`
Responses:
- `200`, `401`, `403`, `404`, `500`.

#### PUT `/servicos/{id}/insumos`
Body:
```json
{
  "insumos": [
    { "itemEstoqueId": "uuid", "quantidadeConsumo": 30.0 }
  ]
}
```
Responses:
- `200`, `400`, `401`, `403`, `404`, `422`, `500`.

### 3.4 Importacao XLSX

#### POST `/estoque/importacoes`
Content-Type:
- `multipart/form-data`

Partes:
- `file` (xlsx)
- `tipoImportacao` (`ITENS|ENTRADAS|AJUSTES`)
- `dryRun` (boolean)
- `executarAssincrono` (boolean)

Responses:
- `202` job enfileirado.
- `201` processado sincrono (apenas cenarios pequenos).
- `400`, `401`, `403`, `409`, `413`, `415`, `422`, `500`.

#### GET `/estoque/importacoes/modelo`
Descricao:
- baixa arquivo de modelo padrao para importacao.

Query:
- `tipoImportacao` (`ITENS|ENTRADAS|AJUSTES`) - obrigatorio.
- `formato` (`xlsx|csv`) - opcional, default `xlsx`.

Responses:
- `200` arquivo retornado com `Content-Disposition: attachment`.
- `400` query invalida.
- `401` nao autenticado.
- `403` sem permissao.
- `404` tipo/formato de modelo nao disponivel.
- `500` erro interno.

#### GET `/estoque/importacoes/{jobId}`
Responses:
- `200`, `401`, `403`, `404`, `500`.

#### GET `/estoque/importacoes/{jobId}/erros`
Responses:
- `200`, `401`, `403`, `404`, `500`.

#### GET `/estoque/importacoes/{jobId}/arquivo-resultado`
Responses:
- `200` download disponivel.
- `202` ainda processando.
- `401`, `403`, `404`, `500`.

#### POST `/estoque/importacoes/{jobId}/cancelar`
Responses:
- `200`, `401`, `403`, `404`, `409`, `500`.

### 3.5 Dashboard

#### GET `/estoque/dashboard`
Query:
- `inicio`, `fim`, `serviceId`, `itemId`.

Responses:
- `200`, `400`, `401`, `403`, `500`, `503`.

### 3.6 Inventarios

#### GET `/estoque/inventarios`
Responses:
- `200`, `401`, `403`, `500`.

#### POST `/estoque/inventarios`
Body: `{ "nome": "Inventario mensal", "observacao": "opcional" }`
Responses:
- `201`, `400`, `401`, `403`, `422`, `500`.

#### GET `/estoque/inventarios/{id}`
Responses:
- `200`, `401`, `403`, `404`, `500`.

#### POST `/estoque/inventarios/{id}/contagens`
Body: `{ "itemEstoqueId": "uuid", "quantidadeContada": 120.0, "observacao": "opcional" }`
Responses:
- `200`, `400`, `401`, `403`, `404`, `422`, `500`.

#### POST `/estoque/inventarios/{id}/fechamento`
Responses:
- `200`, `401`, `403`, `404`, `409`, `500`.

### 3.7 Fornecedores

#### GET `/estoque/fornecedores`
Responses:
- `200`, `401`, `403`, `500`.

#### POST `/estoque/fornecedores`
Responses:
- `201`, `400`, `401`, `403`, `422`, `500`.

#### PUT `/estoque/fornecedores/{id}`
Responses:
- `200`, `400`, `401`, `403`, `404`, `422`, `500`.

### 3.8 Pedidos de compra

#### GET `/estoque/pedidos-compra`
Responses:
- `200`, `401`, `403`, `500`.

#### POST `/estoque/pedidos-compra`
Responses:
- `201`, `400`, `401`, `403`, `404`, `422`, `500`.

#### GET `/estoque/pedidos-compra/{id}`
Responses:
- `200`, `401`, `403`, `404`, `500`.

#### POST `/estoque/pedidos-compra/{id}/recebimento`
Responses:
- `200`, `400`, `401`, `403`, `404`, `409`, `422`, `500`.

### 3.9 Transferencias

#### GET `/estoque/transferencias`
Responses:
- `200`, `401`, `403`, `500`.

#### POST `/estoque/transferencias`
Responses:
- `201`, `400`, `401`, `403`, `404`, `422`, `500`.

#### POST `/estoque/transferencias/{id}/enviar`
Responses:
- `200`, `401`, `403`, `404`, `409`, `500`.

#### POST `/estoque/transferencias/{id}/receber`
Responses:
- `200`, `401`, `403`, `404`, `409`, `500`.

### 3.10 Configuracoes de estoque

#### GET `/estoque/configuracoes`
Responses:
- `200`, `401`, `403`, `500`.

#### PUT `/estoque/configuracoes`
Responses:
- `200`, `400`, `401`, `403`, `422`, `500`.

## 4. Codigos de erro de negocio (padrao)
- `ESTOQUE_ITEM_NAO_ENCONTRADO`
- `ESTOQUE_SALDO_INSUFICIENTE`
- `ESTOQUE_SKU_DUPLICADO`
- `ESTOQUE_AJUSTE_SEM_JUSTIFICATIVA`
- `ESTOQUE_IMPORTACAO_LAYOUT_INVALIDO`
- `ESTOQUE_IMPORTACAO_ARQUIVO_GRANDE`
- `ESTOQUE_IMPORTACAO_TIPO_NAO_SUPORTADO`
- `ESTOQUE_IMPORTACAO_JOB_CONFLITO`
- `ESTOQUE_ANALITICO_INDISPONIVEL`
- `ESTOQUE_INVENTARIO_NAO_ENCONTRADO`
- `ESTOQUE_FORNECEDOR_NAO_ENCONTRADO`
- `ESTOQUE_PEDIDO_NAO_ENCONTRADO`
- `ESTOQUE_RECEBIMENTO_INVALIDO`
- `ESTOQUE_RECEBIMENTO_EXCEDENTE`
- `ESTOQUE_TRANSFERENCIA_NAO_ENCONTRADA`
- `ESTOQUE_TRANSFERENCIA_CONFLITO`

## 5. Regras transversais
- Operacoes de estoque e financeiro (quando vinculadas) devem ser transacionais por lote.
- Importacao assincrona deve retornar `jobId` e permitir acompanhamento por status.
- Upload de arquivo deve persistir no MinIO; banco guarda apenas metadados.
- Antes da validacao da linha, backend deve normalizar campos textuais com `java.text.Normalizer` (NFKC).
- Remocao de arquivo segue politica:
  - sucesso: 1h
  - falha: 24h

## 6. Versionamento do contrato
- Alteracoes breaking devem subir versao de API.
- Alteracoes non-breaking devem atualizar este documento com data e changelog.
