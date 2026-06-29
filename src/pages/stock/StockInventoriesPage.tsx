import { useEffect, useMemo, useState } from "react";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
import type {
  CreateStockInventoryRequest,
  StockInventory,
  StockInventoryCount,
  StockItem,
  StockInventoryCountRequest,
  UpdateStockInventoryCountRequest,
} from "@/types/stock";
import { formatDateTime } from "./utils";

const INVENTORY_STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  EM_CONTAGEM: "Em contagem",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
};

const initialInventoryForm: CreateStockInventoryRequest = {
  nome: "",
  observacao: "",
};

const initialCountForm: StockInventoryCountRequest = {
  itemEstoqueId: "",
  quantidadeContada: 0,
  observacao: "",
};

export default function StockInventoriesPage() {
  const navigate = useNavigate();
  const isCreateRoute = !!useMatch("/estoque/inventarios/novo");
  const detailMatch = useMatch("/estoque/inventarios/:id");
  const inventoryId = detailMatch?.params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSavingCount, setIsSavingCount] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [inventories, setInventories] = useState<StockInventory[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [inventoryForm, setInventoryForm] = useState<CreateStockInventoryRequest>(initialInventoryForm);
  const [countForm, setCountForm] = useState<StockInventoryCountRequest>(initialCountForm);

  const [counts, setCounts] = useState<StockInventoryCount[]>([]);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [editingCount, setEditingCount] = useState<StockInventoryCount | null>(null);
  const [editForm, setEditForm] = useState<UpdateStockInventoryCountRequest>({ quantidadeContada: 0, observacao: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      const [inventoriesResponse, itemsResponse] = await Promise.all([
        stockApi.listInventories(),
        stockApi.getItems({ page: 1, limit: 200 }),
      ]);
      const stockItems = Array.isArray(itemsResponse) ? itemsResponse : itemsResponse.items || [];
      setInventories(inventoriesResponse || []);
      setItems(stockItems);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar inventarios.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (isCreateRoute) {
      setIsCreateOpen(true);
      setInventoryForm(initialInventoryForm);
    }
  }, [isCreateRoute]);

  const selectedInventory = useMemo(
    () => inventories.find((inventory) => inventory.id === inventoryId) || null,
    [inventories, inventoryId]
  );
  const totalPages = Math.max(1, Math.ceil(inventories.length / pageSize));
  const pagedInventories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return inventories.slice(start, start + pageSize);
  }, [inventories, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!inventoryId || isLoading) return;
    if (!selectedInventory) {
      toast.error("Inventario nao encontrado.");
      navigate("/estoque/inventarios", { replace: true });
    }
  }, [inventoryId, selectedInventory, isLoading]);

  const loadCounts = async (id: string) => {
    try {
      setIsLoadingCounts(true);
      const result = await stockApi.listInventoryCounts(id);
      setCounts(result || []);
    } catch {
      setCounts([]);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  useEffect(() => {
    if (inventoryId && !isCreateRoute) {
      void loadCounts(inventoryId);
    } else {
      setCounts([]);
    }
  }, [inventoryId, isCreateRoute]);

  const handleUpdateCount = async () => {
    if (!selectedInventory || !editingCount) return;
    if (editForm.quantidadeContada < 0) {
      toast.error("Quantidade deve ser maior ou igual a zero.");
      return;
    }
    try {
      setIsSavingEdit(true);
      const updated = await stockApi.updateInventoryCount(selectedInventory.id, editingCount.id, {
        quantidadeContada: Number(editForm.quantidadeContada),
        observacao: editForm.observacao?.trim() || undefined,
      });
      setCounts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCount(null);
      toast.success("Contagem atualizada.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel atualizar contagem.").message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreate = async () => {
    if (!inventoryForm.nome?.trim()) {
      toast.error("Informe o nome do inventario.");
      return;
    }
    try {
      setIsCreating(true);
      const created = await stockApi.createInventory({
        nome: inventoryForm.nome.trim(),
        observacao: inventoryForm.observacao?.trim() || undefined,
      });
      setInventories((prev) => [created, ...prev]);
      setIsCreateOpen(false);
      setInventoryForm(initialInventoryForm);
      toast.success("Inventario criado com sucesso.");
      navigate(`/estoque/inventarios/${created.id}`, { replace: true });
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel criar inventario.").message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegisterCount = async () => {
    if (!selectedInventory) return;
    if (!countForm.itemEstoqueId) {
      toast.error("Selecione um item para contagem.");
      return;
    }
    if (countForm.quantidadeContada < 0) {
      toast.error("Quantidade contada deve ser maior ou igual a zero.");
      return;
    }

    try {
      setIsSavingCount(true);
      const updated = await stockApi.registerInventoryCount(selectedInventory.id, {
        itemEstoqueId: countForm.itemEstoqueId,
        quantidadeContada: Number(countForm.quantidadeContada),
        observacao: countForm.observacao?.trim() || undefined,
      });
      setInventories((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
      setCountForm(initialCountForm);
      toast.success("Contagem registrada com sucesso.");
      await load();
      void loadCounts(selectedInventory.id);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel registrar contagem.").message);
    } finally {
      setIsSavingCount(false);
    }
  };

  const handleCloseInventory = async () => {
    if (!selectedInventory) return;
    try {
      setIsClosing(true);
      const updated = await stockApi.closeInventory(selectedInventory.id);
      setInventories((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
      toast.success("Inventario fechado com sucesso.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel fechar inventario.").message);
    } finally {
      setIsClosing(false);
    }
  };

  const getStatusVariant = (status: StockInventory["status"]) => {
    if (status === "FECHADO") return "secondary" as const;
    if (status === "CANCELADO") return "destructive" as const;
    if (status === "EM_CONTAGEM") return "default" as const;
    return "outline" as const;
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/80">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Inventarios de estoque</CardTitle>
            <Button asChild>
              <Link to="/estoque/inventarios/novo">Novo inventario</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Acompanhe contagens abertas, registre divergencias e feche o inventario quando o ciclo terminar.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {!inventories.length ? (
            <PageEmptyState
              title="Nenhum inventario cadastrado"
              description="Crie um inventario para iniciar a contagem ciclica."
              action={{ label: "Novo inventario", onClick: () => navigate("/estoque/inventarios/novo") }}
            />
          ) : (
            pagedInventories.map((inventory) => (
              <Link
                key={inventory.id}
                to={`/estoque/inventarios/${inventory.id}`}
                className="block rounded-xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{inventory.nome}</p>
                  <Badge variant={getStatusVariant(inventory.status)}>{INVENTORY_STATUS_LABELS[inventory.status] ?? inventory.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Abertura: {formatDateTime(inventory.dataAbertura)} | Fechamento:{" "}
                  {formatDateTime(inventory.dataFechamento || undefined)}
                </p>
              </Link>
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

      {selectedInventory ? (
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{selectedInventory.nome}</CardTitle>
              <Badge variant={getStatusVariant(selectedInventory.status)}>{INVENTORY_STATUS_LABELS[selectedInventory.status] ?? selectedInventory.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedInventory.observacao || "Sem observacoes para este inventario."}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 font-semibold text-foreground">
                  {INVENTORY_STATUS_LABELS[selectedInventory.status] ?? selectedInventory.status}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Abertura</p>
                <p className="mt-1 font-semibold text-foreground">{formatDateTime(selectedInventory.dataAbertura)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Fechamento</p>
                <p className="mt-1 font-semibold text-foreground">
                  {selectedInventory.dataFechamento ? formatDateTime(selectedInventory.dataFechamento) : "Em aberto"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1 md:col-span-2">
                <Label>Item para contagem</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={countForm.itemEstoqueId}
                  onChange={(e) => setCountForm((prev) => ({ ...prev, itemEstoqueId: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} ({item.unidadeMedida})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Quantidade contada</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={countForm.quantidadeContada === 0 ? "" : countForm.quantidadeContada}
                  onChange={(e) =>
                    setCountForm((prev) => ({
                      ...prev,
                      quantidadeContada: e.target.value === "" ? 0 : Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observacao da contagem (opcional)</Label>
              <Input
                value={countForm.observacao || ""}
                onChange={(e) => setCountForm((prev) => ({ ...prev, observacao: e.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleRegisterCount()} disabled={isSavingCount || selectedInventory.status === "FECHADO" || selectedInventory.status === "CANCELADO"}>
                {isSavingCount ? "Salvando..." : "Registrar contagem"}
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleCloseInventory()}
                disabled={isClosing || selectedInventory.status === "FECHADO" || selectedInventory.status === "CANCELADO"}
              >
                {isClosing ? "Fechando..." : "Fechar inventario"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedInventory && (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Contagens registradas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCounts ? (
              <Skeleton className="h-24 w-full" />
            ) : counts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma contagem registrada neste inventario.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Item</th>
                      <th className="pb-2 pr-4 font-medium text-right">Esperado</th>
                      <th className="pb-2 pr-4 font-medium text-right">Contado</th>
                      <th className="pb-2 pr-4 font-medium text-right">Diferenca</th>
                      <th className="pb-2 pr-4 font-medium">Observacao</th>
                      <th className="pb-2 font-medium">Data</th>
                      {selectedInventory.status !== "FECHADO" && selectedInventory.status !== "CANCELADO" && (
                        <th className="pb-2" />
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {counts.map((count) => {
                      const diff = count.diferenca ?? (count.quantidadeContada - count.quantidadeEsperada);
                      return (
                        <tr key={count.id} className="align-middle">
                          <td className="py-2 pr-4 font-medium">
                            {count.itemNome ?? count.itemEstoqueId}
                            {count.itemUnidadeMedida ? (
                              <span className="ml-1 text-xs text-muted-foreground">({count.itemUnidadeMedida})</span>
                            ) : null}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">{Number(count.quantidadeEsperada).toFixed(2)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{Number(count.quantidadeContada).toFixed(2)}</td>
                          <td className={`py-2 pr-4 text-right tabular-nums font-medium ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                            {diff > 0 ? "+" : ""}{Number(diff).toFixed(2)}
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground max-w-[160px] truncate">{count.observacao || "—"}</td>
                          <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap text-xs">{formatDateTime(count.createdAt)}</td>
                          {selectedInventory.status !== "FECHADO" && selectedInventory.status !== "CANCELADO" && (
                            <td className="py-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingCount(count);
                                  setEditForm({ quantidadeContada: count.quantidadeContada, observacao: count.observacao || "" });
                                }}
                              >
                                Editar
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingCount} onOpenChange={(open) => { if (!open) setEditingCount(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar contagem</DialogTitle>
            <DialogDescription>
              {editingCount?.itemNome ?? "Item"} — ajuste a quantidade contada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Quantidade contada</Label>
              <Input
                type="number"
                min="0"
                step="0.0001"
                value={editForm.quantidadeContada === 0 ? "" : editForm.quantidadeContada}
                onChange={(e) => setEditForm((prev) => ({ ...prev, quantidadeContada: e.target.value === "" ? 0 : Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Observacao (opcional)</Label>
              <Input
                value={editForm.observacao || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, observacao: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCount(null)}>Cancelar</Button>
            <Button onClick={() => void handleUpdateCount()} disabled={isSavingEdit}>
              {isSavingEdit ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open && isCreateRoute) navigate("/estoque/inventarios", { replace: true });
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo inventario</DialogTitle>
            <DialogDescription>Cadastre um inventario para iniciar a contagem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={inventoryForm.nome}
                onChange={(e) => setInventoryForm((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex.: Inventario mensal - Marco/2026"
              />
            </div>
            <div className="space-y-1">
              <Label>Observacao (opcional)</Label>
              <Input
                value={inventoryForm.observacao || ""}
                onChange={(e) => setInventoryForm((prev) => ({ ...prev, observacao: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                if (isCreateRoute) navigate("/estoque/inventarios", { replace: true });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleCreate()} disabled={isCreating}>
              {isCreating ? "Salvando..." : "Criar inventario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
