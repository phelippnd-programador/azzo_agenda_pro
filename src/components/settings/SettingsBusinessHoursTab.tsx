import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { settingsApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import { Clock, Plus, X } from 'lucide-react';
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

function toTimeInput(value: string | null | undefined): string {
  if (!value) return '';
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
    breakStart: null,
    breakEnd: null,
  }));

export function SettingsBusinessHoursTab() {
  const [hours, setHours] = useState<BusinessHourEntry[]>(defaultHours());
  const [isSaving, setIsSaving] = useState(false);
  // Controla quais dias têm pausa expandida
  const [breakExpanded, setBreakExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    settingsApi
      .getBusinessHoursTable()
      .then((data) => {
        if (data && data.length > 0) {
          const sorted = dayOrder.map(
            (day) =>
              data.find((e) => e.dayOfWeek === day) ?? {
                dayOfWeek: day,
                openTime: '09:00:00',
                closeTime: '18:00:00',
                enabled: false,
                breakStart: null,
                breakEnd: null,
              }
          );
          setHours(sorted);
          // Expande pausa automaticamente para dias que já têm breakStart salvo
          const expanded: Record<string, boolean> = {};
          sorted.forEach((e) => {
            if (e.breakStart) expanded[e.dayOfWeek] = true;
          });
          setBreakExpanded(expanded);
        }
      })
      .catch(() => undefined);
  }, []);

  const updateEntry = (
    dayOfWeek: BusinessHourEntry['dayOfWeek'],
    field: keyof BusinessHourEntry,
    value: string | boolean | null
  ) => {
    setHours((prev) =>
      prev.map((entry) =>
        entry.dayOfWeek === dayOfWeek ? { ...entry, [field]: value } : entry
      )
    );
  };

  const toggleBreak = (dayOfWeek: string, hasBreak: boolean) => {
    setBreakExpanded((prev) => ({ ...prev, [dayOfWeek]: hasBreak }));
    if (!hasBreak) {
      // Ao fechar, limpa os campos de pausa
      updateEntry(dayOfWeek as BusinessHourEntry['dayOfWeek'], 'breakStart', null);
      updateEntry(dayOfWeek as BusinessHourEntry['dayOfWeek'], 'breakEnd', null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = hours.map((entry) => ({
        ...entry,
        openTime: entry.enabled ? toTimeStorage(toTimeInput(entry.openTime)) : null,
        closeTime: entry.enabled ? toTimeStorage(toTimeInput(entry.closeTime)) : null,
        breakStart:
          entry.enabled && breakExpanded[entry.dayOfWeek]
            ? toTimeStorage(toTimeInput(entry.breakStart))
            : null,
        breakEnd:
          entry.enabled && breakExpanded[entry.dayOfWeek]
            ? toTimeStorage(toTimeInput(entry.breakEnd))
            : null,
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
            Defina os horarios de atendimento do estabelecimento por dia da semana. Opcionalmente,
            adicione uma pausa de almoco ou intervalo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hours.map((entry) => {
            const hasBreak = Boolean(breakExpanded[entry.dayOfWeek]);
            return (
              <div
                key={entry.dayOfWeek}
                className={`rounded-lg p-3 ${
                  entry.enabled ? 'bg-muted/50' : 'bg-muted/30 opacity-60'
                }`}
              >
                {/* Linha principal — dia + horários */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-[160px] items-center gap-3">
                    <Switch
                      checked={entry.enabled}
                      onCheckedChange={(checked) =>
                        updateEntry(entry.dayOfWeek, 'enabled', checked)
                      }
                    />
                    <span className="text-sm font-medium">{dayLabels[entry.dayOfWeek]}</span>
                  </div>

                  {entry.enabled ? (
                    <div className="ml-auto flex items-center gap-2">
                      <Input
                        type="time"
                        value={toTimeInput(entry.openTime)}
                        onChange={(e) =>
                          updateEntry(
                            entry.dayOfWeek,
                            'openTime',
                            toTimeStorage(e.target.value) ?? ''
                          )
                        }
                        className="w-28"
                      />
                      <span className="text-muted-foreground">ate</span>
                      <Input
                        type="time"
                        value={toTimeInput(entry.closeTime)}
                        onChange={(e) =>
                          updateEntry(
                            entry.dayOfWeek,
                            'closeTime',
                            toTimeStorage(e.target.value) ?? ''
                          )
                        }
                        className="w-28"
                      />
                    </div>
                  ) : (
                    <span className="ml-auto text-sm text-muted-foreground">Fechado</span>
                  )}
                </div>

                {/* Linha de pausa — só quando o dia está habilitado */}
                {entry.enabled ? (
                  <div className="mt-2 pl-[calc(160px+0.75rem)]">
                    {!hasBreak ? (
                      <button
                        type="button"
                        onClick={() => toggleBreak(entry.dayOfWeek, true)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Adicionar pausa
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Pausa</span>
                        <Input
                          type="time"
                          value={toTimeInput(entry.breakStart)}
                          onChange={(e) =>
                            updateEntry(
                              entry.dayOfWeek,
                              'breakStart',
                              toTimeStorage(e.target.value)
                            )
                          }
                          className="w-28 h-7 text-xs"
                          placeholder="Inicio"
                        />
                        <span className="text-xs text-muted-foreground">ate</span>
                        <Input
                          type="time"
                          value={toTimeInput(entry.breakEnd)}
                          onChange={(e) =>
                            updateEntry(
                              entry.dayOfWeek,
                              'breakEnd',
                              toTimeStorage(e.target.value)
                            )
                          }
                          className="w-28 h-7 text-xs"
                          placeholder="Fim"
                        />
                        <button
                          type="button"
                          onClick={() => toggleBreak(entry.dayOfWeek, false)}
                          className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remover pausa"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}

          <Button onClick={handleSave} disabled={isSaving} className="mt-2">
            {isSaving ? 'Salvando...' : 'Salvar horarios'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
