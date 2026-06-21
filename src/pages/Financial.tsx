import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModuleIntro, WorkspaceNotice } from '@/components/layout/module-surfaces';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  const [dateFilter, setDateFilter] = useState('today');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FinancialFilters>({
    type: '',
    categoryId: '',
    paymentMethod: '',
    professionalId: '',
    reconciled: '',
  });

  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionDefaultType, setTransactionDefaultType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [showCashFlow, setShowCashFlow] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleFilterChange = (key: keyof FinancialFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () =>
    setFilters({ type: '', categoryId: '', paymentMethod: '', professionalId: '', reconciled: '' });

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

  const { categories, isLoading: isLoadingCategories, createCategory, updateCategory, deleteCategory } =
    useTransactionCategories();
  const { professionals } = useProfessionals();

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
      toast.error('Erro ao conciliar lancamento');
    }
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    setIsDeletingTransaction(true);
    try {
      await deleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
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
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `lancamentos-${dateFilter}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <MainLayout title="Financeiro" subtitle="Controle de caixa e transacoes">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Financeiro" subtitle="Controle de caixa e transacoes">
        <PageErrorState
          title="Nao foi possivel carregar o financeiro"
          description={error}
          action={{ label: 'Tentar novamente', onClick: refetch }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Financeiro" subtitle="Controle de caixa e transacoes">
      <div className="space-y-4 sm:space-y-6">
        <ModuleIntro
          eyebrow="Caixa e receita"
          title="Leia o saldo primeiro, depois filtre a operação e só então entre no detalhe dos lançamentos."
          description="A tela foi organizada para separar visão financeira, área de trabalho e lista operacional sem misturar tudo no mesmo bloco."
          badges={[
            { label: `${totalCount} lancamento(s)` },
            { label: `${activeFilterCount} filtro(s)` },
            { label: dateFilter },
          ]}
          points={[
            {
              eyebrow: 'Leitura principal',
              title: 'Saldo e direção do caixa',
              description: 'Comece pelo saldo e compare entradas e saídas antes de abrir filtros ou exportações.',
            },
            {
              eyebrow: 'Operacao',
              title: 'Filtre, registre e concilie',
              description: 'Use a barra de ações para filtrar período, abrir o fluxo de caixa e registrar novos lançamentos.',
            },
            {
              eyebrow: 'Proximo passo',
              title: 'Revise a lista após aplicar contexto',
              description: 'A lista de transações fica mais útil depois que você define recorte, categoria e profissional.',
            },
          ]}
        />

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <HighlightMetricCard
            title="Entradas"
            value={formatCurrencyCents(summary.totalIncome)}
            icon={TrendingUp}
            className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-500/20 dark:from-green-500/10 dark:to-emerald-500/5"
            titleClassName="text-green-700 dark:text-green-300"
            valueClassName="text-green-800 dark:text-green-100"
            iconContainerClassName="bg-green-100 dark:bg-green-500/15"
            iconClassName="text-green-600 dark:text-green-300"
          />
          <HighlightMetricCard
            title="Saidas"
            value={formatCurrencyCents(summary.totalExpenses)}
            icon={TrendingDown}
            className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50 dark:border-red-500/20 dark:from-red-500/10 dark:to-rose-500/5"
            titleClassName="text-red-700 dark:text-red-300"
            valueClassName="text-red-800 dark:text-red-100"
            iconContainerClassName="bg-red-100 dark:bg-red-500/15"
            iconClassName="text-red-600 dark:text-red-300"
          />
          <HighlightMetricCard
            title="Saldo"
            value={formatCurrencyCents(summary.balance)}
            icon={Wallet}
            className={
              summary.balance >= 0
                ? 'border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5'
                : 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:border-orange-500/20 dark:from-orange-500/10 dark:to-amber-500/5'
            }
            titleClassName={summary.balance >= 0 ? 'text-primary' : 'text-orange-700 dark:text-orange-300'}
            valueClassName={summary.balance >= 0 ? 'text-primary' : 'text-orange-800 dark:text-orange-100'}
            iconContainerClassName={summary.balance >= 0 ? 'bg-primary/15' : 'bg-orange-100 dark:bg-orange-500/15'}
            iconClassName={summary.balance >= 0 ? 'text-primary' : 'text-orange-600 dark:text-orange-300'}
          />
        </div>

        <WorkspaceNotice
          title="Area de trabalho financeira"
          description="Ajuste período, filtros, visões auxiliares e crie lançamentos sem perder o contexto do caixa atual."
          badge={`Saldo atual: ${formatCurrencyCents(summary.balance)}`}
        />

        <div className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-3 sm:p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Contexto e filtros</p>
              <p className="text-sm text-muted-foreground">
                Ajuste periodo, filtros e visoes auxiliares antes de descer para a lista de transacoes.
              </p>
            </div>

            <div className="-mx-1 mt-3 overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2 px-1">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-9 w-36 text-sm sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Ultima semana</SelectItem>
                    <SelectItem value="month">Ultimo mes</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setShowFilters((value) => !value)}>
                  <Filter className="h-3.5 w-3.5" />
                  Filtros
                  {activeFilterCount > 0 ? (
                    <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  ) : null}
                </Button>

                {activeFilterCount > 0 ? (
                  <Button variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground" onClick={clearFilters}>
                    <X className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                ) : null}

                <Button variant="outline" size="sm" className="h-9 gap-2 whitespace-nowrap" onClick={() => setShowCashFlow((value) => !value)}>
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span className="sm:hidden">Fluxo</span>
                  <span className="hidden sm:inline">Fluxo de caixa</span>
                </Button>

                <Button variant="outline" size="sm" className="h-9 gap-2 whitespace-nowrap" onClick={handleExportCsv} disabled={isExporting}>
                  {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="sm:hidden">CSV</span>
                  <span className="hidden sm:inline">Exportar CSV</span>
                </Button>

                <Button variant="outline" size="sm" className="h-9 gap-2 whitespace-nowrap" onClick={() => setIsCategoriesOpen(true)}>
                  <Tag className="h-3.5 w-3.5" />
                  <span>Categorias</span>
                </Button>

                <Button variant="outline" size="sm" className="h-9 gap-2 whitespace-nowrap" onClick={() => setIsRecurringOpen(true)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="sm:hidden">Recorr.</span>
                  <span className="hidden sm:inline">Recorrentes</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-3 sm:p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Lancamentos rapidos</p>
              <p className="text-sm text-muted-foreground">
                Registre entrada ou saida sem perder o contexto do saldo atual.
              </p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:justify-end">
              <Button
                variant="outline"
                className="gap-2 whitespace-nowrap border-green-300 text-green-700 hover:bg-green-50 dark:border-green-500/30 dark:text-green-300 dark:hover:bg-green-500/10"
                onClick={() => openNewTransaction('INCOME')}
              >
                <ArrowUpCircle className="h-4 w-4" />
                <span className="sm:hidden">Entrada</span>
                <span className="hidden sm:inline">Nova Entrada</span>
              </Button>
              <Button
                variant="outline"
                className="gap-2 whitespace-nowrap border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                onClick={() => openNewTransaction('EXPENSE')}
              >
                <ArrowDownCircle className="h-4 w-4" />
                <span className="sm:hidden">Saida</span>
                <span className="hidden sm:inline">Nova Saida</span>
              </Button>
            </div>
          </div>

          {showFilters ? (
            <FinancialFiltersPanel
              filters={filters}
              onChange={handleFilterChange}
              categories={categories}
              professionals={professionals}
            />
          ) : null}
        </div>

        {showCashFlow ? <CashFlowChart dateFilter={dateFilter} /> : null}

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
          title="Excluir transacao?"
          description="Tem certeza que deseja excluir esta transacao? Esta acao nao pode ser desfeita."
          onOpenChange={(open) => {
            if (!isDeletingTransaction && !open) setTransactionToDelete(null);
          }}
          onConfirm={handleDelete}
        />
      </div>
    </MainLayout>
  );
}
