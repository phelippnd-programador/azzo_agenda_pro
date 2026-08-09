import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  /** Valor em REAIS (float). Ex: 10.50. Se cents=true, valor em centavos inteiros. Ex: 1050 */
  value: number;
  /** Chamado com o novo valor em REAIS (float), ou em centavos inteiros se cents=true */
  onChange: (value: number) => void;
  /** Se true, value e onChange trabalham com centavos inteiros (ex: 1050 = R$ 10,50) */
  cents?: boolean;
}

/**
 * Formata número para exibição BRL sem o prefixo R$.
 * Ex: 1500.5 → "1.500,50"
 */
function formatDisplay(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Modo caixa registradora: os dois últimos dígitos digitados são sempre os
 * centavos, empurrando o resto para a esquerda (padrão de maquininha).
 * Ex: "6500" → 65.00 | "65" → 0.65
 *
 * Usado para TODA digitação neste componente, independente da prop `cents` —
 * esta só decide a unidade do valor exposto em `value`/`onChange` (reais ou
 * centavos inteiros), não o comportamento de digitação.
 */
export function parseInputCents(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

export function CurrencyInput({
  value,
  onChange,
  cents = false,
  className,
  onFocus,
  onBlur,
  ...props
}: CurrencyInputProps) {
  const realValue = cents ? value / 100 : value;
  const [display, setDisplay] = useState(() => (realValue > 0 ? formatDisplay(realValue) : ''));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setDisplay(realValue > 0 ? formatDisplay(realValue) : '');
    }
  }, [realValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseInputCents(raw);
    setDisplay(parsed > 0 ? formatDisplay(parsed) : '');
    onChange(cents ? Math.round(parsed * 100) : parsed);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = true;
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = false;
    const current = cents ? value / 100 : value;
    setDisplay(current > 0 ? formatDisplay(current) : '');
    onBlur?.(e);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn('tabular-nums', className)}
      placeholder={props.placeholder ?? '0,00'}
    />
  );
}
