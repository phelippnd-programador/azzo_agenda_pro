import { useEffect, useState } from "react";
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
import type { CreateStockTransferRequest, StockItem, StockTransfer } from "@/types/stock";

const initialForm: CreateStockTransferRequest = {
  origem: "",
  destino: "",
  itemEstoqueId: "",
  quantidade: 0,
  observacao: "",
};

export default function StockTransfersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [form, setForm] = useState<CreateStockTransferRequest>(initialForm);
  const totalPages = Math.max(1, Math.ceil(transfers.length / pageSize));
  const pagedTransfers = transfers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const load = async () => {
    try {
      setIsLoading(true);
      const [transferResponse, itemsResponse] = await Promise.all([
        stockApi.listTransfers(),
        stockApi.getItems({ page: 1, limit: 200 }),
      ]);
      const stockItems = Array.isArray(itemsResponse) ? itemsResponse : itemsResponse.items || [];
      setTransfers(transferResponse || []);
      setItems(stockItems);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar transferencias.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!form.origem.trim() || !form.destino.trim() || !form.itemEstoqueId) {
      toast.error("Origem, destino e item sao obrigatorios.");
      return;
    }
    if (form.quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero.");
      return;
    }
    try {
      setIsSaving(true);
      await stockApi.createTransfer({
        ...form,
        quantidade: Number(form.quantidade),
      });
      setForm(initialForm);
      setIsDialogOpen(false);
      toast.success("Transferencia criada com sucesso.");
      await load();
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel criar transferencia.").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async (transferId: string) => {
    try {
      await stockApi.sendTransfer(transferId);
      toast.success("Transferencia enviada.");
      await load();
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel enviar transferencia.").message);
    }
  };

  const handleReceive = async (transferId: string) => {
    try {
      await stockApi.receiveTransfer(transferId);
      toast.success("Transferencia recebida.");
      await load();
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel receber transferencia.").message);
    }
  };

  const getStatusVariant = (status: StockTransfer["status"]) => {
    if (status === "RECEBIDA") return "secondary" as const;
    if (status === "CANCELADA") return "destructive" as const;
    if (status === "ENVIADA") return "default" as const;
    return "outline" as const;
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Transferencias</CardTitle>
          <Button onClick={() => setIsDialogOpen(true)}>Nova transferencia</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!transfers.length ? (
          <PageEmptyState
            title="Nenhuma transferencia cadastrada"
            description="Crie transferencias para movimentar estoque entre unidades."
            action={{ label: "Nova transferencia", onClick: () => setIsDialogOpen(true) }}
          />
        ) : (
          pagedTransfers.map((transfer) => (
            <div key={transfer.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {transfer.origem} {"->"} {transfer.destino}
                </p>
                <Badge variant={getStatusVariant(transfer.status)}>{transfer.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Item: {transfer.itemNome} | Quantidade: {transfer.quantidade}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleSend(transfer.id)}
                  disabled={transfer.status !== "RASCUNHO"}
                >
                  Enviar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleReceive(transfer.id)}
                  disabled={transfer.status !== "ENVIADA"}
                >
                  Receber
                </Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova transferencia</DialogTitle>
            <DialogDescription>Registre uma transferencia entre unidades.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Origem</Label>
                <Input
                  value={form.origem}
                  onChange={(e) => setForm((prev) => ({ ...prev, origem: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Destino</Label>
                <Input
                  value={form.destino}
                  onChange={(e) => setForm((prev) => ({ ...prev, destino: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Item</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.itemEstoqueId}
                  onChange={(e) => setForm((prev) => ({ ...prev, itemEstoqueId: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.quantidade}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantidade: Number(e.target.value || 0) }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observacao (opcional)</Label>
              <Input
                value={form.observacao || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, observacao: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreate()} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Criar transferencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
