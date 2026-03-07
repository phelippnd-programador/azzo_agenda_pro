import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Mail, Phone, User } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageErrorState } from "@/components/ui/page-states";
import { clientsApi, type Client } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
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
        const data = await clientsApi.getById(id);
        if (!mounted) return;
        if (!data) {
          setError("Cliente nao encontrado.");
          return;
        }
        setClient(data);
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
      </div>
    </MainLayout>
  );
}
