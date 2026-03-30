import { useEffect, useMemo, useState } from "react";
import { Download, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { appointmentStatusBadgeToneMap, appointmentStatusLabelMap } from "@/lib/appointment-status";
import {
  appointmentsApi,
  professionalsApi,
  servicesApi,
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

export default function NoShowReport() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  const [fromInput, setFromInput] = useState(toInputDate(firstDayOfMonth));
  const [toInput, setToInput] = useState(toInputDate(today));
  const [professionalIdInput, setProfessionalIdInput] = useState("all");
  const [serviceIdInput, setServiceIdInput] = useState("all");
  const [clientQueryInput, setClientQueryInput] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    from: toInputDate(firstDayOfMonth),
    to: toInputDate(today),
    professionalId: "all",
    serviceId: "all",
    clientQuery: "",
  });
  const [currentAfterId, setCurrentAfterId] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);

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
        const response = await appointmentsApi.getNoShowReport({
          afterId: currentAfterId,
          limit: 20,
          from: activeFilters.from || undefined,
          to: activeFilters.to || undefined,
          professionalId: activeFilters.professionalId,
          serviceId: activeFilters.serviceId,
          clientQuery: activeFilters.clientQuery || undefined,
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
  }, [activeFilters, currentAfterId, reloadToken]);

  const pageNumber = cursorHistory.length + 1;

  const selectedProfessionalLabel = useMemo(() => {
    if (activeFilters.professionalId === "all") return "Todos os profissionais";
    return professionals.find((item) => item.id === activeFilters.professionalId)?.name || "Profissional filtrado";
  }, [activeFilters.professionalId, professionals]);

  const selectedServiceLabel = useMemo(() => {
    if (activeFilters.serviceId === "all") return "Todos os servicos";
    return services.find((item) => item.id === activeFilters.serviceId)?.name || "Servico filtrado";
  }, [activeFilters.serviceId, services]);

  const applyFilters = () => {
    setCursorHistory([]);
    setCurrentAfterId(undefined);
    setActiveFilters({
      from: fromInput,
      to: toInput,
      professionalId: professionalIdInput,
      serviceId: serviceIdInput,
      clientQuery: clientQueryInput.trim(),
    });
  };

  const clearFilters = () => {
    const defaultFrom = toInputDate(firstDayOfMonth);
    const defaultTo = toInputDate(today);
    setFromInput(defaultFrom);
    setToInput(defaultTo);
    setProfessionalIdInput("all");
    setServiceIdInput("all");
    setClientQueryInput("");
    setCursorHistory([]);
    setCurrentAfterId(undefined);
    setActiveFilters({
      from: defaultFrom,
      to: defaultTo,
      professionalId: "all",
      serviceId: "all",
      clientQuery: "",
    });
  };

  const handleNextPage = () => {
    if (!report?.nextAfterId) return;
    setCursorHistory((prev) => [...prev, currentAfterId ?? ""]);
    setCurrentAfterId(report.nextAfterId);
  };

  const handlePreviousPage = () => {
    setCursorHistory((prev) => {
      if (prev.length === 0) {
        setCurrentAfterId(undefined);
        return prev;
      }
      const nextHistory = [...prev];
      const previousCursor = nextHistory.pop();
      setCurrentAfterId(previousCursor || undefined);
      return nextHistory;
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
        clientQuery: activeFilters.clientQuery || undefined,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `no-show-${activeFilters.from || "inicio"}-${activeFilters.to || "hoje"}.csv`;
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
      subtitle="Lista operacional com filtros, exportacao e paginacao por cursor baseada no ID do ultimo registro."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtre por periodo, profissional, servico e cliente para localizar faltas rapidamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                <p className="text-xs text-muted-foreground">Cliente</p>
                <Input
                  placeholder="Nome, e-mail ou telefone"
                  value={clientQueryInput}
                  onChange={(event) => setClientQueryInput(event.target.value)}
                />
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

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Lista de no-show</CardTitle>
                <CardDescription>
                  {selectedProfessionalLabel} • {selectedServiceLabel}
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                {report ? `${report.totalItems} registro(s) encontrado(s)` : "Sem dados carregados"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Nao foi possivel carregar a lista</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Data e horario</th>
                    <th className="px-4 py-3 font-medium">Profissional</th>
                    <th className="px-4 py-3 font-medium">Servicos</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Observacoes</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                        Carregando registros de no-show...
                      </td>
                    </tr>
                  ) : report?.items.length ? (
                    report.items.map((item) => (
                      <tr key={item.appointmentId} className="border-t align-top">
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{item.clientName || "Cliente nao identificado"}</p>
                            <p className="text-xs text-muted-foreground">{item.clientPhone || "Telefone nao informado"}</p>
                            <p className="text-xs text-muted-foreground">{item.clientEmail || "E-mail nao informado"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-medium">{formatDateOnly(item.date)}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.startTime} - {item.endTime}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Criado em {item.createdAt ? formatDateTime(item.createdAt) : "-"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{item.professionalName || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p>{item.serviceNames.join(", ") || "Servico nao identificado"}</p>
                            <p className="text-xs text-muted-foreground">{item.totalServices} item(ns)</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{formatCurrency(item.totalPrice || 0)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={item.status}
                            labelMap={appointmentStatusLabelMap}
                            toneMap={appointmentStatusBadgeToneMap}
                            fallbackStatus="NO_SHOW"
                          />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.notes || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                        Nenhum registro de no-show encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-muted-foreground">
                Pagina {pageNumber} • Cursor atual: {currentAfterId || "inicio"}.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handlePreviousPage} disabled={cursorHistory.length === 0 || isLoading}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={handleNextPage} disabled={!report?.hasMore || isLoading}>
                  Proxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
