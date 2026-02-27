# Smoke Frontend (Demo Local)

Data: 2026-02-27
Objetivo: validar fluxos criticos do frontend sem backend usando `Acesso Rapido Demo Local`.

## Pre-condicao
- Iniciar frontend.
- Acessar `/login`.
- Clicar em `Acesso Rapido Demo Local`.

## Fluxos criticos
1. Autenticacao e guardas
- Entrar em `/dashboard` apos login demo.
- Tentar abrir rota protegida sem sessao (logout) e validar redirecionamento para `/login`.
- Validar acesso a `/unauthorized` sem loop.

2. Navegacao principal
- Abrir menu lateral e navegar por: Dashboard, Agenda, Servicos, Profissionais, Clientes, Financeiro, Fiscal, Configuracoes.
- Validar render sem erro e sem tela em branco.

3. Agenda
- Criar agendamento.
- Alterar status.
- Reatribuir profissional.
- Excluir agendamento.

4. Servicos e Profissionais
- Criar/editar/excluir servico.
- Validar `professionalIds` no formulario de servico.
- Criar/editar/inativar profissional.

5. Clientes
- Criar/editar/excluir cliente.
- Validar filtros e busca.

6. Financeiro
- Criar/excluir transacao.
- Validar cards de resumo (entrada/saida/saldo).

7. Fiscal
- Configurar impostos.
- Pre-visualizar nota.
- Emitir nota (demo).
- Listar/cancelar nota.
- Abrir apuracao mensal.

8. Licenca e checkout
- Abrir `/financeiro/licenca`.
- Trocar metodo de pagamento.
- Validar visualizacao de PIX/BOLETO.
- Validar historico de pagamentos.

9. Agendamento publico
- Abrir `/agendar/azzo-demo`.
- Selecionar servico e clicar continuar.
- Validar carregamento de profissionais por `serviceId`.
- Concluir agendamento.

10. WhatsApp
- Abrir tela de integracao.
- Alterar configuracoes e salvar.
- Executar teste de conexao.

## Resultado
- Status atual: execucao tecnica realizada.
- Resultado:
  - build: OK (`npm run build`);
  - lint: OK (`npm run lint`);
  - tipagem: OK (`npx tsc --noEmit`);
  - fluxo demo local com perfis OWNER/PROFESSIONAL: validado no frontend;
  - guardas de rota + menu por `allowedRoutes`: validados.
- Observacao: evidencias visuais (prints/videos) e logs de rede por RF continuam pendentes para homologacao final com backend real.
