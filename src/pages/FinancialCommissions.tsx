import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CommissionRuleSetEditor } from "@/components/commissions/CommissionRuleSetEditor";
import { CommissionCyclesTab } from "@/components/commissions/CommissionCyclesTab";
import { CommissionAdjustmentsTab } from "@/components/commissions/CommissionAdjustmentsTab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageErrorState } from "@/components/ui/page-states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { commissionApi, servicesApi, stockApi } from "@/lib/api";
import { useProfessionals } from "@/hooks/useProfessionals";
import { resolveUiError } from "@/lib/error-utils";
import { formatCurrencyCents as formatCurrency, toDateKey } from "@/lib/format";
import type { Service } from "@/types";
import type { StockItem } from "@/types/stock";
import type {
  CommissionCycleResponse,
  CommissionReportResponse,
  CommissionRuleSetResponse,
  CommissionRuleSetUpsertRequest,
} from "@/types/commission";
import { toast } from "sonner";

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toDateKey(start), to: toDateKey(end) };
};

export default function FinancialCommissions() {
  const navigate = useNavigate();
  const { professionals, isLoading: isLoadingProfessionals } = useProfessionals();
  const [activeTab, setActiveTab] = useState("resumo");
  const [from, setFrom] = useState(getMonthRange().from);
  const [to, setTo] = useState(getMonthRange().to);
  const [status, setStatus] = useState<"ALL" | "OPEN" | "PAID" | "REVERSED">("ALL");
  const [report, setReport] = useState<CommissionReportResponse | null>(null);
  const [cycles, setCycles] = useState<CommissionCycleResponse[]>([]);
  const [globalRuleSet, setGlobalRuleSet] = useState<CommissionRuleSetResponse | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<StockItem[]>([]);
  const [adjustmentProfessionalId, setAdjustmentProfessionalId] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("0.00");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [cyclePayNotes, setCyclePayNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [isClosingCycle, setIsClosingCycle] = useState(false);
  const [payingCycleId, setPayingCycleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [reportResponse, rulesResponse, cyclesResponse, servicesResponse, productsResponse] =
        await Promise.all([
          commissionApi.getReport({ from, to, status: status === "ALL" ? undefined : status }),
          commissionApi.listRuleSets({ activeOnly: false }),
          commissionApi.listCycles(),
          servicesApi.getAll(),
          stockApi.getItems({ limit: 200 }),
        ]);

      const serviceItems = Array.isArray(servicesResponse)
        ? servicesResponse
        : servicesResponse.items || [];
      const productItems = Array.isArray(productsResponse)
        ? productsResponse
        : productsResponse.items || [];

      setReport(reportResponse);
      setGlobalRuleSet(
        rulesResponse.items.find((item) => item.scopeType === "GLOBAL") || null,
      );
      setCycles(cyclesResponse.items);
      setServices(serviceItems);
      setProducts(productItems);
      setError(null);
    } catch (err) {
      setError(resolveUiError(err, "Nao foi possivel carregar as comissoes.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [from, to, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveGlobalRuleSet = async (
    payload: CommissionRuleSetUpsertRequest,
    existingRuleSetId?: string,
  ) => {
    try {
      setIsSavingRules(true);
      if (existingRuleSetId) {
        await commissionApi.updateRuleSet(existingRuleSetId, payload);
      } else {
        await commissionApi.createRuleSet(payload);
      }
      toast.success("Configuracao global de comissao salva.");
      await loadData();
    } catch (err) {
      toast.error(
        resolveUiError(err, "Nao foi possivel salvar a configuracao global.").message,
      );
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleCreateAdjustment = async () => {
    try {
      setIsSubmittingAdjustment(true);
      await commissionApi.createAdjustment({
        professionalId: adjustmentProfessionalId,
        amountCents: Math.round(Number(adjustmentAmount || 0) * 100),
        reason: adjustmentReason.trim(),
      });
      toast.success("Ajuste manual registrado.");
      setAdjustmentAmount("0.00");
      setAdjustmentReason("");
      await loadData();
    } catch (err) {
      toast.error(resolveUiError(err, "Nao foi possivel registrar o ajuste.").message);
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const handleCloseCycle = async () => {
    try {
      setIsClosingCycle(true);
      await commissionApi.closeCycle(from, to);
      toast.success("Ciclo fechado com sucesso.");
      await loadData();
    } catch (err) {
      toast.error(resolveUiError(err, "Nao foi possivel fechar o ciclo.").message);
    } finally {
      setIsClosingCycle(false);
    }
  };

  const handlePayCycle = async (cycleId: string) => {
    try {
      setPayingCycleId(cycleId);
      await commissionApi.payCycle(cycleId, cyclePayNotes[cycleId]);
      toast.success("Ciclo marcado como pago.");
      await loadData();
    } catch (err) {
      toast.error(resolveUiError(err, "Nao foi possivel marcar o ciclo como pago.").message);
    } finally {
      setPayingCycleId(null);
    }
  };

  const currentCycle = useMemo(
    () => cycles.find((cycle) => cycle.periodStart === from && cycle.periodEnd === to) || null,
    [cycles, from, to],
  );

  if (isLoading || isLoadingProfessionals) {
    return (
      <MainLayout title="Comissoes" subtitle="Consolidacao, fechamento e configuracao">
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Comissoes" subtitle="Consolidacao, fechamento e configuracao">
        <PageErrorState
          title="Nao foi possivel carregar as comissoes"
          description={error}
          action={{ label: "Tentar novamente", onClick: () => void loadData() }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Comissoes" subtitle="Consolidacao, fechamento e configuracao">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="OPEN">Em aberto</SelectItem>
                  <SelectItem value="PAID">Pagos</SelectItem>
                  <SelectItem value="REVERSED">Revertidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => void loadData()}>
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total apurado</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(report?.totalAmountCents || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total em aberto</p>
              <p className="text-xl font-bold text-amber-700">
                {formatCurrency(report?.totalOpenAmountCents || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total pago</p>
              <p className="text-xl font-bold text-emerald-700">
                {formatCurrency(report?.totalPaidAmountCents || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Lancamentos</p>
              <p className="text-xl font-bold text-primary">{report?.totalEntries || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 sm:grid-cols-4">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="configuracao">Regra global</TabsTrigger>
            <TabsTrigger value="ciclos">Ciclos</TabsTrigger>
            <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo por profissional</CardTitle>
              </CardHeader>
              <CardContent>
                {!report?.items.length ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum lancamento encontrado para o periodo.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profissional</TableHead>
                        <TableHead className="text-right">Servico</TableHead>
                        <TableHead className="text-right">Produto</TableHead>
                        <TableHead className="text-right">Ajustes</TableHead>
                        <TableHead className="text-right">Em aberto</TableHead>
                        <TableHead className="text-right">Pago</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Detalhe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.items.map((item) => (
                        <TableRow key={item.professionalId}>
                          <TableCell className="font-medium">{item.professionalName}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.serviceAmountCents)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.productAmountCents)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.manualAdjustmentAmountCents)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.openAmountCents)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.paidAmountCents)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.totalAmountCents)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/financeiro/comissoes/${item.professionalId}`)
                              }
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracao">
            <CommissionRuleSetEditor
              title="Regra global do salao"
              scopeType="GLOBAL"
              existingRuleSet={globalRuleSet}
              services={services}
              products={products}
              isSaving={isSavingRules}
              onSave={handleSaveGlobalRuleSet}
            />
          </TabsContent>

          <TabsContent value="ciclos" className="space-y-4">
            <CommissionCyclesTab
              from={from}
              to={to}
              cycles={cycles}
              currentCycle={currentCycle}
              isClosingCycle={isClosingCycle}
              payingCycleId={payingCycleId}
              cyclePayNotes={cyclePayNotes}
              onCloseCycle={() => void handleCloseCycle()}
              onPayCycle={(id) => void handlePayCycle(id)}
              onCyclePayNotesChange={(id, value) =>
                setCyclePayNotes((prev) => ({ ...prev, [id]: value }))
              }
            />
          </TabsContent>

          <TabsContent value="ajustes">
            <CommissionAdjustmentsTab
              professionals={professionals}
              adjustmentProfessionalId={adjustmentProfessionalId}
              adjustmentAmount={adjustmentAmount}
              adjustmentReason={adjustmentReason}
              isSubmittingAdjustment={isSubmittingAdjustment}
              onChangeProfessionalId={setAdjustmentProfessionalId}
              onChangeAmount={setAdjustmentAmount}
              onChangeReason={setAdjustmentReason}
              onSubmit={() => void handleCreateAdjustment()}
            />
          </TabsContent>
        </Tabs>

        {/* Quick access */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Acesso rapido por profissional</p>
              <p className="text-sm text-muted-foreground">
                Configure regras especificas e acompanhe o detalhamento individual.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {professionals.slice(0, 4).map((professional) => (
                <Button key={professional.id} variant="outline" asChild>
                  <Link to={`/profissionais/${professional.id}/comissao`}>
                    {professional.name}
                  </Link>
                </Button>
              ))}
              {professionals.length > 4 ? (
                <Badge variant="secondary">+{professionals.length - 4} profissionais</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
