import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Percent, Phone, User } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageErrorState } from "@/components/ui/page-states";
import { professionalsApi, type Professional } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";

export default function ProfessionalProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) {
        setError("Profissional nao informado.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await professionalsApi.getById(id);
        if (!mounted) return;
        if (!data) {
          setError("Profissional nao encontrado.");
          return;
        }
        setProfessional(data);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(resolveUiError(err, "Nao foi possivel carregar o perfil do profissional.").message);
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
      <MainLayout title="Perfil do Profissional" subtitle="Carregando dados...">
        <div className="space-y-4">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-56 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !professional) {
    return (
      <MainLayout title="Perfil do Profissional" subtitle="Detalhes do profissional">
        <PageErrorState
          title="Nao foi possivel carregar o profissional"
          description={error || "Profissional nao encontrado."}
          action={{ label: "Voltar para profissionais", onClick: () => navigate("/profissionais") }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Perfil do Profissional" subtitle={professional.name}>
      <div className="space-y-4 sm:space-y-6">
        <Button variant="outline" onClick={() => navigate("/profissionais")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {professional.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <p className="text-sm">
              <span className="font-medium">E-mail:</span>{" "}
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                {professional.email || "-"}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Telefone:</span>{" "}
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                {professional.phone || "-"}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Comissao:</span>{" "}
              <span className="inline-flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                {professional.commissionRate}%
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{" "}
              <Badge variant={professional.isActive ? "default" : "secondary"}>
                {professional.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </p>
            <div className="sm:col-span-2 text-sm">
              <span className="font-medium">Especialidades:</span>{" "}
              {professional.specialties.length ? professional.specialties.join(", ") : "-"}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
