import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { clientsApi, appointmentsApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { formatCurrency, toDateKey } from '@/lib/format';
import {
  appointmentStatusBadgeToneMap,
  appointmentStatusLabelMap,
  getServiceFlowMeta,
  getAppointmentItems,
} from '@/lib/appointment-status';
import type { Appointment } from '@/hooks/useAppointments';
import type { Professional, Client, Service, AppointmentCustomerNote, ClientAppointmentHistoryItem } from '@/types';

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
}: AppointmentDetailsSheetProps) {
  const [historyItem, setHistoryItem] = useState<ClientAppointmentHistoryItem | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serviceExecutionNotes, setServiceExecutionNotes] = useState('');
  const [clientFeedbackNotes, setClientFeedbackNotes] = useState('');
  const [internalFollowupNotes, setInternalFollowupNotes] = useState('');

  const resetForm = () => {
    setServiceExecutionNotes('');
    setClientFeedbackNotes('');
    setInternalFollowupNotes('');
  };

  const selectedClient =
    appointment?.client ?? clients.find((c) => c.id === appointment?.clientId) ?? null;

  const selectedProfessional = appointment
    ? professionals.find((p) => p.id === appointment.professionalId) ?? null
    : null;

  const selectedServices = appointment
    ? getAppointmentItems(appointment)
        .map((item) => item.service ?? services.find((s) => s.id === item.serviceId) ?? null)
        .filter((s): s is NonNullable<typeof s> => !!s)
    : [];

  const totalPrice = appointment
    ? Number(
        appointment.totalPrice ||
          getAppointmentItems(appointment).reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
      )
    : 0;

  const flowMeta = appointment ? getServiceFlowMeta(appointment.status) : null;
  const careNotes = historyItem?.careNotes ?? [];
  const canRegisterNotes = !!appointment && !['CANCELLED', 'NO_SHOW'].includes(appointment.status);

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
        const item = history.items.find((i) => i.appointmentId === appointment.id) ?? null;
        setHistoryItem(item);
      })
      .catch((err) => {
        if (!active) return;
        toast.error(resolveUiError(err, 'Não foi possível carregar o histórico deste cliente.').message);
      })
      .finally(() => { if (active) setIsLoadingHistory(false); });

    return () => { active = false; };
  }, [open, appointment?.id, selectedClient?.id]);

  const handleSaveCareNote = async () => {
    if (!appointment) return;
    const payload = {
      serviceExecutionNotes: serviceExecutionNotes.trim() || undefined,
      clientFeedbackNotes: clientFeedbackNotes.trim() || undefined,
      internalFollowupNotes: internalFollowupNotes.trim() || undefined,
    };
    if (!payload.serviceExecutionNotes && !payload.clientFeedbackNotes && !payload.internalFollowupNotes) {
      toast.error('Preencha ao menos um detalhe do atendimento.');
      return;
    }
    setIsSaving(true);
    try {
      const createdNote = await appointmentsApi.addCustomerNote(appointment.id, payload);
      setHistoryItem((prev) => {
        if (!prev) {
          return {
            appointmentId: appointment.id,
            date: toDateKey(appointment.date),
            status: appointment.status,
            professionalId: appointment.professionalId,
            professionalName: selectedProfessional?.name,
            notes: appointment.notes,
            services: getAppointmentItems(appointment),
            careNotes: [createdNote],
          };
        }
        return { ...prev, careNotes: [createdNote, ...(prev.careNotes || [])] };
      });
      resetForm();
      toast.success('Registro operacional salvo com sucesso.');
    } catch (err) {
      toast.error(resolveUiError(err, 'Não foi possível salvar o registro operacional.').message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) { setHistoryItem(null); resetForm(); }
      }}
    >
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Agendamento</SheetTitle>
          <SheetDescription>Informações completas do agendamento</SheetDescription>
        </SheetHeader>

        {appointment && (
          <div className="mt-6 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge
                status={appointment.status}
                labelMap={appointmentStatusLabelMap}
                toneMap={appointmentStatusBadgeToneMap}
                className="text-xs"
              />
            </div>

            {flowMeta && (
              <Alert className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertTitle>Etapa {flowMeta.currentStep} de {flowMeta.totalSteps}</AlertTitle>
                <AlertDescription>
                  {flowMeta.nextLabel
                    ? `Próximo passo esperado: ${flowMeta.nextLabel}.`
                    : 'Atendimento finalizado no fluxo operacional.'}
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Data e Horário */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" /> Data e Horário
              </h4>
              <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {new Date(appointment.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Horário:</span>
                  <span className="font-medium">{appointment.startTime} - {appointment.endTime}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cliente */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Cliente
              </h4>
              {selectedClient && (
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/15 text-primary">
                        {selectedClient.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedClient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Cliente desde {new Date(selectedClient.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {selectedClient.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedClient.phone}</span>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedClient.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Serviços */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Scissors className="w-4 h-4 text-primary" /> Serviços
              </h4>
              {selectedServices.length > 0 && (
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  {selectedServices.map((svc) => (
                    <div key={svc.id} className="space-y-2 rounded-md border bg-background/80 p-3">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{svc.name}</span>
                        <Badge variant="outline">{svc.category}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duração:</span>
                        <span>{svc.duration} minutos</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor:</span>
                        <span>{formatCurrency(svc.price)}</span>
                      </div>
                      {svc.description && (
                        <p className="text-sm text-muted-foreground">{svc.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Profissional */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Profissional
              </h4>
              {selectedProfessional && (
                <div className="bg-muted/40 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedProfessional.avatar} />
                      <AvatarFallback className="bg-primary/15 text-primary">
                        {selectedProfessional.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedProfessional.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProfessional.specialties.slice(0, 3).map((spec, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{spec}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Valor */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Valor
              </h4>
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Observações */}
            {appointment.notes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Observações
                  </h4>
                  <div className="bg-muted/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Rastro operacional */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Rastro operacional do atendimento
                </h4>
                {isLoadingHistory ? (
                  <Badge variant="outline">Carregando</Badge>
                ) : (
                  <Badge variant="secondary">{careNotes.length} registro(s)</Badge>
                )}
              </div>

              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="serviceExecutionNotes">Execução do serviço</Label>
                  <Textarea
                    id="serviceExecutionNotes"
                    placeholder="Descreva técnicas aplicadas, variações do serviço e ocorrências relevantes."
                    value={serviceExecutionNotes}
                    onChange={(e) => setServiceExecutionNotes(e.target.value)}
                    rows={3}
                    disabled={!canRegisterNotes || isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientFeedbackNotes">Feedback do cliente</Label>
                  <Textarea
                    id="clientFeedbackNotes"
                    placeholder="Registre percepções, preferências, sensibilidade e retorno do cliente."
                    value={clientFeedbackNotes}
                    onChange={(e) => setClientFeedbackNotes(e.target.value)}
                    rows={3}
                    disabled={!canRegisterNotes || isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internalFollowupNotes">Próximo passo / acompanhamento</Label>
                  <Textarea
                    id="internalFollowupNotes"
                    placeholder="Informe recomendações, manutenção, pendências ou abordagem sugerida para o próximo atendimento."
                    value={internalFollowupNotes}
                    onChange={(e) => setInternalFollowupNotes(e.target.value)}
                    rows={3}
                    disabled={!canRegisterNotes || isSaving}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSaveCareNote} disabled={!canRegisterNotes || isSaving}>
                    {isSaving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                    ) : (
                      'Salvar registro operacional'
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm} disabled={isSaving}>Limpar</Button>
                </div>
                {!canRegisterNotes && (
                  <p className="text-xs text-muted-foreground">
                    Registros operacionais ficam bloqueados para agendamentos cancelados ou marcados como não compareceu.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {isLoadingHistory ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : careNotes.length > 0 ? (
                  careNotes.map((note: AppointmentCustomerNote) => (
                    <div key={note.noteId} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          Registro em {new Date(note.recordedAt).toLocaleString('pt-BR')}
                        </p>
                        <Badge variant="outline">Atendimento</Badge>
                      </div>
                      {note.serviceExecutionNotes && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Execução:</span> {note.serviceExecutionNotes}
                        </p>
                      )}
                      {note.clientFeedbackNotes && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Feedback:</span> {note.clientFeedbackNotes}
                        </p>
                      )}
                      {note.internalFollowupNotes && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Próximo passo:</span> {note.internalFollowupNotes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum registro operacional foi salvo para este atendimento.</p>
                )}
              </div>

              {appointment.status === 'IN_PROGRESS' && careNotes.length === 0 && (
                <Alert className="border-amber-200 bg-amber-50">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Registro obrigatório antes da conclusão</AlertTitle>
                  <AlertDescription>
                    Salve ao menos um detalhe operacional do cliente para habilitar a conclusão do atendimento.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Nota fiscal */}
            {appointment.status === 'COMPLETED' && (
              <>
                <Separator />
                <Button className="w-full" onClick={() => onViewInvoice(appointment)}>
                  <Receipt className="w-4 h-4 mr-2" /> Ver Pré-visualização da Nota Fiscal
                </Button>
              </>
            )}

            {/* Ações */}
            <div className="pt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {appointment.status === 'PENDING' && (
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => onStatusChange(appointment.id, 'CONFIRMED')}>
                    Confirmar agendamento
                  </Button>
                )}
                {appointment.status === 'CONFIRMED' && (
                  <Button onClick={() => onStatusChange(appointment.id, 'IN_PROGRESS')}>
                    Iniciar atendimento
                  </Button>
                )}
                {appointment.status === 'IN_PROGRESS' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    disabled={careNotes.length === 0}
                    onClick={() => onStatusChange(appointment.id, 'COMPLETED')}
                  >
                    Concluir atendimento
                  </Button>
                )}
                {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status) && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onStatusChange(appointment.id, 'CANCELLED')}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
              {!isProfessionalUser && canReassignAppointments && (
                <Button variant="outline" className="w-full" onClick={() => onReassignRequest(appointment)}>
                  Realocar profissional
                </Button>
              )}
              <Button variant="destructive" className="w-full" onClick={() => onDeleteRequest(appointment.id)}>
                Excluir Agendamento
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
