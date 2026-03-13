import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileBarChart2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CommissionRuleSetEditor } from "@/components/commissions/CommissionRuleSetEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageErrorState } from "@/components/ui/page-states";
import { commissionApi, professionalsApi, servicesApi, stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { Professional, Service } from "@/types";
import type { StockItem } from "@/types/stock";
import type { CommissionRuleSetResponse, CommissionRuleSetUpsertRequest } from "@/types/commission";
import { toast } from "sonner";

export default function ProfessionalCommissionSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [ruleSet, setRuleSet] = useState<CommissionRuleSetResponse | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) {
      setError("Profissional nao informado.");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [professionalResponse, rulesResponse, servicesResponse, productsResponse] = await Promise.all([
        professionalsApi.getById(id),
        commissionApi.listRuleSets({ professionalId: id, activeOnly: false }),
        servicesApi.getAll(),
        stockApi.getItems({ limit: 200 }),
      ]);
      const serviceItems = Array.isArray(servicesResponse)
        ? servicesResponse
        : servicesResponse.items || [];
      const productItems = Array.isArray(productsResponse)
        ? productsResponse
        : productsResponse.items || [];
      setProfessional(professionalResponse);
      setRuleSet(rulesResponse.items[0] || null);
      setServices(serviceItems);
      setProducts(productItems);
      setError(null);
    } catch (err) {
      setError(resolveUiError(err, "Nao foi possivel carregar a configuracao de comissao.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handleSave = async (payload: CommissionRuleSetUpsertRequest, existingRuleSetId?: string) => {
    try {
      setIsSaving(true);
      if (existingRuleSetId) {
        await commissionApi.updateRuleSet(existingRuleSetId, payload);
      } else {
        await commissionApi.createRuleSet(payload);
      }
      toast.success("Configuracao de comissao salva.");
      await load();
    } catch (err) {
      toast.error(resolveUiError(err, "Nao foi possivel salvar a configuracao.").message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Comissao do Profissional" subtitle="Carregando configuracao">
        <div className="space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !professional) {
    return (
      <MainLayout title="Comissao do Profissional" subtitle="Configuracao individual">
        <PageErrorState
          title="Nao foi possivel carregar a configuracao"
          description={error || "Profissional nao encontrado."}
          action={{ label: "Voltar para profissionais", onClick: () => navigate("/profissionais") }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Comissao do Profissional" subtitle={professional.name}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => navigate(`/profissionais/${professional.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao perfil
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/financeiro/comissoes/${professional.id}`}>
              <FileBarChart2 className="mr-2 h-4 w-4" />
              Ver detalhamento
            </Link>
          </Button>
        </div>

        <CommissionRuleSetEditor
          title={`Regra especifica de ${professional.name}`}
          scopeType="PROFESSIONAL"
          professional={professional}
          existingRuleSet={ruleSet}
          services={services}
          products={products}
          isSaving={isSaving}
          onSave={handleSave}
        />
      </div>
    </MainLayout>
  );
}
