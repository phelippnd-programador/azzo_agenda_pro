import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyCents } from '@/lib/format';
import { dashboardApi } from '@/lib/api';

const fallbackWeeklyData = [
  { day: 'Seg', value: 1250 },
  { day: 'Ter', value: 980 },
  { day: 'Qua', value: 1450 },
  { day: 'Qui', value: 1120 },
  { day: 'Sex', value: 1680 },
  { day: 'Sab', value: 890 },
  { day: 'Dom', value: 0 },
];

export function RevenueChart() {
  const [weeklyData, setWeeklyData] = useState(fallbackWeeklyData);
  const [rangeLabel, setRangeLabel] = useState('');

  useEffect(() => {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const start = monday.toISOString().split('T')[0];
    const end = sunday.toISOString().split('T')[0];
    setRangeLabel(`${start} a ${end}`);

    dashboardApi
      .getWeeklyRevenue(start, end)
      .then((data) => {
        if (data.points?.length) {
          setWeeklyData(data.points.map((p) => ({ day: p.day, value: p.value })));
        }
      })
      .catch(() => undefined);
  }, []);

  const maxValue = useMemo(() => Math.max(...weeklyData.map((d) => d.value), 0), [weeklyData]);

  return (
    <Card className="border-border/60 bg-background/95 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg">Faturamento da Semana</CardTitle>
            <p className="text-sm text-muted-foreground">
              Leitura rapida da semana atual com destaque para o dia em andamento.
            </p>
          </div>
          {rangeLabel ? <Badge variant="outline">{rangeLabel}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
          <div className="flex h-40 items-end justify-between gap-1 sm:h-48 sm:gap-2">
            {weeklyData.map((item, index) => {
              const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const todayDow = new Date().getDay();
              const isToday = index === (todayDow === 0 ? 6 : todayDow - 1);

              return (
                <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <span className="w-full truncate text-center text-[9px] text-muted-foreground sm:text-xs">
                    {item.value > 0 ? (
                      <span className="hidden sm:inline">{formatCurrencyCents(item.value)}</span>
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
                  <span className={`text-[10px] font-medium sm:text-sm ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total da semana</p>
            <p className="mt-1 text-lg font-bold text-foreground sm:text-xl">
              {formatCurrencyCents(weeklyData.reduce((acc, d) => acc + d.value, 0))}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Media diaria</p>
            <p className="mt-1 text-lg font-bold text-primary sm:text-xl">
              {formatCurrencyCents(weeklyData.reduce((acc, d) => acc + d.value, 0) / weeklyData.length)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
