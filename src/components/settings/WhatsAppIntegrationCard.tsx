import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  PlugZap,
  Send,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  completeWhatsAppEmbeddedSignup,
  getWhatsAppConfig,
  getWhatsAppEmbeddedSignupStatus,
  saveWhatsAppConfig,
  sendWhatsAppTestMessage,
  testWhatsAppConnection,
  validateWhatsAppConnection,
} from "@/services/whatsappService";
import type {
  WhatsAppConfigResponse,
  WhatsAppEmbeddedSignupStatusResponse,
  WhatsAppTestMessageResponse,
  WhatsAppValidateConnectionResponse,
} from "@/types/whatsapp";
import { resolveUiError } from "@/lib/error-utils";

const EMPTY_RESULT = "";
const META_SDK_SRC = "https://connect.facebook.net/pt_BR/sdk.js";
const META_GRAPH_VERSION = "v23.0";
const META_BUSINESS_HOME_URL = "https://business.facebook.com/latest/home";
const META_BUSINESS_SETTINGS_URL = "https://business.facebook.com/latest/settings";
const META_WHATSAPP_MANAGER_URL = "https://business.facebook.com/latest/whatsapp_manager";
const META_SYSTEM_USERS_URL = "https://business.facebook.com/latest/settings/system-users";
const META_GRAPH_EXPLORER_URL = "https://developers.facebook.com/tools/explorer/";
const WIZARD_STEPS = [
  "Verificacao inicial",
  "Business Manager",
  "Criacao do WABA",
  "Vinculacao do numero",
  "Insercao do token",
  "Configuracao do webhook",
  "Validacao da conexao",
] as const;

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

type SetupMode = "wizard" | "meta";

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

function resolveStepStatus(currentStep: number, targetStep: number) {
  if (currentStep > targetStep) return "done";
  if (currentStep === targetStep) return "current";
  return "upcoming";
}

function MetaLinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
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

export function WhatsAppIntegrationCard() {
  const queryClient = useQueryClient();
  const [setupMode, setSetupMode] = useState<SetupMode>("wizard");
  const [currentStep, setCurrentStep] = useState(1);
  const [activateIntegration, setActivateIntegration] = useState(false);
  const [canSchedule, setCanSchedule] = useState(true);
  const [canCancel, setCanCancel] = useState(true);
  const [canReschedule, setCanReschedule] = useState(true);
  const [manualAccessToken, setManualAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [webhookVerifyToken, setWebhookVerifyToken] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");
  const [testDestinationPhone, setTestDestinationPhone] = useState("");
  const [testMessageBody, setTestMessageBody] = useState("Mensagem de teste do AZZO Agenda Pro.");
  const [embeddedStatus, setEmbeddedStatus] =
    useState<WhatsAppEmbeddedSignupStatusResponse | null>(null);
  const [configStatus, setConfigStatus] =
    useState<WhatsAppConfigResponse | null>(null);
  const [testResult, setTestResult] = useState(EMPTY_RESULT);
  const [validationResult, setValidationResult] =
    useState<WhatsAppValidateConnectionResponse | null>(null);
  const [testMessageResult, setTestMessageResult] =
    useState<WhatsAppTestMessageResponse | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isValidatingConnection, setIsValidatingConnection] = useState(false);
  const [isSendingTestMessage, setIsSendingTestMessage] = useState(false);
  const [isLaunchingEmbeddedSignup, setIsLaunchingEmbeddedSignup] = useState(false);
  const [isFinalizingEmbeddedSignup, setIsFinalizingEmbeddedSignup] = useState(false);

  const pendingSetupInfoRef = useRef<EmbeddedSetupInfo | null>(null);

  const apiBaseUrl =
    (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, "") ||
    "http://localhost:8080/api/v1";
  const metaAppId = (import.meta.env.VITE_META_APP_ID as string | undefined)?.trim() || "";
  const metaConfigId = (import.meta.env.VITE_META_CONFIG_ID as string | undefined)?.trim() || "";
  const metaRedirectUri =
    (import.meta.env.VITE_META_EMBEDDED_REDIRECT_URI as string | undefined)?.trim() || "";
  const webhookUrl = apiBaseUrl.replace(/\/api\/v\d+$/, "") + "/webhook/whatsapp";
  const webhookNeedsPublicUrl = /localhost|127\.0\.0\.1/i.test(webhookUrl);

  const isConnected = Boolean(
    embeddedStatus?.connected || configStatus?.whatsappEnabled || configStatus?.enabled
  );
  const isTokenConfigured = Boolean(
    embeddedStatus?.accessTokenConfigured || configStatus?.accessTokenConfigured
  );
  const embeddedSignupEnabled = Boolean(
    embeddedStatus?.embeddedSignupEnabled ?? configStatus?.embeddedSignupEnabled
  );
  const isEmbeddedConfigured = Boolean(metaAppId && metaConfigId && metaRedirectUri);
  const onboardingStatus =
    embeddedStatus?.onboardingStatus || configStatus?.onboardingStatus || "NOT_STARTED";
  const tokenSource = embeddedStatus?.tokenSource || configStatus?.tokenSource || "MANUAL";
  const canAdvanceStep = useMemo(() => {
    if (currentStep <= 3) return true;
    if (currentStep === 4) {
      return Boolean(phoneNumberId.trim() && businessAccountId.trim());
    }
    if (currentStep === 5) {
      return Boolean(phoneNumberId.trim() && (isTokenConfigured || manualAccessToken.trim()));
    }
    if (currentStep === 6) {
      return true;
    }
    return false;
  }, [businessAccountId, currentStep, isTokenConfigured, manualAccessToken, phoneNumberId]);

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        const [config, embedded] = await Promise.all([
          getWhatsAppConfig(),
          getWhatsAppEmbeddedSignupStatus(),
        ]);
        if (!mounted) return;

        const embeddedEnabled =
          embedded.embeddedSignupEnabled ?? config.embeddedSignupEnabled ?? false;

        setConfigStatus(config);
        setEmbeddedStatus(embedded);
        setSetupMode(embeddedEnabled && tokenSource === "EMBEDDED_CODE_EXCHANGE" ? "meta" : "wizard");
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
  }, [tokenSource]);

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

  useEffect(() => {
    setValidationResult(null);
    setTestMessageResult(null);
  }, [manualAccessToken, phoneNumberId]);

  const refreshStatuses = async () => {
    const [config, embedded] = await Promise.all([
      getWhatsAppConfig(),
      getWhatsAppEmbeddedSignupStatus(),
    ]);

    const embeddedEnabled =
      embedded.embeddedSignupEnabled ?? config.embeddedSignupEnabled ?? false;

    setConfigStatus(config);
    setEmbeddedStatus(embedded);
    setSetupMode(embeddedEnabled && tokenSource === "EMBEDDED_CODE_EXCHANGE" ? "meta" : "wizard");
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
                // noop
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

  const handleValidateConnection = async () => {
    const token = manualAccessToken.trim();
    if (!token && !isTokenConfigured) {
      toast.error("Informe o Access Token para validar a conexao.");
      return;
    }
    if (!phoneNumberId.trim()) {
      toast.error("Informe o Phone Number ID para validar a conexao.");
      return;
    }

    try {
      setIsValidatingConnection(true);
      const result = await validateWhatsAppConnection({
        accessToken: token,
        phoneNumberId: phoneNumberId.trim(),
      });
      setValidationResult(result);
      setDisplayPhoneNumber((prev) => result.displayPhoneNumber || prev);
      toast.success("Conexao com a Meta validada com sucesso.");
    } catch (error) {
      setValidationResult(null);
      toast.error(
        resolveUiError(error, "Nao foi possivel validar a conexao com a Meta.").message
      );
    } finally {
      setIsValidatingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!phoneNumberId.trim()) {
      toast.error("Informe o Phone Number ID para salvar a configuracao.");
      return;
    }
    if (!businessAccountId.trim()) {
      toast.error("Informe o WABA/Business Account ID para salvar a configuracao.");
      return;
    }
    if (!isTokenConfigured && !manualAccessToken.trim()) {
      toast.error("Informe o Access Token na primeira configuracao do WhatsApp.");
      return;
    }

    try {
      setIsSaving(true);
      setTestResult(EMPTY_RESULT);
      setTestMessageResult(null);

      const trimmedAccessToken = manualAccessToken.trim();
      const response = await saveWhatsAppConfig({
        whatsappEnabled: activateIntegration,
        enabled: activateIntegration,
        accessToken: trimmedAccessToken || undefined,
        phoneNumberId: phoneNumberId.trim(),
        businessAccountId: businessAccountId.trim() || undefined,
        businessId: businessId.trim() || undefined,
        displayPhoneNumber: displayPhoneNumber.trim() || undefined,
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
      setManualAccessToken("");

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

  const handleSendTestMessage = async () => {
    if (!testDestinationPhone.trim()) {
      toast.error("Informe o telefone de destino para enviar a mensagem de teste.");
      return;
    }

    try {
      setIsSendingTestMessage(true);
      const result = await sendWhatsAppTestMessage({
        destinationPhone: testDestinationPhone.trim(),
        message: testMessageBody.trim() || undefined,
      });
      setTestMessageResult(result);
      if (result.success) {
        toast.success("Mensagem de teste enviada.");
      } else {
        toast.error(result.message || "Falha ao enviar mensagem de teste.");
      }
    } catch (error) {
      const uiError = resolveUiError(error, "Nao foi possivel enviar a mensagem de teste.");
      setTestMessageResult({
        success: false,
        message: uiError.message,
      });
      toast.error(uiError.message);
    } finally {
      setIsSendingTestMessage(false);
    }
  };

  const renderWizard = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {WIZARD_STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const stepStatus = resolveStepStatus(currentStep, stepNumber);
          return (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  stepStatus === "done"
                    ? "bg-primary text-primary-foreground"
                    : stepStatus === "current"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {stepStatus === "done" ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              {stepNumber < WIZARD_STEPS.length && (
                <div
                  className={`mx-2 h-1 w-6 rounded sm:w-10 ${
                    currentStep > stepNumber ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">
            Etapa {currentStep} de {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1]}
          </CardTitle>
          <CardDescription>
            Fluxo guiado para conectar o WhatsApp Cloud API do tenant sem Embedded Signup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 1 ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Antes de iniciar</AlertTitle>
                <AlertDescription>
                  Antes de configurar no AZZO, confirme que o cliente tem acesso de administrador ao portifolio da empresa na Meta, ao WhatsApp Business Account e ao numero que sera conectado.
                </AlertDescription>
              </Alert>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Checklist minimo:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Entrar com o Facebook que administra a empresa do cliente.</li>
                  <li>Selecionar o business portfolio correto no topo da Meta Business Suite.</li>
                  <li>Ter acesso a `Accounts &gt; WhatsApp Accounts`.</li>
                  <li>Ter acesso a `Users &gt; System Users` para gerar o token.</li>
                  <li>Ter o numero disponivel para verificacao por SMS ou voz, se ainda nao estiver vinculado.</li>
                </ol>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Webhook Verify Token</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {webhookVerifyToken || "Sera gerado automaticamente ao salvar."}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Status atual</p>
                  <p className="mt-1 text-xs text-muted-foreground">{onboardingStatus}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_BUSINESS_HOME_URL}>
                  Abrir Business Manager
                </MetaLinkButton>
                <MetaLinkButton href={META_BUSINESS_SETTINGS_URL}>
                  Abrir configuracoes da empresa
                </MetaLinkButton>
              </div>
            </>
          ) : null}

          {currentStep === 2 ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acesso ao Business Manager</AlertTitle>
                <AlertDescription>
                  Use esta etapa para localizar o portfolio correto da empresa e abrir a area onde o WhatsApp Business Account sera criado ou administrado.
                </AlertDescription>
              </Alert>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Caminho esperado: Business Manager → Accounts → WhatsApp Accounts.
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Clique em `Abrir Business Manager`.</li>
                  <li>Escolha a empresa correta no seletor de portfolio.</li>
                  <li>Abra `Accounts` e depois `WhatsApp Accounts`.</li>
                  <li>Se ja existir uma conta do WhatsApp para o cliente, selecione essa conta.</li>
                  <li>Se nao existir, avance para criar uma nova conta na etapa seguinte.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Dado que o cliente precisa confirmar aqui: ele esta no business portfolio certo. Se entrar na empresa errada, todos os IDs copiados nas proximas etapas ficarao incorretos.
              </div>
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_BUSINESS_HOME_URL}>
                  Entrar no Business Manager
                </MetaLinkButton>
                <MetaLinkButton href={META_BUSINESS_SETTINGS_URL}>
                  Abrir Business Settings
                </MetaLinkButton>
              </div>
            </>
          ) : null}

          {currentStep === 3 ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Criacao do WABA</AlertTitle>
                <AlertDescription>
                  Crie ou abra o WhatsApp Business Account do cliente. E nessa tela que voce vai chegar aos dados tecnicos usados pelo AZZO.
                </AlertDescription>
              </Alert>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                O que fazer no Facebook:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Clique em `Abrir WhatsApp Manager`.</li>
                  <li>Selecione ou crie a conta do WhatsApp Business da empresa.</li>
                  <li>Confirme que o numero esta vinculado a essa conta.</li>
                  <li>Anote o `WABA ID` da conta.</li>
                  <li>Anote tambem o `Business ID` da empresa, se estiver visivel na tela de configuracoes.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                O `WABA ID` e o identificador da conta do WhatsApp Business. No AZZO ele entra no campo `WABA / Business Account ID`.
              </div>
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_WHATSAPP_MANAGER_URL}>
                  Abrir WhatsApp Manager
                </MetaLinkButton>
                <MetaLinkButton href={META_BUSINESS_SETTINGS_URL}>
                  Abrir Business Settings
                </MetaLinkButton>
              </div>
            </>
          ) : null}

          {currentStep === 4 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_WHATSAPP_MANAGER_URL}>
                  Abrir numeros no WhatsApp Manager
                </MetaLinkButton>
                <MetaLinkButton href={META_BUSINESS_SETTINGS_URL}>
                  Abrir configuracoes da empresa
                </MetaLinkButton>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                O que copiar no Facebook e colar no AZZO:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>`WABA / Business Account ID`: ID da conta do WhatsApp Business.</li>
                  <li>`Business ID`: ID do portfolio/empresa na Meta.</li>
                  <li>`Phone Number ID`: ID tecnico do numero conectado na Cloud API.</li>
                  <li>`Numero exibido`: numero mostrado ao usuario final, se a Meta exibir esse campo.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                No WhatsApp Manager, entre no numero e procure pela area de detalhes/API do numero. O valor mais importante aqui e o `Phone Number ID`, porque e ele que o backend usa para validar e enviar mensagens.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="whatsapp-manual-business-account-id">
                    WABA / Business Account ID
                  </label>
                  <Input
                    id="whatsapp-manual-business-account-id"
                    value={businessAccountId}
                    placeholder="Ex.: 1943140936275518"
                    onChange={(event) => setBusinessAccountId(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="whatsapp-manual-business-id">
                    Business ID
                  </label>
                  <Input
                    id="whatsapp-manual-business-id"
                    value={businessId}
                    placeholder="Opcional, mas recomendado"
                    onChange={(event) => setBusinessId(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="whatsapp-manual-phone-number-id">
                    Phone Number ID
                  </label>
                  <Input
                    id="whatsapp-manual-phone-number-id"
                    value={phoneNumberId}
                    placeholder="Ex.: 1043083748882407"
                    onChange={(event) => setPhoneNumberId(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="whatsapp-manual-display-phone-number">
                    Numero exibido
                  </label>
                  <Input
                    id="whatsapp-manual-display-phone-number"
                    value={displayPhoneNumber}
                    placeholder="Opcional. Ex.: +55 11 99999-9999"
                    onChange={(event) => setDisplayPhoneNumber(event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 5 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_SYSTEM_USERS_URL}>
                  Abrir usuarios de sistema
                </MetaLinkButton>
                <MetaLinkButton href={META_GRAPH_EXPLORER_URL}>
                  Abrir Graph API Explorer
                </MetaLinkButton>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Como gerar o token:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Abra `Usuarios de sistema`.</li>
                  <li>Crie ou selecione um system user com permissao administrativa.</li>
                  <li>Conceda acesso ao app e aos ativos do WhatsApp da empresa.</li>
                  <li>Gere um `Access Token` com as permissoes `business_management`, `whatsapp_business_management` e `whatsapp_business_messaging`.</li>
                  <li>Cole esse token no campo `Access Token` do AZZO.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                O `Webhook Verify Token` pode ficar em branco. Se voce nao preencher, o AZZO gera automaticamente ao salvar e mostra o valor para configuracao do webhook depois.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="whatsapp-manual-access-token">
                    Access Token
                  </label>
                  <Input
                    id="whatsapp-manual-access-token"
                    type="password"
                    autoComplete="off"
                    value={manualAccessToken}
                    placeholder={
                      isTokenConfigured
                        ? "Ja configurado no backend. Preencha apenas para substituir."
                        : "Cole o access token do WhatsApp Cloud API"
                    }
                    onChange={(event) => setManualAccessToken(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token configurado no backend: {isTokenConfigured ? "Sim" : "Nao"}.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium" htmlFor="whatsapp-manual-webhook-token">
                      Webhook Verify Token
                    </label>
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
                  <Input
                    id="whatsapp-manual-webhook-token"
                    value={webhookVerifyToken}
                    placeholder="Gerado automaticamente se ficar em branco"
                    onChange={(event) => setWebhookVerifyToken(event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 6 ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Agora o cliente precisa cadastrar o webhook da AZZO na Meta para que mensagens e status de entrega cheguem ao sistema.
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Abra o app da Meta e va para a configuracao de webhook do WhatsApp.</li>
                  <li>No campo `Callback URL`, cole a URL abaixo.</li>
                  <li>No campo `Verify Token`, cole o token abaixo.</li>
                  <li>Clique em verificar/salvar na Meta.</li>
                  <li>Depois, assine ao menos o objeto `messages` ou o conjunto de campos de mensagens/status usado no app.</li>
                </ol>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_BUSINESS_SETTINGS_URL}>
                  Abrir configuracoes da empresa
                </MetaLinkButton>
                <MetaLinkButton href={META_WHATSAPP_MANAGER_URL}>
                  Abrir WhatsApp Manager
                </MetaLinkButton>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">Callback URL</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(webhookUrl, "URL do webhook copiada.")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                  <Input value={webhookUrl} readOnly />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">Verify Token</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy(
                          webhookVerifyToken,
                          "Verify token do webhook copiado."
                        )
                      }
                      disabled={!webhookVerifyToken}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                  <Input
                    value={webhookVerifyToken}
                    readOnly
                    placeholder="Preencha ou gere o verify token na etapa anterior."
                  />
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante sobre o verify token</AlertTitle>
                <AlertDescription>
                  Se esse campo estiver vazio, volte para a etapa anterior e preencha manualmente o `Webhook Verify Token`, ou salve a configuracao para o AZZO gerar um token automaticamente e depois retorne a esta etapa.
                </AlertDescription>
              </Alert>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Depois que a Meta validar a URL, assine os campos do webhook:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>`messages`: obrigatorio para receber mensagens inbound e status de entrega/leitura.</li>
                  <li>`message_template_status_update`: opcional, recomendado se o tenant usar templates.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Checklist final dentro da Meta:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Salvar o callback.</li>
                  <li>Confirmar que a verificacao retornou sucesso.</li>
                  <li>Marcar o campo `messages` na assinatura do webhook.</li>
                  <li>Salvar a inscricao do webhook no app.</li>
                </ol>
              </div>
              {webhookNeedsPublicUrl ? (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <AlertCircle className="h-4 w-4 !text-amber-700" />
                  <AlertTitle>URL local nao funciona na Meta</AlertTitle>
                  <AlertDescription>
                    A URL atual do webhook parece local (`localhost` ou `127.0.0.1`). Para a Meta validar e entregar eventos, use uma URL publica HTTPS do backend.
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}

          {currentStep === 7 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleValidateConnection}
                  disabled={isValidatingConnection || isSaving}
                >
                  {isValidatingConnection ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Validar com a Meta
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isTesting || isValidatingConnection}
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar Configuracao
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={isTesting || isSaving}
                >
                  {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Testar Conexao Salva
                </Button>
              </div>

              {validationResult ? (
                <Alert className="border-green-200 bg-green-50 text-green-900">
                  <CheckCircle2 className="h-4 w-4 !text-green-700" />
                  <AlertTitle>Validacao concluida</AlertTitle>
                  <AlertDescription>
                    {validationResult.message}
                    {validationResult.displayPhoneNumber
                      ? ` Numero exibido: ${validationResult.displayPhoneNumber}.`
                      : ""}
                    {validationResult.verifiedName
                      ? ` Nome verificado: ${validationResult.verifiedName}.`
                      : ""}
                  </AlertDescription>
                </Alert>
              ) : null}

              {testResult ? (
                <Alert className="border-blue-200 bg-blue-50 text-blue-900">
                  <CheckCircle2 className="h-4 w-4 !text-blue-700" />
                  <AlertTitle>Resultado do teste de conexao</AlertTitle>
                  <AlertDescription>{testResult}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium">Enviar mensagem de teste</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="whatsapp-test-destination-phone">
                      Telefone de destino
                    </label>
                    <Input
                      id="whatsapp-test-destination-phone"
                      value={testDestinationPhone}
                      placeholder="Ex.: 5511988887777"
                      onChange={(event) => setTestDestinationPhone(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="whatsapp-test-message">
                      Mensagem
                    </label>
                    <Input
                      id="whatsapp-test-message"
                      value={testMessageBody}
                      placeholder="Mensagem de teste do AZZO Agenda Pro."
                      onChange={(event) => setTestMessageBody(event.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendTestMessage}
                  disabled={isSendingTestMessage || isSaving}
                >
                  {isSendingTestMessage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar mensagem de teste
                </Button>
                {testMessageResult ? (
                  <Alert className={testMessageResult.success
                    ? "border-green-200 bg-green-50 text-green-900"
                    : "border-red-200 bg-red-50 text-red-900"}>
                    <CheckCircle2 className={`h-4 w-4 ${testMessageResult.success ? "!text-green-700" : "!text-red-700"}`} />
                    <AlertTitle>Resultado do envio</AlertTitle>
                    <AlertDescription>
                      {testMessageResult.message}
                      {testMessageResult.providerMessageId
                        ? ` Provider message id: ${testMessageResult.providerMessageId}`
                        : ""}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(WIZARD_STEPS.length, prev + 1))}
              disabled={currentStep === WIZARD_STEPS.length || !canAdvanceStep}
            >
              Proxima etapa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
              Fluxo guiado para conectar o WhatsApp Cloud API por tenant, com validacao, persistencia e teste de envio.
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

        {embeddedSignupEnabled && !isEmbeddedConfigured ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4 !text-amber-700" />
            <AlertTitle>Embedded Signup ainda nao configurado no frontend</AlertTitle>
            <AlertDescription>
              Defina <code>VITE_META_APP_ID</code>, <code>VITE_META_CONFIG_ID</code> e <code>VITE_META_EMBEDDED_REDIRECT_URI</code> para habilitar o fluxo da Meta.
            </AlertDescription>
          </Alert>
        ) : null}

        {embeddedSignupEnabled && embeddedStatus?.lastError ? (
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

        {embeddedSignupEnabled ? (
          <Tabs value={setupMode} onValueChange={(value) => setSetupMode(value as SetupMode)} className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-2">
              <TabsTrigger value="wizard">Cloud API guiado</TabsTrigger>
              <TabsTrigger value="meta">Meta</TabsTrigger>
            </TabsList>

            <TabsContent value="wizard" className="space-y-4">
              {renderWizard()}
            </TabsContent>

            <TabsContent value="meta" className="space-y-4">
              <div className="rounded-xl border border-dashed bg-muted/30 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Conectar com a Meta</p>
                    <p className="text-xs text-muted-foreground">
                      Fluxo futuro de Embedded Signup. O onboarding guiado da Cloud API continua disponivel na aba ao lado.
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
            </TabsContent>
          </Tabs>
        ) : (
          renderWizard()
        )}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Ativar integracao</p>
            <p className="text-xs text-muted-foreground">
              Habilita envio, webhook e fluxos de atendimento via WhatsApp para o tenant.
            </p>
          </div>
          <Switch
            checked={activateIntegration}
            onCheckedChange={setActivateIntegration}
          />
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Permissoes de acao via WhatsApp</p>
          <p className="text-xs text-muted-foreground">
            Defina quais operacoes o cliente pode executar pelo WhatsApp.
          </p>
          <div className="mt-3 space-y-3">
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
        </div>
      </CardContent>
    </Card>
  );
}

