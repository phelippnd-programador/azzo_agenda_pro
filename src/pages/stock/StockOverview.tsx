import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HighlightMetricCard } from "@/components/ui/highlight-metric-card";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { StockDashboardResponse, StockItem, StockMovement } from "@/types/stock";
import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";
import { toast } from "sonner";
import { buildStockSummary, formatCurrency, formatDateTime, getListItems } from "./utils";

export default function StockOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [dashboard, setDashboard] = useState<StockDashboardResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [itemsResponse, movementResponse, dashboardResponse] = await Promise.all([
          stockApi.getItems({ page: 1, limit: 200 }),
          stockApi.getMovements({ page: 1, limit: 200 }),
          stockApi.getDashboard(),
        ]);
        setItems(getListItems(itemsResponse));
        setMovements(getListItems(movementResponse));
        setDashboard(dashboardResponse);
      } catch (error) {
        toast.error(resolveUiError(error, "Nao foi possivel carregar a visao geral de estoque.").message);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const summary = buildStockSummary(items, movements);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <HighlightMetricCard
          title="Itens cadastrados"
          value={String(summary.totalItens)}
          icon={Scale}
          className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
          titleClassName="text-primary"
          valueClassName="text-primary"
          iconContainerClassName="bg-primary/15"
          iconClassName="text-primary"
        />
        <HighlightMetricCard
          title="Abaixo do minimo"
          value={String(summary.itensAbaixoMinimo)}
          icon={ArrowDownCircle}
          className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
          titleClassName="text-red-700"
          valueClassName="text-red-800"
          iconContainerClassName="bg-red-100"
          iconClassName="text-red-600"
        />
        <HighlightMetricCard
          title="Itens zerados"
          value={String(summary.itensZerados)}
          icon={ArrowDownCircle}
          className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
          titleClassName="text-orange-700"
          valueClassName="text-orange-800"
          iconContainerClassName="bg-orange-100"
          iconClassName="text-orange-600"
        />
        <HighlightMetricCard
          title="Movimentacoes"
          value={String(summary.totalMovimentacoes)}
          icon={ArrowUpCircle}
          className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200"
          titleClassName="text-indigo-700"
          valueClassName="text-indigo-800"
          iconContainerClassName="bg-indigo-100"
          iconClassName="text-indigo-600"
        />
        <HighlightMetricCard
          title="Valor em estoque"
          value={formatCurrency(dashboard?.valorEstoqueCustoMedio ?? summary.valorEstoque)}
          icon={Scale}
          className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
          titleClassName="text-emerald-700"
          valueClassName="text-emerald-800"
          iconContainerClassName="bg-emerald-100"
          iconClassName="text-emerald-600"
        />
        <HighlightMetricCard
          title="Ruptura"
          value={`${Math.round(Number(dashboard?.rupturaTaxa || 0) * 100)}%`}
          icon={ArrowDownCircle}
          className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200"
          titleClassName="text-slate-700"
          valueClassName="text-slate-800"
          iconContainerClassName="bg-slate-100"
          iconClassName="text-slate-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ultimas movimentacoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!movements.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma movimentacao registrada.</p>
          ) : (
            movements.slice(0, 12).map((movement) => {
              const isEntrada = movement.tipo === "ENTRADA";
              const isSaida = movement.tipo === "SAIDA";
              const Icon = isEntrada ? ArrowUpCircle : isSaida ? ArrowDownCircle : Scale;
              return (
                <div
                  key={movement.id}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/40 rounded-xl hover:bg-muted/70 transition-colors"
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isEntrada ? "bg-green-100" : isSaida ? "bg-red-100" : "bg-indigo-100"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isEntrada ? "text-green-600" : isSaida ? "text-red-600" : "text-indigo-600"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{movement.motivo}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        {movement.tipo}
                      </Badge>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        Saldo: {movement.saldoAnterior} {"->"} {movement.saldoPosterior}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={`font-semibold text-sm sm:text-base ${
                        isEntrada ? "text-green-600" : isSaida ? "text-red-600" : "text-indigo-600"
                      }`}
                    >
                      {isEntrada ? "+" : isSaida ? "-" : ""}{movement.quantidade}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {formatDateTime(movement.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
