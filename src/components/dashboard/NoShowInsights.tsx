import { useEffect, useState } from "react";
import { AlertCircle, CalendarClock, ReceiptText, UserRoundX } from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi, type DashboardNoShowInsightsResponse } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { formatCurrency, formatDateOnly } from "@/lib/format";

const calculateGrowthPercent = (current: number, previous?: number | null): number | null => {
  if (!previous || previous <= 0) return null;
  return ((current - previous) * 100) / previous;
};

export function NoShowInsights() {
  const [data, setData] = useState<DashboardNoShowInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardApi.getNoShowInsights();
        if (!cancelled) setData(response);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const growth = calculateGrowthPercent(data?.totalNoShows ?? 0, data?.previousPeriodNoShows);
  const items = data?.recentItems ?? [];

  return (
    <Card className="border-rose-200 bg-gradient-to-br from-rose-50/80 to-orange-50/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between gap-2 text-base sm:text-lg">
          <div className="flex ">
            <UserRoundX className="h-5 w-5 text-rose-700" />
            No-show no periodo
          </div>
          <Button asChild size="sm" variant="outline" className="border-rose-200">
            <Link to="/relatorio/no-show">Abrir pagina</Link>
          </Button>

        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visao analitica e operacional dos clientes que nao compareceram no mes atual.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricCard
            title="No-show no mes"
            value={isLoading ? "..." : data?.totalNoShows ?? 0}
            icon={AlertCircle}
            trend={{
              value: growth,
              isPositive: (growth ?? 0) <= 0,
              unavailableLabel: "Sem comparativo anterior",
            }}
            iconClassName="bg-rose-600"
            className="border-rose-200 bg-white/80"
            compact
            wrapValue
          />
          <MetricCard
            title="Taxa de no-show"
            value={isLoading ? "..." : `${(data?.noShowRate ?? 0).toFixed(1)}%`}
            icon={CalendarClock}
            iconClassName="bg-orange-500"
            className="border-orange-200 bg-white/80"
            compact
            wrapValue
          />
          <MetricCard
            title="Ultimos 7 dias"
            value={isLoading ? "..." : data?.lastSevenDaysNoShows ?? 0}
            icon={CalendarClock}
            iconClassName="bg-amber-500"
            className="border-amber-200 bg-white/80"
            compact
            wrapValue
          />
          <MetricCard
            title="Receita em risco"
            value={isLoading ? "..." : formatCurrency(data?.revenueAtRisk ?? 0)}
            icon={ReceiptText}
            iconClassName="bg-slate-700"
            className="border-slate-200 bg-white/80"
            compact
            wrapValue
          />
        </div>

        {/* <div className="rounded-2xl border border-rose-200 bg-white/80 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Lista operacional de no-show</p>
              <p className="text-xs text-muted-foreground">
                Ultimos casos para o time acompanhar, contactar ou analisar recorrencia.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">
                {isLoading ? "..." : `${data?.totalNoShows ?? 0} no mes`}
              </Badge>

            </div>
          </div>

          {!isLoading && items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum no-show registrado no periodo atual.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((appointment) => (
                <div
                  key={appointment.appointmentId}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{appointment.clientName || "Cliente nao identificado"}</p>
                      <p className="text-sm text-muted-foreground">
                        {(appointment.serviceNames || []).join(", ") || "Servico nao identificado"} • {appointment.professionalName || "Profissional nao identificado"}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">
                      Nao compareceu
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{appointment.date ? formatDateOnly(appointment.date) : "-"}</span>
                    <span>{appointment.startTime} - {appointment.endTime}</span>
                    <span>{formatCurrency(appointment.totalPrice || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div> */}
      </CardContent>
    </Card>
  );
}
