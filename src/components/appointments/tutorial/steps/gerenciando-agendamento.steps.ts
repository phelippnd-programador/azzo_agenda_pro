import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Módulo 3 — Gerenciando um agendamento: abrir os detalhes, acompanhar o
 * status, registrar observações do atendimento e confirmar presença.
 */
export const GERENCIANDO_AGENDAMENTO_STEPS: GuidedTourStep[] = [
  {
    route: "/agenda",
    target: '[data-tour="agenda-appointment-card"]',
    title: "Abrir um agendamento",
    content:
      "Clique em qualquer card de agendamento para ver os detalhes completos. Se não houver nenhum agendamento hoje, crie um no módulo \"Criando um agendamento\" e volte aqui. Depois de clicar, clique em Próximo.",
    placement: "right",
    spotlightClicks: true,
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-details-status"]',
    title: "Status do atendimento",
    content:
      "Aqui você vê o status atual e em que etapa do fluxo o atendimento está. A sequência padrão é: Pendente → Confirmado → Em atendimento → Concluído.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-details-notes"]',
    title: "Observações do atendimento",
    content:
      "Registre aqui o que foi feito, o retorno do cliente e o que fica para o próximo atendimento. Esses registros ficam salvos no histórico do cliente e ao menos um deles é obrigatório para concluir o atendimento.",
    placement: "top",
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-details-actions"]',
    title: "Avançar o status",
    content:
      "Confirmar, iniciar e concluir o atendimento é feito por aqui — os botões mudam conforme o status atual. Cancelar também fica nesta área.",
    placement: "top",
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-details-noshow"]',
    title: "Cliente não veio?",
    content:
      "Se o cliente não compareceu (e já passaram alguns minutos do horário marcado), use este botão para registrar a falta.",
    placement: "top",
  },
];
