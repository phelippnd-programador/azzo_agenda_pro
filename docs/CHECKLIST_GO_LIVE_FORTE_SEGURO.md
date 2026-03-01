# Checklist de Go-Live Forte e Seguro

Projeto: Azzo Agenda Pro  
Data: 2026-02-28  
Objetivo: validar prontidao real para entrada em producao com risco controlado.

## 1. Produto e Fluxos Criticos
- [ ] Cadastro de conta funcionando com aceite legal e versoes.
- [ ] Login/logout/refresh token validado em cenarios de expiracao.
- [ ] Agenda (criar, atualizar status, cancelar, realocar) validada ponta a ponta.
- [ ] Permissoes por perfil validadas (OWNER e PROFESSIONAL).
- [ ] Fluxo publico (`/agendar/:slug`) sem chamadas internas indevidas.
- [ ] Financeiro e fiscal sem erros bloqueantes nos cenarios principais.
- [ ] Controle de estoque fase 1 validado (cadastro, movimentacao, saldo, alerta de minimo).

## 2. Seguranca e Compliance
- [ ] Isolamento por tenant validado em todas as consultas sensiveis.
- [ ] RBAC aplicado no backend (nao apenas no frontend).
- [ ] Padrao de erro unico implementado e consumido.
- [ ] Trilhas de auditoria ativas para eventos criticos.
- [ ] Politica de senha e recuperacao de acesso validadas.
- [ ] Termos e politica com versionamento e armazenamento de aceite.
- [ ] Movimentacao de estoque com trilha de auditoria (quem, quando, motivo, valor anterior/novo).

## 3. Confiabilidade e Operacao
- [ ] Health checks operacionais configurados.
- [ ] Logs estruturados com correlation/request id.
- [ ] Dashboards minimos de monitoramento (erro, latencia, disponibilidade).
- [ ] Alertas para endpoints criticos configurados.
- [ ] Procedimento de backup e restore testado.
- [ ] Runbook de incidente documentado (quem aciona, como mitiga, como comunica).

## 4. Billing e Comercial
- [ ] Assinatura/licenca com ciclo de cobranca validado.
- [ ] Tratamento de inadimplencia com bloqueio gracioso definido.
- [ ] Politica de upgrade/downgrade de plano definida.
- [ ] Comunicacoes transacionais (vencimento, pagamento) validadas.

## 5. Qualidade e Homologacao
- [ ] Matriz de homologacao por RF atualizada com evidencias.
- [ ] Smoke test completo antes de cada release.
- [ ] Testes regressivos dos fluxos criticos executados.
- [ ] Criticos de UX/texto/label revisados.
- [ ] Erros com mensagem orientativa para usuario final.
- [ ] Cenarios de estoque homologados: entrada, saida, ajuste, alerta e bloqueio por saldo insuficiente.

## 6. Prontidao de Suporte
- [ ] Base de conhecimento minima para onboarding.
- [ ] Script de suporte nivel 1 para erros comuns.
- [ ] Canal de incidente com SLA definido.
- [ ] Processo de coleta de feedback de cliente ativo.

## 7. Gate de Entrada em Producao
Liberar go-live somente se:
- [ ] todos os itens P0 do plano de features estiverem verdes,
- [ ] nao houver bug bloqueante aberto em fluxo critico,
- [ ] monitoramento e resposta a incidente estiverem operacionais,
- [ ] equipe responsavel por suporte estiver de plantao no periodo inicial.

## 8. Pos Go-Live (primeiros 30 dias)
- [ ] Revisao diaria de incidentes e causas raiz.
- [ ] Revisao semanal de KPI de ativacao, no-show e retencao.
- [ ] Priorizacao de correcoes por impacto em receita e risco.
- [ ] Atualizacao de roadmap com dados reais de uso.
