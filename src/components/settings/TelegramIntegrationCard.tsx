import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { telegramApi } from "@/lib/api/telegram";
import type {
  TelegramConfigResponse,
  TelegramValidateConnectionResponse,
} from "@/lib/api/telegram";
import { resolveUiError } from "@/lib/error-utils";

const DEFAULT_TEST_MESSAGE = "Mensagem de teste do AZZO Agenda Pro.";

export function TelegramIntegrationCard() {
  const [config, setConfig] = useState<TelegramConfigResponse | null>(null);
  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [testChatId, setTestChatId] = useState("");
  const [testMessageBody, setTestMessageBody] = useState(DEFAULT_TEST_MESSAGE);

  const [validation, setValidation] =
    useState<TelegramValidateConnectionResponse | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTestMessage, setIsSendingTestMessage] = useState(false);

  const isTokenConfigured = Boolean(config?.botTokenConfigured);
  const isConnected = Boolean(config?.telegramEnabled && config?.botTokenConfigured);

  const applyConfig = (data: TelegramConfigResponse) => {
    setConfig(data);
    setTelegramEnabled(Boolean(data.telegramEnabled));
    setBotUsername(data.botUsername ?? "");
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await telegramApi.getConfig();
        if (!mounted) return;
        applyConfig(data);
      } catch {
        if (!mounted) return;
        setConfig(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Um novo token invalida a última validação exibida.
  useEffect(() => {
    setValidation(null);
  }, [botToken]);

  const handleCopy = async (value: string | undefined, successMessage: string) => {
    if (!value?.trim()) {
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

  const handleValidate = async () => {
    const token = botToken.trim();
    if (!token) {
      toast.error("Informe o token do bot para validar.");
      return;
    }
    try {
      setIsValidating(true);
      const result = await telegramApi.validateConnection({ botToken: token });
      setValidation(result);
      if (result.botUsername) setBotUsername(result.botUsername);
      if (result.success) {
        toast.success("Token do Telegram validado com sucesso.");
      } else {
        toast.error(result.message || "Nao foi possivel validar o token.");
      }
    } catch (error) {
      setValidation(null);
      toast.error(resolveUiError(error, "Nao foi possivel validar o token do Telegram.").message);
    } finally {
      setIsValidating(false);
    }
  };

  const persist = async (enabled: boolean) => {
    const token = botToken.trim();
    if (!isTokenConfigured && !token) {
      throw new Error("Informe o token do bot na primeira configuracao do Telegram.");
    }
    const response = await telegramApi.saveConfig({
      botToken: token || undefined,
      botUsername: botUsername.trim() || undefined,
      telegramEnabled: enabled,
    });
    applyConfig(response);
    setBotToken("");
    return response;
  };

  const handleSave = async () => {
    if (!isTokenConfigured && !botToken.trim()) {
      toast.error("Informe o token do bot na primeira configuracao do Telegram.");
      return;
    }
    try {
      setIsSaving(true);
      setTestResult(null);
      await persist(telegramEnabled);
      toast.success(
        telegramEnabled
          ? "Configuracao do Telegram salva com sucesso."
          : "Integracao do Telegram desativada com sucesso."
      );
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao salvar configuracao do Telegram.").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (!isTokenConfigured && !botToken.trim()) {
      toast.error("Configure o token do bot antes de ativar a integracao.");
      return;
    }
    setTelegramEnabled(value);
    try {
      setIsSaving(true);
      await persist(value);
      toast.success(value ? "Integracao do Telegram ativada." : "Integracao do Telegram desativada.");
    } catch (error) {
      setTelegramEnabled((prev) => !prev);
      toast.error(resolveUiError(error, "Erro ao atualizar a integracao do Telegram.").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!isTokenConfigured) {
      toast.error("Salve o token do bot antes de testar a conexao.");
      return;
    }
    try {
      setIsTesting(true);
      const result = await telegramApi.testConnection();
      setTestResult(result.message);
      if (result.success) {
        toast.success("Conexao com o Telegram validada.");
        setTelegramEnabled(Boolean(result.telegramEnabled));
      } else {
        toast.error(result.message || "Conexao nao validada.");
      }
      await telegramApi.getConfig().then(applyConfig).catch(() => undefined);
    } catch (error) {
      const uiError = resolveUiError(error, "Erro ao testar conexao com o Telegram.");
      setTestResult(uiError.message);
      toast.error(uiError.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestMessage = async () => {
    const chatId = testChatId.trim();
    if (!chatId) {
      toast.error("Informe o chat ID de destino para enviar a mensagem de teste.");
      return;
    }
    try {
      setIsSendingTestMessage(true);
      const result = await telegramApi.sendTestMessage({
        destinationChatId: chatId,
        message: testMessageBody.trim() || undefined,
      });
      if (result.success) {
        toast.success("Mensagem de teste enviada.");
      } else {
        toast.error(result.message || "Falha ao enviar mensagem de teste.");
      }
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel enviar a mensagem de teste.").message);
    } finally {
      setIsSendingTestMessage(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Send className="h-5 w-5 text-primary" />
              Integracao Telegram
            </CardTitle>
            <CardDescription className="mt-1">
              Conecte um bot do Telegram por tenant, com validacao do token, registro
              automatico de webhook e teste de envio.
            </CardDescription>
          </div>
          {isConnected ? (
            <Badge className="border border-green-200 bg-green-50 text-green-700">
              Telegram Conectado
            </Badge>
          ) : (
            <Badge variant="outline">Nao conectado</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Passo a passo */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Como obter o token do bot</AlertTitle>
              <AlertDescription>
                No Telegram, fale com <strong>@BotFather</strong>, envie{" "}
                <code>/newbot</code>, escolha nome e usuario, e copie o token gerado
                (formato <code>123456:ABC-DEF...</code>).
              </AlertDescription>
            </Alert>

            {/* Credenciais do bot */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-1.5">
                <Label htmlFor="telegram-bot-token">Token do bot</Label>
                <Input
                  id="telegram-bot-token"
                  type="password"
                  autoComplete="off"
                  value={botToken}
                  placeholder={
                    isTokenConfigured
                      ? "Token configurado — deixe em branco para manter"
                      : "123456789:ABCdefGhIJKlmNoPQRsTUVwxyz"
                  }
                  onChange={(e) => setBotToken(e.target.value)}
                />
                {isTokenConfigured && (
                  <p className="flex items-center gap-1 text-xs text-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Token ja configurado neste tenant.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telegram-bot-username">Usuario do bot (opcional)</Label>
                <Input
                  id="telegram-bot-username"
                  value={botUsername}
                  placeholder="meu_salao_bot"
                  onChange={(e) => setBotUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Preenchido automaticamente ao validar o token.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleValidate()}
                  disabled={isValidating || !botToken.trim()}
                >
                  {isValidating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Validar token
                </Button>
                <Button onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar configuracao
                </Button>
              </div>

              {validation?.success && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Token valido</AlertTitle>
                  <AlertDescription>
                    Bot <strong>{validation.botDisplayName || validation.botUsername}</strong>
                    {validation.botUsername ? ` (@${validation.botUsername})` : ""} pronto para uso.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Ativar integração */}
            <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">Ativar integracao</p>
                <p className="text-xs text-muted-foreground">
                  Registra o webhook do bot e habilita o atendimento via Telegram para o tenant.
                </p>
              </div>
              <Switch
                aria-label="Ativar integracao do Telegram"
                checked={telegramEnabled}
                disabled={isSaving}
                onCheckedChange={(val) => void handleToggleEnabled(val)}
              />
            </div>

            {/* Webhook */}
            {config?.inboundWebhookUrl && (
              <div className="space-y-2 rounded-lg border p-4">
                <p className="text-sm font-semibold">Webhook</p>
                <div className="flex items-center gap-2">
                  <Input readOnly value={config.inboundWebhookUrl} className="text-xs" />
                  <Button
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => void handleCopy(config.inboundWebhookUrl, "URL do webhook copiada.")}
                    aria-label="Copiar URL do webhook"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {config.webhook?.configured ? (
                    <Badge className="border border-green-200 bg-green-50 text-green-700">
                      Webhook registrado
                    </Badge>
                  ) : (
                    <Badge variant="outline">Webhook nao registrado</Badge>
                  )}
                  {typeof config.webhook?.pendingUpdateCount === "number" && (
                    <span className="text-muted-foreground">
                      Pendentes: {config.webhook.pendingUpdateCount}
                    </span>
                  )}
                </div>
                {config.webhook?.lastErrorMessage && (
                  <p className="text-xs text-destructive">
                    Ultimo erro: {config.webhook.lastErrorMessage}
                  </p>
                )}
              </div>
            )}

            {/* Testar conexão + envio */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Testar conexao</p>
                  <p className="text-xs text-muted-foreground">
                    Valida o bot e (re)registra o webhook no Telegram.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => void handleTest()}
                  disabled={isTesting || !isTokenConfigured}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-1.5">Testar</span>
                </Button>
              </div>

              {testResult && (
                <Alert variant={testResult.toLowerCase().includes("sucesso") ? "default" : "destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Resultado do teste</AlertTitle>
                  <AlertDescription>{testResult}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="telegram-test-chat-id">Chat ID de destino</Label>
                  <Input
                    id="telegram-test-chat-id"
                    value={testChatId}
                    placeholder="123456789"
                    onChange={(e) => setTestChatId(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => void handleSendTestMessage()}
                    disabled={isSendingTestMessage || !isTokenConfigured || !testChatId.trim()}
                  >
                    {isSendingTestMessage ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Enviar teste
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telegram-test-message">Mensagem</Label>
                <Input
                  id="telegram-test-message"
                  value={testMessageBody}
                  onChange={(e) => setTestMessageBody(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  O cliente precisa ter iniciado uma conversa com o bot para receber a mensagem.
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
