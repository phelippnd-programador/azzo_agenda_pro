import { useEffect, useRef, useState } from "react";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageEmptyState } from "@/components/ui/page-states";
import { Skeleton } from "@/components/ui/skeleton";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type {
  CancelStockInventoryRequest,
  CreateStockInventoryRequest,
  StockInventory,
  StockInventoryCount,
  StockInventoryFilters,
  StockInventoryStatus,
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

const STATUS_OPTIONS: { value: StockInventoryStatus | ""; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "EM_CONTAGEM", label: "Em contagem" },
  { value: "ABERTO", label: "Aberto" },
  { value: "FECHADO", label: "Fechado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const PAGE_SIZE = 15;

const initialInventoryForm: CreateStockInventoryRequest = { nome: "", observacao: "" };
const initialCountForm: StockInventoryCountRequest = { itemEstoqueId: "", quantidadeContada: 0, observacao: "" };

export default function StockInventoriesPage() {
  const navigate = useNavigate();
  const isCreateRoute = !!useMatch("/estoque/inventarios/novo");

  // --- lista paginada ---
  const [isLoading, setIsLoading] = useState(true);
  const [inventories, setInventories] = useState<StockInventory[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // --- filtros ---
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockInventoryStatus | "">("");
  const [appliedFilters, setAppliedFilters] = useState<StockInventoryFilters>({ page: 1, limit: PAGE_SIZE });
  const searchRef = useRef<HTMLInputElement>(null);

  // --- modal de gerenciamento ---
  const [selectedInventory, setSelectedInventory] = useState<StockInventory | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [items, setItems] = useState<StockItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [counts, setCounts] = useState<StockInventoryCount[]>([]);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [countForm, setCountForm] = useState<StockInventoryCountRequest>(initialCountForm);
  const [isSavingCount, setIsSavingCount] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // --- editar contagem ---
  const [editingCount, setEditingCount] = useState<StockInventoryCount | null>(null);
  const [editForm, setEditForm] = useState<UpdateStockInventoryCountRequest>({ quantidadeContada: 0, observacao: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // --- cancelar inventário ---
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState<CancelStockInventoryRequest>({ senha: "", motivo: "" });
  const [isCancelling, setIsCancelling] = useState(false);

  // --- criar inventário ---
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inventoryForm, setInventoryForm] = useState<CreateStockInventoryRequest>(initialInventoryForm);

  // --- carga da lista ---
  const loadInventories = async (filters: StockInventoryFilters) => {
    try {
      setIsLoading(true);
      const result = await stockApi.listInventories(filters);
      setInventories(result.items ?? []);
      setTotalPages(result.totalPages ?? 1);
      setTotal(result.total ?? 0);
      setHasNext(result.hasNext ?? false);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar inventarios.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInventories(appliedFilters);
  }, [appliedFilters]);

  useEffect(() => {
    if (isCreateRoute) {
      setIsCreateOpen(true);
      setInventoryForm(initialInventoryForm);
    }
  }, [isCreateRoute]);

  // --- filtros ---
  const applyFilters = () => {
    const next: StockInventoryFilters = {
      page: 1,
      limit: PAGE_SIZE,
      search: searchInput.trim() || undefined,
      status: statusFilter || undefined,
    };
    setPage(1);
    setAppliedFilters(next);
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("");
    setPage(1);
    setAppliedFilters({ page: 1, limit: PAGE_SIZE });
  };

  const handlePageChange = (next: number) => {
    setPage(next);
    setAppliedFilters((prev) => ({ ...prev, page: next }));
  };

  // --- abrir modal de gerenciamento ---
  const openManage = async (inventory: StockInventory) => {
    setSelectedInventory(inventory);
    setCountForm(initialCountForm);
    setCounts([]);
    setIsManageOpen(true);
    await Promise.all([loadCounts(inventory.id), loadItems()]);
  };

  const loadCounts = async (id: string) => {
    try {
      setIsLoadingCounts(true);
      const result = await stockApi.listInventoryCounts(id);
      setCounts(result ?? []);
    } catch {
      setCounts([]);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const loadItems = async () => {
    if (items.length > 0) return;
    try {
      setIsLoadingItems(true);
      const result = await stockApi.getItems({ page: 1, limit: 200 });
      const stockItems = Array.isArray(result) ? result : result.items ?? [];
      setItems(stockItems);
    } catch {
      setItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // --- ações no inventário selecionado ---
  const handleRegisterCount = async () => {
    if (!selectedInventory) return;
    if (!countForm.itemEstoqueId) { toast.error("Selecione um item para contagem."); return; }
    if (countForm.quantidadeContada < 0) { toast.error("Quantidade deve ser maior ou igual a zero."); return; }
    try {
      setIsSavingCount(true);
      await stockApi.registerInventoryCount(selectedInventory.id, {
        itemEstoqueId: countForm.itemEstoqueId,
        quantidadeContada: Number(countForm.quantidadeContada),
        observacao: countForm.observacao?.trim() || undefined,
      });
      setCountForm(initialCountForm);
      toast.success("Contagem registrada.");
      void loadCounts(selectedInventory.id);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel registrar contagem.").message);
    } finally {
      setIsSavingCount(false);
    }
  };

  const handleUpdateCount = async () => {
    if (!selectedInventory || !editingCount) return;
    if (editForm.quantidadeContada < 0) { toast.error("Quantidade deve ser maior ou igual a zero."); return; }
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

  const handleCloseInventory = async () => {
    if (!selectedInventory) return;
    try {
      setIsClosing(true);
      const updated = await stockApi.closeInventory(selectedInventory.id);
      setSelectedInventory(updated);
      setInventories((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
      toast.success("Inventario fechado com sucesso.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel fechar inventario.").message);
    } finally {
      setIsClosing(false);
    }
  };

  const handleCancelInventory = async () => {
    if (!selectedInventory) return;
    if (!cancelForm.senha.trim()) { toast.error("Informe sua senha para confirmar o cancelamento."); return; }
    try {
      setIsCancelling(true);
      const updated = await stockApi.cancelInventory(selectedInventory.id, {
        senha: cancelForm.senha,
        motivo: cancelForm.motivo?.trim() || undefined,
      });
      setSelectedInventory(updated);
      setInventories((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
      setIsCancelOpen(false);
      setCancelForm({ senha: "", motivo: "" });
      toast.success("Inventario cancelado.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel cancelar inventario.").message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCreate = async () => {
    if (!inventoryForm.nome?.trim()) { toast.error("Informe o nome do inventario."); return; }
    try {
      setIsCreating(true);
      const created = await stockApi.createInventory({
        nome: inventoryForm.nome.trim(),
        observacao: inventoryForm.observacao?.trim() || undefined,
      });
      setIsCreateOpen(false);
      setInventoryForm(initialInventoryForm);
      toast.success("Inventario criado com sucesso.");
      if (isCreateRoute) navigate("/estoque/inventarios", { replace: true });
      void loadInventories(appliedFilters);
      void openManage(created);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel criar inventario.").message);
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusVariant = (status: StockInventory["status"]) => {
    if (status === "FECHADO") return "secondary" as const;
    if (status === "CANCELADO") return "destructive" as const;
    if (status === "EM_CONTAGEM") return "default" as const;
    return "outline" as const;
  };

  const inventarioFinalizado =
    selectedInventory?.status === "FECHADO" || selectedInventory?.status === "CANCELADO";

  const hasActiveFilters = !!(appliedFilters.search || appliedFilters.status);

  return (
    <div className="space-y-4">
      {/* Lista principal */}
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

          {/* Filtros */}
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[180px] space-y-1">
              <Label className="text-xs">Buscar por nome</Label>
              <Input
                ref={searchRef}
                placeholder="Nome do inventario..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
              />
            </div>
            <div className="min-w-[160px] space-y-1">
              <Label className="text-xs">Status</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StockInventoryStatus | "")}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Button onClick={applyFilters} disabled={isLoading}>Filtrar</Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>Limpar</Button>
            )}
          </div>
          {hasActiveFilters && !isLoading && (
            <p className="text-xs text-muted-foreground mt-1">{total} inventario(s) encontrado(s)</p>
          )}
        </CardHeader>

        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : inventories.length === 0 ? (
            <PageEmptyState
              title={hasActiveFilters ? "Nenhum inventario encontrado" : "Nenhum inventario cadastrado"}
              description={hasActiveFilters ? "Tente ajustar os filtros." : "Crie um inventario para iniciar a contagem ciclica."}
              action={hasActiveFilters ? { label: "Limpar filtros", onClick: clearFilters } : { label: "Novo inventario", onClick: () => navigate("/estoque/inventarios/novo") }}
            />
          ) : (
            inventories.map((inventory) => (
              <div
                key={inventory.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/20"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground truncate">{inventory.nome}</p>
                    <Badge variant={getStatusVariant(inventory.status)}>
                      {INVENTORY_STATUS_LABELS[inventory.status] ?? inventory.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Abertura: {formatDateTime(inventory.dataAbertura)}
                    {inventory.dataFechamento ? ` | Fechamento: ${formatDateTime(inventory.dataFechamento)}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void openManage(inventory)}
                >
                  Gerenciar
                </Button>
              </div>
            ))
          )}

          <PaginationControls
            page={page}
            totalPages={totalPages}
            isLoading={isLoading}
            hasNextPage={hasNext}
            onPrevious={() => handlePageChange(Math.max(1, page - 1))}
            onNext={() => handlePageChange(Math.min(totalPages, page + 1))}
          />
        </CardContent>
      </Card>

      {/* Modal de gerenciamento do inventário */}
      <Dialog
        open={isManageOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsManageOpen(false);
            setSelectedInventory(null);
            setCounts([]);
            setCountForm(initialCountForm);
            setEditingCount(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedInventory && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle>{selectedInventory.nome}</DialogTitle>
                  <Badge variant={getStatusVariant(selectedInventory.status)}>
                    {INVENTORY_STATUS_LABELS[selectedInventory.status] ?? selectedInventory.status}
                  </Badge>
                </div>
                <DialogDescription>
                  {selectedInventory.observacao || "Sem observacoes."}
                </DialogDescription>
              </DialogHeader>

              {/* Info cards */}
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

              {/* Formulário de contagem — somente se não finalizado */}
              {!inventarioFinalizado && (
                <div className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4">
                  <p className="text-sm font-medium">Registrar contagem</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-1 md:col-span-2">
                      <Label>Item para contagem</Label>
                      {isLoadingItems ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={countForm.itemEstoqueId}
                          onChange={(e) => setCountForm((prev) => ({ ...prev, itemEstoqueId: e.target.value }))}
                        >
                          <option value="">Selecione</option>
                          {items.map((item) => {
                            const jaContado = counts.some((c) => c.itemEstoqueId === item.id);
                            return (
                              <option key={item.id} value={item.id} disabled={jaContado}>
                                {item.nome} ({item.unidadeMedida}){jaContado ? " — ja contado" : ""}
                              </option>
                            );
                          })}
                        </select>
                      )}
                      {countForm.itemEstoqueId && counts.some((c) => c.itemEstoqueId === countForm.itemEstoqueId) && (
                        <p className="text-xs text-amber-600">Este item ja foi contado. Use o botao Editar na tabela abaixo.</p>
                      )}
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
                    <Label>Observacao (opcional)</Label>
                    <Input
                      value={countForm.observacao || ""}
                      onChange={(e) => setCountForm((prev) => ({ ...prev, observacao: e.target.value }))}
                    />
                  </div>
                  <Button
                    onClick={() => void handleRegisterCount()}
                    disabled={
                      isSavingCount ||
                      !countForm.itemEstoqueId ||
                      counts.some((c) => c.itemEstoqueId === countForm.itemEstoqueId)
                    }
                  >
                    {isSavingCount ? "Salvando..." : "Registrar contagem"}
                  </Button>
                </div>
              )}

              {/* Tabela de contagens */}
              <div>
                <p className="text-sm font-medium mb-2">Contagens registradas</p>
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
                          {!inventarioFinalizado && <th className="pb-2" />}
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
                              <td className="py-2 pr-4 text-muted-foreground max-w-[140px] truncate">{count.observacao || "—"}</td>
                              <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap text-xs">{formatDateTime(count.createdAt)}</td>
                              {!inventarioFinalizado && (
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
              </div>

              {/* Ações de ciclo de vida */}
              <DialogFooter className="flex-wrap gap-2 sm:justify-start">
                <Button
                  variant="outline"
                  onClick={() => void handleCloseInventory()}
                  disabled={isClosing || inventarioFinalizado}
                >
                  {isClosing ? "Fechando..." : "Fechar inventario"}
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => { setCancelForm({ senha: "", motivo: "" }); setIsCancelOpen(true); }}
                  disabled={inventarioFinalizado}
                >
                  Cancelar inventario
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal editar contagem */}
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

      {/* Modal cancelar inventário */}
      <Dialog open={isCancelOpen} onOpenChange={(open) => { setIsCancelOpen(open); if (!open) setCancelForm({ senha: "", motivo: "" }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancelar inventario</DialogTitle>
            <DialogDescription>
              Esta acao e irreversivel. O inventario sera marcado como cancelado e nao podera ser reaberto. Confirme com sua senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Motivo do cancelamento (opcional)</Label>
              <Input
                value={cancelForm.motivo || ""}
                onChange={(e) => setCancelForm((prev) => ({ ...prev, motivo: e.target.value }))}
                placeholder="Ex.: Inventario criado por engano"
              />
            </div>
            <div className="space-y-1">
              <Label>Sua senha</Label>
              <Input
                type="password"
                value={cancelForm.senha}
                onChange={(e) => setCancelForm((prev) => ({ ...prev, senha: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") void handleCancelInventory(); }}
                placeholder="Digite sua senha para confirmar"
                autoComplete="current-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Voltar</Button>
            <Button variant="destructive" onClick={() => void handleCancelInventory()} disabled={isCancelling || !cancelForm.senha.trim()}>
              {isCancelling ? "Cancelando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal criar inventário */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open && isCreateRoute) navigate("/estoque/inventarios", { replace: true });
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo inventario</DialogTitle>
            <DialogDescription>Cadastre um inventario para iniciar a contagem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="inventory-nome">Nome</Label>
              <Input
                id="inventory-nome"
                value={inventoryForm.nome}
                onChange={(e) => setInventoryForm((prev) => ({ ...prev, nome: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
                placeholder="Ex.: Inventario mensal - Marco/2026"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inventory-observacao">Observacao (opcional)</Label>
              <Input
                id="inventory-observacao"
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
