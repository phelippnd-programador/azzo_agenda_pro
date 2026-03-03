import { useEffect, useMemo, useState } from "react";
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
import { maskCpfCnpj, maskPhoneBr } from "@/lib/input-masks";
import type { CreateStockSupplierRequest, StockSupplier } from "@/types/stock";

const initialForm: CreateStockSupplierRequest = {
  nome: "",
  documento: "",
  email: "",
  telefone: "",
  contato: "",
  ativo: true,
};

export default function StockSuppliersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<StockSupplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<StockSupplier | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [form, setForm] = useState<CreateStockSupplierRequest>(initialForm);

  const load = async () => {
    try {
      setIsLoading(true);
      const response = await stockApi.listSuppliers();
      setSuppliers(response || []);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar fornecedores.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter((supplier) =>
      `${supplier.nome} ${supplier.documento || ""} ${supplier.email || ""}`.toLowerCase().includes(term)
    );
  }, [suppliers, search]);
  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
  const pagedSuppliers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openCreate = () => {
    setEditingSupplier(null);
    setForm(initialForm);
    setIsDialogOpen(true);
  };

  const openEdit = (supplier: StockSupplier) => {
    setEditingSupplier(supplier);
    setForm({
      nome: supplier.nome,
      documento: supplier.documento || "",
      email: supplier.email || "",
      telefone: supplier.telefone || "",
      contato: supplier.contato || "",
      ativo: supplier.ativo,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome?.trim()) {
      toast.error("Nome do fornecedor e obrigatorio.");
      return;
    }
    try {
      setIsSaving(true);
      if (editingSupplier) {
        await stockApi.updateSupplier(editingSupplier.id, form);
        toast.success("Fornecedor atualizado com sucesso.");
      } else {
        await stockApi.createSupplier(form);
        toast.success("Fornecedor criado com sucesso.");
      }
      setIsDialogOpen(false);
      setEditingSupplier(null);
      setForm(initialForm);
      await load();
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel salvar fornecedor.").message);
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
          <CardTitle>Fornecedores</CardTitle>
          <Button onClick={openCreate}>Novo fornecedor</Button>
        </div>
        <Input
          placeholder="Buscar por nome, documento ou email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CardHeader>
      <CardContent className="space-y-2">
        {!filteredSuppliers.length ? (
          <PageEmptyState
            title="Nenhum fornecedor encontrado"
            description="Cadastre fornecedores para apoiar compras e reposicao."
            action={{ label: "Novo fornecedor", onClick: openCreate }}
          />
        ) : (
          pagedSuppliers.map((supplier) => (
            <div key={supplier.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{supplier.nome}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={supplier.ativo ? "secondary" : "outline"}>
                    {supplier.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => openEdit(supplier)}>
                    Editar
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Documento: {supplier.documento || "-"} | Email: {supplier.email || "-"} | Telefone:{" "}
                {supplier.telefone || "-"}
              </p>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
            <DialogDescription>
              Dados de contato e identificacao para compras e relacionamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Documento</Label>
                <Input
                  value={form.documento || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, documento: maskCpfCnpj(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Contato</Label>
                <Input
                  value={form.contato || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, contato: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  value={form.email || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input
                  value={form.telefone || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, telefone: maskPhoneBr(e.target.value) }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
