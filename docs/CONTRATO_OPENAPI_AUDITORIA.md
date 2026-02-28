# Contrato OpenAPI - Modulo de Auditoria

Base path: `/api/v1/auditoria`

## 1. GET `/events`

Descricao: pesquisa paginada de eventos de auditoria.

Query params:
- `from` (ISO-8601, opcional)
- `to` (ISO-8601, opcional)
- `modules` (CSV, opcional)
- `actions` (CSV, opcional)
- `statuses` (CSV, opcional)
- `entityTypes` (CSV, opcional)
- `entityId` (opcional)
- `actorUserIds` (CSV UUID, opcional)
- `requestId` (opcional)
- `sourceChannels` (CSV, opcional)
- `ip` (opcional)
- `hasChanges` (boolean, opcional)
- `text` (opcional)
- `cursor` (base64 `createdAt|id`, opcional)
- `limit` (1..200, opcional; default 50)

Response `200`:
- `items[]`
- `nextCursor`
- `limit`
- `hasNext`
- `aggregations.byModule[]`
- `aggregations.byStatus[]`
- `aggregations.byAction[]`

## 2. GET `/events/{id}`

Descricao: detalhe completo de um evento.

Path params:
- `id` (UUID)

Response `200`:
- Campos da lista + `errorMessage`, `before`, `after`, `metadata`, `eventHash`, `prevEventHash`, `chainValid`.

## 3. POST `/events/export`

Descricao: gera exportacao assinada de consulta de auditoria.

Body:
- Filtros equivalentes ao endpoint de busca
- `format` (`CSV` ou `JSON`)

Response `200`:
- `exportId`
- `format`
- `downloadUrl`
- `expiresAt`
- `checksumSha256`

## 4. GET `/filters/options`

Descricao: retorna opcoes de filtros para frontend.

Query params:
- `from` (opcional)
- `to` (opcional)

Response `200`:
- `modules[]`
- `statuses[]`
- `actions[]`
- `entityTypes[]`

## 5. GET `/retention/events`

Descricao: lista eventos de expurgo por retencao.

Query params:
- `from` (opcional)
- `to` (opcional)
- `executionId` (opcional)

Response `200`:
- lista de `audit_retention_events`

## 6. Seguranca

- Endpoints protegidos por `@RolesAllowed({"OWNER","FINANCE"})`.
- Tenant sempre restringido pelo backend.
- Leitura e exportacao de auditoria geram novo evento auditavel.

## 7. Documentos Legais Publicos (Termos e Privacidade)

Base path: `/api/v1/public/legal`

DTOs:
- `LegalDocumentResponse`
  - `documentType: string`
  - `version: string`
  - `title: string`
  - `content: string`
  - `contentHash: string`
  - `createdAt: string (ISO-8601)`
- `PublicLegalResponse`
  - `termsOfUse: LegalDocumentResponse | null`
  - `privacyPolicy: LegalDocumentResponse | null`

### 7.1 GET `/api/v1/public/legal`
- Retorna os 2 documentos ativos para exibir na tela de cadastro:
  - `termsOfUse`
  - `privacyPolicy`
- Response: `PublicLegalResponse`

### 7.2 GET `/api/v1/public/legal/terms-of-use`
- Retorna apenas a versao ativa de Termos de Uso.
- Response: `LegalDocumentResponse`

### 7.3 GET `/api/v1/public/legal/privacy-policy`
- Retorna apenas a versao ativa de Politica de Privacidade.
- Response: `LegalDocumentResponse`

Regras:
- Se o documento nao estiver publicado, endpoint especifico retorna `404`.
- Se houver versoes desativadas, busca considera a ultima versao ativa.
