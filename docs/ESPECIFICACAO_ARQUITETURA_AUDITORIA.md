# Especificacao de Arquitetura - Sistema de Auditoria

Data: 2026-02-27  
Status: Proposta tecnica para implementacao

## 1. Objetivo
Construir uma trilha de auditoria confiavel, imutavel e rastreavel para sustentar analise de incidentes e defesa operacional/comercial com clientes, com foco em:
- Provar quem fez o que, quando, em qual tenant e com qual resultado.
- Demonstrar alteracoes de dados sensiveis com contexto suficiente.
- Correlacionar eventos de negocio com logs tecnicos e integracoes externas.

## 2. Requisitos arquiteturais obrigatorios
- Multi-tenant estrito: todo evento deve ter `tenant_id`.
- Imutabilidade: evento de auditoria nao pode ser alterado ou apagado por fluxo normal.
- Integridade: cada evento deve ter hash e encadeamento opcional para detectar adulteracao.
- Rastreabilidade ponta a ponta: correlacao via `request_id`, `actor_user_id`, `origin`.
- Baixo impacto operacional: escrita rapida, leitura indexada por filtros frequentes.
- Privacidade/LGPD: minimizacao de dados, mascaramento e retencao definida.

## 3. Escopo minimo (MVP robusto)
- Modulos obrigatorios na fase inicial:
  - Fiscal (config, emissao, autorizacao, cancelamento, apuracao).
  - RBAC (alteracao de permissao, override por tenant).
  - Financeiro (criacao/alteracao/exclusao de transacao relevante).
  - Autenticacao (login, refresh, logout, falhas de login).
- Tipos de evento:
  - Operacao de negocio.
  - Operacao de seguranca.
  - Integracao externa.

## 4. Modelo de dados proposto
Tabela: `audit_events`

Campos principais:
- `id UUID PK`
- `tenant_id UUID NOT NULL`
- `actor_user_id UUID NULL` (acoes sistemicas podem ser `NULL`)
- `actor_role VARCHAR(50) NULL`
- `module VARCHAR(50) NOT NULL` (FISCAL, RBAC, FINANCE, AUTH, SYSTEM)
- `action VARCHAR(120) NOT NULL` (ex.: `FISCAL_INVOICE_AUTHORIZE`)
- `entity_type VARCHAR(80) NULL` (ex.: `INVOICE`, `ROLE_PERMISSION`)
- `entity_id VARCHAR(120) NULL`
- `status VARCHAR(20) NOT NULL` (`SUCCESS`, `ERROR`, `DENIED`)
- `error_code VARCHAR(80) NULL`
- `error_message VARCHAR(500) NULL`
- `request_id VARCHAR(100) NOT NULL`
- `idempotency_key VARCHAR(200) NULL`
- `source_channel VARCHAR(30) NOT NULL` (`API`, `WEBHOOK`, `SCHEDULER`, `SYSTEM`)
- `ip_address VARCHAR(64) NULL`
- `user_agent VARCHAR(300) NULL`
- `before_json TEXT NULL` (snapshot anterior, minimizado)
- `after_json TEXT NULL` (snapshot posterior, minimizado)
- `metadata_json TEXT NULL` (contexto adicional: endpoint, metodo, provider, etc.)
- `event_hash VARCHAR(128) NOT NULL`
- `prev_event_hash VARCHAR(128) NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

Indices recomendados:
- `(tenant_id, created_at DESC)`
- `(tenant_id, module, created_at DESC)`
- `(tenant_id, entity_type, entity_id, created_at DESC)`
- `(request_id)`
- `(status, created_at DESC)`

Restricoes:
- Sem `UPDATE`/`DELETE` via aplicacao.
- Insercao somente append.
- `event_hash` obrigatorio.

Implementacao recomendada no PostgreSQL (append-only):
1. Revogar `UPDATE` e `DELETE` do usuario da aplicacao na tabela `audit_events`.
2. Criar trigger `BEFORE UPDATE OR DELETE` para bloquear mutacao.

Exemplo SQL:
```sql
REVOKE UPDATE, DELETE ON audit_events FROM app_user;

CREATE OR REPLACE FUNCTION deny_audit_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deny_audit_mutation
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION deny_audit_mutation();
```

## 5. Integridade e valor probatorio
Para elevar confianca da trilha:
1. Canonicalizar payload antes do hash (ordem estavel de chaves JSON).
2. `event_hash = SHA-256(tenant_id + action + entity_id + status + created_at + payload_canonical + prev_event_hash)`.
3. `prev_event_hash` referencia ultimo evento do tenant (cadeia por tenant).
4. Job diario gera `checkpoint hash` assinado e armazenado fora do banco (ex.: objeto imutavel/versionado).

Resultado:
- Fica possivel provar sequencia temporal e detectar adulteracao de eventos.

## 6. Contrato de evento (padrao interno)
Classe/DTO sugerido: `AuditEventCommand`
- `tenantId`
- `actorUserId`
- `actorRole`
- `module`
- `action`
- `entityType`
- `entityId`
- `status`
- `errorCode`
- `errorMessage`
- `requestId`
- `sourceChannel`
- `ipAddress`
- `userAgent`
- `before`
- `after`
- `metadata`

Servico: `AuditService`
- `recordSuccess(...)`
- `recordError(...)`
- `recordDenied(...)`

## 7. Ponto de captura na arquitetura atual
- Camada `application.service`: registrar eventos de negocio apos operacoes criticas.
- `ApiExceptionMapper`: registrar falhas/denegacoes com `request_id`.
- Integracoes externas (`RealFiscalProvider`, `AsaasService`): registrar auditoria de resultado consolidado alem de `integration_logs`.
- RBAC services: registrar before/after de alteracao de permissoes.

## 8. Politica de mascaramento e minimizacao
Nunca salvar em claro:
- Senhas, tokens, segredos, dados de cartao, CVV.
- Documentos pessoais completos sem necessidade operacional.

Regras:
- CPF/CNPJ: mascarar parcialmente (`***.***.***-**`).
- Email: mascarar usuario parcial.
- Telefone: mascarar miolo.
- Campos sensiveis sempre em allowlist do que pode ser persistido.

### 8.1 Decisao sobre IP em auditoria
Decisao atual:
- Nao criptografar IP na base de auditoria.

Controles compensatorios obrigatorios:
- Base legal formalizada para coleta de IP (seguranca/auditoria e obrigacao legal quando aplicavel).
- Acesso restrito por perfil (principio do menor privilegio).
- Registro de leitura/exportacao de eventos que contenham IP.
- Retencao limitada e expurgo conforme politica aprovada.
- Proibicao de uso do IP para finalidades nao relacionadas a seguranca/auditoria.

Observacao:
- Mesmo sem criptografia, IP deve ser tratado como dado pessoal no contexto LGPD.

## 9. Controle de acesso e consulta
- Endpoint administrativo dedicado: `/api/v1/auditoria/events`.
- Permissoes:
  - `OWNER`: leitura completa do proprio tenant.
  - `FINANCE`: leitura restrita a modulos financeiros/fiscais.
  - demais perfis: sem acesso por padrao.
- Filtros:
  - periodo, modulo, acao, status, usuario, entidade, request_id.
- Exportacao:
  - CSV/JSON assinado com hash do arquivo.

## 10. Retencao, LGPD e compliance
- Retencao padrao: 24 meses (ajustavel por politica legal).
- Expurgo controlado por job com trilha do expurgo (metadado, sem apagar prova fora da politica).
- Backup e restore testados mensalmente.
- Acesso aos eventos auditado (auditar leitura de auditoria para cadeia completa).

### 10.1 Evento formal de remocao por retencao (obrigatorio)
Sim, e recomendado registrar um evento tecnico de expurgo para manter prova de compliance.

Acao sugerida:
- `AUDIT_RETENTION_PURGE`

Tabela sugerida (append-only):
- `audit_retention_events`
  - `id UUID PK`
  - `tenant_id UUID NULL` (pode ser global por lote)
  - `policy_version VARCHAR(40) NOT NULL`
  - `retention_period_days INT NOT NULL`
  - `window_start TIMESTAMPTZ NOT NULL`
  - `window_end TIMESTAMPTZ NOT NULL`
  - `affected_rows BIGINT NOT NULL`
  - `executed_by VARCHAR(80) NOT NULL` (`SYSTEM` ou usuario tecnico)
  - `execution_id VARCHAR(100) NOT NULL` (correlacao de job)
  - `evidence_hash VARCHAR(128) NOT NULL` (hash do relatorio do expurgo)
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

Fluxo recomendado:
1. Job de retencao identifica eventos expirados.
2. Gera relatorio resumido do lote (sem dados sensiveis em claro).
3. Calcula `evidence_hash` do relatorio.
4. Persiste `audit_retention_events` (prova da remocao).
5. Executa expurgo fisico conforme politica legal.

Observacao:
- O evento de remocao nao substitui a auditoria original; ele registra a prova de que o expurgo foi feito conforme politica aprovada.

## 11. Observabilidade operacional
Metricas:
- `audit.events.total` por `module`, `action`, `status`.
- `audit.write.latency`.
- `audit.write.errors`.

Alertas:
- aumento anormal de `DENIED`/`ERROR`.
- falha na escrita de auditoria.
- quebra no encadeamento de hash por tenant.

## 12. Resiliencia
- Estrategia de escrita:
  - sincrona para eventos criticos (RBAC, fiscal, financeiro sensivel).
  - opcional assíncrona para eventos de menor criticidade.
- Fallback:
  - em falha de persistencia, log tecnico de emergencia com `request_id`.
  - alarme imediato para operacao.

## 13. Riscos e mitigacoes
- Risco: volume alto e crescimento da tabela.
  - Mitigacao: particionamento mensal por `created_at` e indices enxutos.
- Risco: payload excessivo.
  - Mitigacao: limite de tamanho + truncamento controlado + allowlist.
- Risco: uso indevido da auditoria (vazamento de dados).
  - Mitigacao: mascaramento, RBAC estrito, auditoria de leitura.

## 14. Roadmap de implementacao recomendado
Fase 1 (base):
1. Migration `audit_events`.
2. Entidade + repositorio + `AuditService`.
3. Captura em Fiscal + RBAC.
4. Endpoint de consulta basica.

Fase 2 (expansao):
1. Captura em Financeiro + Auth.
2. Hash chain por tenant.
3. Exportacao de eventos.

Fase 3 (fortalecimento):
1. Checkpoint assinado externo.
2. Particionamento e tuning de performance.
3. Alertas operacionais e dashboard de auditoria.

## 15. Critérios de aceite
- 100% das operacoes criticas do escopo MVP com evento de auditoria.
- Nenhum evento sem `tenant_id`, `action`, `status`, `request_id`.
- Cobertura de testes:
  - unitarios: serializacao, mascaramento, hash.
  - integracao: persistencia/consulta/filtros.
- Evidencia de consulta por `request_id` fechando rastreabilidade de ponta a ponta.

## 16. Decisao de arquitetura (recomendacao)
Implementar auditoria como modulo interno dedicado (nao espalhar logica em controllers), com:
- `AuditService` central.
- contrato padronizado de eventos.
- persistencia append-only.
- hash chain por tenant desde a fase 2.

Isso atende robustez tecnica e reduz fragilidade em disputas com cliente.

## 17. Linha juridica minima (contrato e termos)
Para sustentar juridicamente a trilha de auditoria e uso de dados, recomenda-se formalizar:

1. Contrato principal (cliente x empresa)
- Clausulas de tratamento de dados, seguranca e logs.
- Finalidade da auditoria e limites de uso.
- Retencao, descarte e cooperacao em incidentes.
- Responsabilidades de cada parte (controlador/operador, conforme arranjo).

2. Termos de Uso
- Regras de uso do sistema.
- Responsabilidade por credenciais e acessos.
- Previsao de monitoramento e registro de eventos para seguranca/fraude.

3. Politica de Privacidade
- Quais dados sao coletados (incluindo IP para auditoria).
- Finalidades e bases legais.
- Prazo de retencao e direitos do titular.
- Canal de atendimento para direitos LGPD.

4. Politica de Retencao e Expurgo
- Prazo por tipo de evento.
- Procedimento de remocao e trilha do expurgo (`AUDIT_RETENTION_PURGE`).
- Excecoes legais/regulatorias.

5. Acordo de Tratamento de Dados com terceiros (quando houver)
- DPA com provedores externos (ex.: fiscal, pagamento, mensageria).
- Medidas de seguranca, suboperadores e transferencia internacional.

6. Registro interno de base legal e finalidade
- Matriz simples por dado (`ip_address`, `request_id`, `actor_user_id`, etc.).
- Finalidade, base legal, prazo de retencao e responsavel.

Checklist juridico-operacional minimo:
- [ ] Contrato atualizado com clausulas de auditoria e dados.
- [ ] Termos de Uso publicados e versionados.
- [ ] Politica de Privacidade publicada e versionada.
- [ ] Politica de Retencao aprovada.
- [ ] Processo para atender direitos LGPD operacional.

### 17.1 Versionamento imutavel de termos e aceite (valor probatorio)
Para garantir prova de aceite com texto congelado no tempo:

Tabela `terms_versions` (append-only, texto oficial):
- `id UUID PK`
- `document_type VARCHAR(40)` (`TERMS_OF_USE`, `PRIVACY_POLICY`, etc.)
- `version VARCHAR(40)` (ex.: `2026.03`)
- `title VARCHAR(200)`
- `content TEXT` (texto completo da versao)
- `content_hash VARCHAR(128)` (SHA-256 do conteudo canonicalizado)
- `created_at TIMESTAMPTZ`
- `published_by UUID NULL`

Tabela `terms_acceptances` (append-only):
- `id UUID PK`
- `tenant_id UUID NOT NULL`
- `user_id UUID NOT NULL`
- `terms_version_id UUID NOT NULL` (FK -> `terms_versions.id`)
- `accepted_at TIMESTAMPTZ NOT NULL`
- `ip_address VARCHAR(64) NULL`
- `request_id VARCHAR(100) NOT NULL`
- `acceptance_hash VARCHAR(128) NOT NULL`

Tabela `terms_lifecycle_events` (append-only):
- `id UUID PK`
- `terms_version_id UUID NOT NULL`
- `event_type VARCHAR(30) NOT NULL` (`PUBLISHED`, `DISABLED`, `REPLACED_BY`)
- `event_metadata_json TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `created_by UUID NULL`

Regras:
1. `terms_versions` nao sofre `UPDATE/DELETE` (revogar permissoes + trigger de bloqueio).
2. Desativacao de uma versao ocorre por novo evento em `terms_lifecycle_events` (`DISABLED`), sem alterar a linha do termo.
3. Aceite sempre referencia a versao exata (`terms_version_id`) para permitir join historico.
4. JOIN probatorio:
   - `terms_acceptances` -> `terms_versions` retorna exatamente o texto aceito no momento do aceite.

## 17. Contrato API para Frontend (DTOs + Rotas)
Objetivo: permitir pesquisa completa e performatica da trilha de auditoria.

### 17.1 DTOs de resposta

`AuditEventListItemDto`
- `id: string`
- `tenantId: string`
- `actorUserId: string | null`
- `actorName: string | null` (snapshot opcional)
- `actorRole: string | null`
- `module: "FISCAL" | "RBAC" | "FINANCE" | "AUTH" | "SYSTEM"`
- `action: string`
- `entityType: string | null`
- `entityId: string | null`
- `status: "SUCCESS" | "ERROR" | "DENIED"`
- `errorCode: string | null`
- `requestId: string`
- `sourceChannel: "API" | "WEBHOOK" | "SCHEDULER" | "SYSTEM"`
- `ipAddress: string | null`
- `createdAt: string` (ISO-8601)
- `alterado: boolean` (true quando houver diferenca entre `before` e `after`)
- `camposAlterados: string[]` (opcional para lista; recomendado em detalhe)

`AuditEventDetailDto`
- Todos os campos de `AuditEventListItemDto`
- `errorMessage: string | null`
- `before: object | null`
- `after: object | null`
- `metadata: object | null`
- `eventHash: string`
- `prevEventHash: string | null`
- `chainValid: boolean` (validacao de hash no momento da consulta)

`AuditSearchResponseDto`
- `items: AuditEventListItemDto[]`
- `nextCursor: string | null`
- `limit: number`
- `hasNext: boolean`
- `aggregations:`
  - `byModule: { key: string; count: number }[]`
  - `byStatus: { key: string; count: number }[]`
  - `byAction: { key: string; count: number }[]` (top N)

`AuditExportResponseDto`
- `exportId: string`
- `format: "CSV" | "JSON"`
- `downloadUrl: string`
- `expiresAt: string`
- `checksumSha256: string`

### 17.2 DTOs de request (filtros)

`AuditSearchQueryDto` (query params)
- `from: string` (ISO-8601) - obrigatorio para pesquisa
- `to: string` (ISO-8601) - obrigatorio para pesquisa
- `modules: string[]` (multivalor)
- `actions: string[]` (multivalor)
- `statuses: string[]` (`SUCCESS|ERROR|DENIED`)
- `entityTypes: string[]`
- `entityId: string`
- `actorUserIds: string[]`
- `requestId: string`
- `sourceChannels: string[]`
- `ip: string`
- `hasChanges: boolean`
- `text: string` (busca textual em `action`, `errorMessage`, `metadata`)
- `cursor: string` (opcional; representa ultimo item da pagina anterior)
- `limit: number` (default 50, max 200)
- `sortBy: "createdAt"` (fixo para keyset)
- `sortDir: "desc"` (fixo para keyset)

`AuditExportRequestDto`
- mesmos filtros do `AuditSearchQueryDto`
- `format: "CSV" | "JSON"`
- `columns: string[]` (opcional; whitelist de colunas exportaveis)

### 17.3 Rotas recomendadas

Base path: `/api/v1/auditoria`

1. `GET /api/v1/auditoria/events`
- Lista paginada com filtros completos.
- Query params: `AuditSearchQueryDto`.
- Response: `AuditSearchResponseDto`.

2. `GET /api/v1/auditoria/events/{id}`
- Detalhe de um evento.
- Response: `AuditEventDetailDto`.

3. `POST /api/v1/auditoria/events/export`
- Dispara exportacao assinada.
- Body: `AuditExportRequestDto`.
- Response: `AuditExportResponseDto`.

4. `GET /api/v1/auditoria/filters/options`
- Retorna valores para combos de filtro (acoes, modulos, status, tipos de entidade).
- Query params opcionais: `from`, `to` para reduzir universo.

5. `GET /api/v1/auditoria/retention/events`
- Consulta eventos de expurgo legal (`AUDIT_RETENTION_PURGE`).
- Filtros por periodo, policyVersion, executionId.

### 17.4 Regras de consulta para performance
- `from/to` obrigatorios para evitar full scan.
- `limit` maximo 200.
- Pesquisa textual com limite de janela (ex.: max 90 dias).
- Paginacao padrao por cursor/keyset (sem `offset`).
- Ordenacao fixa para keyset: `createdAt DESC, id DESC`.
- Campos pesados (`before/after/metadata`) fora da lista, apenas no detalhe.

#### 17.4.1 Regra de cursor (ultimo item consultado)
Formato sugerido do cursor (base64):
- `createdAt|id`

Exemplo de condicao SQL para proxima pagina:
```sql
WHERE
  (created_at < :lastCreatedAt)
  OR (created_at = :lastCreatedAt AND id < :lastId)
ORDER BY created_at DESC, id DESC
LIMIT :limit
```

Beneficios:
- Mantem performance em volume alto.
- Evita custo crescente de `OFFSET`.
- Reduz inconsistencias de paginacao em tabela com insercao concorrente.

### 17.5 Regras de seguranca para API
- Filtro sempre forcado por `tenant_id` do contexto autenticado.
- `FINANCE` nao acessa eventos de `AUTH`/`RBAC` por padrao.
- `OWNER` acessa todos os modulos do proprio tenant.
- Exportacao exige permissao explicita e gera trilha de auditoria da propria consulta/export.
