# Documento de Requisitos e Validacao do Sistema

Projeto: Azzo Agenda Pro (Sistema)
Versao de referencia: v1.0.0+ (base no codigo atual em `master`)
Data: 2026-02-27

## 1. Objetivo e Escopo
Este documento define os requisitos funcionais e nao funcionais do sistema, como usar cada modulo, mapa de rotas, integracoes e checklist de validacao para homologacao.

Escopo coberto:
- Aplicacao web de gestao para saloes e profissionais.
- Fluxo publico de agendamento por link (`/agendar/:slug`).
- Fluxo de compra/licenciamento, financeiro e fiscal.
- Controle de acesso por autenticacao e permissoes de menu.

Convencao de escrita (normativa):
- `deve`: requisito obrigatorio.
- `pode`: comportamento opcional, somente quando explicitamente marcado como opcional.

## 2. Visao Geral da Arquitetura
### 2.1 Frontend
- Stack: React + TypeScript + Vite.
- Estado e dados:
  - Hooks por dominio (`useAppointments`, `useServices`, etc.).
  - Zustand para notificacoes.
  - TanStack Query provider presente (uso pontual).
- API base: `VITE_API_URL` (fallback `http://localhost:8080/api/v1`).
- Autenticacao:
  - JWT em `Authorization: Bearer`.
  - Refresh token com renovacao automatica.
- Layout e navegacao:
  - Rotas publicas e protegidas no `App.tsx`.
  - Menu dinamico por permissoes via `/config/menus/current`.

### 2.2 Backend
- Stack alvo: Java + Quarkus.
- Estilo arquitetural: API REST stateless, orientada a dominio, com separacao em camadas.
- Camadas obrigatorias:
  - `resource/controller`: recebe request, valida payload e devolve status HTTP.
  - `aplicacao/servico`: orquestra casos de uso e regras de negocio.
  - `dominio`: entidades, objetos de valor e regras centrais.
  - `infraestrutura/repositorio`: persistencia, integracoes externas e adaptadores.
- Modulos de dominio minimos:
  - autenticacao/autorizacao
  - agenda e disponibilidade
  - cadastros (servicos, profissionais, clientes, especialidades)
  - financeiro
  - fiscal
  - billing/licenciamento (Asaas)
  - notificacoes
  - publico/agendamento externo
- Persistencia:
  - Banco relacional (PostgreSQL).
  - Multi-tenant logico por `tenant_id` em todas as tabelas internas.
  - Migracoes versionadas obrigatorias.
- Seguranca:
  - JWT para endpoints privados.
  - RBAC por perfil/permissao.
  - isolamento de tenant em toda leitura/escrita.
- Integracoes externas:
  - Asaas (billing/licenca) via adapter dedicado.
  - Provider fiscal (NFe/NFCe) via adapter dedicado.
  - WhatsApp Cloud API via webhook e fila assicrona.
- Operacao e escalabilidade:
  - Suporte inicial para 5.000 usuarios com deploy horizontal da API.
  - Jobs assicronos para tarefas de integracao, refresh analitico e notificacoes.
  - Logs estruturados, metricas e health checks obrigatorios.

### 2.3 Contrato entre Frontend e Backend
- Contratos de request/response devem ser versionados em `/api/v1`.
- Erro padrao obrigatorio com `code`, `message`, `details`, `path`, `timestamp`.
- Alteracao de contrato deve manter compatibilidade retroativa dentro da mesma versao da API.

## 3. Perfis de Usuario
- OWNER:
  - Acesso completo administrativo (agenda, cadastro, financeiro, fiscal, licenca, configuracoes).
- PROFESSIONAL:
  - Acesso restrito conforme permissoes retornadas pelo backend.
  - Regras especificas em telas como financeiro por profissional.
- CLIENT (publico):
  - Usa o fluxo externo de agendamento (`/agendar/:slug`) sem contexto interno.

## 4. Requisitos Funcionais (RF)

### 4.1 Autenticacao e Sessao
- RF-001: Permitir login por email/senha (`/login`).
- RF-002: Permitir cadastro em 2 etapas (`/cadastro`) com dados pessoais e do salao.
- RF-003: Persistir sessao local (token, refresh token e usuario).
- RF-004: Renovar access token automaticamente em erro 401.
- RF-005: Encerrar sessao com logout.
- RF-006: Redirecionar usuario autenticado para rota inicial apropriada.
- RF-007: No contexto publico (`/agendar/:slug`), nao consultar endpoints internos de sessao/menu/notificacao.

### 4.2 Controle de Acesso
- RF-008: Proteger rotas privadas por autenticacao.
- RF-009: Validar acesso por permissoes de menu (`/config/menus/current`).
- RF-010: Renderizar menu lateral apenas com rotas autorizadas.
- RF-011: Bloquear acesso direto por URL sem permissao e redirecionar para `/unauthorized`.

### 4.3 Dashboard e Operacao
- RF-012: Exibir metricas principais no dashboard (`/dashboard`).
- RF-013: Exibir agendamentos do dia e status da equipe.
- RF-014: Exibir graficos de receita (semanal/mensal).

### 4.4 Agenda
- RF-015: Listar agendamentos por dia, com filtros de profissional/status.
- RF-016: Criar novo agendamento com cliente, profissional, servico, data e horario.
- RF-017: Atualizar status do agendamento.
- RF-018: Reatribuir profissional do agendamento.
- RF-019: Excluir agendamento.
- RF-020: Consultar disponibilidade de horarios por profissional/servico/data.

### 4.5 Cadastros Principais
- RF-021: CRUD de servicos (`/servicos`).
- RF-022: No cadastro/edicao de servico, permitir selecionar multiplos profissionais.
- RF-023: Enviar `professionalIds` no payload de criacao/edicao de servico.
- RF-024: `professionalIds` vazio implica servico disponivel para todos.
- RF-025: CRUD de profissionais (`/profissionais`) com comissao, especialidades e horario de trabalho.
- RF-026: Reset de senha de profissional.
- RF-027: CRUD de clientes (`/clientes`) com dados de contato e historico basico.
- RF-028: CRUD de especialidades (`/especialidades`).

### 4.6 Financeiro
- RF-029: Gerenciar transacoes financeiras (`/financeiro`) de entrada e saida.
- RF-030: Exibir resumo de receitas, despesas e saldo.
- RF-031: Exibir financeiro por profissional (`/financeiro/profissionais`) com filtros por periodo.
- RF-032: Consumir metricas de profissional por endpoint dedicado (`/dashboard/metrics/professional`).
- RF-033: Consumir metricas de servicos (`/dashboard/metrics/services`) com destaques e graficos.

### 4.7 Licenciamento e Checkout
- RF-034: Exibir e gerenciar assinatura/licenca (`/financeiro/licenca`).
- RF-035: Criar cobranca por plano/metodo de pagamento (cartao, pix, boleto).
- RF-036: Exibir pagamentos e status.
- RF-037: Fluxo de venda em `/compras` com confirmacao e paginas de sucesso/erro.

### 4.8 Fiscal
- RF-038: Configurar impostos (`/config-impostos`).
- RF-039: Simular/visualizar calculo fiscal (`/nota-fiscal`).
- RF-040: Emitir e listar notas fiscais (`/emitir-nota`).
- RF-041: Cancelar/autorizar nota e abrir visualizacao da nota.
- RF-042: Exibir apuracao mensal e historico (`/apuracao-mensal`).

### 4.9 Notificacoes
- RF-043: Listar notificacoes com filtros e paginacao por cursor (`/notificacoes`).
- RF-044: Remover notificacao individual e limpar todas.
- RF-045: Atualizar resumo por polling em contexto autenticado interno.

### 4.10 Perfil e Configuracoes
- RF-046: Editar perfil do salao (`/perfil-salao`) e dados de endereco.
- RF-047: Exibir e copiar link publico de agendamento.
- RF-048: Atualizar preferencias de notificacao e horario de negocio (`/configuracoes`).
- RF-049: Atualizar dados do usuario e senha.
- RF-050: Configurar integracao WhatsApp (`/configuracoes/integracoes/whatsapp`).

### 4.11 Fluxo Publico de Agendamento
- RF-051: Exibir servicos publicos ativos por slug (`/agendar/:slug`).
- RF-052: Buscar profissionais somente apos clicar em Continuar no passo de servico.
- RF-053: Buscar profissionais filtrados por `serviceId`.
- RF-054: Selecionar profissional, data, horario e dados do cliente para concluir.
- RF-055: Consultar disponibilidade publica por data/servico/profissional.
- RF-056: Criar agendamento publico.

## 5. Requisitos Nao Funcionais (RNF)

### 5.1 Seguranca
- RNF-001: Endpoints privados devem exigir JWT valido.
- RNF-002: Refresh token deve renovar sessao sem expor credenciais na UI.
- RNF-003: Frontend nao deve carregar contexto interno em rota publica (`/agendar/:slug`).
- RNF-004: Bloqueio de acesso por permissoes nao substitui autorizacao no backend.

### 5.2 Confiabilidade e Resiliencia
- RNF-005: Tratamento padrao de erros de API com mensagens de usuario.
- RNF-006: Operacoes assicronas devem exibir estados de loading/skeleton.
- RNF-007: Em falha de rede, manter aplicacao funcional com feedback visual.

### 5.3 Performance
- RNF-008: Carregamentos iniciais devem evitar chamadas desnecessarias.
- RNF-009: Polling de notificacao deve ocorrer apenas em contexto autenticado interno.
- RNF-010: Listas devem suportar ao menos 500 registros sem travamento perceptivel, com paginacao obrigatoria acima de 100 registros por consulta.

### 5.4 Usabilidade
- RNF-011: Interface responsiva (desktop e mobile).
- RNF-012: Formularios devem validar campos obrigatorios, formato e limites com mensagem clara por campo.
- RNF-013: Fluxos de cadastro e agendamento devem ser guiados por etapas com indicador de progresso.

### 5.5 Manutenibilidade
- RNF-014: Organizacao por dominio (pages/hooks/services/types/components).
- RNF-015: Tipagem TypeScript para contratos principais.
- RNF-016: Build de producao deve compilar sem erro.

## 6. Mapa de Rotas

### 6.1 Rotas Publicas
- `/` -> redireciona para `/dashboard` se autenticado, senao `/compras`.
- `/login`
- `/recuperar-senha`
- `/cadastro`
- `/agendar/:slug`
- `/compras`
- `/compras/:productId`
- `/success`
- `/error`

### 6.2 Rotas Protegidas
- `/dashboard`
- `/notificacoes`
- `/agenda`
- `/servicos`
- `/especialidades`
- `/profissionais`
- `/clientes`
- `/financeiro`
- `/financeiro/profissionais`
- `/financeiro/licenca`
- `/configuracoes`
- `/perfil-salao`
- `/config-impostos`
- `/nota-fiscal`
- `/emitir-nota`
- `/apuracao-mensal`
- `/configuracoes/integracoes/whatsapp`
- `/unauthorized`

## 7. Detalhamento por Tela (uso e validacao)

### 7.1 Login (`/login`)
- Objetivo: autenticar usuario.
- Acoes: login, recuperar senha e demo login apenas quando `VITE_ENABLE_DEMO_LOGIN=true`.
- Validar:
  - login com credenciais validas redireciona corretamente.
  - credenciais invalidas exibem erro.

### 7.2 Cadastro (`/cadastro`)
- Objetivo: criar conta de tenant.
- Acoes: cadastro em duas etapas.
- Validar:
  - bloqueio de campos obrigatorios.
  - senha minima de 8 caracteres.
  - cpf com 11 digitos e cnpj com 14 digitos (apenas numeros).

### 7.3 Dashboard (`/dashboard`)
- Objetivo: visao gerencial diaria.
- Dados: metricas, agendamentos, clientes, servicos e profissionais.
- Validar:
  - cards com valores coerentes.
  - listas e graficos carregam sem erro.

### 7.4 Agenda (`/agenda`)
- Objetivo: operacao diaria de agendamentos.
- Acoes: criar, atualizar status, reatribuir, excluir.
- Validar:
  - filtros funcionando.
  - disponibilidade respeitada.
  - transicoes de status corretas.

### 7.5 Servicos (`/servicos`)
- Objetivo: manter catalogo de servicos.
- Acoes: CRUD, ativar/desativar, selecionar profissionais do servico.
- Validar:
  - `professionalIds` enviado em POST/PUT.
  - vazio = todos os profissionais.
  - modal com scroll em telas pequenas.

### 7.6 Especialidades (`/especialidades`)
- Objetivo: gerenciar taxonomia de especialidades.
- Acoes: criar e excluir.
- Validar:
  - sem duplicidade indevida.
  - atualizacao de lista sem reload manual.

### 7.7 Profissionais (`/profissionais`)
- Objetivo: gerenciar equipe.
- Acoes: CRUD, ativar/desativar, reset senha.
- Validar:
  - comissao e horario persistidos.
  - estados ativo/inativo refletidos na UI.

### 7.8 Clientes (`/clientes`)
- Objetivo: CRM basico de clientes.
- Acoes: CRUD, busca, visao em grid/lista.
- Validar:
  - campos obrigatorios e formato.
  - filtro de busca consistente.

### 7.9 Financeiro (`/financeiro`)
- Objetivo: controlar fluxo de caixa.
- Acoes: criar/remover transacoes e acompanhar resumo.
- Validar:
  - saldo = receitas - despesas.
  - filtros/categorias/metodos aplicados.

### 7.10 Financeiro por Profissionais (`/financeiro/profissionais`)
- Objetivo: analise de desempenho por profissional e servico.
- Acoes: filtros por periodo/profissional, graficos e destaques.
- Dados:
  - `/dashboard/metrics/professional`
  - `/dashboard/metrics/services`
- Validar:
  - OWNER e PROFESSIONAL exibem dados corretos.
  - graficos e destaques condizem com retorno da API.

### 7.11 Notificacoes (`/notificacoes`)
- Objetivo: acompanhamento de eventos/notificacoes.
- Acoes: filtrar, paginar, remover, limpar tudo, marcar como lidas (local).
- Validar:
  - polling ativo apenas em rotas internas autenticadas.

### 7.12 Licenca (`/financeiro/licenca`)
- Objetivo: contratar/gerir plano.
- Acoes: selecionar plano e pagamento, acompanhar status.
- Validar:
  - criacao de assinatura por metodo.
  - tratamento de erros por status HTTP.

### 7.13 Perfil do Salao (`/perfil-salao`)
- Objetivo: manter dados institucionais/publicos.
- Acoes: editar perfil, horario, redes, endereco; copiar link de agendamento.
- Validar:
  - persistencia de dados.
  - slug e link publico corretos.

### 7.14 Configuracoes (`/configuracoes`)
- Objetivo: preferencias da conta e notificacoes.
- Acoes: atualizar notificacoes, horario de negocio, dados do usuario e senha.
- Validar:
  - alteracoes persistidas e refletidas na UI.

### 7.15 Fiscal (`/config-impostos`, `/nota-fiscal`, `/emitir-nota`, `/apuracao-mensal`)
- Objetivo: configuracao tributaria, emissao e apuracao.
- Acoes: configurar taxas, simular nota, emitir/listar/cancelar, apurar periodo.
- Validar:
  - calculos coerentes.
  - status de nota e historico funcionando.

### 7.16 Integracao WhatsApp (`/configuracoes/integracoes/whatsapp`)
- Objetivo: configurar cloud API do tenant.
- Validar:
  - salvar configuracao.
  - executar teste de conexao sempre que token e numero remetente estiverem preenchidos.

### 7.17 Agendamento Publico (`/agendar/:slug`)
- Objetivo: permitir agendamento externo.
- Fluxo:
  1. escolher servico
  2. continuar (carrega profissionais por `serviceId`)
  3. escolher profissional
  4. escolher data/horario
  5. informar dados do cliente
  6. confirmar
- Validar:
  - nao chamar `/auth/me`, `/config/menus/current`, `/notifications`.
  - profissionais somente apos continuar e filtrados por servico.

### 7.18 Vendas (`/compras`, `/compras/:productId`, `/success`, `/error`)
- Objetivo: aquisicao/entrada no fluxo comercial.
- Validar:
  - exibicao de produto/plano.
  - redirecionamento de sucesso/erro.

## 8. Integracoes de API (resumo por dominio)
- Auth: `/auth/login`, `/auth/register`, `/auth/me`, `/auth/refresh`.
- Permissoes: `/config/menus/current`.
- Dashboard: `/dashboard/metrics`, `/dashboard/revenue/weekly`, `/dashboard/metrics/professional`, `/dashboard/metrics/services`.
- Cadastros: `/services`, `/professionals`, `/specialties`, `/clients`.
- Agenda: `/appointments`, `/appointments/available-slots`, `/appointments/:id/status`, `/appointments/:id/reassign-professional`.
- Financeiro: `/finance/transactions`, `/finance/transactions/summary`.
- Notificacoes: `/notifications` e exclusoes.
- Perfil/Settings: `/salon/profile`, `/settings`, `/users/me`.
- Billing/Checkout: `/billing/*`, `/checkout/*`.
- Fiscal: `/fiscal/*`.
- Publico: `/public/salons/:slug/services`, `/public/salons/:slug/professionals`, `/public/salons/:slug/availability`, `/public/salons/:slug/appointments`.

## 9. Criterios de Aceite para Homologacao

### 9.1 Criterios Minimos
- CA-001: Build de producao executa sem erros.
- CA-002: Fluxo de login/cadastro funcional.
- CA-003: Todas rotas protegidas exigem autenticacao/permissao.
- CA-004: CRUD de servicos/profissionais/clientes/especialidades funcional.
- CA-005: Agenda com criacao e mudanca de status funcional.
- CA-006: Financeiro geral e por profissional funcional.
- CA-007: Fluxo publico de agendamento funcional sem chamadas internas indevidas.
- CA-008: Modulo fiscal e licenca devem concluir ao menos 1 fluxo fim a fim em homologacao (simulacao fiscal + criacao de cobranca).

### 9.2 Criterios de Seguranca e Contexto
- CA-009: Em `/agendar/:slug`, nao requisitar endpoints internos de sessao/menu/notificacao.
- CA-010: Em rotas internas autenticadas, polling de notificacoes ativo e controlado.

## 10. Checklist de Teste Rapido (Smoke)
- [ ] Login com usuario valido.
- [ ] Cadastro de novo tenant.
- [ ] Dashboard carrega cards e graficos.
- [ ] Criar servico com `professionalIds` selecionados.
- [ ] Criar agendamento interno e concluir atendimento.
- [ ] Visualizar financeiro e resumo de transacoes.
- [ ] Visualizar financeiro por profissionais e analise de servicos.
- [ ] Abrir `/agendar/slug`, concluir agendamento publico.
- [ ] Confirmar ausencia de chamadas `/auth/me`, `/config/menus/current` e `/notifications` no publico.
- [ ] Acessar modulo fiscal e listar/emitir nota em ambiente homologado com backend ativo.
- [ ] Validar tela de licenca e retorno de assinatura/pagamento.

## 11. Riscos e Pontos de Atencao
- Dependencia de contratos do backend para modulos fiscal/billing/notificacoes.
- Diferencas de permissao por perfil dependem de `/config/menus/current`.
- Alguns textos e labels podem variar por encoding em ambiente local.

## 12. Analise de Maturidade do Sistema

### 12.1 Modelo de Maturidade (1 a 5)
- Nivel 1 - Inicial: processos ad-hoc, alta dependencia manual.
- Nivel 2 - Repetivel: fluxos principais estabilizados, padrao parcial.
- Nivel 3 - Definido: padroes claros, modulos integrados e documentados.
- Nivel 4 - Gerenciado: monitoramento com metricas e controles operacionais.
- Nivel 5 - Otimizado: melhoria continua orientada por dados e automacao.

### 12.2 Diagnostico Atual (estimado pelo codigo frontend)
- Arquitetura e organizacao de codigo: **Nivel 3**
  - Separacao por dominios (`pages`, `hooks`, `contexts`, `services`, `stores`).
  - Tipagem forte para contratos principais e padrao de consumo de API.
- Gestao de acesso e seguranca de interface: **Nivel 3**
  - Rotas protegidas, permissoes por menu e isolamento de contexto publico.
  - Autorizacao real ainda depende integralmente do backend.
- Fluxos de negocio (agenda/cadastros/financeiro): **Nivel 3**
  - Funcionalidades centrais completas e operacionais.
  - Ainda com pontos de acoplamento em regras distribuidas na UI.
- Observabilidade e operacao: **Nivel 2**
  - Feedback visual de erro/loading existe.
  - Falta padrao formal de telemetria, tracing e alertas operacionais.
- Qualidade e validacao automatizada: **Nivel 2**
  - Build e validacoes manuais consolidadas.
  - Ausencia de suite robusta de testes automatizados E2E/integracao.
- Documentacao funcional e homologacao: **Nivel 3**
  - Documento de requisitos e checklist de validacao presentes.
  - Falta matriz completa rastreavel RF -> teste automatizado -> evidencia.

### 12.3 Maturidade Geral Estimada
- **Nivel geral atual: 3 (Definido), com operacao/qualidade entre 2 e 3.**

### 12.4 Plano de Evolucao Recomendado
- Curto prazo (elevar para 3+ consistente):
  - Padronizar contratos de erro backend/frontend.
  - Fechar matriz de homologacao por RF com evidencia obrigatoria.
  - Revisar encoding/textos e padronizacao de labels.
- Medio prazo (alvo nivel 4 em operacao):
  - Instrumentar logs estruturados e metricas de frontend (erros, latencia, funil).
  - Implantar testes E2E dos fluxos criticos (login, agenda, agendamento publico, faturamento).
  - Definir SLOs de disponibilidade/performance para jornadas principais.
- Longo prazo (alvo nivel 4-5):
  - Feature flags para rollout seguro de mudancas.
  - Alertas proativos por regressao de funil/conversao.
  - Governanca de release com quality gates automatizados.

## 13. Evidencias Recomendadas para Validacao
- Capturas por rota principal.
- Logs de rede (DevTools) para fluxos criticos.
- Relatorio de build (`npm run build`).
- Registro de cenarios aprovados/reprovados por RF/CA.

## 14. Artefatos Complementares
- Matriz de homologacao por requisito: `docs/MATRIZ_HOMOLOGACAO_RF.md`
- Padrao de labels e textos: `docs/PADRAO_LABELS_E_TEXTOS.md`
- Estrutura relacional do banco: `docs/ESTRUTURA_BASE_DADOS_RELACIONAL.md`

## 15. Comparativo com Ferramentas de Mercado (Benchmark)

Referencia temporal: levantamento em 2026-02-27 com base em paginas oficiais publicas.
Observacao: precos e condicoes podem variar por pais, moeda, campanha e volume transacionado.

### 15.1 Ferramentas comparadas
- Fresha
- Booksy
- Square Appointments
- Vagaro
- GlossGenius
- Mindbody

### 15.2 Visao comparativa (alto nivel)
| Plataforma | Modelo de preco (publico) | Marketplace/aquisicao | Foco em beleza/salao | Pontos fortes percebidos |
|---|---|---|---|---|
| Fresha | Assinatura mensal por plano/membro | Sim | Alto | Agenda + marketplace + POS + operacao enxuta |
| Booksy | Assinatura base + custo por staff; Boost opcional | Sim (Boost) | Alto | Forte em descoberta de novos clientes |
| Square Appointments | Plano free + tiers pagos por local | Nao nativo de beleza | Medio | Ecossistema de pagamentos robusto |
| Vagaro | Assinatura mensal com variacao por calendarios | Sim | Alto | Conjunto amplo para saloes/spas |
| GlossGenius | Tiers mensais com foco beauty-first | Menor foco marketplace | Alto | UX moderna + marketing/AI para beleza |
| Mindbody | Tiers para operacao/marketing/retencao | Sim (app) | Medio/alto | Presenca forte em wellness multiunidade |

### 15.3 Implicacoes para o Azzo (estrategia produto)
- Posicionamento recomendado:
  - `vertical beauty local-first` (operacao de salao + financeiro/fiscal BR + agendamento publico simples).
- Diferenciais competitivos de curto prazo:
  - fluxo publico sem ruido de contexto interno (ja enderecado).
  - associacao `servico -> profissionais` no agendamento (ja enderecado).
  - analiticos por profissional/servico diretamente no dashboard (ja enderecado).
- Oportunidades de evolucao para aproximar lideres:
  - captacao: reputacao/reviews e mecanismos de descoberta (interno ou parceria).
  - retencao: automacoes de rebook, campanhas segmentadas e funis.
  - operacao: mais indicadores de produtividade e rentabilidade por profissional/servico.

### 15.4 Riscos de competitividade
- Sem motores de aquisicao e retencao mais fortes, a comparacao tende a virar disputa por preco.
- Sem observabilidade e testes E2E robustos, crescimento de feature aumenta risco de regressao.

### 15.5 Fontes oficiais consultadas
- Fresha pricing: https://www.fresha.com/pricing
- Booksy plans/pricing: https://biz.booksy.com/en-us/pricing/
- Square Appointments pricing: https://squareup.com/us/en/appointments/pricing
- Vagaro pricing: https://www.vagaro.com/pro/pricing
- GlossGenius pricing: https://glossgenius.com/pricing
- Mindbody pricing: https://www.mindbodyonline.com/business/pricing

## 16. Features Futuras para Robustez (Roadmap)

### 16.1 Curto prazo (0-90 dias)
- Observabilidade minima:
  - captura de erros JS em producao
  - metricas de latencia por endpoint critico
  - painel de disponibilidade dos fluxos principais
- Qualidade:
  - testes E2E para login, agenda, servicos e agendamento publico
  - quality gates no CI (build, lint, testes criticos)
- Produto:
  - bloqueio de conflito de horario em tempo real ao confirmar agendamento
  - historico/auditoria basica de alteracoes em agendamentos e cadastros
- Seguranca:
  - endurecimento de sessao (expiracao, revogacao e logout global)

### 16.2 Medio prazo (3-6 meses)
- Operacao multiunidade:
  - suporte a filiais/unidades com agendas e relatorios segregados
- Regras de negocio avancadas:
  - politicas de cancelamento/no-show configuraveis
  - buffer entre atendimentos por profissional/servico
- CRM e retencao:
  - lembretes e confirmacoes automatizadas (WhatsApp/SMS/email)
  - campanhas segmentadas por recorrencia, ticket e inatividade
- Financeiro/fiscal:
  - conciliacao de pagamentos
  - centros de custo e DRE simplificada por periodo

### 16.3 Longo prazo (6-12 meses)
- Inteligencia operacional:
  - previsao de demanda por dia/horario
  - recomendacao de encaixes e rebook inteligente
- Crescimento:
  - modulo de marketplace/parcerias para aquisicao
  - programa de fidelidade e recorrencia de pacotes
- Plataforma:
  - feature flags por tenant
  - APIs publicas para integracoes de terceiros
  - trilha de auditoria completa com exportacao

### 16.4 Priorizacao sugerida (impacto x complexidade)
- Alto impacto / baixa-media complexidade:
  - E2E critico, observabilidade, conflito de agenda, lembretes
- Alto impacto / alta complexidade:
  - multiunidade, conciliacao completa, IA de demanda
- Medio impacto / media complexidade:
  - campanhas segmentadas, fidelidade, APIs externas

## 17. Requisitos Nao Funcionais (Detalhados)

### 17.1 Performance e Escalabilidade
- RNF-D001: tempo de carregamento inicial da rota principal autenticada <= 3s em rede padrao.
- RNF-D002: acoes CRUD principais devem responder visualmente em <= 1s (feedback de loading imediato).
- RNF-D003: consultas de listas paginadas devem suportar crescimento de dados sem travar UI.
- RNF-D004: o sistema deve suportar crescimento horizontal por tenant (isolamento logico de dados por tenant).

### 17.2 Disponibilidade e Confiabilidade
- RNF-D005: disponibilidade alvo dos fluxos criticos (login, agenda, agendamento publico) >= 99,5%.
- RNF-D006: erros de integracao devem gerar mensagens claras sem quebrar navegacao.
- RNF-D007: operacoes destrutivas (delete/cancel) devem exigir confirmacao explicita.

### 17.3 Seguranca e Privacidade
- RNF-D008: endpoints privados devem exigir token valido e autorizacao por perfil.
- RNF-D009: nenhuma rota publica deve consultar contexto interno sensivel (`/auth/me`, `/config/menus/current`, `/notifications`).
- RNF-D010: dados pessoais (telefone, email, documento) devem trafegar apenas por HTTPS em producao.
- RNF-D011: logs e auditoria nao devem expor segredos/token em texto plano.

### 17.4 Usabilidade e Acessibilidade
- RNF-D012: layout responsivo para desktop e mobile.
- RNF-D013: formularios devem exibir validacoes de campo com mensagem objetiva.
- RNF-D014: componentes interativos devem manter navegacao por teclado e foco visivel.
- RNF-D015: textos e labels devem seguir padrao de nomenclatura unico.

### 17.5 Observabilidade e Operacao
- RNF-D016: capturar erros de frontend com contexto de rota e usuario (anonimizado).
- RNF-D017: monitorar latencia e taxa de erro por endpoint critico.
- RNF-D018: registrar eventos de negocio para funil (agendamento iniciado, concluido, cancelado).

### 17.6 Qualidade e Entrega
- RNF-D019: pipeline de entrega deve bloquear deploy sem build/lint/testes criticos.
- RNF-D020: cobertura E2E minima dos fluxos criticos >= 80%.
- RNF-D021: toda release deve conter evidencias de homologacao por RF critico.

## 18. Regras de Negocio (RB)

### 18.1 Tenant e Acesso
- RB-001: todo usuario autenticado pertence a um tenant e so opera dados do proprio tenant.
- RB-002: menus e rotas exibidas devem respeitar permissoes retornadas pelo backend.
- RB-003: acesso direto por URL sem permissao deve redirecionar para `unauthorized`.

### 18.2 Servicos
- RB-004: servico inativo nao deve ficar disponivel para novos agendamentos.
- RB-005: `professionalIds` vazio/null no servico => servico disponivel para todos os profissionais.
- RB-006: `professionalIds` preenchido => somente profissionais listados podem atender o servico.
- RB-007: duracao e preco do servico devem ser maiores que zero para habilitar cadastro valido.

### 18.3 Profissionais
- RB-008: profissional inativo nao deve aparecer na selecao de novos agendamentos.
- RB-009: reatribuicao de agendamento exige profissional ativo.
- RB-010: comissao do profissional deve estar no intervalo de 0 a 100 (percentual).

### 18.4 Agenda e Disponibilidade
- RB-011: agendamento nao pode ser criado sem cliente, servico, profissional, data e horario.
- RB-012: horario escolhido deve respeitar disponibilidade retornada para data/servico/profissional.
- RB-013: status de agendamento deve seguir estados validos (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
- RB-014: agendamentos concluidos alimentam metricas financeiras e de produtividade.

### 18.5 Agendamento Publico
- RB-015: no fluxo publico, profissionais so devem ser consultados apos escolha de servico e clique em continuar.
- RB-016: consulta de profissionais no publico deve considerar `serviceId`.
- RB-017: fluxo publico nao deve executar chamadas internas de autenticacao/menu/notificacao.

### 18.6 Financeiro
- RB-018: transacoes de receita/despesa devem impactar saldo de forma consistente.
- RB-019: resumo financeiro deve refletir total de entradas, saidas e saldo liquido.
- RB-020: indicadores por profissional devem considerar periodo selecionado e regras de conclusao.

### 18.7 Licenca e Pagamentos
- RB-021: usuario sem assinatura ativa deve ser redirecionado para tela de licenca ao acessar modulos bloqueados por plano.
- RB-022: criacao de assinatura deve validar plano, metodo de pagamento e estado atual do tenant.
- RB-023: erros de cobranca devem ser tratados com mensagens mapeadas por status.

### 18.8 Fiscal
- RB-024: calculo de impostos deve respeitar regime tributario configurado.
- RB-025: emissao/cancelamento de nota deve registrar status e historico da operacao.
- RB-026: apuracao mensal deve consolidar valores por periodo e permitir recalcule.

## 19. Regras de Negocio Fiscais (Guia Completo de Implementacao)

Objetivo: detalhar o que o backend fiscal precisa implementar para atender o frontend atual e garantir rastreabilidade.

### 19.1 Escopo Fiscal do Produto
- Configuracao de regime e aliquotas por tenant.
- Preview de calculo fiscal para simulacao.
- Emissao, listagem, consulta, autorizacao, cancelamento e PDF de nota.
- Apuracao mensal (corrente, historico, resumo anual, recalcule).

### 19.2 Entidades Minimas (modelo de dominio)
- `tax_config`
  - `tenant_id`
  - `regime` (`SIMPLES_NACIONAL` | `LUCRO_PRESUMIDO`)
  - `icms_rate`, `pis_rate`, `cofins_rate`
  - `updated_at`, `updated_by`
- `invoice`
  - `id`, `tenant_id`, `number`, `series`, `type` (`NFE` | `NFCE`)
  - `status` (`DRAFT`, `PENDING_AUTHORIZATION`, `AUTHORIZED`, `CANCELLED`, `REJECTED`)
  - `issue_date`, `cancel_date`, `cancel_reason`
  - `customer_type`, `customer_document`, `customer_name`, `customer_email`, `customer_phone`
  - `subtotal_amount`, `tax_amount`, `total_amount`
  - `regime_snapshot`, `rates_snapshot` (json)
  - `access_key`, `authorization_protocol`, `pdf_url`
  - `appointment_id` (opcional)
  - `created_at`, `updated_at`, `created_by`
- `invoice_item`
  - `invoice_id`, `line_number`
  - `item_id`, `description`, `quantity`, `unit_price`, `total_price`
  - `cfop`, `cst`
  - `tax_base`, `icms_value`, `pis_value`, `cofins_value`
- `fiscal_apuracao_monthly`
  - `tenant_id`, `year`, `month`
  - `total_services`, `total_taxes`, `total_documents`
  - `total_icms`, `total_pis`, `total_cofins`
  - `status` (`OPEN`, `CLOSED`)
  - `last_recalculated_at`
- `fiscal_audit_log`
  - `tenant_id`, `entity_type`, `entity_id`, `action`, `payload_before`, `payload_after`, `created_at`, `actor`

### 19.3 Regras de Configuracao Tributaria
- FISC-R001: cada tenant deve possuir exatamente uma configuracao fiscal ativa.
- FISC-R002: `regime` obrigatorio.
- FISC-R003: aliquotas devem estar em intervalo valido (ex.: `0 <= rate <= 100`).
- FISC-R004: alteracao de `tax_config` deve registrar auditoria.
- FISC-R005: emissao de nota usa snapshot da configuracao no momento da emissao.

### 19.4 Regras de Calculo (motor fiscal)
- FISC-R006: para cada item:
  - `item_total = quantity * unit_price`
  - `tax_base = item_total`
  - `icms = tax_base * icms_rate/100`
  - `pis = tax_base * pis_rate/100`
  - `cofins = tax_base * cofins_rate/100`
- FISC-R007: totais da nota:
  - `subtotal_amount = soma(item_total)`
  - `tax_amount = soma(icms + pis + cofins)`
  - `total_amount = subtotal_amount + additional_amount - discount_amount`
- FISC-R008: arredondamento padrao:
  - armazenar em centavos (inteiro) no banco.
  - arredondar por item antes de totalizar para evitar drift.
- FISC-R009: `cfop` e `cst` devem ser validados contra listas permitidas.
- FISC-R010: documento do cliente deve ser normalizado (somente digitos) antes de validar.

### 19.5 Regras de Emissao de Nota
- FISC-R011: so emitir nota com `invoice` contendo ao menos 1 item.
- FISC-R012: so emitir nota com customer minimo valido (`type`, `document`, `name`).
- FISC-R013: numero/serie da nota devem ser unicos por tenant e tipo.
- FISC-R014: transicao de estado permitida:
  - `DRAFT -> PENDING_AUTHORIZATION -> AUTHORIZED`
  - `DRAFT -> CANCELLED`
  - `AUTHORIZED -> CANCELLED` (com motivo e dentro de 24h da autorizacao)
  - `PENDING_AUTHORIZATION -> REJECTED` (somente por retorno do provider fiscal)
- FISC-R015: emissao deve ser idempotente por `idempotency_key` para evitar duplicacao.

### 19.6 Regras de Cancelamento
- FISC-R016: cancelamento exige `reason` quando nota ja autorizada.
- FISC-R017: cancelamento deve registrar `cancel_date`, `cancel_reason` e evento de auditoria.
- FISC-R018: nota cancelada nao pode ser reautorizada.

### 19.7 Regras de Apuracao Mensal
- FISC-R019: apuracao considera periodo fechado por `year/month` e `tenant`.
- FISC-R020: incluir apenas notas `AUTHORIZED` no somatorio principal.
- FISC-R021: notas `CANCELLED` devem ser excluidas da base de apuracao do periodo.
- FISC-R022: `recalculate` deve ser idempotente e sobrescrever consolidado do periodo.
- FISC-R023: historico anual deve retornar totais e meses com metadados para comparacao.

### 19.8 Regras de Integracao Externa (SEFAZ/Provider)
- FISC-R024: integracao deve ser desacoplada via adapter/provider.
- FISC-R025: timeout e retry exponencial para chamadas externas.
- FISC-R026: persistir payloads de request/response (com mascaramento de dados sensiveis).
- FISC-R027: erros do provider devem mapear para contrato de erro padrao (`code`, `message`, `details`).

### 19.9 Endpoints Necessarios (contrato funcional)
- `GET /fiscal/tax-config`
- `PUT /fiscal/tax-config`
- `GET /fiscal/invoices`
- `GET /fiscal/invoices/{id}`
- `POST /fiscal/invoices`
- `PATCH /fiscal/invoices/{id}/cancel`
- `POST /fiscal/invoices/{id}/authorize`
- `GET /fiscal/invoices/{id}/pdf`
- `GET /fiscal/apuracoes/current`
- `GET /fiscal/apuracoes/{year}/{month}`
- `POST /fiscal/apuracoes/{year}/{month}/recalculate`
- `GET /fiscal/apuracoes/historico?limite=12`
- `GET /fiscal/apuracoes/resumo-anual?ano=YYYY`

### 19.10 Validacoes de Entrada (backend)
- FISC-R028: bloquear entrada com:
  - item sem `description`, `quantity <= 0`, `unit_price <= 0`
  - `cfop`/`cst` invalidos
  - customer sem documento valido
  - tentativa de transicao de estado invalida
- FISC-R029: retornar erros com contrato padronizado:
  - `code` (ex.: `FISCAL_INVALID_CFOP`, `FISCAL_INVALID_STATUS_TRANSITION`)
  - `message`
  - `details` por campo
  - `path`, `timestamp`

### 19.11 Seguranca e Compliance (nivel aplicacao)
- FISC-R030: isolamento por tenant em todas queries/escritas fiscais.
- FISC-R031: trilha de auditoria obrigatoria em:
  - alteracao de configuracao tributaria
  - emissao/autoriza/cancelamento de nota
  - recalcule de apuracao
- FISC-R032: mascarar documento em logs e respostas de diagnostico em 100% dos casos.

### 19.12 Checklist de Testes Fiscais (homologacao)
- [ ] Config fiscal salva e retorna corretamente por tenant.
- [ ] Preview calcula impostos com aliquotas e arredondamento corretos.
- [ ] Emissao de nota com item unico e multiplo.
- [ ] Erros de validacao retornam `code/message/details`.
- [ ] Cancelamento altera status e gera auditoria.
- [ ] Recalcule de apuracao atualiza totais do periodo.
- [ ] Historico e resumo anual coerentes com notas autorizadas.
- [ ] PDF acessivel para notas autorizadas.
- [ ] Idempotencia em emissao evita nota duplicada.
- [ ] Integracao externa com falha retorna erro padronizado e rastreavel.

## 20. Especificacao Tecnica de Backend (DTO, Payload, Banco e Rotas)

Objetivo: definir um contrato minimo implementavel em Java + Quarkus para suportar o frontend atual.

### 20.1 Convencoes Gerais
- Base path: `/api/v1`
- Formato de data:
  - `LocalDate`: `YYYY-MM-DD`
  - `LocalDateTime/Instant`: ISO 8601
- Valores monetarios:
  - obrigatorio em centavos (`long`) no banco e DTO
- Multi-tenant:
  - toda entidade de dominio interno possui `tenantId`
- Erro padrao:
```json
{
  "code": "STRING_CODE",
  "message": "Descricao",
  "details": [{ "field": "campo", "message": "erro" }],
  "path": "/api/v1/...",
  "timestamp": "2026-02-27T12:00:00Z"
}
```

### 20.2 DTOs e Payloads (core)

#### 20.2.1 Auth
- `POST /auth/login`
  - Request:
```json
{ "email": "owner@salao.com", "password": "123456" }
```
  - Response:
```json
{
  "access_token": "jwt",
  "refresh_token": "jwt_refresh",
  "user": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Nome",
    "email": "owner@salao.com",
    "phone": "11999999999",
    "role": "OWNER"
  }
}
```

- `POST /auth/register`
  - Request:
```json
{
  "name": "Nome",
  "email": "owner@salao.com",
  "password": "123456",
  "salonName": "Salao X",
  "phone": "11999999999",
  "cpfCnpj": "12345678901"
}
```
  - Response: mesmo contrato de login.

#### 20.2.2 Service
- `ServiceRequestDto`
```json
{
  "name": "Corte",
  "description": "Corte masculino/feminino",
  "duration": 45,
  "price": 7000,
  "category": "Cabelo",
  "professionalIds": ["uuid-prof-1", "uuid-prof-2"],
  "isActive": true
}
```
- `ServiceResponseDto`
```json
{
  "id": "uuid-service",
  "tenantId": "uuid-tenant",
  "name": "Corte",
  "description": "Corte masculino/feminino",
  "duration": 45,
  "price": 7000,
  "category": "Cabelo",
  "professionalIds": ["uuid-prof-1", "uuid-prof-2"],
  "isActive": true,
  "createdAt": "2026-02-27T12:00:00Z"
}
```

#### 20.2.3 Professional
- `ProfessionalRequestDto`
```json
{
  "name": "Maria",
  "email": "maria@salao.com",
  "phone": "11988887777",
  "specialties": ["Cabelo", "Coloracao"],
  "commissionRate": 40,
  "workingHours": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "18:00", "isWorking": true }
  ],
  "isActive": true
}
```

#### 20.2.4 Appointment
- `AppointmentRequestDto`
```json
{
  "clientId": "uuid-client",
  "professionalId": "uuid-prof",
  "serviceId": "uuid-service",
  "date": "2026-02-27",
  "startTime": "10:00",
  "endTime": "10:45",
  "status": "PENDING",
  "totalPrice": 7000,
  "notes": "Opcional"
}
```

#### 20.2.5 Public Booking
- `PublicAvailabilityResponseDto`
```json
{
  "date": "2026-02-27",
  "slots": [{ "time": "10:00", "available": true }]
}
```
- `PublicAppointmentRequestDto`
```json
{
  "customerName": "Cliente",
  "customerPhone": "11999999999",
  "customerEmail": "cliente@email.com",
  "professionalId": "uuid-prof",
  "serviceId": "uuid-service",
  "date": "2026-02-27",
  "startTime": "10:00"
}
```

#### 20.2.6 Dashboard Profissional/Servicos
- `DashboardProfessionalMetricsResponse`
```json
{
  "startDate": "2026-02-01",
  "endDate": "2026-02-28",
  "professionalId": "uuid-prof",
  "revenueTotal": 150000,
  "commissionTotal": 60000,
  "completedServices": 42,
  "clientsServed": 28
}
```
- `DashboardServicesMetricsResponse` (resumo):
```json
{
  "startDate": "2026-02-01",
  "endDate": "2026-02-28",
  "professionalId": "uuid-prof",
  "services": [
    {
      "serviceId": "uuid-service",
      "serviceName": "Corte",
      "totalAppointments": 30,
      "completedAppointments": 24,
      "canceledAppointments": 4,
      "revenueTotal": 300000,
      "completionRate": 80.0,
      "cancellationRate": 13.3
    }
  ]
}
```

### 20.3 Modelo de Banco (tabelas essenciais)

#### 20.3.1 Core
- `tenants(id, name, slug, created_at, updated_at)`
- `users(id, tenant_id, name, email, phone, password_hash, role, is_active, created_at, updated_at)`
- `refresh_tokens(id, user_id, token_hash, expires_at, revoked_at, created_at)`

#### 20.3.2 Catalogo e Agenda
- `specialties(id, tenant_id, name, created_at)`
- `professionals(id, tenant_id, user_id, name, email, phone, avatar, commission_rate, is_active, created_at, updated_at)`
- `professional_working_hours(id, professional_id, day_of_week, start_time, end_time, is_working)`
- `services(id, tenant_id, name, description, duration_minutes, price_cents, category, is_active, created_at, updated_at)`
- `service_professionals(service_id, professional_id)` (N:N)
- `clients(id, tenant_id, name, email, phone, birth_date, notes, created_at, updated_at)`
- `appointments(id, tenant_id, client_id, professional_id, service_id, date, start_time, end_time, status, total_price_cents, notes, created_at, updated_at)`

Indices obrigatorios para operacao em producao:
- `appointments(tenant_id, date)`
- `appointments(tenant_id, professional_id, date, start_time)`
- `appointments(tenant_id, status, date)`
- `services(tenant_id, is_active)`
- `professionals(tenant_id, is_active)`

#### 20.3.3 Financeiro/Fiscal/Billing
- `transactions(id, tenant_id, appointment_id, type, category, description, amount_cents, payment_method, date, created_at)`
- `tax_config(...)`
- `invoices(...)`
- `invoice_items(...)`
- `fiscal_apuracao_monthly(...)`
- `billing_subscriptions(id, tenant_id, provider, plan_code, status, next_due_date, created_at, updated_at)`
- `billing_payments(id, tenant_id, subscription_id, provider_payment_id, status, amount_cents, due_date, paid_at, method, payload_json, created_at)`

### 20.4 Catalogo de Rotas e Responsabilidade de Cada Endpoint

#### 20.4.1 Auth
- `POST /auth/login`
  - Validar credenciais, gerar access/refresh token, retornar usuario.
- `POST /auth/register`
  - Criar tenant + owner + configuracoes iniciais e autenticar.
- `POST /auth/refresh`
  - Validar refresh token e emitir novo access token.
- `GET /auth/me`
  - Retornar usuario autenticado com tenant/role.

#### 20.4.2 Permissoes/Menu
- `GET /config/menus/current`
  - Retornar `role` e `allowedRoutes` para montar menu/guard no frontend.

#### 20.4.3 Servicos
- `GET /services`
  - Listar servicos do tenant.
- `POST /services`
  - Criar servico; validar `professionalIds` e aplicar regra vazio = todos.
- `PUT /services/{id}`
  - Atualizar servico e vinculos de profissionais.
- `DELETE /services/{id}`
  - Inativar servico (soft delete). Exclusao fisica nao deve ocorrer em producao.

#### 20.4.4 Profissionais
- `GET /professionals`
  - Listar profissionais do tenant.
- `GET /professionals?serviceId=...` (obrigatorio para filtros de agendamento)
  - Filtrar profissionais por servico.
- `POST /professionals`
  - Criar profissional + horarios de trabalho.
- `PUT /professionals/{id}`
  - Atualizar dados e horarios.
- `POST /professionals/{id}/reset-password`
  - Gerar senha temporaria/fluxo de reset.

#### 20.4.5 Agenda
- `GET /appointments`
  - Listar agendamentos do tenant com filtros.
- `POST /appointments`
  - Criar agendamento interno validando conflito.
- `PATCH /appointments/{id}/status?value=...`
  - Alterar status com validacao de transicao.
- `PATCH /appointments/{id}/reassign-professional?professionalId=...`
  - Reatribuir profissional valido e ativo.
- `GET /appointments/available-slots`
  - Calcular slots disponiveis por profissional/data/duracao.

#### 20.4.6 Public Booking
- `GET /public/salons/{slug}`
  - Retornar perfil publico do salao.
- `GET /public/salons/{slug}/services`
  - Retornar servicos ativos.
- `GET /public/salons/{slug}/professionals?serviceId=...`
  - Retornar profissionais ativos aptos ao servico.
- `GET /public/salons/{slug}/availability?date=...&serviceId=...&professionalId=...`
  - Retornar horarios disponiveis.
- `POST /public/salons/{slug}/appointments`
  - Criar agendamento publico sem contexto interno.

#### 20.4.7 Dashboard
- `GET /dashboard/metrics`
  - Indicadores gerais diarios/mensais.
- `GET /dashboard/revenue/weekly?start=...&end=...`
  - Serie semanal de faturamento.
- `GET /dashboard/metrics/professional?start=...&end=...&professionalId=...`
  - KPIs por profissional.
- `GET /dashboard/metrics/services?start=...&end=...&professionalId=...`
  - Ranking e taxas por servico.

#### 20.4.8 Financeiro
- `GET /finance/transactions`
  - Listar transacoes.
- `GET /finance/transactions/summary`
  - Retornar resumo (entrada/saida/saldo).
- `POST /finance/transactions`
  - Criar transacao.
- `DELETE /finance/transactions/{id}`
  - Excluir transacao.

#### 20.4.9 Fiscal
- Implementar rotas descritas na Secao 19.9 com auditoria e idempotencia.

#### 20.4.10 Billing (Asaas)
- `POST /billing/subscriptions`
  - Criar cobranca/assinatura no provider e persistir status local.
- `GET /billing/subscriptions/current`
  - Retornar assinatura atual do tenant.
- `GET /billing/payments`
  - Retornar historico de pagamentos.
- `POST /billing/webhooks/asaas` (backend interno)
  - Receber evento, validar assinatura e atualizar status local.

### 20.5 O que implementar em Quarkus (resumo pratico)
- Resource por dominio (`@Path`) + Service + Repository.
- Filtro de tenant por token/claim.
- Validacao Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.).
- Mapper DTO <-> entidade.
- Excecao padrao com `ExceptionMapper` para contrato de erro unico.
- Migracoes de banco (Flyway/Liquibase).
- Testes:
  - unitarios de regra de negocio
  - integracao REST (REST Assured)
  - contratos criticos dos endpoints acima

## 21. Status HTTP Esperados por Endpoint

Convencao geral:
- `200 OK`: leitura/atualizacao bem-sucedida.
- `201 Created`: criacao de recurso.
- `204 No Content`: exclusao/acao sem payload.
- `400 Bad Request`: payload invalido.
- `401 Unauthorized`: sem token/token invalido.
- `403 Forbidden`: sem permissao.
- `404 Not Found`: recurso nao encontrado.
- `409 Conflict`: conflito de regra/estado.
- `422 Unprocessable Entity`: regra de negocio invalida.
- `500 Internal Server Error`: erro inesperado.

### 21.1 Auth
- `POST /auth/login`: `200`, erros `400/401/429/500`
- `POST /auth/register`: `201`, erros `400/409/422/429/500`
- `POST /auth/refresh`: `200`, erros `400/401/500`
- `GET /auth/me`: `200`, erros `401/403/500`

### 21.2 Menu/Permissoes
- `GET /config/menus/current`: `200`, erros `401/403/500`

### 21.3 Servicos
- `GET /services`: `200`, erros `401/403/500`
- `POST /services`: `201`, erros `400/401/403/409/422/500`
- `PUT /services/{id}`: `200`, erros `400/401/403/404/409/422/500`
- `DELETE /services/{id}`: `204`, erros `401/403/404/409/500`

### 21.4 Profissionais
- `GET /professionals`: `200`, erros `401/403/500`
- `POST /professionals`: `201`, erros `400/401/403/409/422/500`
- `PUT /professionals/{id}`: `200`, erros `400/401/403/404/409/422/500`
- `DELETE /professionals/{id}`: `204`, erros `401/403/404/409/500`
- `POST /professionals/{id}/reset-password`: `200`, erros `401/403/404/422/500`

### 21.5 Especialidades
- `GET /specialties`: `200`, erros `401/403/500`
- `POST /specialties`: `201`, erros `400/401/403/409/500`
- `DELETE /specialties/{id}`: `204`, erros `401/403/404/409/500`

### 21.6 Clientes
- `GET /clients`: `200`, erros `401/403/500`
- `POST /clients`: `201`, erros `400/401/403/409/422/500`
- `PUT /clients/{id}`: `200`, erros `400/401/403/404/409/422/500`
- `DELETE /clients/{id}`: `204`, erros `401/403/404/409/500`

### 21.7 Agenda
- `GET /appointments`: `200`, erros `401/403/500`
- `POST /appointments`: `201`, erros `400/401/403/409/422/500`
- `GET /appointments/available-slots`: `200`, erros `400/401/403/422/500`
- `PATCH /appointments/{id}/status`: `200`, erros `400/401/403/404/409/422/500`
- `PATCH /appointments/{id}/reassign-professional`: `200`, erros `400/401/403/404/409/422/500`
- `DELETE /appointments/{id}`: `204`, erros `401/403/404/409/500`

### 21.8 Dashboard
- `GET /dashboard/metrics`: `200`, erros `401/403/500`
- `GET /dashboard/revenue/weekly`: `200`, erros `400/401/403/422/500`
- `GET /dashboard/metrics/professional`: `200`, erros `400/401/403/404/422/500`
- `GET /dashboard/metrics/services`: `200`, erros `400/401/403/422/500`

### 21.9 Financeiro
- `GET /finance/transactions`: `200`, erros `401/403/500`
- `GET /finance/transactions/summary`: `200`, erros `401/403/500`
- `POST /finance/transactions`: `201`, erros `400/401/403/422/500`
- `DELETE /finance/transactions/{id}`: `204`, erros `401/403/404/409/500`

### 21.10 Notificacoes
- `GET /notifications`: `200`, erros `400/401/403/500`
- `DELETE /notifications/{id}`: `204`, erros `401/403/404/500`
- `DELETE /notifications/all`: `204`, erros `401/403/500`

### 21.11 Perfil e Configuracoes
- `GET /salon/profile`: `200`, erros `401/403/404/500`
- `PUT /salon/profile`: `200`, erros `400/401/403/404/422/500`
- `GET /settings`: `200`, erros `401/403/500`
- `PUT /settings`: `200`, erros `400/401/403/422/500`
- `PUT /settings/notifications`: `200`, erros `400/401/403/422/500`
- `PUT /settings/business-hours`: `200`, erros `400/401/403/422/500`
- `PUT /users/me`: `200`, erros `400/401/403/422/500`
- `PUT /users/me/password`: `204`, erros `400/401/403/422/500`

### 21.12 Public Booking
- `GET /public/salons/{slug}`: `200`, erros `404/500`
- `GET /public/salons/{slug}/services`: `200`, erros `404/500`
- `GET /public/salons/{slug}/professionals`: `200`, erros `400/404/500`
- `GET /public/salons/{slug}/availability`: `200`, erros `400/404/422/500`
- `POST /public/salons/{slug}/appointments`: `201`, erros `400/404/409/422/500`

### 21.13 Fiscal
- `GET /fiscal/tax-config`: `200`, erros `401/403/404/500`
- `PUT /fiscal/tax-config`: `200`, erros `400/401/403/422/500`
- `GET /fiscal/invoices`: `200`, erros `400/401/403/500`
- `GET /fiscal/invoices/{id}`: `200`, erros `401/403/404/500`
- `POST /fiscal/invoices`: `201`, erros `400/401/403/409/422/500`
- `PATCH /fiscal/invoices/{id}/cancel`: `200`, erros `400/401/403/404/409/422/500`
- `POST /fiscal/invoices/{id}/authorize`: `200`, erros `400/401/403/404/409/422/500`
- `GET /fiscal/invoices/{id}/pdf`: `200`, erros `401/403/404/409/500`
- `GET /fiscal/apuracoes/current`: `200`, erros `401/403/404/500`
- `GET /fiscal/apuracoes/{year}/{month}`: `200`, erros `400/401/403/404/500`
- `POST /fiscal/apuracoes/{year}/{month}/recalculate`: `200`, erros `400/401/403/404/409/500`
- `GET /fiscal/apuracoes/historico`: `200`, erros `400/401/403/500`
- `GET /fiscal/apuracoes/resumo-anual`: `200`, erros `400/401/403/500`

### 21.14 Billing (Asaas)
- `POST /billing/subscriptions`: `201`, erros `400/401/403/404/409/422/500`
- `GET /billing/subscriptions/current`: `200`, erros `401/403/404/500`
- `GET /billing/payments`: `200`, erros `401/403/500`
- `POST /billing/webhooks/asaas`: `200`, erros `400/401/403/500`

## 22. Design System (Padrao Visual e de Componentes)

Objetivo: manter o sistema legivel, consistente e escalavel no frontend.

### 22.1 Stack do Design System
- Base de componentes: `shadcn/ui` + `Radix UI`
- Estilizacao: `Tailwind CSS`
- Iconografia: `lucide-react`
- Graficos: `recharts`
- Notificacoes: `sonner`

### 22.2 Principios
- Consistencia: mesma linguagem visual em todas as telas.
- Clareza: hierarquia tipografica e espacamento previsiveis.
- Acessibilidade: foco visivel, contraste adequado e navegacao por teclado.
- Reutilizacao: evitar componentes duplicados para o mesmo padrao.

### 22.3 Tokens de Design (padrao adotado)
- Cores semanticas (via CSS variables):
  - `--color-bg`, `--color-surface`, `--color-border`
  - `--color-text-primary`, `--color-text-secondary`
  - `--color-primary`, `--color-success`, `--color-warning`, `--color-danger`
- Tipografia:
  - escala fixa para `text-xs/sm/base/lg/xl/2xl`
  - pesos padrao (`font-medium`, `font-semibold`, `font-bold`)
- Espacamento:
  - escala 4px/8px (`space-1`, `space-2`, `space-3`, `space-4`, ...)
- Raios e sombra:
  - `--radius-sm/md/lg`
  - sombra padrao para cards/dialogs

### 22.4 Estrutura de Componentes
- `src/components/ui/*`
  - componentes base e primitives (Button, Input, Select, Dialog etc.)
- `src/components/layout/*`
  - layout principal, sidebar, header
- `src/components/<dominio>/*`
  - componentes de negocio por modulo (dashboard, fiscal, notifications, sales)

### 22.5 Padroes de Tela
- Header de tela:
  - titulo + subtitulo objetivos
- Secoes:
  - cards com espacamento uniforme
- Estados obrigatorios:
  - `loading` (skeleton/spinner)
  - `empty` (mensagem + acao sugerida)
  - `error` (mensagem + retry para operacoes idempotentes)
- Acoes:
  - CTA principal destacado
  - acoes destrutivas com confirmacao

### 22.6 Padroes de Formulario
- Label sempre visivel para campos principais.
- Mensagens de validacao curtas e acionaveis.
- Campos obrigatorios sinalizados.
- Submit com estado de carregamento.
- Dialogs longos com `max-h` + `overflow-y-auto`.

### 22.7 Padroes de Tabela/Lista
- Busca e filtros no topo.
- Paginacao ou carregamento incremental para listas extensas.
- Colunas/chips com textos padronizados (status/categoria).
- Acoes por item com menu contextual (`DropdownMenu`).

### 22.8 Padroes de Graficos
- Titulo claro + subtitulo contextual (periodo/filtro).
- Legendas com termos de negocio (evitar abreviacoes ambiguas).
- Cores semanticas:
  - verde = concluido/sucesso
  - vermelho = cancelado/erro
  - cinza = outros
- Tooltip com unidade (`R$`, `%`, `qtd`).

### 22.9 Acessibilidade (A11y)
- Navegacao por teclado em componentes interativos.
- Indicador de foco visivel.
- Contraste minimo WCAG AA obrigatorio.
- Textos de apoio para estados e icones criticos.

### 22.10 Governanca do Design System
- Toda alteracao de componente base deve avaliar impacto global.
- Evitar estilo inline repetido; preferir variantes e utilitarios padronizados.
- Novos componentes devem ser documentados com:
  - objetivo
  - props
  - exemplos de uso
  - casos de erro/empty/loading

## 23. Padrao de Nomenclatura em Portugues (codigo e banco)

Objetivo: padronizar linguagem de dominio em portugues em todo o projeto (frontend, backend e banco).

### 23.1 Regra geral
- Usar termos de dominio em portugues em:
  - variaveis
  - classes/entidades
  - DTOs
  - tabelas e colunas
  - mensagens de negocio
- Excecao: nomes obrigatorios de framework/biblioteca podem permanecer em ingles.

### 23.2 Convencoes tecnicas
- Sem acentos e sem cedilha em identificadores:
  - usar `servico`, `configuracao`, `emissao`, `usuario`
  - evitar qualquer identificador com caracteres acentuados
- Codigo (Java/TypeScript):
  - classes/entidades/DTOs: `PascalCase` (ex.: `AgendamentoDto`, `ConfiguracaoFiscal`)
  - variaveis/metodos: `camelCase` (ex.: `dataAgendamento`, `calcularImpostos`)
- Banco de dados:
  - tabelas/colunas: `snake_case` (ex.: `agendamento`, `data_criacao`, `valor_total_centavos`)
  - chaves estrangeiras: `<entidade>_id` (ex.: `cliente_id`, `profissional_id`)

### 23.3 Prefixos e sufixos recomendados
- DTOs de entrada: `...RequisicaoDto`
- DTOs de saida: `...RespostaDto`
- Entidades: nome de dominio simples (ex.: `Agendamento`, `Cliente`, `Servico`)
- Servicos de aplicacao: `...ServicoAplicacao` ou `...CasoUso`
- Repositorios: `...Repositorio`

### 23.4 Dicionario minimo de termos oficiais
- `usuario`, `perfil`, `permissao`, `tenant` (multiempresa)
- `servico`, `especialidade`, `profissional`, `cliente`
- `agendamento`, `disponibilidade`, `horario`, `status`
- `faturamento`, `comissao`, `transacao`, `saldo`
- `fiscal`, `nota_fiscal`, `apuracao`, `aliquota`
- `assinatura`, `pagamento`, `licenca`, `cobranca`

### 23.5 Exemplos praticos
- Bom:
  - `valorTotalCentavos`
  - `dataCriacao`
  - `profissionalIds`
  - tabela `agendamento`
  - coluna `status_agendamento`
- Evitar:
  - `totalAmount`
  - `createdAt`
  - `professionalsIds`
  - tabela `appointments`
  - coluna `booking_status`

### 23.6 Regra para APIs externas
- Integracoes externas (ex.: Asaas, provider fiscal):
  - manter mapeamento interno em portugues
  - criar adaptador/tradutor para payload externo
  - nao propagar nomes externos diretamente para o dominio interno

### 23.7 Governanca de revisao
- Todo PR deve validar:
  - [ ] nomenclatura de dominio em portugues
  - [ ] ausencia de acentos em identificadores
  - [ ] consistencia entre codigo, DTO e banco
  - [ ] aderencia ao dicionario oficial de termos

## 24. Estrategia de Dashboard com Materialized View

Objetivo: melhorar performance e estabilidade dos dashboards com dados agregados precomputados.

### 24.1 Decisao Arquitetural
- Recomendado usar `materialized view` para consultas analiticas de:
  - faturamento por periodo
  - indicadores por profissional
  - indicadores por servico
  - taxas de conclusao/cancelamento

### 24.2 Beneficios
- Reduz tempo de resposta em consultas pesadas.
- Diminui custo de CPU em agregacoes repetitivas.
- Garante previsibilidade de performance sob carga.

### 24.3 Trade-offs
- Dados nao sao estritamente tempo real (dependem de refresh).
- Exige estrategia de atualizacao e monitoramento de refresh.
- Possivel lock/custo se refresh for mal configurado.

### 24.4 Regras de Implementacao
- DASH-MV001: criar MVs separadas por dominio analitico (geral, profissional, servico).
- DASH-MV002: manter indice nas chaves de filtro (tenant, data, profissional, servico).
- DASH-MV003: atualizar a cada 2 minutos e tambem em evento critico.
- DASH-MV004: implementar fallback para query direta quando MV indisponivel/desatualizada.
- DASH-MV005: registrar tempo de refresh e timestamp de ultima atualizacao.

### 24.5 Modelo de Atualizacao (padrao adotado)
- Refresh periodico:
  - job agendado (cron) para `refresh materialized view`.
- Refresh orientado a evento:
  - acionar refresh parcial/assicrono em eventos de impacto:
    - agendamento concluido
    - agendamento cancelado
    - alteracao de transacao financeira

### 24.6 Requisitos Nao Funcionais para MV
- DASH-MV006: tempo de refresh deve ser monitorado e alertado quando exceder limite (ex.: > 60s).
- DASH-MV007: endpoint de dashboard deve responder com metadado `ultimaAtualizacao`.
- DASH-MV008: manter consistencia multi-tenant em todas as MVs.

### 24.7 Criticos para Banco (PostgreSQL)
- Usar `REFRESH MATERIALIZED VIEW CONCURRENTLY` em producao.
- Garantir indice unico necessario para refresh concorrente.
- Avaliar particionamento de tabelas base por data quando volume crescer.

### 24.8 Criterios de Aceite
- [ ] dashboards principais respondem no SLA definido mesmo sob carga.
- [ ] metrica `ultimaAtualizacao` exibida e coerente.
- [ ] fallback validado em cenario de falha de refresh.
- [ ] refresh monitorado com log e alerta operacional.

## 25. Funcionalidades Competitivas (Benchmark ERP) com Regras e Requisitos

Objetivo: elevar competitividade frente a ERPs e plataformas de gestao mais usadas no mercado.

### 25.1 Financeiro Avancado

#### 25.1.1 Conciliacao bancaria automatica
- Requisitos funcionais:
  - RF-C001: importar extratos e conciliacoes por conta.
  - RF-C002: sugerir match automatico entre transacao interna e extrato.
  - RF-C003: permitir conciliacao manual com trilha de auditoria.
- Regras de negocio:
  - RB-C001: um lancamento nao pode ser conciliado duas vezes no mesmo periodo.
  - RB-C002: divergencias de valor acima do limite configurado exigem aprovacao manual.
- Requisitos nao funcionais:
  - RNF-C001: processamento de lote com feedback de progresso.
  - RNF-C002: rastreabilidade completa de conciliacoes (quem, quando, antes/depois).

#### 25.1.2 DRE e fluxo de caixa projetado
- Requisitos funcionais:
  - RF-C004: gerar DRE por periodo (mensal, trimestral, anual).
  - RF-C005: projetar fluxo de caixa com base em recorrencias e contas a pagar/receber.
- Regras de negocio:
  - RB-C003: classificacao de receitas/despesas por plano de contas obrigatoria para DRE.
  - RB-C004: projecoes devem separar confirmado vs previsto.
- Requisitos nao funcionais:
  - RNF-C003: consulta de DRE deve respeitar SLA de dashboard analitico.

#### 25.1.3 Centro de custo
- Requisitos funcionais:
  - RF-C006: configurar centros de custo por unidade/profissional/servico.
  - RF-C007: vincular lancamentos a centro de custo.
- Regras de negocio:
  - RB-C005: lancamentos sem centro de custo devem ir para categoria padrao.

### 25.2 Estoque, Compras e Fornecedores

#### 25.2.1 Estoque com consumo por servico
- Requisitos funcionais:
  - RF-C008: cadastrar produtos/insumos com custo, estoque minimo e unidade.
  - RF-C009: debitar estoque automaticamente quando servico concluido.
- Regras de negocio:
  - RB-C006: consumo por servico deve ser configuravel por ficha tecnica.
  - RB-C007: bloquear venda quando estoque insuficiente; permitir override apenas para perfil OWNER com auditoria.
- Requisitos nao funcionais:
  - RNF-C004: controle de estoque com consistencia transacional.

#### 25.2.2 Compras e fornecedores
- Requisitos funcionais:
  - RF-C010: registrar pedido de compra, recebimento e custo final.
  - RF-C011: manter cadastro de fornecedores e historico de preco.
- Regras de negocio:
  - RB-C008: recebimento parcial deve atualizar saldo pendente do pedido.
  - RB-C009: custo medio deve ser recalculado no recebimento.

### 25.3 Operacao de Salao (Diferencial Vertical)

#### 25.3.1 Pacotes e assinaturas de servico
- Requisitos funcionais:
  - RF-C012: criar pacotes com franquia de sessoes.
  - RF-C013: controlar consumo e vencimento de pacote.
- Regras de negocio:
  - RB-C010: nao permitir uso de pacote vencido sem regra de excecao.
  - RB-C011: estorno de sessao em cancelamento deve ocorrer somente se cancelado ate 24h antes do horario agendado.

#### 25.3.2 Comissao avancada
- Requisitos funcionais:
  - RF-C014: comissao por servico, meta e bonus.
  - RF-C015: simulacao de comissao antes de fechamento do periodo.
- Regras de negocio:
  - RB-C012: cancelamentos e no-show devem estornar 100% da comissao quando nao houver atendimento concluido.
  - RB-C013: fechamento de comissao congela calculo do periodo.

#### 25.3.3 Lista de espera e encaixe inteligente
- Requisitos funcionais:
  - RF-C016: registrar clientes em espera por servico/profissional/horario.
  - RF-C017: sugerir encaixes automaticamente em vagas abertas.
- Regras de negocio:
  - RB-C014: prioridade por ordem de entrada + regras de preferencia configuradas.

#### 25.3.4 No-show score e politica automatica
- Requisitos funcionais:
  - RF-C018: calcular score de no-show por cliente.
  - RF-C019: aplicar regras automaticas (confirmacao obrigatoria, sinal, bloqueio temporario).
- Regras de negocio:
  - RB-C015: score considera historico com peso maior para eventos recentes.

### 25.4 CRM e Relacionamento

#### 25.4.1 Automacoes de marketing/retencao
- Requisitos funcionais:
  - RF-C020: campanhas por segmento (inatividade, aniversario, ticket medio).
  - RF-C021: automacao de rebook apos conclusao de servico.
- Regras de negocio:
  - RB-C016: respeitar consentimento/canal permitido do cliente.
  - RB-C017: evitar disparos duplicados na mesma janela de campanha.
- Requisitos nao funcionais:
  - RNF-C005: processamento assicrono de campanhas com reprocessamento seguro.

#### 25.4.2 Prontuario do cliente
- Requisitos funcionais:
  - RF-C022: manter historico tecnico (preferencias, alergias, observacoes, fotos autorizadas).
- Regras de negocio:
  - RB-C018: acesso restrito por perfil e auditoria de visualizacao/edicao.

### 25.5 Escala e Governanca

#### 25.5.1 Multiunidade
- Requisitos funcionais:
  - RF-C023: suportar multiplas unidades por tenant.
  - RF-C024: dashboards por unidade e consolidado.
- Regras de negocio:
  - RB-C019: dados operacionais por unidade com consolidacao controlada por permissao.

#### 25.5.2 Acesso granular e auditoria
- Requisitos funcionais:
  - RF-C025: controle de permissao por acao (criar, editar, excluir, aprovar).
  - RF-C026: trilha de auditoria para entidades criticas.
- Regras de negocio:
  - RB-C020: acoes sensiveis exigem registro de usuario, data/hora e payload.

### 25.6 Priorizacao recomendada para competitividade
- Fase 1 (alto impacto, menor complexidade):
  - conciliacao basica
  - comissao avancada
  - automacao de rebook
  - no-show score
- Fase 2 (alto impacto, media complexidade):
  - estoque por ficha tecnica
  - compras/fornecedores
  - centros de custo
  - multiunidade inicial
- Fase 3 (alto impacto, alta complexidade):
  - DRE completo e previsao avancada
  - trilha de auditoria completa
  - automacoes de CRM em escala

## 26. Agendamento via WhatsApp (especificacao)

Objetivo: permitir que o cliente agende pelo WhatsApp com fluxo guiado e integrado ao calendario.

### 26.1 Escopo funcional
- Iniciar conversa e identificar tenant/salao.
- Coletar servico, profissional (campo "qualquer profissional" permitido), data e horario.
- Confirmar dados do cliente com nome e telefone obrigatorios; email opcional.
- Criar agendamento e retornar comprovante.
- Suportar remarcacao/cancelamento e rebook (fase evolutiva).

### 26.2 Fluxo conversacional minimo
1. Cliente envia mensagem inicial.
2. Sistema apresenta menu de servicos ativos.
3. Cliente escolhe servico.
4. Sistema consulta profissionais aptos ao servico.
5. Cliente escolhe profissional (ou opcao \"qualquer profissional\").
6. Sistema apresenta datas/horarios disponiveis.
7. Cliente confirma horario e dados pessoais.
8. Sistema cria agendamento e envia confirmacao final.

### 26.3 Requisitos funcionais (WhatsApp)
- RF-WA001: receber mensagens via webhook da Meta/WhatsApp Cloud API.
- RF-WA002: manter estado da conversa por cliente (sessao conversacional).
- RF-WA003: listar servicos ativos do tenant no canal WhatsApp.
- RF-WA004: listar profissionais filtrados por `serviceId`.
- RF-WA005: consultar disponibilidade por data/servico/profissional.
- RF-WA006: criar agendamento ao final do fluxo.
- RF-WA007: enviar mensagem de confirmacao com resumo do agendamento.
- RF-WA008: registrar historico de mensagens e eventos da conversa.

### 26.4 Regras de negocio (WhatsApp)
- RB-WA001: conversa deve ser associada a tenant por numero receptor/instancia configurada.
- RB-WA002: servico inativo nao pode ser ofertado no menu.
- RB-WA003: se servico tiver `professionalIds`, so esses profissionais podem ser ofertados.
- RB-WA004: horario escolhido deve ser reservado apenas se continuar disponivel no momento da confirmacao.
- RB-WA005: em conflito de horario na confirmacao, sistema deve oferecer nova opcao sem encerrar fluxo.
- RB-WA006: timeout de sessao conversacional de 30 minutos de inatividade deve exigir retomada controlada.
- RB-WA007: mensagens fora de contexto devem cair em fallback para menu principal.

### 26.5 Requisitos nao funcionais (WhatsApp)
- RNF-WA001: processamento assincrono de mensagens para evitar timeout de webhook.
- RNF-WA002: idempotencia por `messageId` para nao processar mensagem duplicada.
- RNF-WA003: latencia alvo de resposta conversacional <= 2s para mensagens de menu e <= 5s para mensagens com consulta externa.
- RNF-WA004: observabilidade com logs estruturados por `tenantId`, `telefoneCliente`, `conversaId`.
- RNF-WA005: mascarar dados sensiveis em logs (telefone/email/documento).

### 26.6 DTOs/Payloads recomendados

#### Entrada de webhook
```json
{
  "messageId": "wamid.HBg...",
  "from": "5511999999999",
  "to": "5511888888888",
  "timestamp": "2026-02-27T12:00:00Z",
  "type": "text",
  "text": "Quero agendar corte"
}
```

#### Estado da conversa
```json
{
  "conversaId": "uuid",
  "tenantId": "uuid",
  "telefoneCliente": "5511999999999",
  "etapa": "ESCOLHA_HORARIO",
  "servicoId": "uuid-servico",
  "profissionalId": "uuid-profissional",
  "dataDesejada": "2026-03-01",
  "horarioDesejado": "14:30",
  "expiraEm": "2026-02-27T12:30:00Z"
}
```

#### Confirmacao final
```json
{
  "status": "CONFIRMADO",
  "agendamentoId": "uuid-agendamento",
  "mensagem": "Agendamento confirmado para 01/03 as 14:30 com Maria."
}
```

### 26.7 Rotas recomendadas (backend)
- `POST /whatsapp/webhook`
  - recebe evento de mensagem/status, valida assinatura e enfileira processamento.
- `GET /whatsapp/webhook` (verificacao Meta)
  - endpoint de challenge para validar integracao.
- `POST /whatsapp/conversas/{conversaId}/continuar` (interno/opcional)
  - avanca fluxo com base na etapa e entrada do cliente.
- `POST /whatsapp/mensagens/enviar` (interno)
  - envio centralizado de mensagem/template.
- `GET /whatsapp/conversas/{conversaId}` (suporte/operacao)
  - consulta estado atual da conversa.

### 26.8 Status HTTP sugeridos (WhatsApp)
- `POST /whatsapp/webhook`: `200` (ack rapido), erros `400/401/403/500`
- `GET /whatsapp/webhook`: `200`, erros `400/403/500`
- `POST /whatsapp/conversas/{id}/continuar`: `200`, erros `400/404/409/422/500`
- `POST /whatsapp/mensagens/enviar`: `202`, erros `400/401/403/422/500`
- `GET /whatsapp/conversas/{id}`: `200`, erros `401/403/404/500`

### 26.9 Checklist de homologacao (WhatsApp)
- [ ] Webhook validado com a Meta (challenge e assinatura).
- [ ] Fluxo completo de agendamento executado por conversa real.
- [ ] Regras de `servico -> profissionais` respeitadas.
- [ ] Conflito de horario tratado sem perda de contexto.
- [ ] Mensagem de confirmacao enviada com `agendamentoId`.
- [ ] Idempotencia de mensagens duplicadas validada.

## 27. Assistente de Agendamento WhatsApp (Backend com Apache OpenNLP)

Observacao de tecnologia:
- Neste documento, `openPNL` foi padronizado como `Apache OpenNLP`.

### 27.1 Objetivo
- Implementar um assistente conversacional no backend para conduzir agendamento via WhatsApp, com entendimento de intencao e entidades usando Apache OpenNLP.

### 27.2 Arquitetura do Assistente
- Componentes obrigatorios:
  - `WebhookWhatsAppResource`: recebe evento da Meta e valida assinatura.
  - `ProcessadorMensagensServico`: normaliza mensagem e aplica idempotencia por `messageId`.
  - `MotorNlpOpenNlpServico`: classifica intencao e extrai entidades.
  - `OrquestradorConversaServico`: controla estado/etapa da conversa.
  - `ExecutorAgendamentoServico`: consulta servicos/profissionais/horarios e cria agendamento.
  - `GatewayWhatsAppServico`: envia resposta para Cloud API.
  - `RepositorioConversaWhatsApp`: persiste estado e historico.
- Fluxo tecnico:
  1. Webhook recebe mensagem e grava evento bruto.
  2. Mensagem entra em fila assicrona.
  3. NLP identifica `intencao` e `entidades`.
  4. Orquestrador decide proxima etapa.
  5. Sistema consulta agenda e responde ao cliente.
  6. Ao confirmar, cria agendamento e envia comprovante.

### 27.3 Pipeline NLP (Apache OpenNLP)
- Intencoes minimas:
  - `SAUDACAO`
  - `AGENDAR`
  - `REMARCAR`
  - `CANCELAR`
  - `CONSULTAR_HORARIOS`
  - `AJUDA`
- Entidades minimas:
  - `servico_nome`
  - `profissional_nome`
  - `data`
  - `hora`
  - `nome_cliente`
  - `telefone_cliente`
- Regras de fallback:
  - Confianca NLP < 0.70: voltar para menu guiado por botoes/lista.
  - 2 falhas consecutivas de entendimento: transferir para atendimento humano ou menu simplificado.

### 27.4 Maquina de Estados da Conversa
- Estados obrigatorios:
  - `INICIO`
  - `ESCOLHA_SERVICO`
  - `ESCOLHA_PROFISSIONAL`
  - `ESCOLHA_DATA`
  - `ESCOLHA_HORARIO`
  - `DADOS_CLIENTE`
  - `CONFIRMACAO`
  - `FINALIZADO`
  - `CANCELADO`
- Regras:
  - Timeout de sessao: 30 minutos.
  - Ao expirar: mover para `CANCELADO` e enviar instrucoes de retomada.
  - Toda transicao deve ser persistida com timestamp.

### 27.5 Configuracao WhatsApp por Cliente (tenant)
- Cada tenant deve ter configuracao isolada.
- Campos obrigatorios por tenant:
  - `numeroRemetente`
  - `phoneNumberId`
  - `businessAccountId`
  - `tokenAcesso`
  - `verifyToken`
  - `webhookSecret`
  - `fusoHorario`
  - `idiomaPadrao`
  - `ativo`
- Campos funcionais recomendados:
  - `mensagemBoasVindas`
  - `mensagemFallback`
  - `mensagemConfirmacao`
  - `permitirQualquerProfissional`
  - `janelaDiasDisponiveis`
  - `horaInicioAtendimentoBot`
  - `horaFimAtendimentoBot`

### 27.6 Rotas de Configuracao por Cliente
- `GET /api/v1/whatsapp/config`
  - Retorna configuracao do tenant autenticado (sem expor token em texto plano).
- `PUT /api/v1/whatsapp/config`
  - Atualiza configuracao do tenant e valida campos obrigatorios.
- `POST /api/v1/whatsapp/config/testar-conexao`
  - Testa credenciais/numero e retorna diagnostico resumido.
- `POST /api/v1/whatsapp/config/ativar`
  - Ativa integracao para o tenant.
- `POST /api/v1/whatsapp/config/desativar`
  - Desativa integracao para o tenant.
- `GET /api/v1/whatsapp/config/modelos`
  - Lista templates de mensagem disponiveis por tenant.

### 27.7 DTOs Minimos
- `WhatsappConfigRequisicaoDto`:
  - `numeroRemetente`, `phoneNumberId`, `businessAccountId`, `tokenAcesso`, `verifyToken`, `webhookSecret`, `fusoHorario`, `idiomaPadrao`, `ativo`
- `WhatsappConfigRespostaDto`:
  - `id`, `tenantId`, `numeroRemetente`, `phoneNumberId`, `businessAccountId`, `fusoHorario`, `idiomaPadrao`, `ativo`, `atualizadoEm`
- `ResultadoNlpDto`:
  - `intencao`, `confianca`, `entidades`, `acaoSugerida`
- `EventoConversaDto`:
  - `conversaId`, `estadoAnterior`, `estadoAtual`, `mensagemEntrada`, `mensagemSaida`, `criadoEm`

### 27.8 Modelo de Banco (Assistente WhatsApp)
- `whatsapp_config`
  - `id`, `tenant_id`, `numero_remetente`, `phone_number_id`, `business_account_id`, `token_criptografado`, `verify_token_hash`, `webhook_secret_hash`, `fuso_horario`, `idioma_padrao`, `ativo`, `criado_em`, `atualizado_em`
- `whatsapp_conversa`
  - `id`, `tenant_id`, `telefone_cliente`, `estado_atual`, `servico_id`, `profissional_id`, `data_desejada`, `horario_desejado`, `expira_em`, `criado_em`, `atualizado_em`
- `whatsapp_conversa_evento`
  - `id`, `conversa_id`, `message_id`, `direcao`, `payload_json`, `intencao`, `confianca`, `estado_anterior`, `estado_atual`, `criado_em`
- `whatsapp_mensagem_fila`
  - `id`, `tenant_id`, `message_id`, `status`, `tentativas`, `proxima_tentativa_em`, `erro_codigo`, `erro_mensagem`, `criado_em`, `atualizado_em`

### 27.9 Seguranca e Compliance
- Token de API do WhatsApp deve ser armazenado criptografado.
- `verifyToken` e `webhookSecret` devem ser armazenados somente como hash.
- Logs devem mascarar telefone/documento.
- Webhook deve validar assinatura da Meta antes de enfileirar processamento.
- Rotas de configuracao devem exigir perfil `OWNER`.

### 27.10 Criterios de Aceite
- [ ] Tenant consegue configurar e testar conexao do WhatsApp sem suporte tecnico.
- [ ] Assistente identifica intencao `AGENDAR` com confianca >= 0.70 em cenarios basicos.
- [ ] Fluxo completo cria agendamento valido e envia confirmacao.
- [ ] Conversa expirada e mensagens duplicadas sao tratadas sem criar agendamento duplicado.
- [ ] Configuracoes permanecem isoladas por tenant.

## 28. Menus, Rotas e Roles Dinamicos por Banco (RBAC configuravel)

Objetivo:
- Definir que menus e acessos por perfil sejam carregados do banco, sem hardcode de regra no frontend.

### 28.1 Principios obrigatorios
- RBAC-001: o frontend deve consumir menus/permissoes apenas via API (`/config/menus/current`), nunca por lista fixa no codigo.
- RBAC-002: o backend deve ser a fonte de verdade de permissao por role.
- RBAC-003: toda rota privada deve ser validada no backend, mesmo que o frontend esconda menu.
- RBAC-004: configuracao deve suportar override por tenant sem alterar codigo.
- RBAC-005: toda alteracao de permissao/menu deve gerar auditoria.

### 28.2 Modelo de dados minimo (banco)
- `menu_item`
  - `id`, `chave`, `titulo`, `rota`, `icone`, `ordem`, `modulo`, `ativo`
- `perfil`
  - `id`, `codigo` (`OWNER`, `PROFESSIONAL`, `RECEPCIONISTA`, `FINANCEIRO`), `descricao`, `ativo`
- `perfil_menu_permissao`
  - `id`, `perfil_id`, `menu_item_id`, `pode_visualizar`, `pode_criar`, `pode_editar`, `pode_excluir`, `pode_aprovar`
- `tenant_perfil_menu_override`
  - `id`, `tenant_id`, `perfil_id`, `menu_item_id`, `habilitado`, `permissoes_json`, `atualizado_em`
- `auditoria_permissao`
  - `id`, `tenant_id`, `ator_usuario_id`, `perfil_id`, `menu_item_id`, `antes_json`, `depois_json`, `criado_em`

### 28.3 Regras de resolucao de permissao
- RBAC-006: ordem de resolucao deve ser: `override tenant` -> `perfil_menu_permissao` -> `deny`.
- RBAC-007: menu so deve ser retornado se `menu_item.ativo=true` e permissao `pode_visualizar=true`.
- RBAC-008: rotas sem registro no banco devem ser bloqueadas por padrao (`deny by default`).
- RBAC-009: perfil `OWNER` deve ter acesso total por padrao, respeitando apenas bloqueios tecnicos/de plano.
- RBAC-010: perfil `PROFESSIONAL` deve acessar apenas agenda propria, clientes vinculados e financeiro proprio.
- RBAC-011: alteracao de permissao deve entrar em vigor imediatamente apos persistencia.

### 28.4 Matriz padrao de menus por perfil
- OWNER:
  - acesso completo a dashboard, agenda, servicos, especialidades, profissionais, clientes, financeiro, fiscal, licenca e configuracoes.
- PROFESSIONAL:
  - acesso a dashboard resumido, agenda, clientes (limitado), financeiro por profissional, perfil.
  - sem acesso a configuracoes fiscais, licenca e gestao de usuarios.
- RECEPCIONISTA (quando habilitado):
  - acesso a agenda, clientes, cadastro basico de agendamento e consulta de servicos/profissionais.
  - sem acesso a financeiro sensivel, fiscal e configuracoes administrativas.
- FINANCEIRO (quando habilitado):
  - acesso a financeiro, fiscal, licenca e relatorios.
  - sem acesso a cadastro tecnico de agenda/equipe (salvo permissao explicita).

### 28.5 Endpoints obrigatorios (backend)
- `GET /api/v1/config/menus/current`
  - Retorna menus e permissoes efetivas do usuario autenticado.
- `GET /api/v1/config/menus/perfis`
  - Lista perfis disponiveis no tenant.
- `GET /api/v1/config/menus/perfis/{perfilCodigo}`
  - Retorna matriz de permissoes do perfil.
- `PUT /api/v1/config/menus/perfis/{perfilCodigo}`
  - Atualiza matriz base do perfil (escopo tenant, se permitido pelo plano).
- `PUT /api/v1/config/menus/perfis/{perfilCodigo}/itens/{menuChave}`
  - Atualiza permissao de item especifico.
- `POST /api/v1/config/menus/recarregar`
  - Invalida cache de menus/permissoes para aplicar alteracoes imediatas.

### 28.6 Contrato de resposta recomendado
```json
{
  "role": "PROFESSIONAL",
  "allowedRoutes": ["/dashboard", "/agenda", "/clientes", "/financeiro/profissionais"],
  "menus": [
    {
      "key": "financeiro_profissional",
      "label": "Financeiro Profissional",
      "route": "/financeiro/profissionais",
      "permissions": {
        "view": true,
        "create": false,
        "edit": false,
        "delete": false,
        "approve": false
      }
    }
  ],
  "version": 12,
  "updatedAt": "2026-02-27T12:00:00Z"
}
```

### 28.7 Status HTTP esperados
- `GET /config/menus/current`: `200`, erros `401/403/500`
- `GET /config/menus/perfis`: `200`, erros `401/403/500`
- `GET /config/menus/perfis/{perfilCodigo}`: `200`, erros `401/403/404/500`
- `PUT /config/menus/perfis/{perfilCodigo}`: `200`, erros `400/401/403/404/422/500`
- `PUT /config/menus/perfis/{perfilCodigo}/itens/{menuChave}`: `200`, erros `400/401/403/404/422/500`
- `POST /config/menus/recarregar`: `202`, erros `401/403/500`

### 28.8 Regras de frontend
- O frontend deve renderizar menu somente com base no payload de `/config/menus/current`.
- Guard de rota deve validar `allowedRoutes` retornado pelo backend.
- Itens de menu ocultos nao devem impedir validacao de seguranca no backend.
- Em ausencia do endpoint de menu, o frontend deve aplicar modo seguro: sem menu administrativo e bloquear rotas sensiveis.

### 28.9 Criterios de aceite
- [ ] Alterar permissao de perfil no banco reflete no frontend sem novo deploy.
- [ ] Usuario sem permissao nao visualiza menu e recebe `403` ao tentar URL direta.
- [ ] Override por tenant funciona sem afetar outros tenants.
- [ ] Auditoria registra antes/depois em toda alteracao de permissao.

## 29. Lacunas Obrigatorias Antes da Execucao (Go-Live Readiness)

Objetivo:
- Registrar decisoes que ainda precisam ser fechadas para iniciar o projeto com baixo retrabalho.

### 29.1 Operacao e Confiabilidade
- GLR-001: definir SLO/SLA oficial por jornada critica:
  - login: p95 <= 1,5s
  - agenda: p95 <= 2,0s
  - agendamento publico: p95 <= 2,5s
  - disponibilidade mensal alvo >= 99,5%
- GLR-002: definir RTO e RPO de recuperacao:
  - RTO maximo: 4h
  - RPO maximo: 15min
- GLR-003: definir capacidade inicial e teste de carga para 5.000 usuarios totais.

### 29.2 Contrato de API e Erros
- GLR-004: publicar catalogo oficial de erros por dominio com `code`, `message`, `details`.
- GLR-005: padronizar status HTTP por endpoint sem alternativas (`ou`).
- GLR-006: congelar versao inicial de contrato em `/api/v1` e politica de compatibilidade.

### 29.3 Banco e Migracoes
- GLR-007: definir estrategia de migracao (Flyway ou Liquibase) e convention de nome de script.
- GLR-008: definir politica de soft delete/historico por entidade critica.
- GLR-009: definir estrategia de backup e restore com teste mensal.

### 29.4 Seguranca e LGPD
- GLR-010: definir rotacao de segredos e credenciais (Asaas, WhatsApp, provider fiscal).
- GLR-011: criptografia obrigatoria de dados sensiveis em repouso e em transito.
- GLR-012: definir politica de retencao e descarte de dados pessoais (LGPD).
- GLR-013: definir trilha de auditoria obrigatoria para operacoes sensiveis.

### 29.5 Fiscal e Compliance
- GLR-014: validar regras fiscais com contador responsavel (emissao, cancelamento, estorno, janela legal).
- GLR-015: homologar provider fiscal e politica de contingencia.
- GLR-016: fechar regra unica de arredondamento e totals para nota fiscal.

### 29.6 Qualidade e Entrega
- GLR-017: definir piramide de testes minima:
  - unitario >= 70% nos modulos de regra
  - integracao para endpoints criticos
  - E2E para fluxos criticos (login, agenda, publico, billing)
- GLR-018: definir quality gate no CI (build + lint + testes obrigatorios).
- GLR-019: definir checklist de release com evidencia por RF critico.

### 29.7 Observabilidade
- GLR-020: implementar logs estruturados por `empresa_id`, `usuario_id`, `request_id`.
- GLR-021: implementar metricas de negocio e tecnica (latencia, erro, taxa de conversao do agendamento).
- GLR-022: configurar alertas operacionais (erro alto, queda de webhook, fila travada).

### 29.8 Rollout e Deploy
- GLR-023: definir ambientes (`dev`, `hml`, `prod`) com dados segregados.
- GLR-024: definir estrategia de feature flags para rollout gradual.
- GLR-025: definir plano de rollback tecnico e funcional.

### 29.9 Criterios de aceite da prontidao
- [ ] Todos GLR-001..025 com responsavel e prazo definido.
- [ ] Riscos altos sem mitigacao devem bloquear go-live.
- [ ] Checklist de release deve estar versionado e assinado pelo responsavel tecnico.

## 30. Features Prioritarias para Competitividade (MVP+)

### 30.1 Curto prazo (0-90 dias)
- FC-001: lembrete e confirmacao automatica via WhatsApp.
- FC-002: rebook automatico apos servico concluido.
- FC-003: score de no-show com regra automatica de confirmacao.
- FC-004: comissao avancada por servico/meta.
- FC-005: conciliacao financeira basica.

### 30.2 Medio prazo (3-6 meses)
- FC-006: estoque por ficha tecnica com baixa automatica.
- FC-007: compras e fornecedores com custo medio.
- FC-008: centros de custo e DRE simplificada.
- FC-009: automacoes segmentadas de CRM (inatividade/aniversario/ticket).

### 30.3 Criterio de priorizacao
- Priorizar por `impacto no faturamento` + `risco operacional` + `complexidade tecnica`.
- Toda feature deve ter RF, RB, RNF e plano de homologacao antes da implementacao.

---
Fonte de verdade utilizada: codigo atual em `src/` (rotas, contexts, hooks, providers, paginas e integracoes em `src/lib/api.ts`).
