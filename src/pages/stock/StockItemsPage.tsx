import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { CreateStockItemRequest, StockItem } from "@/types/stock";
import { Edit, Plus } from "lucide-react";
import { toast } from "sonner";
import { getListItems } from "./utils";

const initialForm: CreateStockItemRequest = {
  nome: "",
  sku: "",
  unidadeMedida: "UN",
  estoqueMinimo: 0,
  ativo: true,
};

export default function StockItemsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CreateStockItemRequest>(initialForm);

  const load = async () => {
    try {
      setIsLoading(true);
      const response = await stockApi.getItems({ page: 1, limit: 200 });
      setItems(getListItems(response));
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar itens de estoque.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => `${item.nome} ${item.sku || ""}`.toLowerCase().includes(term));
  }, [items, search]);

  const resetForm = () => setForm(initialForm);

  const handleCreate = async () => {
    if (!form.nome.trim() || !form.unidadeMedida.trim()) {
      toast.error("Nome e unidade sao obrigatorios.");
      return;
    }
    setIsSaving(true);
    try {
      await stockApi.createItem({ ...form, estoqueMinimo: Number(form.estoqueMinimo || 0) });
      toast.success("Item criado com sucesso.");
      setIsCreateOpen(false);
      resetForm();
      await load();
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao criar item.").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    if (!form.nome.trim() || !form.unidadeMedida.trim()) {
      toast.error("Nome e unidade sao obrigatorios.");
      return;
    }
    setIsSaving(true);
    try {
      await stockApi.updateItem(editingItem.id, {
        ...form,
        estoqueMinimo: Number(form.estoqueMinimo || 0),
      });
      toast.success("Item atualizado com sucesso.");
      setEditingItem(null);
      resetForm();
      await load();
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao atualizar item.").message);
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (item: StockItem) => {
    setEditingItem(item);
    setForm({
      nome: item.nome,
      sku: item.sku || "",
      unidadeMedida: item.unidadeMedida,
      estoqueMinimo: Number(item.estoqueMinimo || 0),
      ativo: item.ativo,
    });
  };

  const FormFields = (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Nome</Label>
        <Input value={form.nome} onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>SKU</Label>
          <Input value={form.sku || ""} onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Unidade</Label>
          <Input value={form.unidadeMedida} onChange={(e) => setForm((prev) => ({ ...prev, unidadeMedida: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Estoque minimo</Label>
        <Input type="number" min="0" value={form.estoqueMinimo} onChange={(e) => setForm((prev) => ({ ...prev, estoqueMinimo: Number(e.target.value || 0) }))} />
      </div>
    </div>
  );

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Itens de estoque</CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Novo item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo item</DialogTitle>
                <DialogDescription>Cadastre um item para controle de estoque.</DialogDescription>
              </DialogHeader>
              {FormFields}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={() => void handleCreate()} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Input placeholder="Buscar por nome ou SKU" value={search} onChange={(e) => setSearch(e.target.value)} />
      </CardHeader>
      <CardContent className="space-y-2">
        {!filteredItems.length ? (
          <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="font-medium">{item.nome}</p>
                <p className="text-xs text-muted-foreground">SKU: {item.sku || "-"} | Unidade: {item.unidadeMedida}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">Saldo: <span className="font-semibold">{item.saldoAtual}</span></p>
                <p className="text-xs text-muted-foreground">Minimo: {item.estoqueMinimo}</p>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <Badge variant={item.saldoAtual <= item.estoqueMinimo ? "destructive" : "outline"}>
                    {item.saldoAtual <= item.estoqueMinimo ? "Abaixo do minimo" : "Normal"}
                  </Badge>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(item)}>
                    <Edit className="h-3 w-3" />Editar
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar item</DialogTitle>
            <DialogDescription>Atualize dados do item selecionado.</DialogDescription>
          </DialogHeader>
          {FormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
            <Button onClick={() => void handleUpdate()} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar alteracoes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
