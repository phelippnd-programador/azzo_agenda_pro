import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CurrencyInput } from '@/components/ui/currency-input';

function Harness({ cents = false, initial = 0 }: { cents?: boolean; initial?: number }) {
  const [value, setValue] = useState(initial);
  return <CurrencyInput value={value} onChange={setValue} cents={cents} aria-label="valor" />;
}

describe('CurrencyInput', () => {
  it('formata ao vivo durante a digitacao no modo reais (cents=false)', () => {
    render(<Harness />);
    const input = screen.getByLabelText('valor') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '1' } });
    expect(input.value).toBe('0,01');

    fireEvent.change(input, { target: { value: '10' } });
    expect(input.value).toBe('0,10');

    fireEvent.change(input, { target: { value: '1050' } });
    expect(input.value).toBe('10,50');
  });

  it('produz o mesmo resultado ao vivo no modo centavos (cents=true)', () => {
    render(<Harness cents />);
    const input = screen.getByLabelText('valor') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '1050' } });
    expect(input.value).toBe('10,50');
  });

  it('modo reais expoe o valor em reais (float) via onChange', () => {
    let latest = 0;
    function Spy() {
      const [value, setValue] = useState(0);
      return (
        <CurrencyInput
          value={value}
          onChange={(v) => {
            latest = v;
            setValue(v);
          }}
          aria-label="valor"
        />
      );
    }
    render(<Spy />);
    const input = screen.getByLabelText('valor') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1050' } });
    expect(latest).toBe(10.5);
  });

  it('modo centavos expoe o valor em centavos inteiros via onChange', () => {
    let latest = 0;
    function Spy() {
      const [value, setValue] = useState(0);
      return (
        <CurrencyInput
          value={value}
          onChange={(v) => {
            latest = v;
            setValue(v);
          }}
          cents
          aria-label="valor"
        />
      );
    }
    render(<Spy />);
    const input = screen.getByLabelText('valor') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1050' } });
    expect(latest).toBe(1050);
  });

  it('exibe vazio quando o valor e zero e formata no blur', () => {
    render(<Harness initial={0} />);
    const input = screen.getByLabelText('valor') as HTMLInputElement;
    expect(input.value).toBe('');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '500' } });
    expect(input.value).toBe('5,00');
    fireEvent.blur(input);
    expect(input.value).toBe('5,00');
  });
});
