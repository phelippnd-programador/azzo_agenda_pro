# Checklist Frontend (Implementacao pelo Documento)

Objetivo: guiar a implementacao do frontend com base nos documentos de `/docs`.

## Status atual
- Atualizado em: 2026-02-27
- Progresso geral: bloco de base visual iniciado.
- Itens concluidos nesta rodada:
  - padronizacao inicial de cores globais via tokens CSS
  - escala tipografica configurada no Tailwind
  - loader global padronizado com Design System
  - guard de permissao ajustado para modo seguro (deny por padrao em falha sem cache)
  - sidebar migrada para cores semanticas (sem hardcode de violeta)
  - componentes reutilizaveis de estado (`PageErrorState`, `PageEmptyState`)
  - estados de erro/vazio aplicados em Dashboard, Agenda e Servicos
  - estados de erro aplicados em Financeiro, Clientes e Profissionais
  - hardcodes de cor removidos das paginas principais e migrados para tokens semanticos
  - padrao semantico aplicado tambem em Notificacoes, Configuracoes e Financeiro por Profissional
  - telas de entrada (Login, Cadastro, Recuperar Senha e Agendamento Publico) alinhadas ao tema semantico
  - telas fiscais e de perfil revisadas (Perfil do Salao, Apuracao, Configuracao de Impostos, Preview de Nota)
  - tela de Especialidades alinhada a tokens semanticos
  - limpeza adicional de textos/labels com encoding inconsistente nas telas revisadas
  - componentes compartilhados alinhados (Header, MainLayout, cards de Dashboard, lista/sino de Notificacoes, horarios sugeridos)
  - modulo fiscal refinado (cards de apuracao, preview de impostos, listagem/formulario/visualizacao de notas)
  - telas de checkout/sucesso/erro e pagina de licenca ajustadas para tokens semanticos e labels padronizadas
  - componentes de billing/vendas padronizados (seletor de plano, cartao, PIX, boleto e paines de oferta)
  - modo demo local sem backend com permissao total de rotas e botao de acesso rapido no login
  - pagina de vendas (`/compras`) alinhada ao tema semantico mantendo visual comercial
  - roteiro de smoke criado para validacao manual em demo local (`docs/SMOKE_FRONT_DEMO_LOCAL.md`)
  - padrao de erro unificado em hooks principais com parser central (`src/lib/error-utils.ts`)
  - paginas com API direta migradas para parser unificado de erro (`PublicBooking`, `InvoiceEmission`, `ApuracaoMensal`, `Settings`)
  - hooks complementares migrados para parser unificado (`useAvailableSlots`, `useCheckout`)
  - remocao de `as any` em fluxos principais (`Agenda`, `Dashboard`, `Profissionais`, `Perfil do Salao`)
  - sidebar passou a renderizar menu a partir de `allowedRoutes` (fonte: `/config/menus/current`)
  - login demo local por perfil (Owner e Profissional) para validar RBAC sem backend
  - contexto de permissoes sem bypass local fixo (sempre consome `menus/current`, inclusive demo)
  - camada de storage fiscal sem uso de `any`
  - responsividade mobile reforcada em dialogs principais (agenda, clientes, financeiro, emissao fiscal)
  - validacao de perfil OWNER e PROFESSIONAL com login demo local dedicado e menus por `allowedRoutes`
  - guardas de rota revisadas para redirecionar autenticado para primeira rota permitida (evita queda forçada em `/dashboard`)
  - validacao de tipos com `tsc --noEmit` sem erros
  - build validado apos ajustes

## 1. Preparacao
- [x] Validar branch de trabalho (`feature/alinhamento-completo-documentacao`).
- [x] Revisar `docs/REQUISITOS_VALIDACAO_SISTEMA.md`.
- [x] Revisar `docs/MATRIZ_HOMOLOGACAO_RF.md`.
- [x] Revisar `docs/PADRAO_LABELS_E_TEXTOS.md`.
- [x] Revisar `docs/ESTRUTURA_BASE_DADOS_RELACIONAL.md`.

## 2. Base tecnica e padroes UI
- [x] Aplicar Design System (cores, espacos, radius, sombras).
- [x] Aplicar escala tipografica padrao em todas as telas.
- [x] Garantir estados `loading`, `empty`, `error` em telas principais.
- [~] Padronizar labels/textos conforme documento.
- [x] Revisar responsividade desktop/mobile.

## 3. API e contratos
- [~] Padronizar tratamento de erro (`code`, `message`, `details`, `path`, `timestamp`).
- [~] Garantir consistencia de status HTTP tratados na UI.
- [x] Revisar tipos TypeScript para todos os DTOs usados.
- [x] Tratar fallback seguro quando endpoint de configuracao falhar.

## 4. Autenticacao e contexto
- [~] Validar login/cadastro/refresh/logout.
- [x] Validar isolamento de rotas publicas (`/agendar/:slug`) sem chamadas internas indevidas.
- [x] Revisar guardas de rota para autenticacao/permissao.

## 5. RBAC dinamico (menus por banco)
- [x] Consumir apenas `/config/menus/current` para renderizacao de menu.
- [x] Aplicar `allowedRoutes` no guard de navegacao.
- [x] Tratar bloqueio de acesso com redirecionamento para `/unauthorized`.
- [x] Validar comportamento por perfil (OWNER, PROFESSIONAL, etc.).

## 6. Modulos funcionais
- [x] Dashboard: metricas e graficos.
- [x] Agenda: CRUD + status + reatribuicao + disponibilidade.
- [x] Servicos: CRUD + `professionalIds` no create/update.
- [x] Profissionais: CRUD + ativacao/inativacao + reset senha.
- [x] Clientes: CRUD + filtros.
- [x] Financeiro geral: transacoes e resumo.
- [x] Financeiro por profissional: metricas e analise por servico.
- [x] Fiscal: configuracao, preview, emissao, listagem, cancelamento, apuracao.
- [x] Licenca/Checkout: fluxo de assinatura e pagamentos.

## 7. Agendamento publico
- [x] Fluxo em etapas completo (`/agendar/:slug`).
- [x] Buscar profissionais apenas apos selecionar servico e clicar em continuar.
- [x] Filtrar profissionais por `serviceId`.
- [x] Criar agendamento publico com validacoes de conflito.

## 8. WhatsApp (escopo frontend)
- [x] Tela de configuracao por tenant (`numero`, `token`, `verifyToken`, `phoneNumberId` etc.).
- [x] Acao de teste de conexao.
- [x] Acao de ativar/desativar integracao.
- [x] Exibir status da integracao e ultimo teste.

## 9. Qualidade e homologacao
- [x] Rodar build sem erro.
- [~] Executar smoke dos fluxos criticos.
- [x] Registrar evidencias na matriz RF.
- [x] Validar criterios de aceite (CA e GLR relevantes ao frontend).

## 10. Fechamento
- [x] Revisao final de consistencia visual e de textos.
- [x] Revisao final de rotas e permissoes.
- [x] Atualizar documentacao com pendencias de backend, se houver.
- [x] Preparar PR com resumo por modulo e evidencias.
