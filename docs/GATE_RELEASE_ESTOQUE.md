# Gate de Release - Feature Estoque

Projeto: Azzo Agenda Pro  
Data: 2026-02-28  
Escopo: modulo de estoque (itens, movimentacoes, importacao, dashboard)

## Status do Gate
- Estado atual: `AGUARDANDO_APROVACAO_FINAL`
- Motivo: requer aceite formal de negocio e operacao para entrada em producao.

## Evidencias tecnicas consolidadas
- Backend:
  - `60961b3` endpoint de download de modelo de importacao.
  - `ef6f037` integracao MinIO (upload, URL assinada, limpeza).
  - `d28f9d1` normalizacao de dados (NFKC).
  - `a1306d8` capacidade por CPU e avaliacao de virtual threads.
  - `be60a14` testes unitarios de saldo/custo.
  - `6a31717` testes de importacao e lock de scheduler.
  - `99f10a9` healthcheck + metricas de importacao.
  - `30aefe6` hardening de seguranca no storage por tenant.
- Frontend:
  - `4a16bdd` botao de download de modelo na tela de importacao.
  - `f68f18d` ajuste de rota WhatsApp para endpoint atual.
- Documentacao:
  - `d359c7c`, `28312b6`, `241a8b6` (especificacao/contrato/matriz/checklist).

## Resultado dos checks
- Build frontend (`npm run build`): `OK`
- Compile backend (`mvn -DskipTests compile`): `OK`
- Testes unitarios backend executados:
  - `CalculadoraEstoqueUnitTest`: `OK`
  - `ImportacaoEstoquePolicyUnitTest`: `OK`

## Requisitos de seguranca verificados
- Bucket privado com acesso via backend.
- URL assinada com expiracao curta.
- Segregacao por tenant no storage (`tenant/{tenantId}/...`).
- Validacao de escopo de tenant antes de assinar URL/remover objeto.
- Controle de acesso por permissao (`stock:view` e `stock:manage`).

## Pendencias para aprovacao final
- Validacao funcional com backend de homologacao e evidencias visuais finais (prints + logs de rede).
- Assinatura do responsavel de negocio.
- Assinatura do responsavel tecnico de operacao.

## Aprovadores
- Produto/Negocio: _________________________
- Tech Lead/Arquiteto: _____________________
- Operacao/DevOps: _________________________
- Data da aprovacao: ____/____/____
