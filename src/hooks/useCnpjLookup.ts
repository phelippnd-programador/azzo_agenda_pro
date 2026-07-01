import { useState, useCallback, useRef } from 'react';
import { cnpjApi, type CnpjConsultaResponse } from '@/lib/api/cnpj';
import { ApiError } from '@/lib/api/core';

interface UseCnpjLookupReturn {
  data: CnpjConsultaResponse | null;
  isLoading: boolean;
  error: string | null;
  lookup: (cnpj: string) => Promise<CnpjConsultaResponse | null>;
  clear: () => void;
}

export function useCnpjLookup(): UseCnpjLookupReturn {
  const [data, setData] = useState<CnpjConsultaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCnpj = useRef<string>('');

  const lookup = useCallback(
    async (cnpj: string): Promise<CnpjConsultaResponse | null> => {
      const sanitized = cnpj.replace(/\D/g, '');
      if (sanitized.length !== 14) return null;
      if (sanitized === lastCnpj.current) return data;

      setIsLoading(true);
      setError(null);
      lastCnpj.current = sanitized;

      try {
        const result = await cnpjApi.consultar(sanitized);
        setData(result);
        return result;
      } catch (err: unknown) {
        const code = err instanceof ApiError ? err.code : undefined;

        if (code === 'CNPJ_INVALIDO') {
          setError('CNPJ invalido. Verifique os digitos e tente novamente.');
        } else if (code === 'CNPJ_NAO_ENCONTRADO') {
          setError('CNPJ nao encontrado na base da Receita Federal.');
        } else if (code === 'CNPJ_API_INDISPONIVEL') {
          setError('Consulta indisponivel no momento. Preencha os dados manualmente.');
        } else {
          setError('Nao foi possivel consultar o CNPJ. Preencha os dados manualmente.');
        }
        setData(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [data],
  );

  const clear = useCallback(() => {
    setData(null);
    setError(null);
    lastCnpj.current = '';
  }, []);

  return { data, isLoading, error, lookup, clear };
}
