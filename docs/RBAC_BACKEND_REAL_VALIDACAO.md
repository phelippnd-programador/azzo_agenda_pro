# Validacao RBAC com Backend Real

Objetivo: fechar os cenarios obrigatorios de RBAC dinamico com evidencia objetiva.

## Pre-requisitos
- Backend real ativo com endpoint `/api/v1/config/menus/current`.
- Usuario OWNER e PROFESSIONAL ativos no mesmo tenant.
- Acesso a configuracao de permissoes no backend (ou via banco/herramenta admin).

## Cenarios obrigatorios

### RBAC-01: ocultacao de menu sem deploy
1. Remover permissao de uma rota para um perfil.
2. Fazer login com usuario do perfil.
3. Validar que o item sumiu do menu.

Esperado:
- item oculto imediatamente apos refresh/sessao.

Evidencia:
- print do menu antes/depois;
- payload de `/config/menus/current`.

### RBAC-02: URL direta sem permissao retorna bloqueio
1. Com usuario sem permissao, abrir rota bloqueada via URL.
2. Validar redirecionamento para `/unauthorized` no frontend.
3. Validar `403` na API protegida.

Esperado:
- frontend bloqueia navegacao;
- backend responde `403`.

Evidencia:
- print da tela `/unauthorized`;
- network com `403`.

### RBAC-03: override por tenant
1. Aplicar override no tenant A para um menu.
2. Validar tenant A alterado.
3. Validar tenant B sem alteracao.

Esperado:
- isolamento de tenant preservado.

Evidencia:
- payload de `/config/menus/current` em ambos tenants.

### RBAC-04: recarga de cache de menu
1. Alterar permissao no backend.
2. Acionar endpoint de recarga (quando existir).
3. Validar aplicacao imediata no frontend.

Esperado:
- sem necessidade de deploy/restart frontend.

### RBAC-05: auditoria de alteracao
1. Alterar permissao por perfil/menu.
2. Consultar trilha de auditoria no backend.

Esperado:
- registro com antes/depois, ator e timestamp.

## Registro de execucao
- Data/Hora:
- Ambiente:
- Tenant:
- Usuario:
- Commit frontend:
- Resultado:
- Pendencias:

