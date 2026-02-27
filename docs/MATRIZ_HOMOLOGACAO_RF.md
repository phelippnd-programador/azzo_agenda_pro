# Matriz de Homologacao por Requisito Funcional (RF)

Objetivo: rastrear validacao funcional com evidencia obrigatoria para cada requisito.

## Regras de Uso
- Status permitido: `NAO_INICIADO`, `EM_EXECUCAO`, `APROVADO`, `REPROVADO`, `BLOQUEADO`.
- Evidencia obrigatoria para status `APROVADO` e `REPROVADO`.
- Cada linha deve apontar para pelo menos 1 rota e 1 endpoint (quando aplicavel).
- Toda reprovacao deve conter acao corretiva e responsavel.

## Definicao de Evidencia Obrigatoria
- Captura de tela (UI) com data/hora.
- Log de rede (DevTools) com request/response.
- Resultado esperado vs obtido.
- Referencia ao commit/tag testado.

## Matriz
| RF | Modulo | Rota(s) | Endpoint(s) principais | Caso de teste | Evidencia obrigatoria | Status | Responsavel | Observacoes |
|---|---|---|---|---|---|---|---|---|
| RF-001..007 | Autenticacao e Sessao | `/login`, `/cadastro`, `/agendar/:slug` | `/auth/login`, `/auth/register`, `/auth/me`, `/auth/refresh` | Login/cadastro/sessao/isolamento publico | `docs/SMOKE_FRONT_DEMO_LOCAL.md` + `docs/EVIDENCIAS_RF/README.md` | EM_EXECUCAO | Frontend | Login demo local com perfis OWNER/PROFESSIONAL implementado em 2026-02-27 |
| RF-008..011 | Controle de Acesso | Rotas protegidas + `/unauthorized` | `/config/menus/current` | Bloqueio por permissao e acesso direto por URL | `docs/SMOKE_FRONT_DEMO_LOCAL.md` + `docs/RBAC_BACKEND_REAL_VALIDACAO.md` + `docs/EVIDENCIAS_RF/README.md` | EM_EXECUCAO | Frontend | Sidebar renderizada por `allowedRoutes`; sem bypass fixo em demo local |
| RF-012..014 | Dashboard | `/dashboard` | `/dashboard/metrics`, `/dashboard/revenue/weekly` | Cards e graficos com dados validos | Screenshot + Network + resultado | EM_EXECUCAO | Frontend | Implementacao de cards/graficos concluida no frontend; pendente evidencia com backend real |
| RF-015..020 | Agenda | `/agenda` | `/appointments*`, `/appointments/available-slots` | CRUD e status de agendamento | Screenshot + Network + resultado | EM_EXECUCAO | Frontend | CRUD/status/realocacao/paginacao por filtros implementados; pendente evidencia em homologacao real |
| RF-021..028 | Cadastros | `/servicos`, `/profissionais`, `/clientes`, `/especialidades` | `/services*`, `/professionals*`, `/clients*`, `/specialties*` | CRUDs e regras de negocio | Screenshot + Network + resultado | EM_EXECUCAO | Frontend | CRUDs implementados com validacoes e feedback de erro; pendente evidencia em backend real |
| RF-029..033 | Financeiro | `/financeiro`, `/financeiro/profissionais` | `/finance/transactions*`, `/dashboard/metrics/professional`, `/dashboard/metrics/services` | Resumo, filtros e graficos | Screenshot + Network + resultado | EM_EXECUCAO | Frontend | Fluxos e graficos implementados; isolamento por perfil aplicado; pendente evidencia formal |
| RF-034..037 | Licenca e Checkout | `/financeiro/licenca`, `/compras*`, `/success`, `/error` | `/billing/*`, `/checkout/*` | Assinatura e fluxo de compra | Screenshot + Network + resultado | EM_EXECUCAO | Frontend | Fluxo de assinatura e telas comerciais implementados; pendente homologacao backend |
| RF-038..042 | Fiscal | `/config-impostos`, `/nota-fiscal`, `/emitir-nota`, `/apuracao-mensal` | `/fiscal/*` | Configuracao, emissao e apuracao | Screenshot + Network + resultado | EM_EXECUCAO | Frontend | Modulo fiscal completo no frontend; pendente validacao fim a fim com provider real |
| RF-043..045 | Notificacoes | `/notificacoes` | `/notifications*` | Filtros, paginacao e limpeza | Screenshot + Network + resultado | EM_EXECUCAO | Frontend | Lista/filtros/limpeza implementados; pendente evidencia com backend real |
| RF-046..050 | Perfil e Configuracoes | `/perfil-salao`, `/configuracoes`, `/configuracoes/integracoes/whatsapp` | `/salon/profile`, `/settings*`, `/whatsapp/config*` (com fallback legado `/tenant/whatsapp*`), `/users/me*` | Persistencia de parametros e conta | Screenshot + Network + resultado | EM_EXECUCAO | Frontend | Perfil/settings/WhatsApp implementados com padrao de erro; pendente evidencias de homologacao |
| RF-051..056 | Agendamento Publico | `/agendar/:slug` | `/public/salons/:slug/*` | Fluxo de 4 passos + criacao | Screenshot + Network + resultado | EM_EXECUCAO | Frontend | Fluxo em etapas e filtros por servico implementados; pendente evidencias com backend real |
| RF-057..060 | Auditoria | `/auditoria` | `/auditoria/events`, `/auditoria/events/{id}`, `/auditoria/events/export`, `/auditoria/filters/options`, `/auditoria/retention/events` | Filtros por periodo, paginacao por cursor, modal de detalhe com diff, exportacao e retencao | `docs/EVIDENCIAS_RF/RF-057-060/resultado.md` + screenshot + network | EM_EXECUCAO | Frontend | Modulo de auditoria implementado no front (keyset cursor + load more); pendente evidencia fim a fim com backend real |
| RF-008..011 + RBAC-001..011 | Menus/Rotas por Perfil (Dinamico por Banco) | Todas rotas protegidas + `/unauthorized` | `/config/menus/current`, `/config/menus/perfis*`, `/config/menus/recarregar` | Alterar permissao no banco e validar reflexo imediato em menu e guard de rota | `docs/SMOKE_FRONT_DEMO_LOCAL.md` + `docs/RBAC_BACKEND_REAL_VALIDACAO.md` + `docs/EVIDENCIAS_RF/README.md` | EM_EXECUCAO | Frontend | Validacao inicial por perfil em demo local (Owner/Profissional); pendente evidenciar cenarios com backend real |

## Cenarios obrigatorios adicionais (RBAC dinamico)
- Cenario RBAC-01: remover permissao de menu de um perfil e validar ocultacao sem deploy.
- Cenario RBAC-02: tentativa de acesso direto por URL sem permissao deve retornar `403` no backend.
- Cenario RBAC-03: aplicar override por tenant A sem impacto no tenant B.
- Cenario RBAC-04: invalidar cache (`/config/menus/recarregar`) e validar aplicacao imediata.
- Cenario RBAC-05: confirmar registro em `auditoria_permissao` com antes/depois.

## Template de Registro de Execucao
- Ambiente:
- Commit/Tag:
- Data/Hora:
- Executor:
- Cenarios executados:
- Evidencias anexadas:
- Resultado final:
- Pendencias:

## Registro de Execucao (Frontend - Demo Local)
- Ambiente: `frontend` local (Vite), modo demo local sem backend.
- Commit/Tag: `387ea2f` (ultimo check funcional desta rodada).
- Data/Hora: 2026-02-27.
- Executor: Frontend.
- Cenarios executados:
  - fluxo de login demo local por perfil OWNER/PROFESSIONAL;
  - guardas de rota por `allowedRoutes` e redirecionamento para primeira rota permitida;
  - fluxo publico `/agendar/:slug` em 4 etapas com validacao de disponibilidade/ conflito;
  - modulos principais (dashboard, agenda, cadastros, financeiro, fiscal, licenca/checkout) validados no nivel de implementacao de frontend.
- Evidencias anexadas:
  - roteiro de smoke: `docs/SMOKE_FRONT_DEMO_LOCAL.md`;
  - pacote de evidencias por RF: `docs/PACOTE_EVIDENCIAS_RF_FRONT.md`;
  - historico de commits de checklist (ex.: `479c195`, `c8e9895`, `b5f29a7`, `f9cd849`, `d04b99a`, `35d7c1a`, `197777d`, `bd77bc5`, `4849e4d`, `1d4fc0b`, `ef686fe`, `56b301a`, `50343c8`, `716ccea`, `f5921c4`, `00a3219`, `387ea2f`);
  - validacoes tecnicas: `npm run build`, `npm run lint`, `npx tsc --noEmit` sem erro.
- Resultado final: status geral em `EM_EXECUCAO`, com trilha de evidencias tecnicas registrada.
- Pendencias:
  - anexar screenshots e logs de rede por RF para mover itens criticos a `APROVADO`;
  - executar cenarios RBAC com backend real (`403`, override por tenant, recarga de cache, auditoria).

## Gate de Aprovacao
- 100% dos RF criticos (autenticacao, agenda, agendamento publico, financeiro) em `APROVADO`.
- Nenhum RF critico em `REPROVADO` sem plano corretivo com prazo.
- Evidencias obrigatorias anexadas para todos os RF executados.
