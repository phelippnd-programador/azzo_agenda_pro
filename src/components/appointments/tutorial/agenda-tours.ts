import { registerTour } from "@/components/tutorial/registry";
import { CONHECENDO_AGENDA_STEPS } from "./steps/conhecendo-agenda.steps";
import { CRIANDO_AGENDAMENTO_STEPS } from "./steps/criando-agendamento.steps";
import { GERENCIANDO_AGENDAMENTO_STEPS } from "./steps/gerenciando-agendamento.steps";
import { REAGENDANDO_CANCELANDO_STEPS } from "./steps/reagendando-cancelando.steps";
import { DISPONIBILIDADE_CONFLITOS_STEPS } from "./steps/disponibilidade-conflitos.steps";
import { FILTROS_AVANCADO_STEPS } from "./steps/filtros-avancado.steps";

/**
 * Tutorial guiado da Agenda, dividido em módulos independentes + um tour
 * completo que é a concatenação de todos, na ordem real de uso do sistema.
 * Cada módulo é registrado com seu próprio id (persistência de "já visto"
 * independente por módulo) e pode ser iniciado isoladamente pelo
 * TutorialLauncherButton na página da Agenda.
 */

export const AGENDA_TOUR_MODULES = [
  registerTour({
    id: "agenda-conhecendo",
    version: 1,
    steps: CONHECENDO_AGENDA_STEPS,
  }),
  registerTour({
    id: "agenda-criando",
    version: 1,
    steps: CRIANDO_AGENDAMENTO_STEPS,
  }),
  registerTour({
    id: "agenda-gerenciando",
    version: 1,
    steps: GERENCIANDO_AGENDAMENTO_STEPS,
  }),
  registerTour({
    id: "agenda-reagendando-cancelando",
    version: 1,
    steps: REAGENDANDO_CANCELANDO_STEPS,
  }),
  registerTour({
    id: "agenda-disponibilidade",
    version: 1,
    steps: DISPONIBILIDADE_CONFLITOS_STEPS,
  }),
  registerTour({
    id: "agenda-filtros-avancado",
    version: 1,
    steps: FILTROS_AVANCADO_STEPS,
  }),
];

export const AGENDA_TOUR_FULL_ID = "agenda-completo";

registerTour({
  id: AGENDA_TOUR_FULL_ID,
  version: 1,
  steps: AGENDA_TOUR_MODULES.flatMap((tour) => tour.steps),
});

export const AGENDA_TOUR_MODULE_OPTIONS = [
  { id: "agenda-conhecendo", label: "1. Conhecendo a agenda" },
  { id: "agenda-criando", label: "2. Criando um agendamento" },
  { id: "agenda-gerenciando", label: "3. Gerenciando um agendamento" },
  { id: "agenda-reagendando-cancelando", label: "4. Reagendando e cancelando" },
  { id: "agenda-disponibilidade", label: "5. Disponibilidade e conflitos" },
  { id: "agenda-filtros-avancado", label: "6. Filtros e recursos avançados" },
];
