import { useEffect, useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { closuresApi, professionalsApi } from '@/lib/api';
import type { SpecialClosure, ClosureType, AffectedAppointment } from '@/lib/api';
import type { Professional } from '@/types';
import { resolveUiError } from '@/lib/error-utils';

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

const CLOSURE_TYPE_LABELS: Record<ClosureType, string> = {
  HOLIDAY: 'Feriado',
  VACATION: 'Ferias',
  RECESS: 'Recesso',
  INTERNAL_EVENT: 'Evento Interno',
  MANUAL: 'Manual',
};

const CLOSURE_TYPE_BADGE_CLASS: Record<ClosureType, string> = {
  HOLIDAY:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  VACATION:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
  RECESS:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  INTERNAL_EVENT:
    'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300',
  MANUAL: 'border-border bg-muted text-muted-foreground',
};

const CLOSURE_TYPES: ClosureType[] = [
  'HOLIDAY',
  'VACATION',
  'RECESS',
  'INTERNAL_EVENT',
  'MANUAL',
];

function formatDateBR(isoDate: string): string {
  try {
    return format(new Date(`${isoDate}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return isoDate;
  }
}

function currentMonthRange() {
  const now = new Date();
  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(endOfMonth(addMonths(now, 2)), 'yyyy-MM-dd'),
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyClosures() {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-muted">
        <Calendar className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">Nenhum fechamento cadastrado</p>
        <p className="text-sm text-muted-foreground">
          Adicione feriados, ferias ou datas especiais em que o salao nao ira funcionar.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal de impacto
// ---------------------------------------------------------------------------

interface ImpactModalProps {
  open: boolean;
  affected: AffectedAppointment[];
  onCancelAndNotify: () => void;
  onCloseWithoutNotify: () => void;
  isConfirming: boolean;
}

function ImpactModal({
  open,
  affected,
  onCancelAndNotify,
  onCloseWithoutNotify,
  isConfirming,
}: ImpactModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Agendamentos afetados
          </DialogTitle>
          <DialogDescription>
            {affected?.length} agendamento{affected?.length !== 1 ? 's' : ''} sera{affected?.length !== 1 ? 'o' : ''} afetado{affected?.length !== 1 ? 's' : ''} pelo fechamento nessa data/horario.
            Escolha como deseja prosseguir.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border bg-muted/20 p-3">
          {affected.map((apt) => (
            <div
              key={apt.id}
              className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm"
            >
              <span className="font-medium">{apt.clientName}</span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{apt.time}</span>
                <span>·</span>
                <span>{apt.service}</span>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onCloseWithoutNotify}
            disabled={isConfirming}
            className="w-full sm:w-auto"
          >
            Fechar sem notificar
          </Button>
          <Button
            onClick={onCancelAndNotify}
            disabled={isConfirming}
            className="w-full sm:w-auto"
          >
            {isConfirming ? 'Confirmando...' : 'Cancelar e notificar clientes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Formulário de criação/edição (Dialog)
// ---------------------------------------------------------------------------

interface ClosureFormData {
  closureDate: string;
  closureType: ClosureType;
  allDay: boolean;
  startTime: string;
  endTime: string;
  reason: string;
  professionalId: string;
}

const emptyForm = (): ClosureFormData => ({
  closureDate: '',
  closureType: 'HOLIDAY',
  allDay: true,
  startTime: '',
  endTime: '',
  reason: '',
  professionalId: '',
});

interface ClosureFormModalProps {
  open: boolean;
  editingClosure: SpecialClosure | null;
  professionals: Professional[];
  onClose: () => void;
  onSubmit: (data: ClosureFormData) => Promise<void>;
  isSaving: boolean;
}

function ClosureFormModal({
  open,
  editingClosure,
  professionals,
  onClose,
  onSubmit,
  isSaving,
}: ClosureFormModalProps) {
  const [form, setForm] = useState<ClosureFormData>(emptyForm());

  useEffect(() => {
    if (open && editingClosure) {
      setForm({
        closureDate: editingClosure.closureDate,
        closureType: editingClosure.closureType,
        allDay: editingClosure.allDay,
        startTime: editingClosure.startTime ?? '',
        endTime: editingClosure.endTime ?? '',
        reason: editingClosure.reason ?? '',
        professionalId: editingClosure.professionalId ?? '',
      });
    } else if (open) {
      setForm(emptyForm());
    }
  }, [open, editingClosure]);

  const set = <K extends keyof ClosureFormData>(key: K, value: ClosureFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const isEditing = Boolean(editingClosure);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar fechamento' : 'Adicionar fechamento'}
          </DialogTitle>
          <DialogDescription>
            Registre uma data ou periodo em que o salao ou profissional nao ira atender.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="closureDate">Data *</Label>
              <Input
                id="closureDate"
                type="date"
                value={form.closureDate}
                onChange={(e) => set('closureDate', e.target.value)}
                required
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="closureType">Tipo *</Label>
              <Select
                value={form.closureType}
                onValueChange={(v) => set('closureType', v as ClosureType)}
              >
                <SelectTrigger id="closureType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLOSURE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {CLOSURE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Profissional */}
          <div className="space-y-2">
            <Label htmlFor="professionalId">Profissional</Label>
            <Select
              value={form.professionalId || '__salon__'}
              onValueChange={(v) => set('professionalId', v === '__salon__' ? '' : v)}
            >
              <SelectTrigger id="professionalId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__salon__">Salao inteiro</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dia inteiro */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3">
            <Switch
              id="allDay"
              checked={form.allDay}
              onCheckedChange={(v) => set('allDay', v)}
            />
            <Label htmlFor="allDay" className="cursor-pointer">
              Dia inteiro
            </Label>
          </div>

          {/* Horarios parciais */}
          {!form.allDay ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Das</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => set('startTime', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Ate</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set('endTime', e.target.value)}
                  required
                />
              </div>
            </div>
          ) : null}

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              value={form.reason}
              onChange={(e) => set('reason', e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Ex: Feriado municipal, recesso de fim de ano..."
            />
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              Nao registre informacoes medicas ou pessoais neste campo. Este campo e visivel apenas
              para administradores.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function SettingsClosuresTab() {
  const [closures, setClosures] = useState<SpecialClosure[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [filterType, setFilterType] = useState<ClosureType | ''>('');
  const [filterProfessionalId, setFilterProfessionalId] = useState('');

  // Modal de criação/edição
  const [formOpen, setFormOpen] = useState(false);
  const [editingClosure, setEditingClosure] = useState<SpecialClosure | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de impacto
  const [pendingClosure, setPendingClosure] = useState<SpecialClosure | null>(null);
  const [impactedAppointments, setImpactedAppointments] = useState<AffectedAppointment[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const range = useMemo(() => currentMonthRange(), []);

  const loadClosures = async () => {
    setIsLoading(true);
    try {
      const data = await closuresApi.list(
        range.from,
        range.to,
        filterProfessionalId || undefined
      );
      setClosures(data);
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao carregar fechamentos').message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadClosures();
    professionalsApi
      .getAll({ size: 200 })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as { items: Professional[] }).items ?? [];
        setProfessionals(list);
      })
      .catch(() => undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadClosures();
  }, [filterProfessionalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredClosures = useMemo(() => {
    if (!filterType) return closures;
    return closures.filter((c) => c.closureType === filterType);
  }, [closures, filterType]);

  // --- Handlers ---

  const openCreate = () => {
    setEditingClosure(null);
    setFormOpen(true);
  };

  const openEdit = (closure: SpecialClosure) => {
    setEditingClosure(closure);
    setFormOpen(true);
  };

  const handleFormSubmit = async (formData: {
    closureDate: string;
    closureType: ClosureType;
    allDay: boolean;
    startTime: string;
    endTime: string;
    reason: string;
    professionalId: string;
  }) => {
    const payload: SpecialClosure = {
      closureDate: formData.closureDate,
      closureType: formData.closureType,
      allDay: formData.allDay,
      startTime: formData.allDay ? undefined : formData.startTime || undefined,
      endTime: formData.allDay ? undefined : formData.endTime || undefined,
      reason: formData.reason.trim() || undefined,
      professionalId: formData.professionalId || undefined,
    };

    setIsSaving(true);
    try {
      if (editingClosure?.id) {
        await closuresApi.update(editingClosure.id, payload);
        toast.success('Fechamento atualizado com sucesso.');
        setFormOpen(false);
        await loadClosures();
      } else {
        const impact = await closuresApi.create(payload);
        setFormOpen(false);
        if (impact?.affectedAppointments?.length > 0) {
          setPendingClosure(impact.closure);
          setImpactedAppointments(impact.affectedAppointments);
        } else {
          // Nenhum impacto — confirma direto
          await closuresApi.confirm(payload);
          toast.success('Fechamento cadastrado com sucesso.');
          await loadClosures();
        }
      }
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao salvar fechamento').message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImpactConfirm = async () => {
    if (!pendingClosure) return;
    setIsConfirming(true);
    try {
      await closuresApi.confirm(pendingClosure);
      toast.success('Fechamento confirmado. Clientes serao notificados sobre o cancelamento.');
      setPendingClosure(null);
      setImpactedAppointments([]);
      await loadClosures();
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao confirmar fechamento').message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleImpactSkipNotify = async () => {
    if (!pendingClosure) return;
    setIsConfirming(true);
    try {
      await closuresApi.confirm(pendingClosure);
      toast.success('Fechamento cadastrado.');
      setPendingClosure(null);
      setImpactedAppointments([]);
      await loadClosures();
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao confirmar fechamento').message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja remover este fechamento? Esta acao nao pode ser desfeita.')) return;
    try {
      await closuresApi.remove(id);
      toast.success('Fechamento removido.');
      await loadClosures();
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao remover fechamento').message);
    }
  };

  const professionalName = (closure: SpecialClosure) => {
    if (!closure.professionalId) return 'Salao inteiro';
    const found = professionals.find((p) => p.id === closure.professionalId);
    return found?.name ?? closure.professionalName ?? closure.professionalId;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Fechamentos Especiais
              </CardTitle>
              <CardDescription className="mt-1">
                Gerencie feriados, ferias e datas em que o salao ou profissional nao ira atender.
              </CardDescription>
            </div>
            <Button onClick={openCreate} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" />
              Adicionar fechamento
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={filterType || '__all__'}
              onValueChange={(v) => setFilterType(v === '__all__' ? '' : (v as ClosureType))}
            >
              <SelectTrigger className="sm:w-52">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os tipos</SelectItem>
                {CLOSURE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CLOSURE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterProfessionalId || '__all__'}
              onValueChange={(v) => setFilterProfessionalId(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="sm:w-52">
                <SelectValue placeholder="Todos os profissionais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os profissionais</SelectItem>
                <SelectItem value="__salon__">Salao inteiro</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista */}
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Carregando fechamentos...
            </div>
          ) : filteredClosures?.length === 0 ? (
            <EmptyClosures />
          ) : (
            <div className="space-y-2">
              {filteredClosures.map((closure) => (
                <div
                  key={closure.id ?? `${closure.closureDate}-${closure.professionalId}`}
                  className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    {/* Data */}
                    <span className="min-w-[90px] font-medium tabular-nums">
                      {formatDateBR(closure.closureDate)}
                    </span>

                    {/* Tipo badge */}
                    <Badge
                      variant="outline"
                      className={`w-fit text-xs ${CLOSURE_TYPE_BADGE_CLASS[closure.closureType]}`}
                    >
                      {CLOSURE_TYPE_LABELS[closure.closureType]}
                    </Badge>

                    {/* Profissional */}
                    <span className="text-sm text-muted-foreground">
                      {professionalName(closure)}
                    </span>

                    {/* Horário */}
                    <span className="text-sm text-muted-foreground">
                      {closure.allDay
                        ? 'Dia inteiro'
                        : `${closure.startTime ?? ''} - ${closure.endTime ?? ''}`}
                    </span>

                    {/* Motivo (só owner vê, mas esse componente só é montado para owner) */}
                    {closure.reason ? (
                      <span
                        className="max-w-[200px] truncate text-sm text-muted-foreground"
                        title={closure.reason}
                      >
                        {closure.reason}
                      </span>
                    ) : null}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 px-3"
                      onClick={() => openEdit(closure)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    {closure.id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 px-3 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(closure.id!)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de criação/edição */}
      <ClosureFormModal
        open={formOpen}
        editingClosure={editingClosure}
        professionals={professionals}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        isSaving={isSaving}
      />

      {/* Modal de impacto */}
      <ImpactModal
        open={Boolean(pendingClosure)}
        affected={impactedAppointments}
        onCancelAndNotify={handleImpactConfirm}
        onCloseWithoutNotify={handleImpactSkipNotify}
        isConfirming={isConfirming}
      />
    </div>
  );
}
