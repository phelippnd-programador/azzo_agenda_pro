/**
 * Validação antecipada da emissão de NFS-e: aponta, ANTES de chamar a API,
 * o que falta preencher — em linguagem de usuário, não de contrato. Evita o
 * ciclo "clicar em Emitir → esperar → erro genérico do provedor".
 */
export interface NfseEmissionCheckInput {
  municipioCodigoIbge?: string;
  customerType?: "CPF" | "CNPJ" | "EXTERIOR";
  customerName?: string;
  customerDocument?: string;
  descricaoServico?: string;
  quantidade?: number;
  valorUnitario?: number;
}

export function getNfseEmissionPendencies(input: NfseEmissionCheckInput): string[] {
  const pendencies: string[] = [];

  const ibge = (input.municipioCodigoIbge || "").trim();
  if (!/^\d{7}$/.test(ibge)) {
    pendencies.push("Município (código IBGE de 7 dígitos)");
  }

  if (!(input.customerName || "").trim()) {
    pendencies.push("Nome do tomador");
  }

  const document = (input.customerDocument || "").replace(/\D/g, "");
  if (input.customerType === "CPF" && document.length !== 11) {
    pendencies.push("CPF do tomador (11 dígitos)");
  }
  if (input.customerType === "CNPJ" && document.length !== 14) {
    pendencies.push("CNPJ do tomador (14 dígitos)");
  }

  if (!(input.descricaoServico || "").trim()) {
    pendencies.push("Descrição do serviço");
  }

  const total = Number(input.quantidade || 0) * Number(input.valorUnitario || 0);
  if (!(total > 0)) {
    pendencies.push("Valor do serviço (quantidade × valor unitário deve ser maior que zero)");
  }

  return pendencies;
}
