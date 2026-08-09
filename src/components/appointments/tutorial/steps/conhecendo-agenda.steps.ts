import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Módulo 1 — Conhecendo a agenda: visão geral, navegação de datas,
 * alternância dia/semana/mês, leitura de horários livres/ocupados e filtros.
 */
export const CONHECENDO_AGENDA_STEPS: GuidedTourStep[] = [
  {
    route: "/agenda",
    target: '[data-tour="agenda-summary"]',
    title: "Bem-vinda à Agenda",
    content:
      "Aqui você acompanha o movimento do salão: total de agendamentos, pendentes, em atendimento e concluídos do período selecionado.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-date-nav"]',
    title: "Navegue entre os dias",
    content:
      "Use as setas para ir ao dia (ou semana/mês) anterior e seguinte, ou clique em \"Hoje\" para voltar direto para a data atual.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-view-toggle"]',
    title: "Troque a visão",
    content:
      "Dia mostra a grade de horários para operar o salão. Semana dá uma visão rápida dos próximos 7 dias. Mensal mostra a distribuição de agendamentos no calendário do mês.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-day-grid"]',
    title: "Horários livres e ocupados",
    content:
      "Horários vazios aparecem com um botão \"+\" para criar um novo agendamento. Horários ocupados mostram um card colorido com cliente, serviço e status do atendimento.",
    placement: "top",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-filter-professional"]',
    title: "Filtrar por profissional",
    content:
      "Escolha um profissional para ver só a agenda dele, ou deixe em \"Todos\" para ver o movimento geral do salão.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-filter-status"]',
    title: "Filtrar por status",
    content:
      "Filtre por status (pendente, confirmado, em atendimento, concluído, cancelado, não compareceu) para focar no que precisa da sua atenção agora.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-new-appointment-button"]',
    title: "Pronta para agendar",
    content:
      "Este é o botão para criar um novo agendamento. No próximo módulo do tutorial vamos usá-lo passo a passo.",
    placement: "bottom",
  },
];
