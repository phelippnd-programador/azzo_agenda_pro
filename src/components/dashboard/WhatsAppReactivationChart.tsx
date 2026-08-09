import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ClipboardCheck,
  MessageCircleWarning,
  Route,
  UserCheck,
  CalendarClock,
  RefreshCcw,
} from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { formatDateOnly } from "@/lib/format";
import type { DashboardWhatsAppReactivationResponse } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_DAYS = "30";
const PERIOD_OPTIONS = [
  { label: "7 dias", value: "7" },
  { label: "15 dias", value: "15" },
  { label: "30 dias", value: "30" },
] as const;

const stageCards = [
  {
    key: "stoppedAtServiceSelection",
    label: "Serviço",
    Icon: Route,
  },
  {
    key: "stoppedAtProfessionalSelection",
    label: "Profissional",
    Icon: UserCheck,
  },
  {
    key: "stoppedAtTimeSelection",
    label: "Horário",
    Icon: CalendarClock,
  },
  {
    key: "stoppedAtFinalReview",
    label: "Revisão final",
    Icon: ClipboardCheck,
  },
] as const;

const emptyMetrics: DashboardWhatsAppReactivationResponse = {
  startDate: "",
  endDate: "",
  totalAbandoned: 0,
  totalReactivated: 0,
  totalConverted: 0,
  reactivationRate: 0,
  stoppedAtServiceSelection: 0,
  stoppedAtProfessionalSelection: 0,
  stoppedAtTimeSelection: 0,
  stoppedAtFinalReview: 0,
  points: [],
};

export function WhatsAppReactivationChart() {
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [metrics, setMetrics] = useState<DashboardWhatsAppReactivationResponse>(emptyMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    dashboardApi
      .getWhatsAppReactivationMetrics(Number(days))
      .then((data) => {
        if (!mounted) return;
        setMetrics(data);
        setHasError(false);
      })
      .catch(() => {
        if (!mounted) return;
        setMetrics(emptyMetrics);
        setHasError(true);
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [days, reloadNonce]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-60" />
          <Skeleton className="h-4 w-44" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="rounded-xl border p-4">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const chartData = metrics.points.map((point) => ({
    ...point,
    label: formatDateOnly(point.metricDate),
  }));

  const hasData =
    metrics.totalAbandoned > 0 ||
    metrics.totalReactivated > 0 ||
    metrics.totalConverted > 0 ||
    chartData.some(
      (point) => point.abandonedCount > 0 || point.reactivatedCount > 0 || point.convertedCount > 0
    );

  const rangeLabel =
    metrics.startDate && metrics.endDate
      ? `${formatDateOnly(metrics.startDate)} a ${formatDateOnly(metrics.endDate)}`
      : `${days} dias`;

  const pendingRecovery = Math.max(metrics.totalAbandoned - metrics.totalConverted, 0);

  return (
    <Card className="border-border/70 bg-background/95 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <RefreshCcw className="h-5 w-5 text-primary" />
              Reativação de abandono no WhatsApp
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Clientes que pararam no fluxo e quantos voltaram para concluir o agendamento.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center">
            <Badge variant="outline" className="w-fit">
              {rangeLabel}
            </Badge>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-full border-border/70 bg-background/90 min-[420px]:w-[120px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-warning/25 bg-warning/8 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-warning">Abandonos</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{metrics.totalAbandoned}</p>
          </div>
          <div className="rounded-2xl border border-success/25 bg-success/8 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-success">Reativados</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{metrics.totalReactivated}</p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Convertidos</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{metrics.totalConverted}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Taxa de reativação</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {Number(metrics.reactivationRate || 0).toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingRecovery} ciclo(s) ainda sem conversão no período
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/85 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Onde o fluxo para mais</p>
              <p className="text-xs text-muted-foreground">
                Distribuição dos abandonos por etapa do agendamento no WhatsApp.
              </p>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {stageCards.map(({ key, label, Icon }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-warning/25 bg-warning/8 px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-background/85 p-2">
                      <Icon className="h-4 w-4 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">Clientes que travaram nesta etapa</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-xl font-bold text-foreground">
                    {metrics[key]}
                  </div>
                </div>
              ))}
            </div>

            {hasError ? (
              <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border/70 bg-background/80 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">Não foi possível atualizar o painel.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Os dados podem estar temporariamente indisponíveis.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setReloadNonce((value) => value + 1)}>
                  Atualizar
                </Button>
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">Evolução da reativação no período</p>
              <p className="text-xs text-muted-foreground">
                A leitura fica mais clara quando o gráfico usa largura total em vez de dividir espaço com as etapas.
              </p>
            </div>
            {hasData ? (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--chart-warning))]" />
                    Abandonos
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--chart-positive))]" />
                    Reativados
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--chart-info))]" />
                    Convertidos
                  </span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted) / 0.45)" }}
                        formatter={(value: number, name: string) => {
                          const labelMap: Record<string, string> = {
                            abandonedCount: "Abandonos",
                            reactivatedCount: "Reativados",
                            convertedCount: "Convertidos",
                          };
                          return [String(value ?? 0), labelMap[name] || name];
                        }}
                        labelFormatter={(value) => `Data: ${value}`}
                      />
                      <Bar dataKey="abandonedCount" fill="hsl(var(--chart-warning))" radius={[6, 6, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="reactivatedCount" fill="hsl(var(--chart-positive))" radius={[6, 6, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="convertedCount" fill="hsl(var(--chart-info))" radius={[6, 6, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/80 px-6 text-center">
                <MessageCircleWarning className="mb-3 h-8 w-8 text-primary" />
                <p className="font-medium text-foreground">Sem abandonos capturados no período</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  O gráfico aparece assim que o fluxo de reativação começar a registrar eventos.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
