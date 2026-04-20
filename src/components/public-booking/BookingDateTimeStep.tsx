import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const timeSlots = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
];

interface BookingDateTimeStepProps {
  currentMonth: Date;
  selectedDate: Date | null;
  selectedTime: string | null;
  availableSlots: string[];
  isLoadingAvailability: boolean;
  slug: string | undefined;
  getDaysInMonth: () => (Date | null)[];
  isDateSelectable: (date: Date | null) => boolean;
  navigateMonth: (direction: 'prev' | 'next') => void;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
}

const formatSelectedDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

export function BookingDateTimeStep({
  currentMonth,
  selectedDate,
  selectedTime,
  availableSlots,
  isLoadingAvailability,
  slug,
  getDaysInMonth,
  isDateSelectable,
  navigateMonth,
  onSelectDate,
  onSelectTime,
}: BookingDateTimeStepProps) {
  const visibleSlots = slug ? availableSlots : timeSlots;

  return (
    <>
      <CardHeader className="space-y-3">
        <CardTitle className="text-lg sm:text-xl">Escolha data e horario</CardTitle>
        <CardDescription className="text-sm">
          Primeiro escolha a data. Depois selecione um horario realmente disponivel.
        </CardDescription>

        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {selectedDate ? `Data escolhida: ${formatSelectedDate(selectedDate)}` : 'Escolha uma data para ver os horarios'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedDate
                  ? selectedTime
                    ? `Horario selecionado: ${selectedTime}`
                    : 'Agora escolha o melhor horario para finalizar o agendamento.'
                  : 'Datas indisponiveis aparecem desabilitadas.'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 sm:space-y-6">
        <div className="rounded-2xl border border-border/70 bg-background p-3 sm:p-4">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium capitalize text-foreground sm:text-base">
              {currentMonth.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8"
              aria-label="Proximo mes"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
              <span
                key={i}
                className="py-1 text-[10px] font-medium text-muted-foreground sm:text-xs"
              >
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((date, i) => (
              <button
                key={i}
                onClick={() => date && isDateSelectable(date) && onSelectDate(date)}
                disabled={!date || !isDateSelectable(date)}
                className={`aspect-square rounded-xl text-xs font-medium transition-colors sm:text-sm ${
                  !date
                    ? 'invisible'
                    : !isDateSelectable(date)
                      ? 'cursor-not-allowed text-muted-foreground/40'
                      : selectedDate?.toDateString() === date.toDateString()
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-transparent text-foreground hover:border-primary/30 hover:bg-primary/10'
                }`}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Clock3 className="h-4 w-4 text-primary" />
                Horarios disponiveis
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedDate
                  ? isLoadingAvailability && slug
                    ? 'Consultando disponibilidade em tempo real...'
                    : visibleSlots.length > 0
                      ? `${visibleSlots.length} horario(s) encontrado(s) para esta data.`
                      : 'Nenhum horario livre para esta data. Tente outro dia.'
                  : 'Selecione uma data para liberar os horarios.'}
              </p>
            </div>
            {selectedTime ? (
              <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                {selectedTime}
              </div>
            ) : null}
          </div>

          {selectedDate ? (
            visibleSlots.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {visibleSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSelectTime(time)}
                    className={`text-xs sm:text-sm ${
                      selectedTime === time ? 'bg-primary hover:bg-primary/90' : ''
                    }`}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-background/80 px-4 py-6 text-center text-sm text-muted-foreground">
                Escolha outra data para encontrar horarios disponiveis.
              </div>
            )
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-background/80 px-4 py-6 text-center text-sm text-muted-foreground">
              Escolha uma data no calendario para continuar.
            </div>
          )}
        </div>
      </CardContent>
    </>
  );
}
