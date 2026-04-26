import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageErrorState } from '@/components/ui/page-states';
import { HighlightMetricCard } from '@/components/ui/highlight-metric-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart2,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { TransactionDialog } from '@/components/financial/TransactionDialog';
import { CashFlowChart } from '@/components/financial/CashFlowChart';
import { TransactionList } from '@/components/financial/TransactionList';
import { ManageCategoriesDialog } from '@/components/financial/ManageCategoriesDialog';
import { RecurringTransactionsDialog } from '@/components/financial/RecurringTransactionsDialog';
import { FinancialFiltersPanel, type FinancialFilters } from '@/components/financial/FinancialFiltersPanel';
import { useTransactions, useTransactionCategories, getDateRangeFromFilter } from '@/hooks/useTransactions';
import { useProfessionals } from '@/hooks/useProfessionals';
import { transactionsApi } from '@/lib/api';
import { formatCurrencyCents } from '@/lib/format';
import { toast } from 'sonner';
import type { Transaction } from '@/types';

export default function Financial() {
  // ── Período e filtros ─────────────────────────────────────────────────────
  const [dateFilter, setDateFilter] = useState('today');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FinancialFilters>({
    type: '', categoryId: '', paymentMethod: '', professionalId: '', reconciled: '',
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleFilterChange = (key: keyof FinancialFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters({ type: '', categoryId: '', paymentMethod: '', professionalId: '', reconciled: '' });

  // ── Dialogs ───────────────────────────────────────────────────────────────
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionDefaultType, setTransactionDefaultType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [showCashFlow, setShowCashFlow] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ── Data hooks ────────────────────────────────────────────────────────────
  const {
    transactions,
    summary,
    totalCount,
    totalPages,
    page,
    setPage,
    isLoading,
    error,
    refetch,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions({
    dateFilter,
    type: filters.type || undefined,
    categoryId: filters.categoryId || undefined,
    paymentMethod: filters.paymentMethod || undefined,
    professionalId: filters.professionalId || undefined,
    reconciled: filters.reconciled || undefined,
  });

  const { categories, isLoading: isLoadingCategories, createCategory, updateCategory, deleteCategory } = useTransactionCategories();
  const { professionals } = useProfessionals();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openNewTransaction = (type: 'INCOME' | 'EXPENSE') => {
    setEditingTransaction(null);
    setTransactionDefaultType(type);
    setIsTransactionOpen(true);
  };

  const openEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionDefaultType(transaction.type);
    setIsTransactionOpen(true);
  };

  const handleReconcile = async (id: string) => {
    try {
      await transactionsApi.reconcile(id);
      refetch();
    } catch {
      toast.error('Erro ao conciliar lançamento');
    }
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    setIsDeletingTransaction(true);
    try {
      await deleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
    } catch {
      // handled in hook
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const { from, to } = getDateRangeFromFilter(dateFilter);
      const blob = await transactionsApi.exportCsv({
        from,
        to,
        type: filters.type || undefined,
        categoryId: filters.categoryId || undefined,
        paymentMethod: filters.paymentMethod || undefined,
        professionalId: filters.professionalId || undefined,
        reconciled: filters.reconciled || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lancamentos-${dateFilter}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (isLoading && transactions.length === 0) {
    return (
      <MainLayout title="Financeiro" subtitle="Controle de caixa e transações">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Financeiro" subtitle="Controle de caixa e transações">
        <PageErrorState
          title="Não foi possível carregar o financeiro"
          description={error}
          action={{ label: 'Tentar novamente', onClick: refetch }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Financeiro" subtitle="Controle de caixa e transações">
      <div className="space-y-4 sm:space-y-6">

        {/* Cards de resumo */}
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          <HighlightMetricCard
            title="Entradas"
            value={formatCurrencyCents(summary.totalIncome)}
            icon={TrendingUp}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
            titleClassName="text-green-700"
            valueClassName="text-green-800"
            iconContainerClassName="bg-green-100"
            iconClassName="text-green-600"
          />
          <HighlightMetricCard
            title="Saídas"
            value={formatCurrencyCents(summary.totalExpenses)}
            icon={TrendingDown}
            className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
            titleClassName="text-red-700"
            valueClassName="text-red-800"
            iconContainerClassName="bg-red-100"
            iconClassName="text-red-600"
          />
          <HighlightMetricCard
            title="Saldo"
            value={formatCurrencyCents(summary.balance)}
            icon={Wallet}
            className={summary.balance >= 0
              ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'
              : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}
            titleClassName={summary.balance >= 0 ? 'text-primary' : 'text-orange-700'}
            valueClassName={summary.balance >= 0 ? 'text-primary' : 'text-orange-800'}
            iconContainerClassName={summary.balance >= 0 ? 'bg-primary/15' : 'bg-orange-100'}
            iconClassName={summary.balance >= 0 ? 'text-primary' : 'text-orange-600'}
          />
        </div>

        {/* Barra de ações */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-wrap">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-36 sm:w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setShowFilters((v) => !v)}>
                <Filter className="w-3.5 h-3.5" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-[10px]">{activeFilterCount}</Badge>
                )}
              </Button>

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground" onClick={clearFilters}>
                  <X className="w-3.5 h-3.5" /> Limpar
                </Button>
              )}

              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setShowCashFlow((v) => !v)}>
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fluxo de Caixa</span>
              </Button>

              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleExportCsv} disabled={isExporting}>
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Exportar CSV</span>
              </Button>

              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setIsCategoriesOpen(true)}>
                <Tag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Categorias</span>
              </Button>

              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setIsRecurringOpen(true)}>
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recorrentes</span>
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => openNewTransaction('INCOME')}
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Nova</span> Entrada
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => openNewTransaction('EXPENSE')}
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Nova</span> Saída
              </Button>
            </div>
          </div>

          {showFilters && (
            <FinancialFiltersPanel
              filters={filters}
              onChange={handleFilterChange}
              categories={categories}
              professionals={professionals}
            />
          )}
        </div>

        {showCashFlow && <CashFlowChart dateFilter={dateFilter} />}

        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onEdit={openEditTransaction}
          onDelete={(id) => setTransactionToDelete(id)}
          onReconcile={handleReconcile}
        />

        {/* Dialogs */}
        <TransactionDialog
          open={isTransactionOpen}
          onOpenChange={setIsTransactionOpen}
          defaultType={transactionDefaultType}
          editingTransaction={editingTransaction}
          categories={categories}
          isLoadingCategories={isLoadingCategories}
          professionals={professionals}
          createTransaction={createTransaction}
          updateTransaction={updateTransaction}
          createCategory={createCategory}
        />

        <ManageCategoriesDialog
          open={isCategoriesOpen}
          onOpenChange={setIsCategoriesOpen}
          categories={categories}
          isLoading={isLoadingCategories}
          createCategory={createCategory}
          updateCategory={updateCategory}
          deleteCategory={deleteCategory}
        />

        <RecurringTransactionsDialog open={isRecurringOpen} onOpenChange={setIsRecurringOpen} />

        <DeleteConfirmationDialog
          open={!!transactionToDelete}
          isLoading={isDeletingTransaction}
          title="Excluir transação?"
          description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
          onOpenChange={(open) => { if (!isDeletingTransaction && !open) setTransactionToDelete(null); }}
          onConfirm={handleDelete}
        />
      </div>
    </MainLayout>
  );
}
