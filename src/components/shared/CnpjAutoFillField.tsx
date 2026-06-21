import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, AlertTriangle } from 'lucide-react';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';
import type { CnpjConsultaResponse } from '@/lib/api/cnpj';

interface CnpjAutoFillFieldProps {
  value: string;
  onChange: (value: string) => void;
  onDataLoaded?: (data: CnpjConsultaResponse) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  id?: string;
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function CnpjAutoFillField({
  value,
  onChange,
  onDataLoaded,
  disabled,
  label = 'CNPJ',
  required,
  id = 'cnpj',
}: CnpjAutoFillFieldProps) {
  const { data, isLoading, error, lookup, clear } = useCnpjLookup();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value);
    onChange(formatted);

    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 14) {
      const result = await lookup(digits);
      if (result && onDataLoaded) {
        onDataLoaded(result);
      }
    } else {
      clear();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => void handleChange(e)}
          placeholder="00.000.000/0001-00"
          maxLength={18}
          disabled={disabled || isLoading}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {data && !error && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" />
          Dados consultados na base publica da Receita Federal. Voce pode editar qualquer campo antes de salvar.
        </p>
      )}

      {data?.isMei && (
        <Alert variant="default" className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
            Esta empresa esta cadastrada como MEI ou Empresario Individual. Os dados de contato (e-mail e telefone) podem estar vinculados a uma pessoa fisica — revise esses campos antes de salvar.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
