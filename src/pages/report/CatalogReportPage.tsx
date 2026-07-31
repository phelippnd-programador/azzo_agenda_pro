import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
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
import { professionalsApi } from "@/lib/api/professionals";
import { reportsApi, type CatalogReportResponse } from "@/lib/api/reports";
import { formatCurrency, formatDateOnly } from "@/lib/format";
import type { Professional } from "@/types";

type PeriodPreset = "MONTH" | "QUARTER" | "CUSTOM";
type ExportFormat = "csv" | "xlsx";

const PAGE_SIZE = 50;

const reportOptions = [
  { key: "faturamento-servico", title: "Faturamento por servico", dependencies: ["Agenda"] },
  { key: "faturamento-profissional", title: "Faturamento por profissional", dependencies: ["Agenda"] },
  { key: "faturamento-meio-pagamento", title: "Faturamento por meio de pagamento", dependencies: ["Comanda"] },
  { key: "novos-clientes", title: "Novos clientes", dependencies: ["Clientes"] },
  { key: "clientes-inativos", title: "Clientes inativos", dependencies: ["Clientes"] },
  { key: "taxa-retorno", title: "Taxa de retorno", dependencies: ["Clientes", "Agenda"] },
  { key: "no-show-cancelamentos", title: "No-show e cancelamentos", dependencies: ["Agenda"] },
  { key: "ocupacao-profissional", title: "Ocupacao por profissional", dependencies: ["Agenda"] },
  { key: "ranking-servicos", title: "Ranking de servicos", dependencies: ["Agenda"] },
  { key: "curva-abc-clientes", title: "Curva ABC de clientes", dependencies: ["Clientes", "Agenda"] },
  { key: "descontos", title: "Descontos concedidos", dependencies: ["Comanda"] },
  { key: "comissoes-periodo", title: "Comissoes por periodo", dependencies: ["Comissoes"] },
  { key: "vendas-produtos", title: "Vendas de produtos", dependencies: ["Comanda", "Estoque"] },
  { key: "pacotes", title: "Pacotes", dependencies: ["Pacotes"] },
  { key: "aniversariantes", title: "Aniversariantes", dependencies: ["Clientes"] },
] as const;

const toInputDate = (value: Date) => value.toISOString().split("T")[0];

const getMonthRange = () => {
  const current = new Date();
  return { from: toInputDate(new Date(current.getFullYear(), current.getMonth(), 1)), to: toInputDate(current) };
};

const getQuarterRange = () => {
  const current = new Date();
  const start = new Date(current);
  start.setMonth(current.getMonth() - 3);
  return { from: toInputDate(start), to: toInputDate(current) };
};

const getListItems = <T,>(response: T[] | { items?: T[] } | null | undefined) =>
  Array.isArray(response) ? response : response?.items ?? [];

const labelColumn = (column: string) =>
  column
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const moneyColumnPattern = /(receita|valor|ticket|desconto|comissao|comissao|saldo|pago|faturamento|margem)/i;
const dateColumnPattern = /(data|date|ultima|aniversario|periodo)/i;

const formatCellValue = (column: string, value: unknown) => {
  if (value === null || typeof value === "undefined" || value === "") return "-";
  if (moneyColumnPattern.test(column)) return formatCurrency(String(value));
  if (dateColumnPattern.test(column) && typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatDateOnly(value);
  }
  if (typeof value === "number") return new Intl.NumberFormat("pt-BR").format(value);
  return String(value);
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function CatalogReportPage() {
  const monthRange = useMemo(() => getMonthRange(), []);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  const [reportKeyInput, setReportKeyInput] = useState(reportOptions[0].key);
  const [periodPresetInput, setPeriodPresetInput] = useState<PeriodPreset>("MONTH");
  const [fromInput, setFromInput] = useState(monthRange.from);
  const [toInput, setToInput] = useState(monthRange.to);
  const [professionalIdInput, setProfessionalIdInput] = useState("all");
  const [inactiveDaysInput, setInactiveDaysInput] = useState("90");
  const [activeFilters, setActiveFilters] = useState({
    reportKey: reportOptions[0].key,
    from: monthRange.from,
    to: monthRange.to,
    professionalId: "all",
    inactiveDays: "90",
    pageIndex: 0,
  });

  const [data, setData] = useState<CatalogReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const selectedReport = reportOptions.find((report) => report.key === activeFilters.reportKey) ?? reportOptions[0];
  const isInactiveReport = activeFilters.reportKey === "clientes-inativos";

  useEffect(() => {
    let cancelled = false;
    const loadProfessionals = async () => {
      try {
        setIsLoadingFilters(true);
        const response = await professionalsApi.getAll({ limit: 200 });
        if (!cancelled) setProfessionals(getListItems(response).filter((item) => item.isActive));
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
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await reportsApi.getCatalog(activeFilters.reportKey, {
          dataInicio: activeFilters.from,
          dataFim: activeFilters.to,
          professionalId: activeFilters.professionalId === "all" ? undefined : activeFilters.professionalId,
          inactiveDays: isInactiveReport ? Number(activeFilters.inactiveDays || 90) : undefined,
          pageIndex: activeFilters.pageIndex,
          pageSize: PAGE_SIZE,
        });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Nao foi possivel carregar o relatorio.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeFilters, isInactiveReport, reloadToken]);

  const applyPreset = (preset: PeriodPreset) => {
    setPeriodPresetInput(preset);
    if (preset === "MONTH") {
      const range = getMonthRange();
      setFromInput(range.from);
      setToInput(range.to);
    }
    if (preset === "QUARTER") {
      const range = getQuarterRange();
      setFromInput(range.from);
      setToInput(range.to);
    }
  };

  const applyFilters = () => {
    setActiveFilters({
      reportKey: reportKeyInput,
      from: fromInput,
      to: toInput,
      professionalId: professionalIdInput,
      inactiveDays: inactiveDaysInput,
      pageIndex: 0,
    });
  };

  const goToPage = (pageIndex: number) => {
    setActiveFilters((current) => ({ ...current, pageIndex: Math.max(0, pageIndex) }));
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      const blob = await reportsApi.exportCatalog(activeFilters.reportKey, {
        dataInicio: activeFilters.from,
        dataFim: activeFilters.to,
        professionalId: activeFilters.professionalId === "all" ? undefined : activeFilters.professionalId,
        inactiveDays: isInactiveReport ? Number(activeFilters.inactiveDays || 90) : undefined,
        format,
      });
      downloadBlob(blob, `${activeFilters.reportKey}-${activeFilters.from}-${activeFilters.to}.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel exportar o relatorio.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout
      title="Catalogo avancado de relatorios"
      subtitle="Consulte o lote F18 de relatorios detalhados sem duplicar telas operacionais."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Relatorio e filtros</CardTitle>
                <CardDescription>Escolha o relatorio, periodo e filtros opcionais para gerar a tabela.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => setReloadToken((previous) => previous + 1)} disabled={isLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
                <Button variant="outline" onClick={() => handleExport("csv")} disabled={isExporting || !data}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport("xlsx")} disabled={isExporting || !data}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  XLSX
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-2 xl:col-span-2">
                <p className="text-xs text-muted-foreground">Relatorio</p>
                <Select value={reportKeyInput} onValueChange={(value) => setReportKeyInput(value as typeof reportOptions[number]["key"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportOptions.map((report) => (
                      <SelectItem key={report.key} value={report.key}>
                        {report.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Periodo</p>
                <Select value={periodPresetInput} onValueChange={(value) => applyPreset(value as PeriodPreset)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTH">Mes</SelectItem>
                    <SelectItem value="QUARTER">Trimestre</SelectItem>
                    <SelectItem value="CUSTOM">Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Data inicial</p>
                <DateInput
                  value={fromInput}
                  onChange={(event) => {
                    setPeriodPresetInput("CUSTOM");
                    setFromInput(event.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Data final</p>
                <DateInput
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
                    <SelectValue placeholder="Todos" />
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
              {reportKeyInput === "clientes-inativos" ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Dias inativos</p>
                  <Input
                    type="number"
                    min={1}
                    value={inactiveDaysInput}
                    onChange={(event) => setInactiveDaysInput(event.target.value)}
                  />
                </div>
              ) : null}
            </div>
            <Button onClick={applyFilters}>Aplicar filtros</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>{data?.title ?? selectedReport.title}</CardTitle>
                <CardDescription>
                  {activeFilters.from} a {activeFilters.to} | Pagina {activeFilters.pageIndex + 1}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {(data?.dependencies?.length ? data.dependencies : selectedReport.dependencies).map((dependency) => (
                  <Badge key={dependency} variant="outline">{dependency}</Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Nao foi possivel carregar o relatorio</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {isLoading ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Carregando relatorio...
              </div>
            ) : !data || data.rows.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nenhum registro encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      {data.columns.map((column) => (
                        <TableHead key={column}>{labelColumn(column)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row, rowIndex) => (
                      <TableRow key={`${data.reportKey}-${activeFilters.pageIndex}-${rowIndex}`}>
                        {data.columns.map((column) => (
                          <TableCell key={column}>{formatCellValue(column, row[column])}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {data ? `${data.rows.length} registro(s) nesta pagina` : "Sem dados carregados"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeFilters.pageIndex === 0 || isLoading}
                  onClick={() => goToPage(activeFilters.pageIndex - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data?.hasMore || isLoading}
                  onClick={() => goToPage(activeFilters.pageIndex + 1)}
                >
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
