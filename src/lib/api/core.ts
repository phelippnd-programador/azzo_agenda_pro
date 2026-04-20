import type { User } from "@/types";
import {
  isLicenseAccessBlocked,
  setLicenseAccessStatus,
  type LicenseAccessStatus,
} from "@/lib/license-access";
import { toast } from "sonner";

export type StandardApiErrorPayload = {
  code?: string;
  error?: string;
  message?: string;
  details?: unknown;
  timestamp?: string;
  path?: string;
};

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8080/api/v1";

const USER_KEY = "auth_user";
const SESSION_EXPIRED_REASON_KEY = "azzo_session_expired_reason";

let refreshPromise: Promise<boolean> | null = null;
let isForcingLogout = false;
let lastPlanExpiredToastAt = 0;

export class ApiError extends Error {
  status?: number;
  details?: unknown;
  code?: string;

  constructor(message: string, status?: number, details?: unknown, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export const isPlanExpiredApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  (error.status === 402 || String(error.code || "").toUpperCase() === "PLAN_EXPIRED");

const getErrorPayload = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  let errorMessage =
    response.status === 401
      ? "Sessao expirada ou token invalido. Faca login novamente."
      : response.status === 403
        ? "Voce nao tem permissao para executar esta acao."
        : response.status === 404
          ? "Recurso nao encontrado."
          : response.status === 409
            ? "Conflito de regra de negocio."
            : response.status === 429
              ? "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."
              : "Erro na requisicao";
  let errorDetails: unknown = null;
  let errorCode: string | undefined;

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    errorDetails = data;
    if (data && typeof data === "object") {
      const typed = data as StandardApiErrorPayload;
      const maybeMessage = typed.message;
      const maybeError = typed.error;
      const maybeCode = typed.code || typed.error;
      errorMessage = maybeMessage || maybeError || errorMessage;
      errorCode = maybeCode;
    }
  } else {
    const text = await response.text();
    errorDetails = text;
    if (text) errorMessage = text;
  }

  return { errorMessage, errorDetails, errorCode };
};

const notifyPlanExpired = (message: string) => {
  const now = Date.now();
  if (now - lastPlanExpiredToastAt < 8000) return;
  lastPlanExpiredToastAt = now;
  toast.error(message);
};

const setPlanExpiredBlocked = (blocked: boolean) => {
  setLicenseAccessStatus(blocked ? "BLOCKED" : "ACTIVE");
};

const ALLOWED_ENDPOINT_PREFIXES_WHEN_PLAN_BLOCKED = [
  "/billing/subscriptions/current",
  "/billing/subscriptions",
  "/billing/payments",
  "/checkout/products",
  "/auth/me",
  "/auth/logout",
  "/config/menus/current",
];

const isAllowedWhenPlanBlocked = (endpoint: string) =>
  ALLOWED_ENDPOINT_PREFIXES_WHEN_PLAN_BLOCKED.some((prefix) => endpoint.startsWith(prefix));

const PUBLIC_ENDPOINT_PREFIXES = [
  "/checkout/products",
  "/checkout/intents",
  "/public/",
];

const isPublicEndpoint = (endpoint: string) =>
  PUBLIC_ENDPOINT_PREFIXES.some((prefix) => endpoint.startsWith(prefix));

export const saveSession = (user?: User | null) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (String(user.role || "").toUpperCase() === "ADMIN") {
      setLicenseAccessStatus("ACTIVE");
    }
  }
};

export const clearSession = () => {
  localStorage.removeItem(USER_KEY);
  setLicenseAccessStatus("UNKNOWN");
};

const isCurrentUserAdmin = () => {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { role?: string };
    return String(parsed?.role || "").toUpperCase() === "ADMIN";
  } catch {
    return false;
  }
};

const hasSessionUserHint = () => {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(USER_KEY));
  } catch {
    return false;
  }
};

const isPublicAppRoute = () => {
  if (typeof window === "undefined") return false;
  const pathname = window.location.pathname || "";
  return (
    pathname === "/compras" ||
    pathname.startsWith("/compras/") ||
    pathname === "/success" ||
    pathname === "/error" ||
    pathname === "/agendar" ||
    pathname.startsWith("/agendar/")
  );
};

const shouldAttemptAuthRefresh = (endpoint: string) =>
  !isPublicEndpoint(endpoint) && hasSessionUserHint();

const forceLogoutToLogin = (reason: string) => {
  clearSession();
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_EXPIRED_REASON_KEY, reason);
  } catch {
    // ignore storage errors
  }
  if (isForcingLogout) return;
  isForcingLogout = true;
  const target = "/login?reason=session-expired";
  if (window.location.pathname !== "/login") {
    window.location.assign(target);
    return;
  }
  window.dispatchEvent(new CustomEvent("azzo:session-expired", { detail: { reason } }));
};

const refreshAccessToken = async (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Falha ao renovar token");
      }
      return true;
    })()
      .catch(() => {
        if (!isPublicAppRoute()) {
          forceLogoutToLogin("Sessao expirada. Faca login novamente.");
        }
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const refreshLicenseAccessStatus = async (): Promise<LicenseAccessStatus> => {
  if (typeof window === "undefined") return "UNKNOWN";

  if (isCurrentUserAdmin()) {
    setLicenseAccessStatus("ACTIVE");
    return "ACTIVE";
  }

  try {
    const response = await fetch(`${API_URL}/billing/subscriptions/current`, {
      credentials: "include",
    });

    if (response.status === 402) {
      setLicenseAccessStatus("BLOCKED");
      return "BLOCKED";
    }
    if (!response.ok) {
      setLicenseAccessStatus("UNKNOWN");
      return "UNKNOWN";
    }

    const payload = (await response.json()) as {
      status?: string | null;
      licenseStatus?: string | null;
      paymentStatus?: string | null;
      currentPaymentStatus?: string | null;
    };

    const status = String(payload.status || "").toUpperCase();
    const licenseStatus = String(payload.licenseStatus || "").toUpperCase();
    const paymentStatus = String(
      payload.currentPaymentStatus || payload.paymentStatus || ""
    ).toUpperCase();
    const blocked =
      licenseStatus === "EXPIRED" ||
      status === "EXPIRED" ||
      status === "OVERDUE" ||
      paymentStatus === "OVERDUE";

    setLicenseAccessStatus(blocked ? "BLOCKED" : "ACTIVE");
    return blocked ? "BLOCKED" : "ACTIVE";
  } catch {
    setLicenseAccessStatus("UNKNOWN");
    return "UNKNOWN";
  }
};

export const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryOnAuthError = true
): Promise<T> => {
  if (
    !isCurrentUserAdmin() &&
    isLicenseAccessBlocked() &&
    !isAllowedWhenPlanBlocked(endpoint)
  ) {
    throw new ApiError(
      "Plano vencido. Regularize o pagamento para continuar.",
      402,
      { error: "PLAN_EXPIRED" },
      "PLAN_EXPIRED"
    );
  }

  const headers = new Headers(options.headers || {});
  const hasBody = typeof options.body !== "undefined" && options.body !== null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData) {
    headers.set("Content-Type", "application/json");
  } else if (isFormData) {
    headers.delete("Content-Type");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      retryOnAuthError &&
      endpoint !== "/auth/refresh" &&
      endpoint !== "/auth/login" &&
      endpoint !== "/auth/register" &&
      endpoint !== "/auth/me" &&
      shouldAttemptAuthRefresh(endpoint)
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request<T>(endpoint, options, false);
      }
    }

    const { errorMessage, errorDetails, errorCode } = await getErrorPayload(response);

    if (
      response.status === 402 &&
      ((errorDetails &&
        typeof errorDetails === "object" &&
        (errorDetails as { error?: string }).error === "PLAN_EXPIRED") ||
        errorCode === "PLAN_EXPIRED")
    ) {
      setPlanExpiredBlocked(true);
      notifyPlanExpired(errorMessage);
    }

    throw new ApiError(errorMessage, response.status, errorDetails, errorCode);
  }

  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
};

export const requestBlob = async (
  endpoint: string,
  options: RequestInit = {},
  retryOnAuthError = true
): Promise<Blob> => {
  if (
    !isCurrentUserAdmin() &&
    isLicenseAccessBlocked() &&
    !isAllowedWhenPlanBlocked(endpoint)
  ) {
    throw new ApiError(
      "Plano vencido. Regularize o pagamento para continuar.",
      402,
      { error: "PLAN_EXPIRED" },
      "PLAN_EXPIRED"
    );
  }

  const headers = new Headers(options.headers || {});

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      retryOnAuthError &&
      endpoint !== "/auth/refresh" &&
      endpoint !== "/auth/login" &&
      endpoint !== "/auth/register" &&
      endpoint !== "/auth/me" &&
      shouldAttemptAuthRefresh(endpoint)
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return requestBlob(endpoint, options, false);
      }
    }

    const { errorMessage, errorCode, errorDetails } = await getErrorPayload(response);

    if (response.status === 402 && errorCode === "PLAN_EXPIRED") {
      setPlanExpiredBlocked(true);
      notifyPlanExpired(errorMessage);
    }

    throw new ApiError(errorMessage, response.status, errorDetails, errorCode);
  }

  return response.blob();
};

export const buildListQuery = (params?: { page?: number; limit?: number; search?: string }) => {
  const query = new URLSearchParams();
  if (!params) return query;
  if (typeof params.page === "number" && params.page > 0) {
    query.set("page", String(params.page));
  }
  if (typeof params.limit === "number" && params.limit > 0) {
    query.set("limit", String(params.limit));
  }
  if (typeof params.search === "string" && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  return query;
};
