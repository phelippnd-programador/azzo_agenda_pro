import { User, Phone } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Service, Professional } from '@/lib/api';
import { maskPhoneBr } from '@/lib/input-masks';
import { formatCurrencyCents } from '@/lib/format';

interface BookingCustomerStepProps {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  selectedServicesData: Service[];
  selectedProfessionalData: Professional | undefined;
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedServiceTotal: number;
  onChangeName: (v: string) => void;
  onChangePhone: (v: string) => void;
  onChangeEmail: (v: string) => void;
}

export function BookingCustomerStep({
  customerName,
  customerPhone,
  customerEmail,
  selectedServicesData,
  selectedProfessionalData,
  selectedDate,
  selectedTime,
  selectedServiceTotal,
  onChangeName,
  onChangePhone,
  onChangeEmail,
}: BookingCustomerStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Seus Dados</CardTitle>
        <CardDescription className="text-sm">
          Preencha seus dados para confirmar o agendamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm">Nome Completo *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Seu nome"
              value={customerName}
              onChange={(e) => onChangeName(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm">WhatsApp *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phone"
              placeholder="(11) 99999-0000"
              value={customerPhone}
              onChange={(e) => onChangePhone(maskPhoneBr(e.target.value))}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">E-mail (opcional)</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={customerEmail}
            onChange={(e) => onChangeEmail(e.target.value)}
          />
        </div>

        {/* Summary */}
        <div className="bg-muted/40 rounded-xl p-4 mt-6">
          <h4 className="font-medium text-foreground mb-3 text-sm">Resumo do Agendamento</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serviço:</span>
              <span className="font-medium truncate ml-2">{selectedServicesData.map((service) => service.name).join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profissional:</span>
              <span className="font-medium truncate ml-2">{selectedProfessionalData?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data:</span>
              <span className="font-medium">
                {selectedDate?.toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horário:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            <div className="flex justify-between pt-2 border-t mt-2">
              <span className="text-foreground font-medium">Total:</span>
              <span className="font-bold text-primary">
                {formatCurrencyCents(selectedServiceTotal)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
}
