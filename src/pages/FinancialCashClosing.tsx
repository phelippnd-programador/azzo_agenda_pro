import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { TransactionDialog } from "@/components/financial/TransactionDialog";
import { TransactionList } from "@/components/financial/TransactionList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageEmptyState, PageErrorState } from "@/components/ui/page-states";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useTransactionCategories, useTransactions } from "@/hooks/useTransactions";
import {
  cashClosingsApi,
  transactionsApi,
  type CashClosing,
  type CashClosingPaymentMethod,
  type TransactionMutationInput,
} from "@/lib/api/finance";
import { formatCurrency, formatDateOnly, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";
import { toast } from "sonner";

const PAYMENT_METHODS: Array<{ key: CashClosingPaymentMethod; label: string }> = [
  { key: "CASH", label: "Dinheiro" },
  { key: "CREDIT_CARD", label: "CartÃ£o de crÃ©dito" },
  { key: "DEBIT_CARD", label: "CartÃ£o de dÃ©bito" },
  { key: "PIX", label: "Pix" },
  { key: "OTHER", label: "Outros" },
];

const todayDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


export default function FinancialCashClosing() {
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isOpenDialogVisible, setIsOpenDialogVisible] = useState(false);
  const [openDialogAutoTriggered, setOpenDialogAutoTriggered] = useState(false);
  const [openingDate, setOpeningDate] = useState(todayDateKey);
  const [openingNotes, setOpeningNotes] = useState("");
  const [isSubmittingOpen, setIsSubmittingOpen] = useState(false);

  const [isCloseDialogVisible, setIsCloseDialogVisible] = useState(false);
  const [closingNotes, setClosingNotes] = useState("");
  const [countedTotals, setCountedTotals] = useState<Record<CashClosingPaymentMethod, number>>({
    CASH: 0,
    CREDIT_CARD: 0,
    DEBIT_CARD: 0,
    PIX: 0,
    OTHER: 0,
  });
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionDefaultType, setTransactionDefaultType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);

  const selectedClosing = useMemo(
    () => closings.find((item) => item.id === selectedId) ?? closings[0] ?? null,
    [closings, selectedId]
  );
  const cashBusinessDate = selectedClosing?.businessDate ?? todayDateKey();
  const isSelectedCashOpen = selectedClosing?.status === "OPEN";

  const {
    transactions,
    summary,
    totalCount,
    totalPages,
    page,
    setPage,
    isLoading: isLoadingTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: refetchTransactions,
  } = useTransactions({
    from: cashBusinessDate,
    to: cashBusinessDate,
    limit: 50,
  });
  const { categories, isLoading: isLoadingCategories, createCategory } = useTransactionCategories();
  const { professionals } = useProfessionals();

  const loadClosings = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await cashClosingsApi.getAll();
      setClosings(response);
      setSelectedId((current) => {
        if (current && response.some((item) => item.id === current)) return current;
        return response[0]?.id ?? null;
      });
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "NÃ£o foi possÃ­vel carregar os fechamentos de caixa";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadClosings();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const hasOpenCash = closings.some((item) => item.status === "OPEN");
    if (!hasOpenCash) {
      setOpenDialogAutoTriggered(true);
      setIsOpenDialogVisible(true);
    }
  }, [isLoading, closings]);

  useEffect(() => {
    if (!isCloseDialogVisible || !selectedClosing) return;
    setClosingNotes(selectedClosing.closingNotes ?? "");
    setCountedTotals({
      CASH: selectedClosing.expectedTotals.CASH ?? 0,
      CREDIT_CARD: selectedClosing.expectedTotals.CREDIT_CARD ?? 0,
      DEBIT_CARD: selectedClosing.expectedTotals.DEBIT_CARD ?? 0,
      PIX: selectedClosing.expectedTotals.PIX ?? 0,
      OTHER: selectedClosing.expectedTotals.OTHER ?? 0,
    });
  }, [isCloseDialogVisible, selectedClosing]);

  useEffect(() => {
    setEditingTransaction(null);
    setTransactionToDelete(null);
  }, [cashBusinessDate, selectedId]);

  const openNewTransaction = (type: "INCOME" | "EXPENSE") => {
    setEditingTransaction(null);
    setTransactionDefaultType(type);
    setIsTransactionOpen(true);
  };

  const openEditTransaction = (transaction: Transaction) => {
    if (!isSelectedCashOpen) return;
    setEditingTransaction(transaction);
    setTransactionDefaultType(transaction.type);
    setIsTransactionOpen(true);
  };

  const handleOpenCashClosing = async () => {
    setIsSubmittingOpen(true);
    try {
      const created = await cashClosingsApi.open({
        businessDate: openingDate,
        notes: openingNotes.trim() || undefined,
      });
      await loadClosings(true);
      setSelectedId(created.id);
      setIsOpenDialogVisible(false);
      setOpeningDate(todayDateKey());
      setOpeningNotes("");
      toast.success("Caixa aberto com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "NÃ£o foi possÃ­vel abrir o caixa");
    } finally {
      setIsSubmittingOpen(false);
    }
  };

  const handleCloseCashClosing = async () => {
    if (!selectedClosing) return;
    setIsSubmittingClose(true);
    try {
      const payload = PAYMENT_METHODS.reduce<Partial<Record<CashClosingPaymentMethod, number>>>((acc, method) => {
        acc[method.key] = countedTotals[method.key] ?? 0;
        return acc;
      }, {});

      const closed = await cashClosingsApi.close(selectedClosing.id, {
        countedTotals: payload,
        notes: closingNotes.trim() || undefined,
      });
      await loadClosings(true);
      setSelectedId(closed.id);
      setIsCloseDialogVisible(false);
      toast.success("Fechamento de caixa concluÃ­do");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "NÃ£o foi possÃ­vel fechar o caixa");
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const handleReconcileTransaction = async (id: string) => {
    if (!isSelectedCashOpen) return;
    try {
      await transactionsApi.reconcile(id);
      await refetchTransactions();
      await loadClosings(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "NÃ£o foi possÃ­vel conciliar o lanÃ§amento");
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    setIsDeletingTransaction(true);
    try {
      await deleteTransaction(transactionToDelete);
      await loadClosings(true);
      setTransactionToDelete(null);
    } catch {
      // Erro tratado no hook.
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  const handleCreateTransaction = async (payload: TransactionMutationInput) => {
    const created = await createTransaction(payload);
    await loadClosings(true);
    return created;
  };

  const handleUpdateTransaction = async (id: string, payload: TransactionMutationInput) => {
    const updated = await updateTransaction(id, payload);
    await loadClosings(true);
    return updated;
  };

  if (isLoading) {
    return (
      <MainLayout title="Fechamento de Caixa" subtitle="Caixa operacional do dia e conferÃªncia final">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-[24rem]" />
          <Skeleton className="h-[24rem]" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Fechamento de Caixa" subtitle="Caixa operacional do dia e conferÃªncia final">
        <PageErrorState
          title="NÃ£o foi possÃ­vel carregar o fechamento de caixa"
          description={error}
          action={{ label: "Tentar novamente", onClick: () => void loadClosings() }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Fechamento de Caixa" subtitle="Caixa operacional do dia e conferÃªncia final">
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="surface-panel border">
            <CardHeader className="pb-2">
              <CardDescription>Aberto no momento</CardDescription>
              <CardTitle className="text-2xl">
                {closings.filter((item) => item.status === "OPEN").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="surface-panel border">
            <CardHeader className="pb-2">
              <CardDescription>Movimento do dia</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(summary.balance)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="surface-panel border">
            <CardHeader className="pb-2">
              <CardDescription>DiferenÃ§a consolidada</CardDescription>
              <CardTitle className="text-2xl">
                {selectedClosing ? formatCurrency(selectedClosing.totalDifference) : "R$ 0,00"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Esta pÃ¡gina agora concentra a operaÃ§Ã£o do caixa do dia e o fechamento final por forma de pagamento.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadClosings(true)} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Atualizar
            </Button>
            <Button onClick={() => setIsOpenDialogVisible(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              Abrir caixa
            </Button>
          </div>
        </div>

        {closings.length === 0 ? (
          <PageEmptyState
            title="Nenhum fechamento registrado"
            description="Abra o primeiro caixa do dia para iniciar a operaÃ§Ã£o e registrar a conferÃªncia final."
            action={{ label: "Abrir caixa", onClick: () => setIsOpenDialogVisible(true) }}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="surface-panel border">
              <CardHeader className="pb-3">
                <CardTitle>HistÃ³rico</CardTitle>
                <CardDescription>Selecione um caixa para operar ou revisar o fechamento do dia.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Esperado</TableHead>
                        <TableHead>DiferenÃ§a</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closings.map((closing) => {
                        const isSelected = closing.id === selectedClosing?.id;
                        return (
                          <TableRow
                            key={closing.id}
                            className={cn("cursor-pointer", isSelected && "bg-primary/5")}
                            onClick={() => setSelectedId(closing.id)}
                          >
                            <TableCell className="font-medium">{formatDateOnly(closing.businessDate)}</TableCell>
                            <TableCell>
                              <Badge variant={closing.status === "OPEN" ? "secondary" : "outline"}>
                                {closing.status === "OPEN" ? "Aberto" : "Fechado"}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(closing.totalExpected)}</TableCell>
                            <TableCell className={closing.totalDifference === 0 ? "" : "text-orange-700"}>
                              {formatCurrency(closing.totalDifference)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {selectedClosing ? (
              <Card className="surface-panel border">
                <CardHeader className="gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>{formatDateOnly(selectedClosing.businessDate)}</CardTitle>
                      <CardDescription>Caixa do dia com operaÃ§Ã£o e consolidado por forma de pagamento.</CardDescription>
                    </div>
                    <Badge variant={isSelectedCashOpen ? "secondary" : "outline"}>
                      {isSelectedCashOpen ? "Aberto" : "Fechado"}
                    </Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border bg-muted/40 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Esperado</div>
                      <div className="mt-1 text-lg font-semibold">{formatCurrency(selectedClosing.totalExpected)}</div>
                    </div>
                    <div className="rounded-2xl border bg-muted/40 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Contado</div>
                      <div className="mt-1 text-lg font-semibold">{formatCurrency(selectedClosing.totalCounted)}</div>
                    </div>
                    <div className="rounded-2xl border bg-muted/40 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">DiferenÃ§a</div>
                      <div className="mt-1 text-lg font-semibold">{formatCurrency(selectedClosing.totalDifference)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">OperaÃ§Ã£o do caixa</h3>
                        <p className="text-sm text-muted-foreground">
                          Registre entradas e saÃ­das do dia aqui. O fechamento continua sendo a etapa final.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => openNewTransaction("INCOME")}
                          disabled={!isSelectedCashOpen}
                        >
                          <ArrowUpCircle className="mr-2 h-4 w-4" />
                          Nova entrada
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => openNewTransaction("EXPENSE")}
                          disabled={!isSelectedCashOpen}
                        >
                          <ArrowDownCircle className="mr-2 h-4 w-4" />
                          Nova saÃ­da
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border bg-background p-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Entradas do dia</div>
                        <div className="mt-1 text-lg font-semibold text-green-700">
                          {formatCurrency(summary.totalIncome)}
                        </div>
                      </div>
                      <div className="rounded-2xl border bg-background p-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">SaÃ­das do dia</div>
                        <div className="mt-1 text-lg font-semibold text-red-700">
                          {formatCurrency(summary.totalExpenses)}
                        </div>
                      </div>
                      <div className="rounded-2xl border bg-background p-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo operacional</div>
                        <div className="mt-1 text-lg font-semibold">{formatCurrency(summary.balance)}</div>
                      </div>
                    </div>
                    {!isSelectedCashOpen ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Este caixa jÃ¡ foi encerrado. As movimentaÃ§Ãµes continuam visÃ­veis, mas a operaÃ§Ã£o ficou somente leitura.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock3 className="h-4 w-4 text-muted-foreground" />
                        Abertura
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">{formatDateTime(selectedClosing.openedAt)}</div>
                      {selectedClosing.openingNotes ? (
                        <p className="mt-2 text-sm text-foreground">{selectedClosing.openingNotes}</p>
                      ) : null}
                    </div>
                    <div className="rounded-2xl border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        Encerramento
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {selectedClosing.closedAt ? formatDateTime(selectedClosing.closedAt) : "Ainda aberto"}
                      </div>
                      {selectedClosing.closingNotes ? (
                        <p className="mt-2 text-sm text-foreground">{selectedClosing.closingNotes}</p>
                      ) : null}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Totais por forma de pagamento</h3>
                      {isSelectedCashOpen ? (
                        <Button onClick={() => setIsCloseDialogVisible(true)}>Fechar caixa</Button>
                      ) : null}
                    </div>
                    <div className="overflow-x-auto rounded-2xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>MÃ©todo</TableHead>
                            <TableHead>Esperado</TableHead>
                            <TableHead>Contado</TableHead>
                            <TableHead>DiferenÃ§a</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {PAYMENT_METHODS.map((method) => (
                            <TableRow key={method.key}>
                              <TableCell>{method.label}</TableCell>
                              <TableCell>{formatCurrency(selectedClosing.expectedTotals[method.key] ?? 0)}</TableCell>
                              <TableCell>{formatCurrency(selectedClosing.countedTotals[method.key] ?? 0)}</TableCell>
                              <TableCell
                                className={(selectedClosing.differenceTotals[method.key] ?? 0) === 0 ? "" : "text-orange-700"}
                              >
                                {formatCurrency(selectedClosing.differenceTotals[method.key] ?? 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <TransactionList
                    transactions={transactions}
                    isLoading={isLoadingTransactions}
                    totalCount={totalCount}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onEdit={openEditTransaction}
                    onDelete={setTransactionToDelete}
                    onReconcile={handleReconcileTransaction}
                    readOnly={!isSelectedCashOpen}
                  />
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </div>

      <Dialog open={isOpenDialogVisible} onOpenChange={(open) => { setIsOpenDialogVisible(open); if (!open) setOpenDialogAutoTriggered(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir caixa</DialogTitle>
            <DialogDescription>
              {openDialogAutoTriggered
                ? "Nenhum caixa estÃ¡ aberto no momento. Confirme a abertura para iniciar a operaÃ§Ã£o do dia."
                : "Crie o registro do dia operacional antes de iniciar a movimentaÃ§Ã£o e a conferÃªncia final."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cash-opening-date">Data do caixa</Label>
              <Input
                id="cash-opening-date"
                type="date"
                value={openingDate}
                onChange={(event) => setOpeningDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cash-opening-notes">ObservaÃ§Ãµes</Label>
              <Textarea
                id="cash-opening-notes"
                value={openingNotes}
                onChange={(event) => setOpeningNotes(event.target.value)}
                placeholder="Ex: abertura feita pela recepÃ§Ã£o da manhÃ£."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenDialogVisible(false)}>Cancelar</Button>
            <Button onClick={handleOpenCashClosing} disabled={isSubmittingOpen || !openingDate}>
              {isSubmittingOpen ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarDays className="mr-2 h-4 w-4" />}
              Confirmar abertura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseDialogVisible} onOpenChange={setIsCloseDialogVisible}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fechar caixa</DialogTitle>
            <DialogDescription>Informe o contado final por mÃ©todo. O sistema calcula a diferenÃ§a sobre o esperado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {PAYMENT_METHODS.map((method) => (
              <div key={method.key} className="space-y-2">
                <Label htmlFor={`counted-${method.key}`}>{method.label}</Label>
                <CurrencyInput
                  id={`counted-${method.key}`}
                  cents
                  value={countedTotals[method.key]}
                  onChange={(val) =>
                    setCountedTotals((current) => ({
                      ...current,
                      [method.key]: val,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cash-closing-notes">ObservaÃ§Ãµes finais</Label>
            <Textarea
              id="cash-closing-notes"
              value={closingNotes}
              onChange={(event) => setClosingNotes(event.target.value)}
              placeholder="Ex: diferenÃ§a explicada por troco inicial e pagamento pendente."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseDialogVisible(false)}>Cancelar</Button>
            <Button onClick={handleCloseCashClosing} disabled={isSubmittingClose}>
              {isSubmittingClose ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Encerrar caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransactionDialog
        open={isTransactionOpen}
        onOpenChange={setIsTransactionOpen}
        defaultType={transactionDefaultType}
        editingTransaction={editingTransaction}
        initialDate={cashBusinessDate}
        categories={categories}
        isLoadingCategories={isLoadingCategories}
        professionals={professionals}
        createTransaction={handleCreateTransaction}
        updateTransaction={handleUpdateTransaction}
        createCategory={createCategory}
      />

      <DeleteConfirmationDialog
        open={!!transactionToDelete}
        isLoading={isDeletingTransaction}
        title="Excluir transaÃ§Ã£o do caixa?"
        description="Tem certeza que deseja excluir este lanÃ§amento do caixa? Esta aÃ§Ã£o nÃ£o pode ser desfeita."
        onOpenChange={(open) => {
          if (!isDeletingTransaction && !open) setTransactionToDelete(null);
        }}
        onConfirm={handleDeleteTransaction}
      />
    </MainLayout>
  );
}
