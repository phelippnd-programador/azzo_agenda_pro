import { useState } from "react";
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
  saveWhatsAppConfig,
  testWhatsAppConnection,
} from "@/services/whatsappService";
import type { WhatsAppConfigResponse } from "@/types/whatsapp";

const EMPTY_RESULT = "";

export function WhatsAppIntegrationCard() {
  const queryClient = useQueryClient();
  const [activateIntegration, setActivateIntegration] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [webhookVerifyToken, setWebhookVerifyToken] = useState("");

  const [configStatus, setConfigStatus] =
    useState<WhatsAppConfigResponse | null>(null);
  const [testResult, setTestResult] = useState(EMPTY_RESULT);

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const isConnected = Boolean(configStatus?.whatsappEnabled);

  const handleSave = async () => {
    if (!activateIntegration) {
      toast.error("Ative a integração para salvar a configuração");
      return;
    }

    if (!accessToken.trim() || !phoneNumberId.trim()) {
      toast.error("Access Token e Phone Number ID são obrigatórios");
      return;
    }

    try {
      setIsSaving(true);
      setTestResult(EMPTY_RESULT);

      const response = await saveWhatsAppConfig({
        accessToken: accessToken.trim(),
        phoneNumberId: phoneNumberId.trim(),
        businessAccountId: businessAccountId.trim() || undefined,
        webhookVerifyToken: webhookVerifyToken.trim() || undefined,
      });

      setConfigStatus(response);
      setAccessToken("");
      toast.success("Token configurado com sucesso");

      await queryClient.invalidateQueries({ queryKey: ["tenant"] });
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
    } catch {
      toast.error("Erro ao salvar configuração do WhatsApp");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!activateIntegration) {
      toast.error("Ative a integração para testar a conexão");
      return;
    }

    try {
      setIsTesting(true);
      const result = await testWhatsAppConnection();
      setTestResult(result.message);
      toast.success(result.success ? "Conexão validada" : "Conexão não validada");
    } catch {
      setTestResult("Não foi possível testar a conexão no momento.");
      toast.error("Erro ao testar conexão com WhatsApp");
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
              <PlugZap className="h-5 w-5 text-violet-600" />
              Integração WhatsApp
            </CardTitle>
            <CardDescription className="mt-1">
              Configure sua conexão com WhatsApp Cloud API por tenant.
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
            <AlertTitle>Integração não ativa</AlertTitle>
            <AlertDescription>
              Salve uma configuração válida para habilitar o envio via WhatsApp.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Ativar integração</p>
            <p className="text-xs text-muted-foreground">
              Habilita ações de salvar e testar conexão.
            </p>
          </div>
          <Switch
            checked={activateIntegration}
            onCheckedChange={setActivateIntegration}
          />
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
            Por segurança, o token não é exibido após salvar.
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
            Salvar Configuração
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || isSaving}
            className="sm:w-auto"
          >
            {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Testar Conexão
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
