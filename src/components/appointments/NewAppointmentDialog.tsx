import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { ClientUpsertDialog } from '@/components/clients/ClientUpsertDialog';
import { AvailableSlotsList } from '@/components/appointments/AvailableSlotsList';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { resolveUiError } from '@/lib/error-utils';
import { formatCurrency, toDateKey } from '@/lib/format';
import { appointmentsApi, type Professional } from '@/lib/api';
import type { AppointmentConflictDetails, AppointmentConflictSummary, AppointmentSchedulingSettings } from '@/types/available-slots';

type CreateAppointmentPayload = {
  clientId: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING';
  totalPrice: number;
  items: Array<{ serviceId: string; durationMinutes: number; unitPrice: number; totalPrice: number }>;
  origin?: string;
  allowConflict?: boolean;
  conflictAcknowledged?: boolean;
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

const stepItems = [
  { number: 1, title: 'Cliente' },
  { number: 2, title: 'Servico' },
  { number: 3, title: 'Profissional' },
  { number: 4, title: 'Data e horario' },
  { number: 5, title: 'Revisao' },
] as const;

const serviceHasAssignedProfessionals = (professionalIds?: string[] | null) =>
  Array.isArray(professionalIds) && professionalIds.length > 0;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const calculateEndTime = (startTime: string, durationMinutes: number) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || durationMinutes <= 0) return '';
  const totalMinutes = (hours * 60) + minutes + durationMinutes;
  const normalizedHours = Math.floor(totalMinutes / 60) % 24;
  const normalizedMinutes = totalMinutes % 60;
  return `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`;
};

const extractConflictDetails = (value: unknown): AppointmentConflictDetails | null => {
  if (!isObject(value)) return null;
  const candidate = isObject(value.details) ? value.details : value;
  if (!isObject(candidate)) return null;
  return {
    requestedDate: typeof candidate.requestedDate === 'string' ? candidate.requestedDate : undefined,
    requestedStartTime: typeof candidate.requestedStartTime === 'string' ? candidate.requestedStartTime : undefined,
    requestedEndTime: typeof candidate.requestedEndTime === 'string' ? candidate.requestedEndTime : undefined,
    origin: typeof candidate.origin === 'string' ? candidate.origin : undefined,
    canOverride: typeof candidate.canOverride === 'boolean' ? candidate.canOverride : undefined,
    allowConflictingAppointmentsOnManualScheduling:
      typeof candidate.allowConflictingAppointmentsOnManualScheduling === 'boolean'
        ? candidate.allowConflictingAppointmentsOnManualScheduling
        : undefined,
    conflicts: Array.isArray(candidate.conflicts) ? (candidate.conflicts as AppointmentConflictSummary[]) : [],
  };
};

const buildConflictDetailsFromSlot = (
  slot: { startTime: string; endTime: string; conflicts?: AppointmentConflictSummary[] },
  date: string,
): AppointmentConflictDetails => ({
  requestedDate: date,
  requestedStartTime: String(slot.startTime).slice(0, 5),
  requestedEndTime: String(slot.endTime).slice(0, 5),
  canOverride: true,
  allowConflictingAppointmentsOnManualScheduling: true,
  conflicts: slot.conflicts || [],
});

const getConflictBlockedMessage = (details: AppointmentConflictDetails | null) => {
  if (!details) {
    return 'Este estabelecimento nao permite criar agendamento em horario ja ocupado para o mesmo profissional.';
  }
  return details.allowConflictingAppointmentsOnManualScheduling === false
    ? 'Este estabelecimento esta com o conflito manual desativado. Ajuste a configuracao da agenda para permitir agendamento em horario ja ocupado.'
    : 'Este horario nao pode ser assumido manualmente na configuracao atual do estabelecimento.';
};

export function NewAppointmentDialog({
  open,
  onOpenChange,
  currentDate,
  isProfessionalUser,
  loggedProfessional,
  activeProfessionals,
  createAppointment,
}: NewAppointmentDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [newClientId, setNewClientId] = useState('');
  const [newClientSearch, setNewClientSearch] = useState('');
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [newProfessionalId, setNewProfessionalId] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  const [newDate, setNewDate] = useState(toDateKey(currentDate));
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [slotMode, setSlotMode] = useState<'suggested' | 'manual'>('suggested');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointmentSettings, setAppointmentSettings] = useState<AppointmentSchedulingSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [pendingConflictPayload, setPendingConflictPayload] = useState<CreateAppointmentPayload | null>(null);
  const [conflictDetails, setConflictDetails] = useState<AppointmentConflictDetails | null>(null);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

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
  const selectedProfessional = useMemo(
    () => activeProfessionals.find((professional) => professional.id === effectiveProfessionalId) ?? null,
    [activeProfessionals, effectiveProfessionalId],
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
  const selectedServiceDuration = Number(selectedNewService?.duration || 0);

  const { slots, isLoading: isLoadingSlots, error: slotsError, canFetch } = useAvailableSlots({
    professionalId: effectiveProfessionalId || undefined,
    date: newDate || undefined,
    serviceIds: selectedServiceIds,
    serviceDurationMinutes: selectedServiceDuration,
    bufferMinutes: 0,
    mode: 'manual',
  });
  const selectedSlot = useMemo(
    () =>
      slots.find(
        (slot) => String(slot.startTime).slice(0, 5) === newStartTime && String(slot.endTime).slice(0, 5) === newEndTime,
      ) ?? null,
    [newEndTime, newStartTime, slots],
  );
  const allowManualConflict = Boolean(appointmentSettings?.allowConflictingAppointmentsOnManualScheduling);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setCurrentStep(1);
    setIsLoadingSettings(true);
    appointmentsApi
      .getSettings()
      .then((response) => {
        if (active) setAppointmentSettings(response);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(resolveUiError(error, 'Nao foi possivel carregar a configuracao da agenda.').message);
      })
      .finally(() => {
        if (active) setIsLoadingSettings(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

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

  useEffect(() => {
    if (!selectedNewClient && currentStep > 1) {
      setCurrentStep(1);
      return;
    }
    if (!selectedNewService && currentStep > 2) {
      setCurrentStep(2);
      return;
    }
    if (!isEffectiveProfessionalValid && currentStep > 3) {
      setCurrentStep(3);
      return;
    }
    if ((!newDate || !newStartTime || !newEndTime) && currentStep > 4) {
      setCurrentStep(4);
    }
  }, [
    currentStep,
    isEffectiveProfessionalValid,
    newDate,
    newEndTime,
    newStartTime,
    selectedNewClient,
    selectedNewService,
  ]);

  const resetForm = () => {
    setCurrentStep(1);
    setNewClientId('');
    setNewClientSearch('');
    setNewProfessionalId(isProfessionalUser && loggedProfessional?.id ? loggedProfessional.id : '');
    setNewServiceId('');
    setNewStartTime('');
    setNewEndTime('');
    setSlotMode('suggested');
    setPendingConflictPayload(null);
    setConflictDetails(null);
    setIsConflictDialogOpen(false);
  };

  const applyStartTime = (value: string) => {
    const normalized = value.slice(0, 5);
    setNewStartTime(normalized);
    setNewEndTime(calculateEndTime(normalized, selectedServiceDuration));
  };

  const buildPayload = (overrideConflict = false): CreateAppointmentPayload | null => {
    if (!selectedNewService || !effectiveProfessionalId) return null;
    return {
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
      origin: 'INTERNAL_MANUAL',
      allowConflict: overrideConflict,
      conflictAcknowledged: overrideConflict,
    };
  };

  const closeDialog = () => {
    onOpenChange(false);
    resetForm();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedNewClient;
      case 2:
        return !!selectedNewService;
      case 3:
        return isEffectiveProfessionalValid;
      case 4:
        return !!newDate && !!newStartTime && !!newEndTime;
      case 5:
        return canSubmit;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (!canProceed() || currentStep >= stepItems.length) return;
    setCurrentStep((value) => value + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep((value) => Math.max(1, value - 1));
  };

  const handleSubmitPayload = async (payload: CreateAppointmentPayload) => {
    setIsSubmitting(true);
    try {
      await createAppointment(payload);
      closeDialog();
    } catch (error) {
      const uiError = resolveUiError(error, 'Nao foi possivel criar o agendamento.');
      if (String(uiError.code || '').toUpperCase() === 'APPOINTMENT_CONFLICT') {
        const details = extractConflictDetails(uiError.details);
        if (details?.canOverride && !payload.allowConflict) {
          setPendingConflictPayload(payload);
          setConflictDetails(details);
          setIsConflictDialogOpen(true);
          return;
        }
        toast.error(details?.canOverride ? uiError.message : getConflictBlockedMessage(details));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !canSubmit) return;
    const payload = buildPayload(false);
    if (!payload) return;
    if (selectedSlot?.conflicting && allowManualConflict) {
      setPendingConflictPayload(payload);
      setConflictDetails(buildConflictDetailsFromSlot({
        startTime: String(selectedSlot.startTime),
        endTime: String(selectedSlot.endTime),
        conflicts: selectedSlot.conflicts,
      }, newDate));
      setIsConflictDialogOpen(true);
      return;
    }
    await handleSubmitPayload(payload);
  };

  const handleConfirmConflict = async () => {
    if (!pendingConflictPayload) return;
    await handleSubmitPayload({
      ...pendingConflictPayload,
      allowConflict: true,
      conflictAcknowledged: true,
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) resetForm();
        }}
      >
        <DialogContent className="mx-4 max-h-[92vh] overflow-y-auto sm:mx-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Siga as etapas para montar o atendimento interno com o mesmo fluxo guiado do agendamento publico.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {stepItems.map((step) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors sm:h-9 sm:w-9 sm:text-sm ${
                    currentStep >= step.number
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
                </div>
                {step.number < stepItems.length && (
                  <div
                    className={`mx-1 h-1 w-5 rounded sm:mx-2 sm:w-10 ${
                      currentStep > step.number ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4 py-4">
            {/* Step 1 — Cliente */}
            <div className={`${currentStep === 1 ? '' : 'hidden '}space-y-3 rounded-xl border p-4 ${selectedNewClient ? 'border-primary/30 bg-primary/[0.03]' : ''}`}>
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
            <div className={`${currentStep === 2 ? '' : 'hidden '}space-y-3 rounded-xl border p-4 ${selectedNewService ? 'border-primary/30 bg-primary/[0.03]' : ''}`}>
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
            <div className={`${currentStep === 3 ? '' : 'hidden '}space-y-3 rounded-xl border p-4 ${isEffectiveProfessionalValid ? 'border-primary/30 bg-primary/[0.03]' : ''}`}>
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
            <div className={`${currentStep === 4 ? '' : 'hidden '}space-y-3 rounded-xl border p-4 ${canChooseDate ? 'border-primary/30 bg-primary/[0.03]' : 'opacity-60'}`}>
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
            <div className={`${currentStep === 4 ? '' : 'hidden '}space-y-4 rounded-xl border p-4 ${canChooseSlot ? '' : 'opacity-60'} ${newStartTime ? 'border-primary/30 bg-primary/[0.03]' : ''}`}>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapa 5</p>
                  <p className="text-sm font-medium">Horários e inserção manual</p>
                  <p className="text-xs text-muted-foreground">
                    {canChooseSlot
                      ? 'Veja horários vagos, identifique conflitos em vermelho e digite o horário quando precisar.'
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
                    <span className="font-medium">{selectedServiceDuration} min</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-medium text-primary">{formatCurrency(Number(selectedNewService?.price || 0))}</span>
                  </div>
                </div>
              </div>

              {isLoadingSettings ? (
                <p className="text-xs text-muted-foreground">Carregando política de conflito da agenda...</p>
              ) : allowManualConflict ? (
                <Alert className="border-red-200 bg-red-50 text-red-950">
                  <AlertTitle>Conflito manual permitido neste estabelecimento</AlertTitle>
                  <AlertDescription>
                    Os horários vagos continuam como referência principal. Horários em conflito aparecem em vermelho e exigem confirmação explícita antes da criação.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTitle>Agenda interna em modo estrito</AlertTitle>
                  <AlertDescription>
                    Os horários vagos continuam visíveis normalmente. Horários em conflito não podem ser assumidos neste estabelecimento.
                  </AlertDescription>
                </Alert>
              )}

              <Tabs value={slotMode} onValueChange={(value) => setSlotMode(value as 'suggested' | 'manual')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="suggested">Sugestões</TabsTrigger>
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                </TabsList>

                <TabsContent value="suggested" className="space-y-3">
                  <AvailableSlotsList
                    slots={slots}
                    isLoading={isLoadingSlots}
                    error={slotsError}
                    canFetch={canFetch}
                    selectedStartTime={newStartTime}
                    onSelect={(slot) => {
                      setSlotMode('suggested');
                      applyStartTime(String(slot.startTime).slice(0, 5));
                    }}
                  />
                </TabsContent>

                <TabsContent value="manual" className="space-y-3">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Horário manual</p>
                        <p className="text-xs text-muted-foreground">
                          Digite o horário inicial. O horário final será calculado automaticamente.
                        </p>
                      </div>
                      <Badge variant="outline">Entrada direta</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="manual-start-time">Horário inicial</Label>
                        <Input
                          id="manual-start-time"
                          type="time"
                          step={300}
                          value={newStartTime}
                          disabled={!canChooseSlot}
                          onChange={(e) => {
                            setSlotMode('manual');
                            applyStartTime(e.target.value);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-end-time">Horário final</Label>
                        <Input id="manual-end-time" type="time" value={newEndTime} disabled />
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Se o horário digitado conflitar com outro atendimento e a configuração do estabelecimento permitir, o sistema vai pedir confirmação antes de salvar.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {selectedSlot?.conflicting ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Horário em conflito com {selectedSlot.conflicts?.length || 1} atendimento(s). A criação exigirá confirmação explícita.
                </div>
              ) : null}

              {newStartTime && newEndTime && (
                <p className="text-xs text-muted-foreground">Selecionado: {newStartTime} - {newEndTime}</p>
              )}
            </div>
          </div>

            {currentStep === 5 && (
              <div className="space-y-4 rounded-xl border p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapa 5</p>
                  <p className="text-lg font-semibold">Revise antes de criar</p>
                  <p className="text-sm text-muted-foreground">Confira os dados principais do atendimento antes da confirmacao final.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</p>
                    <p className="mt-2 font-medium">{selectedNewClient?.name || 'Nao selecionado'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[selectedNewClient?.phone, selectedNewClient?.email].filter(Boolean).join(' - ') || 'Sem contato cadastrado'}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Servico</p>
                    <p className="mt-2 font-medium">{selectedNewService?.name || 'Nao selecionado'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedServiceDuration} min � {formatCurrency(Number(selectedNewService?.price || 0))}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profissional</p>
                    <p className="mt-2 font-medium">{selectedProfessional?.name || 'Nao selecionado'}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agenda</p>
                    <p className="mt-2 font-medium">{newDate || 'Data nao informada'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {newStartTime && newEndTime ? `${newStartTime} - ${newEndTime}` : 'Horario nao informado'}
                    </p>
                  </div>
                </div>
                {selectedSlot?.conflicting && allowManualConflict && (
                  <Alert className="border-red-200 bg-red-50 text-red-950">
                    <AlertTitle>Horario com sobreposicao assumida manualmente</AlertTitle>
                    <AlertDescription>
                      Este horario ja possui atendimento para o mesmo profissional. Ao confirmar, o sistema ainda exigira sua confirmacao explicita.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePreviousStep}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar
                </Button>
              )}
            </div>
            {currentStep < stepItems.length ? (
              <Button onClick={handleNextStep} disabled={!canProceed()}>
                Continuar
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Criar agendamento
                  </>
                )}
              </Button>
            )}
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

      <ConfirmationDialog
        open={isConflictDialogOpen}
        onOpenChange={setIsConflictDialogOpen}
        title="Confirmar conflito de horário?"
        description="Este horário já possui atendimento para o mesmo profissional. A decisão de assumir a sobreposição ficará registrada na auditoria."
        confirmLabel="Criar mesmo assim"
        loadingLabel="Criando..."
        isLoading={isSubmitting}
        confirmClassName="bg-red-600 hover:bg-red-700"
        onConfirm={handleConfirmConflict}
      >
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-900">
            Solicitação: {conflictDetails?.requestedDate || newDate} {conflictDetails?.requestedStartTime || newStartTime} - {conflictDetails?.requestedEndTime || newEndTime}
          </div>
          <div className="space-y-2">
            <p className="font-medium">Conflitos identificados</p>
            {(conflictDetails?.conflicts || []).map((conflict, index) => (
              <div key={`${conflict.appointmentId || index}`} className="rounded-md border p-3">
                <p className="font-medium">
                  {conflict.startTime} - {conflict.endTime}
                </p>
                <p className="text-muted-foreground">
                  {[conflict.clientName, conflict.serviceName, conflict.status].filter(Boolean).join(' - ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ConfirmationDialog>
    </>
  );
}






