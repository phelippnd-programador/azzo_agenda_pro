import { Check, Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Professional, Service } from '@/lib/api';
import type { PublicAppointmentCreated } from '@/lib/api/public-booking';
import { formatCurrency } from '@/lib/format';

interface BookingSuccessScreenProps {
  selectedServicesData: Service[];
  selectedProfessionalData: Professional | undefined;
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedServiceTotal: number;
  /** F02 — presente quando o horario exige sinal (PIX pendente). */
  deposit?: PublicAppointmentCreated | null;
}

export function BookingSuccessScreen({
  selectedServicesData,
  selectedProfessionalData,
  selectedDate,
  selectedTime,
  selectedServiceTotal,
  deposit,
}: BookingSuccessScreenProps) {
  const servicesLabel = selectedServicesData.length
    ? selectedServicesData.map((service) => service.name).join(', ')
    : 'Nao informado';

  const depositPending = Boolean(deposit?.depositRequired && deposit?.depositPixPayload);

  const copyPix = () => {
    if (!deposit?.depositPixPayload) return;
    navigator.clipboard.writeText(deposit.depositPixPayload);
    toast.success('Codigo PIX copiado! Cole no app do seu banco.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg border border-border/70 bg-card shadow-[0_12px_36px_-28px_rgba(15,23,42,0.18)]">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="text-center">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                depositPending
                  ? 'bg-amber-100 dark:bg-amber-950/40'
                  : 'bg-emerald-100 dark:bg-emerald-950/40'
              }`}
            >
              {depositPending ? (
                <QrCode className="h-8 w-8 text-amber-600 dark:text-amber-300" />
              ) : (
                <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {depositPending ? 'Reserva aguardando sinal' : 'Agendamento confirmado'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {depositPending
                ? 'Pague o sinal via PIX para confirmar o horario. Sem o pagamento, a reserva sera liberada.'
                : 'Seu agendamento foi registrado com sucesso. Voce recebera a confirmacao em breve.'}
            </p>
          </div>

          {depositPending && deposit && (
            <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-left dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Sinal (PIX)</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(Number(deposit.depositValue ?? 0))}
                </span>
              </div>
              {deposit.depositExpiresAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Pague ate{' '}
                  {new Date(deposit.depositExpiresAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  para garantir o horario.
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <code className="max-h-20 flex-1 overflow-y-auto break-all rounded-md border border-border/70 bg-background p-2 text-[11px]">
                  {deposit.depositPixPayload}
                </code>
                <Button variant="outline" size="icon" onClick={copyPix} aria-label="Copiar codigo PIX">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={copyPix} className="mt-3 w-full">
                Copiar codigo PIX
              </Button>
            </div>
          )}

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
