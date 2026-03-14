import { ApiError, type StandardApiErrorPayload } from "@/lib/api";

export type UiError = {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
  path?: string;
  timestamp?: string;
};

type ConstraintViolation = {
  field?: string;
  message?: string;
};

type ConstraintViolationPayload = {
  title?: string;
  status?: number;
  violations?: ConstraintViolation[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const mapKnownApiCodeToMessage = (code?: string): string | null => {
  const normalized = (code || "").toUpperCase();
  if (normalized === "PLAN_EXPIRED") {
    return "Plano vencido. Regularize o pagamento para continuar.";
  }
  return null;
};

const NFSE_CONFIG_REQUIRED_CODES = new Set([
  "NFSE_PROVIDER_SEFIN_NACIONAL_CONFIG_MISSING",
  "NFSE_CONFIG_MISSING_MUNICIPIO",
  "NFSE_CONFIG_MISSING_PROVEDOR",
  "NFSE_CONFIG_MISSING_SERIE_RPS",
  "NFSE_CONFIG_MISSING_ITEM_LISTA_SERVICO",
  "NFSE_CONFIG_MISSING_ALIQUOTA_ISS",
  "NFSE_PROVIDER_SEFIN_NACIONAL_APP_VERSION_REQUIRED",
  "NFSE_PROVIDER_SEFIN_NACIONAL_CTRIBNAC_REQUIRED",
  "NFSE_PROVIDER_SEFIN_NACIONAL_OP_SIMP_NAC_REQUIRED",
  "NFSE_PROVIDER_SEFIN_NACIONAL_REG_ESP_TRIB_REQUIRED",
]);

const FISCAL_TAX_CONFIG_REQUIRED_CODES = new Set([
  "NFSE_PROVIDER_SEFIN_NACIONAL_TAX_CONFIG_MISSING",
  "NFSE_PROVIDER_SEFIN_NACIONAL_PRESTADOR_CNPJ_REQUIRED",
  "NFSE_PROVIDER_SEFIN_NACIONAL_PRESTADOR_NAME_REQUIRED",
]);

const STOCK_ENUM_MESSAGES: Array<{
  pattern: RegExp;
  fieldLabel: string;
  acceptedValues: string;
}> = [
  {
    pattern: /OrigemMovimentacaoEstoque|origem/i,
    fieldLabel: "origem da movimentacao",
    acceptedValues: "MANUAL, COMPRA, SERVICO ou INVENTARIO",
  },
  {
    pattern: /TipoMovimentacaoEstoque|tipo/i,
    fieldLabel: "tipo da movimentacao",
    acceptedValues: "ENTRADA, SAIDA ou AJUSTE",
  },
];

const extractEnumMessage = (rawMessage?: string | null): string | null => {
  const message = rawMessage?.trim();
  if (!message) return null;

  const looksLikeEnumError =
    /No enum constant|not one of the values accepted for Enum class|Cannot deserialize value of type/i.test(
      message
    );

  if (!looksLikeEnumError) return null;

  const matchedStockEnum = STOCK_ENUM_MESSAGES.find(({ pattern }) => pattern.test(message));
  if (matchedStockEnum) {
    return `Valor invalido para ${matchedStockEnum.fieldLabel}. Use: ${matchedStockEnum.acceptedValues}.`;
  }

  return "Valor informado invalido para um campo de selecao. Revise os valores aceitos e tente novamente.";
};

const extractViolationMessage = (details: unknown): string | null => {
  if (!isObject(details)) return null;
  const payload = details as ConstraintViolationPayload;
  if (!Array.isArray(payload.violations) || !payload.violations.length) return null;

  const messages = payload.violations
    .map((violation) => {
      const field = violation.field?.trim();
      const message = violation.message?.trim();
      if (!message) return null;
      if (!field) return message;
      const normalizedField = field.split(".").pop() || field;
      return `${normalizedField}: ${message}`;
    })
    .filter((msg): msg is string => Boolean(msg));

  if (!messages.length) return null;
  return messages.slice(0, 3).join(" | ");
};

export function resolveUiError(error: unknown, fallbackMessage: string): UiError {
  if (error instanceof ApiError) {
    const details =
      error.details && typeof error.details === "object"
        ? (error.details as StandardApiErrorPayload)
        : undefined;
    const knownCodeMessage = mapKnownApiCodeToMessage(
      details?.code || details?.error || error.code
    );
    const enumMessage =
      extractEnumMessage(details?.message) ||
      extractEnumMessage(details?.error) ||
      extractEnumMessage(error.message);
    const constraintMessage = extractViolationMessage(error.details);
    const resolvedMessage =
      knownCodeMessage ||
      enumMessage ||
      details?.message ||
      details?.error ||
      constraintMessage ||
      (error.status === 428
        ? "Segundo fator obrigatorio para este usuario. Informe o codigo MFA."
        : null) ||
      (error.status === 429
        ? "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."
        : null) ||
      error.message ||
      fallbackMessage;

    return {
      message: resolvedMessage,
      code: details?.code || error.code,
      status: error.status,
      details: error.details,
      path: details?.path,
      timestamp: details?.timestamp,
    };
  }

  if (error instanceof Error) {
    return { message: error.message || fallbackMessage };
  }

  return { message: fallbackMessage };
}

export function requiresNfseConfiguration(error: unknown): boolean {
  const uiError = resolveUiError(error, "");
  return NFSE_CONFIG_REQUIRED_CODES.has((uiError.code || "").toUpperCase());
}

export function requiresFiscalTaxConfiguration(error: unknown): boolean {
  const uiError = resolveUiError(error, "");
  return FISCAL_TAX_CONFIG_REQUIRED_CODES.has((uiError.code || "").toUpperCase());
}

