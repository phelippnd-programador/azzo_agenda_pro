import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { nfseApi, type NfseConfig, type NfseProviderCapabilities } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

const DEFAULT_CONFIG: NfseConfig = {
  ambiente: "HOMOLOGACAO",
  municipioCodigoIbge: "",
  provedor: "MOCK_NACIONAL",
  serieRps: "A1",
  aliquotaIssPadrao: 5,
  itemListaServicoPadrao: "1.01",
  emissionMode: "ASK_ON_CLOSE",
  emitForCpfMode: "ASK",
  autoIssueOnAppointmentClose: false,
};

const DEFAULT_CAP: NfseProviderCapabilities = {
  municipioCodigoIbge: "",
  provedor: "MOCK_NACIONAL",
  layoutVersion: "2.04",
  cancelSupported: true,
  cancelWindowHours: 24,
  cancelMode: "SYNC",
};

export default function NfseSettings() {
  const [config, setConfig] = useState<NfseConfig>(DEFAULT_CONFIG);
  const [capability, setCapability] = useState<NfseProviderCapabilities>(DEFAULT_CAP);
  const [capabilities, setCapabilities] = useState<NfseProviderCapabilities[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingCap, setIsSavingCap] = useState(false);
  const showError = (error: unknown, fallbackMessage: string) => {
    const uiError = resolveUiError(error, fallbackMessage);
    toast.error(uiError.code ? `[${uiError.code}] ${uiError.message}` : uiError.message);
  };

  const loadConfig = async (ambiente: "HOMOLOGACAO" | "PRODUCAO") => {
    try {
      const response = await nfseApi.getConfig(ambiente);
      setConfig(response);
    } catch (error) {
      setConfig((prev) => ({ ...prev, ambiente }));
    }
  };

  const loadCapabilities = async () => {
    try {
      const response = await nfseApi.listProviderCapabilities();
      setCapabilities(response);
    } catch {
      setCapabilities([]);
    }
  };

  useEffect(() => {
    void loadConfig("HOMOLOGACAO");
    void loadCapabilities();
  }, []);

  return (
    <MainLayout title="Configuracoes NFS-e" subtitle="Parmetros por ambiente e capacidades de provedor por municipio.">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuracao principal</CardTitle>
            <CardDescription>Parametros obrigatorios para emissao de NFS-e.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select
                  value={config.ambiente}
                  onValueChange={(value: "HOMOLOGACAO" | "PRODUCAO") => {
                    void loadConfig(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOMOLOGACAO">HOMOLOGACAO</SelectItem>
                    <SelectItem value="PRODUCAO">PRODUCAO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Municipio IBGE</Label>
                <Input
                  value={config.municipioCodigoIbge}
                  onChange={(e) => setConfig((prev) => ({ ...prev, municipioCodigoIbge: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Provedor</Label>
                <Input
                  value={config.provedor}
                  onChange={(e) => setConfig((prev) => ({ ...prev, provedor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Serie RPS</Label>
                <Input value={config.serieRps} onChange={(e) => setConfig((prev) => ({ ...prev, serieRps: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Aliquota ISS padrao</Label>
                <Input
                  type="number"
                  value={config.aliquotaIssPadrao}
                  onChange={(e) => setConfig((prev) => ({ ...prev, aliquotaIssPadrao: Number(e.target.value || 0) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Item lista servico padrao</Label>
                <Input
                  value={config.itemListaServicoPadrao}
                  onChange={(e) => setConfig((prev) => ({ ...prev, itemListaServicoPadrao: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Modo emissao</Label>
                <Select
                  value={config.emissionMode}
                  onValueChange={(value: "MANUAL" | "ASK_ON_CLOSE" | "AUTO_ON_CLOSE") =>
                    setConfig((prev) => ({ ...prev, emissionMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">MANUAL</SelectItem>
                    <SelectItem value="ASK_ON_CLOSE">ASK_ON_CLOSE</SelectItem>
                    <SelectItem value="AUTO_ON_CLOSE">AUTO_ON_CLOSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Politica CPF</Label>
                <Select
                  value={config.emitForCpfMode}
                  onValueChange={(value: "ALWAYS" | "ASK" | "NEVER_AUTO") =>
                    setConfig((prev) => ({ ...prev, emitForCpfMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALWAYS">ALWAYS</SelectItem>
                    <SelectItem value="ASK">ASK</SelectItem>
                    <SelectItem value="NEVER_AUTO">NEVER_AUTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Auto emissao ao fechar atendimento</p>
                <p className="text-sm text-muted-foreground">Aplicavel para fluxo de agendamento.</p>
              </div>
              <Switch
                checked={config.autoIssueOnAppointmentClose}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, autoIssueOnAppointmentClose: checked }))}
              />
            </div>
            <Button
              disabled={isSavingConfig}
              onClick={async () => {
                try {
                  setIsSavingConfig(true);
                  const saved = await nfseApi.saveConfig(config);
                  setConfig(saved);
                  toast.success("Configuracao NFS-e salva com sucesso.");
                } catch (error) {
                  showError(error, "Erro ao salvar configuracao NFS-e");
                } finally {
                  setIsSavingConfig(false);
                }
              }}
            >
              {isSavingConfig ? "Salvando..." : "Salvar configuracao"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacidades do provedor</CardTitle>
            <CardDescription>Janela de cancelamento e layout por municipio/provedor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Municipio IBGE</Label>
                <Input
                  value={capability.municipioCodigoIbge}
                  onChange={(e) => setCapability((prev) => ({ ...prev, municipioCodigoIbge: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Provedor</Label>
                <Input value={capability.provedor} onChange={(e) => setCapability((prev) => ({ ...prev, provedor: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Layout</Label>
                <Input
                  value={capability.layoutVersion}
                  onChange={(e) => setCapability((prev) => ({ ...prev, layoutVersion: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Modo cancelamento</Label>
                <Select
                  value={capability.cancelMode}
                  onValueChange={(value: "SYNC" | "ASYNC") => setCapability((prev) => ({ ...prev, cancelMode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYNC">SYNC</SelectItem>
                    <SelectItem value="ASYNC">ASYNC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Janela de cancelamento (horas)</Label>
                <Input
                  type="number"
                  value={capability.cancelWindowHours || 0}
                  onChange={(e) =>
                    setCapability((prev) => ({ ...prev, cancelWindowHours: Number(e.target.value || 0) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Codigos de motivo aceitos</Label>
                <Input
                  value={capability.acceptedCancelReasonCodes || ""}
                  onChange={(e) =>
                    setCapability((prev) => ({ ...prev, acceptedCancelReasonCodes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="font-medium">Suporta cancelamento</span>
              <Switch
                checked={capability.cancelSupported}
                onCheckedChange={(checked) => setCapability((prev) => ({ ...prev, cancelSupported: checked }))}
              />
            </div>
            <Button
              variant="outline"
              disabled={isSavingCap}
              onClick={async () => {
                try {
                  setIsSavingCap(true);
                  await nfseApi.saveProviderCapabilities(capability);
                  toast.success("Capacidade de provedor salva.");
                  await loadCapabilities();
                } catch (error) {
                  showError(error, "Erro ao salvar capacidade de provedor");
                } finally {
                  setIsSavingCap(false);
                }
              }}
            >
              {isSavingCap ? "Salvando..." : "Salvar capacidade"}
            </Button>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Municipio</th>
                    <th className="p-2 text-left">Provedor</th>
                    <th className="p-2 text-left">Layout</th>
                    <th className="p-2 text-left">Cancelamento</th>
                  </tr>
                </thead>
                <tbody>
                  {capabilities.length === 0 ? (
                    <tr>
                      <td className="p-2 text-muted-foreground" colSpan={4}>Nenhuma capacidade cadastrada.</td>
                    </tr>
                  ) : (
                    capabilities.map((item) => (
                      <tr key={`${item.municipioCodigoIbge}-${item.provedor}-${item.layoutVersion}`} className="border-b">
                        <td className="p-2">{item.municipioCodigoIbge}</td>
                        <td className="p-2">{item.provedor}</td>
                        <td className="p-2">{item.layoutVersion}</td>
                        <td className="p-2">{item.cancelSupported ? "Sim" : "Nao"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div>
              <Button asChild>
                <Link to="/fiscal/nfse">Abrir modulo NFS-e</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
