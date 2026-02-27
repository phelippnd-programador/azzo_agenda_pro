# Roteiro Enxuto de Homologacao (Dia de Execucao)

Objetivo: executar os blocos RF em sequencia curta e mover status para `APROVADO` com evidencia.

## Ordem recomendada (frontend)
1. RF-001..007 (Autenticacao e Sessao)
2. RF-008..011 (Controle de Acesso)
3. RF-051..056 (Agendamento Publico)
4. RF-015..020 (Agenda)
5. RF-021..028 (Cadastros)
6. RF-029..033 (Financeiro)
7. RF-034..037 (Licenca e Checkout)
8. RF-038..042 (Fiscal)
9. RF-043..045 (Notificacoes)
10. RF-046..050 (Perfil e Configuracoes)
11. RBAC-001..011 (cenarios backend real)

## Passo a passo por bloco RF
Para cada bloco:
1. Executar fluxo funcional completo.
2. Salvar prints em `docs/EVIDENCIAS_RF/RF-xxx-yyy/`.
3. Capturar request/response no DevTools.
4. Registrar esperado vs obtido em `resultado.md`.
5. Atualizar:
   - `docs/PACOTE_EVIDENCIAS_RF_FRONT.md`
   - `docs/MATRIZ_HOMOLOGACAO_RF.md` (`Status = APROVADO`)

## Criterio de conclusao do dia
- RF criticos (autenticacao, agenda, publico, financeiro) em `APROVADO`.
- Nenhum RF critico em `REPROVADO` sem plano corretivo.
- Evidencias anexadas para cada bloco validado.

## Comandos uteis
```bash
npm run build
npm run lint
npx tsc --noEmit
```

