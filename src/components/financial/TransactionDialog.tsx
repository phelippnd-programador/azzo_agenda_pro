import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { stockApi, type Professional, type TransactionMutationInput } from '@/lib/api';
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
import { toDateKey } from '@/lib/format';
import { CurrencyInput } from '@/components/ui/currency-input';
import type { Transaction } from '@/types';
import type { StockItem } from '@/types/stock';

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'Pix' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de débito' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'OTHER', label: 'Outro' },
];

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: 'INCOME' | 'EXPENSE';
  editingTransaction: Transaction | null;
  initialDate?: string;
  categories: Array<{ id: string; name: string }>;
  isLoadingCategories: boolean;
  professionals: Professional[];
  createTransaction: (payload: TransactionMutationInput) => Promise<unknown>;
  updateTransaction: (id: string, payload: TransactionMutationInput) => Promise<unknown>;
  createCategory: (name: string) => Promise<{ id: string; name: string } | undefined>;
}


export function TransactionDialog({
  open,
  onOpenChange,
  defaultType,
  editingTransaction,
  initialDate,
  categories,
  isLoadingCategories,
  professionals,
  createTransaction,
  updateTransaction,
  createCategory,
}: TransactionDialogProps) {
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>(defaultType);
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState(0);
  const [formCategory, setFormCategory] = useState('');
  const [formNewCategory, setFormNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [formPaymentMethod, setFormPaymentMethod] = useState('PIX');
  const [formDate, setFormDate] = useState(toDateKey(new Date()));
  const [formProfessionalId, setFormProfessionalId] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formProductCategory, setFormProductCategory] = useState('');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resolvedInitialDate = initialDate || toDateKey(new Date());

  const isProductIncome = transactionType === 'INCOME' && formCategory === 'Produto';

  useEffect(() => {
    if (!editingTransaction) setTransactionType(defaultType);
  }, [defaultType, editingTransaction]);

  useEffect(() => {
    if (!editingTransaction && open) {
      setFormDate(resolvedInitialDate);
    }
  }, [editingTransaction, open, resolvedInitialDate]);

  useEffect(() => {
    if (editingTransaction) {
      setTransactionType(editingTransaction.type);
      setFormDescription(editingTransaction.description);
      setFormAmount(editingTransaction.amount ?? 0);
      setFormCategory(editingTransaction.category);
      setFormPaymentMethod(editingTransaction.paymentMethod);
      setFormDate(toDateKey(editingTransaction.date));
      setFormProfessionalId(editingTransaction.professionalId ?? '');
      setFormProductId(editingTransaction.productId ?? '');
      setFormProductCategory(editingTransaction.productCategory ?? '');
    }
  }, [editingTransaction]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingStock(true);
    stockApi
      .getItems({ page: 1, limit: 200 })
      .then((res) => {
        if (!cancelled) setStockItems(res.items || []);
      })
      .catch(() => {
        if (!cancelled) setStockItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStock(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setFormDescription('');
    setFormAmount(0);
    setFormCategory('');
    setFormNewCategory('');
    setIsCreatingCategory(false);
    setFormPaymentMethod('PIX');
    setFormDate(resolvedInitialDate);
    setFormProfessionalId('');
    setFormProductId('');
    setFormProductCategory('');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
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

    const amount = formAmount;
    if (!amount || amount <= 0) {
      toast.error('Informe um valor maior que zero');
      return;
    }

    if (isProductIncome && !formProfessionalId) {
      toast.error('Selecione o profissional para gerar a comissão do produto');
      return;
    }

    if (isProductIncome && !formProductId && !formProductCategory) {
      toast.error('Selecione um produto ou uma categoria de produto');
      return;
    }

    const payload = {
      type: transactionType,
      description: formDescription,
      amount,
      category: formCategory,
      paymentMethod: formPaymentMethod as 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'OTHER',
      date: formDate,
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
      handleClose();
    } catch {
      // handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCategories =
    categories.length > 0
      ? categories
      : ['Serviço', 'Produto', 'Aluguel', 'Salários', 'Equipamentos', 'Marketing', 'Utilidades', 'Outro'].map(
          (name, index) => ({ id: String(index), name })
        );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="mx-4 max-h-[85vh] max-w-md overflow-y-auto sm:mx-auto sm:max-w-2xl">
        <DialogHeader className="border-b border-border/70 pb-4 pr-10">
          <DialogTitle className={transactionType === 'INCOME' ? 'text-green-700' : 'text-red-700'}>
            {editingTransaction
              ? `Editar ${transactionType === 'INCOME' ? 'Entrada' : 'Saída'}`
              : transactionType === 'INCOME'
              ? 'Nova Entrada'
              : 'Nova Saída'}
          </DialogTitle>
          <DialogDescription>
            {editingTransaction
              ? 'Edite os dados do lançamento'
              : `Registre uma ${transactionType === 'INCOME' ? 'entrada' : 'saída'} de caixa`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <DialogSection>
            <p className="text-sm font-medium text-foreground">
              Registre a movimentação com descrição clara, categoria correta e forma de pagamento coerente.
            </p>
            <p className="text-sm text-muted-foreground">
              Isso ajuda na conciliação, nos relatórios e na leitura operacional do caixa.
            </p>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: Corte de cabelo - Maria"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <CurrencyInput
                  cents
                  value={formAmount}
                  onChange={(val) => setFormAmount(val)}
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
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" title="Nova categoria" onClick={() => setIsCreatingCategory(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da nova categoria"
                    value={formNewCategory}
                    onChange={(e) => setFormNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleAddNewCategory();
                      }
                      if (e.key === 'Escape') setIsCreatingCategory(false);
                    }}
                    autoFocus
                  />
                  <Button type="button" size="sm" onClick={() => void handleAddNewCategory()}>
                    Adicionar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setIsCreatingCategory(false); setFormNewCategory(''); }}>
                    Cancelar
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={formPaymentMethod} onValueChange={setFormPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm.value} value={pm.value}>
                      {pm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogSection>

          {isProductIncome ? (
            <DialogSection className="bg-transparent">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Vínculo comercial do produto</p>
                <p className="text-sm text-muted-foreground">
                  Defina responsável e item ou categoria para manter comissão e rastreabilidade corretas.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Profissional responsável *</Label>
                <Select value={formProfessionalId} onValueChange={setFormProfessionalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
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
                      <SelectValue placeholder={isLoadingStock ? 'Carregando produtos...' : 'Selecione o produto'} />
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
            </DialogSection>
          ) : null}
        </DialogBody>

        <DialogStickyFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={transactionType === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingTransaction ? 'Salvando...' : 'Registrando...'}
              </>
            ) : editingTransaction ? 'Salvar' : 'Registrar'}
          </Button>
        </DialogStickyFooter>
      </DialogContent>
    </Dialog>
  );
}
