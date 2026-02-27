# Auditoria API Frontend (Erros e Status HTTP)

Data: 2026-02-27

## 1. Padrao de erro unificado
- Parser central: [error-utils.ts](C:/Users/phelipp/Projetos/azzo-agenda/frontend/src/lib/error-utils.ts)
  - normaliza `message`, `code`, `status`, `details`, `path`, `timestamp`.
- Uso aplicado em hooks principais:
  - `useAppointments`, `useClients`, `useServices`, `useProfessionals`,
  - `useTransactions`, `useDashboard`, `useSpecialties`,
  - `useAvailableSlots`, `useCheckout`, `useCheckoutProducts`.
- Uso aplicado em paginas com chamada direta de API:
  - `PublicBooking`, `InvoiceEmission`, `ApuracaoMensal`, `Settings`.

Status: atendido.

## 2. Consistencia de status HTTP na UI
- Mapeamentos explicitos validados:
  - `404`:
    - login pos-autenticacao para assinatura (`Login.tsx`);
    - checkout (plano indisponivel).
  - `422`:
    - confirmacao de checkout (intent invalida/expirada).
  - `429`:
    - cadastro/venda (`Register.tsx`, `SalePage.tsx`).
  - `402` (`PLAN_EXPIRED`):
    - hooks tratam com `isPlanExpiredApiError` para nao quebrar UX.
  - `400`:
    - disponibilidade de agenda (`useAvailableSlots`) com mensagem orientativa.
  - `401`, `403`, `404`, `409`, `422`:
    - mensagens especificas em `services/billingService.ts`.

Status: atendido.

## 3. Pontos de excecao intencional
- Mensagens de validacao local de formulario permanecem diretas via `toast.error` (sem depender de API), por exemplo:
  - campos obrigatorios;
  - combinacao invalida de senha;
  - selecao de horario/profissional.

Justificativa: nao sao erros de contrato HTTP, e sim validacoes de entrada no frontend.
