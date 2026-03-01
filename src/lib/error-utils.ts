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
    const constraintMessage = extractViolationMessage(error.details);
    const resolvedMessage =
      details?.message ||
      details?.error ||
      constraintMessage ||
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

