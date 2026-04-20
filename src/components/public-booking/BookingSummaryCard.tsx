import { CalendarDays, Clock3, Scissors, UserRound } from 'lucide-react';
import { Service, Professional } from '@/lib/api';
import { formatCurrencyCents } from '@/lib/format';

interface BookingSummaryCardProps {
  title: string;
  description: string;
  selectedServicesData: Service[];
  selectedProfessionalData?: Professional;
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedServiceDuration: number;
  selectedServiceTotal: number;
  currentStep: number;
  totalSteps: number;
  compact?: boolean;
}

const formatSelectedDate = (date: Date | null) => {
  if (!date) {
    return 'Escolha uma data';
  }

  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  });
};

export function BookingSummaryCard({
  title,
  description,
  selectedServicesData,
  selectedProfessionalData,
  selectedDate,
  selectedTime,
  selectedServiceDuration,
  selectedServiceTotal,
  currentStep,
  totalSteps,
  compact = false,
}: BookingSummaryCardProps) {
  const servicesLabel = selectedServicesData.length
    ? selectedServicesData.map((service) => service.name).join(', ')
    : 'Escolha um ou mais servicos';

  const completionCount = [
    selectedServicesData.length > 0,
    Boolean(selectedProfessionalData),
    Boolean(selectedDate && selectedTime),
  ].filter(Boolean).length;

  return (
    <div className="rounded-3xl border border-border/70 bg-background/95 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {title}
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground sm:text-lg">{description}</h2>
        </div>
        <div className="rounded-2xl bg-primary/10 px-3 py-2 text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-primary/80">
            Etapa atual
          </p>
          <p className="text-sm font-semibold text-primary">
            {currentStep}/{totalSteps}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/60 bg-muted/25 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Progresso</p>
            <p className="text-sm font-medium text-foreground">
              {completionCount} de 3 decisoes principais concluidas
            </p>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {Math.round((currentStep / totalSteps) * 100)}%
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/70">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
            <Scissors className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Servicos</p>
            <p className="text-sm font-medium text-foreground">
              {selectedServicesData.length
                ? `${selectedServicesData.length} selecionado(s)`
                : 'Nenhum selecionado'}
            </p>
            {!compact ? (
              <p className="mt-1 text-sm text-muted-foreground">{servicesLabel}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Profissional</p>
            <p className="text-sm font-medium text-foreground">
              {selectedProfessionalData?.name || 'Escolha quem vai atender voce'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Data</p>
            <p className="text-sm font-medium text-foreground">{formatSelectedDate(selectedDate)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
            <Clock3 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Horario</p>
            <p className="text-sm font-medium text-foreground">
              {selectedTime || 'Escolha um horario disponivel'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Duracao prevista: {selectedServiceDuration || 0} min
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total estimado</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrencyCents(selectedServiceTotal)}
            </p>
          </div>
          <p className="max-w-[11rem] text-right text-xs text-muted-foreground">
            Revise os dados e confirme no ultimo passo.
          </p>
        </div>
      </div>
    </div>
  );
}
