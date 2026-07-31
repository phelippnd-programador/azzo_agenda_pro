import { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { recurringTransactionsApi, type RecurringTransaction } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogStickyFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

interface RecurringTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecurringTransactionsDialog({ open, onOpenChange }: RecurringTransactionsDialogProps) {
  const [list, setList] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [frequency, setFrequency] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
  const [dayOfMonth, setDayOfMonth] = useState('5');
  const [dayOfWeek, setDayOfWeek] = useState('1');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    recurringTransactionsApi
      .getAll()
      .then((data) => {
        if (!cancelled) setList(data);
      })
      .catch(() => {
        if (!cancelled) toast.error('Erro ao carregar recorrências');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleCreate = async () => {
    if (!description.trim() || !amount || !paymentMethod) {
      toast.error('Preencha descrição, valor e forma de pagamento');
      return;
    }
    setIsSaving(true);
    try {
      await recurringTransactionsApi.create({
        type,
        description: description.trim(),
        amount: amount,
        paymentMethod,
        frequency,
        dayOfMonth: frequency === 'MONTHLY' ? parseInt(dayOfMonth, 10) : undefined,
        dayOfWeek: frequency === 'WEEKLY' ? parseInt(dayOfWeek, 10) : undefined,
      });
      toast.success('Recorrência criada!');
      setDescription('');
      setAmount(0);
      setPaymentMethod('');
      const data = await recurringTransactionsApi.getAll();
      setList(data);
    } catch {
      toast.error('Erro ao criar recorrência');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await recurringTransactionsApi.delete(id);
      toast.success('Recorrência desativada!');
      setList((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error('Erro ao desativar recorrência');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-h-[85vh] max-w-lg overflow-y-auto sm:mx-auto">
        <DialogHeader className="border-b border-border/70 pb-4 pr-10">
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Lançamentos Recorrentes
          </DialogTitle>
          <DialogDescription>
            Templates que geram lançamentos automaticamente, como aluguel, salários e rotinas fixas.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <DialogSection>
            <p className="text-sm font-medium text-foreground">
              Monte recorrências com frequência, valor e forma de pagamento para reduzir trabalho manual no caixa.
            </p>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Nova recorrência</p>
              <p className="text-sm text-muted-foreground">Defina a regra base antes de ativar o ciclo automático.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(value) => setType(value as 'INCOME' | 'EXPENSE')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Entrada</SelectItem>
                    <SelectItem value="EXPENSE">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={frequency} onValueChange={(value) => setFrequency(value as 'MONTHLY' | 'WEEKLY')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {frequency === 'MONTHLY' ? (
              <div className="space-y-2">
                <Label>Dia do mês (1-28)</Label>
                <Input type="number" min={1} max={28} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Dia da semana</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_LABELS.map((label, index) => (
                      <SelectItem key={index} value={String(index)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Ex: Aluguel, Salário..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <CurrencyInput
                  cents
                  value={amount}
                  onChange={setAmount}
                />
              </div>
              <div className="space-y-2">
                <Label>Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Dinheiro</SelectItem>
                    <SelectItem value="PIX">Pix</SelectItem>
                    <SelectItem value="CREDIT_CARD">Cartão crédito</SelectItem>
                    <SelectItem value="DEBIT_CARD">Cartão débito</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="button" className="w-full gap-2" onClick={() => void handleCreate()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar recorrência
            </Button>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Ativas</p>
              <p className="text-sm text-muted-foreground">Revise os ciclos em vigor e desative o que não deve continuar.</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : list.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma recorrência ativa</p>
            ) : (
              <div className="space-y-2">
                {list.map((item) => {
                  const scheduleLabel =
                    item.frequency === 'MONTHLY'
                      ? `Todo dia ${item.dayOfMonth}`
                      : WEEKDAY_LABELS[item.dayOfWeek ?? 1];

                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/10 p-3">
                      <div className={`h-2 w-2 flex-shrink-0 rounded-full ${item.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {scheduleLabel} · {formatCurrency(item.amount)}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0 text-xs">
                        {item.frequency === 'MONTHLY' ? 'Mensal' : 'Semanal'}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 text-red-500 hover:text-red-600"
                        disabled={deletingId === item.id}
                        onClick={() => void handleDelete(item.id)}
                        title="Desativar recorrência"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogSection>
        </DialogBody>

        <DialogStickyFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogStickyFooter>
      </DialogContent>
    </Dialog>
  );
}
