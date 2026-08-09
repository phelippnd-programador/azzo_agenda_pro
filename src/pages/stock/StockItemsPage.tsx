import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CrudListToolbar } from "@/components/crud/CrudListToolbar";
import { ModuleIntro } from "@/components/layout/module-surfaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogStickyFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageEmptyState } from "@/components/ui/page-states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { stockItemFormSchema, type StockItemFormValues } from "@/schemas/stockItem";
import type { StockItem } from "@/types/stock";
import { Edit, Power } from "lucide-react";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getListItems } from "./utils";

const initialForm: StockItemFormValues = {
  nome: "",
  sku: "",
  unidadeMedida: "UN",
  estoqueMinimo: 0,
  ativo: true,
};

export default function StockItemsPage() {
  const navigate = useNavigate();
  const isCreateRoute = !!useMatch("/estoque/itens/novo");
  const editRouteMatch = useMatch("/estoque/itens/:id/editar");
  const editRouteItemId = editRouteMatch?.params.id;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const { register, handleSubmit, watch, setValue, reset } = useForm<StockItemFormValues>({
    resolver: zodResolver(stockItemFormSchema),
    defaultValues: initialForm,
  });

  const load = async () => {
    try {
      setIsLoading(true);
      const response = await stockApi.getItems({ page: 1, limit: 500 });
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

  useEffect(() => {
    if (isCreateRoute) {
      setEditingItem(null);
      resetForm();
      setIsCreateOpen(true);
    }
  }, [isCreateRoute]);

  useEffect(() => {
    if (!editRouteItemId || !items.length) return;
    const routeItem = items.find((item) => item.id === editRouteItemId);
    if (!routeItem) {
      toast.error("Item nao encontrado para edicao.");
      navigate("/estoque/itens", { replace: true });
      return;
    }
    openEdit(routeItem);
  }, [editRouteItemId, items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTerm = !term || `${item.nome} ${item.sku || ""}`.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.ativo) ||
        (statusFilter === "inactive" && !item.ativo);
      return matchesTerm && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const resetForm = () => reset(initialForm);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleToggleActive = async (item: StockItem) => {
    try {
      await stockApi.updateItem(item.id, { ativo: !item.ativo });
      toast.success(item.ativo ? "Item inativado com sucesso." : "Item ativado com sucesso.");
      await load();
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao atualizar status do item.").message);
    }
  };

  const onInvalidForm = () => {
    toast.error("Nome e unidade sao obrigatorios.");
  };

  const handleCreate = async (values: StockItemFormValues) => {
    setIsSaving(true);
    try {
      await stockApi.createItem({ ...values, estoqueMinimo: Number(values.estoqueMinimo || 0) });
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

  const handleUpdate = async (values: StockItemFormValues) => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      await stockApi.updateItem(editingItem.id, {
        ...values,
        estoqueMinimo: Number(values.estoqueMinimo || 0),
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
    reset({
      nome: item.nome,
      sku: item.sku || "",
      unidadeMedida: item.unidadeMedida,
      estoqueMinimo: Number(item.estoqueMinimo || 0),
      ativo: item.ativo,
    });
  };

  const formEstoqueMinimo = watch("estoqueMinimo");

  const FormFields = (
    <div data-tour="stock-items-form" className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="item-nome">Nome</Label>
        <Input id="item-nome" {...register("nome")} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="item-sku">SKU</Label>
          <Input id="item-sku" {...register("sku")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="item-unidade">Unidade</Label>
          <Input id="item-unidade" {...register("unidadeMedida")} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="item-estoque-minimo">Estoque minimo</Label>
        <Input
          id="item-estoque-minimo"
          type="number"
          min="0"
          value={formEstoqueMinimo}
          onChange={(e) => setValue("estoqueMinimo", Number(e.target.value || 0))}
        />
      </div>
    </div>
  );

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <ModuleIntro
        eyebrow="Itens de estoque"
        title="Cadastre itens e acompanhe o saldo minimo"
        description="Controle rapidamente o status operacional de cada item usado nos atendimentos."
      />

      <CrudListToolbar
        searchPlaceholder="Buscar por nome ou SKU"
        searchValue={search}
        onSearchChange={setSearch}
        actionLabel="Item"
        actionLabelMobile="Novo"
        actionLabelDesktop="Novo item"
        onAction={() => navigate("/estoque/itens/novo")}
        searchDataTour="stock-items-search"
        actionDataTour="stock-items-new-button"
      />

      <div className="max-w-xs">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
          <SelectTrigger data-tour="stock-items-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open && isCreateRoute) {
            navigate("/estoque/itens", { replace: true });
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-border/70 pb-4 pr-10">
            <DialogTitle>Novo item</DialogTitle>
            <DialogDescription>Cadastre um item para controle de estoque.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <DialogSection className="bg-transparent">{FormFields}</DialogSection>
          </DialogBody>
          <DialogStickyFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                if (isCreateRoute) navigate("/estoque/itens", { replace: true });
              }}
            >
              Cancelar
            </Button>
            <Button data-tour="stock-items-dialog-submit" onClick={() => void handleSubmit(handleCreate, onInvalidForm)()} isLoading={isSaving} loadingText="Salvando...">
              Salvar
            </Button>
          </DialogStickyFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-border/80">
      <CardContent className="space-y-2 pt-6">
        {!filteredItems.length ? (
          <PageEmptyState
            title="Nenhum item encontrado"
            description="Ajuste os filtros ou cadastre um novo item de estoque."
            action={{
              label: "Novo item",
              onClick: () => navigate("/estoque/itens/novo"),
            }}
          />
        ) : (
          pagedItems.map((item) => (
            <div
              key={item.id}
              data-tour="stock-item-row"
              className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.nome}</p>
                <p className="text-xs text-muted-foreground">
                  SKU: {item.sku || "-"} | Unidade: {item.unidadeMedida}
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[260px] sm:items-end">
                <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-[220px]">
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <p className="uppercase tracking-wide text-muted-foreground">Saldo</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.saldoAtual}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <p className="uppercase tracking-wide text-muted-foreground">Minimo</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.estoqueMinimo}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge variant={item.saldoAtual <= item.estoqueMinimo ? "destructive" : "outline"}>
                    {item.saldoAtual <= item.estoqueMinimo ? "Abaixo do minimo" : "Normal"}
                  </Badge>
                  <Badge variant={item.ativo ? "secondary" : "outline"}>
                    {item.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button data-tour="stock-item-edit-button" variant="outline" size="sm" className="gap-1" asChild>
                    <Link to={`/estoque/itens/${item.id}/editar`}><Edit className="h-3 w-3" />Editar</Link>
                  </Button>
                  <Button data-tour="stock-item-toggle-button" variant="outline" size="sm" className="gap-1" onClick={() => void handleToggleActive(item)}>
                    <Power className="h-3 w-3" />
                    {item.ativo ? "Inativar" : "Ativar"}
                  </Button>
                </div>
              </div>
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

      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            if (editRouteItemId) navigate("/estoque/itens", { replace: true });
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-border/70 pb-4 pr-10">
            <DialogTitle>Editar item</DialogTitle>
            <DialogDescription>Atualize dados do item selecionado.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <DialogSection className="bg-transparent">{FormFields}</DialogSection>
          </DialogBody>
          <DialogStickyFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingItem(null);
                if (editRouteItemId) navigate("/estoque/itens", { replace: true });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleSubmit(handleUpdate, onInvalidForm)()} isLoading={isSaving} loadingText="Salvando...">
              Salvar alteracoes
            </Button>
          </DialogStickyFooter>
        </DialogContent>
      </Dialog>
      </Card>
    </div>
  );
}
