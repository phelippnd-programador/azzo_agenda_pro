import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Phone,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Unplug,
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { whatsappApi } from "@/lib/api/whatsapp";
import type {
  WhatsAppConfigResponse,
  WhatsAppEmbeddedSignupStatusResponse,
  WhatsAppTestMessageResponse,
  WhatsAppValidateConnectionResponse,
} from "@/lib/api/whatsapp";
import { resolveUiError } from "@/lib/error-utils";
import { WhatsAppSetupWizard } from "@/components/settings/whatsapp-integration/WhatsAppSetupWizard";
import {
  EMPTY_RESULT,
  extractSetupInfo,
  loadMetaSdk,
  normalizeMessageEventData,
  type EmbeddedSetupInfo,
  type SetupMode,
} from "@/components/settings/whatsapp-integration/shared";
import { TemplateEditor } from "@/components/settings/whatsapp-integration/TemplateEditor";

export function WhatsAppIntegrationCard() {
  const queryClient = useQueryClient();
  const [setupMode, setSetupMode] = useState<SetupMode>("wizard");
  const [currentStep, setCurrentStep] = useState(1);
  const [activateIntegration, setActivateIntegration] = useState(false);
  const [usageProfile, setUsageProfile] = useState<import("@/lib/api/whatsapp").WhatsAppUsageProfile>("COMPLETE");
  const [canSchedule, setCanSchedule] = useState(true);
  const [canCancel, setCanCancel] = useState(true);
  const [canReschedule, setCanReschedule] = useState(true);
  const [manualAccessToken, setManualAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [webhookVerifyToken, setWebhookVerifyToken] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");
  const [confirmationTemplate, setConfirmationTemplate] = useState("");
  const [cancellationTemplate, setCancellationTemplate] = useState("");
  const [reminderTemplate, setReminderTemplate] = useState("");
  const [showMessageLog, setShowMessageLog] = useState(false);
  const [messageLog, setMessageLog] = useState<import("@/lib/api/whatsapp").WhatsAppMessageLogItem[]>([]);
  const [isLoadingLog, setIsLoadingLog] = useState(false);
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
          whatsappApi.getConfig(),
          whatsappApi.getEmbeddedSignupStatus(),
        ]);
        if (!mounted) return;

        const embeddedEnabled =
          embedded.embeddedSignupEnabled ?? config.embeddedSignupEnabled ?? false;

        setConfigStatus(config);
        setEmbeddedStatus(embedded);
        setSetupMode(embeddedEnabled && tokenSource === "EMBEDDED_CODE_EXCHANGE" ? "meta" : "wizard");
        setActivateIntegration(Boolean(config.whatsappEnabled));
        setUsageProfile((config.usageProfile as import("@/lib/api/whatsapp").WhatsAppUsageProfile) ?? "COMPLETE");
        setCanSchedule(config.canSchedule ?? true);
        setCanCancel(config.canCancel ?? true);
        setCanReschedule(config.canReschedule ?? true);
        setConfirmationTemplate(config.confirmationMessageTemplate ?? "");
        setCancellationTemplate(config.cancellationMessageTemplate ?? "");
        setReminderTemplate(config.reminderMessageTemplate ?? "");
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
        // Pula para o último passo se já estiver conectado
        const status = embedded.onboardingStatus || config.onboardingStatus || "NOT_STARTED";
        if (status === "CONNECTED") {
          setCurrentStep(7);
        }
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
      whatsappApi.getConfig(),
      whatsappApi.getEmbeddedSignupStatus(),
    ]);

    const embeddedEnabled =
      embedded.embeddedSignupEnabled ?? config.embeddedSignupEnabled ?? false;

    setConfigStatus(config);
    setEmbeddedStatus(embedded);
    setSetupMode(embeddedEnabled && tokenSource === "EMBEDDED_CODE_EXCHANGE" ? "meta" : "wizard");
    setActivateIntegration(Boolean(config.whatsappEnabled));
    setUsageProfile((config.usageProfile as import("@/lib/api/whatsapp").WhatsAppUsageProfile) ?? "COMPLETE");
    setCanSchedule(config.canSchedule ?? true);
    setCanCancel(config.canCancel ?? true);
    setCanReschedule(config.canReschedule ?? true);
    setConfirmationTemplate(config.confirmationMessageTemplate ?? "");
    setCancellationTemplate(config.cancellationMessageTemplate ?? "");
    setReminderTemplate(config.reminderMessageTemplate ?? "");
    setPhoneNumberId(embedded.phoneNumberId || config.phoneNumberId || "");
    setBusinessAccountId(embedded.businessAccountId || config.businessAccountId || "");
    setBusinessId(embedded.businessId || config.businessId || "");
    setDisplayPhoneNumber(embedded.displayPhoneNumber || config.displayPhoneNumber || "");
    setWebhookVerifyToken(embedded.webhookVerifyToken || config.webhookVerifyToken || "");
    const status = embedded.onboardingStatus || config.onboardingStatus || "NOT_STARTED";
    if (status === "CONNECTED") setCurrentStep(7);
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
      const response = await whatsappApi.completeEmbeddedSignup({
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
      const result = await whatsappApi.validateConnection({
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
      const response = await whatsappApi.saveConfig({
        whatsappEnabled: activateIntegration,
        accessToken: trimmedAccessToken || undefined,
        phoneNumberId: phoneNumberId.trim(),
        businessAccountId: businessAccountId.trim() || undefined,
        businessId: businessId.trim() || undefined,
        displayPhoneNumber: displayPhoneNumber.trim() || undefined,
        webhookVerifyToken: webhookVerifyToken.trim() || undefined,
        usageProfile,
        canSchedule,
        canCancel,
        canReschedule,
        confirmationMessageTemplate: confirmationTemplate.trim() || undefined,
        cancellationMessageTemplate: cancellationTemplate.trim() || undefined,
        reminderMessageTemplate: reminderTemplate.trim() || undefined,
      });

      setConfigStatus(response);
      setActivateIntegration(Boolean(response.whatsappEnabled));
      setUsageProfile((response.usageProfile as import("@/lib/api/whatsapp").WhatsAppUsageProfile) ?? usageProfile);
      setCanSchedule(response.canSchedule ?? canSchedule);
      setCanCancel(response.canCancel ?? canCancel);
      setCanReschedule(response.canReschedule ?? canReschedule);
      setConfirmationTemplate(response.confirmationMessageTemplate ?? confirmationTemplate);
      setCancellationTemplate(response.cancellationMessageTemplate ?? cancellationTemplate);
      setReminderTemplate(response.reminderMessageTemplate ?? reminderTemplate);
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

  // Persiste preferências simples via PATCH — sem tocar em token ou phoneNumberId
  const saveField = async (patch: import("@/lib/api/whatsapp").WhatsAppSettingsPatch) => {
    try {
      setIsSaving(true);
      await whatsappApi.patchSettings(patch);
      toast.success("Configuracao salva");
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao salvar configuracao").message);
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
      const result = await whatsappApi.testConnection();
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
    const phone = testDestinationPhone.trim();
    if (!phone) {
      toast.error("Informe o telefone de destino para enviar a mensagem de teste.");
      return;
    }
    if (!/^\+\d{10,15}$/.test(phone)) {
      toast.error("Informe o telefone no formato internacional: +55 11 99999-9999 (somente digitos apos o +).");
      return;
    }

    try {
      setIsSendingTestMessage(true);
      const result = await whatsappApi.sendTestMessage({
        destinationPhone: phone,
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

  const renderStatusPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-green-800">WhatsApp conectado</p>
          {displayPhoneNumber && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-green-700">
              <Phone className="h-3 w-3" />
              {displayPhoneNumber}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => void handleTest()}
          disabled={isTesting}
        >
          {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-1.5">Testar</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 text-destructive hover:bg-destructive/10"
          onClick={() => setCurrentStep(1)}
        >
          <Unplug className="h-4 w-4" />
          <span className="ml-1.5">Reconfigurar</span>
        </Button>
      </div>

      {testResult && (
        <Alert variant={testResult.toLowerCase().includes("sucesso") ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Resultado do teste</AlertTitle>
          <AlertDescription>{testResult}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {phoneNumberId && (
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Phone Number ID</p>
            <p className="mt-1 break-all text-sm">{phoneNumberId}</p>
          </div>
        )}
        {businessAccountId && (
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Business Account ID</p>
            <p className="mt-1 break-all text-sm">{businessAccountId}</p>
          </div>
        )}
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">Origem do token</p>
          <p className="mt-1 text-sm">{tokenSource === "EMBEDDED_CODE_EXCHANGE" ? "Meta (Embedded Signup)" : "Manual"}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">Status de onboarding</p>
          <p className="mt-1 text-sm">{onboardingStatus}</p>
        </div>
      </div>

      {/* Templates de mensagem */}
      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">Templates de mensagem automatica</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Clique nos chips para inserir variaveis na posicao do cursor. Deixe em branco para usar o texto padrao.
          </p>
        </div>
        <TemplateEditor
          label="Confirmacao de agendamento"
          placeholder="Ola, {cliente}! Seu agendamento de {servico} foi confirmado para {data} as {hora} com {profissional}. Aguardamos voce no {salao}!"
          value={confirmationTemplate}
          onChange={setConfirmationTemplate}
        />
        <TemplateEditor
          label="Cancelamento de agendamento"
          placeholder="Ola, {cliente}! Seu agendamento de {servico} do dia {data} as {hora} foi cancelado. Para reagendar, e so nos chamar!"
          value={cancellationTemplate}
          onChange={setCancellationTemplate}
        />
        <TemplateEditor
          label="Lembrete (24h antes)"
          placeholder="Ola, {cliente}! Lembrando que voce tem {servico} amanha ({data}) as {hora} com {profissional} no {salao}."
          value={reminderTemplate}
          onChange={setReminderTemplate}
        />
        <Button size="sm" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Salvar templates
        </Button>
      </div>

      {/* Log de mensagens */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Histórico de mensagens</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowMessageLog((v) => !v);
              if (!showMessageLog) {
                setIsLoadingLog(true);
                whatsappApi.getMessageLog(50)
                  .then((r) => setMessageLog(r.items))
                  .catch(() => setMessageLog([]))
                  .finally(() => setIsLoadingLog(false));
              }
            }}
          >
            {showMessageLog ? "Ocultar" : "Ver histórico"}
          </Button>
        </div>
        {showMessageLog && (
          isLoadingLog ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : messageLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma mensagem enviada ainda.</p>
          ) : (
            <div className="divide-y text-sm max-h-72 overflow-y-auto">
              {messageLog.map((item) => (
                <div key={item.id} className="py-2 flex gap-3 items-start">
                  <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${item.status === "SENT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs text-muted-foreground">{item.eventType} → {item.destinationPhone}</p>
                    <p className="truncate text-xs mt-0.5">{item.messageText}</p>
                    {item.errorMessage && <p className="text-xs text-destructive mt-0.5">{item.errorMessage}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{new Date(item.sentAt).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );

  const renderWizard = () => (
    <WhatsAppSetupWizard
      currentStep={currentStep}
      onboardingStatus={onboardingStatus}
      webhookVerifyToken={webhookVerifyToken}
      businessAccountId={businessAccountId}
      businessId={businessId}
      phoneNumberId={phoneNumberId}
      displayPhoneNumber={displayPhoneNumber}
      manualAccessToken={manualAccessToken}
      isTokenConfigured={isTokenConfigured}
      webhookUrl={webhookUrl}
      webhookNeedsPublicUrl={webhookNeedsPublicUrl}
      canAdvanceStep={canAdvanceStep}
      isSaving={isSaving}
      isTesting={isTesting}
      isValidatingConnection={isValidatingConnection}
      isSendingTestMessage={isSendingTestMessage}
      validationResult={validationResult}
      testResult={testResult}
      testDestinationPhone={testDestinationPhone}
      testMessageBody={testMessageBody}
      testMessageResult={testMessageResult}
      onBusinessAccountIdChange={setBusinessAccountId}
      onBusinessIdChange={setBusinessId}
      onPhoneNumberIdChange={setPhoneNumberId}
      onDisplayPhoneNumberChange={setDisplayPhoneNumber}
      onManualAccessTokenChange={setManualAccessToken}
      onWebhookVerifyTokenChange={setWebhookVerifyToken}
      onTestDestinationPhoneChange={setTestDestinationPhone}
      onTestMessageBodyChange={setTestMessageBody}
      onCopy={handleCopy}
      onPrevious={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
      onNext={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
      onValidateConnection={handleValidateConnection}
      onSave={handleSave}
      onTest={handleTest}
      onSendTestMessage={handleSendTestMessage}
    />
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
        {isConnected && onboardingStatus === "CONNECTED" && currentStep === 7 ? (
          renderStatusPanel()
        ) : embeddedSignupEnabled ? (
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

        <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Ativar integracao</p>
            <p className="text-xs text-muted-foreground">
              Habilita envio, webhook e fluxos de atendimento via WhatsApp para o tenant.
            </p>
          </div>
          <Switch
            checked={activateIntegration}
            disabled={isSaving}
            onCheckedChange={(val) => {
              setActivateIntegration(val);
              void saveField({ whatsappEnabled: val });
            }}
          />
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Como voce quer usar o WhatsApp?</p>
          <p className="text-xs text-muted-foreground">
            Escolha o perfil de uso. Ele determina quais mensagens automaticas serao enviadas e impacta o custo por conversa na Meta.
          </p>
          <div className="mt-3 space-y-2">
            {(
              [
                {
                  value: "REACTIVE_ONLY" as const,
                  label: "Somente chat",
                  description: "Apenas responde mensagens recebidas dos clientes. Custo ~R$ 0,06/conversa (cliente iniciou).",
                },
                {
                  value: "NOTIFICATIONS" as const,
                  label: "Notificacoes",
                  description: "Envia lembretes, confirmacoes e avisos de cancelamento. Custo ~R$ 0,25/conversa (voce iniciou).",
                },
                {
                  value: "COMPLETE" as const,
                  label: "Completo",
                  description: "Tudo acima mais reativacao de clientes que abandonaram o fluxo de agendamento.",
                },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                  usageProfile === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                } ${!activateIntegration || isSaving ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="usageProfile"
                  value={option.value}
                  checked={usageProfile === option.value}
                  onChange={() => {
                    const newProfile = option.value;
                    setUsageProfile(newProfile);
                    void saveField({ usageProfile: newProfile });
                  }}
                  disabled={!activateIntegration || isSaving}
                  className="mt-0.5 accent-primary"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Permissoes de acao via WhatsApp</p>
          <p className="text-xs text-muted-foreground">
            Defina quais operacoes o cliente pode executar pelo WhatsApp.
          </p>
          <div className="mt-3 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Permitir agendamento</p>
                <p className="text-xs text-muted-foreground">
                  Autoriza criar novos agendamentos.
                </p>
              </div>
              <Switch
                checked={canSchedule}
                disabled={!activateIntegration || isSaving}
                onCheckedChange={(val) => {
                  setCanSchedule(val);
                  void saveField({ canSchedule: val });
                }}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Permitir cancelamento</p>
                <p className="text-xs text-muted-foreground">
                  Autoriza cancelar agendamentos existentes.
                </p>
              </div>
              <Switch
                checked={canCancel}
                disabled={!activateIntegration || isSaving}
                onCheckedChange={(val) => {
                  setCanCancel(val);
                  void saveField({ canCancel: val });
                }}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Permitir remarcacao</p>
                <p className="text-xs text-muted-foreground">
                  Autoriza remarcar agendamentos existentes.
                </p>
              </div>
              <Switch
                checked={canReschedule}
                disabled={!activateIntegration || isSaving}
                onCheckedChange={(val) => {
                  setCanReschedule(val);
                  void saveField({ canReschedule: val });
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
