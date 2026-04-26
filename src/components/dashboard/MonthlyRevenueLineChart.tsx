import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/lib/api";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrencyCents } from "@/lib/format";

type RevenuePoint = {
  label: string;
  date: string;
  value: number;
};

export function MonthlyRevenueLineChart() {
  const [points, setPoints] = useState<RevenuePoint[]>([]);
  const [rangeLabel, setRangeLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const start = monthStart.toISOString().split("T")[0];
    const end = monthEnd.toISOString().split("T")[0];
    setRangeLabel(`${start} a ${end}`);

    dashboardApi
      .getWeeklyRevenue(start, end)
      .then((data) => {
        if (!data.points?.length) {
          setPoints([]);
          return;
        }
        setPoints(
          data.points.map((point) => {
            const date = point.date || "";
            const dayLabel = date ? date.slice(-2) : point.day;
            return {
              label: dayLabel,
              date,
              value: point.value,
            };
          })
        );
      })
      .catch(() => setPoints([]));
  }, []);

  const monthlyTotal = useMemo(
    () => points.reduce((total, point) => total + point.value, 0),
    [points]
  );

  const monthlyAverage = useMemo(
    () => (points.length ? monthlyTotal / points.length : 0),
    [monthlyTotal, points.length]
  );

  return (
    <Card className="border-border/60 bg-background/95 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg">Faturamento do Mes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Evolucao do mes atual para leitura de ritmo e tendencia.
            </p>
          </div>
          {rangeLabel ? <Badge variant="outline">{rangeLabel}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
          {points.length === 0 ? (
            <div className="flex h-56 items-center justify-center sm:h-64">
              <p className="text-sm text-muted-foreground">Sem faturamento registrado neste mes.</p>
            </div>
          ) : null}
          <div className={points.length === 0 ? "hidden" : "h-56 sm:h-64"}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis
                  width={80}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(Number(value))
                  }
                />
                <Tooltip formatter={(value) => formatCurrencyCents(Number(value))} labelFormatter={(label) => `Dia ${label}`} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total do mes</p>
            <p className="mt-1 text-lg font-bold text-foreground sm:text-xl">{formatCurrencyCents(monthlyTotal)}</p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Media diaria</p>
            <p className="mt-1 text-lg font-bold text-primary sm:text-xl">{formatCurrencyCents(monthlyAverage)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
