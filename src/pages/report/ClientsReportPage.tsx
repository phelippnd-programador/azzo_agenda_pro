import { useEffect, useMemo, useState } from "react";
import { Download, Printer, RefreshCw, UserCheck, UserX, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
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
import type { ClientesReportResponse, ClienteReportItem } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/format";

type PeriodPreset = "MONTH" | "QUARTER" | "SEMESTER" | "CUSTOM";

const toInputDate = (d: Date) => d.toISOString().split("T")[0];

const getLastNDays = (days: number) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: toInputDate(from), to: toInputDate(to) };
};

function downloadCsv(data: ClientesReportResponse, from: string, to: string) {
  const headers = ["Nome", "Telefone", "Email", "Visitas", "Receita Total", "Ultima Visita", "Dias sem Visita", "Status"];
  const rows = data.items.map((c) => [
    c.clienteNome,
    c.clientePhone ?? "",
    c.clienteEmail ?? "",
    c.totalVisitas,
    c.receitaTotal,
    c.ultimaVisita ?? "",
    c.diasSemVisita,
    c.inativo ? "Inativo" : "Ativo",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-clientes-${from}-${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function handlePrintClients(from: string, to: string) {
  const printHeader = document.getElementById("print-report-header");
  if (printHeader) {
    printHeader.innerHTML = `
      <div class="print-logo">Azzo Agenda Pro</div>
      <div>
        <div style="font-weight:600">Relatorio de Clientes</div>
        <div>Periodo: ${from} a ${to}</div>
        <div>Emitido em: ${new Date().toLocaleDateString("pt-BR")}</div>
      </div>
    `;
  }
  window.print();
}

export default function ClientsReportPage() {
  const defaultRange = useMemo(() => getLastNDays(180), []);

  const [presetInput, setPresetInput] = useState<PeriodPreset>("SEMESTER");
  const [fromInput, setFromInput] = useState(defaultRange.from);
  const [toInput, setToInput] = useState(defaultRange.to);
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [search, setSearch] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    from: defaultRange.from,
    to: defaultRange.to,
    onlyInactive: false,
  });

  const [data, setData] = useState<ClientesReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await reportsApi.getClientes({
          from: activeFilters.from || undefined,
          to: activeFilters.to || undefined,
          onlyInactive: activeFilters.onlyInactive || undefined,
        });
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar relatorio de clientes.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [activeFilters, reloadToken]);

  const applyPreset = (preset: PeriodPreset) => {
    setPresetInput(preset);
    if (preset === "MONTH") { const r = getLastNDays(30); setFromInput(r.from); setToInput(r.to); }
    else if (preset === "QUARTER") { const r = getLastNDays(90); setFromInput(r.from); setToInput(r.to); }
    else if (preset === "SEMESTER") { const r = getLastNDays(180); setFromInput(r.from); setToInput(r.to); }
  };

  const applyFilters = () => setActiveFilters({ from: fromInput, to: toInput, onlyInactive });

  const presets: Array<{ value: PeriodPreset; label: string }> = [
    { value: "MONTH", label: "30 dias" },
    { value: "QUARTER", label: "90 dias" },
    { value: "SEMESTER", label: "180 dias" },
    { value: "CUSTOM", label: "Customizado" },
  ];

  const filteredItems: ClienteReportItem[] = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data.items;
    return data.items.filter(
      (c) =>
        c.clienteNome?.toLowerCase().includes(q) ||
        c.clientePhone?.toLowerCase().includes(q) ||
        c.clienteEmail?.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <MainLayout
      title="Relatorio de clientes"
      subtitle="Frequencia de visitas, receita gerada e identificacao de clientes inativos."
    >
      <div className="print-region space-y-6">
        <div id="print-report-header" className="print-header hidden" />

        {/* Filters */}
        <Card className="print-hide">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Filtros e acoes</CardTitle>
                <CardDescription>
                  Selecione o periodo e filtre por clientes inativos (mais de 60 dias sem visita).
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
                      onClick={() => handlePrintClients(activeFilters.from, activeFilters.to)}
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
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyInactive}
                    onChange={(e) => setOnlyInactive(e.target.checked)}
                    className="h-4 w-4 rounded border border-input"
                  />
                  <span className="text-sm">Somente inativos</span>
                </label>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={applyFilters}>Aplicar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <div className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 p-3">{error}</div>}

        {/* Summary cards */}
        {data?.summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" /> Total de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.summary.totalClientes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-success" /> Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">{data.summary.clientesAtivos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-500" /> Inativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${data.summary.clientesInativos > 0 ? "text-amber-600" : ""}`}>
                  {data.summary.clientesInativos}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">{formatCurrency(data.summary.receitaTotal)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search + Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Clientes</CardTitle>
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:w-72"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhum cliente encontrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Visitas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead>Ultima Visita</TableHead>
                    <TableHead className="text-right">Dias sem Visita</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((c) => (
                    <TableRow key={c.clienteId}>
                      <TableCell className="font-medium text-sm">{c.clienteNome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.clientePhone ?? "-"}</TableCell>
                      <TableCell className="text-right text-sm">{c.totalVisitas}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-success">
                        {formatCurrency(c.receitaTotal)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.ultimaVisita ?? "-"}</TableCell>
                      <TableCell className="text-right text-sm">{c.diasSemVisita > 998 ? "—" : c.diasSemVisita}</TableCell>
                      <TableCell>
                        <Badge variant={c.inativo ? "secondary" : "default"} className="text-xs">
                          {c.inativo ? "Inativo" : "Ativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
