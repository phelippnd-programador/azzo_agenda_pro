import type { Placement } from "react-joyride";

/**
 * Passo de um tutorial guiado. Extensão fina sobre o Step do react-joyride:
 * além de título/descrição, um passo pode declarar a ROTA em que o elemento
 * vive (`route`). O TutorialHost navega até ela e espera o alvo aparecer antes
 * de exibir o passo — se o alvo não aparecer no tempo limite, o passo é pulado
 * (o tutorial nunca fica preso em elemento indisponível).
 */
export interface GuidedTourStep {
  /** Seletor CSS do elemento a destacar (convenção: [data-tour="..."]). */
  target: string;
  /** Título curto exibido no topo do balão. */
  title: string;
  /** Descrição do que o usuário precisa fazer nesta etapa. */
  content: string;
  /** Rota (pathname + query) onde o alvo existe. Ex.: "/fiscal?tab=config&subtab=nfse". */
  route?: string;
  /** Posição preferida do balão em relação ao alvo. */
  placement?: Placement | "auto" | "center";
  /** Desabilita o recorte de clique no alvo (padrão: interação bloqueada durante o tour). */
  spotlightClicks?: boolean;
}

export interface GuidedTourDefinition {
  /** Identificador único e estável (usado na persistência). Ex.: "nfse-emissao". */
  id: string;
  /** Versão: incrementar quando os passos mudarem a ponto de valer reexibir o tour. */
  version: number;
  steps: GuidedTourStep[];
}
