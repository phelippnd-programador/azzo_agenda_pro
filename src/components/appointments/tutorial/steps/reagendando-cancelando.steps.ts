import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Módulo 4 — Reagendando e cancelando: editar data/horário/profissional,
 * realocar para outro profissional, cancelar e excluir.
 *
 * Só os 2 primeiros passos pedem um clique real (abrir o agendamento, abrir a
 * edição) — os demais são só explicativos, sem exigir interação. Isso evita
 * um efeito colateral real: clicar em "Realocar profissional" fecha a ficha
 * de detalhes (troca para o diálogo de realocação), o que derrubaria o alvo
 * dos passos seguintes (cancelar, excluir) se o tour dependesse desse clique.
 */
export const REAGENDANDO_CANCELANDO_STEPS: GuidedTourStep[] = [
  {
    route: "/agenda",
    target: '[data-tour="agenda-appointment-card"]',
    title: "Abra o agendamento a alterar",
    content:
      "Clique em um agendamento para abrir os detalhes. Se não houver nenhum, crie um no módulo \"Criando um agendamento\" e volte aqui. Depois de clicar, clique em Próximo.",
    placement: "right",
    spotlightClicks: true,
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-details-edit"]',
    title: "Editar agendamento",
    content:
      "Clique aqui para trocar data, horário ou profissional — é assim que se reagenda um atendimento. Depois de clicar, clique em Próximo.",
    placement: "top",
    spotlightClicks: true,
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-edit-fields"]',
    title: "Nova data e horário",
    content:
      "Ajuste a data, o horário de início ou o profissional responsável, e inclua uma observação se precisar.",
    placement: "right",
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-edit-save"]',
    title: "Salvar o reagendamento",
    content:
      "Quando terminar os ajustes, clique em \"Salvar alterações\" para confirmar o novo horário.",
    placement: "top",
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-details-reassign"]',
    title: "Só trocar o profissional",
    content:
      "Quando apenas o profissional precisa mudar (mesma data e horário), use \"Realocar profissional\" em vez de editar tudo. Disponível quando há mais de um profissional ativo no salão.",
    placement: "top",
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-details-actions"]',
    title: "Cancelar o agendamento",
    content:
      "O botão \"Cancelar\" fica junto dos outros botões de status. Ele libera o horário na agenda, mas mantém o registro para consulta.",
    placement: "top",
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-details-delete"]',
    title: "Excluir definitivamente",
    content:
      "\"Excluir Agendamento\" remove o registro por completo — diferente de cancelar, esta ação não pode ser desfeita. Use com cuidado.",
    placement: "top",
  },
];
