import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageErrorState } from '@/components/ui/page-states';
import { HighlightMetricCard } from '@/components/ui/highlight-metric-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  MoreVertical,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  X,
  Pencil,
  Download,
  BarChart2,
  Trash2,
  Tag,
  Check,
} from 'lucide-react';
import { useTransactions, useTransactionCategories, getDateRangeFromFilter, type CategoryWithCount } from '@/hooks/useTransactions';
import { useProfessionals } from '@/hooks/useProfessionals';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { stockApi, transactionsApi, recurringTransactionsApi, type RecurringTransaction as RecurringTx } from '@/lib/api';
import { CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import type { StockItem } from '@/types/stock';
import type { Transaction } from '@/types';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const paymentMethods = [
  { value: 'PIX', label: 'Pix', icon: Smartphone },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'DEBIT_CARD', label: 'Cartão de Débito', icon: CreditCard },
  { value: 'CASH', label: 'Dinheiro', icon: Banknote },
  { value: 'OTHER', label: 'Outro', icon: Wallet },
];

// Categorias padrão exibidas enquanto as da API carregam
const DEFAULT_CATEGORIES = ['Serviço', 'Produto', 'Aluguel', 'Salários', 'Equipamentos', 'Marketing', 'Utilidades', 'Outro'];

export default function Financial() {
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [dateFilter, setDateFilter] = useState('today');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);

  // Filtros avançados (F1.1)
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterProfessionalId, setFilterProfessionalId] = useState('');

  // Form state
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNewCategory, setFormNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('PIX');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formProfessionalId, setFormProfessionalId] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formProductCategory, setFormProductCategory] = useState('');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoadingStockItems, setIsLoadingStockItems] = useState(false);

  const [filterReconciled, setFilterReconciled] = useState(''); // '' | 'true' | 'false'

  const activeFilterCount = [filterType, filterCategoryId, filterPaymentMethod, filterProfessionalId, filterReconciled].filter(Boolean).length;

  // Gerenciar categorias (F1.5)
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [isDeletingCategory, setIsDeletingCategory] = useState<string | null>(null);
  const [newCategoryNameForModal, setNewCategoryNameForModal] = useState('');

  // Lançamentos recorrentes (F2.2)
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringList, setRecurringList] = useState<RecurringTx[]>([]);
  const [isLoadingRecurring, setIsLoadingRecurring] = useState(false);
  const [isDeletingRecurring, setIsDeletingRecurring] = useState<string | null>(null);
  const [recurringType, setRecurringType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [recurringDescription, setRecurringDescription] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringPaymentMethod, setRecurringPaymentMethod] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState('5');
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState('1');
  const [isSavingRecurring, setIsSavingRecurring] = useState(false);

  // Cash flow chart (F1.4)
  const [showCashFlow, setShowCashFlow] = useState(false);
  const [cashFlowData, setCashFlowData] = useState<Array<{ date: string; income: number; expenses: number; balance: number }>>([]);
  const [isLoadingCashFlow, setIsLoadingCashFlow] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Dados
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
    type: filterType || undefined,
    categoryId: filterCategoryId || undefined,
    paymentMethod: filterPaymentMethod || undefined,
    professionalId: filterProfessionalId || undefined,
  });

  const { categories, isLoading: isLoadingCategories, createCategory, updateCategory, deleteCategory } = useTransactionCategories();
  const { professionals } = useProfessionals();

  const isProductIncome = transactionType === 'INCOME' && formCategory === 'Produto';

  // Categorias disponíveis para o select — da API se carregadas, senão as padrão
  const availableCategories = categories.length > 0
    ? categories
    : DEFAULT_CATEGORIES.map((n, i) => ({ id: String(i), name: n }));

  useEffect(() => {
    let cancelled = false;

    const loadStockItems = async () => {
      try {
        setIsLoadingStockItems(true);
        const response = await stockApi.getItems({ page: 1, limit: 200 });
        if (cancelled) return;
        setStockItems(response.items || []);
      } catch {
        if (!cancelled) setStockItems([]);
      } finally {
        if (!cancelled) setIsLoadingStockItems(false);
      }
    };

    loadStockItems();
    return () => { cancelled = true; };
  }, []);

  const getPaymentIcon = (method: string) => {
    const found = paymentMethods.find(p => p.value === method);
    return found ? found.icon : Wallet;
  };

  const getPaymentLabel = (method: string) => {
    const found = paymentMethods.find(p => p.value === method);
    return found ? found.label : method;
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const resetForm = () => {
    setFormDescription('');
    setFormAmount('');
    setFormCategory('');
    setFormNewCategory('');
    setIsCreatingCategory(false);
    setFormPaymentMethod('PIX');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormProfessionalId('');
    setFormProductId('');
    setFormProductCategory('');
    setEditingTransaction(null);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionType(transaction.type);
    setFormDescription(transaction.description);
    setFormAmount(String(transaction.amount));
    setFormCategory(transaction.category);
    setFormPaymentMethod(transaction.paymentMethod);
    setFormDate(new Date(transaction.date).toISOString().split('T')[0]);
    setFormProfessionalId(transaction.professionalId ?? '');
    setFormProductId(transaction.productId ?? '');
    setFormProductCategory(transaction.productCategory ?? '');
    setIsNewTransactionOpen(true);
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterCategoryId('');
    setFilterPaymentMethod('');
    setFilterProfessionalId('');
    setFilterReconciled('');
  };

  const handleReconcile = async (id: string) => {
    try {
      await transactionsApi.reconcile(id);
      refetch();
    } catch {
      toast.error('Erro ao conciliar lançamento');
    }
  };

  // Busca dados do fluxo de caixa quando o painel é aberto ou o período muda
  useEffect(() => {
    if (!showCashFlow) return;
    let cancelled = false;
    const { from, to } = getDateRangeFromFilter(dateFilter);
    setIsLoadingCashFlow(true);
    transactionsApi.getCashFlow({ from, to })
      .then((data) => { if (!cancelled) setCashFlowData(data); })
      .catch(() => { if (!cancelled) setCashFlowData([]); })
      .finally(() => { if (!cancelled) setIsLoadingCashFlow(false); });
    return () => { cancelled = true; };
  }, [showCashFlow, dateFilter]);

  // ─── Recorrentes ────────────────────────────────────────────────────────
  const loadRecurring = async () => {
    setIsLoadingRecurring(true);
    try {
      const data = await recurringTransactionsApi.getAll();
      setRecurringList(data);
    } catch {
      toast.error('Erro ao carregar recorrências');
    } finally {
      setIsLoadingRecurring(false);
    }
  };

  useEffect(() => {
    if (isRecurringModalOpen) loadRecurring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecurringModalOpen]);

  const handleCreateRecurring = async () => {
    if (!recurringDescription.trim() || !recurringAmount || !recurringPaymentMethod) {
      toast.error('Preencha descrição, valor e forma de pagamento');
      return;
    }
    setIsSavingRecurring(true);
    try {
      await recurringTransactionsApi.create({
        type: recurringType,
        description: recurringDescription.trim(),
        amount: Math.round(parseFloat(recurringAmount.replace(',', '.')) * 100),
        paymentMethod: recurringPaymentMethod,
        frequency: recurringFrequency,
        dayOfMonth: recurringFrequency === 'MONTHLY' ? parseInt(recurringDayOfMonth) : undefined,
        dayOfWeek: recurringFrequency === 'WEEKLY' ? parseInt(recurringDayOfWeek) : undefined,
      });
      toast.success('Recorrência criada!');
      setRecurringDescription('');
      setRecurringAmount('');
      setRecurringPaymentMethod('');
      await loadRecurring();
    } catch {
      toast.error('Erro ao criar recorrência');
    } finally {
      setIsSavingRecurring(false);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    setIsDeletingRecurring(id);
    try {
      await recurringTransactionsApi.delete(id);
      toast.success('Recorrência desativada!');
      setRecurringList(prev => prev.filter(r => r.id !== id));
    } catch {
      toast.error('Erro ao desativar recorrência');
    } finally {
      setIsDeletingRecurring(null);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const { from, to } = getDateRangeFromFilter(dateFilter);
      const blob = await transactionsApi.exportCsv({ from, to, type: filterType || undefined });
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

  const handleSaveEditCategory = async (id: string) => {
    const name = editingCategoryName.trim();
    if (!name) return;
    const ok = await updateCategory(id, name);
    if (ok) {
      setEditingCategoryId(null);
      setEditingCategoryName('');
    }
  };

  const handleDeleteCategory = async (cat: CategoryWithCount) => {
    if (cat.transactionCount > 0) {
      toast.error(`Existem ${cat.transactionCount} lançamento(s) vinculados. Não é possível excluir.`);
      return;
    }
    setIsDeletingCategory(cat.id);
    await deleteCategory(cat.id);
    setIsDeletingCategory(null);
  };

  const handleAddCategoryFromModal = async () => {
    const name = newCategoryNameForModal.trim();
    if (!name) return;
    await createCategory(name);
    setNewCategoryNameForModal('');
  };

  const handleAddNewCategory = async () => {
    const name = formNewCategory.trim();
    if (!name) return;
    const created = await createCategory(name);
    if (created) {
      setFormCategory(created.name);
      setFormNewCategory('');
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async () => {
    if (!formDescription || !formAmount || !formCategory) {
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }

    const amountValue = parseFloat(formAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Informe um valor maior que zero');
      return;
    }

    if (isProductIncome && !formProfessionalId) {
      toast.error('Selecione o profissional para gerar a comissao do produto');
      return;
    }

    if (isProductIncome && !formProductId && !formProductCategory) {
      toast.error('Selecione um produto ou uma categoria de produto');
      return;
    }

    const payload = {
      type: transactionType,
      description: formDescription,
      amount: amountValue,
      category: formCategory,
      paymentMethod: formPaymentMethod as 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'OTHER',
      date: new Date(formDate).toISOString(),
      professionalId: formProfessionalId || undefined,
      productId: formProductId || undefined,
      productCategory: formProductCategory || undefined,
    };

    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
      } else {
        await createTransaction(payload);
      }
      setIsNewTransactionOpen(false);
      resetForm();
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (id: string) => setTransactionToDelete(id);

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    setIsDeletingTransaction(true);
    try {
      await deleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
    } catch {
      // Error handled in hook
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <MainLayout title="Financeiro" subtitle="Controle de caixa e transações">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
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
    <MainLayout title="Financeiro" subtitle="Controle de caixa e transações">
      <div className="space-y-4 sm:space-y-6">

        {/* Cards de resumo — refletem o período selecionado */}
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          <HighlightMetricCard
            title="Entradas"
            value={formatCurrency(summary.totalIncome)}
            icon={TrendingUp}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
            titleClassName="text-green-700"
            valueClassName="text-green-800"
            iconContainerClassName="bg-green-100"
            iconClassName="text-green-600"
          />
          <HighlightMetricCard
            title="Saidas"
            value={formatCurrency(summary.totalExpenses)}
            icon={TrendingDown}
            className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
            titleClassName="text-red-700"
            valueClassName="text-red-800"
            iconContainerClassName="bg-red-100"
            iconClassName="text-red-600"
          />
          <HighlightMetricCard
            title="Saldo"
            value={formatCurrency(summary.balance)}
            icon={Wallet}
            className={
              summary.balance >= 0
                ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }
            titleClassName={summary.balance >= 0 ? 'text-primary' : 'text-orange-700'}
            valueClassName={summary.balance >= 0 ? 'text-primary' : 'text-orange-800'}
            iconContainerClassName={summary.balance >= 0 ? 'bg-primary/15' : 'bg-orange-100'}
            iconClassName={summary.balance >= 0 ? 'text-primary' : 'text-orange-600'}
          />
        </div>

        {/* Filtros e ações */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-wrap">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-36 sm:w-44 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={() => setShowFilters(v => !v)}
              >
                <Filter className="w-3.5 h-3.5" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground" onClick={clearFilters}>
                  <X className="w-3.5 h-3.5" />
                  Limpar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={() => setShowCashFlow(v => !v)}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fluxo de Caixa</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={handleExportCsv}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Exportar CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={() => setIsCategoriesModalOpen(true)}
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Categorias</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={() => setIsRecurringModalOpen(true)}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recorrentes</span>
              </Button>
            </div>

            <div className="flex gap-2">
            <Dialog open={isNewTransactionOpen} onOpenChange={(open) => {
              setIsNewTransactionOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => setTransactionType('INCOME')}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Nova</span> Entrada
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setTransactionType('EXPENSE')}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Nova</span> Saída
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md mx-4 sm:mx-auto sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className={transactionType === 'INCOME' ? 'text-green-700' : 'text-red-700'}>
                    {editingTransaction
                      ? `Editar ${transactionType === 'INCOME' ? 'Entrada' : 'Saída'}`
                      : transactionType === 'INCOME' ? 'Nova Entrada' : 'Nova Saída'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTransaction
                      ? 'Edite os dados do lançamento'
                      : `Registre uma ${transactionType === 'INCOME' ? 'entrada' : 'saída'} de caixa`}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Descrição *</Label>
                    <Input
                      placeholder="Ex: Corte de cabelo - Maria"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    {!isCreatingCategory ? (
                      <div className="flex gap-2">
                        <Select value={formCategory} onValueChange={setFormCategory}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={isLoadingCategories ? 'Carregando...' : 'Selecione'} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title="Nova categoria"
                          onClick={() => setIsCreatingCategory(true)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome da nova categoria"
                          value={formNewCategory}
                          onChange={(e) => setFormNewCategory(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleAddNewCategory(); }
                            if (e.key === 'Escape') setIsCreatingCategory(false);
                          }}
                          autoFocus
                        />
                        <Button type="button" size="sm" onClick={handleAddNewCategory}>
                          Adicionar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => { setIsCreatingCategory(false); setFormNewCategory(''); }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select value={formPaymentMethod} onValueChange={setFormPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isProductIncome ? (
                    <>
                      <div className="space-y-2">
                        <Label>Profissional responsavel *</Label>
                        <Select value={formProfessionalId} onValueChange={setFormProfessionalId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o profissional" />
                          </SelectTrigger>
                          <SelectContent>
                            {professionals.map((professional) => (
                              <SelectItem key={professional.id} value={professional.id}>
                                {professional.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Produto</Label>
                          <Select
                            value={formProductId}
                            onValueChange={(value) => {
                              setFormProductId(value);
                              if (value) setFormProductCategory('');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingStockItems ? 'Carregando produtos...' : 'Selecione o produto'} />
                            </SelectTrigger>
                            <SelectContent>
                              {stockItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Categoria do produto</Label>
                          <Input
                            placeholder="Use se nao quiser vincular a um item"
                            value={formProductCategory}
                            onChange={(e) => {
                              setFormProductCategory(e.target.value);
                              if (e.target.value) setFormProductId('');
                            }}
                          />
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsNewTransactionOpen(false);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={transactionType === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingTransaction ? 'Salvando...' : 'Registrando...'}
                      </>
                    ) : editingTransaction ? 'Salvar' : 'Registrar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Painel de filtros avançados (F1.1) */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-xl border bg-muted/30">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="INCOME">Entradas</SelectItem>
                    <SelectItem value="EXPENSE">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
                <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Profissional</Label>
                <Select value={filterProfessionalId} onValueChange={setFilterProfessionalId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Conciliação</Label>
                <Select value={filterReconciled} onValueChange={setFilterReconciled}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="true">Conciliados</SelectItem>
                    <SelectItem value="false">Não conciliados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Fluxo de Caixa (F1.4) */}
        {showCashFlow && (
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-muted-foreground" />
                  Fluxo de Caixa
                </CardTitle>
                {isLoadingCashFlow && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              {cashFlowData.length === 0 && !isLoadingCashFlow ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Sem dados para o período selecionado</p>
                </div>
              ) : (
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => {
                          const parts = String(d).split('-');
                          return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
                        }}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        width={72}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) =>
                          new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(Number(v) / 100)
                        }
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value / 100),
                          name === 'income' ? 'Entradas' : name === 'expenses' ? 'Saídas' : 'Saldo',
                        ]}
                        labelFormatter={(label) => `Data: ${String(label).split('-').reverse().join('/')}`}
                      />
                      <Legend formatter={(value) => value === 'income' ? 'Entradas' : value === 'expenses' ? 'Saídas' : 'Saldo'} />
                      <Bar dataKey="income"   fill="#22c55e" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lista de transações */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">
                Transações
                {totalCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({totalCount} total)
                  </span>
                )}
              </CardTitle>
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sortedTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {sortedTransactions.map((transaction) => {
                    const PaymentIcon = getPaymentIcon(transaction.paymentMethod);

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/40 rounded-xl hover:bg-muted/70 transition-colors"
                      >
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          transaction.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'INCOME' ? (
                            <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {transaction.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              {transaction.category}
                            </Badge>
                            {transaction.professionalId ? (
                              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                Comissao vinculada
                              </Badge>
                            ) : null}
                            {transaction.source === 'RECURRING' && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs gap-1 border-blue-300 text-blue-600">
                                <RefreshCw className="w-2.5 h-2.5" />
                                Recorrente
                              </Badge>
                            )}
                            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                              <PaymentIcon className="w-3 h-3" />
                              {getPaymentLabel(transaction.paymentMethod)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className={`font-semibold text-sm sm:text-base ${
                            transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          title={transaction.reconciled ? "Conciliado — clique para desmarcar" : "Marcar como conciliado"}
                          onClick={() => handleReconcile(transaction.id)}
                        >
                          {transaction.reconciled ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(transaction)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => openDeleteDialog(transaction.id)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      Página {page + 1} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || isLoading}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1 || isLoading}
                      >
                        Próxima
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <DeleteConfirmationDialog
          open={!!transactionToDelete}
          isLoading={isDeletingTransaction}
          title="Excluir transacao?"
          description="Tem certeza que deseja excluir esta transacao? Esta acao nao pode ser desfeita."
          onOpenChange={(open) => {
            if (isDeletingTransaction) return;
            if (!open) setTransactionToDelete(null);
          }}
          onConfirm={handleDelete}
        />

        {/* Modal de Gerenciar Categorias (F1.5) */}
        <Dialog open={isCategoriesModalOpen} onOpenChange={setIsCategoriesModalOpen}>
          <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Gerenciar Categorias
              </DialogTitle>
              <DialogDescription>
                Crie, renomeie ou exclua categorias de lançamentos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Nova categoria */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nova categoria..."
                  value={newCategoryNameForModal}
                  onChange={(e) => setNewCategoryNameForModal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategoryFromModal(); } }}
                />
                <Button type="button" size="sm" onClick={handleAddCategoryFromModal} disabled={!newCategoryNameForModal.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Lista de categorias */}
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {isLoadingCategories ? (
                  <div className="py-4 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40">
                      {editingCategoryId === cat.id ? (
                        <>
                          <Input
                            className="h-7 text-sm flex-1"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditCategory(cat.id);
                              if (e.key === 'Escape') { setEditingCategoryId(null); setEditingCategoryName(''); }
                            }}
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600"
                            onClick={() => handleSaveEditCategory(cat.id)}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditingCategoryId(null); setEditingCategoryName(''); }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm">{cat.name}</span>
                          {(cat as CategoryWithCount).transactionCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {(cat as CategoryWithCount).transactionCount}
                            </Badge>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600"
                            disabled={isDeletingCategory === cat.id}
                            onClick={() => handleDeleteCategory(cat as CategoryWithCount)}
                          >
                            {isDeletingCategory === cat.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCategoriesModalOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de Lançamentos Recorrentes (F2.2) */}
        <Dialog open={isRecurringModalOpen} onOpenChange={setIsRecurringModalOpen}>
          <DialogContent className="max-w-lg mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Lançamentos Recorrentes
              </DialogTitle>
              <DialogDescription>
                Templates que geram lançamentos automaticamente (aluguel, salários, etc.)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Formulário de criação */}
              <div className="space-y-3 p-3 border rounded-xl bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nova recorrência</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={recurringType} onValueChange={(v) => setRecurringType(v as 'INCOME' | 'EXPENSE')}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Entrada</SelectItem>
                        <SelectItem value="EXPENSE">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Frequência</Label>
                    <Select value={recurringFrequency} onValueChange={(v) => setRecurringFrequency(v as 'MONTHLY' | 'WEEKLY')}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Mensal</SelectItem>
                        <SelectItem value="WEEKLY">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {recurringFrequency === 'MONTHLY' ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Dia do mês (1–28)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={28}
                      className="h-8 text-xs"
                      value={recurringDayOfMonth}
                      onChange={(e) => setRecurringDayOfMonth(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs">Dia da semana</Label>
                    <Select value={recurringDayOfWeek} onValueChange={setRecurringDayOfWeek}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Domingo</SelectItem>
                        <SelectItem value="1">Segunda</SelectItem>
                        <SelectItem value="2">Terça</SelectItem>
                        <SelectItem value="3">Quarta</SelectItem>
                        <SelectItem value="4">Quinta</SelectItem>
                        <SelectItem value="5">Sexta</SelectItem>
                        <SelectItem value="6">Sábado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="Ex: Aluguel, Salário..."
                    value={recurringDescription}
                    onChange={(e) => setRecurringDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="0,00"
                      value={recurringAmount}
                      onChange={(e) => setRecurringAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pagamento</Label>
                    <Select value={recurringPaymentMethod} onValueChange={setRecurringPaymentMethod}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Dinheiro</SelectItem>
                        <SelectItem value="PIX">Pix</SelectItem>
                        <SelectItem value="CREDIT_CARD">Cartão Crédito</SelectItem>
                        <SelectItem value="DEBIT_CARD">Cartão Débito</SelectItem>
                        <SelectItem value="OTHER">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleCreateRecurring}
                  disabled={isSavingRecurring}
                >
                  {isSavingRecurring ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Criar recorrência
                </Button>
              </div>

              {/* Lista de recorrências ativas */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ativas</p>
                {isLoadingRecurring ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : recurringList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma recorrência ativa</p>
                ) : (
                  recurringList.map((r) => {
                    const scheduleLabel = r.frequency === 'MONTHLY'
                      ? `Todo dia ${r.dayOfMonth}`
                      : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][r.dayOfWeek ?? 1];

                    return (
                      <div key={r.id} className="flex items-center gap-3 p-2.5 border rounded-lg bg-muted/20 hover:bg-muted/40">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.description}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {scheduleLabel} · {formatCurrency(r.amount / 100)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                          {r.frequency === 'MONTHLY' ? 'Mensal' : 'Semanal'}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 flex-shrink-0"
                          disabled={isDeletingRecurring === r.id}
                          onClick={() => handleDeleteRecurring(r.id)}
                          title="Desativar recorrência"
                        >
                          {isDeletingRecurring === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRecurringModalOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
}
