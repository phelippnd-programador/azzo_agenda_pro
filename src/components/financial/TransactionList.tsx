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
import { formatCurrency, formatDateOnly } from '@/lib/format';
import type { Transaction } from '@/types';

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'Pix', icon: Smartphone },
  { value: 'CREDIT_CARD', label: 'Cartao de credito', icon: CreditCard },
  { value: 'DEBIT_CARD', label: 'Cartao de debito', icon: CreditCard },
  { value: 'CASH', label: 'Dinheiro', icon: Banknote },
  { value: 'OTHER', label: 'Outro', icon: Wallet },
];

const getPaymentIcon = (method: string) => PAYMENT_METHODS.find((payment) => payment.value === method)?.icon ?? Wallet;
const getPaymentLabel = (method: string) => PAYMENT_METHODS.find((payment) => payment.value === method)?.label ?? method;

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
  readOnly?: boolean;
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
  readOnly = false,
}: TransactionListProps) {
  const sortedTransactions = [...transactions].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
  const reconciledCount = sortedTransactions.filter((transaction) => transaction.reconciled).length;

  return (
    <Card className="border-border/70 bg-muted/15 shadow-none">
      <CardHeader className="space-y-3 pb-3 sm:pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg">
              Transacoes
              {totalCount > 0 ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">({totalCount} total)</span>
              ) : null}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Leia categoria, forma de pagamento, conciliacao e valor sem perder o contexto da linha.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background/85">
              {sortedTransactions.length} na pagina
            </Badge>
            <Badge variant="outline" className="bg-background/85">
              {reconciledCount} conciliada(s)
            </Badge>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhuma transacao encontrada</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sortedTransactions.map((transaction) => {
                const PaymentIcon = getPaymentIcon(transaction.paymentMethod);
                const isIncome = transaction.type === 'INCOME';

                return (
                  <div
                    key={transaction.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/85 p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                  >
                    <div className="flex items-start gap-3 sm:flex-1 sm:items-center sm:gap-4">
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${
                          isIncome
                            ? 'bg-green-100 dark:bg-green-500/15'
                            : 'bg-red-100 dark:bg-red-500/15'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-300 sm:h-5 sm:w-5" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-300 sm:h-5 sm:w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{transaction.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {transaction.category}
                          </Badge>
                          {transaction.professionalId ? (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">
                              Comissao vinculada
                            </Badge>
                          ) : null}
                          {transaction.source === 'RECURRING' ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-blue-300 text-[10px] text-blue-600 dark:border-blue-500/30 dark:text-blue-300 sm:text-xs"
                            >
                              <RefreshCw className="h-2.5 w-2.5" />
                              Recorrente
                            </Badge>
                          ) : null}
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
                            <PaymentIcon className="h-3 w-3" />
                            {getPaymentLabel(transaction.paymentMethod)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p
                          className={`text-sm font-semibold sm:text-base ${
                            isIncome ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground sm:text-xs">{formatDateOnly(transaction.date)}</p>
                      </div>

                      {!readOnly ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            title={transaction.reconciled ? 'Conciliado - clique para desmarcar' : 'Marcar como conciliado'}
                            onClick={() => onReconcile(transaction.id)}
                          >
                            {transaction.reconciled ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-300" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(transaction.id)}>
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-muted-foreground">Pagina {page + 1} de {totalPages}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-w-24"
                    onClick={() => onPageChange(Math.max(0, page - 1))}
                    disabled={page === 0 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-w-24"
                    onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1 || isLoading}
                  >
                    Proxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
