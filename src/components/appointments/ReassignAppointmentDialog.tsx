import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment } from '@/hooks/useAppointments';
import type { Professional } from '@/lib/api';

interface ReassignAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  /** Profissionais disponíveis para receber o agendamento (excluindo o atual) */
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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isLoading) { if (!isOpen) handleClose(); } }}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Realocar Agendamento</DialogTitle>
          <DialogDescription>
            Selecione o novo profissional para este agendamento.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label className="text-sm">Novo profissional</Label>
          <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o profissional" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isLoading || !selectedProfessionalId}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Realocando...</>
            ) : (
              'Confirmar realocação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
