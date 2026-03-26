import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { CheckCircle2, Circle, Lock, Plus } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { ClientUpsertDialog } from '@/components/clients/ClientUpsertDialog';
import { AvailableSlotsList } from '@/components/appointments/AvailableSlotsList';
import { formatCurrency, toDateKey } from '@/lib/format';
import type { Professional } from '@/lib/api';

type CreateAppointmentPayload = {
  clientId: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING';
  totalPrice: number;
  items: Array<{ serviceId: string; durationMinutes: number; unitPrice: number; totalPrice: number }>;
};

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  isProfessionalUser: boolean;
  loggedProfessional: Professional | null;
  activeProfessionals: Professional[];
  createAppointment: (payload: CreateAppointmentPayload) => Promise<void>;
}

const serviceHasAssignedProfessionals = (professionalIds?: string[] | null) =>
  Array.isArray(professionalIds) && professionalIds.length > 0;

export function NewAppointmentDialog({
  open,
  onOpenChange,
  currentDate,
  isProfessionalUser,
  loggedProfessional,
  activeProfessionals,
  createAppointment,
}: NewAppointmentDialogProps) {
  const [newClientId, setNewClientId] = useState('');
  const [newClientSearch, setNewClientSearch] = useState('');
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [newProfessionalId, setNewProfessionalId] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  const [newDate, setNewDate] = useState(toDateKey(currentDate));
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { clients, createClient } = useClients({ enabled: open });
  const { services } = useServices({ enabled: open });

  const activeServicesCatalog = useMemo(() => services.filter((s) => s.isActive), [services]);

  const effectiveProfessionalId = isProfessionalUser
    ? loggedProfessional?.id ?? newProfessionalId
    : newProfessionalId;

  const availableNewProfessionals = useMemo(() => {
    if (!newServiceId) return activeProfessionals;
    return activeProfessionals.filter((prof) =>
      activeServicesCatalog.some(
        (svc) =>
          svc.id === newServiceId &&
          serviceHasAssignedProfessionals(svc.professionalIds) &&
          svc.professionalIds.includes(prof.id),
      ),
    );
  }, [activeProfessionals, activeServicesCatalog, newServiceId]);

  const activeServices = useMemo(
    () =>
      activeServicesCatalog.filter((svc) => {
        if (!effectiveProfessionalId) return true;
        return (
          serviceHasAssignedProfessionals(svc.professionalIds) &&
          svc.professionalIds.includes(effectiveProfessionalId)
        );
      }),
    [activeServicesCatalog, effectiveProfessionalId],
  );

  const selectedNewClient = useMemo(
    () => clients.find((c) => c.id === newClientId) ?? null,
    [clients, newClientId],
  );

  const selectedNewService = useMemo(
    () => activeServicesCatalog.find((s) => s.id === newServiceId) ?? null,
    [activeServicesCatalog, newServiceId],
  );

  const filteredClients = useMemo(() => {
    const query = newClientSearch.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((c) =>
      [c.name, c.phone, c.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(query)),
    );
  }, [clients, newClientSearch]);

  const hasProfessionalsForSelectedService =
    !selectedNewService || availableNewProfessionals.length > 0;

  const isEffectiveProfessionalValid =
    !!effectiveProfessionalId &&
    availableNewProfessionals.some((p) => p.id === effectiveProfessionalId);

  const canChooseService = !!selectedNewClient;
  const canChooseProfessional = !!selectedNewService;
  const canChooseDate = !!selectedNewService && hasProfessionalsForSelectedService && isEffectiveProfessionalValid;
  const canChooseSlot = canChooseDate && !!newDate;
  const canSubmit =
    !!newClientId && !!newServiceId && isEffectiveProfessionalValid && !!newDate && !!newStartTime && !!newEndTime;

  const selectedServiceIds = useMemo(() => (newServiceId ? [newServiceId] : []), [newServiceId]);

  const { slots, isLoading: isLoadingSlots, error: slotsError, canFetch } = useAvailableSlots({
    professionalId: effectiveProfessionalId || undefined,
    date: newDate || undefined,
    serviceIds: selectedServiceIds,
    serviceDurationMinutes: Number(selectedNewService?.duration || 0),
    bufferMinutes: 0,
  });

  const stepStates = useMemo(
    () => [
      { id: 'client', number: 1, title: 'Cliente', done: !!selectedNewClient, active: !selectedNewClient },
      { id: 'service', number: 2, title: 'Servico', done: !!selectedNewService, active: !!selectedNewClient && !selectedNewService },
      { id: 'professional', number: 3, title: 'Profissional', done: isEffectiveProfessionalValid, active: !!selectedNewService && !isEffectiveProfessionalValid },
      { id: 'date', number: 4, title: 'Data', done: canChooseDate, active: isEffectiveProfessionalValid && !canChooseDate },
      { id: 'slot', number: 5, title: 'Horario', done: !!newStartTime && !!newEndTime, active: canChooseSlot && !newStartTime },
    ],
    [selectedNewClient, selectedNewService, isEffectiveProfessionalValid, canChooseDate, canChooseSlot, newStartTime, newEndTime],
  );

  // Reset slot when deps change
  useEffect(() => { setNewStartTime(''); setNewEndTime(''); }, [newDate, newProfessionalId, newServiceId]);

  // Sync date with currentDate
  useEffect(() => { setNewDate(toDateKey(currentDate)); }, [currentDate]);

  // Remove service if no longer available for selected professional
  useEffect(() => {
    if (!newServiceId) return;
    if (!activeServices.some((s) => s.id === newServiceId)) setNewServiceId('');
  }, [activeServices, newServiceId]);

  // Remove professional if no longer available for selected service
  useEffect(() => {
    if (isProfessionalUser || !newProfessionalId) return;
    if (!availableNewProfessionals.some((p) => p.id === newProfessionalId)) setNewProfessionalId('');
  }, [availableNewProfessionals, isProfessionalUser, newProfessionalId]);

  const resetForm = () => {
    setNewClientId('');
    setNewClientSearch('');
    setNewProfessionalId(isProfessionalUser && loggedProfessional?.id ? loggedProfessional.id : '');
    setNewServiceId('');
    setNewStartTime('');
    setNewEndTime('');
  };

  const handleSubmit = async () => {
    if (isSubmitting || !canSubmit || !selectedNewService) return;
    setIsSubmitting(true);
    try {
      await createAppointment({
        clientId: newClientId,
        professionalId: effectiveProfessionalId,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        status: 'PENDING',
        totalPrice: Number(selectedNewService.price),
        items: [{
          serviceId: selectedNewService.id,
          durationMinutes: selectedNewService.duration,
          unitPrice: selectedNewService.price,
          totalPrice: selectedNewService.price,
        }],
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedSteps = stepStates.filter((s) => s.done).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="mx-4 max-h-[92vh] overflow-y-auto sm:mx-auto sm:max-w-[96vw] lg:max-w-[94vw] xl:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Monte o atendimento por etapas e selecione o melhor horário disponível.
            </DialogDescription>
          </DialogHeader>

          {/* Progress steps */}
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium">Fluxo guiado</p>
                <p className="text-xs text-muted-foreground">
                  Cada etapa libera a seguinte. Conclusão atual: {completedSteps}/{stepStates.length}.
                </p>
              </div>
              <Badge variant={canSubmit ? 'default' : 'secondary'}>
                {canSubmit ? 'Pronto para criar' : 'Preencha as etapas'}
              </Badge>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-5">
              {stepStates.map((step) => (
                <div
                  key={step.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    step.done ? 'border-primary/30 bg-primary/5' : step.active ? 'border-amber-300 bg-amber-50' : 'bg-background'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : step.active ? (
                      <Circle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{step.number}. {step.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 py-4 lg:grid-cols-2 lg:items-start">
            {/* Step 1 — Cliente */}
            <div className={`space-y-3 rounded-xl border p-4 ${selectedNewClient ? 'border-primary/30 bg-primary/[0.03]' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapa 1</p>
                  <Label className="text-sm">Cliente</Label>
                </div>
                {selectedNewClient && (
                  <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setIsNewClientDialogOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" /> Novo cliente
                  </Button>
                )}
              </div>
              <div className="space-y-3 rounded-lg border border-dashed p-3">
                <Input
                  placeholder="Pesquisar cliente por nome, telefone ou email"
                  value={newClientSearch}
                  onChange={(e) => setNewClientSearch(e.target.value)}
                />
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {filteredClients.length ? (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className={`w-full rounded-md border p-3 text-left transition-colors ${
                          newClientId === client.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                        }`}
                        onClick={() => setNewClientId(client.id)}
                      >
                        <p className="truncate text-sm font-medium">{client.name}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {[client.phone, client.email].filter(Boolean).join(' - ') || 'Sem contato cadastrado'}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="space-y-2 rounded-md border p-3 text-sm">
                      <p>Nenhum cliente encontrado.</p>
                      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setIsNewClientDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Cadastrar novo cliente
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {!selectedNewClient ? (
                <Button type="button" variant="secondary" className="w-full" onClick={() => setIsNewClientDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Cliente não encontrado? Cadastrar agora
                </Button>
              ) : (
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/15 text-primary">
                        {selectedNewClient.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{selectedNewClient.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[selectedNewClient.phone, selectedNewClient.email].filter(Boolean).join(' - ') || 'Sem contato cadastrado'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 — Serviço */}
            <div className={`space-y-3 rounded-xl border p-4 lg:row-span-2 ${canChooseService ? '' : 'opacity-60'} ${selectedNewService ? 'border-primary/30 bg-primary/[0.03]' : ''}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapa 2</p>
                <Label className="text-sm">Serviço</Label>
                <p className="text-xs text-muted-foreground">
                  {canChooseService
                    ? 'Selecione um serviço para filtrar os profissionais compatíveis.'
                    : 'Primeiro selecione ou cadastre um cliente.'}
                </p>
              </div>
              <div className={`max-h-56 space-y-2 overflow-y-auto rounded-md border p-3 ${canChooseService ? '' : 'pointer-events-none bg-muted/20'}`}>
                {activeServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                      newServiceId === service.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                    }`}
                    onClick={() => setNewServiceId(newServiceId === service.id ? '' : service.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-sm text-primary">{formatCurrency(service.price)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{service.category}</span>
                        <span>{service.duration} min</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {selectedNewService && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Serviço selecionado</span>
                    <span className="font-medium">{selectedNewService.name}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">Duração</span>
                    <span>{selectedNewService.duration} min</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-medium text-primary">{formatCurrency(Number(selectedNewService.price))}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 — Profissional */}
            <div className={`space-y-3 rounded-xl border p-4 ${canChooseProfessional ? '' : 'opacity-60'} ${isEffectiveProfessionalValid ? 'border-primary/30 bg-primary/[0.03]' : ''}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapa 3</p>
                <Label className="text-sm">Profissional</Label>
                <p className="text-xs text-muted-foreground">
                  {!canChooseProfessional
                    ? 'A seleção do profissional depende do serviço escolhido.'
                    : !hasProfessionalsForSelectedService
                    ? 'Sem profissional atuando neste serviço.'
                    : 'Agora escolha quem executará esse serviço.'}
                </p>
              </div>
              <Select
                value={effectiveProfessionalId}
                onValueChange={setNewProfessionalId}
                disabled={isProfessionalUser || !canChooseProfessional || !hasProfessionalsForSelectedService}
              >
                <SelectTrigger>
                  <SelectValue placeholder={hasProfessionalsForSelectedService ? 'Selecione o profissional' : 'Sem profissional atuando neste serviço'} />
                </SelectTrigger>
                <SelectContent>
                  {availableNewProfessionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canChooseProfessional && !hasProfessionalsForSelectedService && (
                <p className="text-sm text-amber-700">Sem profissional atuando neste serviço. Ajuste o cadastro do serviço ou escolha outro.</p>
              )}
            </div>

            {/* Step 4 — Data */}
            <div className={`space-y-3 rounded-xl border p-4 ${canChooseDate ? 'border-primary/30 bg-primary/[0.03]' : 'opacity-60'}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapa 4</p>
                <Label className="text-sm">Data</Label>
                <p className="text-xs text-muted-foreground">
                  {canChooseDate
                    ? 'Defina a data para consultar os horários disponíveis.'
                    : 'A data só fica disponível depois da escolha do profissional.'}
                </p>
              </div>
              <Input
                type="date"
                value={newDate}
                disabled={!canChooseDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>

            {/* Step 5 — Horário */}
            <div className={`space-y-3 rounded-xl border p-4 lg:col-span-2 ${canChooseSlot ? '' : 'opacity-60'} ${newStartTime ? 'border-primary/30 bg-primary/[0.03]' : ''}`}>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapa 5</p>
                  <p className="text-sm font-medium">Horários sugeridos</p>
                  <p className="text-xs text-muted-foreground">
                    {canChooseSlot
                      ? 'Escolha um horário depois de definir serviço, profissional e data.'
                      : 'Os horários aparecem quando cliente, serviço, profissional e data estiverem definidos.'}
                  </p>
                </div>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm lg:min-w-72">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="text-right font-medium">{selectedNewClient?.name || 'Não selecionado'}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Serviço</span>
                    <span className="font-medium">{selectedNewService?.name || 'Não selecionado'}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">{Number(selectedNewService?.duration || 0)} min</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-medium text-primary">{formatCurrency(Number(selectedNewService?.price || 0))}</span>
                  </div>
                </div>
              </div>
              <AvailableSlotsList
                slots={slots}
                isLoading={isLoadingSlots}
                error={slotsError}
                canFetch={canFetch}
                selectedStartTime={newStartTime}
                onSelect={(slot) => { setNewStartTime(slot.startTime); setNewEndTime(slot.endTime); }}
              />
              {newStartTime && newEndTime && (
                <p className="text-xs text-muted-foreground">Selecionado: {newStartTime} - {newEndTime}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit} isLoading={isSubmitting} loadingText="Criando...">
              Criar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClientUpsertDialog
        open={isNewClientDialogOpen}
        onOpenChange={setIsNewClientDialogOpen}
        onSubmit={(payload) => createClient(payload)}
        onSubmitted={(client) => {
          if (client?.id) {
            setNewClientId(client.id);
            setNewClientSearch(client.name || '');
          }
        }}
      />
    </>
  );
}
