import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/mockData';
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

  useEffect(() => {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const start = monday.toISOString().split('T')[0];
    const end = sunday.toISOString().split('T')[0];

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
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Faturamento da Semana</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-36 sm:h-48">
          {weeklyData.map((item, index) => {
            const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const todayDow = new Date().getDay();
            const isToday = index === (todayDow === 0 ? 6 : todayDow - 1);

            return (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                <span className="text-[9px] sm:text-xs text-muted-foreground truncate w-full text-center">
                  {item.value > 0 ? <span className="hidden sm:inline">{formatCurrency(item.value)}</span> : '-'}
                </span>
                <div className="w-full h-24 sm:h-36 bg-muted rounded-t-lg relative overflow-hidden">
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-primary to-primary/70'
                        : 'bg-gradient-to-t from-primary/50 to-primary/25'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className={`text-[10px] sm:text-sm font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border gap-2 sm:gap-0">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total da Semana</p>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              {formatCurrency(weeklyData.reduce((acc, d) => acc + d.value, 0))}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs sm:text-sm text-muted-foreground">Media Diaria</p>
            <p className="text-lg sm:text-xl font-bold text-primary">
              {formatCurrency(weeklyData.reduce((acc, d) => acc + d.value, 0) / weeklyData.length)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
