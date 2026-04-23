import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { maskPhoneBr } from '@/lib/input-masks';
import { toast } from 'sonner';
import type { WorkingHours } from '@/types';

const defaultWorkingHours: WorkingHours[] = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', isWorking: true },
  { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorking: false },
];

const weekdayLabels: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terca', 3: 'Quarta',
  4: 'Quinta', 5: 'Sexta', 6: 'Sabado',
};

type ProfessionalData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  isActive: boolean;
  workingHours: WorkingHours[];
};

type FormPayload = {
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  commissionRate: number;
  isActive: boolean;
  workingHours: WorkingHours[];
};

interface ProfessionalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProfessional: ProfessionalData | null;
  specialties: Array<{ id: string; name: string }>;
  isLoadingSpecialties: boolean;
  specialtiesError: string | null;
  refetchSpecialties: () => void;
  onCreate: (data: FormPayload) => Promise<unknown>;
  onUpdate: (id: string, data: Partial<FormPayload>) => Promise<unknown>;
}

export function ProfessionalFormDialog({
  open,
  onOpenChange,
  editingProfessional,
  specialties,
  isLoadingSpecialties,
  specialtiesError,
  refetchSpecialties,
  onCreate,
  onUpdate,
}: ProfessionalFormDialogProps) {
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formWorkingHours, setFormWorkingHours] = useState<WorkingHours[]>(defaultWorkingHours);
  const [isWorkingHoursDisabled, setIsWorkingHoursDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setSelectedSpecialties([]);
    setFormIsActive(true);
    setFormWorkingHours(defaultWorkingHours);
    setIsWorkingHoursDisabled(false);
  };

  useEffect(() => {
    if (!open) return;
    if (!editingProfessional) {
      resetForm();
      return;
    }
    const prof = editingProfessional;
    setFormName(prof.name);
    setFormEmail(prof.email);
    setFormPhone(prof.phone);
    setSelectedSpecialties(prof.specialties || []);
    setFormIsActive(prof.isActive);
    const hasWorkingHours = Array.isArray(prof.workingHours) && prof.workingHours.length > 0;
    if (!hasWorkingHours) {
      setFormWorkingHours(defaultWorkingHours.map((item) => ({ ...item, startTime: '00:00', endTime: '00:00', isWorking: false })));
      setIsWorkingHoursDisabled(true);
    } else {
      const normalized = defaultWorkingHours.map((def) => {
        const current = prof.workingHours.find((item) => item.dayOfWeek === def.dayOfWeek);
        return current
          ? { dayOfWeek: current.dayOfWeek, startTime: current.startTime || def.startTime, endTime: current.endTime || def.endTime, isWorking: !!current.isWorking }
          : def;
      });
      setFormWorkingHours(normalized);
      setIsWorkingHoursDisabled(false);
    }
  }, [open, editingProfessional]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSpecialty = (name: string) => {
    setSelectedSpecialties((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };

  const updateWorkingHour = (dayOfWeek: number, field: 'startTime' | 'endTime' | 'isWorking', value: string | boolean) => {
    setFormWorkingHours((prev) => prev.map((item) => item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async () => {
    if (!formName || !formEmail || !formPhone) {
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }
    const invalidWorkingRange = formWorkingHours.some((item) => item.isWorking && item.startTime >= item.endTime);
    if (invalidWorkingRange) {
      toast.error('Revise os horarios: o inicio deve ser menor que o fim.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: FormPayload = {
        name: formName, email: formEmail, phone: formPhone,
        specialties: selectedSpecialties, commissionRate: 0,
        isActive: formIsActive, workingHours: formWorkingHours,
      };
      if (editingProfessional) {
        await onUpdate(editingProfessional.id, payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
          <DialogDescription>
            {editingProfessional ? 'Atualize os dados do profissional' : 'Adicione um novo membro a equipe'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="text-sm font-medium text-foreground">
              {editingProfessional ? 'Ajuste dados operacionais, especialidades e disponibilidade.' : 'Cadastre o profissional com os dados minimos para liberar agenda, especialidades e horarios.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              E-mail, telefone e horario de trabalho ajudam a deixar o perfil pronto para operacao desde o primeiro acesso.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input
              placeholder="Nome do profissional"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                disabled={!!editingProfessional}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input
                placeholder="(11) 99999-0000"
                value={formPhone}
                onChange={(e) => setFormPhone(maskPhoneBr(e.target.value))}
                disabled={!!editingProfessional}
              />
            </div>
          </div>
          {editingProfessional ? (
            <p className="text-xs text-muted-foreground">
              E-mail e telefone nao podem ser alterados na edicao do profissional.
            </p>
          ) : null}

          <div className="space-y-2">
            <Label>Especialidades</Label>
            <div className="rounded-lg border p-3 space-y-3 max-h-48 overflow-y-auto">
              {isLoadingSpecialties && <p className="text-sm text-muted-foreground">Carregando especialidades...</p>}
              {specialtiesError && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">{specialtiesError}</p>
                  <Button type="button" variant="outline" size="sm" onClick={refetchSpecialties}>
                    Tentar novamente
                  </Button>
                </div>
              )}
              {!isLoadingSpecialties && !specialtiesError && !specialties.length && (
                <p className="text-sm text-muted-foreground">Nenhuma especialidade cadastrada.</p>
              )}
              {!isLoadingSpecialties && specialties.map((specialty) => (
                <label key={specialty.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedSpecialties.includes(specialty.name)}
                    onCheckedChange={() => toggleSpecialty(specialty.name)}
                  />
                  <span>{specialty.name}</span>
                </label>
              ))}
            </div>
            {selectedSpecialties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedSpecialties.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Horario de trabalho</Label>
            <div className="rounded-lg border p-3 space-y-2">
              {formWorkingHours
                .slice()
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((hour) => (
                  <div key={hour.dayOfWeek} className="grid grid-cols-[80px_1fr_1fr_auto] items-center gap-2">
                    <span className="text-xs text-muted-foreground">{weekdayLabels[hour.dayOfWeek]}</span>
                    <Input
                      type="time"
                      value={hour.startTime}
                      onChange={(e) => updateWorkingHour(hour.dayOfWeek, 'startTime', e.target.value)}
                      disabled={isWorkingHoursDisabled || !hour.isWorking}
                    />
                    <Input
                      type="time"
                      value={hour.endTime}
                      onChange={(e) => updateWorkingHour(hour.dayOfWeek, 'endTime', e.target.value)}
                      disabled={isWorkingHoursDisabled || !hour.isWorking}
                    />
                    <Switch
                      checked={hour.isWorking}
                      onCheckedChange={(checked) => updateWorkingHour(hour.dayOfWeek, 'isWorking', checked)}
                      disabled={isWorkingHoursDisabled}
                    />
                  </div>
                ))}
            </div>
            {isWorkingHoursDisabled ? (
              <p className="text-xs text-amber-700">
                Horarios de trabalho nao informados pelo backend. Edicao desativada.
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <div>
              <Label>Profissional Ativo</Label>
              <p className="text-xs text-muted-foreground">Disponivel para agendamentos</p>
            </div>
            <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {editingProfessional ? 'Salvando...' : 'Adicionando...'}
              </>
            ) : editingProfessional ? 'Salvar profissional' : 'Criar profissional'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
