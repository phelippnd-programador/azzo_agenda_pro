import { z } from 'zod';

export const stockItemFormSchema = z.object({
  nome: z.string().trim().min(1, 'Nome e unidade sao obrigatorios.'),
  sku: z.string(),
  unidadeMedida: z.string().trim().min(1, 'Nome e unidade sao obrigatorios.'),
  estoqueMinimo: z.number(),
  ativo: z.boolean(),
});

export type StockItemFormValues = z.infer<typeof stockItemFormSchema>;
