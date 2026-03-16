import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, Scissors, User } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageErrorState } from "@/components/ui/page-states";
import { Badge } from "@/components/ui/badge";
import { clientsApi, type Client } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { ClientAppointmentHistoryResponse } from "@/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [history, setHistory] = useState<ClientAppointmentHistoryResponse | null>(null);
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
        const [data, historyData] = await Promise.all([
          clientsApi.getById(id),
          clientsApi.getAppointmentHistory(id),
        ]);
        if (!mounted) return;
        if (!data) {
          setError("Cliente nao encontrado.");
          return;
        }
        setClient(data);
        setHistory(historyData);
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
                {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString("pt-BR") : "Nunca"}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" />
              Top servicos mais usados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.topServices?.length ? client.topServices.map((service) => (
              <div key={service.serviceId} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{service.serviceName}</p>
                    <p className="text-sm text-muted-foreground">
                      Ultima realizacao: {service.lastAppointmentDate ? new Date(`${service.lastAppointmentDate}T12:00:00`).toLocaleDateString("pt-BR") : "-"}
                    </p>
                  </div>
                  <Badge variant="secondary">{service.completedServices}x</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {service.completedAppointments} atendimento(s) concluido(s) • {formatCurrency(service.revenueTotal)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Profissional mais recorrente: {service.topProfessionalName || "-"}
                </p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhum servico concluido encontrado para este cliente.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historico de atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {history?.items?.length ? history.items.map((item) => (
              <div key={item.appointmentId} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")} • {item.professionalName || "Profissional nao identificado"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.services.map((service) => service.service?.name).filter(Boolean).join(", ") || "Sem servicos vinculados"}
                    </p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                {item.notes ? (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                ) : null}
                {item.careNotes?.length ? (
                  <div className="space-y-2">
                    {item.careNotes.map((note) => (
                      <div key={note.noteId} className="rounded-md bg-muted/40 p-3 text-sm">
                        <p className="font-medium">
                          Registro de atendimento em {new Date(note.recordedAt).toLocaleString("pt-BR")}
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
    </MainLayout>
  );
}
