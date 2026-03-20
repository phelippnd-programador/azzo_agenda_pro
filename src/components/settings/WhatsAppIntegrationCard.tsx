import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  completeWhatsAppEmbeddedSignup,
  getWhatsAppConfig,
  getWhatsAppEmbeddedSignupStatus,
  saveWhatsAppConfig,
  testWhatsAppConnection,
} from "@/services/whatsappService";
import type {
  WhatsAppConfigResponse,
  WhatsAppEmbeddedSignupStatusResponse,
} from "@/types/whatsapp";
import { resolveUiError } from "@/lib/error-utils";

const EMPTY_RESULT = "";
const META_SDK_SRC = "https://connect.facebook.net/pt_BR/sdk.js";
const META_GRAPH_VERSION = "v23.0";

type EmbeddedSetupInfo = {
  businessId?: string;
  phoneNumber?: string;
  phoneNumberId?: string;
  wabaId?: string;
};

type FacebookLoginResponse = {
  authResponse?: {
    code?: string;
  } | null;
  status?: string;
};

type FacebookSdk = {
  init: (config: Record<string, unknown>) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options?: Record<string, unknown>
  ) => void;
  getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void;
};

type WindowWithMetaSdk = Window & {
  FB?: FacebookSdk;
  fbAsyncInit?: () => void;
};

function normalizeMessageEventData(raw: unknown): Record<string, unknown> | null {
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

function extractSetupInfo(payload: Record<string, unknown>): EmbeddedSetupInfo | null {
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

async function loadMetaSdk(appId: string): Promise<FacebookSdk> {
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

export function WhatsAppIntegrationCard() {
  const queryClient = useQueryClient();
  const [activateIntegration, setActivateIntegration] = useState(false);
  const [canSchedule, setCanSchedule] = useState(true);
  const [canCancel, setCanCancel] = useState(true);
  const [canReschedule, setCanReschedule] = useState(true);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [webhookVerifyToken, setWebhookVerifyToken] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");
  const [embeddedStatus, setEmbeddedStatus] =
    useState<WhatsAppEmbeddedSignupStatusResponse | null>(null);
  const [configStatus, setConfigStatus] =
    useState<WhatsAppConfigResponse | null>(null);
  const [testResult, setTestResult] = useState(EMPTY_RESULT);

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLaunchingEmbeddedSignup, setIsLaunchingEmbeddedSignup] = useState(false);
  const [isFinalizingEmbeddedSignup, setIsFinalizingEmbeddedSignup] = useState(false);

  const pendingSetupInfoRef = useRef<EmbeddedSetupInfo | null>(null);

  const metaAppId = (import.meta.env.VITE_META_APP_ID as string | undefined)?.trim() || "";
  const metaConfigId = (import.meta.env.VITE_META_CONFIG_ID as string | undefined)?.trim() || "";
  const metaRedirectUri =
    (import.meta.env.VITE_META_EMBEDDED_REDIRECT_URI as string | undefined)?.trim() || "";

  const isConnected = Boolean(
    embeddedStatus?.connected || configStatus?.whatsappEnabled || configStatus?.enabled
  );
  const isTokenConfigured = Boolean(
    embeddedStatus?.accessTokenConfigured || configStatus?.accessTokenConfigured
  );
  const isEmbeddedConfigured = Boolean(metaAppId && metaConfigId && metaRedirectUri);
  const onboardingStatus =
    embeddedStatus?.onboardingStatus || configStatus?.onboardingStatus || "NOT_STARTED";
  const tokenSource = embeddedStatus?.tokenSource || configStatus?.tokenSource || "MANUAL";

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        const [config, embedded] = await Promise.all([
          getWhatsAppConfig(),
          getWhatsAppEmbeddedSignupStatus(),
        ]);
        if (!mounted) return;

        setConfigStatus(config);
        setEmbeddedStatus(embedded);
        setActivateIntegration(Boolean(config.whatsappEnabled || config.enabled));
        setCanSchedule(config.canSchedule ?? true);
        setCanCancel(config.canCancel ?? true);
        setCanReschedule(config.canReschedule ?? true);
        setPhoneNumberId(embedded.phoneNumberId || config.phoneNumberId || "");
        setBusinessAccountId(
          embedded.businessAccountId || config.businessAccountId || ""
        );
        setBusinessId(embedded.businessId || config.businessId || "");
        setDisplayPhoneNumber(
          embedded.displayPhoneNumber || config.displayPhoneNumber || ""
        );
        setWebhookVerifyToken(
          embedded.webhookVerifyToken || config.webhookVerifyToken || ""
        );
      } catch {
        if (!mounted) return;
        setConfigStatus(null);
        setEmbeddedStatus(null);
      }
    };

    void loadConfig();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const payload = normalizeMessageEventData(event.data);
      if (!payload) return;

      const eventType = String(
        payload.type || payload.event || payload.eventType || ""
      ).toUpperCase();

      if (!eventType.includes("WHATSAPP") && !eventType.includes("EMBEDDED")) {
        return;
      }

      const setupInfo = extractSetupInfo(payload);
      if (setupInfo) {
        pendingSetupInfoRef.current = setupInfo;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const refreshStatuses = async () => {
    const [config, embedded] = await Promise.all([
      getWhatsAppConfig(),
      getWhatsAppEmbeddedSignupStatus(),
    ]);

    setConfigStatus(config);
    setEmbeddedStatus(embedded);
    setActivateIntegration(Boolean(config.whatsappEnabled || config.enabled));
    setCanSchedule(config.canSchedule ?? true);
    setCanCancel(config.canCancel ?? true);
    setCanReschedule(config.canReschedule ?? true);
    setPhoneNumberId(embedded.phoneNumberId || config.phoneNumberId || "");
    setBusinessAccountId(embedded.businessAccountId || config.businessAccountId || "");
    setBusinessId(embedded.businessId || config.businessId || "");
    setDisplayPhoneNumber(
      embedded.displayPhoneNumber || config.displayPhoneNumber || ""
    );
    setWebhookVerifyToken(
      embedded.webhookVerifyToken || config.webhookVerifyToken || ""
    );
  };

  const handleCopy = async (value: string, successMessage: string) => {
    if (!value.trim()) {
      toast.error("Nenhum valor disponivel para copiar.");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("Nao foi possivel copiar para a area de transferencia.");
    }
  };

  const handleFinalizeEmbeddedSignup = async (code: string) => {
    const setupInfo = pendingSetupInfoRef.current;
    if (!setupInfo?.wabaId || !setupInfo.phoneNumberId) {
      toast.error(
        "A Meta nao retornou todos os dados do onboarding no navegador. Reabra o fluxo e conclua novamente."
      );
      return;
    }

    try {
      setIsFinalizingEmbeddedSignup(true);
      const response = await completeWhatsAppEmbeddedSignup({
        code,
        setupInfo: {
          wabaId: setupInfo.wabaId,
          phoneNumberId: setupInfo.phoneNumberId,
          businessId: setupInfo.businessId,
          phoneNumber: setupInfo.phoneNumber,
        },
      });

      setEmbeddedStatus(response);
      await refreshStatuses();
      await queryClient.invalidateQueries({ queryKey: ["tenant"] });
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
      toast.success("WhatsApp conectado com sucesso via Meta.");
    } catch (error) {
      toast.error(
        resolveUiError(error, "Erro ao concluir Embedded Signup do WhatsApp").message
      );
      await refreshStatuses().catch(() => undefined);
    } finally {
      setIsFinalizingEmbeddedSignup(false);
      pendingSetupInfoRef.current = null;
    }
  };

  const handleLaunchEmbeddedSignup = async () => {
    if (!isEmbeddedConfigured) {
      toast.error(
        "Configure VITE_META_APP_ID, VITE_META_CONFIG_ID e VITE_META_EMBEDDED_REDIRECT_URI no frontend."
      );
      return;
    }

    try {
      setIsLaunchingEmbeddedSignup(true);
      pendingSetupInfoRef.current = null;

      const sdk = await loadMetaSdk(metaAppId);
      await new Promise<void>((resolve, reject) => {
        sdk.login(
          (response) => {
            const code = response.authResponse?.code?.trim();
            if (!code) {
              const fallbackMessage =
                response.status === "not_authorized"
                  ? "A Meta nao autorizou o app para concluir o Embedded Signup. Verifique permissoes, app/config e a conta usada no popup."
                  : response.status === "unknown"
                    ? "A Meta retornou status=unknown no Embedded Signup. Isso geralmente indica cancelamento do popup, fechamento da janela ou falha de configuracao/autorizacao no app da Meta."
                    : "A Meta nao retornou o code do Embedded Signup.";

              reject(new Error(fallbackMessage));

              try {
                sdk.getLoginStatus(() => undefined);
              } catch {
                // noop: diagnostico complementar nao deve bloquear o fluxo
              }
              return;
            }
            resolve(handleFinalizeEmbeddedSignup(code));
          },
          {
            config_id: metaConfigId,
            response_type: "code",
            override_default_response_type: true,
            extras: {
              feature: "whatsapp_embedded_signup",
              sessionInfoVersion: 3,
              setup: {
                redirect_uri: metaRedirectUri,
              },
            },
          }
        );
      });
    } catch (error) {
      toast.error(
        resolveUiError(error, "Nao foi possivel iniciar o Embedded Signup da Meta.")
          .message
      );
    } finally {
      setIsLaunchingEmbeddedSignup(false);
    }
  };

  const handleSave = async () => {
    if (activateIntegration && !phoneNumberId.trim()) {
      toast.error("Conecte o WhatsApp via Meta antes de ativar a integracao.");
      return;
    }

    try {
      setIsSaving(true);
      setTestResult(EMPTY_RESULT);

      const response = await saveWhatsAppConfig({
        whatsappEnabled: activateIntegration,
        enabled: activateIntegration,
        phoneNumberId: phoneNumberId.trim(),
        businessAccountId: businessAccountId.trim() || undefined,
        webhookVerifyToken: webhookVerifyToken.trim() || undefined,
        canSchedule,
        canCancel,
        canReschedule,
      });

      setConfigStatus(response);
      setActivateIntegration(Boolean(response.whatsappEnabled || response.enabled));
      setCanSchedule(response.canSchedule ?? canSchedule);
      setCanCancel(response.canCancel ?? canCancel);
      setCanReschedule(response.canReschedule ?? canReschedule);
      setBusinessId(response.businessId || businessId);
      setDisplayPhoneNumber(response.displayPhoneNumber || displayPhoneNumber);
      setWebhookVerifyToken(response.webhookVerifyToken || webhookVerifyToken);

      toast.success(
        activateIntegration
          ? "Configuracao do WhatsApp salva com sucesso"
          : "Integracao do WhatsApp desativada com sucesso"
      );

      await refreshStatuses().catch(() => undefined);
      await queryClient.invalidateQueries({ queryKey: ["tenant"] });
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
    } catch (error) {
      toast.error(
        resolveUiError(error, "Erro ao salvar configuracao do WhatsApp").message
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!activateIntegration) {
      toast.error("Ative a integracao para testar a conexao");
      return;
    }

    try {
      setIsTesting(true);
      const result = await testWhatsAppConnection();
      setTestResult(result.message);
      if (result.success) {
        toast.success("Conexao validada");
      } else {
        toast.error(result.message || "Conexao nao validada");
      }
      await refreshStatuses().catch(() => undefined);
    } catch (error) {
      const uiError = resolveUiError(error, "Erro ao testar conexao com WhatsApp");
      setTestResult(uiError.message || "Nao foi possivel testar a conexao no momento.");
      toast.error(uiError.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <PlugZap className="h-5 w-5 text-primary" />
              Integracao WhatsApp
            </CardTitle>
            <CardDescription className="mt-1">
              Conecte o tenant via Meta Embedded Signup e mantenha o fallback
              manual apenas para suporte tecnico.
            </CardDescription>
          </div>
          {isConnected ? (
            <Badge className="border border-green-200 bg-green-50 text-green-700">
              WhatsApp Conectado
            </Badge>
          ) : (
            <Badge variant="outline">Nao conectado</Badge>
          )}
        </div>

        {!isEmbeddedConfigured ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4 !text-amber-700" />
            <AlertTitle>Embedded Signup ainda nao configurado no frontend</AlertTitle>
            <AlertDescription>
              Defina <code>VITE_META_APP_ID</code>, <code>VITE_META_CONFIG_ID</code>{" "}
              e <code>VITE_META_EMBEDDED_REDIRECT_URI</code> para habilitar o
              botao da Meta.
            </AlertDescription>
          </Alert>
        ) : null}

        {embeddedStatus?.lastError ? (
          <Alert className="border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4 !text-red-700" />
            <AlertTitle>Ultima falha do onboarding</AlertTitle>
            <AlertDescription>{embeddedStatus.lastError}</AlertDescription>
          </Alert>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Status do onboarding</p>
            <p className="text-xs text-muted-foreground">{onboardingStatus}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Origem do token</p>
            <p className="text-xs text-muted-foreground">{tokenSource}</p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed bg-muted/30 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Conectar com a Meta</p>
              <p className="text-xs text-muted-foreground">
                Abre o fluxo oficial do Embedded Signup para vincular WABA,
                numero e token sem preenchimento manual.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleLaunchEmbeddedSignup}
              disabled={
                isLaunchingEmbeddedSignup ||
                isFinalizingEmbeddedSignup ||
                !isEmbeddedConfigured
              }
            >
              {isLaunchingEmbeddedSignup || isFinalizingEmbeddedSignup ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Conectar via Meta
            </Button>
          </div>
        </div>

        {!isConnected ? (
          <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
            <AlertCircle className="h-4 w-4 !text-yellow-700" />
            <AlertTitle>Integracao nao ativa</AlertTitle>
            <AlertDescription>
              Conclua o onboarding da Meta para habilitar o envio via WhatsApp.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Phone Number ID</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {phoneNumberId || "Nao informado"}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Business Account ID</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {businessAccountId || "Nao informado"}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Business ID</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {businessId || "Nao informado"}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Numero exibido</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {displayPhoneNumber || "Nao informado"}
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Webhook Verify Token</p>
              <p className="text-xs text-muted-foreground">
                Use este valor ao verificar o webhook do WhatsApp na Meta.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handleCopy(
                  webhookVerifyToken,
                  "Webhook verify token copiado."
                )
              }
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
          </div>
          <Input value={webhookVerifyToken} readOnly />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Ativar integracao</p>
            <p className="text-xs text-muted-foreground">
              Habilita envio, webhook e teste de conexao para o tenant.
            </p>
          </div>
          <Switch
            checked={activateIntegration}
            onCheckedChange={setActivateIntegration}
          />
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Status do token</p>
          <p className="text-xs text-muted-foreground">
            Token configurado automaticamente no backend: {isTokenConfigured ? "Sim" : "Nao"}.
          </p>
        </div>

        <div className="rounded-lg border p-3 space-y-3">
          <p className="text-sm font-medium">Permissoes de acao via WhatsApp</p>
          <p className="text-xs text-muted-foreground">
            Defina quais operacoes o cliente pode executar pelo WhatsApp.
          </p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Permitir agendamento</p>
              <p className="text-xs text-muted-foreground">
                Autoriza criar novos agendamentos.
              </p>
            </div>
            <Switch
              checked={canSchedule}
              onCheckedChange={setCanSchedule}
              disabled={!activateIntegration || isSaving}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Permitir cancelamento</p>
              <p className="text-xs text-muted-foreground">
                Autoriza cancelar agendamentos existentes.
              </p>
            </div>
            <Switch
              checked={canCancel}
              onCheckedChange={setCanCancel}
              disabled={!activateIntegration || isSaving}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Permitir remarcacao</p>
              <p className="text-xs text-muted-foreground">
                Autoriza remarcar agendamentos existentes.
              </p>
            </div>
            <Switch
              checked={canReschedule}
              onCheckedChange={setCanReschedule}
              disabled={!activateIntegration || isSaving}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              isSaving ||
              isTesting ||
              isLaunchingEmbeddedSignup ||
              isFinalizingEmbeddedSignup
            }
            className="sm:w-auto"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar Configuracao
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || isSaving}
            className="sm:w-auto"
          >
            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Testar Conexao
          </Button>
        </div>

        {testResult ? (
          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            <CheckCircle2 className="h-4 w-4 !text-blue-700" />
            <AlertTitle>Resultado do teste</AlertTitle>
            <AlertDescription>{testResult}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
