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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_DAYS = 30;

const stageCards = [
  {
    key: "stoppedAtServiceSelection",
    label: "Servico",
    Icon: Route,
    accentClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-100",
  },
  {
    key: "stoppedAtProfessionalSelection",
    label: "Profissional",
    Icon: UserCheck,
    accentClass: "text-orange-700",
    bgClass: "bg-orange-50 border-orange-100",
  },
  {
    key: "stoppedAtTimeSelection",
    label: "Horario",
    Icon: CalendarClock,
    accentClass: "text-blue-700",
    bgClass: "bg-blue-50 border-blue-100",
  },
  {
    key: "stoppedAtFinalReview",
    label: "Revisao final",
    Icon: ClipboardCheck,
    accentClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-100",
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
  const [metrics, setMetrics] = useState<DashboardWhatsAppReactivationResponse>(emptyMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    dashboardApi
      .getWhatsAppReactivationMetrics(DEFAULT_DAYS)
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
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-60" />
          <Skeleton className="h-4 w-44" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
      : `${DEFAULT_DAYS} dias`;

  const pendingRecovery = Math.max(metrics.totalAbandoned - metrics.totalConverted, 0);

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-cyan-50/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <RefreshCcw className="h-5 w-5 text-emerald-600" />
              Reativacao de abandono no WhatsApp
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Clientes que pararam no fluxo e quantos voltaram para concluir o agendamento.
            </p>
          </div>
          <Badge variant="outline">{rangeLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-amber-200 bg-white/85 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Abandonos</p>
            <p className="mt-1 text-2xl font-bold text-amber-950">{metrics.totalAbandoned}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white/85 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Reativados</p>
            <p className="mt-1 text-2xl font-bold text-emerald-950">{metrics.totalReactivated}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white/85 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Convertidos</p>
            <p className="mt-1 text-2xl font-bold text-blue-950">{metrics.totalConverted}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/85 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-700">Taxa de reativacao</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              {Number(metrics.reactivationRate || 0).toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingRecovery} ciclo(s) ainda sem conversao no periodo
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <div className="rounded-xl border bg-white/80 p-4">
            {hasData ? (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Abandonos
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Reativados
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
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
                        cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
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
                      <Bar dataKey="abandonedCount" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="reactivatedCount" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="convertedCount" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 px-6 text-center">
                <MessageCircleWarning className="mb-3 h-8 w-8 text-emerald-600" />
                <p className="font-medium text-foreground">Sem abandonos capturados no periodo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  O grafico aparece assim que o fluxo de reativacao comecar a registrar eventos.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border bg-white/80 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Onde o fluxo para mais</p>
              <p className="text-xs text-muted-foreground">
                Distribuicao dos abandonos por etapa do agendamento no WhatsApp.
              </p>
            </div>

            <div className="space-y-2">
              {stageCards.map(({ key, label, Icon, accentClass, bgClass }) => (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-xl border px-3 py-3 ${bgClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/80 p-2">
                      <Icon className={`h-4 w-4 ${accentClass}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">Clientes que travaram nesta etapa</p>
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${accentClass}`}>
                    {metrics[key]}
                  </div>
                </div>
              ))}
            </div>

            {hasError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Nao foi possivel atualizar o painel agora. Os dados podem estar temporariamente indisponiveis.
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
