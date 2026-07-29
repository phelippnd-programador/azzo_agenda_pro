import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  appointmentStatusBadgeToneMap,
  appointmentStatusLabelMap,
  getStatusColor,
} from '@/lib/appointment-status';
import { toDateKey } from '@/lib/format';
import type { Appointment } from '@/hooks/useAppointments';

const normalizeTime = (value?: string | null) => {
  if (!value) return '';
  const [h = '', m = ''] = value.split(':');
  if (!h || !m) return value;
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
};

const toMinutes = (time: string) => {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
};

const DAY_NAMES_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

interface WeekDay {
  date: Date;
  dateKey: string;
  label: string;
  labelShort: string;
  dayOfMonth: number;
  isToday: boolean;
}

interface AgendaWeekViewProps {
  /** Qualquer data dentro da semana desejada */
  currentDate: Date;
  appointments: Appointment[];
  professionalId?: string;
  onAppointmentClick: (appointment: Appointment) => void;
  /** Abre formulário de novo agendamento pré-preenchido com data/hora */
  onNewAppointmentSlot: (date: Date, time: string) => void;
}

export function AgendaWeekView({
  currentDate,
  appointments,
  onAppointmentClick,
  onNewAppointmentSlot,
}: AgendaWeekViewProps) {
  const todayKey = toDateKey(new Date());

  const weekDays = useMemo<WeekDay[]>(() => {
    // Segunda = 1; calcula o offset para chegar na segunda da semana corrente
    const day = currentDate.getDay(); // 0=Dom … 6=Sab
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + diffToMonday);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateKey = toDateKey(d);
      const weekdayIndex = d.getDay();
      return {
        date: d,
        dateKey,
        label: DAY_NAMES_LONG[weekdayIndex] ?? '',
        labelShort: DAY_NAMES_SHORT[weekdayIndex] ?? '',
        dayOfMonth: d.getDate(),
        isToday: dateKey === todayKey,
      };
    });
  }, [currentDate, todayKey]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    weekDays.forEach((d) => map.set(d.dateKey, []));
    appointments.forEach((apt) => {
      const key = toDateKey(apt.date);
      const list = map.get(key);
      if (list) list.push(apt);
    });
    // Ordena por horário dentro de cada dia
    map.forEach((list) =>
      list.sort((a, b) => toMinutes(normalizeTime(a.startTime)) - toMinutes(normalizeTime(b.startTime))),
    );
    return map;
  }, [appointments, weekDays]);

  const weekRange = useMemo(() => {
    const first = weekDays[0]?.date;
    const last = weekDays[6]?.date;
    if (!first || !last) return '';
    return `${first.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} — ${last.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }, [weekDays]);

  return (
    <Card className="border-border/70 bg-card/96 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.14)]">
      <CardContent className="p-0">
        {/* Cabeçalho da semana */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/25 px-4 py-3">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Visao semanal
            </p>
            <p className="text-sm font-medium capitalize text-foreground">{weekRange}</p>
          </div>
          <Badge variant="outline" className="ml-auto bg-background/80 text-xs">
            {appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Grade dos dias — scroll horizontal em telas pequenas */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Linha de cabeçalho dos dias */}
            <div className="grid grid-cols-7 border-b border-border/60">
              {weekDays.map((day) => (
                <div
                  key={day.dateKey}
                  className={[
                    'px-2 py-3 text-center',
                    day.isToday
                      ? 'bg-primary/8 border-b-2 border-primary'
                      : 'border-b border-transparent',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-[10px] font-semibold uppercase tracking-[0.12em]',
                      day.isToday ? 'text-primary' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.labelShort}</span>
                  </p>
                  <p
                    className={[
                      'mt-0.5 text-lg font-bold leading-none',
                      day.isToday ? 'text-primary' : 'text-foreground',
                    ].join(' ')}
                  >
                    {day.dayOfMonth}
                  </p>
                  {day.isToday && (
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>

            {/* Conteúdo dos dias */}
            <div className="grid grid-cols-7 divide-x divide-border/50 min-h-[420px]">
              {weekDays.map((day) => {
                const dayAppointments = appointmentsByDay.get(day.dateKey) ?? [];
                return (
                  <div
                    key={day.dateKey}
                    className={[
                      'flex flex-col p-2 gap-1.5',
                      day.isToday ? 'bg-primary/4' : 'bg-background/60',
                    ].join(' ')}
                  >
                    {dayAppointments.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => onNewAppointmentSlot(day.date, '09:00')}
                        className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/50 py-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/4"
                      >
                        <span className="text-[10px] text-muted-foreground/60">Sem agendamentos</span>
                        <span className="text-[10px] font-medium text-primary/60 hover:text-primary transition-colors">
                          + Novo
                        </span>
                      </button>
                    ) : (
                      <>
                        {dayAppointments.map((apt) => (
                          <WeekAppointmentCard
                            key={apt.id}
                            appointment={apt}
                            onClick={() => onAppointmentClick(apt)}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => onNewAppointmentSlot(day.date, '09:00')}
                          className="mt-auto rounded-md border border-dashed border-border/40 py-1 text-center text-[10px] text-muted-foreground/50 transition-colors hover:border-primary/30 hover:text-primary/70"
                        >
                          + Novo
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeekAppointmentCard({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  const clientName = appointment.client?.name ?? 'Cliente';
  const startTime = normalizeTime(appointment.startTime);
  const serviceName =
    appointment.items?.[0]?.service?.name ??
    (appointment as { service?: { name?: string } }).service?.name ??
    'Serviço';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-lg p-2 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-px',
        getStatusColor(appointment.status),
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="text-[10px] font-semibold leading-none opacity-75">{startTime}</span>
        <StatusBadge
          status={appointment.status}
          labelMap={appointmentStatusLabelMap}
          toneMap={appointmentStatusBadgeToneMap}
          className="px-1 py-0 text-[8px] leading-tight"
        />
      </div>
      <p className="text-xs font-semibold leading-tight truncate">{clientName}</p>
      <p className="text-[10px] leading-tight truncate opacity-70 mt-0.5">{serviceName}</p>
    </button>
  );
}
