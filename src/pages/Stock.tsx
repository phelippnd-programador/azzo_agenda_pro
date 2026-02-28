import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { stockApi } from "@/lib/api";
import type {
  CreateStockItemRequest,
  CreateStockMovementRequest,
  StockItem,
  StockMovement,
} from "@/types/stock";
import { resolveUiError } from "@/lib/error-utils";
import { Boxes, Plus, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(parsed);
};

const getListItems = <T,>(response: T[] | { items?: T[] } | null | undefined) =>
  Array.isArray(response) ? response : response?.items || [];

export default function Stock() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingMovement, setIsSavingMovement] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);

  const [itemForm, setItemForm] = useState<CreateStockItemRequest>({
    nome: "",
    sku: "",
    unidadeMedida: "UN",
    estoqueMinimo: 0,
    ativo: true,
  });
  const [movementForm, setMovementForm] = useState<CreateStockMovementRequest>({
    itemEstoqueId: "",
    tipo: "ENTRADA",
    quantidade: 0,
    motivo: "",
    origem: "MANUAL",
    valorUnitarioPago: 0,
    gerarLancamentoFinanceiro: false,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [itemsResponse, movementResponse] = await Promise.all([
        stockApi.getItems({ page: 1, limit: 200 }),
        stockApi.getMovements({ page: 1, limit: 200 }),
      ]);
      setItems(getListItems(itemsResponse));
      setMovements(getListItems(movementResponse));
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar dados de estoque.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totals = useMemo(() => {
    const itensAbaixoMinimo = items.filter((item) => item.saldoAtual <= item.estoqueMinimo).length;
    const valorEstoque = items.reduce(
      (sum, item) => sum + item.saldoAtual * Number(item.custoMedioUnitario || 0),
      0
    );
    return {
      itensAbaixoMinimo,
      itensZerados: items.filter((item) => item.saldoAtual <= 0).length,
      valorEstoque,
    };
  }, [items]);

  const handleCreateItem = async () => {
    if (!itemForm.nome.trim() || !itemForm.unidadeMedida.trim()) {
      toast.error("Nome e unidade de medida sao obrigatorios.");
      return;
    }
    setIsSavingItem(true);
    try {
      await stockApi.createItem({
        ...itemForm,
        estoqueMinimo: Number(itemForm.estoqueMinimo || 0),
      });
      toast.success("Item de estoque criado com sucesso.");
      setIsItemDialogOpen(false);
      setItemForm({
        nome: "",
        sku: "",
        unidadeMedida: "UN",
        estoqueMinimo: 0,
        ativo: true,
      });
      await loadData();
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao criar item de estoque.").message);
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleCreateMovement = async () => {
    if (!movementForm.itemEstoqueId || !movementForm.tipo || !movementForm.motivo.trim()) {
      toast.error("Selecione item, tipo e informe o motivo.");
      return;
    }
    if (!movementForm.quantidade || movementForm.quantidade <= 0) {
      toast.error("Informe uma quantidade valida.");
      return;
    }
    setIsSavingMovement(true);
    try {
      await stockApi.createMovement({
        ...movementForm,
        quantidade: Number(movementForm.quantidade),
        valorUnitarioPago:
          movementForm.valorUnitarioPago !== undefined
            ? Number(movementForm.valorUnitarioPago)
            : undefined,
      });
      toast.success("Movimentacao registrada com sucesso.");
      setIsMovementDialogOpen(false);
      setMovementForm({
        itemEstoqueId: "",
        tipo: "ENTRADA",
        quantidade: 0,
        motivo: "",
        origem: "MANUAL",
        valorUnitarioPago: 0,
        gerarLancamentoFinanceiro: false,
      });
      await loadData();
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao registrar movimentacao.").message);
    } finally {
      setIsSavingMovement(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Estoque" subtitle="Controle de itens e movimentacoes">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Estoque" subtitle="Controle de itens e movimentacoes">
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Itens abaixo do minimo</p>
              <p className="text-2xl font-bold text-destructive">{totals.itensAbaixoMinimo}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Itens zerados</p>
              <p className="text-2xl font-bold">{totals.itensZerados}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Valor em estoque (custo medio)</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.valorEstoque)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo item de estoque</DialogTitle>
                <DialogDescription>Cadastre um novo item para controle de estoque.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nome</Label>
                  <Input value={itemForm.nome} onChange={(e) => setItemForm((prev) => ({ ...prev, nome: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>SKU</Label>
                    <Input value={itemForm.sku || ""} onChange={(e) => setItemForm((prev) => ({ ...prev, sku: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Unidade</Label>
                    <Input value={itemForm.unidadeMedida} onChange={(e) => setItemForm((prev) => ({ ...prev, unidadeMedida: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Estoque minimo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={itemForm.estoqueMinimo}
                    onChange={(e) =>
                      setItemForm((prev) => ({ ...prev, estoqueMinimo: Number(e.target.value || 0) }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => void handleCreateItem()} disabled={isSavingItem}>
                  {isSavingItem ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowLeftRight className="w-4 h-4" />
                Nova Movimentacao
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Movimentacao de estoque</DialogTitle>
                <DialogDescription>Registre entrada, saida ou ajuste.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Item</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={movementForm.itemEstoqueId}
                    onChange={(e) =>
                      setMovementForm((prev) => ({ ...prev, itemEstoqueId: e.target.value }))
                    }
                  >
                    <option value="">Selecione</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={movementForm.tipo}
                      onChange={(e) =>
                        setMovementForm((prev) => ({
                          ...prev,
                          tipo: e.target.value as CreateStockMovementRequest["tipo"],
                        }))
                      }
                    >
                      <option value="ENTRADA">ENTRADA</option>
                      <option value="SAIDA">SAIDA</option>
                      <option value="AJUSTE">AJUSTE</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={movementForm.quantidade}
                      onChange={(e) =>
                        setMovementForm((prev) => ({
                          ...prev,
                          quantidade: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Motivo</Label>
                  <Input
                    value={movementForm.motivo}
                    onChange={(e) =>
                      setMovementForm((prev) => ({ ...prev, motivo: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Valor unitario pago (opcional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={movementForm.valorUnitarioPago || 0}
                    onChange={(e) =>
                      setMovementForm((prev) => ({
                        ...prev,
                        valorUnitarioPago: Number(e.target.value || 0),
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => void handleCreateMovement()} disabled={isSavingMovement}>
                  {isSavingMovement ? "Salvando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="w-5 h-5" />
              Itens de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!items.length ? (
              <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {item.sku || "-"} | Unidade: {item.unidadeMedida}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      Saldo: <span className="font-semibold">{item.saldoAtual}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Minimo: {item.estoqueMinimo}</p>
                    <Badge variant={item.saldoAtual <= item.estoqueMinimo ? "destructive" : "outline"}>
                      {item.saldoAtual <= item.estoqueMinimo ? "Abaixo do minimo" : "Normal"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimas movimentacoes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!movements.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma movimentacao registrada.</p>
            ) : (
              movements.slice(0, 15).map((movement) => (
                <div key={movement.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{movement.tipo}</Badge>
                      <p className="text-sm">{movement.motivo}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(movement.createdAt)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quantidade: {movement.quantidade} | Saldo: {movement.saldoAnterior} {"->"}{" "}
                    {movement.saldoPosterior}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
