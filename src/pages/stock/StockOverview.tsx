import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { StockDashboardResponse, StockItem, StockMovement } from "@/types/stock";
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Itens cadastrados</p><p className="text-xl font-semibold">{summary.totalItens}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Abaixo do minimo</p><p className="text-xl font-semibold text-destructive">{summary.itensAbaixoMinimo}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Itens zerados</p><p className="text-xl font-semibold">{summary.itensZerados}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Movimentacoes</p><p className="text-xl font-semibold">{summary.totalMovimentacoes}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Valor em estoque</p><p className="text-xl font-semibold">{formatCurrency(dashboard?.valorEstoqueCustoMedio ?? summary.valorEstoque)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ruptura</p><p className="text-xl font-semibold">{Math.round(Number(dashboard?.rupturaTaxa || 0) * 100)}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ultimas movimentacoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!movements.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma movimentacao registrada.</p>
          ) : (
            movements.slice(0, 12).map((movement) => (
              <div key={movement.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{movement.tipo}</Badge>
                    <p className="text-sm">{movement.motivo}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDateTime(movement.createdAt)}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Quantidade: {movement.quantidade} | Saldo: {movement.saldoAnterior} {"->"} {movement.saldoPosterior}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
