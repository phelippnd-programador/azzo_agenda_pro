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
import { formatCurrencyCents, formatDateOnly } from '@/lib/format';
import type { Transaction } from '@/types';

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'Pix', icon: Smartphone },
  { value: 'CREDIT_CARD', label: 'Cartao de Credito', icon: CreditCard },
  { value: 'DEBIT_CARD', label: 'Cartao de Debito', icon: CreditCard },
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
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">
            Transacoes
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
            <DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhuma transacao encontrada</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sorted.map((transaction) => {
                const PaymentIcon = getPaymentIcon(transaction.paymentMethod);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 transition-colors hover:bg-muted/70 sm:gap-4 sm:p-4"
                  >
                    <div
                      className={`h-9 w-9 flex-shrink-0 rounded-xl flex items-center justify-center sm:h-10 sm:w-10 ${
                        transaction.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {transaction.type === 'INCOME' ? (
                        <ArrowUpCircle className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-red-600 sm:h-5 sm:w-5" />
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
                          <Badge variant="outline" className="gap-1 border-blue-300 text-[10px] text-blue-600 sm:text-xs">
                            <RefreshCw className="h-2.5 w-2.5" /> Recorrente
                          </Badge>
                        ) : null}
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
                          <PaymentIcon className="h-3 w-3" />
                          {getPaymentLabel(transaction.paymentMethod)}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p
                        className={`text-sm font-semibold sm:text-base ${
                          transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrencyCents(transaction.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground sm:text-xs">
                        {formatDateOnly(transaction.date)}
                      </p>
                    </div>

                    {!readOnly ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          title={transaction.reconciled ? 'Conciliado - clique para desmarcar' : 'Marcar como conciliado'}
                          onClick={() => onReconcile(transaction.id)}
                        >
                          {transaction.reconciled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
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
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(transaction.id)}>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Pagina {page + 1} de {totalPages}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(0, page - 1))}
                    disabled={page === 0 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1 || isLoading}
                  >
                    Proxima <ChevronRight className="h-4 w-4" />
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
