import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const todayKey = toDateKey(new Date());

export function AgendaMonthView({
  currentDate,
  monthCalendarDays,
  monthAppointmentsByDay,
  totalAppointmentsInMonth,
  onDayClick,
}: AgendaMonthViewProps) {
  const highestVolume = Math.max(...Array.from(monthAppointmentsByDay.values()), 0);
  const activeDays = Array.from(monthAppointmentsByDay.values()).filter((count) => count > 0).length;
  const averageByActiveDay = activeDays > 0 ? (totalAppointmentsInMonth / activeDays).toFixed(1) : '0.0';

  return (
    <Card className="border-border/70 bg-card/96 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.14)]">
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm capitalize text-muted-foreground">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-foreground">
              Distribuição mensal para localizar picos, dias ociosos e concentração de demanda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-background/80">
              {totalAppointmentsInMonth} agendamento(s)
            </Badge>
            <Badge variant="outline" className="bg-background/80">
              {activeDays} dia(s) com movimento
            </Badge>
            {highestVolume > 0 ? (
              <Badge variant="outline" className="bg-background/80">
                Pico de {highestVolume}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Volume do mes</p>
            <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{totalAppointmentsInMonth}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Dias ativos</p>
            <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{activeDays}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Maior pico</p>
            <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{highestVolume}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Média por dia ativo</p>
            <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{averageByActiveDay}</p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="px-1 text-center sm:text-left">
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {monthCalendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-[88px] rounded-2xl bg-muted/10 sm:min-h-[108px]" />;
            }

            const apptCount = monthAppointmentsByDay.get(day.key) || 0;
            const isToday = day.key === todayKey;
            const isBusy = highestVolume > 0 && apptCount >= Math.max(3, Math.ceil(highestVolume * 0.65));
            const isWarm = apptCount > 0 && !isBusy;

            return (
              <button
                key={day.key}
                type="button"
                className={cn(
                  'group h-auto min-h-[88px] w-full rounded-2xl border p-2 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:min-h-[108px] sm:p-3',
                  isToday
                    ? 'border-primary/40 bg-primary/8 shadow-[0_10px_24px_-18px_rgba(59,130,246,0.55)]'
                    : apptCount === 0
                    ? 'border-dashed border-border/60 bg-background hover:border-border hover:bg-muted/30'
                    : isBusy
                    ? 'border-primary/25 bg-primary/5 hover:border-primary/35 hover:bg-primary/8'
                    : 'border-border bg-card hover:border-primary/20 hover:bg-accent/35'
                )}
                onClick={() => onDayClick(day.date)}
              >
                <div className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn('text-sm font-semibold leading-none', isToday && 'text-primary')}>
                      {day.day}
                    </span>
                    {isToday ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        Hoje
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-200',
                          apptCount === 0
                            ? 'w-0'
                            : isBusy
                            ? 'bg-primary'
                            : isWarm
                            ? 'bg-primary/65'
                            : 'bg-muted-foreground/40'
                        )}
                        style={{
                          width:
                            highestVolume > 0 && apptCount > 0
                              ? `${Math.max(18, (apptCount / highestVolume) * 100)}%`
                              : '0%',
                        }}
                      />
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {apptCount > 0 ? 'Agendamentos' : 'Sem agenda'}
                        </p>
                        <p className="text-base font-semibold text-foreground">{apptCount}</p>
                      </div>
                      {isBusy ? (
                        <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          Pico
                        </span>
                      ) : isWarm ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Ativo
                        </span>
                      ) : null}
                    </div>
                  </div>
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
