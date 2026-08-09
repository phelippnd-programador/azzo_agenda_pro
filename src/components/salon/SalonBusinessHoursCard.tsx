import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export interface BusinessHours {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
}

interface SalonBusinessHoursCardProps {
  businessHours: BusinessHours[];
  onUpdate: (index: number, field: keyof BusinessHours, value: string | boolean) => void;
  invalidIndexes?: number[];
}

const dayLabelMap: Record<string, string> = {
  'Terca-feira': 'Terça-feira',
  Sabado: 'Sábado',
};

const getDayLabel = (day: string) => dayLabelMap[day] ?? day;

export function SalonBusinessHoursCard({ businessHours, onUpdate, invalidIndexes = [] }: SalonBusinessHoursCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Clock className="w-5 h-5 text-primary" />
          Horário de Funcionamento
        </CardTitle>
        <CardDescription>Defina os horários de atendimento</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {businessHours.map((hours, index) => {
            const dayLabel = getDayLabel(hours.day);
            const isInvalid = invalidIndexes.includes(index);

            return (
              <div
                key={hours.day}
                className={`flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center ${
                  isInvalid ? 'border border-destructive/40 bg-destructive/5' : hours.enabled ? 'bg-muted/50' : 'bg-muted/30 opacity-60'
                }`}
              >
                <div className="flex min-w-[140px] items-center gap-3">
                  <Switch
                    aria-label={`${dayLabel} aberto`}
                    checked={hours.enabled}
                    onCheckedChange={(checked) => onUpdate(index, 'enabled', checked)}
                  />
                  <span className="font-medium text-sm">{dayLabel}</span>
                </div>
                {hours.enabled ? (
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Input
                      type="time"
                      aria-label={`${dayLabel} abertura`}
                      value={hours.open}
                      onChange={(e) => onUpdate(index, 'open', e.target.value)}
                      className="w-28"
                      aria-invalid={isInvalid}
                    />
                    <span className="text-muted-foreground">até</span>
                    <Input
                      type="time"
                      aria-label={`${dayLabel} fechamento`}
                      value={hours.close}
                      onChange={(e) => onUpdate(index, 'close', e.target.value)}
                      className="w-28"
                      aria-invalid={isInvalid}
                    />
                  </div>
                ) : null}
                {!hours.enabled ? (
                  <span className="text-sm text-muted-foreground sm:ml-auto">Fechado</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
