import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { transactionsApi } from '@/lib/api';
import { getDateRangeFromFilter } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/format';

interface CashFlowChartProps {
  dateFilter: string;
}

export function CashFlowChart({ dateFilter }: CashFlowChartProps) {
  const [data, setData] = useState<Array<{ date: string; income: number; expenses: number; balance: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = getDateRangeFromFilter(dateFilter);
    setIsLoading(true);
    transactionsApi.getCashFlow({ from, to })
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [dateFilter]);

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            Fluxo de Caixa
          </CardTitle>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 && !isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sem dados para o período selecionado</p>
          </div>
        ) : (
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => {
                    const parts = String(d).split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
                  }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  width={72}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(Number(v) / 100)
                  }
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value / 100),
                    name === 'income' ? 'Entradas' : name === 'expenses' ? 'Saídas' : 'Saldo',
                  ]}
                  labelFormatter={(label) => `Data: ${String(label).split('-').reverse().join('/')}`}
                />
                <Legend
                  formatter={(value) =>
                    value === 'income' ? 'Entradas' : value === 'expenses' ? 'Saídas' : 'Saldo'
                  }
                />
                <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
