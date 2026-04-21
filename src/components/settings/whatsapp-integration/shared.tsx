import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EMPTY_RESULT = "";
export const META_SDK_SRC = "https://connect.facebook.net/pt_BR/sdk.js";
export const META_GRAPH_VERSION = "v23.0";
export const META_BUSINESS_HOME_URL = "https://business.facebook.com/latest/home";
export const META_BUSINESS_SETTINGS_URL = "https://business.facebook.com/latest/settings";
export const META_WHATSAPP_MANAGER_URL = "https://business.facebook.com/latest/whatsapp_manager";
export const META_SYSTEM_USERS_URL = "https://business.facebook.com/latest/settings/system-users";
export const META_GRAPH_EXPLORER_URL = "https://developers.facebook.com/tools/explorer/";
export const WIZARD_STEPS = [
  "Verificacao inicial",
  "Business Manager",
  "Criacao do WABA",
  "Vinculacao do numero",
  "Insercao do token",
  "Configuracao do webhook",
  "Validacao da conexao",
] as const;

export type EmbeddedSetupInfo = {
  businessId?: string;
  phoneNumber?: string;
  phoneNumberId?: string;
  wabaId?: string;
};

export type FacebookLoginResponse = {
  authResponse?: {
    code?: string;
  } | null;
  status?: string;
};

export type FacebookSdk = {
  init: (config: Record<string, unknown>) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options?: Record<string, unknown>
  ) => void;
  getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void;
};

export type WindowWithMetaSdk = Window & {
  FB?: FacebookSdk;
  fbAsyncInit?: () => void;
};

export type SetupMode = "wizard" | "meta";

export function normalizeMessageEventData(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return typeof raw === "object" ? (raw as Record<string, unknown>) : null;
}

export function extractSetupInfo(payload: Record<string, unknown>): EmbeddedSetupInfo | null {
  const data =
    typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : payload;
  const setupInfo =
    typeof data.setupInfo === "object" && data.setupInfo !== null
      ? (data.setupInfo as Record<string, unknown>)
      : data;

  const businessId = String(
    setupInfo.businessId ||
      setupInfo.business_id ||
      data.businessId ||
      data.business_id ||
      ""
  ).trim();
  const phoneNumber = String(
    setupInfo.phoneNumber ||
      setupInfo.phone_number ||
      data.phoneNumber ||
      data.phone_number ||
      ""
  ).trim();
  const phoneNumberId = String(
    setupInfo.phoneNumberId ||
      setupInfo.phone_number_id ||
      data.phoneNumberId ||
      data.phone_number_id ||
      ""
  ).trim();
  const wabaId = String(
    setupInfo.wabaId ||
      setupInfo.waba_id ||
      data.wabaId ||
      data.waba_id ||
      ""
  ).trim();

  if (!phoneNumberId && !wabaId && !businessId && !phoneNumber) {
    return null;
  }

  return {
    businessId: businessId || undefined,
    phoneNumber: phoneNumber || undefined,
    phoneNumberId: phoneNumberId || undefined,
    wabaId: wabaId || undefined,
  };
}

export async function loadMetaSdk(appId: string): Promise<FacebookSdk> {
  const browserWindow = window as WindowWithMetaSdk;
  if (browserWindow.FB) {
    return browserWindow.FB;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${META_SDK_SRC}"]`
  );

  return new Promise<FacebookSdk>((resolve, reject) => {
    const finish = () => {
      const sdk = (window as WindowWithMetaSdk).FB;
      if (!sdk) {
        reject(new Error("SDK da Meta nao carregado."));
        return;
      }
      sdk.init({
        appId,
        autoLogAppEvents: true,
        cookie: true,
        xfbml: false,
        version: META_GRAPH_VERSION,
      });
      resolve(sdk);
    };

    browserWindow.fbAsyncInit = finish;

    if (existingScript) {
      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Falha ao carregar SDK da Meta.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = META_SDK_SRC;
    script.onload = finish;
    script.onerror = () => reject(new Error("Falha ao carregar SDK da Meta."));
    document.body.appendChild(script);
  });
}

export function resolveStepStatus(currentStep: number, targetStep: number) {
  if (currentStep > targetStep) return "done";
  if (currentStep === targetStep) return "current";
  return "upcoming";
}

export function MetaLinkButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button asChild type="button" variant="outline" size="sm">
      <a href={href} target="_blank" rel="noreferrer">
        <ExternalLink className="mr-2 h-4 w-4" />
        {children}
      </a>
    </Button>
  );
}
