import { useEffect, useMemo, useState } from "react";
import { Download, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  appointmentsApi,
  clientsApi,
  professionalsApi,
  servicesApi,
  type Client,
  type NoShowGroupBy,
  type NoShowReportPageResponse,
  type Professional,
  type Service,
} from "@/lib/api";
import { formatCurrency, formatDateOnly, formatDateTime } from "@/lib/format";

const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

const toInputDate = (value: Date) => value.toISOString().split("T")[0];

const getListItems = <T,>(response: T[] | { items?: T[] } | null | undefined) =>
  Array.isArray(response) ? response : response?.items ?? [];

const groupByOptions: Array<{ value: NoShowGroupBy; label: string }> = [
  { value: "DAY", label: "Dia" },
  { value: "PROFESSIONAL", label: "Profissional" },
  { value: "CLIENT", label: "Cliente" },
  { value: "SERVICE", label: "Servico" },
];

const formatGroupLabel = (groupBy: NoShowGroupBy, value?: string) => {
  if (!value) return "-";
  return groupBy === "DAY" ? formatDateOnly(value) : value;
};

export default function NoShowReport() {
  const [clients, setClients] = useState<Client[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  const [fromInput, setFromInput] = useState(toInputDate(firstDayOfMonth));
  const [toInput, setToInput] = useState(toInputDate(today));
  const [professionalIdInput, setProfessionalIdInput] = useState("all");
  const [serviceIdInput, setServiceIdInput] = useState("all");
  const [clientIdsInput, setClientIdsInput] = useState<string[]>([]);
  const [groupByInput, setGroupByInput] = useState<NoShowGroupBy>("DAY");

  const [activeFilters, setActiveFilters] = useState({
    from: toInputDate(firstDayOfMonth),
    to: toInputDate(today),
    professionalId: "all",
    serviceId: "all",
    clientIds: [] as string[],
    groupBy: "DAY" as NoShowGroupBy,
  });

  const [report, setReport] = useState<NoShowReportPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadFilters = async () => {
      try {
        setIsLoadingFilters(true);
        const [clientsResponse, professionalsResponse, servicesResponse] = await Promise.all([
          clientsApi.getAll({ limit: 500 }),
          professionalsApi.getAll({ limit: 200 }),
          servicesApi.getAll({ limit: 200 }),
        ]);
        if (cancelled) return;
        setClients(getListItems(clientsResponse));
        setProfessionals(getListItems(professionalsResponse).filter((item) => item.isActive));
        setServices(getListItems(servicesResponse).filter((item) => item.isActive));
      } catch {
        if (!cancelled) {
          setClients([]);
          setProfessionals([]);
          setServices([]);
        }
      } finally {
        if (!cancelled) setIsLoadingFilters(false);
      }
    };
    void loadFilters();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadReport = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await appointmentsApi.getNoShowReport({
          from: activeFilters.from || undefined,
          to: activeFilters.to || undefined,
          professionalId: activeFilters.professionalId,
          serviceId: activeFilters.serviceId,
          clientIds: activeFilters.clientIds,
          groupBy: activeFilters.groupBy,
        });
        if (!cancelled) setReport(response);
      } catch (error) {
        if (!cancelled) {
          setReport(null);
          setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o relatorio de no-show.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadReport();
    return () => {
      cancelled = true;
    };
  }, [activeFilters, reloadToken]);

  const selectedProfessionalLabel = useMemo(() => {
    if (activeFilters.professionalId === "all") return "Todos os profissionais";
    return professionals.find((item) => item.id === activeFilters.professionalId)?.name || "Profissional filtrado";
  }, [activeFilters.professionalId, professionals]);

  const selectedServiceLabel = useMemo(() => {
    if (activeFilters.serviceId === "all") return "Todos os servicos";
    return services.find((item) => item.id === activeFilters.serviceId)?.name || "Servico filtrado";
  }, [activeFilters.serviceId, services]);

  const selectedGroupingLabel = useMemo(
    () => groupByOptions.find((option) => option.value === activeFilters.groupBy)?.label || "Dia",
    [activeFilters.groupBy]
  );

  const groups = report?.groups ?? [];
  const noShowRateLabel = `${(report?.noShowRate ?? 0).toFixed(1)}%`;

  const applyFilters = () => {
    setActiveFilters({
      from: fromInput,
      to: toInput,
      professionalId: professionalIdInput,
      serviceId: serviceIdInput,
      clientIds: clientIdsInput,
      groupBy: groupByInput,
    });
  };

  const clearFilters = () => {
    const defaultFrom = toInputDate(firstDayOfMonth);
    const defaultTo = toInputDate(today);
    setFromInput(defaultFrom);
    setToInput(defaultTo);
    setProfessionalIdInput("all");
    setServiceIdInput("all");
    setClientIdsInput([]);
    setGroupByInput("DAY");
    setActiveFilters({
      from: defaultFrom,
      to: defaultTo,
      professionalId: "all",
      serviceId: "all",
      clientIds: [],
      groupBy: "DAY",
    });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await appointmentsApi.exportNoShowReport({
        from: activeFilters.from || undefined,
        to: activeFilters.to || undefined,
        professionalId: activeFilters.professionalId,
        serviceId: activeFilters.serviceId,
        clientIds: activeFilters.clientIds,
        groupBy: activeFilters.groupBy,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `no-show-${activeFilters.groupBy.toLowerCase()}-${activeFilters.from || "inicio"}-${activeFilters.to || "hoje"}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Exportacao iniciada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao exportar dados de no-show.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout
      title="Relatorio de no-show"
      subtitle="Visao quantitativa com totais do periodo e agrupamento por dia, profissional ou cliente."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtre por periodo, profissional, servico, cliente e tipo de agrupamento do relatorio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Periodo inicial</p>
                <Input type="date" value={fromInput} onChange={(event) => setFromInput(event.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Periodo final</p>
                <Input type="date" value={toInput} onChange={(event) => setToInput(event.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Profissional</p>
                <Select value={professionalIdInput} onValueChange={setProfessionalIdInput} disabled={isLoadingFilters}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    {professionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Servico</p>
                <Select value={serviceIdInput} onValueChange={setServiceIdInput} disabled={isLoadingFilters}>
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
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Clientes</p>
                <MultiSelect
                  options={clients.map((client) => ({
                    value: client.id,
                    label: client.name,
                  }))}
                  value={clientIdsInput}
                  onValueChange={setClientIdsInput}
                  placeholder="Todos os clientes"
                  searchPlaceholder="Buscar cliente..."
                  emptyText="Nenhum cliente encontrado."
                  disabled={isLoadingFilters}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Agrupar por</p>
                <Select value={groupByInput} onValueChange={(value) => setGroupByInput(value as NoShowGroupBy)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupByOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={applyFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Aplicar filtros
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
              <Button variant="outline" onClick={() => setReloadToken((prev) => prev + 1)} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
              <Button variant="secondary" onClick={() => void handleExport()} disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Baixando..." : "Baixar dados"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total no-show</CardDescription>
              <CardTitle>{report?.totalNoShows ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Taxa de no-show</CardDescription>
              <CardTitle>{noShowRateLabel}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Receita em risco</CardDescription>
              <CardTitle>{formatCurrency(report?.revenueAtRisk ?? 0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Periodo anterior</CardDescription>
              <CardTitle>{report?.previousPeriodNoShows ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ultimos 7 dias</CardDescription>
              <CardTitle>{report?.lastSevenDaysNoShows ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Agendamentos concluidos</CardDescription>
              <CardTitle>{report?.completedAppointments ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Resumo agrupado</CardTitle>
                <CardDescription>
                  {selectedGroupingLabel} • {selectedProfessionalLabel} • {selectedServiceLabel}
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{report ? `${report.totalNoShows ?? 0} no-show(s) no periodo` : "Sem dados carregados"}</div>
                <div>{report ? `${groups.length} agrupamento(s) retornado(s)` : ""}</div>
                <div>{report?.lastUpdatedAt ? `Atualizado em ${formatDateTime(report.lastUpdatedAt)}` : ""}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Nao foi possivel carregar o relatorio</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-[720px] w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Agrupamento</th>
                    <th className="px-4 py-3 font-medium">Total no-show</th>
                    <th className="px-4 py-3 font-medium">Receita em risco</th>
                    <th className="px-4 py-3 font-medium">Participacao</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                        Carregando resumo de no-show...
                      </td>
                    </tr>
                  ) : groups.length ? (
                    groups.map((group) => {
                      const percentage =
                        (report?.totalNoShows ?? 0) > 0 ? (group.totalNoShows / (report?.totalNoShows ?? 1)) * 100 : 0;
                      return (
                        <tr key={`${group.key}-${group.label}`} className="border-t align-top">
                          <td className="px-4 py-3 font-medium">
                            {formatGroupLabel(activeFilters.groupBy, group.label)}
                          </td>
                          <td className="px-4 py-3">{group.totalNoShows}</td>
                          <td className="px-4 py-3">{formatCurrency(group.revenueAtRisk)}</td>
                          <td className="px-4 py-3">{percentage.toFixed(1)}%</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                        Nenhum registro de no-show encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
