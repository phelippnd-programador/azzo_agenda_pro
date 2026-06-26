import { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Info,
  Loader2,
  Mail,
  Phone,
  Receipt,
  Scissors,
  Trash2,
  User,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { appointmentsApi, clientsApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { formatCurrency, toDateKey } from '@/lib/format';
import {
  appointmentStatusBadgeToneMap,
  appointmentStatusLabelMap,
  getAppointmentItems,
  getServiceFlowMeta,
} from '@/lib/appointment-status';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import type { Appointment } from '@/hooks/useAppointments';
import type {
  AppointmentCustomerNote,
  Client,
  ClientAppointmentHistoryItem,
  Professional,
  Service,
} from '@/types';

interface AppointmentDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  professionals: Professional[];
  services: Service[];
  clients: Client[];
  isProfessionalUser: boolean;
  canReassignAppointments: boolean;
  onStatusChange: (id: string, status: Appointment['status']) => Promise<void>;
  onDeleteRequest: (id: string) => void;
  onReassignRequest: (appointment: Appointment) => void;
  onViewInvoice: (appointment: Appointment) => void;
  onEditSuccess?: () => void;
}

export function AppointmentDetailsSheet({
  open,
  onOpenChange,
  appointment,
  professionals,
  services,
  clients,
  isProfessionalUser,
  canReassignAppointments,
  onStatusChange,
  onDeleteRequest,
  onReassignRequest,
  onViewInvoice,
  onEditSuccess,
}: AppointmentDetailsSheetProps) {
  const [historyItem, setHistoryItem] =
    useState<ClientAppointmentHistoryItem | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNoShowDialogOpen, setIsNoShowDialogOpen] = useState(false);
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [serviceExecutionNotes, setServiceExecutionNotes] = useState('');
  const [clientFeedbackNotes, setClientFeedbackNotes] = useState('');
  const [internalFollowupNotes, setInternalFollowupNotes] = useState('');

  const resetForm = () => {
    setServiceExecutionNotes('');
    setClientFeedbackNotes('');
    setInternalFollowupNotes('');
  };

  const selectedClient =
    appointment?.client ??
    clients.find((client) => client.id === appointment?.clientId) ??
    null;

  const selectedProfessional = appointment
    ? professionals.find(
        (professional) => professional.id === appointment.professionalId,
      ) ?? null
    : null;

  const appointmentItems = appointment ? getAppointmentItems(appointment) : [];

  const appointmentItemsWithService = appointmentItems.map((item) => ({
    item,
    service:
      item.service ??
      services.find((service) => service.id === item.serviceId) ??
      null,
  }));

  const totalPrice = appointment
    ? Number(
        appointment.totalPrice ||
          appointmentItems.reduce(
            (sum, item) => sum + Number(item.totalPrice || 0),
            0,
          ),
      )
    : 0;

  const totalGrossPrice = appointment
    ? appointmentItems.reduce(
        (sum, item) => sum + Number(item.grossAmount ?? item.totalPrice ?? 0),
        0,
      )
    : 0;

  const totalDiscountPrice = appointment
    ? appointmentItems.reduce(
        (sum, item) => sum + Number(item.discountAmount ?? 0),
        0,
      )
    : 0;

  const flowMeta = appointment ? getServiceFlowMeta(appointment.status) : null;

  const appointmentHasPassedByMinutes = (apt: typeof appointment, minutes: number): boolean => {
    if (!apt) return false;
    const dateKey = toDateKey(apt.date);
    const [h, m] = apt.startTime.split(':').map(Number);
    const aptDate = new Date(`${dateKey}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    return Date.now() - aptDate.getTime() >= minutes * 60 * 1000;
  };

  const showNoShowButton =
    !!appointment &&
    ['PENDING', 'CONFIRMED'].includes(appointment.status) &&
    appointmentHasPassedByMinutes(appointment, 5);

  const handleMarkNoShow = async () => {
    if (!appointment) return;
    setIsMarkingNoShow(true);
    try {
      await appointmentsApi.markAttendance(appointment.id, false);
      toast.success('Agendamento marcado como nao compareceu.');
      onStatusChange(appointment.id, 'NO_SHOW');
      setIsNoShowDialogOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(resolveUiError(error, 'Nao foi possivel registrar o nao comparecimento.').message);
    } finally {
      setIsMarkingNoShow(false);
    }
  };
  const careNotes = historyItem?.careNotes ?? [];
  const canRegisterNotes =
    !!appointment && !['CANCELLED', 'NO_SHOW'].includes(appointment.status);

  useEffect(() => {
    if (!open || !appointment || !selectedClient?.id) {
      setHistoryItem(null);
      resetForm();
      return;
    }

    let active = true;
    setIsLoadingHistory(true);

    clientsApi
      .getAppointmentHistory(selectedClient.id, 0, 50)
      .then((history) => {
        if (!active) return;
        const matchedItem =
          history.items.find((item) => item.appointmentId === appointment.id) ??
          null;
        setHistoryItem(matchedItem);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(
          resolveUiError(
            error,
            'Nao foi possivel carregar o historico deste cliente.',
          ).message,
        );
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [appointment, open, selectedClient?.id]);

  const handleDeleteNote = async (noteId: string) => {
    if (!appointment) return;
    setIsDeletingNote(noteId);
    try {
      await appointmentsApi.deleteCustomerNote(appointment.id, noteId);
      setHistoryItem((previous) =>
        previous
          ? { ...previous, careNotes: (previous.careNotes || []).filter((n) => n.noteId !== noteId) }
          : previous
      );
      toast.success('Registro operacional removido.');
    } catch (error) {
      toast.error(resolveUiError(error, 'Nao foi possivel remover o registro operacional.').message);
    } finally {
      setIsDeletingNote(null);
    }
  };

  const handleSaveCareNote = async () => {
    if (!appointment) return;

    const payload = {
      serviceExecutionNotes: serviceExecutionNotes.trim() || undefined,
      clientFeedbackNotes: clientFeedbackNotes.trim() || undefined,
      internalFollowupNotes: internalFollowupNotes.trim() || undefined,
    };

    if (
      !payload.serviceExecutionNotes &&
      !payload.clientFeedbackNotes &&
      !payload.internalFollowupNotes
    ) {
      toast.error('Preencha ao menos um detalhe do atendimento.');
      return;
    }

    setIsSaving(true);
    try {
      const createdNote = await appointmentsApi.addCustomerNote(
        appointment.id,
        payload,
      );

      setHistoryItem((previous) => {
        if (!previous) {
          return {
            appointmentId: appointment.id,
            date: toDateKey(appointment.date),
            status: appointment.status,
            professionalId: appointment.professionalId,
            professionalName: selectedProfessional?.name,
            notes: appointment.notes,
            services: appointmentItems,
            careNotes: [createdNote],
          };
        }

        return {
          ...previous,
          careNotes: [createdNote, ...(previous.careNotes || [])],
        };
      });

      resetForm();
      toast.success('Registro operacional salvo com sucesso.');
    } catch (error) {
      toast.error(
        resolveUiError(
          error,
          'Nao foi possivel salvar o registro operacional.',
        ).message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setHistoryItem(null);
          resetForm();
        }
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Detalhes do Agendamento</SheetTitle>
          <SheetDescription>Informacoes completas do agendamento</SheetDescription>
        </SheetHeader>

        {appointment ? (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge
                status={appointment.status}
                labelMap={appointmentStatusLabelMap}
                toneMap={appointmentStatusBadgeToneMap}
                className="text-xs"
              />
            </div>

            {flowMeta ? (
              <Alert className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertTitle>
                  Etapa {flowMeta.currentStep} de {flowMeta.totalSteps}
                </AlertTitle>
                <AlertDescription>
                  {flowMeta.nextLabel
                    ? `Proximo passo esperado: ${flowMeta.nextLabel}.`
                    : 'Atendimento finalizado no fluxo operacional.'}
                </AlertDescription>
              </Alert>
            ) : null}

            <Separator />

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="h-4 w-4 text-primary" /> Data e horario
              </h4>
              <div className="space-y-2 rounded-lg bg-muted/40 p-4">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {new Date(
                      `${toDateKey(appointment.date)}T12:00:00`,
                    ).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Horario:</span>
                  <span className="font-medium">
                    {appointment.startTime} - {appointment.endTime}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-primary" /> Cliente
              </h4>
              {selectedClient ? (
                <div className="space-y-3 rounded-lg bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/15 text-primary">
                        {selectedClient.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedClient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Cliente desde{' '}
                        {new Date(selectedClient.createdAt).toLocaleDateString(
                          'pt-BR',
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedClient.phone ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.phone}</span>
                    </div>
                  ) : null}

                  {selectedClient.email ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.email}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <Scissors className="h-4 w-4 text-primary" /> Servicos
              </h4>
              {appointmentItemsWithService.length ? (
                <div className="space-y-3 rounded-lg bg-muted/40 p-4">
                  {appointmentItemsWithService.map(({ item, service }, index) => {
                    const itemGrossAmount = Number(
                      item.grossAmount ?? item.totalPrice ?? 0,
                    );
                    const itemDiscountAmount = Number(item.discountAmount ?? 0);
                    const itemNetAmount = Number(
                      item.totalPrice ?? itemGrossAmount,
                    );
                    const itemDuration = Number(
                      item.durationMinutes || service?.duration || 0,
                    );

                    return (
                      <div
                        key={item.id ?? `${item.serviceId}-${index}`}
                        className="space-y-2 rounded-md border bg-background/80 p-3"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">
                            {service?.name || item.service?.name || 'Servico'}
                          </span>
                          {service?.category ? (
                            <Badge variant="outline">{service.category}</Badge>
                          ) : null}
                        </div>

                        <div className="flex items-start justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Duracao:</span>
                          <span>{itemDuration} minutos</span>
                        </div>

                        <div className="flex items-start justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">
                            Valor bruto:
                          </span>
                          <span>{formatCurrency(itemGrossAmount)}</span>
                        </div>

                        {itemDiscountAmount > 0 ? (
                          <div className="flex items-start justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">
                              Desconto aplicado:
                            </span>
                            <span>
                              - {formatCurrency(itemDiscountAmount)}
                            </span>
                          </div>
                        ) : null}

                        <div className="flex items-start justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">
                            Liquido do item:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(itemNetAmount)}
                          </span>
                        </div>

                        {service?.description ? (
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-primary" /> Profissional
              </h4>
              {selectedProfessional ? (
                <div className="rounded-lg bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedProfessional.avatar} />
                      <AvatarFallback className="bg-primary/15 text-primary">
                        {selectedProfessional.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedProfessional.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedProfessional.specialties
                          .slice(0, 3)
                          .map((specialty, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {specialty}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-primary" /> Valor
              </h4>
              <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
                {totalDiscountPrice > 0 ? (
                  <>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bruto:</span>
                      <span>{formatCurrency(totalGrossPrice)}</span>
                    </div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span>- {formatCurrency(totalDiscountPrice)}</span>
                    </div>
                  </>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {appointment.notes ? (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-primary" /> Observacoes
                  </h4>
                  <div className="rounded-lg bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">
                      {appointment.notes}
                    </p>
                  </div>
                </div>
              </>
            ) : null}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-primary" /> Rastro
                  operacional do atendimento
                </h4>
                {isLoadingHistory ? (
                  <Badge variant="outline">Carregando</Badge>
                ) : (
                  <Badge variant="secondary">
                    {careNotes.length} registro(s)
                  </Badge>
                )}
              </div>

              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceExecutionNotes">
                    Execucao do servico
                  </Label>
                  <Textarea
                    id="serviceExecutionNotes"
                    placeholder="Descreva tecnicas aplicadas, variacoes do servico e ocorrencias relevantes."
                    value={serviceExecutionNotes}
                    onChange={(event) =>
                      setServiceExecutionNotes(event.target.value)
                    }
                    rows={3}
                    disabled={!canRegisterNotes || isSaving}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Evite registrar informacoes de saude (alergias, condicoes clinicas) sem consentimento expresso do cliente.
                    Dados sensiveis exigem tratamento diferenciado pela LGPD (art. 11).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientFeedbackNotes">
                    Feedback do cliente
                  </Label>
                  <Textarea
                    id="clientFeedbackNotes"
                    placeholder="Registre percepcoes, preferencias, sensibilidade e retorno do cliente."
                    value={clientFeedbackNotes}
                    onChange={(event) =>
                      setClientFeedbackNotes(event.target.value)
                    }
                    rows={3}
                    disabled={!canRegisterNotes || isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internalFollowupNotes">
                    Proximo passo / acompanhamento
                  </Label>
                  <Textarea
                    id="internalFollowupNotes"
                    placeholder="Informe recomendacoes, manutencao, pendencias ou abordagem sugerida para o proximo atendimento."
                    value={internalFollowupNotes}
                    onChange={(event) =>
                      setInternalFollowupNotes(event.target.value)
                    }
                    rows={3}
                    disabled={!canRegisterNotes || isSaving}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={handleSaveCareNote}
                    disabled={!canRegisterNotes || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar registro operacional'
                    )}
                  </Button>
                  <Button
                    variant="outline" className="w-full sm:w-auto" onClick={resetForm} disabled={isSaving}
                  >
                    Limpar
                  </Button>
                </div>

                {!canRegisterNotes ? (
                  <p className="text-xs text-muted-foreground">
                    Registros operacionais ficam bloqueados para agendamentos
                    cancelados ou marcados como nao compareceu.
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                {isLoadingHistory ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : careNotes.length > 0 ? (
                  careNotes.map((note: AppointmentCustomerNote) => (
                    <div
                      key={note.noteId}
                      className="space-y-2 rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          Registro em{' '}
                          {new Date(note.recordedAt).toLocaleString('pt-BR')}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Atendimento</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            disabled={isDeletingNote === note.noteId}
                            onClick={() => void handleDeleteNote(note.noteId)}
                            aria-label="Remover registro operacional"
                          >
                            {isDeletingNote === note.noteId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {note.serviceExecutionNotes ? (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Execucao:
                          </span>{' '}
                          {note.serviceExecutionNotes}
                        </p>
                      ) : null}

                      {note.clientFeedbackNotes ? (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Feedback:
                          </span>{' '}
                          {note.clientFeedbackNotes}
                        </p>
                      ) : null}

                      {note.internalFollowupNotes ? (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Proximo passo:
                          </span>{' '}
                          {note.internalFollowupNotes}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum registro operacional foi salvo para este atendimento.
                  </p>
                )}
              </div>

              {appointment.status === 'IN_PROGRESS' && careNotes.length === 0 ? (
                <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Registro obrigatorio antes da conclusao</AlertTitle>
                  <AlertDescription>
                    Salve ao menos um detalhe operacional do cliente para
                    habilitar a conclusao do atendimento.
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>

            {appointment.status === 'COMPLETED' ? (
              <>
                <Separator />
                <Button className="w-full" onClick={() => onViewInvoice(appointment)}>
                  <Receipt className="mr-2 h-4 w-4" /> Ver pre-visualizacao da
                  Nota Fiscal
                </Button>
              </>
            ) : null}

            <div className="space-y-2 pt-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {appointment.status === 'PENDING' ? (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => onStatusChange(appointment.id, 'CONFIRMED')}
                  >
                    Confirmar agendamento
                  </Button>
                ) : null}

                {appointment.status === 'CONFIRMED' ? (
                  <Button
                    className="w-full" onClick={() => onStatusChange(appointment.id, 'IN_PROGRESS')}
                  >
                    Iniciar atendimento
                  </Button>
                ) : null}

                {appointment.status === 'IN_PROGRESS' ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={careNotes.length === 0}
                    onClick={() => onStatusChange(appointment.id, 'COMPLETED')}
                  >
                    Concluir atendimento
                  </Button>
                ) : null}

                {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(
                  appointment.status,
                ) ? (
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => onStatusChange(appointment.id, 'CANCELLED')}
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>

              {showNoShowButton ? (
                <Button
                  variant="outline"
                  className="col-span-full w-full border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => setIsNoShowDialogOpen(true)}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Nao compareceu
                </Button>
              ) : null}

              {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status) ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEditOpen(true)}
                >
                  Editar agendamento
                </Button>
              ) : null}

              {!isProfessionalUser && canReassignAppointments ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onReassignRequest(appointment)}
                >
                  Realocar profissional
                </Button>
              ) : null}

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => onDeleteRequest(appointment.id)}
              >
                Excluir Agendamento
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>

      <EditAppointmentDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        appointment={appointment}
        professionals={professionals}
        onSuccess={() => { onEditSuccess?.(); }}
      />

      <AlertDialog open={isNoShowDialogOpen} onOpenChange={setIsNoShowDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar nao comparecimento</AlertDialogTitle>
            <AlertDialogDescription>
              Isso marcara o agendamento como nao compareceu e enviara uma mensagem ao cliente via WhatsApp, se configurado. Essa acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarkingNoShow}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isMarkingNoShow}
              onClick={(e) => {
                e.preventDefault();
                void handleMarkNoShow();
              }}
            >
              {isMarkingNoShow ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Sim, nao compareceu'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
