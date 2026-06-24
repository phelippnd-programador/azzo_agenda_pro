import { useEffect, useState } from "react";
import { CalendarDays, TrendingUp, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { appointmentsApi, type AppointmentManagementReportResponse } from "@/lib/api";
import type { AppointmentStatus } from "@/types";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/appointment-status";
import { formatCurrency, formatDateOnly } from "@/lib/format";
import { toast } from "sonner";

type PeriodPreset = "30d" | "90d" | "6m" | "1y" | "CUSTOM";

const toInputDate = (d: Date) => d.toISOString().split("T")[0];

function buildRange(preset: PeriodPreset): { from: string; to: string } {
  const today = new Date();
  const to = toInputDate(today);
  if (preset === "30d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    return { from: toInputDate(from), to };
  }
  if (preset === "90d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 90);
    return { from: toInputDate(from), to };
  }
  if (preset === "6m") {
    const from = new Date(today);
    from.setMonth(from.getMonth() - 6);
    return { from: toInputDate(from), to };
  }
  if (preset === "1y") {
    const from = new Date(today);
    from.setFullYear(from.getFullYear() - 1);
    return { from: toInputDate(from), to };
  }
  return { from: toInputDate(today), to };
}

const presets: Array<{ value: PeriodPreset; label: string }> = [
  { value: "30d", label: "Ultimos 30 dias" },
  { value: "90d", label: "Ultimos 90 dias" },
  { value: "6m", label: "Ultimos 6 meses" },
  { value: "1y", label: "Ultimo ano" },
];

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "COMPLETED", label: "Concluido" },
  { value: "PENDING", label: "Pendente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "NO_SHOW", label: "Nao compareceu" },
];

const PAGE_SIZE = 20;

export default function MinhaProducao() {
  const [preset, setPreset] = useState<PeriodPreset>("30d");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AppointmentManagementReportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchData(p: number = 0) {
    setLoading(true);
    try {
      const range = buildRange(preset);
      const result = await appointmentsApi.getMyHistory({
        from: range.from,
        to: range.to,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: p,
        pageSize: PAGE_SIZE,
      });
      setData(result);
      setPage(p);
    } catch {
      toast.error("Erro ao carregar historico de producao");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, statusFilter]);

  const items = data?.items ?? [];
  const hasMore = data?.hasMore ?? false;

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Minha Producao</h1>
          <p className="text-sm text-muted-foreground">
            Historico de atendimentos realizados e sua evolucao
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={preset} onValueChange={(v) => setPreset(v as PeriodPreset)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold">{data.totalAppointments}</p>
                <p className="text-xs text-muted-foreground">agendamentos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Concluidos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-emerald-600">{data.totalCompleted}</p>
                <p className="text-xs text-muted-foreground">
                  {data.totalAppointments > 0
                    ? `${Math.round((data.totalCompleted / data.totalAppointments) * 100)}% do total`
                    : "-"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                  Cancelados
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-red-500">{data.totalCancelled}</p>
                <p className="text-xs text-muted-foreground">
                  {data.cancellationRate != null
                    ? `${(data.cancellationRate * 100).toFixed(1)}% de cancelamento`
                    : "-"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                  Faturado
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">no periodo</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointment list */}
        <Card>
          <CardHeader className="px-4 pb-2 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historico de atendimentos
              {data && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({data.totalItems} no periodo)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {loading ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Carregando...</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm">Nenhum atendimento encontrado no periodo</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Servico</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.appointmentId}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateOnly(item.date)}
                        <span className="ml-1 text-xs text-muted-foreground">{item.startTime?.slice(0, 5)}</span>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{item.clientName}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {item.serviceLabel}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeColor(item.status as AppointmentStatus)}>
                          {getStatusLabel(item.status as AppointmentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm hidden sm:table-cell">
                        {item.totalPrice != null ? formatCurrency(item.totalPrice) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {(page > 0 || hasMore) && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || loading}
                  onClick={() => fetchData(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">Pagina {page + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore || loading}
                  onClick={() => fetchData(page + 1)}
                >
                  Proxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
