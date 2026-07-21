import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Módulo 5 — Disponibilidade e conflitos de horário.
 *
 * O sistema ainda não tem uma tela dedicada para "bloquear" um horário
 * avulso (ex.: folga pontual, intervalo extra) — por isso este módulo cobre
 * o que existe de fato, e faz isso de forma narrativa, sem depender de o
 * usuário já estar no meio do assistente de agendamento: os alvos usados
 * aqui são só os elementos de página (sempre presentes), evitando exigir uma
 * sequência de cliques dentro do wizard sem essa instrução.
 */
export const DISPONIBILIDADE_CONFLITOS_STEPS: GuidedTourStep[] = [
  {
    route: "/agenda",
    target: '[data-tour="agenda-new-appointment-button"]',
    title: "De onde vem a disponibilidade",
    content:
      "Os horários livres mostrados no assistente de agendamento vêm do horário de trabalho cadastrado no perfil de cada profissional (Profissionais > horário de trabalho). Ainda não existe uma tela separada para bloquear um horário avulso — para isso, ajuste o horário de trabalho do profissional.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-new-appointment-button"]',
    title: "Quando não há horário livre",
    content:
      "Ao montar um agendamento, se a data escolhida não tiver nenhum horário disponível para o profissional e serviço selecionados, o sistema avisa na hora, na própria etapa de data, e sugere escolher outra data.",
    placement: "bottom",
  },
  {
    route: "/agenda",
    target: '[data-tour="agenda-day-grid"]',
    title: "Encaixe em horário ocupado",
    content:
      "Quando o estabelecimento permite conflito manual, horários já ocupados aparecem em vermelho na lista de sugestões do assistente. Escolher um deles pede confirmação explícita antes de salvar — essa decisão fica registrada na auditoria. Em modo estrito, horários em conflito não podem ser assumidos.",
    placement: "top",
  },
];
