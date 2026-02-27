# PR Resumo Frontend

Data: 2026-02-27
Branch: `feature/alinhamento-completo-documentacao`

## Objetivo
Consolidar alinhamento do frontend com os documentos de requisitos, checklist de homologacao e padroes de UI/contrato.

## Resumo por modulo
- Dashboard:
  - metricas principais + graficos semanal/mensal;
  - tratamento de loading/erro padronizado.
- Agenda:
  - CRUD de agendamento, alteracao de status, reatribuicao de profissional;
  - disponibilidade integrada no formulario.
- Cadastros:
  - servicos com `professionalIds`;
  - profissionais com ativacao/inativacao e reset de senha;
  - clientes com CRUD e filtros.
- Financeiro:
  - fluxo geral de transacoes e cards de resumo;
  - financeiro por profissional com metricas e analise por servico.
- Fiscal:
  - configuracao tributaria, preview, emissao/listagem/cancelamento e apuracao.
- Licenca/Checkout:
  - fluxo de assinatura, metodos PIX/BOLETO/CARTAO e historico.
- RBAC:
  - menu renderizado por `allowedRoutes`;
  - guardas com redirecionamento por primeira rota permitida;
  - demo local por perfil OWNER/PROFESSIONAL.
- Agendamento publico:
  - fluxo 4 etapas;
  - carregamento de profissionais por servico;
  - validacao de conflito de horario antes do submit.

## Evidencias
- Roteiro de smoke: `docs/SMOKE_FRONT_DEMO_LOCAL.md`.
- Matriz de homologacao atualizada: `docs/MATRIZ_HOMOLOGACAO_RF.md`.
- Validacoes tecnicas:
  - `npm run build`;
  - `npm run lint`;
  - `npx tsc --noEmit`.

## Pendencias
- Execucao de homologacao com backend real para anexar screenshots e logs de rede por RF.
- Validacao final de criterios de aceite (CA/GLR) com QA/Produto.
