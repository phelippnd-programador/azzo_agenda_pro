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
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  NfseFiscalMunicipality,
  NfseFiscalState,
  NfseProviderCapabilities,
} from "@/lib/api";

interface NfseCapabilityCardProps {
  capability: NfseProviderCapabilities;
  capabilityStateUf: string;
  capabilityMunicipalities: NfseFiscalMunicipality[];
  capabilities: NfseProviderCapabilities[];
  states: NfseFiscalState[];
  selectedMunicipality: NfseFiscalMunicipality | null;
  isSaving: boolean;
  onCapabilityChange: (update: Partial<NfseProviderCapabilities>) => void;
  onStateUfChange: (uf: string) => void;
  onSave: () => void;
}

export function NfseCapabilityCard({
  capability,
  capabilityStateUf,
  capabilityMunicipalities,
  capabilities,
  states,
  selectedMunicipality,
  isSaving,
  onCapabilityChange,
  onStateUfChange,
  onSave,
}: NfseCapabilityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacidades do provedor</CardTitle>
        <CardDescription>
          Janela de cancelamento e layout por municipio/provedor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={capabilityStateUf}
              onValueChange={(value) => {
                onStateUfChange(value);
                onCapabilityChange({ municipioCodigoIbge: "" });
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
              value={capability.municipioCodigoIbge}
              onValueChange={(value) => onCapabilityChange({ municipioCodigoIbge: value })}
              disabled={!capabilityStateUf}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o municipio" />
              </SelectTrigger>
              <SelectContent>
                {capabilityMunicipalities.map((municipality) => (
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
              value={capability.provedor}
              onChange={(e) => onCapabilityChange({ provedor: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Layout</Label>
            <Input
              value={capability.layoutVersion}
              onChange={(e) => onCapabilityChange({ layoutVersion: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Modo cancelamento</Label>
            <Select
              value={capability.cancelMode}
              onValueChange={(value: "SYNC" | "ASYNC") =>
                onCapabilityChange({ cancelMode: value })
              }
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
                onCapabilityChange({ cancelWindowHours: Number(e.target.value || 0) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Codigos de motivo aceitos</Label>
            <Input
              value={capability.acceptedCancelReasonCodes || ""}
              onChange={(e) =>
                onCapabilityChange({ acceptedCancelReasonCodes: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Codigo IBGE selecionado</Label>
            <Input value={capability.municipioCodigoIbge || ""} readOnly />
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
          <span className="font-medium">Suporta cancelamento</span>
          <Switch
            checked={capability.cancelSupported}
            onCheckedChange={(checked) => onCapabilityChange({ cancelSupported: checked })}
          />
        </div>

        <Button variant="outline" disabled={isSaving} onClick={onSave}>
          {isSaving ? "Salvando..." : "Salvar capacidade"}
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
                  <td className="p-2 text-muted-foreground" colSpan={4}>
                    Nenhuma capacidade cadastrada.
                  </td>
                </tr>
              ) : (
                capabilities.map((item) => (
                  <tr
                    key={`${item.municipioCodigoIbge}-${item.provedor}-${item.layoutVersion}`}
                    className="border-b"
                  >
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
  );
}
