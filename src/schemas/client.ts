import { z } from 'zod';

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome e telefone sao obrigatorios'),
  email: z.string(),
  phone: z.string().trim().min(1, 'Nome e telefone sao obrigatorios'),
  birthDate: z.string(),
  whatsAppOptIn: z.boolean(),
  notes: z.string(),
  cpfCnpj: z.string(),
  clientType: z.enum(['PF', 'PJ']),
  zipCode: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
