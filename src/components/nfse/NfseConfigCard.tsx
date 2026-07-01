import { AlertTriangle, Check, Hand, Info, MessageSquare, Zap } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
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

const EMISSION_MODE_OPTIONS = [
  {
    value: "MANUAL" as const,
    title: "Manual",
    description: "Voce decide quando emitir cada nota. A NFS-e e gerada sob demanda.",
    icon: <Hand className="h-5 w-5" />,
  },
  {
    value: "ASK_ON_CLOSE" as const,
    title: "Perguntar ao encerrar atendimento",
    description: "Ao fechar o atendimento, o sistema pergunta se deseja emitir a nota.",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    value: "AUTO_ON_CLOSE" as const,
    title: "Emitir automaticamente",
    description: "A nota e emitida automaticamente ao encerrar o atendimento, sem confirmacao.",
    icon: <Zap className="h-5 w-5" />,
  },
];

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
  const isAbrasf = config.provedor === "ABRASF" || config.provedor === "ABRASF_204";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracao principal</CardTitle>
        <CardDescription>Parametros obrigatorios para emissao de NFS-e.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Secao 1 — Ambiente */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Ambiente</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={config.ambiente === "HOMOLOGACAO" ? "default" : "outline"}
              onClick={() => onLoadConfig("HOMOLOGACAO")}
              className="h-14 flex-col gap-1"
            >
              <span className="font-semibold text-sm">Homologacao</span>
              <span className="text-xs opacity-70">Ambiente de testes</span>
            </Button>
            <Button
              type="button"
              variant={config.ambiente === "PRODUCAO" ? "default" : "outline"}
              onClick={() => onLoadConfig("PRODUCAO")}
              className="h-14 flex-col gap-1"
            >
              <span className="font-semibold text-sm">Producao</span>
              <span className="text-xs opacity-70">Emissao real de notas</span>
            </Button>
          </div>
          {config.ambiente === "PRODUCAO" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ambiente de producao. As notas emitidas terao validade fiscal real.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Secao 2 — Localizacao */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Localizacao</h4>
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>

          {/* Codigos IBGE / TOM — read-only */}
          {config.municipioCodigoIbge && (
            <div className="grid gap-4 md:grid-cols-3 rounded-md border bg-muted/30 p-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Codigo IBGE</p>
                <p className="text-sm font-mono font-medium">{config.municipioCodigoIbge}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Codigo TOM</p>
                <p className="text-sm font-mono font-medium">
                  {selectedMunicipality?.codigoTom || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Codigo TOM com DV</p>
                <p className="text-sm font-mono font-medium">
                  {selectedMunicipality?.codigoTomComDv || "—"}
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Secao 3 — Configuracoes de Emissao */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Configuracoes de emissao</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Serie RPS</Label>
              <Input
                value={config.serieRps}
                onChange={(e) => onConfigChange({ serieRps: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Aliquota ISS padrao (%)</Label>
              <Input
                type="number"
                value={config.aliquotaIssPadrao}
                onChange={(e) =>
                  onConfigChange({ aliquotaIssPadrao: Number(e.target.value || 0) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Item lista de servico padrao</Label>
              <Input
                value={config.itemListaServicoPadrao}
                onChange={(e) => onConfigChange({ itemListaServicoPadrao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Codigo tributacao municipal</Label>
              <Input
                value={config.codigoTributacaoMunicipio || ""}
                onChange={(e) => onConfigChange({ codigoTributacaoMunicipio: e.target.value || undefined })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Secao 4 — Modo de Emissao */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Modo de emissao</h4>
          <div className="grid gap-3">
            {EMISSION_MODE_OPTIONS.map((option) => (
              <div
                key={option.value}
                onClick={() => onConfigChange({ emissionMode: option.value })}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                  config.emissionMode === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 rounded-md p-1.5",
                    config.emissionMode === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {option.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{option.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                </div>
                {config.emissionMode === option.value && (
                  <Check className="h-4 w-4 text-primary ml-auto mt-0.5 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Secao 5 — Politica de CPF */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Politica de CPF</h4>
          <div className="space-y-2">
            <Label>Como tratar o CPF do cliente na emissao</Label>
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
                <SelectItem value="ALWAYS">Sempre solicitar CPF</SelectItem>
                <SelectItem value="ASK">Perguntar antes de emitir</SelectItem>
                <SelectItem value="NEVER_AUTO">Nao solicitar automaticamente</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {config.emitForCpfMode === "ALWAYS" &&
                "O sistema sempre pede o CPF do cliente antes de emitir a nota."}
              {config.emitForCpfMode === "ASK" &&
                "O sistema pergunta se deseja incluir o CPF na nota."}
              {config.emitForCpfMode === "NEVER_AUTO" &&
                "O CPF nao e solicitado automaticamente. O usuario pode incluir manualmente."}
            </p>
          </div>
        </div>

        {/* Secao 6 — URL Webservice (apenas ABRASF) */}
        {isAbrasf && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">URL do webservice ABRASF</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL Producao</Label>
                  <Input
                    placeholder="https://nfse.municipio.sp.gov.br/ws/RecepcionarLoteRps"
                    value={config.wsUrl || ""}
                    onChange={(e) => onConfigChange({ wsUrl: e.target.value || undefined })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Endpoint SOAP da prefeitura para envio de RPS em producao. Consulte o portal da
                    sua cidade.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>URL Homologacao</Label>
                  <Input
                    placeholder="https://nfse-hom.municipio.sp.gov.br/ws/RecepcionarLoteRps"
                    value={config.wsUrlHomologacao || ""}
                    onChange={(e) =>
                      onConfigChange({ wsUrlHomologacao: e.target.value || undefined })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Endpoint SOAP da prefeitura para testes em homologacao.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

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
