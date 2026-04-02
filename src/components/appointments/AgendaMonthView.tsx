import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toDateKey } from '@/lib/format';

interface CalendarDay {
  date: Date;
  key: string;
  day: number;
}

interface AgendaMonthViewProps {
  currentDate: Date;
  monthCalendarDays: Array<CalendarDay | null>;
  monthAppointmentsByDay: Map<string, number>;
  totalAppointmentsInMonth: number;
  onDayClick: (date: Date) => void;
}

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const todayKey = toDateKey(new Date());

export function AgendaMonthView({
  currentDate,
  monthCalendarDays,
  monthAppointmentsByDay,
  totalAppointmentsInMonth,
  onDayClick,
}: AgendaMonthViewProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground capitalize">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
          <Badge variant="outline">{totalAppointmentsInMonth} agendamento(s)</Badge>
        </div>

        <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground uppercase">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {monthCalendarDays.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="min-h-[72px] sm:min-h-24" />;

            const apptCount = monthAppointmentsByDay.get(day.key) || 0;
            const isToday = day.key === todayKey;

            return (
              <button
                key={day.key}
                type="button"
                className={`h-auto min-h-[72px] sm:min-h-24 w-full p-2 text-left rounded-lg border transition-all duration-150 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                  isToday
                    ? 'border-primary bg-primary/5'
                    : apptCount > 0
                    ? 'border-border bg-card hover:bg-accent/40 hover:border-primary/30'
                    : 'border-dashed border-border/50 bg-transparent hover:bg-muted/30 hover:border-border'
                }`}
                onClick={() => onDayClick(day.date)}
              >
                <div className="flex flex-col gap-1.5">
                  <span className={`text-sm font-semibold leading-none ${isToday ? 'text-primary' : ''}`}>
                    {day.day}
                  </span>
                  {apptCount > 0 && (
                    <span className="inline-flex items-center self-start text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
                      {apptCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Clique em um dia para abrir a grade por horário.
        </p>
      </CardContent>
    </Card>
  );
}
