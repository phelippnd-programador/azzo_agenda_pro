import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { recurringTransactionsApi, type RecurringTransaction } from '@/lib/api';
import { formatCurrencyCents } from '@/lib/format';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface RecurringTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecurringTransactionsDialog({ open, onOpenChange }: RecurringTransactionsDialogProps) {
  const [list, setList] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [frequency, setFrequency] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
  const [dayOfMonth, setDayOfMonth] = useState('5');
  const [dayOfWeek, setDayOfWeek] = useState('1');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    recurringTransactionsApi.getAll()
      .then((data) => { if (!cancelled) setList(data); })
      .catch(() => { if (!cancelled) toast.error('Erro ao carregar recorrências'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
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
        amount: Math.round(parseFloat(amount.replace(',', '.')) * 100),
        paymentMethod,
        frequency,
        dayOfMonth: frequency === 'MONTHLY' ? parseInt(dayOfMonth) : undefined,
        dayOfWeek: frequency === 'WEEKLY' ? parseInt(dayOfWeek) : undefined,
      });
      toast.success('Recorrência criada!');
      setDescription(''); setAmount(''); setPaymentMethod('');
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
      setList((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error('Erro ao desativar recorrência');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Lançamentos Recorrentes
          </DialogTitle>
          <DialogDescription>
            Templates que geram lançamentos automaticamente (aluguel, salários, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Form */}
          <div className="space-y-3 p-3 border rounded-xl bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nova recorrência</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'INCOME' | 'EXPENSE')}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Entrada</SelectItem>
                    <SelectItem value="EXPENSE">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Frequência</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'MONTHLY' | 'WEEKLY')}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {frequency === 'MONTHLY' ? (
              <div className="space-y-1">
                <Label className="text-xs">Dia do mês (1–28)</Label>
                <Input type="number" min={1} max={28} className="h-8 text-xs" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs">Dia da semana</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_LABELS.map((label, i) => (
                      <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Descrição</Label>
              <Input className="h-8 text-xs" placeholder="Ex: Aluguel, Salário..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Valor (R$)</Label>
                <Input className="h-8 text-xs" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
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

            <Button type="button" size="sm" className="w-full gap-2" onClick={handleCreate} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Criar recorrência
            </Button>
          </div>

          {/* List */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ativas</p>
            {isLoading ? (
              <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : list.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma recorrência ativa</p>
            ) : (
              list.map((r) => {
                const scheduleLabel = r.frequency === 'MONTHLY'
                  ? `Todo dia ${r.dayOfMonth}`
                  : WEEKDAY_LABELS[r.dayOfWeek ?? 1];
                return (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 border rounded-lg bg-muted/20 hover:bg-muted/40">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.description}</p>
                      <p className="text-[11px] text-muted-foreground">{scheduleLabel} · {formatCurrencyCents(r.amount)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {r.frequency === 'MONTHLY' ? 'Mensal' : 'Semanal'}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 flex-shrink-0"
                      disabled={deletingId === r.id}
                      onClick={() => handleDelete(r.id)}
                      title="Desativar recorrência"
                    >
                      {deletingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
