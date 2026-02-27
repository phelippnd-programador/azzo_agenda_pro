# Pendencias de Backend para Fechamento do Frontend

Data de referencia: 2026-02-27

## 1. Homologacao RF com backend real
- Validar `403` real para acesso sem permissao por URL (RBAC-02).
- Validar override de menu por tenant sem impacto cruzado (RBAC-03).
- Validar recarga de cache de menus (`/config/menus/recarregar`) em ambiente integrado (RBAC-04).
- Validar trilha de auditoria de permissao no backend (RBAC-05).

## 2. Contratos e erros
- Garantir retorno padrao de erro em 100% dos endpoints usados pelo front:
  - `code`, `message`, `details`, `path`, `timestamp`.
- Revisar consistencia de status HTTP por endpoint (400/401/403/404/409/422/500) com casos reais.

## 3. Agendamento publico
- Confirmar validacao de conflito no backend para horario indisponivel com status e payload padrao.
- Confirmar regras de bloqueio por `professionalIds` e indisponibilidade por agenda real.

## 4. Financeiro e dashboard
- Confirmar entrega de dados de metricas com volume real para:
  - `/dashboard/metrics/professional`;
  - `/dashboard/metrics/services`.
- Alinhar limites de pagina/filtros para listagens financeiras.

## 5. Fiscal e licenciamento
- Validar fluxo completo de emissao/cancelamento fiscal com provedor real.
- Validar ciclo de assinatura/pagamento com Asaas em ambiente de homologacao.

## 6. Evidencias pendentes para aprovacao final
- Capturas de tela por RF critico.
- Logs de rede por caso de teste critico.
- Commit/tag de homologacao anexado na matriz RF.
