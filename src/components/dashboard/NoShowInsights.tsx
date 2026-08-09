import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarClock, ReceiptText, UserRoundX } from "lucide-react";
import { Link } from "react-router-dom";
import { appRouteManifest } from "@/app/route-manifest";
import { dashboardApi, type DashboardNoShowInsightsResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { formatCurrency } from "@/lib/format";

const calculateGrowthPercent = (current: number, previous?: number | null): number | null => {
  if (!previous || previous <= 0) return null;
  return ((current - previous) * 100) / previous;
};

export function NoShowInsights() {
  const [data, setData] = useState<DashboardNoShowInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async (isMounted?: () => boolean) => {
    try {
      setIsLoading(true);
      setHasError(false);
      const response = await dashboardApi.getNoShowInsights();
      if (!isMounted || isMounted()) setData(response);
    } catch {
      if (!isMounted || isMounted()) {
        setData(null);
        setHasError(true);
      }
    } finally {
      if (!isMounted || isMounted()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void load(() => mounted);
    return () => {
      mounted = false;
    };
  }, [load]);

  const growth = calculateGrowthPercent(data?.totalNoShows ?? 0, data?.previousPeriodNoShows);

  return (
    <Card className="border-border/70 bg-background/95 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col gap-3 text-base sm:flex-row sm:items-start sm:justify-between sm:text-lg">
          <div className="flex items-center gap-2">
            <UserRoundX className="h-5 w-5 text-warning" />
            No-show no período
          </div>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <Link to={appRouteManifest.reports.noShow}>Abrir página</Link>
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visão analítica e operacional dos clientes que não compareceram no mês atual.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasError ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border/70 bg-background/80 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Não foi possível carregar os dados de no-show.</p>
              <p className="mt-1 text-xs text-muted-foreground">Os indicadores não foram substituídos por zero.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Atualizar
            </Button>
          </div>
        ) : null}
        {!hasError ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricCard
            title="No-show no mês"
            value={isLoading ? "..." : data?.totalNoShows ?? 0}
            icon={AlertCircle}
            trend={{
              value: growth,
              isPositive: (growth ?? 0) <= 0,
              unavailableLabel: "Sem comparativo anterior",
            }}
            iconClassName="bg-warning"
            className="border-warning/25 bg-warning/8"
            compact
            wrapValue
          />
          <MetricCard
            title="Taxa de no-show"
            value={isLoading ? "..." : `${(data?.noShowRate ?? 0).toFixed(1)}%`}
            icon={CalendarClock}
            iconClassName="bg-warning"
            className="border-warning/25 bg-warning/8"
            compact
            wrapValue
          />
          <MetricCard
            title="Últimos 7 dias"
            value={isLoading ? "..." : data?.lastSevenDaysNoShows ?? 0}
            icon={CalendarClock}
            iconClassName="bg-muted text-muted-foreground"
            className="border-border/70 bg-background/85"
            compact
            wrapValue
          />
          <MetricCard
            title="Receita em risco"
            value={isLoading ? "..." : formatCurrency(data?.revenueAtRisk ?? 0)}
            icon={ReceiptText}
            iconClassName="bg-primary"
            className="border-primary/20 bg-primary/8"
            compact
            wrapValue
          />
        </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
