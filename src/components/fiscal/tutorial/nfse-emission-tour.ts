import { registerTour } from "@/components/tutorial/registry";

/**
 * Tutorial guiado: como emitir uma NFS-e.
 *
 * Os alvos usam a convenção [data-tour="..."] — os atributos vivem em:
 * - FiscalPage (abas do módulo)
 * - NfseSettingsContent (card de configuração, aba Configurações > NFS-e)
 * - NfseInvoicesContent (botão "Nova NFS-e")
 * - NfseInvoiceForm (campos do formulário de emissão)
 *
 * Passos que vivem em outra aba/rota declaram `route`: o TutorialHost navega
 * e espera o elemento montar antes de destacar (e pula se não aparecer).
 */
export const NFSE_EMISSION_TOUR = registerTour({
  id: "nfse-emissao",
  version: 1,
  steps: [
    {
      route: "/fiscal?tab=notas",
      target: '[data-tour="fiscal-tabs"]',
      title: "Bem-vindo ao módulo Fiscal",
      content:
        "Aqui você emite e acompanha suas notas fiscais de serviço (NFS-e). O módulo é dividido em abas: notas emitidas, emissão, apuração mensal e configurações.",
      placement: "bottom",
    },
    {
      route: "/fiscal?tab=config&subtab=nfse",
      target: '[data-tour="nfse-config"]',
      title: "Antes da primeira emissão: configure a NFS-e",
      content:
        "Informe o município, o provedor da prefeitura e os padrões de imposto (ISS e item da lista de serviço). Isso é feito uma única vez — depois, o formulário de emissão já vem preenchido com esses padrões.",
      placement: "top",
    },
    {
      route: "/fiscal?tab=notas",
      target: '[data-tour="nfse-nova"]',
      title: "Crie uma nova nota",
      content:
        'Com a configuração pronta, clique em "Nova NFS-e" para abrir o formulário de emissão. É por aqui que toda emissão começa.',
      placement: "bottom",
    },
    {
      route: "/fiscal/nfse/nova",
      target: '[data-tour="nfse-ambiente"]',
      title: "Escolha o ambiente",
      content:
        "Homologação é o ambiente de TESTE: a nota não tem valor fiscal. Use para validar a configuração. Produção emite a nota de verdade na prefeitura.",
      placement: "bottom",
    },
    {
      route: "/fiscal/nfse/nova",
      target: '[data-tour="nfse-tomador"]',
      title: "Dados do tomador (seu cliente)",
      content:
        "Informe quem recebeu o serviço. Para CNPJ, digite o número e os dados da empresa são buscados automaticamente. Para CPF, preencha nome e documento.",
      placement: "top",
    },
    {
      route: "/fiscal/nfse/nova",
      target: '[data-tour="nfse-servico"]',
      title: "Descreva o serviço prestado",
      content:
        "Preencha a descrição, a quantidade e o valor unitário. O total e o ISS são calculados automaticamente a partir desses campos.",
      placement: "top",
    },
    {
      route: "/fiscal/nfse/nova",
      target: '[data-tour="nfse-resumo"]',
      title: "Confira os valores",
      content:
        "Antes de emitir, confira aqui o total dos serviços e o ISS estimado. Qualquer ajuste nos campos acima atualiza este resumo na hora.",
      placement: "top",
    },
    {
      route: "/fiscal/nfse/nova",
      target: '[data-tour="nfse-emitir"]',
      title: "Emita (ou salve para depois)",
      content:
        '"Emitir NFS-e" envia a nota para autorização na prefeitura. Se preferir terminar depois, "Salvar rascunho" guarda tudo sem emitir. O andamento fica na aba NFS-e do módulo Fiscal.',
      placement: "top",
    },
  ],
});

export const NFSE_EMISSION_TOUR_ID = NFSE_EMISSION_TOUR.id;
