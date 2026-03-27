import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { appointmentsApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type AppointmentConflictSettingsCardProps = {
  visible?: boolean;
};

export function AppointmentConflictSettingsCard({
  visible = true,
}: AppointmentConflictSettingsCardProps) {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;

    appointmentsApi
      .getSettings()
      .then((response) => {
        if (!active) return;
        setEnabled(Boolean(response.allowConflictingAppointmentsOnManualScheduling));
      })
      .catch((error) => {
        if (!active) return;
        toast.error(resolveUiError(error, "Nao foi possivel carregar a configuracao da agenda.").message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [visible]);

  if (!visible) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await appointmentsApi.updateSettings({
        allowConflictingAppointmentsOnManualScheduling: enabled,
      });
      setEnabled(Boolean(response.allowConflictingAppointmentsOnManualScheduling));
      toast.success("Configuracao da agenda atualizada.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel salvar a configuracao da agenda.").message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Agenda Manual com Conflito
        </CardTitle>
        <CardDescription>
          Defina se a agenda interna pode assumir horarios ja ocupados para o mesmo profissional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="allow-conflict-switch" className="font-medium">
                  Permitir conflito na agenda manual
                </Label>
                <Badge variant={enabled ? "default" : "secondary"}>
                  {enabled ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Com essa opcao ativa, a agenda interna continua mostrando horarios vagos e tambem
                exibe horarios conflitantes em vermelho. A confirmacao do conflito continua
                obrigatoria no momento da criacao.
              </p>
              <p className="text-sm text-muted-foreground">
                WhatsApp e agendamento publico permanecem estritos e nunca assumem sobreposicao.
              </p>
            </div>
            <Switch
              id="allow-conflict-switch"
              checked={enabled}
              disabled={isLoading || isSaving}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Importante
          </div>
          <p>
            Essa configuracao afeta somente a agenda interna do sistema. Os demais canais continuam
            obedecendo a regra rigida de vaga livre.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isLoading || isSaving} isLoading={isSaving}>
          Salvar configuracao
        </Button>
      </CardContent>
    </Card>
  );
}
