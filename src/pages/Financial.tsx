import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  BarChart2,
  BarChart3,
  Download,
  Filter,
  Loader2,
  MoreHorizontal,
  Receipt,
  RefreshCw,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  type LucideIcon,
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
import { useMenuPermissions } from '@/contexts/MenuPermissionsContext';
import { transactionsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import type { Transaction } from '@/types';

type FinanceArea = {
  path: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const FINANCE_AREAS: FinanceArea[] = [
  {
    path: '/financeiro/fechamento-caixa',
    title: 'Fechamento de Caixa',
    description: 'Abra, confira e feche o caixa do dia.',
    icon: Wallet,
  },
  {
    path: '/financeiro/comissoes',
    title: 'Comissões',
    description: 'Apuração e pagamento das comissões da equipe.',
    icon: Receipt,
  },
  {
    path: '/financeiro/profissionais',
    title: 'Equipe',
    description: 'Desempenho financeiro por profissional.',
    icon: BarChart3,
  },
];

export default function Financial() {
  const { allowedRoutes } = useMenuPermissions();
  const allowedSet = new Set(allowedRoutes ?? []);
  const visibleAreas = FINANCE_AREAS.filter((area) => allowedSet.has(area.path));
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
  const [reconcilingTransactionId, setReconcilingTransactionId] = useState<string | null>(null);

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
    const transaction = transactions.find((item) => item.id === id);
    setReconcilingTransactionId(id);
    try {
      await transactionsApi.reconcile(id);
      refetch();
      toast.success(transaction?.reconciled ? 'Transação marcada como pendente' : 'Transação conciliada');
    } catch {
      toast.error('Erro ao conciliar lançamento');
    } finally {
      setReconcilingTransactionId(null);
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
          title="Financeiro do salão"
          description="Acompanhe o saldo, registre entradas e saídas, concilie lançamentos e acesse rotinas de caixa."
          badges={[
            { label: `${totalCount} lançamento(s)` },
            { label: `${activeFilterCount} filtro(s)` },
            { label: dateFilter },
          ]}
        />

        {visibleAreas.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {visibleAreas.map((area) => (
              <Card key={area.path} className="border-border/70 shadow-none">
                <div className="flex h-full flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <area.icon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">{area.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{area.description}</p>
                  <Button asChild variant="outline" size="sm" className="mt-auto w-full justify-between">
                    <Link to={area.path}>
                      Abrir
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <HighlightMetricCard
            title="Entradas"
            value={formatCurrency(summary.totalIncome)}
            icon={TrendingUp}
            className="border-success/25 bg-success/8"
            titleClassName="text-success"
            valueClassName="text-success"
            iconContainerClassName="bg-success/15"
            iconClassName="text-success"
          />
          <HighlightMetricCard
            title="Saidas"
            value={formatCurrency(summary.totalExpenses)}
            icon={TrendingDown}
            className="border-destructive/25 bg-destructive/8"
            titleClassName="text-destructive"
            valueClassName="text-destructive"
            iconContainerClassName="bg-destructive/15"
            iconClassName="text-destructive"
          />
          <HighlightMetricCard
            title="Saldo"
            value={formatCurrency(summary.balance)}
            icon={Wallet}
            className={summary.balance >= 0 ? 'border-primary/20 bg-primary/8' : 'border-warning/25 bg-warning/8'}
            titleClassName={summary.balance >= 0 ? 'text-primary' : 'text-warning'}
            valueClassName={summary.balance >= 0 ? 'text-primary' : 'text-warning'}
            iconContainerClassName={summary.balance >= 0 ? 'bg-primary/15' : 'bg-warning/15'}
            iconClassName={summary.balance >= 0 ? 'text-primary' : 'text-warning'}
          />
        </div>

        <WorkspaceNotice
          title="Operação financeira"
          description="Defina o período, filtre quando necessário e registre movimentos do caixa."
          badge={`Saldo atual: ${formatCurrency(summary.balance)}`}
        />

        <div className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-3 sm:p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Período e filtros</p>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger id="financial-date-filter" aria-label="Período financeiro" className="h-11 w-full text-sm sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
                <Button variant="outline" className="h-11 gap-2" onClick={() => setShowFilters((value) => !value)}>
                  <Filter className="h-3.5 w-3.5" />
                  Filtros
                  {activeFilterCount > 0 ? (
                    <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-xs">
                      {activeFilterCount}
                    </Badge>
                  ) : null}
                </Button>

                {activeFilterCount > 0 ? (
                  <Button variant="ghost" className="h-11 gap-1 text-muted-foreground" onClick={clearFilters}>
                    <X className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  className="h-11 gap-2 whitespace-nowrap border-success/40 text-success hover:bg-success/8"
                  onClick={() => openNewTransaction('INCOME')}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Nova Entrada
                </Button>
                <Button
                  variant="outline"
                  className="h-11 gap-2 whitespace-nowrap border-destructive/40 text-destructive hover:bg-destructive/8"
                  onClick={() => openNewTransaction('EXPENSE')}
                >
                  <ArrowDownCircle className="h-4 w-4" />
                  Nova Saída
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 gap-2">
                      <MoreHorizontal className="h-4 w-4" />
                      Mais
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setShowCashFlow((value) => !value)}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      {showCashFlow ? 'Ocultar fluxo de caixa' : 'Ver fluxo de caixa'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCsv} disabled={isExporting}>
                      {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Exportar CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsCategoriesOpen(true)}>
                      <Tag className="mr-2 h-4 w-4" />
                      Categorias
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsRecurringOpen(true)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Contas fixas
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
          reconcilingTransactionId={reconcilingTransactionId}
          hasActiveFilters={activeFilterCount > 0}
          onClearFilters={clearFilters}
          onCreateIncome={() => openNewTransaction('INCOME')}
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
