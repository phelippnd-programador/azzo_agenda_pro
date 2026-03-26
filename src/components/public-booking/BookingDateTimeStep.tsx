import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
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
  return (
    <>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Escolha Data e Horário</CardTitle>
        <CardDescription className="text-sm">
          Selecione quando deseja ser atendido
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-sm sm:text-base capitalize">
              {currentMonth.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
              <span key={i} className="text-[10px] sm:text-xs font-medium text-muted-foreground py-1">
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
                className={`aspect-square rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  !date
                    ? 'invisible'
                    : !isDateSelectable(date)
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : selectedDate?.toDateString() === date.toDateString()
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-primary/10 text-foreground'
                }`}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div>
            <Label className="text-sm font-medium mb-3 block">Horários Disponíveis</Label>
            {isLoadingAvailability && slug && (
              <p className="text-sm text-muted-foreground mb-2">Consultando disponibilidade...</p>
            )}
            {!isLoadingAvailability && slug && availableSlots.length === 0 && (
              <p className="text-sm text-muted-foreground mb-2">
                Nao ha horarios disponiveis para esta data.
              </p>
            )}
            <div className="grid grid-cols-4 gap-2">
              {(slug ? availableSlots : timeSlots).map((time) => (
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
          </div>
        )}
      </CardContent>
    </>
  );
}
