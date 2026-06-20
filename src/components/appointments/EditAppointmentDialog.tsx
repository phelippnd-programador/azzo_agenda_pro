import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { appointmentsApi, type AppointmentUpdateRequest } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import type { Appointment } from '@/hooks/useAppointments';
import type { Professional } from '@/types';

interface EditAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  professionals: Professional[];
  onSuccess: () => void;
}

export function EditAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  professionals,
  onSuccess,
}: EditAppointmentDialogProps) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!appointment || !open) return;
    setDate(appointment.date ?? '');
    setStartTime(appointment.startTime ?? '');
    setProfessionalId(appointment.professionalId ?? '');
    setNotes(appointment.notes ?? '');
  }, [appointment, open]);

  const handleSave = async () => {
    if (!appointment) return;
    setIsSaving(true);
    try {
      const payload: AppointmentUpdateRequest = {};
      if (date !== appointment.date) payload.date = date;
      if (startTime !== appointment.startTime) payload.startTime = startTime;
      if (professionalId !== appointment.professionalId) payload.professionalId = professionalId;
      const originalNotes = appointment.notes ?? '';
      if (notes !== originalNotes) payload.notes = notes || null;
      await appointmentsApi.update(appointment.id, payload);
      toast.success('Agendamento atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(resolveUiError(error, 'Nao foi possivel atualizar o agendamento.').message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!appointment) return null;

  const activeProfessionals = professionals.filter((professional) => professional.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar agendamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-date">Data</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-time">Horario de inicio</Label>
            <Input
              id="edit-time"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-professional">Profissional</Label>
            <Select
              value={professionalId}
              onValueChange={setProfessionalId}
              disabled={isSaving}
            >
              <SelectTrigger id="edit-professional">
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {activeProfessionals.map((professional) => (
                  <SelectItem key={professional.id} value={professional.id}>
                    {professional.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Observacoes</Label>
            <Textarea
              id="edit-notes"
              placeholder="Observacoes do agendamento (opcional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar alteracoes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
