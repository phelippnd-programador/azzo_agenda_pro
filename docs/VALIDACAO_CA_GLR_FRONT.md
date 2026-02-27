# Validacao de Criterios de Aceite (CA/GLR) - Frontend

Data: 2026-02-27
Escopo: frontend (`/src`) com evidencias tecnicas locais.

## Legenda
- `ATENDIDO`: implementado no frontend e validado tecnicamente.
- `PARCIAL`: implementado no frontend, pendente homologacao integrada.
- `PENDENTE`: depende de backend real/evidencia de homologacao.

## Resultado por modulo
- Autenticacao e Sessao: `PARCIAL`
  - login/cadastro/logout implementados;
  - pendente evidenciar refresh token em ambiente integrado.
- RBAC e Guardas: `PARCIAL`
  - menu por `allowedRoutes` e bloqueio para `/unauthorized` implementados;
  - pendente validacao de cenarios RBAC com backend real (403/cache/auditoria).
- Dashboard: `ATENDIDO`
  - metricas e graficos implementados com estados de loading/erro.
- Agenda: `ATENDIDO`
  - CRUD, status, reatribuicao e disponibilidade implementados.
- Cadastros (servicos/profissionais/clientes): `ATENDIDO`
  - CRUDs implementados;
  - `professionalIds` aplicado em servicos.
- Financeiro geral: `ATENDIDO`
  - transacoes e resumo financeiro implementados.
- Financeiro por profissional: `ATENDIDO`
  - metricas por profissional e analise por servico implementadas.
- Fiscal: `PARCIAL`
  - configuracao, preview, emissao/listagem/cancelamento e apuracao implementados;
  - pendente homologacao com provedor fiscal real.
- Licenca/Checkout: `PARCIAL`
  - fluxo de assinatura/pagamento implementado;
  - pendente homologacao com Asaas em ambiente integrado.
- Agendamento publico: `ATENDIDO`
  - fluxo em etapas, filtro de profissional por servico e validacao de conflito no frontend.
- WhatsApp (frontend): `ATENDIDO`
  - configuracao, teste e status da integracao implementados.

## Evidencias tecnicas usadas
- Build: `npm run build` (OK).
- Lint: `npm run lint` (OK).
- Tipagem: `npx tsc --noEmit` (OK).
- Matriz de homologacao: `docs/MATRIZ_HOMOLOGACAO_RF.md`.
- Smoke local: `docs/SMOKE_FRONT_DEMO_LOCAL.md`.

## Pendencias para aprovacao final
- Anexar screenshot + log de rede por RF critico.
- Homologar fluxos dependentes de backend/provedores externos.
