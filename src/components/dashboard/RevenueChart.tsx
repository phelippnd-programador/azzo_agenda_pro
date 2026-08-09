import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';
import { dashboardApi } from '@/lib/api';

const emptyWeeklyData = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day) => ({ day, value: 0 }));

export function RevenueChart() {
  const [weeklyData, setWeeklyData] = useState(emptyWeeklyData);
  const [rangeLabel, setRangeLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(() => {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const start = monday.toISOString().split('T')[0];
    const end = sunday.toISOString().split('T')[0];
    setRangeLabel(`${start} a ${end}`);
    setIsLoading(true);
    setHasError(false);

    dashboardApi
      .getWeeklyRevenue(start, end)
      .then((data) => {
        setWeeklyData(data.points?.length ? data.points.map((p) => ({ day: p.day, value: p.value })) : emptyWeeklyData);
      })
      .catch(() => {
        setWeeklyData(emptyWeeklyData);
        setHasError(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasData = weeklyData.some((item) => item.value > 0);

  const renderChartState = () => {
    if (isLoading) {
      return <Skeleton className="h-40 w-full rounded-2xl sm:h-48" />;
    }

    if (hasError) {
      return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-background/80 p-6 text-center sm:min-h-48">
          <div>
            <p className="text-sm font-medium text-foreground">Não foi possível carregar a receita semanal.</p>
            <p className="mt-1 text-xs text-muted-foreground">Os dados não foram substituídos por valores fictícios.</p>
          </div>
          <Button size="sm" variant="outline" onClick={load}>
            Atualizar
          </Button>
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/80 p-6 text-center sm:min-h-48">
          <p className="text-sm text-muted-foreground">Sem faturamento registrado nesta semana.</p>
        </div>
      );
    }

    return null;
  };

  const maxValue = useMemo(() => Math.max(...weeklyData.map((d) => d.value), 0), [weeklyData]);

  return (
    <Card className="border-border/70 bg-background/95 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Receita semanal
            </p>
            <CardTitle className="text-base sm:text-lg">Faturamento da Semana</CardTitle>
            <p className="text-sm text-muted-foreground">
              Leitura rápida da semana atual com destaque para o dia em andamento.
            </p>
          </div>
          {rangeLabel ? <Badge variant="outline">{rangeLabel}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
          {renderChartState() ?? (
          <div className="flex h-40 items-end justify-between gap-1 sm:h-48 sm:gap-2">
            {weeklyData.map((item, index) => {
              const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const todayDow = new Date().getDay();
              const isToday = index === (todayDow === 0 ? 6 : todayDow - 1);

              return (
                <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <span className="w-full truncate text-center text-xs text-muted-foreground sm:text-xs">
                    {item.value > 0 ? (
                      <span className="hidden sm:inline">{formatCurrency(item.value)}</span>
                    ) : (
                      '-'
                    )}
                  </span>
                  <div className="relative h-24 w-full overflow-hidden rounded-t-xl bg-background sm:h-36">
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-primary to-primary/70'
                          : 'bg-gradient-to-t from-primary/50 to-primary/25'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium sm:text-sm ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total da semana</p>
            <p className="mt-1 text-lg font-bold text-foreground sm:text-xl">
              {formatCurrency(weeklyData.reduce((acc, d) => acc + d.value, 0))}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Média diária</p>
            <p className="mt-1 text-lg font-bold text-primary sm:text-xl">
              {formatCurrency(weeklyData.reduce((acc, d) => acc + d.value, 0) / weeklyData.length)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
