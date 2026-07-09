import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Grid3X3, Percent, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { professionalsApi } from "@/lib/api/professionals";
import { reportsApi, type HeatmapCell, type HeatmapReportResponse } from "@/lib/api/reports";
import type { Professional } from "@/types";

type PeriodPreset = "WEEK" | "MONTH" | "CUSTOM";

const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const hourLabels = Array.from({ length: 24 }, (_, hour) => hour);

const toInputDate = (value: Date) => value.toISOString().split("T")[0];

const getWeekRange = () => {
  const current = new Date();
  const start = new Date(current);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  return { from: toInputDate(start), to: toInputDate(current) };
};

const getMonthRange = () => {
  const current = new Date();
  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
  return { from: toInputDate(firstDay), to: toInputDate(current) };
};

const getListItems = <T,>(response: T[] | { items?: T[] } | null | undefined) =>
  Array.isArray(response) ? response : response?.items ?? [];

const formatPercent = (value: number | null | undefined) =>
  `${(Number.isFinite(Number(value)) ? Number(value) : 0).toFixed(1)}%`;

const formatMinutes = (value: number) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
};

const getCellClass = (cell?: HeatmapCell) => {
  if (!cell || cell.minutosDisponiveis <= 0) {
    return "border-dashed border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600";
  }

  const percent = Number(cell.ocupacaoPercent ?? 0);
  if (percent >= 70) {
    return "border-emerald-300 bg-emerald-100 text-emerald-950 hover:bg-emerald-200 dark:border-emerald-500/35 dark:bg-emerald-500/20 dark:text-emerald-100";
  }
  if (percent >= 35) {
    return "border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200 dark:border-amber-500/35 dark:bg-amber-500/20 dark:text-amber-100";
  }
  return "border-sky-300 bg-sky-100 text-sky-950 hover:bg-sky-200 dark:border-sky-500/35 dark:bg-sky-500/20 dark:text-sky-100";
};

const getCellByDayAndHour = (report: HeatmapReportResponse | null, day: number, hour: number) =>
  report?.matrix?.flat().find((cell) => cell.diaSemana === day && cell.hora === hour);

export default function HeatmapReportPage() {
  const monthRange = useMemo(() => getMonthRange(), []);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  const [periodPresetInput, setPeriodPresetInput] = useState<PeriodPreset>("MONTH");
  const [fromInput, setFromInput] = useState(monthRange.from);
  const [toInput, setToInput] = useState(monthRange.to);
  const [professionalIdInput, setProfessionalIdInput] = useState("all");
  const [activeFilters, setActiveFilters] = useState({
    periodPreset: "MONTH" as PeriodPreset,
    from: monthRange.from,
    to: monthRange.to,
    professionalId: "all",
  });

  const [report, setReport] = useState<HeatmapReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadProfessionals = async () => {
      try {
        setIsLoadingFilters(true);
        const response = await professionalsApi.getAll({ limit: 200 });
        if (!cancelled) {
          setProfessionals(getListItems(response).filter((professional) => professional.isActive));
        }
      } catch {
        if (!cancelled) setProfessionals([]);
      } finally {
        if (!cancelled) setIsLoadingFilters(false);
      }
    };
    void loadProfessionals();
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
        const response = await reportsApi.getHeatmap({
          dataInicio: activeFilters.from || undefined,
          dataFim: activeFilters.to || undefined,
          professionalId: activeFilters.professionalId === "all" ? undefined : activeFilters.professionalId,
        });
        if (!cancelled) setReport(response);
      } catch (error) {
        if (!cancelled) {
          setReport(null);
          setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o mapa de ocupacao.");
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

  const applyPreset = (preset: PeriodPreset) => {
    setPeriodPresetInput(preset);
    if (preset === "WEEK") {
      const range = getWeekRange();
      setFromInput(range.from);
      setToInput(range.to);
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
    });
  };

  const clearFilters = () => {
    const range = getMonthRange();
    setPeriodPresetInput("MONTH");
    setFromInput(range.from);
    setToInput(range.to);
    setProfessionalIdInput("all");
    setActiveFilters({
      periodPreset: "MONTH",
      from: range.from,
      to: range.to,
      professionalId: "all",
    });
  };

  const cells = useMemo(() => report?.matrix?.flat() ?? [], [report]);
  const summary = useMemo(() => {
    const availableCells = cells.filter((cell) => cell.minutosDisponiveis > 0);
    const totalAvailable = availableCells.reduce((total, cell) => total + cell.minutosDisponiveis, 0);
    const totalOccupied = availableCells.reduce((total, cell) => total + cell.minutosOcupados, 0);
    const totalAppointments = availableCells.reduce((total, cell) => total + cell.agendamentos, 0);
    const busiestCell = availableCells.reduce<HeatmapCell | null>((best, cell) => {
      if (!best) return cell;
      return Number(cell.ocupacaoPercent ?? 0) > Number(best.ocupacaoPercent ?? 0) ? cell : best;
    }, null);

    return {
      totalAppointments,
      totalAvailable,
      totalOccupied,
      occupancy: totalAvailable > 0 ? (totalOccupied / totalAvailable) * 100 : 0,
      availableSlots: availableCells.length,
      busiestCell,
    };
  }, [cells]);

  const selectedProfessionalLabel = useMemo(() => {
    if (activeFilters.professionalId === "all") return "Todos os profissionais";
    return professionals.find((professional) => professional.id === activeFilters.professionalId)?.name ?? "Profissional filtrado";
  }, [activeFilters.professionalId, professionals]);

  return (
    <MainLayout
      title="Mapa de ocupacao"
      subtitle="Veja os horarios mais ocupados e os pontos de ociosidade da agenda."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>
                  Analise a ocupacao por periodo e profissional sem alterar os dados da agenda.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setReloadToken((previous) => previous + 1)} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Periodo</p>
                <Select value={periodPresetInput} onValueChange={(value) => applyPreset(value as PeriodPreset)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEK">Semana</SelectItem>
                    <SelectItem value="MONTH">Mes</SelectItem>
                    <SelectItem value="CUSTOM">Customizado</SelectItem>
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
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={applyFilters}>Aplicar filtros</Button>
              <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Ocupacao media
              </CardDescription>
              <CardTitle>{formatPercent(summary.occupancy)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Tempo ocupado
              </CardDescription>
              <CardTitle>{formatMinutes(summary.totalOccupied)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Agendamentos
              </CardDescription>
              <CardTitle>{summary.totalAppointments}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Melhor horario
              </CardDescription>
              <CardTitle>
                {summary.busiestCell
                  ? `${dayLabels[summary.busiestCell.diaSemana] ?? "-"} ${String(summary.busiestCell.hora).padStart(2, "0")}h`
                  : "-"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Grade de ocupacao</CardTitle>
                <CardDescription>
                  {selectedProfessionalLabel} | {report?.dataInicio ?? activeFilters.from} a {report?.dataFim ?? activeFilters.to}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">Baixa</span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">Media</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">Alta</span>
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

            {isLoading ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Carregando mapa de ocupacao...
              </div>
            ) : cells.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nenhum dado de ocupacao encontrado para os filtros selecionados.
              </div>
            ) : (
              <TooltipProvider delayDuration={120}>
                <div className="overflow-x-auto">
                  <div className="min-w-[1160px]">
                    <div className="grid grid-cols-[72px_repeat(24,minmax(40px,1fr))] gap-1">
                      <div className="h-9" />
                      {hourLabels.map((hour) => (
                        <div key={hour} className="flex h-9 items-center justify-center text-xs font-medium text-muted-foreground">
                          {String(hour).padStart(2, "0")}h
                        </div>
                      ))}
                      {dayLabels.map((label, day) => (
                        <div key={label} className="contents">
                          <div className="flex h-12 items-center text-sm font-medium text-foreground">{label}</div>
                          {hourLabels.map((hour) => {
                            const cell = getCellByDayAndHour(report, day, hour);
                            return (
                              <Tooltip key={`${day}-${hour}`}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`flex h-12 items-center justify-center rounded-md border text-[11px] font-semibold transition-colors ${getCellClass(cell)}`}
                                  >
                                    {cell?.minutosDisponiveis ? formatPercent(cell.ocupacaoPercent) : "-"}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-64">
                                  <div className="space-y-1">
                                    <p className="font-medium">
                                      {label} {String(hour).padStart(2, "0")}:00
                                    </p>
                                    <p>Ocupacao: {formatPercent(cell?.ocupacaoPercent)}</p>
                                    <p>Agendamentos: {cell?.agendamentos ?? 0}</p>
                                    <p>Ocupado: {formatMinutes(cell?.minutosOcupados ?? 0)}</p>
                                    <p>Disponivel: {formatMinutes(cell?.minutosDisponiveis ?? 0)}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
