import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment } from '@/hooks/useAppointments';
import type { Professional } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogStickyFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReassignAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  professionals: Professional[];
  onConfirm: (professionalId: string) => Promise<void>;
}

export function ReassignAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  professionals,
  onConfirm,
}: ReassignAppointmentDialogProps) {
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    setSelectedProfessionalId('');
  };

  const handleConfirm = async () => {
    if (!selectedProfessionalId) {
      toast.error('Selecione o novo profissional');
      return;
    }
    setIsLoading(true);
    try {
      await onConfirm(selectedProfessionalId);
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isLoading && !isOpen) handleClose(); }}>
      <DialogContent className="mx-4 max-h-[85vh] max-w-md overflow-y-auto sm:mx-auto sm:max-w-xl">
        <DialogHeader className="border-b border-border/70 pb-4 pr-10">
          <DialogTitle>Realocar Agendamento</DialogTitle>
          <DialogDescription>
            Selecione o novo profissional para este agendamento.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <DialogSection>
            <p className="text-sm font-medium text-foreground">
              Reatribua o atendimento sem perder o contexto operacional do cliente.
            </p>
            <p className="text-sm text-muted-foreground">
              {appointment?.client?.name ? `Cliente atual: ${appointment.client.name}.` : 'Escolha o novo responsavel para concluir a transferencia.'}
            </p>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-2">
              <Label>Novo profissional</Label>
              <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      {professional.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogSection>
        </DialogBody>

        <DialogStickyFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" variant="outline" onClick={handleClose} disabled={isLoading}>Cancelar</Button>
          <Button className="w-full sm:w-auto" onClick={() => void handleConfirm()} disabled={isLoading || !selectedProfessionalId}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Realocando...
              </>
            ) : (
              'Confirmar realocacao'
            )}
          </Button>
        </DialogStickyFooter>
      </DialogContent>
    </Dialog>
  );
}
