import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, PlugZap } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  testWhatsAppConnection,
} from "@/services/whatsappService";
import type { WhatsAppConfigResponse } from "@/types/whatsapp";
import { resolveUiError } from "@/lib/error-utils";

const EMPTY_RESULT = "";

export function WhatsAppIntegrationCard() {
  const queryClient = useQueryClient();
  const [activateIntegration, setActivateIntegration] = useState(false);
  const [canSchedule, setCanSchedule] = useState(true);
  const [canCancel, setCanCancel] = useState(true);
  const [canReschedule, setCanReschedule] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [webhookVerifyToken, setWebhookVerifyToken] = useState("");

  const [configStatus, setConfigStatus] =
    useState<WhatsAppConfigResponse | null>(null);
  const [testResult, setTestResult] = useState(EMPTY_RESULT);

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const isConnected = Boolean(configStatus?.whatsappEnabled || configStatus?.enabled);
  const isTokenConfigured = Boolean(configStatus?.accessTokenConfigured);

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        const config = await getWhatsAppConfig();
        if (!mounted) return;

        setConfigStatus(config);
        setActivateIntegration(Boolean(config.whatsappEnabled || config.enabled));
        setCanSchedule(config.canSchedule ?? true);
        setCanCancel(config.canCancel ?? true);
        setCanReschedule(config.canReschedule ?? true);
        setPhoneNumberId(config.phoneNumberId || "");
        setBusinessAccountId(config.businessAccountId || "");
        setWebhookVerifyToken(config.webhookVerifyToken || "");
      } catch {
        if (!mounted) return;
        setConfigStatus(null);
      }
    };

    loadConfig();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (activateIntegration && !phoneNumberId.trim()) {
      toast.error("Phone Number ID e obrigatorio");
      return;
    }

    if (activateIntegration && !isTokenConfigured && !accessToken.trim()) {
      toast.error("Access Token e obrigatorio na primeira configuracao");
      return;
    }

    try {
      setIsSaving(true);
      setTestResult(EMPTY_RESULT);

      const response = await saveWhatsAppConfig({
        whatsappEnabled: activateIntegration,
        enabled: activateIntegration,
        accessToken: accessToken.trim() || undefined,
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
      setAccessToken("");
      toast.success(
        activateIntegration
          ? "Configuracao do WhatsApp salva com sucesso"
          : "Integracao do WhatsApp desativada com sucesso"
      );

      await queryClient.invalidateQueries({ queryKey: ["tenant"] });
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao salvar configuracao do WhatsApp").message);
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
            <CardTitle className="text-xl flex items-center gap-2">
              <PlugZap className="h-5 w-5 text-primary" />
              Integracao WhatsApp
            </CardTitle>
            <CardDescription className="mt-1">
              Configure sua conexao com WhatsApp Cloud API por tenant.
            </CardDescription>
          </div>
          {isConnected ? (
            <Badge className="bg-green-50 text-green-700 border border-green-200">
              WhatsApp Conectado
            </Badge>
          ) : null}
        </div>

        {!isConnected && (
          <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
            <AlertCircle className="h-4 w-4 !text-yellow-700" />
            <AlertTitle>Integracao nao ativa</AlertTitle>
            <AlertDescription>
              Salve uma configuracao valida para habilitar o envio via WhatsApp.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Ativar integracao</p>
            <p className="text-xs text-muted-foreground">
              Habilita acoes de salvar e testar conexao.
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
            Token configurado no backend: {isTokenConfigured ? "Sim" : "Nao"}.
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

        <div className="space-y-2">
          <Label htmlFor="wa-access-token">Access Token</Label>
          <Textarea
            id="wa-access-token"
            placeholder="Cole aqui o token do WhatsApp Cloud API"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            disabled={!activateIntegration || isSaving}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Por seguranca, o token nao e exibido apos salvar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wa-phone-number-id">Phone Number ID</Label>
            <Input
              id="wa-phone-number-id"
              placeholder="Ex: 1234567890"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              disabled={!activateIntegration || isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-business-account-id">Business Account ID</Label>
            <Input
              id="wa-business-account-id"
              placeholder="Opcional"
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
              disabled={!activateIntegration || isSaving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-webhook-verify-token">Webhook Verify Token</Label>
          <Input
            id="wa-webhook-verify-token"
            placeholder="Opcional"
            value={webhookVerifyToken}
            onChange={(e) => setWebhookVerifyToken(e.target.value)}
            disabled={!activateIntegration || isSaving}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isTesting}
            className="sm:w-auto"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Salvar Configuracao
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || isSaving}
            className="sm:w-auto"
          >
            {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
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
