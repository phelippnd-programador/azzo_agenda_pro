import { ApiError, type StandardApiErrorPayload } from "@/lib/api";

export type UiError = {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
  path?: string;
  timestamp?: string;
};

export function resolveUiError(error: unknown, fallbackMessage: string): UiError {
  if (error instanceof ApiError) {
    const details =
      error.details && typeof error.details === "object"
        ? (error.details as StandardApiErrorPayload)
        : undefined;

    return {
      message: details?.message || details?.error || error.message || fallbackMessage,
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

