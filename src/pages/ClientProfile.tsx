import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, Scissors, User } from "lucide-react";
import { RankedBarCard } from "@/components/common/RankedBarCard";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageErrorState } from "@/components/ui/page-states";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { ClientAppointmentDetailSheet } from "@/components/clients/ClientAppointmentDetailSheet";
import { formatStatusLabel } from "@/components/clients/AppointmentTimelineCard";
import { appointmentsApi, clientsApi, resolveApiMediaUrl, servicesApi, type Client, type Service } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { formatCurrency, formatDateOnly, formatDateTime } from "@/lib/format";
import { prepareImageUpload } from "@/lib/image-upload";
import { toast } from "sonner";
import type {
  AppointmentDetailResponse,
  ClientAppointmentHistoryResponse,
} from "@/types";

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
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isAvatarRemoving, setIsAvatarRemoving] = useState(false);
  const avatarUrl = resolveApiMediaUrl(client?.avatarUrl ?? null);

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

  const hasActiveHistoryFilters = Boolean(historyFrom || historyTo || historyServiceId !== "all");
  const topServicesRankingItems = (client.topServices || []).map((service) => ({
    id: service.serviceId,
    name: service.serviceName,
    value: service.completedServices,
    badgeText: `${service.completedServices}x`,
    metaText: `${formatCurrency(service.revenueTotal)} - ultima: ${service.lastAppointmentDate ? formatDateOnly(service.lastAppointmentDate) : "-"}`,
  }));
  const handleAvatarUpload = async (file: File) => {
    if (!client) return;
    setIsAvatarUploading(true);
    try {
      const preparedFile = await prepareImageUpload(file);
      const updatedClient = await clientsApi.uploadAvatar(client.id, preparedFile);
      setClient(updatedClient);
      toast.success("Avatar do cliente atualizado com sucesso");
    } catch (err) {
      toast.error(resolveUiError(err, "Nao foi possivel atualizar o avatar do cliente.").message);
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!client) return;
    setIsAvatarRemoving(true);
    try {
      const updatedClient = await clientsApi.removeAvatar(client.id);
      setClient(updatedClient);
      toast.success("Avatar do cliente removido com sucesso");
    } catch (err) {
      toast.error(resolveUiError(err, "Nao foi possivel remover o avatar do cliente.").message);
    } finally {
      setIsAvatarRemoving(false);
    }
  };

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
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <FileDropzone
                title="Avatar do cliente"
                helperText="JPG, PNG ou WEBP"
                accept={{
                  "image/jpeg": [".jpg", ".jpeg"],
                  "image/png": [".png"],
                  "image/webp": [".webp"],
                }}
                maxSizeBytes={10 * 1024 * 1024}
                currentPreviewUrl={avatarUrl}
                previewAlt={client.name}
                isLoading={isAvatarUploading || isAvatarRemoving}
                onFileSelected={handleAvatarUpload}
                onRemove={avatarUrl ? handleAvatarRemove : undefined}
                inputTestId="client-avatar-input"
                variant="avatar"
                className="shrink-0"
              />
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
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
              </div>
            </div>
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

      <ClientAppointmentDetailSheet
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
        isDetailLoading={isDetailLoading}
        detailError={detailError}
        appointmentDetail={appointmentDetail}
        selectedAppointmentId={selectedAppointmentId}
        client={client}
      />
    </MainLayout>
  );
}
