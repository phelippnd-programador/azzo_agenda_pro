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
  { value: 'CREDIT_CARD', label: 'Cartao de credito' },
  { value: 'DEBIT_CARD', label: 'Cartao de debito' },
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

export function FinancialFiltersPanel({
  filters,
  onChange,
  categories,
  professionals,
}: FinancialFiltersPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5">
        <Label htmlFor="financial-filter-type" className="text-xs text-muted-foreground">Tipo</Label>
        <Select value={filters.type} onValueChange={(value) => onChange('type', value)}>
          <SelectTrigger id="financial-filter-type" className="h-11 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="INCOME">Entradas</SelectItem>
            <SelectItem value="EXPENSE">Saidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="financial-filter-category" className="text-xs text-muted-foreground">Categoria</Label>
        <Select value={filters.categoryId} onValueChange={(value) => onChange('categoryId', value)}>
          <SelectTrigger id="financial-filter-category" className="h-11 text-sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="financial-filter-payment-method" className="text-xs text-muted-foreground">Forma de pagamento</Label>
        <Select value={filters.paymentMethod} onValueChange={(value) => onChange('paymentMethod', value)}>
          <SelectTrigger id="financial-filter-payment-method" className="h-11 text-sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {PAYMENT_METHODS.map((paymentMethod) => (
              <SelectItem key={paymentMethod.value} value={paymentMethod.value}>
                {paymentMethod.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="financial-filter-professional" className="text-xs text-muted-foreground">Profissional</Label>
        <Select value={filters.professionalId} onValueChange={(value) => onChange('professionalId', value)}>
          <SelectTrigger id="financial-filter-professional" className="h-11 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {professionals.map((professional) => (
              <SelectItem key={professional.id} value={professional.id}>
                {professional.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="financial-filter-reconciled" className="text-xs text-muted-foreground">Conciliação</Label>
        <Select value={filters.reconciled} onValueChange={(value) => onChange('reconciled', value)}>
          <SelectTrigger id="financial-filter-reconciled" className="h-11 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="true">Conciliados</SelectItem>
            <SelectItem value="false">Nao conciliados</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
