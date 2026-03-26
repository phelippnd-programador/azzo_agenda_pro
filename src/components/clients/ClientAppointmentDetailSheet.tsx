import { Calendar, Clock3, FileText, History, Mail, Phone, Scissors, User } from "lucide-react";
import { AppointmentTimelineCard, appointmentStatusLabels, formatStatusLabel } from "./AppointmentTimelineCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateOnly, formatDateTime, formatDateLong } from "@/lib/format";
import type { AppointmentDetailResponse, AppointmentItem } from "@/types";
import type { Client } from "@/lib/api";

const getStatusBadgeColor = (status?: string): string => {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    CONFIRMED: "bg-sky-100 text-sky-700 border-sky-200",
    IN_PROGRESS: "bg-primary/10 text-primary border-primary/20",
    COMPLETED: "bg-green-100 text-green-700 border-green-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
    NO_SHOW: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return colors[status || ""] || colors.PENDING;
};

const getAppointmentItems = (appointment: AppointmentDetailResponse["appointment"]): AppointmentItem[] => {
  if (Array.isArray(appointment.items) && appointment.items.length > 0) {
    return appointment.items;
  }

  if (!appointment.serviceId) {
    return [];
  }

  return [
    {
      serviceId: appointment.serviceId,
      service: appointment.service,
      durationMinutes: 0,
      unitPrice: Number(appointment.totalPrice || 0),
      totalPrice: Number(appointment.totalPrice || 0),
    },
  ];
};

// Re-export so consumers that only need the label map can import from here too
export { appointmentStatusLabels, formatStatusLabel };

export interface ClientAppointmentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDetailLoading: boolean;
  detailError: string | null;
  appointmentDetail: AppointmentDetailResponse | null;
  selectedAppointmentId: string | null;
  client: Client;
}

export function ClientAppointmentDetailSheet({
  open,
  onOpenChange,
  isDetailLoading,
  detailError,
  appointmentDetail,
  selectedAppointmentId,
  client,
}: ClientAppointmentDetailSheetProps) {
  const detailAppointment = appointmentDetail?.appointment ?? null;
  const detailItems: AppointmentItem[] = detailAppointment ? getAppointmentItems(detailAppointment) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Agendamento</SheetTitle>
          <SheetDescription>
            Informacoes completas do agendamento
          </SheetDescription>
        </SheetHeader>

        {isDetailLoading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : detailError ? (
          <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {detailError}
          </div>
        ) : detailAppointment ? (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={getStatusBadgeColor(detailAppointment.status)}>
                {formatStatusLabel(detailAppointment.status)}
              </Badge>
            </div>

            {appointmentDetail!.timeline.length ? (
              <Alert className="border-primary/20 bg-primary/5">
                <History className="h-4 w-4" />
                <AlertTitle>{appointmentDetail!.timeline.length} evento(s) registrados</AlertTitle>
                <AlertDescription>
                  O historico abaixo mostra as principais alteracoes e o rastro operacional deste atendimento.
                </AlertDescription>
              </Alert>
            ) : null}

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Data e Horario
              </h4>
              <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium text-right">{formatDateLong(detailAppointment.date)}</span>
                </div>
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-muted-foreground">Horario:</span>
                  <span className="font-medium">
                    {detailAppointment.startTime} - {detailAppointment.endTime}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Cliente
              </h4>
              <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {(detailAppointment.client?.name || client.name).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{detailAppointment.client?.name || client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Cliente desde {formatDateOnly(detailAppointment.client?.createdAt || client.createdAt)}
                    </p>
                  </div>
                </div>
                {(detailAppointment.client?.phone || client.phone) ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{detailAppointment.client?.phone || client.phone}</span>
                  </div>
                ) : null}
                {(detailAppointment.client?.email || client.email) ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{detailAppointment.client?.email || client.email}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Scissors className="w-4 h-4 text-primary" />
                Servicos
              </h4>
              {detailItems.length ? (
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  {detailItems.map((service, index) => (
                    <div
                      key={`${service.serviceId}-${index}`}
                      className="space-y-2 rounded-md border bg-background/80 p-3"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{service.service?.name || "Servico nao identificado"}</span>
                        {service.service?.category ? <Badge variant="outline">{service.service.category}</Badge> : null}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duracao:</span>
                        <span>{service.durationMinutes ? `${service.durationMinutes} minutos` : "Nao informada"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor:</span>
                        <span>{formatCurrency(Number(service.totalPrice || 0))}</span>
                      </div>
                      {service.service?.description ? (
                        <p className="text-sm text-muted-foreground">{service.service.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum servico vinculado a este agendamento.</p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-primary" />
                Profissional
              </h4>
              <div className="bg-muted/40 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {(detailAppointment.professional?.name || "PR").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{detailAppointment.professional?.name || "Profissional nao identificado"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Valor
              </h4>
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(Number(detailAppointment.totalPrice || 0))}
                  </span>
                </div>
              </div>
            </div>

            {detailAppointment.notes ? (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Observacoes
                  </h4>
                  <div className="bg-muted/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">{detailAppointment.notes}</p>
                  </div>
                </div>
              </>
            ) : null}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Rastro operacional do atendimento
                </h4>
                <Badge variant="secondary">{appointmentDetail!.careNotes.length} registro(s)</Badge>
              </div>

              {appointmentDetail!.careNotes.length ? (
                <div className="space-y-3">
                  {appointmentDetail!.careNotes.map((note) => (
                    <div key={note.noteId} className="rounded-lg border bg-muted/20 p-4 space-y-2">
                      <p className="text-sm font-medium">Registrado em {formatDateTime(note.recordedAt)}</p>
                      {note.serviceExecutionNotes ? (
                        <p className="text-sm text-muted-foreground">Execucao: {note.serviceExecutionNotes}</p>
                      ) : null}
                      {note.clientFeedbackNotes ? (
                        <p className="text-sm text-muted-foreground">Feedback: {note.clientFeedbackNotes}</p>
                      ) : null}
                      {note.internalFollowupNotes ? (
                        <p className="text-sm text-muted-foreground">Proximo passo: {note.internalFollowupNotes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem registros operacionais para este agendamento.</p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Timeline do agendamento
                </h4>
                <Badge variant="secondary">{appointmentDetail!.timeline.length} evento(s)</Badge>
              </div>

              {appointmentDetail!.timeline.length ? (
                <div className="space-y-3">
                  {appointmentDetail!.timeline.map((event) => (
                    <AppointmentTimelineCard key={event.eventId || `${event.action}-${event.createdAt}`} event={event} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum evento de timeline encontrado.</p>
              )}
            </div>
          </div>
        ) : selectedAppointmentId ? (
          <p className="mt-6 text-sm text-muted-foreground">Nenhum detalhe retornado para este atendimento.</p>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
