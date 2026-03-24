import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock3, FileText, History, Mail, MapPin, Phone, Scissors, User } from "lucide-react";
import { RankedBarCard } from "@/components/common/RankedBarCard";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageErrorState } from "@/components/ui/page-states";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { appointmentsApi, clientsApi, servicesApi, type Client, type Service } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type {
  AppointmentDetailResponse,
  AppointmentItem,
  AppointmentTimelineEvent,
  ClientAppointmentHistoryResponse,
} from "@/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const appointmentStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluido",
  CANCELLED: "Cancelado",
  NO_SHOW: "Nao compareceu",
};

const parseDateValue = (value?: string | Date | null) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateOnly = (value?: string | Date | null) => {
  const parsed = parseDateValue(value);
  return parsed ? parsed.toLocaleDateString("pt-BR") : "-";
};

const formatDateTime = (value?: string | Date | null) => {
  const parsed = parseDateValue(value);
  return parsed ? parsed.toLocaleString("pt-BR") : "-";
};

const formatDateLong = (value?: string | Date | null) => {
  const parsed = parseDateValue(value);
  return parsed
    ? parsed.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";
};

const formatStatusLabel = (status?: string) => {
  if (!status) return "-";
  return appointmentStatusLabels[status] || status;
};

const getStatusBadgeColor = (status?: string) => {
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

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toDisplayValue = (value: unknown) => {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Sim" : "Nao";
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => String(item)).join(", ") : "-";
  }
  if (typeof value === "object") {
    return "Atualizacao estrutural";
  }
  if (typeof value === "string" && appointmentStatusLabels[value]) {
    return formatStatusLabel(value);
  }
  return String(value);
};

const humanizeFieldName = (field: string) =>
  field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());

const getObjectValue = (payload: unknown, field: string) => {
  if (!isObjectRecord(payload)) return undefined;
  return payload[field];
};

function TimelineEventCard({ event }: { event: AppointmentTimelineEvent }) {
  const changedFields = event.changedFields?.length
    ? event.changedFields
    : [
        ...new Set([
          ...Object.keys(isObjectRecord(event.before) ? event.before : {}),
          ...Object.keys(isObjectRecord(event.after) ? event.after : {}),
        ]),
      ];

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">{event.actionLabel || event.action}</p>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(event.createdAt)}
            {event.actorName ? ` - ${event.actorName}` : ""}
            {event.actorRole ? ` (${event.actorRole})` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.status ? <Badge variant="outline">{formatStatusLabel(event.status)}</Badge> : null}
          {event.sourceChannel ? <Badge variant="secondary">{event.sourceChannel}</Badge> : null}
        </div>
      </div>

      {changedFields.length ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mudancas registradas</p>
          <div className="grid gap-3">
            {changedFields.map((field) => (
              <div key={field} className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">{humanizeFieldName(field)}</p>
                <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                  <div className="rounded-md border bg-background p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Antes</p>
                    <p className="mt-1 text-sm">{toDisplayValue(getObjectValue(event.before, field))}</p>
                  </div>
                  <div className="flex items-center justify-center text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div className="rounded-md border bg-background p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Depois</p>
                    <p className="mt-1 text-sm">{toDisplayValue(getObjectValue(event.after, field))}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(event.actorRole || (isObjectRecord(event.metadata) && Object.keys(event.metadata).length > 0)) ? (
        <div className="flex flex-wrap gap-2">
          {event.actorRole ? <Badge variant="outline">{event.actorRole}</Badge> : null}
          {isObjectRecord(event.metadata)
            ? Object.entries(event.metadata).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="max-w-full">
                  {humanizeFieldName(key)}: {toDisplayValue(value)}
                </Badge>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [history, setHistory] = useState<ClientAppointmentHistoryResponse | null>(null);
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyServiceId, setHistoryServiceId] = useState("all");
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [appointmentDetail, setAppointmentDetail] = useState<AppointmentDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) {
        setError("Cliente nao informado.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const [data, servicesResponse] = await Promise.all([
          clientsApi.getById(id),
          servicesApi.getAll({ limit: 200 }),
        ]);
        if (!mounted) return;
        if (!data) {
          setError("Cliente nao encontrado.");
          return;
        }
        setClient(data);
        setServices(Array.isArray(servicesResponse) ? servicesResponse : servicesResponse.items || []);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(resolveUiError(err, "Nao foi possivel carregar o perfil do cliente.").message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      if (!id) {
        setIsHistoryLoading(false);
        return;
      }

      if (historyFrom && historyTo && historyFrom > historyTo) {
        setHistory(null);
        setHistoryError("O periodo informado e invalido.");
        setIsHistoryLoading(false);
        return;
      }

      try {
        setIsHistoryLoading(true);
        const historyData = await clientsApi.getAppointmentHistory(id, 0, 50, {
          from: historyFrom || undefined,
          to: historyTo || undefined,
          serviceId: historyServiceId !== "all" ? historyServiceId : undefined,
        });
        if (!mounted) return;
        setHistory(historyData);
        setHistoryError(null);
      } catch (err) {
        if (!mounted) return;
        setHistoryError(resolveUiError(err, "Nao foi possivel carregar o historico de atendimentos.").message);
      } finally {
        if (mounted) setIsHistoryLoading(false);
      }
    };

    void loadHistory();
    return () => {
      mounted = false;
    };
  }, [historyFrom, historyServiceId, historyTo, id]);

  const handleOpenAppointmentDetail = async (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setAppointmentDetail(null);
    setDetailError(null);
    setIsDetailLoading(true);
    setIsDetailOpen(true);

    try {
      const data = await appointmentsApi.getById(appointmentId);
      setAppointmentDetail(data);
    } catch (err) {
      setDetailError(resolveUiError(err, "Nao foi possivel carregar o detalhe do atendimento.").message);
    } finally {
      setIsDetailLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Perfil do Cliente" subtitle="Carregando dados...">
        <div className="space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-52 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !client) {
    return (
      <MainLayout title="Perfil do Cliente" subtitle="Detalhes do cliente">
        <PageErrorState
          title="Nao foi possivel carregar o cliente"
          description={error || "Cliente nao encontrado."}
          action={{ label: "Voltar para clientes", onClick: () => navigate("/clientes") }}
        />
      </MainLayout>
    );
  }

  const detailAppointment = appointmentDetail?.appointment;
  const detailItems = detailAppointment ? getAppointmentItems(detailAppointment) : [];
  const hasActiveHistoryFilters = Boolean(historyFrom || historyTo || historyServiceId !== "all");
  const topServicesRankingItems = (client.topServices || []).map((service) => ({
    id: service.serviceId,
    name: service.serviceName,
    value: service.completedServices,
    badgeText: `${service.completedServices}x`,
    metaText: `${formatCurrency(service.revenueTotal)} - ultima: ${service.lastAppointmentDate ? formatDateOnly(service.lastAppointmentDate) : "-"}`,
  }));

  return (
    <MainLayout title="Perfil do Cliente" subtitle={client.name}>
      <div className="space-y-4 sm:space-y-6">
        <Button variant="outline" onClick={() => navigate("/clientes")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {client.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <p className="text-sm">
              <span className="font-medium">Telefone:</span>{" "}
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                {client.phone || "-"}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">E-mail:</span>{" "}
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                {client.email || "-"}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Ultima visita:</span>{" "}
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {client.lastVisit ? formatDateOnly(client.lastVisit) : "Nunca"}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Visitas:</span> {client.totalVisits}
            </p>
            <p className="text-sm">
              <span className="font-medium">Total gasto:</span> {formatCurrency(client.totalSpent)}
            </p>
            <p className="text-sm">
              <span className="font-medium">Observacoes:</span> {client.notes || "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Endereco
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <p><span className="font-medium">CEP:</span> {client.address?.zipCode || "-"}</p>
            <p><span className="font-medium">Logradouro:</span> {client.address?.street || "-"}</p>
            <p><span className="font-medium">Numero:</span> {client.address?.number || "-"}</p>
            <p><span className="font-medium">Complemento:</span> {client.address?.complement || "-"}</p>
            <p><span className="font-medium">Bairro:</span> {client.address?.neighborhood || "-"}</p>
            <p><span className="font-medium">Cidade/UF:</span> {[client.address?.city, client.address?.state].filter(Boolean).join(" / ") || "-"}</p>
          </CardContent>
        </Card>

        <RankedBarCard
          title="Top 5 servicos mais usados"
          icon={Scissors}
          items={topServicesRankingItems}
          maxItems={5}
          valueLabel="Execucoes"
          labelPrefix="Servico"
          emptyMessage="Nenhum servico concluido encontrado para este cliente."
        />

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Historico de atendimentos</CardTitle>
                {hasActiveHistoryFilters ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHistoryFrom("");
                      setHistoryTo("");
                      setHistoryServiceId("all");
                    }}
                  >
                    Limpar filtros
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data inicial</span>
                  <Input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data final</span>
                  <Input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Servico</span>
                  <Select value={historyServiceId} onValueChange={setHistoryServiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os servicos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os servicos</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isHistoryLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : historyError ? (
              <p className="text-sm text-destructive">{historyError}</p>
            ) : history?.items?.length ? history.items.map((item) => (
              <div key={item.appointmentId} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {formatDateOnly(item.date)} - {item.professionalName || "Profissional nao identificado"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.services.map((service) => service.service?.name).filter(Boolean).join(", ") || "Sem servicos vinculados"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{formatStatusLabel(item.status)}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleOpenAppointmentDetail(item.appointmentId)}
                      disabled={isDetailLoading && selectedAppointmentId === item.appointmentId}
                      aria-label={`Detalhe do atendimento em ${formatDateOnly(item.date)}`}
                    >
                      Detalhe
                    </Button>
                  </div>
                </div>
                {item.notes ? (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                ) : null}
                {item.careNotes?.length ? (
                  <div className="space-y-2">
                    {item.careNotes.map((note) => (
                      <div key={note.noteId} className="rounded-md bg-muted/40 p-3 text-sm">
                        <p className="font-medium">
                          Registro de atendimento em {formatDateTime(note.recordedAt)}
                        </p>
                        {note.serviceExecutionNotes ? <p className="text-muted-foreground">Execucao: {note.serviceExecutionNotes}</p> : null}
                        {note.clientFeedbackNotes ? <p className="text-muted-foreground">Feedback: {note.clientFeedbackNotes}</p> : null}
                        {note.internalFollowupNotes ? <p className="text-muted-foreground">Proximo passo: {note.internalFollowupNotes}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem notas operacionais registradas.</p>
                )}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhum atendimento encontrado para este cliente.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setSelectedAppointmentId(null);
            setAppointmentDetail(null);
            setDetailError(null);
            setIsDetailLoading(false);
          }
        }}
      >
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

              {appointmentDetail.timeline.length ? (
                <Alert className="border-primary/20 bg-primary/5">
                  <History className="h-4 w-4" />
                  <AlertTitle>{appointmentDetail.timeline.length} evento(s) registrados</AlertTitle>
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
                  <Badge variant="secondary">{appointmentDetail.careNotes.length} registro(s)</Badge>
                </div>

                {appointmentDetail.careNotes.length ? (
                  <div className="space-y-3">
                    {appointmentDetail.careNotes.map((note) => (
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
                  <Badge variant="secondary">{appointmentDetail.timeline.length} evento(s)</Badge>
                </div>

                {appointmentDetail.timeline.length ? (
                  <div className="space-y-3">
                    {appointmentDetail.timeline.map((event) => (
                      <TimelineEventCard key={event.eventId || `${event.action}-${event.createdAt}`} event={event} />
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
    </MainLayout>
  );
}
