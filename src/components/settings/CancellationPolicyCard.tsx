import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { settingsApi } from "@/lib/api";
import type { CancellationPolicy } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const DEFAULT_POLICY: CancellationPolicy = {
  cancellationPolicyEnabled: false,
  cancellationMinHoursBefore: 24,
  cancellationFeePercent: 50,
};

export function CancellationPolicyCard() {
  const [policy, setPolicy] = useState<CancellationPolicy>(DEFAULT_POLICY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    settingsApi
      .getCancellationPolicy()
      .then((data) => {
        if (!active) return;
        setPolicy(data);
      })
      .catch(() => {
        // endpoint ainda nao implementado — usa defaults silenciosamente
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await settingsApi.updateCancellationPolicy(policy);
      setPolicy(updated);
      toast.success("Politica de cancelamento salva com sucesso.");
    } catch (error) {
      toast.error(
        resolveUiError(error, "Nao foi possivel salvar a politica de cancelamento.").message
      );
    } finally {
      setIsSaving(false);
    }
  };

  const previewText =
    policy.cancellationPolicyEnabled
      ? `Cancelamentos com menos de ${policy.cancellationMinHoursBefore} hora${policy.cancellationMinHoursBefore !== 1 ? "s" : ""} de antecedencia estao sujeitos a multa de ${policy.cancellationFeePercent}% do valor do servico.`
      : "A politica de cancelamento esta desativada. Nenhuma multa sera cobrada.";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ban className="h-4 w-4 text-primary" />
          Politica de Cancelamento
        </CardTitle>
        <CardDescription>
          Defina regras para cancelamentos de ultima hora e percentual de multa aplicado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* toggle principal */}
        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="cancellation-policy-switch" className="font-medium">
                  Ativar politica de cancelamento
                </Label>
                <Badge variant={policy.cancellationPolicyEnabled ? "default" : "secondary"}>
                  {policy.cancellationPolicyEnabled ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Quando ativa, cancelamentos fora do prazo minimo estao sujeitos a multa configurada abaixo.
              </p>
            </div>
            <Switch
              id="cancellation-policy-switch"
              checked={policy.cancellationPolicyEnabled}
              disabled={isLoading || isSaving}
              onCheckedChange={(checked) =>
                setPolicy((prev) => ({ ...prev, cancellationPolicyEnabled: checked }))
              }
            />
          </div>
        </div>

        {/* campos condicionais */}
        {policy.cancellationPolicyEnabled && (
          <div className="space-y-5 rounded-lg border p-4">

            {/* antecedencia minima */}
            <div className="space-y-2">
              <Label htmlFor="min-hours-input" className="font-medium">
                Antecedencia minima para cancelamento gratuito
              </Label>
              <p className="text-sm text-muted-foreground">
                Cancelamentos realizados com menos deste prazo estao sujeitos a multa.
              </p>
              <div className="flex items-center gap-3">
                <Input
                  id="min-hours-input"
                  type="number"
                  min={1}
                  max={720}
                  value={policy.cancellationMinHoursBefore}
                  disabled={isLoading || isSaving}
                  className="w-28"
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(720, Number(e.target.value) || 1));
                    setPolicy((prev) => ({ ...prev, cancellationMinHoursBefore: v }));
                  }}
                />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ex.: 24 horas = cancelamentos com menos de 24h antes do horario agendado terao multa.
              </p>
            </div>

            {/* percentual de multa */}
            <div className="space-y-2">
              <Label className="font-medium">
                Percentual de multa por cancelamento tardio
              </Label>
              <p className="text-sm text-muted-foreground">
                Percentual do valor do servico cobrado como multa.
              </p>
              <div className="flex items-center gap-4">
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[policy.cancellationFeePercent]}
                  disabled={isLoading || isSaving}
                  className="flex-1"
                  onValueChange={([v]) =>
                    setPolicy((prev) => ({ ...prev, cancellationFeePercent: v }))
                  }
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={policy.cancellationFeePercent}
                    disabled={isLoading || isSaving}
                    className="w-20 text-center"
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setPolicy((prev) => ({ ...prev, cancellationFeePercent: v }));
                    }}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Ex.: 50% = metade do valor do servico sera cobrada como multa por cancelamento tardio.
              </p>
            </div>
          </div>
        )}

        {/* preview da regra */}
        <div className="rounded-lg border border-muted bg-muted/30 p-4 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Como ficara para o cliente
          </p>
          <p className="text-foreground">{previewText}</p>
        </div>

        <Button onClick={handleSave} disabled={isLoading || isSaving} isLoading={isSaving}>
          Salvar politica
        </Button>
      </CardContent>
    </Card>
  );
}
