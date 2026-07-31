import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Package, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
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
import { reportsApi } from "@/lib/api/reports";
import type { EstoqueReportResponse } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/format";

type PeriodPreset = "WEEK" | "MONTH" | "QUARTER" | "CUSTOM";

const toInputDate = (d: Date) => d.toISOString().split("T")[0];

const getMonthRange = () => {
  const d = new Date();
  return { from: toInputDate(new Date(d.getFullYear(), d.getMonth(), 1)), to: toInputDate(d) };
};

const tipoOptions = [
  { value: "all", label: "Todos os tipos" },
  { value: "ENTRADA", label: "Entradas" },
  { value: "SAIDA", label: "Saidas" },
  { value: "AJUSTE", label: "Ajustes" },
];

function downloadCsv(data: EstoqueReportResponse, from: string, to: string) {
  const headers = ["Tipo", "Item", "Unidade", "Quantidade", "Saldo Anterior", "Saldo Posterior", "Valor Total", "Origem", "Motivo", "Data"];
  const rows = data.items.map((i) => [
    i.tipo, i.itemNome, i.unidadeMedida ?? "", i.quantidade, i.saldoAnterior, i.saldoPosterior,
    i.valorTotalMovimentacao ?? "", i.origem ?? "", i.motivo ?? "", i.createdAt ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["ï»¿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-estoque-${from}-${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const tipoColor = { ENTRADA: "default" as const, SAIDA: "destructive" as const, AJUSTE: "secondary" as const };
const tipoLabel = { ENTRADA: "Entrada", SAIDA: "Saida", AJUSTE: "Ajuste" };

export default function StockReportPage() {
  const monthRange = useMemo(() => getMonthRange(), []);

  const [presetInput, setPresetInput] = useState<PeriodPreset>("MONTH");
  const [fromInput, setFromInput] = useState(monthRange.from);
  const [toInput, setToInput] = useState(monthRange.to);
  const [tipoInput, setTipoInput] = useState("all");

  const [activeFilters, setActiveFilters] = useState({ from: monthRange.from, to: monthRange.to, tipo: "all" });
  const [data, setData] = useState<EstoqueReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await reportsApi.getEstoque({
          from: activeFilters.from || undefined,
          to: activeFilters.to || undefined,
          tipo: activeFilters.tipo !== "all" ? activeFilters.tipo : undefined,
        });
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar relatorio de estoque.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeFilters, reloadToken]);

  const applyPreset = (preset: PeriodPreset) => {
    setPresetInput(preset);
    const d = new Date();
    if (preset === "WEEK") {
      const start = new Date(d);
      start.setDate(d.getDate() - 7);
      setFromInput(toInputDate(start));
      setToInput(toInputDate(d));
    } else if (preset === "MONTH") {
      const r = getMonthRange();
      setFromInput(r.from);
      setToInput(r.to);
    } else if (preset === "QUARTER") {
      const start = new Date(d);
      start.setMonth(d.getMonth() - 3);
      setFromInput(toInputDate(start));
      setToInput(toInputDate(d));
    }
  };

  const applyFilters = () => setActiveFilters({ from: fromInput, to: toInput, tipo: tipoInput });

  const presets: Array<{ value: PeriodPreset; label: string }> = [
    { value: "WEEK", label: "7 dias" },
    { value: "MONTH", label: "Mes" },
    { value: "QUARTER", label: "Trimestre" },
    { value: "CUSTOM", label: "Customizado" },
  ];

  return (
    <MainLayout
      title="Relatorio de estoque"
      subtitle="Leitura consolidada das movimentacoes de entrada, saida e ajuste."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Filtros e acoes</CardTitle>
                <CardDescription>
                  Ajuste o periodo e o tipo de movimentacao para consolidar o relatorio.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setReloadToken((t) => t + 1)}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
                {data && (
                  <Button
                    data-tour="stock-report-export"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => downloadCsv(data, activeFilters.from, activeFilters.to)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent data-tour="stock-report-filters" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <Button
                  key={p.value}
                  variant={presetInput === p.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Data inicial</p>
                <DateInput aria-label="Data inicial"
                  value={fromInput}
                  onChange={(e) => {
                    setFromInput(e.target.value);
                    setPresetInput("CUSTOM");
                  }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Data final</p>
                <DateInput aria-label="Data final"
                  value={toInput}
                  onChange={(e) => {
                    setToInput(e.target.value);
                    setPresetInput("CUSTOM");
                  }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <Select value={tipoInput} onValueChange={setTipoInput}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full sm:w-auto" onClick={applyFilters}>
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <div className="text-sm text-destructive">{error}</div>}

        {data?.summary && (
          <div data-tour="stock-report-summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><ArrowDown className="w-3 h-3 text-success" /> Entradas</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">{data.summary.totalEntradas}</p><p className="text-xs text-muted-foreground">{formatCurrency(data.summary.valorTotalEntradas)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUp className="w-3 h-3 text-destructive" /> Saidas</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">{data.summary.totalSaidas}</p><p className="text-xs text-muted-foreground">{formatCurrency(data.summary.valorTotalSaidas)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Ajustes</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">{data.summary.totalAjustes}</p></CardContent>
            </Card>
            <Card className={data.summary.itensAbaixoMinimo > 0 ? "border-amber-300" : ""}>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3 text-amber-500" /> Abaixo do Minimo</CardTitle></CardHeader>
              <CardContent><p className={`text-2xl font-semibold ${data.summary.itensAbaixoMinimo > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>{data.summary.itensAbaixoMinimo}</p></CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimentacoes</CardTitle>
            <CardDescription>Historico detalhado das movimentacoes retornadas para o periodo filtrado.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : !data || data.items.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma movimentacao encontrada.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Saldo Anterior</TableHead>
                      <TableHead className="text-right">Saldo Posterior</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell><Badge variant={tipoColor[item.tipo] ?? "secondary"} className="text-xs">{tipoLabel[item.tipo] ?? item.tipo}</Badge></TableCell>
                        <TableCell className="text-sm font-medium">{item.itemNome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.unidadeMedida ?? "-"}</TableCell>
                        <TableCell className="text-right text-sm">{Number(item.quantidade).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm">{Number(item.saldoAnterior).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm">{Number(item.saldoPosterior).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm">{item.valorTotalMovimentacao ? formatCurrency(item.valorTotalMovimentacao) : "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.origem ?? "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.createdAt ? item.createdAt.split("T")[0] : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
