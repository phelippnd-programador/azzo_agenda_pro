# Resultado de Homologacao - RF-057..060 (Auditoria)

- Data/Hora:
- Ambiente:
- Executor:
- Commit validado:

## Cenarios
1. Consulta de eventos com periodo obrigatorio.
2. Paginacao por cursor (keyset) com "Carregar mais".
3. Abertura de detalhe em modal com metadados e diff.
4. Exportacao CSV/JSON com retorno de checksum e expiracao.
5. Visualizacao de eventos de retencao/expurgo.

## Esperado
- Listagem retorna eventos por `from/to` com `nextCursor` quando houver proxima pagina.
- Detalhe exibe `requestId`, `sourceChannel`, IP mascarado, hash e erro tecnico quando houver.
- Exportacao retorna `downloadUrl`, `expiresAt`, `checksumSha256`.
- Painel de retencao mostra `policyVersion`, janela, linhas afetadas, `executionId`, `evidenceHash`.

## Obtido
- Implementacao frontend concluida em modo demo local e pronta para validacao com backend real.

## Pendencias de evidencia
- [ ] screenshot da tabela de eventos com cursor exibido
- [ ] screenshot do modal de detalhe com diff
- [ ] screenshot do request/response de `/auditoria/events`
- [ ] screenshot do request/response de `/auditoria/events/export`
- [ ] screenshot do request/response de `/auditoria/retention/events`
