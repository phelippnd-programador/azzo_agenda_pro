import { useRef, useEffect, useMemo, useState } from "react";
import { BarChart2, Printer, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { reportsApi } from "@/lib/api/reports";
import type { GerencialReportResponse } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/format";

type PeriodPreset = "WEEK" | "MONTH" | "QUARTER" | "CUSTOM";

const toInputDate = (d: Date) => d.toISOString().split("T")[0];

const getMonthRange = () => {
  const d = new Date();
  return { from: toInputDate(new Date(d.getFullYear(), d.getMonth(), 1)), to: toInputDate(d) };
};

const CHART_COLORS = [
  "hsl(var(--chart-positive))",
  "hsl(var(--chart-info))",
  "hsl(var(--chart-warning))",
  "hsl(var(--chart-negative))",
  "hsl(var(--primary))",
  "hsl(var(--chart-neutral))",
];

function handlePrintReport(from: string, to: string, title: string) {
  const printHeader = document.getElementById("print-report-header");
  if (printHeader) {
    printHeader.innerHTML = `
      <div class="print-logo">Azzo Agenda Pro</div>
      <div>
        <div style="font-weight:600">${title}</div>
        <div>Periodo: ${from} a ${to}</div>
        <div>Emitido em: ${new Date().toLocaleDateString("pt-BR")}</div>
      </div>
    `;
  }
  window.print();
}

export default function ManagementReportPage() {
  const monthRange = useMemo(() => getMonthRange(), []);

  const [presetInput, setPresetInput] = useState<PeriodPreset>("MONTH");
  const [fromInput, setFromInput] = useState(monthRange.from);
  const [toInput, setToInput] = useState(monthRange.to);

  const [activeFilters, setActiveFilters] = useState({ from: monthRange.from, to: monthRange.to });
  const [data, setData] = useState<GerencialReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await reportsApi.getGerencial({
          from: activeFilters.from || undefined,
          to: activeFilters.to || undefined,
        });
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar relatorio gerencial.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [activeFilters, reloadToken]);

  const applyPreset = (preset: PeriodPreset) => {
    setPresetInput(preset);
    const d = new Date();
    if (preset === "WEEK") {
      const s = new Date(d);
      s.setDate(d.getDate() - 7);
      setFromInput(toInputDate(s));
      setToInput(toInputDate(d));
    } else if (preset === "MONTH") {
      const r = getMonthRange();
      setFromInput(r.from);
      setToInput(r.to);
    } else if (preset === "QUARTER") {
      const s = new Date(d);
      s.setMonth(d.getMonth() - 3);
      setFromInput(toInputDate(s));
      setToInput(toInputDate(d));
    }
  };

  const applyFilters = () => setActiveFilters({ from: fromInput, to: toInput });

  const presets: Array<{ value: PeriodPreset; label: string }> = [
    { value: "WEEK", label: "7 dias" },
    { value: "MONTH", label: "Mes" },
    { value: "QUARTER", label: "Trimestre" },
    { value: "CUSTOM", label: "Customizado" },
  ];

  const serieChartData = useMemo(
    () => (data?.serieDiaria ?? []).map((d) => ({
      date: d.date,
      Receita: Number(d.receita),
      Despesa: Number(d.despesa),
    })),
    [data?.serieDiaria],
  );

  const topServicosChart = useMemo(
    () => (data?.topServicos ?? []).slice(0, 8).map((s) => ({
      name: s.servicoNome.length > 20 ? `${s.servicoNome.substring(0, 18)}...` : s.servicoNome,
      Receita: Number(s.receitaTotal),
    })),
    [data?.topServicos],
  );

  return (
    <MainLayout
      title="Relatorio gerencial"
      subtitle="Visao consolidada de financeiro, agendamentos, servicos e profissionais."
    >
      <div className="print-region space-y-6">
        {/* Cabecalho visivel apenas na impressao */}
        <div id="print-report-header" className="print-header hidden" />

        {/* Filters */}
        <Card className="print-hide">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Periodo de analise</CardTitle>
                <CardDescription>Ajuste o intervalo para consolidar as metricas do negocio.</CardDescription>
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
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => handlePrintReport(activeFilters.from, activeFilters.to, "Relatorio Gerencial")}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  onChange={(e) => { setFromInput(e.target.value); setPresetInput("CUSTOM"); }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Data final</p>
                <DateInput aria-label="Data final"
                  value={toInput}
                  onChange={(e) => { setToInput(e.target.value); setPresetInput("CUSTOM"); }}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={applyFilters}>Aplicar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm">
            <p className="font-medium text-destructive">Nao foi possivel carregar o relatorio gerencial.</p>
            <p className="mt-1 text-muted-foreground">
              Verifique sua conexao e tente novamente. Se o problema persistir, ajuste o periodo de analise.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setReloadToken((t) => t + 1)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Empty state tratado: sem erro, sem loading e sem dados relevantes */}
        {!isLoading && !error && data && !data.financeiro && !data.agendamentos && (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-sm font-medium text-foreground">Nenhum dado no periodo selecionado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste o intervalo de datas para visualizar as metricas do negocio.
            </p>
          </div>
        )}

        {/* Financial summary */}
        {data?.financeiro && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" /> Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">{formatCurrency(data.financeiro.receitaTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-destructive" /> Despesa Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(data.financeiro.despesaTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" /> Saldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${Number(data.financeiro.saldo) >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(data.financeiro.saldo)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointments summary */}
        {data?.agendamentos && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Agendamentos</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{data.agendamentos.totalAgendamentos}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Concluidos</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-success">{data.agendamentos.agendamentosConcluidos}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cancelados</CardTitle></CardHeader>
              <CardContent><p className={`text-2xl font-bold ${data.agendamentos.agendamentosCancelados > 0 ? "text-destructive" : ""}`}>{data.agendamentos.agendamentosCancelados}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ticket Medio</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{formatCurrency(data.agendamentos.ticketMedio)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" /> Taxa de Ocupacao
                </CardTitle>
                <CardDescription className="text-xs">
                  Percentual de slots disponiveis que foram preenchidos com agendamentos concluidos no periodo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {data.occupancyRate != null ? `${data.occupancyRate.toFixed(1)}%` : "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Daily cash-flow chart */}
        {serieChartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Fluxo Financeiro Diario</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={serieChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R$${v.toFixed(0)}`} />
                  <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name]} />
                  <Bar dataKey="Receita" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Despesa" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top services + professionals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {topServicosChart.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Top Servicos</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topServicosChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R$${v.toFixed(0)}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "Receita"]} />
                    <Bar dataKey="Receita" radius={[0, 3, 3, 0]}>
                      {topServicosChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(data?.topProfissionais ?? []).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Desempenho por Profissional</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-right">Atend.</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.topProfissionais ?? []).map((p, i) => (
                      <TableRow key={p.profissionalId}>
                        <TableCell className="text-sm text-muted-foreground w-8">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{p.profissionalNome}</TableCell>
                        <TableCell className="text-right text-sm">{p.totalAgendamentos}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-success">
                          {formatCurrency(p.receitaTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {isLoading && !data && (
          <div className="text-center text-muted-foreground text-sm py-12">Carregando...</div>
        )}
      </div>
    </MainLayout>
  );
}
