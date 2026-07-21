import { registerTour } from "@/components/tutorial/registry";

/**
 * Tutorial guiado: como conectar e configurar o WhatsApp Cloud API.
 *
 * Tour unico (nao dividido em modulos) — a pagina e um fluxo linear de
 * configuracao, nao um dominio com varias telas como Agenda/Estoque.
 *
 * Varios alvos so existem em um dos dois estados possiveis da pagina
 * (conectado vs. nao conectado) ou so quando o Embedded Signup da Meta
 * esta habilitado para o tenant — nesses casos o passo e pulado
 * automaticamente pelo TutorialHost (`target_not_found`), sem travar.
 *
 * Os alvos vivem em:
 * - WhatsAppIntegrationCard (card, badge de status, abas, painel de
 *   conectado, templates, historico de mensagens, ativacao, perfil de
 *   uso, permissoes)
 * - WhatsAppSetupWizard (indicador de progresso, conteudo do passo atual,
 *   navegacao Voltar/Proxima etapa)
 */
export const WHATSAPP_INTEGRATION_TOUR = registerTour({
  id: "whatsapp-integracao",
  version: 1,
  steps: [
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-integration-card"]',
      title: "Conectando o WhatsApp",
      content:
        "Aqui voce conecta o WhatsApp Cloud API do salao: envio e recebimento de mensagens, confirmacoes automaticas e atendimento pelo WhatsApp.",
      placement: "bottom",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-status-badge"]',
      title: "Status da conexao",
      content: 'O selo mostra se o WhatsApp ja esta conectado. Enquanto nao estiver, aparece "Nao conectado".',
      placement: "bottom",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-setup-tabs"]',
      title: "Duas formas de conectar",
      content: '"Cloud API guiado" e o passo a passo manual (recomendado). "Meta" e um fluxo mais rapido via Embedded Signup, quando disponivel para o seu tenant.',
      placement: "bottom",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-wizard-progress"]',
      title: "Progresso do passo a passo",
      content: "Estes numeros mostram em qual das 7 etapas voce esta. Etapas concluidas ficam marcadas com um check.",
      placement: "bottom",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-wizard-step-content"]',
      title: "Instrucoes de cada etapa",
      content:
        "Cada etapa explica o que fazer do lado da Meta (Business Manager, WhatsApp Manager) e, quando necessario, traz campos para colar os dados copiados de la (IDs, token, etc.).",
      placement: "top",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-wizard-nav"]',
      title: "Avance quando estiver pronto",
      content: '"Proxima etapa" fica disponivel assim que os campos obrigatorios daquela etapa estiverem preenchidos. Use "Voltar" para revisar uma etapa anterior.',
      placement: "top",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-status-panel"]',
      title: "Depois de conectado",
      content:
        'Com o WhatsApp conectado, esta area mostra o numero conectado, permite testar a conexao a qualquer momento e reconfigurar se precisar trocar de numero.',
      placement: "top",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-templates"]',
      title: "Mensagens automaticas",
      content: "Personalize os textos de confirmacao, cancelamento e lembrete de agendamento. Clique nos chips para inserir variaveis como {cliente} e {servico}.",
      placement: "top",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-message-log"]',
      title: "Historico de mensagens",
      content: 'Clique em "Ver historico" para conferir as ultimas mensagens enviadas pelo WhatsApp e o status de cada envio.',
      placement: "top",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-activate-switch"]',
      title: "Ativar a integracao",
      content: "Esta chave liga ou desliga o envio, o webhook e o atendimento via WhatsApp para o seu salao. Sem ativar, a conexao fica configurada mas inativa.",
      placement: "top",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-usage-profile"]',
      title: "Escolha o perfil de uso",
      content: "Cada perfil muda quais mensagens sao enviadas automaticamente e o custo por conversa cobrado pela Meta. Escolha o que faz sentido para o seu salao.",
      placement: "top",
    },
    {
      route: "/configuracoes/integracoes/whatsapp",
      target: '[data-tour="whatsapp-permissions"]',
      title: "O que o cliente pode fazer pelo WhatsApp",
      content: "Defina se o cliente pode agendar, cancelar e remarcar diretamente pelo WhatsApp, sem falar com a recepcao.",
      placement: "top",
    },
  ],
});

export const WHATSAPP_INTEGRATION_TOUR_ID = WHATSAPP_INTEGRATION_TOUR.id;
