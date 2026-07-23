import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CreditCard, Copy } from "lucide-react";
import { settingsApi, type TenantPaymentConfig } from "@/lib/api/settings";
import { resolveUiError } from "@/lib/error-utils";

export default function PaymentIntegrationSettings() {
  const [config, setConfig] = useState<TenantPaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [ambiente, setAmbiente] = useState<"SANDBOX" | "PRODUCAO">("SANDBOX");

  useEffect(() => {
    settingsApi
      .getPaymentConfig()
      .then((data) => {
        setConfig(data);
        setAmbiente(data.ambiente ?? "SANDBOX");
      })
      .catch((error) =>
        toast.error(resolveUiError(error, "Não foi possível carregar a configuração de pagamentos.").message),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Informe a chave de API do Asaas.");
      return;
    }
    setSaving(true);
    try {
      const updated = await settingsApi.savePaymentConfig({ apiKey: apiKey.trim(), ambiente });
      setConfig(updated);
      setApiKey("");
      toast.success("Conta de recebimento conectada e validada com sucesso.");
    } catch (error) {
      toast.error(resolveUiError(error, "Não foi possível salvar. Verifique a chave e o ambiente.").message);
    } finally {
      setSaving(false);
    }
  };

  const copyWebhook = () => {
    if (!config?.webhookPath) return;
    const url = `${window.location.origin.replace(/\/$/, "")}${config.webhookPath}`;
    navigator.clipboard.writeText(url);
    toast.success("URL do webhook copiada.");
  };

  return (
    <MainLayout
      title="Pagamentos"
      subtitle="Conecte a conta Asaas do seu salão para receber sinal, comandas e assinaturas"
    >
      <div className="w-full max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5 text-primary" />
              Conta de recebimento (Asaas)
              {config?.ativo ? (
                <Badge className="ml-2">Conectada</Badge>
              ) : (
                <Badge variant="outline" className="ml-2">Não conectada</Badge>
              )}
            </CardTitle>
            <CardDescription>
              O dinheiro das cobranças (PIX de sinal, comanda, assinaturas) cai direto na conta Asaas
              do salão — não passa pela plataforma. A chave fica criptografada e nunca é exibida
              completa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <>
                {config?.apiKeyMascarada ? (
                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    Chave atual: <span className="font-mono">{config.apiKeyMascarada}</span> ·{" "}
                    Ambiente: <strong>{config.ambiente}</strong>
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="asaas-api-key">
                      {config?.apiKeyMascarada ? "Nova chave de API" : "Chave de API do Asaas"}
                    </Label>
                    <Input
                      id="asaas-api-key"
                      type="password"
                      autoComplete="off"
                      placeholder="$aact_..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asaas-ambiente">Ambiente</Label>
                    <Select value={ambiente} onValueChange={(v) => setAmbiente(v as "SANDBOX" | "PRODUCAO")}>
                      <SelectTrigger id="asaas-ambiente">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SANDBOX">Sandbox (testes)</SelectItem>
                        <SelectItem value="PRODUCAO">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
                  {saving ? "Validando no Asaas..." : "Validar e conectar"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {config?.ativo && config.webhookPath ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Webhook de notificações</CardTitle>
              <CardDescription>
                Cadastre esta URL no painel do Asaas (Integrações → Webhooks) para o sistema
                confirmar pagamentos automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded-md border bg-muted/30 p-2 text-xs">
                  {`${window.location.origin}${config.webhookPath}`}
                </code>
                <Button variant="outline" size="icon" onClick={copyWebhook} aria-label="Copiar URL do webhook">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </MainLayout>
  );
}
