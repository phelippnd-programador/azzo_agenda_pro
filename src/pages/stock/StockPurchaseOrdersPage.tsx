import { useEffect, useMemo, useState } from "react";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageEmptyState } from "@/components/ui/page-states";
import { Skeleton } from "@/components/ui/skeleton";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type {
  CreateStockPurchaseOrderRequest,
  ReceiveStockPurchaseOrderRequest,
  StockPurchaseOrder,
  StockSupplier,
} from "@/types/stock";
import { formatCurrency } from "./utils";

const initialCreateForm: CreateStockPurchaseOrderRequest = {
  fornecedorId: "",
  valorTotal: 0,
  quantidadeItens: 0,
  observacao: "",
};

const initialReceiveForm: ReceiveStockPurchaseOrderRequest = {
  quantidadeRecebida: 0,
  observacao: "",
};

export default function StockPurchaseOrdersPage() {
  const navigate = useNavigate();
  const detailMatch = useMatch("/estoque/pedidos-compra/:id");
  const orderId = detailMatch?.params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSavingCreate, setIsSavingCreate] = useState(false);
  const [isSavingReceive, setIsSavingReceive] = useState(false);
  const [orders, setOrders] = useState<StockPurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<StockSupplier[]>([]);
  const [createForm, setCreateForm] = useState<CreateStockPurchaseOrderRequest>(initialCreateForm);
  const [receiveForm, setReceiveForm] = useState<ReceiveStockPurchaseOrderRequest>(initialReceiveForm);

  const load = async () => {
    try {
      setIsLoading(true);
      const [ordersResponse, suppliersResponse] = await Promise.all([
        stockApi.listPurchaseOrders(),
        stockApi.listSuppliers(),
      ]);
      setOrders(ordersResponse || []);
      setSuppliers(suppliersResponse || []);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar pedidos de compra.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === orderId) || null,
    [orders, orderId]
  );

  useEffect(() => {
    if (!orderId || isLoading) return;
    if (!selectedOrder) {
      toast.error("Pedido de compra nao encontrado.");
      navigate("/estoque/pedidos-compra", { replace: true });
    }
  }, [orderId, selectedOrder, isLoading]);

  const handleCreate = async () => {
    if (!createForm.fornecedorId) {
      toast.error("Selecione um fornecedor.");
      return;
    }
    if (createForm.quantidadeItens <= 0 || createForm.valorTotal <= 0) {
      toast.error("Informe valor total e quantidade maiores que zero.");
      return;
    }

    try {
      setIsSavingCreate(true);
      const created = await stockApi.createPurchaseOrder({
        ...createForm,
        valorTotal: Number(createForm.valorTotal),
        quantidadeItens: Number(createForm.quantidadeItens),
      });
      setOrders((prev) => [created, ...prev]);
      setCreateForm(initialCreateForm);
      setIsCreateOpen(false);
      toast.success("Pedido de compra criado com sucesso.");
      navigate(`/estoque/pedidos-compra/${created.id}`, { replace: true });
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel criar pedido de compra.").message);
    } finally {
      setIsSavingCreate(false);
    }
  };

  const handleReceive = async () => {
    if (!selectedOrder) return;
    if (receiveForm.quantidadeRecebida <= 0) {
      toast.error("Informe a quantidade recebida.");
      return;
    }

    try {
      setIsSavingReceive(true);
      const updated = await stockApi.receivePurchaseOrder(selectedOrder.id, {
        quantidadeRecebida: Number(receiveForm.quantidadeRecebida),
        observacao: receiveForm.observacao?.trim() || undefined,
      });
      setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
      setReceiveForm(initialReceiveForm);
      toast.success("Recebimento registrado com sucesso.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel registrar recebimento.").message);
    } finally {
      setIsSavingReceive(false);
    }
  };

  const getStatusVariant = (status: StockPurchaseOrder["status"]) => {
    if (status === "RECEBIDO") return "secondary" as const;
    if (status === "CANCELADO") return "destructive" as const;
    if (status === "PARCIALMENTE_RECEBIDO") return "default" as const;
    return "outline" as const;
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Pedidos de compra</CardTitle>
            <Button onClick={() => setIsCreateOpen(true)}>Novo pedido</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {!orders.length ? (
            <PageEmptyState
              title="Nenhum pedido cadastrado"
              description="Crie pedidos para controlar reposicoes e recebimentos."
              action={{ label: "Novo pedido", onClick: () => setIsCreateOpen(true) }}
            />
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                to={`/estoque/pedidos-compra/${order.id}`}
                className="block rounded-md border p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{order.fornecedorNome}</p>
                  <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {formatCurrency(order.valorTotal)} | Itens: {order.quantidadeItens} | Pendente:{" "}
                  {order.quantidadePendente}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {selectedOrder ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Pedido {selectedOrder.id}</CardTitle>
              <Badge variant={getStatusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Fornecedor: {selectedOrder.fornecedorNome} | Pendente: {selectedOrder.quantidadePendente}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Quantidade recebida</Label>
                <Input
                  type="number"
                  min="0"
                  value={receiveForm.quantidadeRecebida}
                  onChange={(e) =>
                    setReceiveForm((prev) => ({ ...prev, quantidadeRecebida: Number(e.target.value || 0) }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Observacao (opcional)</Label>
                <Input
                  value={receiveForm.observacao || ""}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, observacao: e.target.value }))}
                />
              </div>
            </div>
            <Button
              onClick={() => void handleReceive()}
              disabled={isSavingReceive || selectedOrder.status === "RECEBIDO"}
            >
              {isSavingReceive ? "Salvando..." : "Registrar recebimento"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo pedido de compra</DialogTitle>
            <DialogDescription>Crie um pedido para acompanhar o recebimento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Fornecedor</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={createForm.fornecedorId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, fornecedorId: e.target.value }))}
              >
                <option value="">Selecione</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Valor total</Label>
                <Input
                  type="number"
                  min="0"
                  value={createForm.valorTotal}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, valorTotal: Number(e.target.value || 0) }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Quantidade de itens</Label>
                <Input
                  type="number"
                  min="0"
                  value={createForm.quantidadeItens}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, quantidadeItens: Number(e.target.value || 0) }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observacao (opcional)</Label>
              <Input
                value={createForm.observacao || ""}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, observacao: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreate()} disabled={isSavingCreate}>
              {isSavingCreate ? "Salvando..." : "Criar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
