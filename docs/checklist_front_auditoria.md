# Checklist Frontend - Arquitetura de Auditoria

Referencia: `docs/ESPECIFICACAO_ARQUITETURA_AUDITORIA.md`  
Branch: `feature/frontend-arquitetura-auditoria`

## 1. Base de contrato e tipos
- [x] Criar tipos TS para `AuditEventListItemDto`, `AuditEventDetailDto`, `AuditSearchResponseDto`, `AuditExportResponseDto`.
- [x] Criar tipos TS para filtros (`AuditSearchQueryDto`) e exportacao (`AuditExportRequestDto`).
- [x] Definir enums de modulo/status/source channel no frontend.

## 2. Camada de API
- [x] Implementar `auditoriaApi.listEvents(filters)`.
- [x] Implementar `auditoriaApi.getEventDetail(id)`.
- [x] Implementar `auditoriaApi.exportEvents(payload)`.
- [x] Implementar `auditoriaApi.getFilterOptions(from, to)`.
- [x] Implementar `auditoriaApi.listRetentionEvents(filters)`.
- [x] Garantir tratamento de erro padrao (`code/message/details/path/timestamp`).

## 3. Hook e estado
- [x] Criar `useAuditEvents` com:
- [x] filtros + busca textual;
- [x] paginacao por cursor/keyset;
- [x] loading/empty/error;
- [x] agregacoes (`byModule`, `byStatus`, `byAction`).
- [x] Criar `useAuditEventDetail`.
- [x] Criar `useAuditExport`.

## 4. UI principal de auditoria
- [x] Criar pagina `Auditoria` com tabela/lista de eventos.
- [x] Adicionar filtros obrigatorios (`from/to`) e filtros avancados.
- [x] Exibir colunas minimas: data, modulo, acao, entidade, status, ator, request_id.
- [x] Exibir badges por status (`SUCCESS`, `ERROR`, `DENIED`).
- [x] Exibir agregacoes no topo (modulo/status/acao).

## 5. Detalhe do evento
- [ ] Criar drawer/modal com detalhe completo.
- [ ] Exibir `before/after` com diff legivel.
- [ ] Exibir metadados (`request_id`, canal, ip mascarado, hash, prev_hash, chain_valid).
- [ ] Exibir erro tecnico (`error_code`, `error_message`) quando existir.

## 6. Exportacao
- [x] Adicionar acao de exportar CSV/JSON com filtros correntes.
- [x] Exibir `downloadUrl`, `expiresAt`, `checksumSha256`.
- [x] Registrar feedback de sucesso/erro de exportacao.

## 7. Retencao e compliance (UI)
- [ ] Criar visualizacao de eventos de retencao (`AUDIT_RETENTION_PURGE`).
- [ ] Exibir `policy_version`, janela, linhas afetadas, `execution_id`, `evidence_hash`.

## 8. Seguranca e permissao
- [x] Amarrar rota/menu de auditoria a `allowedRoutes` e permissao de perfil.
- [x] Bloquear acesso sem permissao e redirecionar para `/unauthorized`.
- [x] Validar mascaramento visual de dados sensiveis (email, telefone, documento, ip quando aplicavel).

## 9. UX e padrao visual
- [ ] Aplicar tokens semanticos (sem hardcode de cor).
- [ ] Garantir responsividade desktop/mobile.
- [ ] Garantir estados de loading/empty/error padronizados.
- [ ] Revisar labels e textos conforme `docs/PADRAO_LABELS_E_TEXTOS.md`.

## 10. Homologacao e evidencias
- [ ] Criar bloco de evidencias em `docs/EVIDENCIAS_RF` para auditoria.
- [ ] Registrar execucao no `docs/PACOTE_EVIDENCIAS_RF_FRONT.md`.
- [ ] Atualizar `docs/MATRIZ_HOMOLOGACAO_RF.md` com status do novo modulo.
- [x] Validar build/lint/tsc sem erro.
