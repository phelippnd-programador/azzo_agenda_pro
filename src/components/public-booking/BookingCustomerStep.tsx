import { Phone, User } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { maskPhoneBr } from '@/lib/input-masks';

interface BookingCustomerStepProps {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  onChangeName: (v: string) => void;
  onChangePhone: (v: string) => void;
  onChangeEmail: (v: string) => void;
}

export function BookingCustomerStep({
  customerName,
  customerPhone,
  customerEmail,
  onChangeName,
  onChangePhone,
  onChangeEmail,
}: BookingCustomerStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Seus Dados</CardTitle>
        <CardDescription className="text-sm">
          Preencha seus dados para confirmar o agendamento. O resumo permanece visivel durante o fluxo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">Falta pouco para concluir.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Usamos seus dados apenas para confirmar o agendamento e facilitar o contato sobre esse horario.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm">
            Nome completo *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
          <Label htmlFor="phone" className="text-sm">
            WhatsApp *
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
          <Label htmlFor="email" className="text-sm">
            E-mail (opcional)
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={customerEmail}
            onChange={(e) => onChangeEmail(e.target.value)}
          />
        </div>
      </CardContent>
    </>
  );
}
