import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { settingsApi, type ReminderSettings } from "@/lib/api/settings";
import { resolveUiError } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const DEFAULT_SETTINGS: ReminderSettings = {
  d1Habilitado: true,
  d1Hora: "18:00",
  horasAntesHabilitado: true,
  horasAntes: 2,
};

/**
 * F03 — régua de lembretes automáticos de agendamento via WhatsApp.
 * O cliente responde SIM para confirmar ou NAO para cancelar o horário.
 */
export function ReminderSettingsCard() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    settingsApi
      .getReminderSettings()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch(() => {
        // backend antigo sem o endpoint — mantém defaults silenciosamente
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (settings.horasAntes < 1 || settings.horasAntes > 12) {
      toast.error("O lembrete do dia deve ser entre 1 e 12 horas antes.");
      return;
    }
    try {
      setIsSaving(true);
      const updated = await settingsApi.updateReminderSettings(settings);
      setSettings(updated);
      toast.success("Régua de lembretes salva com sucesso.");
    } catch (error) {
      toast.error(resolveUiError(error, "Não foi possível salvar a régua de lembretes.").message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <BellRing className="h-4 w-4 text-primary" />
          Lembretes automáticos (WhatsApp)
        </CardTitle>
        <CardDescription>
          O cliente recebe o lembrete e responde SIM para confirmar ou NAO para cancelar o horário.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="reminder-d1">Lembrete na véspera</Label>
                <p className="text-xs text-muted-foreground">Enviado no dia anterior ao atendimento.</p>
              </div>
              <Switch
                id="reminder-d1"
                checked={settings.d1Habilitado}
                onCheckedChange={(checked) => setSettings((s) => ({ ...s, d1Habilitado: checked }))}
              />
            </div>
            {settings.d1Habilitado && (
              <div className="space-y-1.5">
                <Label htmlFor="reminder-d1-hora">Horário do envio na véspera</Label>
                <Input
                  id="reminder-d1-hora"
                  type="time"
                  className="max-w-[140px]"
                  value={settings.d1Hora}
                  onChange={(e) => setSettings((s) => ({ ...s, d1Hora: e.target.value }))}
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="reminder-horas">Lembrete no dia</Label>
                <p className="text-xs text-muted-foreground">Enviado algumas horas antes do horário.</p>
              </div>
              <Switch
                id="reminder-horas"
                checked={settings.horasAntesHabilitado}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, horasAntesHabilitado: checked }))
                }
              />
            </div>
            {settings.horasAntesHabilitado && (
              <div className="space-y-1.5">
                <Label htmlFor="reminder-horas-antes">Horas de antecedência (1 a 12)</Label>
                <Input
                  id="reminder-horas-antes"
                  type="number"
                  min={1}
                  max={12}
                  className="max-w-[140px]"
                  value={settings.horasAntes}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, horasAntes: Number(e.target.value) }))
                  }
                />
              </div>
            )}

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar lembretes"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
