import { useEffect, useMemo, useState } from "react";
import { Download, Filter, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  appointmentsApi,
  professionalsApi,
  servicesApi,
  type AppointmentManagementReportResponse,
  type Professional,
  type Service,
} from "@/lib/api";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/appointment-status";
import { formatCurrency, formatDateOnly, formatDateTime } from "@/lib/format";
import { toast } from "sonner";

type PeriodPreset = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

const toInputDate = (value: Date) => value.toISOString().split("T")[0];

const getTodayRange = () => {
  const current = new Date();
  return { from: toInputDate(current), to: toInputDate(current) };
};

const getMonthRange = () => {
  const current = new Date();
  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
  return { from: toInputDate(firstDay), to: toInputDate(current) };
};

const getWeekRange = () => {
  const current = new Date();
  const start = new Date(current);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  return { from: toInputDate(start), to: toInputDate(current) };
};

const getListItems = <T,>(response: T[] | { items?: T[] } | null | undefined) =>
  Array.isArray(response) ? response : response?.items ?? [];

const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "PENDING", label: "Pendente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "COMPLETED", label: "Concluido" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "NO_SHOW", label: "Nao compareceu" },
];

const presetOptions: Array<{ value: PeriodPreset; label: string }> = [
  { value: "TODAY", label: "Hoje" },
  { value: "WEEK", label: "Semana" },
  { value: "MONTH", label: "Mes" },
  { value: "CUSTOM", label: "Customizado" },
];

const severityClassMap: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  opportunity: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const originLabelMap: Record<string, string> = {
  MANUAL: "Manual",
  SISTEMA: "Sistema",
  NAO_IDENTIFICADA: "Nao identificada",
};

export default function AppointmentManagementReport() {
  const monthRange = useMemo(() => getMonthRange(), []);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  const [periodPresetInput, setPeriodPresetInput] = useState<PeriodPreset>("MONTH");
  const [fromInput, setFromInput] = useState(monthRange.from);
  const [toInput, setToInput] = useState(monthRange.to);
  const [professionalIdInput, setProfessionalIdInput] = useState("all");
  const [serviceIdInput, setServiceIdInput] = useState("all");
  const [statusInput, setStatusInput] = useState("all");

  const [activeFilters, setActiveFilters] = useState({
    periodPreset: "MONTH" as PeriodPreset,
    from: monthRange.from,
    to: monthRange.to,
    professionalId: "all",
    serviceId: "all",
    status: "all",
  });

  const [report, setReport] = useState<AppointmentManagementReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadFilters = async () => {
      try {
        setIsLoadingFilters(true);
        const [professionalsResponse, servicesResponse] = await Promise.all([
          professionalsApi.getAll({ limit: 200 }),
          servicesApi.getAll({ limit: 200 }),
        ]);
        if (cancelled) return;
        setProfessionals(getListItems(professionalsResponse).filter((item) => item.isActive));
        setServices(getListItems(servicesResponse).filter((item) => item.isActive));
      } catch {
        if (!cancelled) {
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
        const response = await appointmentsApi.getManagementReport({
          from: activeFilters.from || undefined,
          to: activeFilters.to || undefined,
          professionalId: activeFilters.professionalId,
          serviceId: activeFilters.serviceId,
          status: activeFilters.status,
          limit: 100,
        });
        if (!cancelled) setReport(response);
      } catch (error) {
        if (!cancelled) {
          setReport(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Nao foi possivel carregar o relatorio gerencial de agendamentos."
          );
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

  const selectedStatusLabel = useMemo(
    () => statusOptions.find((option) => option.value === activeFilters.status)?.label || "Todos os status",
    [activeFilters.status]
  );

  const applyPreset = (preset: PeriodPreset) => {
    setPeriodPresetInput(preset);
    if (preset === "TODAY") {
      const range = getTodayRange();
      setFromInput(range.from);
      setToInput(range.to);
      return;
    }
    if (preset === "WEEK") {
      const range = getWeekRange();
      setFromInput(range.from);
      setToInput(range.to);
      return;
    }
    if (preset === "MONTH") {
      const range = getMonthRange();
      setFromInput(range.from);
      setToInput(range.to);
    }
  };

  const applyFilters = () => {
    setActiveFilters({
      periodPreset: periodPresetInput,
      from: fromInput,
      to: toInput,
      professionalId: professionalIdInput,
      serviceId: serviceIdInput,
      status: statusInput,
    });
  };

  const clearFilters = () => {
    const range = getMonthRange();
    setPeriodPresetInput("MONTH");
    setFromInput(range.from);
    setToInput(range.to);
    setProfessionalIdInput("all");
    setServiceIdInput("all");
    setStatusInput("all");
    setActiveFilters({
      periodPreset: "MONTH",
      from: range.from,
      to: range.to,
      professionalId: "all",
      serviceId: "all",
      status: "all",
    });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await appointmentsApi.exportManagementReport({
        from: activeFilters.from || undefined,
        to: activeFilters.to || undefined,
        professionalId: activeFilters.professionalId,
        serviceId: activeFilters.serviceId,
        status: activeFilters.status,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-agendamentos-${activeFilters.from || "inicio"}-${activeFilters.to || "hoje"}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Exportacao iniciada.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel exportar o relatorio gerencial."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout
      title="Relatorio gerencial de agendamentos"
      subtitle="Visao consolidada para leitura rapida da agenda, com foco em status, receita e oportunidades."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Use periodo rapido, profissional, servico e status para consolidar o relatorio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Periodo</p>
                <Select value={periodPresetInput} onValueChange={(value) => applyPreset(value as PeriodPreset)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {presetOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Data inicial</p>
                <Input
                  type="date"
                  value={fromInput}
                  onChange={(event) => {
                    setPeriodPresetInput("CUSTOM");
                    setFromInput(event.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Data final</p>
                <Input
                  type="date"
                  value={toInput}
                  onChange={(event) => {
                    setPeriodPresetInput("CUSTOM");
                    setToInput(event.target.value);
                  }}
                />
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
                <p className="text-xs text-muted-foreground">Status</p>
                <Select value={statusInput} onValueChange={setStatusInput}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
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
              <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exportando..." : "Baixar CSV"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de agendamentos</CardDescription>
              <CardTitle>{report?.totalAppointments ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Confirmados</CardDescription>
              <CardTitle>{report?.totalConfirmed ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendentes</CardDescription>
              <CardTitle>{report?.totalPending ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cancelados</CardDescription>
              <CardTitle>{report?.totalCancelled ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>No-show</CardDescription>
              <CardTitle>{report?.totalNoShow ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Receita prevista</CardDescription>
              <CardTitle>{formatCurrency(report?.totalRevenue ?? 0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Taxa de ocupacao</CardDescription>
              <CardTitle>{(report?.occupancyRate ?? 0).toFixed(1)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Taxa de cancelamento</CardDescription>
              <CardTitle>{(report?.cancellationRate ?? 0).toFixed(1)}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
              <CardDescription>
                Pontos que pedem acao imediata no periodo filtrado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report?.alerts?.length ? (
                report.alerts.map((signal) => (
                  <div
                    key={signal.code}
                    className={`rounded-lg border px-4 py-3 ${severityClassMap[signal.severity] ?? severityClassMap.info}`}
                  >
                    <div className="font-medium">{signal.title}</div>
                    <div className="text-sm opacity-90">{signal.description}</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum alerta relevante para os filtros aplicados.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Oportunidades</CardTitle>
              <CardDescription>
                Sinais de recuperacao, reoferta e ganho de ocupacao.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report?.opportunities?.length ? (
                report.opportunities.map((signal) => (
                  <div
                    key={signal.code}
                    className={`rounded-lg border px-4 py-3 ${severityClassMap[signal.severity] ?? severityClassMap.opportunity}`}
                  >
                    <div className="font-medium">{signal.title}</div>
                    <div className="text-sm opacity-90">{signal.description}</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma oportunidade adicional foi identificada.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Tabela de agendamentos</CardTitle>
                <CardDescription>
                  {selectedProfessionalLabel} • {selectedServiceLabel} • {selectedStatusLabel}
                </CardDescription>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div>
                  {report
                    ? `${report.totalItems} agendamento(s) no periodo ${formatDateOnly(report.startDate || monthRange.from)} a ${formatDateOnly(report.endDate || monthRange.to)}`
                    : "Sem dados carregados"}
                </div>
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

            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servico</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Sinais</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Carregando relatorio gerencial...
                      </TableCell>
                    </TableRow>
                  ) : report?.items?.length ? (
                    report.items.map((item) => (
                      <TableRow key={item.appointmentId}>
                        <TableCell className="align-top">
                          <div className="font-medium">{formatDateOnly(item.date)}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.startTime} - {item.endTime}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">{item.clientName || "-"}</TableCell>
                        <TableCell className="align-top">{item.serviceLabel || "-"}</TableCell>
                        <TableCell className="align-top">{item.professionalName || "-"}</TableCell>
                        <TableCell className="align-top">
                          <Badge variant="outline" className={getStatusBadgeColor(item.status)}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                            {originLabelMap[item.origin || "NAO_IDENTIFICADA"] || item.origin || "Nao identificado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap gap-1">
                            {item.flagNaoConfirmado ? <Badge variant="secondary">Nao confirmado</Badge> : null}
                            {item.flagHorarioVago ? <Badge variant="outline">Horario vago</Badge> : null}
                            {item.flagAbandonoFluxo ? <Badge variant="outline">Abandono</Badge> : null}
                            {!item.flagNaoConfirmado && !item.flagHorarioVago && !item.flagAbandonoFluxo ? (
                              <span className="text-xs text-muted-foreground">Sem sinais</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top">{formatCurrency(item.totalPrice)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Nenhum agendamento encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
