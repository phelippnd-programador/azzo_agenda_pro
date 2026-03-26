import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  NfseConfig,
  NfseFiscalMunicipality,
  NfseFiscalState,
} from "@/lib/api";

interface NfseConfigCardProps {
  config: NfseConfig;
  configStateUf: string;
  configMunicipalities: NfseFiscalMunicipality[];
  states: NfseFiscalState[];
  selectedMunicipality: NfseFiscalMunicipality | null;
  isConfigUnconfigured: boolean;
  isSaving: boolean;
  onConfigChange: (update: Partial<NfseConfig>) => void;
  onStateUfChange: (uf: string) => void;
  onLoadConfig: (ambiente: "HOMOLOGACAO" | "PRODUCAO") => void;
  onSave: () => void;
}

export function NfseConfigCard({
  config,
  configStateUf,
  configMunicipalities,
  states,
  selectedMunicipality,
  isConfigUnconfigured,
  isSaving,
  onConfigChange,
  onStateUfChange,
  onLoadConfig,
  onSave,
}: NfseConfigCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracao principal</CardTitle>
        <CardDescription>Parametros obrigatorios para emissao de NFS-e.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfigUnconfigured ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Configuracao NFS-e inicial pendente</AlertTitle>
            <AlertDescription>
              Ainda nao existe configuracao NFS-e para este ambiente. Preencha os campos abaixo e
              salve para iniciar a emissao.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Ambiente</Label>
            <Select
              value={config.ambiente}
              onValueChange={(value: "HOMOLOGACAO" | "PRODUCAO") => onLoadConfig(value)}
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
            <Label>Estado</Label>
            <Select
              value={configStateUf}
              onValueChange={(value) => {
                onStateUfChange(value);
                onConfigChange({ municipioCodigoIbge: "" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.codigoIbge} value={state.uf}>
                    {state.uf} - {state.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Municipio</Label>
            <Select
              value={config.municipioCodigoIbge}
              onValueChange={(value) => onConfigChange({ municipioCodigoIbge: value })}
              disabled={!configStateUf}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o municipio" />
              </SelectTrigger>
              <SelectContent>
                {configMunicipalities.map((municipality) => (
                  <SelectItem key={municipality.codigoIbge} value={municipality.codigoIbge}>
                    {municipality.nome} ({municipality.codigoIbge})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Provedor</Label>
            <Input
              value={config.provedor}
              onChange={(e) => onConfigChange({ provedor: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Serie RPS</Label>
            <Input
              value={config.serieRps}
              onChange={(e) => onConfigChange({ serieRps: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Aliquota ISS padrao</Label>
            <Input
              type="number"
              value={config.aliquotaIssPadrao}
              onChange={(e) =>
                onConfigChange({ aliquotaIssPadrao: Number(e.target.value || 0) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Item lista servico padrao</Label>
            <Input
              value={config.itemListaServicoPadrao}
              onChange={(e) => onConfigChange({ itemListaServicoPadrao: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Modo emissao</Label>
            <Select
              value={config.emissionMode}
              onValueChange={(value: "MANUAL" | "ASK_ON_CLOSE" | "AUTO_ON_CLOSE") =>
                onConfigChange({ emissionMode: value })
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
                onConfigChange({ emitForCpfMode: value })
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

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Codigo IBGE selecionado</Label>
            <Input value={config.municipioCodigoIbge || ""} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Codigo TOM</Label>
            <Input value={selectedMunicipality?.codigoTom || ""} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Codigo TOM com DV</Label>
            <Input value={selectedMunicipality?.codigoTomComDv || ""} readOnly />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="font-medium">Auto emissao ao fechar atendimento</p>
            <p className="text-sm text-muted-foreground">Aplicavel para fluxo de agendamento.</p>
          </div>
          <Switch
            checked={config.autoIssueOnAppointmentClose}
            onCheckedChange={(checked) =>
              onConfigChange({ autoIssueOnAppointmentClose: checked })
            }
          />
        </div>

        <Button disabled={isSaving} onClick={onSave}>
          {isSaving ? "Salvando..." : "Salvar configuracao"}
        </Button>
      </CardContent>
    </Card>
  );
}
