import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Professional } from '@/lib/api';

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'Pix' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'OTHER', label: 'Outro' },
];

export interface FinancialFilters {
  type: string;
  categoryId: string;
  paymentMethod: string;
  professionalId: string;
  reconciled: string;
}

interface FinancialFiltersPanelProps {
  filters: FinancialFilters;
  onChange: (key: keyof FinancialFilters, value: string) => void;
  categories: Array<{ id: string; name: string }>;
  professionals: Professional[];
}

export function FinancialFiltersPanel({ filters, onChange, categories, professionals }: FinancialFiltersPanelProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-xl border bg-muted/30">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Tipo</Label>
        <Select value={filters.type} onValueChange={(v) => onChange('type', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="INCOME">Entradas</SelectItem>
            <SelectItem value="EXPENSE">Saídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Categoria</Label>
        <Select value={filters.categoryId} onValueChange={(v) => onChange('categoryId', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
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
        <Select value={filters.paymentMethod} onValueChange={(v) => onChange('paymentMethod', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {PAYMENT_METHODS.map((pm) => (
              <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Profissional</Label>
        <Select value={filters.professionalId} onValueChange={(v) => onChange('professionalId', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
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
        <Select value={filters.reconciled} onValueChange={(v) => onChange('reconciled', v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="true">Conciliados</SelectItem>
            <SelectItem value="false">Não conciliados</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
