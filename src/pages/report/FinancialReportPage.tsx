import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MainLayout } from "@/components/layout/MainLayout";
import { ReportTabs } from "@/pages/report/components/ReportTabs";
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
import { transactionsApi, transactionCategoriesApi } from "@/lib/api/finance";
import type { TransactionCategory } from "@/lib/api/finance";
import type { Transaction } from "@/types";
import { formatCurrency, formatDateOnly } from "@/lib/format";
import { toast } from "sonner";

type PeriodPreset = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

const toInputDate = (d: Date) => d.toISOString().split("T")[0];

const getMonthRange = () => {
  const d = new Date();
  return { from: toInputDate(new Date(d.getFullYear(), d.getMonth(), 1)), to: toInputDate(d) };
};

const getWeekRange = () => {
  const d = new Date();
  const start = new Date(d);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return { from: toInputDate(start), to: toInputDate(d) };
};

const presets: Array<{ value: PeriodPreset; label: string }> = [
  { value: "TODAY", label: "Hoje" },
  { value: "WEEK", label: "Semana" },
  { value: "MONTH", label: "Mes" },
  { value: "CUSTOM", label: "Customizado" },
];

const typeOptions = [
  { value: "all", label: "Todos os tipos" },
  { value: "INCOME", label: "Receita" },
  { value: "EXPENSE", label: "Despesa" },
];

const paymentOptions = [
  { value: "all", label: "Todos os metodos" },
  { value: "CASH", label: "Dinheiro" },
  { value: "CREDIT_CARD", label: "Cartao de credito" },
  { value: "DEBIT_CARD", label: "Cartao de debito" },
  { value: "PIX", label: "PIX" },
  { value: "BANK_TRANSFER", label: "Transferencia" },
];

export default function FinancialReportPage() {
  const monthRange = useMemo(() => getMonthRange(), []);
  const [categories, setCategories] = useState<(TransactionCategory & { transactionCount: number })[]>([]);

  const [presetInput, setPresetInput] = useState<PeriodPreset>("MONTH");
  const [fromInput, setFromInput] = useState(monthRange.from);
  const [toInput, setToInput] = useState(monthRange.to);
  const [typeInput, setTypeInput] = useState("all");
  const [paymentInput, setPaymentInput] = useState("all");
  const [categoryInput, setCategoryInput] = useState("all");

  const [activeFilters, setActiveFilters] = useState({
    from: monthRange.from,
    to: monthRange.to,
    type: "all",
    paymentMethod: "all",
    categoryId: "all",
  });

  const [summary, setSummary] = useState<{ totalIncome: number; totalExpenses: number; balance: number } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashFlow, setCashFlow] = useState<Array<{ date: string; income: number; expenses: number; balance: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    transactionCategoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const params = {
          from: activeFilters.from || undefined,
          to: activeFilters.to || undefined,
          type: activeFilters.type !== "all" ? (activeFilters.type as "INCOME" | "EXPENSE") : undefined,
          paymentMethod: activeFilters.paymentMethod !== "all" ? activeFilters.paymentMethod : undefined,
          categoryId: activeFilters.categoryId !== "all" ? activeFilters.categoryId : undefined,
        };
        const [sumData, txData, cfData] = await Promise.all([
          transactionsApi.getSummary(params),
          transactionsApi.getAll({ ...params, limit: 100 }),
          transactionsApi.getCashFlow({ from: activeFilters.from || undefined, to: activeFilters.to || undefined }),
        ]);
        if (cancelled) return;
        setSummary(sumData);
        setTransactions(Array.isArray(txData) ? txData : (txData as { items?: Transaction[] }).items ?? []);
        setCashFlow(cfData);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar relatorio financeiro.");
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
    if (preset === "TODAY") {
      const d = toInputDate(new Date());
      setFromInput(d);
      setToInput(d);
    } else if (preset === "WEEK") {
      const r = getWeekRange();
      setFromInput(r.from);
      setToInput(r.to);
    } else if (preset === "MONTH") {
      const r = getMonthRange();
      setFromInput(r.from);
      setToInput(r.to);
    }
  };

  const applyFilters = () => {
    setActiveFilters({
      from: fromInput,
      to: toInput,
      type: typeInput,
      paymentMethod: paymentInput,
      categoryId: categoryInput,
    });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await transactionsApi.exportCsv({
        from: activeFilters.from || undefined,
        to: activeFilters.to || undefined,
        type: activeFilters.type !== "all" ? (activeFilters.type as "INCOME" | "EXPENSE") : undefined,
        paymentMethod: activeFilters.paymentMethod !== "all" ? activeFilters.paymentMethod : undefined,
        categoryId: activeFilters.categoryId !== "all" ? activeFilters.categoryId : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-financeiro-${activeFilters.from}-${activeFilters.to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao exportar CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const chartData = cashFlow.map((d) => ({
    date: d.date,
    Receita: d.income,
    Despesa: d.expenses,
  }));

  return (
    <MainLayout
      title="Relatorio financeiro"
      subtitle="Leitura consolidada de receitas, despesas, saldo e movimentacoes do periodo."
    >
      <ReportTabs />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Filtros e acoes</CardTitle>
                <CardDescription>
                  Ajuste periodo, tipo, forma de pagamento e categoria para consolidar o relatorio.
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
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? "Exportando..." : "Exportar CSV"}
                </Button>
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

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
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
                <Select value={typeInput} onValueChange={setTypeInput}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Metodo</p>
                <Select value={paymentInput} onValueChange={setPaymentInput}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 xl:col-span-2">
                <p className="text-xs text-muted-foreground">Categoria</p>
                <Select value={categoryInput} onValueChange={setCategoryInput}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full sm:w-auto" onClick={applyFilters}>
              Aplicar filtros
            </Button>
          </CardContent>
        </Card>

        {error && <div className="text-sm text-destructive">{error}</div>}

        {summary && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-success" /> Receita total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-success">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingDown className="h-4 w-4 text-destructive" /> Despesa total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-destructive">
                  {formatCurrency(summary.totalExpenses)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Wallet className="h-4 w-4 text-sky-500" /> Saldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-2xl font-semibold ${summary.balance >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {formatCurrency(summary.balance)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fluxo de caixa diario</CardTitle>
              <CardDescription>Comparativo entre entradas e saidas dentro do periodo filtrado.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R$${v.toFixed(0)}`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [formatCurrency(v), name]}
                    labelFormatter={(l: string) => `Data: ${l}`}
                  />
                  <Bar dataKey="Receita" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Despesa" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="text-base">Transacoes do periodo</CardTitle>
                <CardDescription>
                  Lista detalhada das movimentacoes retornadas para os filtros ativos.
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? "Carregando registros..." : `${transactions.length} transacao(oes) encontrada(s)`}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma transacao encontrada.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descricao</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Metodo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">{formatDateOnly(tx.date)}</TableCell>
                        <TableCell className="max-w-[320px] text-sm">{tx.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === "INCOME" ? "default" : "destructive"} className="text-xs">
                            {tx.type === "INCOME" ? "Receita" : "Despesa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.paymentMethod ?? "-"}</TableCell>
                        <TableCell
                          className={`text-right text-sm font-medium ${tx.type === "INCOME" ? "text-success" : "text-destructive"}`}
                        >
                          {formatCurrency(tx.amount)}
                        </TableCell>
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
