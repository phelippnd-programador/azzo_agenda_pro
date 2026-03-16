import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageEmptyState } from "@/components/ui/page-states";
import { Skeleton } from "@/components/ui/skeleton";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { CreateStockMovementRequest, StockItem, StockMovement, StockMovementType } from "@/types/stock";
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, Scale } from "lucide-react";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDateTime, getListItems } from "./utils";

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste",
};

const defaultForm: CreateStockMovementRequest = {
  itemEstoqueId: "",
  tipo: "ENTRADA",
  quantidade: 0,
  motivo: "",
  origem: "MANUAL",
  valorUnitarioPago: 0,
  gerarLancamentoFinanceiro: false,
};

export default function StockMovementsPage() {
  const navigate = useNavigate();
  const isCreateRoute = !!useMatch("/estoque/movimentacoes/nova");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedType, setSelectedType] = useState<"all" | StockMovementType>("all");
  const [selectedItem, setSelectedItem] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [form, setForm] = useState<CreateStockMovementRequest>(defaultForm);

  const load = async () => {
    try {
      setIsLoading(true);
      const [itemsResponse, movementResponse] = await Promise.all([
        stockApi.getItems({ page: 1, limit: 300 }),
        stockApi.getMovements({ page: 1, limit: 500 }),
      ]);
      setItems(getListItems(itemsResponse));
      setMovements(getListItems(movementResponse));
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar movimentacoes.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (isCreateRoute) {
      setIsDialogOpen(true);
    }
  }, [isCreateRoute]);

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const matchesType = selectedType === "all" || movement.tipo === selectedType;
      const matchesItem = selectedItem === "all" || movement.itemEstoqueId === selectedItem;
      return matchesType && matchesItem;
    });
  }, [movements, selectedType, selectedItem]);

  const pagedMovements = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMovements.slice(start, start + pageSize);
  }, [filteredMovements, page]);
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [selectedItem, selectedType]);

  const handleCreate = async () => {
    if (!form.itemEstoqueId || !form.motivo.trim()) {
      toast.error("Selecione item e informe motivo.");
      return;
    }
    if (!form.quantidade || form.quantidade <= 0) {
      toast.error("Informe uma quantidade valida.");
      return;
    }

    setIsSaving(true);
    try {
      await stockApi.createMovement({
        ...form,
        quantidade: Number(form.quantidade),
        valorUnitarioPago:
          typeof form.valorUnitarioPago === "number" ? Number(form.valorUnitarioPago) : undefined,
      });
      toast.success("Movimentacao registrada com sucesso.");
      setIsDialogOpen(false);
      setForm(defaultForm);
      await load();
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao registrar movimentacao.").message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Movimentacoes de estoque</CardTitle>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open && isCreateRoute) {
                navigate("/estoque/movimentacoes", { replace: true });
              }
            }}
          >
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/estoque/movimentacoes/nova"><ArrowLeftRight className="h-4 w-4" />Nova movimentacao</Link>
            </Button>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova movimentacao</DialogTitle>
                <DialogDescription>Registre entrada, saida ou ajuste de saldo.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Item</Label>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.itemEstoqueId} onChange={(e) => setForm((prev) => ({ ...prev, itemEstoqueId: e.target.value }))}>
                    <option value="">Selecione</option>
                    {items.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.tipo} onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value as CreateStockMovementRequest["tipo"] }))}>
                      <option value="ENTRADA">ENTRADA</option>
                      <option value="SAIDA">SAIDA</option>
                      <option value="AJUSTE">AJUSTE</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Quantidade</Label>
                    <Input type="number" min="0.0001" step="0.0001" value={form.quantidade} onChange={(e) => setForm((prev) => ({ ...prev, quantidade: Number(e.target.value || 0) }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Motivo</Label>
                  <Input value={form.motivo} onChange={(e) => setForm((prev) => ({ ...prev, motivo: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Valor unitario pago (opcional)</Label>
                  <Input type="number" min="0" step="0.0001" value={form.valorUnitarioPago || 0} onChange={(e) => setForm((prev) => ({ ...prev, valorUnitarioPago: Number(e.target.value || 0) }))} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    if (isCreateRoute) navigate("/estoque/movimentacoes", { replace: true });
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={() => void handleCreate()} disabled={isSaving}>{isSaving ? "Salvando..." : "Registrar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={selectedType} onChange={(e) => setSelectedType(e.target.value as "all" | StockMovementType)}>
            <option value="all">Todos os tipos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SAIDA">Saidas</option>
            <option value="AJUSTE">Ajustes</option>
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
            <option value="all">Todos os itens</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!filteredMovements.length ? (
          <PageEmptyState
            title="Nenhuma movimentacao encontrada"
            description="Registre uma entrada, saida ou ajuste para iniciar o historico."
            action={{
              label: "Nova movimentacao",
              onClick: () => navigate("/estoque/movimentacoes/nova"),
            }}
          />
        ) : (
          pagedMovements.map((movement) => {
            const isEntrada = movement.tipo === "ENTRADA";
            const isSaida = movement.tipo === "SAIDA";
            const Icon = isEntrada ? ArrowUpCircle : isSaida ? ArrowDownCircle : Scale;
            const itemNome = items.find((item) => item.id === movement.itemEstoqueId)?.nome || "Item";

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
                      {MOVEMENT_TYPE_LABELS[movement.tipo] ?? movement.tipo}
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{itemNome}</span>
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
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDateTime(movement.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
        <PaginationControls
          page={page}
          totalPages={totalPages}
          isLoading={isLoading}
          onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </CardContent>
    </Card>
  );
}
