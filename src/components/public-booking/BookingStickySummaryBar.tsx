import { CalendarDays, ChevronUp, Clock3, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrencyCents } from '@/lib/format';

interface BookingStickySummaryBarProps {
  selectedServicesCount: number;
  selectedTime: string | null;
  selectedServiceDuration: number;
  selectedServiceTotal: number;
  currentStep: number;
  totalSteps: number;
  onOpenSummary: () => void;
}

export function BookingStickySummaryBar({
  selectedServicesCount,
  selectedTime,
  selectedServiceDuration,
  selectedServiceTotal,
  currentStep,
  totalSteps,
  onOpenSummary,
}: BookingStickySummaryBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 w-full flex-1 rounded-2xl border border-border/70 bg-muted/15 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Resumo do agendamento
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              Etapa {currentStep}/{totalSteps}
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Scissors className="h-3.5 w-3.5" />
                <span>Servicos</span>
              </div>
              <p className="mt-1 truncate font-semibold text-foreground">
                {selectedServicesCount || 0}
              </p>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                <span>Horario</span>
              </div>
              <p className="mt-1 truncate font-semibold text-foreground">
                {selectedTime || `${selectedServiceDuration || 0} min`}
              </p>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Total</span>
              </div>
              <p className="mt-1 truncate font-semibold text-foreground">
                {formatCurrencyCents(selectedServiceTotal)}
              </p>
            </div>
          </div>
        </div>

        <Button type="button" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={onOpenSummary}>
          <ChevronUp className="mr-2 h-4 w-4" />
          Ver resumo
        </Button>
      </div>
    </div>
  );
}
