import { useEffect, useMemo, useState } from "react";
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

type RevenuePoint = {
  label: string;
  date: string;
  value: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function MonthlyRevenueLineChart() {
  const [points, setPoints] = useState<RevenuePoint[]>([]);

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const start = monthStart.toISOString().split("T")[0];
    const end = monthEnd.toISOString().split("T")[0];

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
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Faturamento do Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 sm:h-64">
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
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label) => `Dia ${label}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 gap-2 sm:gap-0">
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Total do Mes</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              {formatCurrency(monthlyTotal)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs sm:text-sm text-gray-500">Media Diaria</p>
            <p className="text-lg sm:text-xl font-bold text-violet-600">
              {formatCurrency(monthlyAverage)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
