import { useEffect, useMemo, useState } from "react";
import { Download, Printer, RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MainLayout } from "@/components/layout/MainLayout";
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
import { professionalsApi } from "@/lib/api";
import type { Professional } from "@/lib/api";
import { reportsApi } from "@/lib/api/reports";
import type { VendasReportResponse } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/format";

type PeriodPreset = "WEEK" | "MONTH" | "QUARTER" | "CUSTOM";

const toInputDate = (d: Date) => d.toISOString().split("T")[0];

const getMonthRange = () => {
  const d = new Date();
  return { from: toInputDate(new Date(d.getFullYear(), d.getMonth(), 1)), to: toInputDate(d) };
};

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

function downloadCsv(data: VendasReportResponse, from: string, to: string) {
  const rows = [
    ["Tipo", "ID", "Nome", "Total Agendamentos", "Receita Total", "Ticket Medio"],
    ...data.topServicos.map((s) => ["Servico", s.servicoId, s.servicoNome, s.totalAgendamentos, s.receitaTotal, s.ticketMedio]),
    ...data.topProfissionais.map((p) => ["Profissional", p.profissionalId, p.profissionalNome, p.totalAgendamentos, p.receitaTotal, p.ticketMedio]),
  ];
  const csv = rows.map((r) => r.join(";")).join("\n");
  const blob = new Blob(["ï»¿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-vendas-${from}-${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function handlePrintSales(from: string, to: string) {
  const printHeader = document.getElementById("print-report-header");
  if (printHeader) {
    printHeader.innerHTML = `
      <div class="print-logo">Azzo Agenda Pro</div>
      <div>
        <div style="font-weight:600">Relatorio de Vendas</div>
        <div>Periodo: ${from} a ${to}</div>
        <div>Emitido em: ${new Date().toLocaleDateString("pt-BR")}</div>
      </div>
    `;
  }
  window.print();
}

export default function SalesReportPage() {
  const monthRange = useMemo(() => getMonthRange(), []);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const [presetInput, setPresetInput] = useState<PeriodPreset>("MONTH");
  const [fromInput, setFromInput] = useState(monthRange.from);
  const [toInput, setToInput] = useState(monthRange.to);
  const [profInput, setProfInput] = useState("all");

  const [activeFilters, setActiveFilters] = useState({ from: monthRange.from, to: monthRange.to, professionalId: "all" });
  const [data, setData] = useState<VendasReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await professionalsApi.getAll({ limit: 200 });
        const items = Array.isArray(res) ? res : (res as { items?: Professional[] }).items ?? [];
        setProfessionals(items.filter((p) => p.isActive));
      } catch {
        setProfessionals([]);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await reportsApi.getVendas({
          from: activeFilters.from || undefined,
          to: activeFilters.to || undefined,
          professionalId: activeFilters.professionalId !== "all" ? activeFilters.professionalId : undefined,
        });
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar relatorio de vendas.");
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

  const applyFilters = () => setActiveFilters({ from: fromInput, to: toInput, professionalId: profInput });

  const presets: Array<{ value: PeriodPreset; label: string }> = [
    { value: "WEEK", label: "7 dias" },
    { value: "MONTH", label: "Mes" },
    { value: "QUARTER", label: "Trimestre" },
    { value: "CUSTOM", label: "Customizado" },
  ];

  const chartData = (data?.topServicos ?? []).slice(0, 10).map((s) => ({
    name: s.servicoNome.length > 20 ? `${s.servicoNome.substring(0, 18)}...` : s.servicoNome,
    Receita: Number(s.receitaTotal),
    Atendimentos: s.totalAgendamentos,
  }));

  return (
    <MainLayout
      title="Relatorio de vendas"
      subtitle="Leitura consolidada de servicos, receita e desempenho por profissional."
    >
      <div className="print-region space-y-6">
        <div id="print-report-header" className="print-header hidden" />
        <Card className="print-hide">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Filtros e acoes</CardTitle>
                <CardDescription>
                  Ajuste o periodo e o profissional para consolidar o desempenho comercial.
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
                  <>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => downloadCsv(data, activeFilters.from, activeFilters.to)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => handlePrintSales(activeFilters.from, activeFilters.to)}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                  </>
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
                <Input
                  type="date" aria-label="Data inicial"
                  value={fromInput}
                  onChange={(e) => {
                    setFromInput(e.target.value);
                    setPresetInput("CUSTOM");
                  }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Data final</p>
                <Input
                  type="date" aria-label="Data final"
                  value={toInput}
                  onChange={(e) => {
                    setToInput(e.target.value);
                    setPresetInput("CUSTOM");
                  }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Profissional</p>
                <Select value={profInput} onValueChange={setProfInput}>
                  <SelectTrigger>
                    <SelectValue placeholder="Profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total atendimentos</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.summary.totalAgendamentos}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receita total</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.summary.receitaTotal)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ticket medio</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrency(data.summary.ticketMedio)}</p></CardContent></Card>
          </div>
        )}

        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top servicos por receita</CardTitle>
              <CardDescription>Recorte dos servicos com maior impacto comercial no periodo.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R$${v.toFixed(0)}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v: number, name: string) => [name === "Receita" ? formatCurrency(v) : v, name]} />
                  <Bar dataKey="Receita" radius={[0, 3, 3, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Ranking de servicos</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Carregando...</div>
              ) : !data || data.topServicos.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Nenhum dado disponivel.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[640px]">
                    <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Servico</TableHead><TableHead className="text-right">Atend.</TableHead><TableHead className="text-right">Receita</TableHead><TableHead className="text-right">Ticket</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {data.topServicos.map((s, i) => (
                        <TableRow key={s.servicoId}>
                          <TableCell className="w-8 text-sm text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="text-sm font-medium">{s.servicoNome}</TableCell>
                          <TableCell className="text-right text-sm">{s.totalAgendamentos}</TableCell>
                          <TableCell className="text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(s.receitaTotal)}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(s.ticketMedio)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Desempenho por profissional</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Carregando...</div>
              ) : !data || data.topProfissionais.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Nenhum dado disponivel.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[640px]">
                    <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Profissional</TableHead><TableHead className="text-right">Atend.</TableHead><TableHead className="text-right">Receita</TableHead><TableHead className="text-right">Ticket</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {data.topProfissionais.map((p, i) => (
                        <TableRow key={p.profissionalId}>
                          <TableCell className="w-8 text-sm text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="text-sm font-medium">{p.profissionalNome}</TableCell>
                          <TableCell className="text-right text-sm">{p.totalAgendamentos}</TableCell>
                          <TableCell className="text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(p.receitaTotal)}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(p.ticketMedio)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
