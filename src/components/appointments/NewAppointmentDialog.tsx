import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { ClientUpsertDialog } from '@/components/clients/ClientUpsertDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { NewAppointmentDialogFlow } from '@/components/appointments/NewAppointmentDialogFlow';
import {
  buildConflictDetailsFromSlot,
  calculateEndTime,
  extractConflictDetails,
  getConflictBlockedMessage,
  serviceHasAssignedProfessionals,
  stepItems,
  type CreateAppointmentPayload,
  type NewAppointmentDialogProps,
} from '@/components/appointments/newAppointmentDialog.shared';
import { resolveUiError } from '@/lib/error-utils';
import { toDateKey } from '@/lib/format';
import { appointmentsApi } from '@/lib/api';
import type {
  AppointmentConflictDetails,
  AppointmentSchedulingSettings,
} from '@/types/available-slots';

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
  const [appointmentSettings, setAppointmentSettings] =
    useState<AppointmentSchedulingSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [pendingConflictPayload, setPendingConflictPayload] =
    useState<CreateAppointmentPayload | null>(null);
  const [conflictDetails, setConflictDetails] =
    useState<AppointmentConflictDetails | null>(null);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  const { clients, createClient } = useClients({ enabled: open });
  const { services } = useServices({ enabled: open });

  const activeServicesCatalog = useMemo(
    () => services.filter((service) => service.isActive),
    [services],
  );

  const effectiveProfessionalId = isProfessionalUser
    ? loggedProfessional?.id ?? newProfessionalId
    : newProfessionalId;

  const availableNewProfessionals = useMemo(() => {
    if (!newServiceId) return activeProfessionals;

    return activeProfessionals.filter((professional) =>
      activeServicesCatalog.some(
        (service) =>
          service.id === newServiceId &&
          serviceHasAssignedProfessionals(service.professionalIds) &&
          service.professionalIds.includes(professional.id),
      ),
    );
  }, [activeProfessionals, activeServicesCatalog, newServiceId]);

  const activeServices = useMemo(
    () =>
      activeServicesCatalog.filter((service) => {
        if (!effectiveProfessionalId) return true;

        return (
          serviceHasAssignedProfessionals(service.professionalIds) &&
          service.professionalIds.includes(effectiveProfessionalId)
        );
      }),
    [activeServicesCatalog, effectiveProfessionalId],
  );

  const selectedNewClient = useMemo(
    () => clients.find((client) => client.id === newClientId) ?? null,
    [clients, newClientId],
  );

  const selectedNewService = useMemo(
    () => activeServicesCatalog.find((service) => service.id === newServiceId) ?? null,
    [activeServicesCatalog, newServiceId],
  );

  const selectedProfessional = useMemo(
    () =>
      activeProfessionals.find(
        (professional) => professional.id === effectiveProfessionalId,
      ) ?? null,
    [activeProfessionals, effectiveProfessionalId],
  );

  const filteredClients = useMemo(() => {
    const query = newClientSearch.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((client) =>
      [client.name, client.phone, client.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [clients, newClientSearch]);

  const hasProfessionalsForSelectedService =
    !selectedNewService || availableNewProfessionals.length > 0;

  const isEffectiveProfessionalValid =
    !!effectiveProfessionalId &&
    availableNewProfessionals.some(
      (professional) => professional.id === effectiveProfessionalId,
    );

  const canChooseService = !!selectedNewClient;
  const canChooseProfessional = !!selectedNewService;
  const canChooseDate =
    !!selectedNewService &&
    hasProfessionalsForSelectedService &&
    isEffectiveProfessionalValid;
  const canChooseSlot = canChooseDate && !!newDate;
  const canSubmit =
    !!newClientId &&
    !!newServiceId &&
    isEffectiveProfessionalValid &&
    !!newDate &&
    !!newStartTime &&
    !!newEndTime;

  const selectedServiceIds = useMemo(
    () => (newServiceId ? [newServiceId] : []),
    [newServiceId],
  );
  const selectedServiceDuration = Number(selectedNewService?.duration || 0);

  const {
    slots,
    isLoading: isLoadingSlots,
    error: slotsError,
    canFetch,
  } = useAvailableSlots({
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
        (slot) =>
          String(slot.startTime).slice(0, 5) === newStartTime &&
          String(slot.endTime).slice(0, 5) === newEndTime,
      ) ?? null,
    [newEndTime, newStartTime, slots],
  );

  const allowManualConflict = Boolean(
    appointmentSettings?.allowConflictingAppointmentsOnManualScheduling,
  );

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
        toast.error(
          resolveUiError(
            error,
            'Nao foi possivel carregar a configuracao da agenda.',
          ).message,
        );
      })
      .finally(() => {
        if (active) setIsLoadingSettings(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    setNewStartTime('');
    setNewEndTime('');
  }, [newDate, newProfessionalId, newServiceId]);

  useEffect(() => {
    setNewDate(toDateKey(currentDate));
  }, [currentDate]);

  useEffect(() => {
    if (!newServiceId) return;
    if (!activeServices.some((service) => service.id === newServiceId)) {
      setNewServiceId('');
    }
  }, [activeServices, newServiceId]);

  useEffect(() => {
    if (isProfessionalUser || !newProfessionalId) return;
    if (
      !availableNewProfessionals.some(
        (professional) => professional.id === newProfessionalId,
      )
    ) {
      setNewProfessionalId('');
    }
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
    setNewProfessionalId(
      isProfessionalUser && loggedProfessional?.id ? loggedProfessional.id : '',
    );
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

  const buildPayload = (
    overrideConflict = false,
  ): CreateAppointmentPayload | null => {
    if (!selectedNewService || !effectiveProfessionalId) return null;

    return {
      clientId: newClientId,
      professionalId: effectiveProfessionalId,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      status: 'PENDING',
      totalPrice: Number(selectedNewService.price),
      items: [
        {
          serviceId: selectedNewService.id,
          durationMinutes: selectedNewService.duration,
          unitPrice: selectedNewService.price,
          totalPrice: selectedNewService.price,
        },
      ],
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
      const uiError = resolveUiError(
        error,
        'Nao foi possivel criar o agendamento.',
      );

      if (String(uiError.code || '').toUpperCase() === 'APPOINTMENT_CONFLICT') {
        const details = extractConflictDetails(uiError.details);
        if (details?.canOverride && !payload.allowConflict) {
          setPendingConflictPayload(payload);
          setConflictDetails(details);
          setIsConflictDialogOpen(true);
          return;
        }
        toast.error(
          details?.canOverride
            ? uiError.message
            : getConflictBlockedMessage(details),
        );
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
      setConflictDetails(
        buildConflictDetailsFromSlot(
          {
            startTime: String(selectedSlot.startTime),
            endTime: String(selectedSlot.endTime),
            conflicts: selectedSlot.conflicts,
          },
          newDate,
        ),
      );
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
              Siga as etapas para montar o atendimento interno com o mesmo fluxo
              guiado do agendamento publico.
            </DialogDescription>
          </DialogHeader>

          <NewAppointmentDialogFlow
            currentStep={currentStep}
            selectedNewClient={selectedNewClient}
            selectedNewService={selectedNewService}
            selectedProfessional={selectedProfessional}
            newClientId={newClientId}
            newClientSearch={newClientSearch}
            newServiceId={newServiceId}
            newDate={newDate}
            newStartTime={newStartTime}
            newEndTime={newEndTime}
            effectiveProfessionalId={effectiveProfessionalId}
            isProfessionalUser={isProfessionalUser}
            slotMode={slotMode}
            isLoadingSettings={isLoadingSettings}
            allowManualConflict={allowManualConflict}
            filteredClients={filteredClients}
            activeServices={activeServices}
            availableNewProfessionals={availableNewProfessionals}
            selectedSlot={selectedSlot}
            slots={slots}
            isLoadingSlots={isLoadingSlots}
            slotsError={slotsError}
            canFetch={canFetch}
            hasProfessionalsForSelectedService={hasProfessionalsForSelectedService}
            isEffectiveProfessionalValid={isEffectiveProfessionalValid}
            canChooseService={canChooseService}
            canChooseProfessional={canChooseProfessional}
            canChooseDate={canChooseDate}
            canChooseSlot={canChooseSlot}
            selectedServiceDuration={selectedServiceDuration}
            onOpenNewClientDialog={() => setIsNewClientDialogOpen(true)}
            onClientSearchChange={setNewClientSearch}
            onClientSelect={setNewClientId}
            onServiceSelect={(serviceId) =>
              setNewServiceId(newServiceId === serviceId ? '' : serviceId)
            }
            onProfessionalChange={setNewProfessionalId}
            onDateChange={setNewDate}
            onSlotModeChange={setSlotMode}
            onSuggestedSlotSelect={(slot) => {
              setSlotMode('suggested');
              applyStartTime(String(slot.startTime).slice(0, 5));
            }}
            onManualStartTimeChange={(value) => {
              setSlotMode('manual');
              applyStartTime(value);
            }}
          />

          <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handlePreviousStep}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar
                </Button>
              ) : null}
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
        title="Confirmar conflito de horario?"
        description="Este horario ja possui atendimento para o mesmo profissional. A decisao de assumir a sobreposicao ficara registrada na auditoria."
        confirmLabel="Criar mesmo assim"
        loadingLabel="Criando..."
        isLoading={isSubmitting}
        confirmClassName="bg-red-600 hover:bg-red-700"
        onConfirm={handleConfirmConflict}
      >
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-900">
            Solicitacao: {conflictDetails?.requestedDate || newDate}{' '}
            {conflictDetails?.requestedStartTime || newStartTime} -{' '}
            {conflictDetails?.requestedEndTime || newEndTime}
          </div>
          <div className="space-y-2">
            <p className="font-medium">Conflitos identificados</p>
            {(conflictDetails?.conflicts || []).map((conflict, index) => (
              <div
                key={`${conflict.appointmentId || index}`}
                className="rounded-md border p-3"
              >
                <p className="font-medium">
                  {conflict.startTime} - {conflict.endTime}
                </p>
                <p className="text-muted-foreground">
                  {[conflict.clientName, conflict.serviceName, conflict.status]
                    .filter(Boolean)
                    .join(' - ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ConfirmationDialog>
    </>
  );
}
