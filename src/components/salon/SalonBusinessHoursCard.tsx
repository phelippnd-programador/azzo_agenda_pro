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
}

export function SalonBusinessHoursCard({ businessHours, onUpdate }: SalonBusinessHoursCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Clock className="w-5 h-5 text-primary" />
          Horario de Funcionamento
        </CardTitle>
        <CardDescription>Defina os horarios de atendimento</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {businessHours.map((hours, index) => (
            <div
              key={hours.day}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg ${
                hours.enabled ? 'bg-muted/50' : 'bg-muted/30 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-[140px]">
                <Switch
                  checked={hours.enabled}
                  onCheckedChange={(checked) => onUpdate(index, 'enabled', checked)}
                />
                <span className="font-medium text-sm">{hours.day}</span>
              </div>
              {hours.enabled ? (
                <div className="flex items-center gap-2 ml-auto">
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={(e) => onUpdate(index, 'open', e.target.value)}
                    className="w-28"
                  />
                  <span className="text-muted-foreground">ate</span>
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={(e) => onUpdate(index, 'close', e.target.value)}
                    className="w-28"
                  />
                </div>
              ) : null}
              {!hours.enabled ? (
                <span className="text-sm text-muted-foreground ml-auto">Fechado</span>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
