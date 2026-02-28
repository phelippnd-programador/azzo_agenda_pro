# Checklist de Implementacao - Feature Estoque

Projeto: Azzo Agenda Pro  
Base: `docs/ESPECIFICACAO_FEATURE_ESTOQUE.md` + `docs/CONTRATO_OPENAPI_ESTOQUE.md`  
Status: em andamento

## 1. Preparacao
- [ ] `[BACK]` Validar branch e baseline do backend (`backend/azzo-agenda-pro`).
- [ ] `[FRONT]` Validar branch e baseline do frontend (`frontend`).
- [ ] `[BACK]` Confirmar nomenclatura final de tabelas/colunas (snake_case).
- [ ] `[BACK]` Confirmar estrategia de lock/scheduler para jobs assincronos.

## 2. Banco e Migracoes
- [ ] `[BACK]` Criar migracao `itens_estoque`.
- [ ] `[BACK]` Criar migracao `movimentacoes_estoque`.
- [ ] `[BACK]` Criar migracao `servico_insumo` (fase 2).
- [ ] `[BACK]` Criar migracao `importacao_estoque_job`.
- [ ] `[BACK]` Criar migracao `importacao_estoque_erro_linha`.
- [ ] `[BACK]` Criar indices/constraints (SKU unico por tenant, FKs, etc.).
- [ ] `[BACK]` Criar MVs e estrutura de refresh/log.
- [ ] `[BACK]` Criar migracao de menu/permissoes para rotas de estoque.

## 3. Backend - Dominio e API
- [ ] `[BACK]` Implementar entidades e repositorios de estoque.
- [ ] `[BACK]` Implementar regras de negocio (saldo, ajuste, validacoes).
- [ ] `[BACK]` Implementar `GET/POST/PUT` de itens.
- [ ] `[BACK]` Implementar `GET/POST` de movimentacoes.
- [ ] `[BACK]` Implementar endpoint de dashboard agregado.
- [ ] `[BACK]` Implementar erro padrao por endpoint conforme contrato.
- [ ] `[BACK]` Implementar RBAC/policy por permissao fina.

## 4. Backend - Importacao Assincrona
- [ ] `[BACK]` Integrar MinIO (upload/download/delete por `storage_key`).
- [ ] `[BACK]` Implementar `POST /estoque/importacoes` (multipart + job).
- [ ] `[BACK]` Implementar worker de processamento em lote (batch).
- [ ] `[BACK]` Implementar `GET /importacoes/{jobId}` e `/erros`.
- [ ] `[BACK]` Implementar cancelamento de job.
- [ ] `[BACK]` Implementar URL assinada de resultado.
- [ ] `[BACK]` Implementar limpeza a cada 20 min (sem sobreposicao).
- [ ] `[BACK]` Aplicar TTL: sucesso 1h, falha 24h.
- [ ] `[BACK]` Limitar limpeza por rodada (100 jobs).
- [ ] `[BACK]` Configurar paralelismo controlado por CPU.
- [ ] `[BACK]` Avaliar/ativar virtual threads com limite de concorrencia.

## 5. Frontend - Modulo Estoque
- [x] `[FRONT]` Criar rota protegida `/estoque`.
- [x] `[FRONT]` Adicionar menu lateral "Estoque".
- [x] `[FRONT]` Criar tipos `src/types/stock.ts`.
- [x] `[FRONT]` Criar API client `stockApi` no `src/lib/api.ts`.
- [x] `[FRONT]` Criar pagina base de estoque (itens + movimentacoes).
- [x] `[FRONT]` Separar em subrotas (`/estoque/itens`, `/estoque/movimentacoes`, `/estoque/importacoes`).
- [x] `[FRONT]` Tela completa de CRUD de itens (editar/ativar/inativar).
- [x] `[FRONT]` Tela de movimentacao com filtros e paginacao.
- [x] `[FRONT]` Tela de importacao (upload, status, erros por linha).
- [ ] `[FRONT]` Tela de dashboard de estoque com graficos.
- [ ] `[FRONT]` Exibir `atualizadoEm` e estado de defasagem analitica.

## 6. Qualidade e Testes
- [ ] `[BACK]` Testes unitarios de regras de saldo e custo.
- [ ] `[BACK]` Testes de integracao dos endpoints principais.
- [ ] `[BACK]` Testes de importacao assincrona (sucesso/erro/cancelamento).
- [ ] `[BACK]` Testes de lock e nao sobreposicao do scheduler.
- [ ] `[FRONT]` Testes de fluxo de estoque (itens, movimentacoes, importacao).
- [ ] `[FRONT]` Validar mensagens de erro padrao do backend na UI.

## 7. Go-Live
- [ ] `[BACK]` Healthcheck de storage/worker/scheduler.
- [ ] `[BACK]` Observabilidade (metricas de job, falha, duracao, fila).
- [ ] `[FRONT]` Revisao final de UX/labels e estados vazios.
- [ ] `[BACK]` Revisao de seguranca (bucket privado, URL assinada, RBAC).
- [ ] `[GERAL]` Atualizar matriz de homologacao com evidencias.
- [ ] `[GERAL]` Aprovar gate de release da feature.
