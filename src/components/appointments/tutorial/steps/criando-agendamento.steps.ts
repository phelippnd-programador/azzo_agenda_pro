import type { GuidedTourStep } from "@/components/tutorial/types";

/**
 * Módulo 2 — Criando um agendamento: as 5 etapas do assistente (cliente,
 * serviço, profissional, data/horário e revisão) até salvar.
 *
 * O assistente é um wizard que ESCONDE as etapas não ativas via CSS (fica no
 * DOM, só oculto) em vez de desmontar — por isso os passos 2 a 6 usam
 * `allowInteraction: true`: sem isso, o overlay do tour bloquearia o clique
 * no botão "Continuar" do próprio formulário (que fica fora da área
 * destacada) e o usuário ficaria preso sem conseguir revelar a próxima
 * etapa real do wizard.
 */
export const CRIANDO_AGENDAMENTO_STEPS: GuidedTourStep[] = [
  {
    route: "/agenda",
    target: '[data-tour="agenda-new-appointment-button"]',
    title: "Iniciar um novo agendamento",
    content:
      "Clique em \"Novo Agendamento\" para abrir o assistente. Depois de clicar, clique em Próximo aqui no tutorial para continuar.",
    placement: "bottom",
    spotlightClicks: true,
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-client-step"]',
    title: "Etapa 1 — Cliente",
    content:
      "Pesquise por nome, telefone ou e-mail e clique no cliente para selecioná-lo (ou cadastre um novo sem sair do fluxo). Depois, clique em \"Continuar\" no formulário e em seguida em Próximo aqui no tutorial.",
    placement: "right",
    allowInteraction: true,
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-service-step"]',
    title: "Etapa 2 — Serviço",
    content:
      "Escolha o serviço que será executado. Duração e valor aparecem automaticamente, e há um campo de desconto opcional. Clique em \"Continuar\" no formulário e depois em Próximo aqui.",
    placement: "right",
    allowInteraction: true,
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-professional-step"]',
    title: "Etapa 3 — Profissional",
    content:
      "Selecione quem vai atender — a lista mostra só profissionais habilitados para o serviço escolhido. Clique em \"Continuar\" no formulário e depois em Próximo aqui.",
    placement: "right",
    allowInteraction: true,
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-date-step"]',
    title: "Etapa 4 — Data",
    content:
      "Escolha o dia do atendimento. Se não houver horário livre nessa data, o sistema avisa e sugere outra data. Clique em \"Continuar\" no formulário e depois em Próximo aqui.",
    placement: "right",
    allowInteraction: true,
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-slots-step"]',
    title: "Horário e duração",
    content:
      "Na aba Sugestões, escolha um horário livre — o horário final é calculado sozinho pela duração do serviço. Prefere digitar? Use a aba Manual. Horários em vermelho indicam conflito. Escolha um horário e clique em Próximo aqui para revisar.",
    placement: "top",
    allowInteraction: true,
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-review-step"]',
    title: "Etapa 5 — Revisão",
    content:
      "Confira cliente, serviço, profissional, valores e horário antes de confirmar. Precisa mudar algo? Use \"Voltar\" no rodapé do formulário.",
    placement: "top",
  },
  {
    route: "/agenda",
    target: '[data-tour="apt-dialog-submit"]',
    title: "Criar o agendamento",
    content:
      "Tudo certo? Clique em \"Criar agendamento\" para salvar. Se o horário tiver ficado indisponível ou em conflito, o sistema pede uma confirmação extra antes de gravar.",
    placement: "top",
    spotlightClicks: true,
  },
];
