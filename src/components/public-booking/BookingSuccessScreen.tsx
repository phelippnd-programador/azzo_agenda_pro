import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Service, Professional } from '@/lib/api';
import { formatCurrencyCents } from '@/lib/format';

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-card flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Agendamento Confirmado!
          </h2>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
          </p>

          <div className="bg-muted/40 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Serviço:</span>
              <span className="font-medium">{selectedServicesData.map((service) => service.name).join(', ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profissional:</span>
              <span className="font-medium">{selectedProfessionalData?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Data:</span>
              <span className="font-medium">
                {selectedDate?.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Horário:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-primary">
                {formatCurrencyCents(selectedServiceTotal)}
              </span>
            </div>
          </div>

          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Fazer Novo Agendamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
