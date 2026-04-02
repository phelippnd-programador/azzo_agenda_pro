import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CreditCard,
  DollarSign,
  Loader2,
  MoreVertical,
  Pencil,
  RefreshCw,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { Transaction } from '@/types';

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'Pix', icon: Smartphone },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'DEBIT_CARD', label: 'Cartão de Débito', icon: CreditCard },
  { value: 'CASH', label: 'Dinheiro', icon: Banknote },
  { value: 'OTHER', label: 'Outro', icon: Wallet },
];

const getPaymentIcon = (method: string) => PAYMENT_METHODS.find((p) => p.value === method)?.icon ?? Wallet;
const getPaymentLabel = (method: string) => PAYMENT_METHODS.find((p) => p.value === method)?.label ?? method;

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onReconcile: (id: string) => void;
}

export function TransactionList({
  transactions,
  isLoading,
  totalCount,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onReconcile,
}: TransactionListProps) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">
            Transações
            {totalCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({totalCount} total)</span>
            )}
          </CardTitle>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="py-12 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sorted.map((transaction) => {
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
                      <p className="font-medium text-foreground text-sm truncate">{transaction.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] sm:text-xs">{transaction.category}</Badge>
                        {transaction.professionalId && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">Comissão vinculada</Badge>
                        )}
                        {transaction.source === 'RECURRING' && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs gap-1 border-blue-300 text-blue-600">
                            <RefreshCw className="w-2.5 h-2.5" /> Recorrente
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
                      title={transaction.reconciled ? 'Conciliado — clique para desmarcar' : 'Marcar como conciliado'}
                      onClick={() => onReconcile(transaction.id)}
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
                        <DropdownMenuItem onClick={() => onEdit(transaction)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(transaction.id)}>
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(0, page - 1))}
                    disabled={page === 0 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1 || isLoading}
                  >
                    Próxima <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
