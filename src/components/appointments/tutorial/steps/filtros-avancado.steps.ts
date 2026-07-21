import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Módulo 6 — Filtros e recursos avançados: combinar filtros, período de
 * visualização e ações rápidas direto no calendário.
 */
export const FILTROS_AVANCADO_STEPS: GuidedTourStep[] = [
  {
    route: "/agenda",
    target: '[data-tour="agenda-filter-professional"]',
    title: "Combine os filtros",
    content:
      "Profissional e status podem ser usados juntos — por exemplo, veja só os atendimentos pendentes de um profissional específico.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-filter-status"]',
    title: "Foque no que importa agora",
    content:
      "Filtrar por status ajuda a priorizar: comece pelos pendentes, depois acompanhe os que estão em atendimento.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-view-toggle"]',
    title: "Período de visualização",
    content:
      "Não há um filtro de período separado — a visão Dia, Semana ou Mensal já define o período mostrado, combinada com os filtros de profissional e status.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-appointment-menu"]',
    title: "Ações rápidas no card",
    content:
      "Clique nos três pontinhos de qualquer agendamento para um menu rápido: confirmar, iniciar, concluir, não compareceu, realocar profissional, cancelar ou excluir — sem precisar abrir os detalhes completos.",
    placement: "left",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-day-grid"]',
    title: "Criar direto de um horário livre",
    content:
      "Na visão Dia, passe o mouse sobre um horário vazio e clique em \"Novo agendamento\" — o horário já vem preenchido no assistente. Na visão Semana, cada dia sem agendamentos tem um atalho \"+ Novo\" parecido.",
    placement: "top",
  },
];
