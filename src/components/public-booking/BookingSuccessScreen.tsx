import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Professional, Service } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface BookingSuccessScreenProps {
  selectedServicesData: Service[];
  selectedProfessionalData: Professional | undefined;
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedServiceTotal: number;
}

export function BookingSuccessScreen({
  selectedServicesData,
  selectedProfessionalData,
  selectedDate,
  selectedTime,
  selectedServiceTotal,
}: BookingSuccessScreenProps) {
  const servicesLabel = selectedServicesData.length
    ? selectedServicesData.map((service) => service.name).join(', ')
    : 'Nao informado';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg border border-border/70 bg-card shadow-[0_12px_36px_-28px_rgba(15,23,42,0.18)]">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              Agendamento confirmado
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Seu agendamento foi registrado com sucesso. Voce recebera a confirmacao em breve.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/25 p-4 text-left">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Resumo do agendamento
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Servicos</span>
                <span className="max-w-[65%] text-right font-medium">{servicesLabel}</span>
              </div>
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Profissional</span>
                <span className="max-w-[65%] text-right font-medium">
                  {selectedProfessionalData?.name || 'Nao informado'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Data</span>
                <span className="max-w-[65%] text-right font-medium">
                  {selectedDate?.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }) || 'Nao informada'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Horario</span>
                <span className="font-medium">{selectedTime || 'Nao informado'}</span>
              </div>
              <div className="flex items-start justify-between gap-3 border-t border-border/70 pt-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-primary">
                  {formatCurrency(selectedServiceTotal)}
                </span>
              </div>
            </div>
          </div>

          <Button onClick={() => window.location.reload()} className="w-full">
            Fazer novo agendamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
