# Pacote de Evidencias RF (Frontend)

Data base: 2026-02-27  
Objetivo: centralizar evidencias para mover RFs da matriz de `EM_EXECUCAO` para `APROVADO`.

## Como usar
- Para cada bloco RF, anexar:
  - captura de tela da UI;
  - log de rede (request/response);
  - resultado esperado vs obtido;
  - commit/tag validado.
- Atualizar a coluna "Evidencia obrigatoria" na matriz com o link deste artefato.

## Evidencias por bloco RF
| Bloco RF | Rotas principais | Evidencia UI | Evidencia Network | Resultado esperado vs obtido | Commit/Tag | Status |
|---|---|---|---|---|---|---|
| RF-001..007 | `/login`, `/cadastro`, `/agendar/:slug` | Pendente | Pendente | Pendente | `acc3e80` | EM_EXECUCAO |
| RF-008..011 | rotas privadas + `/unauthorized` | Pendente | Pendente | Pendente | `acc3e80` | EM_EXECUCAO |
| RF-012..014 | `/dashboard` | Pendente | Pendente | Pendente | `acc3e80` | EM_EXECUCAO |
| RF-015..020 | `/agenda` | Pendente | Pendente | Pendente | `387ea2f` | EM_EXECUCAO |
| RF-021..028 | `/servicos`, `/profissionais`, `/clientes`, `/especialidades` | Pendente | Pendente | Pendente | `00a3219` | EM_EXECUCAO |
| RF-029..033 | `/financeiro`, `/financeiro/profissionais` | Pendente | Pendente | Pendente | `acc3e80` | EM_EXECUCAO |
| RF-034..037 | `/financeiro/licenca`, `/compras`, `/success`, `/error` | Pendente | Pendente | Pendente | `acc3e80` | EM_EXECUCAO |
| RF-038..042 | `/config-impostos`, `/nota-fiscal`, `/emitir-nota`, `/apuracao-mensal` | Pendente | Pendente | Pendente | `acc3e80` | EM_EXECUCAO |
| RF-043..045 | `/notificacoes` | Pendente | Pendente | Pendente | `acc3e80` | EM_EXECUCAO |
| RF-046..050 | `/perfil-salao`, `/configuracoes`, `/configuracoes/integracoes/whatsapp` | Pendente | Pendente | Pendente | `716ccea` | EM_EXECUCAO |
| RF-051..056 | `/agendar/:slug` | Pendente | Pendente | Pendente | `acc3e80` | EM_EXECUCAO |

## Evidencias RBAC dinamico
| Cenario | Evidencia | Status |
|---|---|---|
| RBAC-01 remover permissao e ocultar menu sem deploy | Pendente (backend real) | EM_EXECUCAO |
| RBAC-02 acesso URL direta sem permissao retorna `403` | Pendente (backend real) | EM_EXECUCAO |
| RBAC-03 override por tenant sem impacto cruzado | Pendente (backend real) | EM_EXECUCAO |
| RBAC-04 recarregar cache de permissoes | Pendente (backend real) | EM_EXECUCAO |
| RBAC-05 auditoria de permissao (antes/depois) | Pendente (backend real) | EM_EXECUCAO |

