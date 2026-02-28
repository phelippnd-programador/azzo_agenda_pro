import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { CreateStockMovementRequest, StockItem, StockMovement, StockMovementType } from "@/types/stock";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime, getListItems } from "./utils";

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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><ArrowLeftRight className="h-4 w-4" />Nova movimentacao</Button>
            </DialogTrigger>
            <DialogContent>
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
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
          <p className="text-sm text-muted-foreground">Nenhuma movimentacao encontrada.</p>
        ) : (
          pagedMovements.map((movement) => (
            <div key={movement.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{movement.tipo}</Badge>
                  <p className="text-sm">{movement.motivo}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTime(movement.createdAt)}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Quantidade: {movement.quantidade} | Saldo: {movement.saldoAnterior} {"->"} {movement.saldoPosterior}</p>
            </div>
          ))
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
