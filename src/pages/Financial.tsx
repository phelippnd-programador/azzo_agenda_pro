import { useState } from 'react';
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
} from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { toast } from 'sonner';

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

const incomeCategories = ['Serviço', 'Produto', 'Comissão', 'Outro'];
const expenseCategories = ['Produtos', 'Aluguel', 'Salários', 'Equipamentos', 'Marketing', 'Utilidades', 'Outro'];

const filterTransactionsByDate = (transactions: Array<{ date: string }>, filter: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    
    if (filter === 'today') {
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      return transactionDate >= today && transactionDate <= todayEnd;
    }
    
    if (filter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return transactionDate >= weekAgo;
    }
    
    if (filter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return transactionDate >= monthAgo;
    }
    
    return true;
  });
};

export default function Financial() {
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [dateFilter, setDateFilter] = useState('today');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);

  // Form state
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('PIX');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  const { transactions, summary, isLoading, error, refetch, createTransaction, deleteTransaction } = useTransactions();

  const getPaymentIcon = (method: string) => {
    const found = paymentMethods.find(p => p.value === method);
    return found ? found.icon : Wallet;
  };

  const getPaymentLabel = (method: string) => {
    const found = paymentMethods.find(p => p.value === method);
    return found ? found.label : method;
  };

  const filteredTransactions = filterTransactionsByDate(transactions, dateFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const resetForm = () => {
    setFormDescription('');
    setFormAmount('');
    setFormCategory('');
    setFormPaymentMethod('PIX');
    setFormDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async () => {
    if (!formDescription || !formAmount || !formCategory) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        type: transactionType,
        description: formDescription,
        amount: parseFloat(formAmount),
        category: formCategory,
        paymentMethod: formPaymentMethod as 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'OTHER',
        date: new Date(formDate).toISOString(),
      });

      setIsNewTransactionOpen(false);
      resetForm();
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setTransactionToDelete(id);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    setIsDeletingTransaction(true);
    try {
      await deleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Financeiro" subtitle="Controle de caixa e transações">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
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
    <MainLayout title="Financeiro" subtitle="Controle de caixa e transações">
      <div className="space-y-4 sm:space-y-6">
        {/* Summary Cards */}
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

        {/* Actions and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-32 sm:w-40 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
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
              <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className={transactionType === 'INCOME' ? 'text-green-700' : 'text-red-700'}>
                    {transactionType === 'INCOME' ? 'Nova Entrada' : 'Nova Saída'}
                  </DialogTitle>
                  <DialogDescription>
                    Registre uma {transactionType === 'INCOME' ? 'entrada' : 'saída'} de caixa
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
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {(transactionType === 'INCOME' ? incomeCategories : expenseCategories).map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        Registrando...
                      </>
                    ) : (
                      'Registrar'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
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

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
      </div>
    </MainLayout>
  );
}

