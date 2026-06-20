import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { settingsApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';
import type { BusinessHourEntry } from '@/lib/api';

const dayLabels: Record<string, string> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terca-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sabado',
  SUNDAY: 'Domingo',
};

const dayOrder: BusinessHourEntry['dayOfWeek'][] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

function toTimeInput(value: string | null): string {
  if (!value) return '';
  // Backend retorna "HH:MM:SS", input type="time" precisa de "HH:MM"
  return value.slice(0, 5);
}

function toTimeStorage(value: string): string | null {
  if (!value) return null;
  return `${value}:00`;
}

const defaultHours = (): BusinessHourEntry[] =>
  dayOrder.map((day) => ({
    dayOfWeek: day,
    openTime: '09:00:00',
    closeTime: '18:00:00',
    enabled: day !== 'SUNDAY',
  }));

export function SettingsBusinessHoursTab() {
  const [hours, setHours] = useState<BusinessHourEntry[]>(defaultHours());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .getBusinessHoursTable()
      .then((data) => {
        if (data && data.length > 0) {
          // Garante ordem correta dos dias
          const sorted = dayOrder.map(
            (day) =>
              data.find((e) => e.dayOfWeek === day) ?? {
                dayOfWeek: day,
                openTime: '09:00:00',
                closeTime: '18:00:00',
                enabled: false,
              }
          );
          setHours(sorted);
        }
      })
      .catch(() => undefined);
  }, []);

  const updateEntry = (
    dayOfWeek: BusinessHourEntry['dayOfWeek'],
    field: keyof BusinessHourEntry,
    value: string | boolean
  ) => {
    setHours((prev) =>
      prev.map((entry) =>
        entry.dayOfWeek === dayOfWeek ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = hours.map((entry) => ({
        ...entry,
        openTime: entry.enabled ? toTimeStorage(toTimeInput(entry.openTime)) : null,
        closeTime: entry.enabled ? toTimeStorage(toTimeInput(entry.closeTime)) : null,
      }));
      await settingsApi.updateBusinessHoursTable(payload);
      toast.success('Horarios de funcionamento salvos com sucesso!');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao salvar horarios de funcionamento').message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horarios de Funcionamento
          </CardTitle>
          <CardDescription>
            Defina os horarios de atendimento do estabelecimento por dia da semana.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hours.map((entry) => (
            <div
              key={entry.dayOfWeek}
              className={`flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center ${
                entry.enabled ? 'bg-muted/50' : 'bg-muted/30 opacity-60'
              }`}
            >
              <div className="flex min-w-[160px] items-center gap-3">
                <Switch
                  checked={entry.enabled}
                  onCheckedChange={(checked) =>
                    updateEntry(entry.dayOfWeek, 'enabled', checked)
                  }
                />
                <span className="text-sm font-medium">
                  {dayLabels[entry.dayOfWeek]}
                </span>
              </div>

              {entry.enabled ? (
                <div className="ml-auto flex items-center gap-2">
                  <Input
                    type="time"
                    value={toTimeInput(entry.openTime)}
                    onChange={(e) =>
                      updateEntry(entry.dayOfWeek, 'openTime', toTimeStorage(e.target.value) ?? '')
                    }
                    className="w-28"
                  />
                  <span className="text-muted-foreground">ate</span>
                  <Input
                    type="time"
                    value={toTimeInput(entry.closeTime)}
                    onChange={(e) =>
                      updateEntry(entry.dayOfWeek, 'closeTime', toTimeStorage(e.target.value) ?? '')
                    }
                    className="w-28"
                  />
                </div>
              ) : (
                <span className="ml-auto text-sm text-muted-foreground">Fechado</span>
              )}
            </div>
          ))}

          <Button onClick={handleSave} disabled={isSaving} className="mt-2">
            {isSaving ? 'Salvando...' : 'Salvar horarios'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
