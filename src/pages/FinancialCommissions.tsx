import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Coins, Loader2, Wallet } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CommissionRuleSetEditor } from "@/components/commissions/CommissionRuleSetEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageErrorState } from "@/components/ui/page-states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { commissionApi, servicesApi, stockApi } from "@/lib/api";
import { useProfessionals } from "@/hooks/useProfessionals";
import { resolveUiError } from "@/lib/error-utils";
import type { Service } from "@/types";
import type { StockItem } from "@/types/stock";
import type {
  CommissionCycleResponse,
  CommissionReportResponse,
  CommissionRuleSetResponse,
  CommissionRuleSetUpsertRequest,
} from "@/types/commission";
import { toast } from "sonner";

const formatCurrency = (valueCents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((valueCents || 0) / 100);

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toDate = (value: Date) => value.toISOString().slice(0, 10);
  return { from: toDate(start), to: toDate(end) };
};

type ListResponse<T> = T[] | { items: T[] };

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
      const [reportResponse, rulesResponse, cyclesResponse, servicesResponse, productsResponse] = await Promise.all([
        commissionApi.getReport({
          from,
          to,
          status: status === "ALL" ? undefined : status,
        }),
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
        rulesResponse.items.find((item) => item.scopeType === "GLOBAL") || null
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
  }, [from, to, status]);

  const handleSaveGlobalRuleSet = async (
    payload: CommissionRuleSetUpsertRequest,
    existingRuleSetId?: string
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
      toast.error(resolveUiError(err, "Nao foi possivel salvar a configuracao global.").message);
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
    [cycles, from, to]
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
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
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

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total apurado</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(report?.totalAmountCents || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total em aberto</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(report?.totalOpenAmountCents || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total pago</p>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(report?.totalPaidAmountCents || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Lancamentos</p>
              <p className="text-xl font-bold text-primary">{report?.totalEntries || 0}</p>
            </CardContent>
          </Card>
        </div>

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
                  <p className="text-sm text-muted-foreground">Nenhum lancamento encontrado para o periodo.</p>
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
                          <TableCell className="text-right">{formatCurrency(item.serviceAmountCents)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.productAmountCents)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.manualAdjustmentAmountCents)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.openAmountCents)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.paidAmountCents)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(item.totalAmountCents)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/financeiro/comissoes/${item.professionalId}`)}
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
            <Card>
              <CardHeader>
                <CardTitle>Fechamento do periodo atual</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Periodo {from} ate {to}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={currentCycle ? "secondary" : "outline"}>
                      {currentCycle ? currentCycle.status : "Sem fechamento"}
                    </Badge>
                    {currentCycle ? (
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(currentCycle.totalAmountCents)} - {currentCycle.entryCount} lancamentos
                      </span>
                    ) : null}
                  </div>
                </div>
                {!currentCycle ? (
                  <Button onClick={() => void handleCloseCycle()} disabled={isClosingCycle}>
                    {isClosingCycle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Fechar ciclo
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historico de ciclos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!cycles.length ? (
                  <p className="text-sm text-muted-foreground">Nenhum ciclo registrado.</p>
                ) : (
                  cycles.map((cycle) => (
                    <div key={cycle.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {cycle.periodStart} ate {cycle.periodEnd}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(cycle.totalAmountCents)} - {cycle.entryCount} lancamentos
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={cycle.status === "PAID" ? "default" : "secondary"}>
                            {cycle.status === "PAID" ? "Pago" : "Fechado"}
                          </Badge>
                          {cycle.status !== "PAID" ? (
                            <Button
                              onClick={() => void handlePayCycle(cycle.id)}
                              disabled={payingCycleId === cycle.id}
                            >
                              {payingCycleId === cycle.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Marcar como pago
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      {cycle.status !== "PAID" ? (
                        <div className="mt-3 space-y-2">
                          <Label>Observacoes do pagamento</Label>
                          <Textarea
                            value={cyclePayNotes[cycle.id] || ""}
                            onChange={(event) =>
                              setCyclePayNotes((current) => ({
                                ...current,
                                [cycle.id]: event.target.value,
                              }))
                            }
                            placeholder="Opcional"
                          />
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ajustes">
            <Card>
              <CardHeader>
                <CardTitle>Ajuste manual auditado</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Select value={adjustmentProfessionalId} onValueChange={setAdjustmentProfessionalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((professional) => (
                        <SelectItem key={professional.id} value={professional.id}>
                          {professional.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor do ajuste (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={adjustmentAmount}
                    onChange={(event) => setAdjustmentAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Motivo</Label>
                  <Textarea
                    value={adjustmentReason}
                    onChange={(event) => setAdjustmentReason(event.target.value)}
                    placeholder="Descreva o motivo do ajuste manual."
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    onClick={() => void handleCreateAdjustment()}
                    disabled={isSubmittingAdjustment || !adjustmentProfessionalId || !adjustmentReason.trim()}
                  >
                    {isSubmittingAdjustment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
                    Registrar ajuste
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                  <Link to={`/profissionais/${professional.id}/comissao`}>{professional.name}</Link>
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
