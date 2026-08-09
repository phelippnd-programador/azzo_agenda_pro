import { z } from 'zod';

const REQUIRED_MESSAGE = 'Informe nome, valor mensal e ao menos um beneficio.';

export const membershipBenefitSchema = z.object({
  serviceId: z.string(),
  quantidadeMensal: z.number(),
});

export const membershipPlanFormSchema = z
  .object({
    nome: z.string(),
    descricao: z.string(),
    precoMensal: z.number(),
    cumulativo: z.boolean(),
    ativo: z.boolean(),
    beneficios: z.array(membershipBenefitSchema),
  })
  .superRefine((data, ctx) => {
    if (!data.nome.trim() || !(data.precoMensal > 0) || data.beneficios.length === 0) {
      ctx.addIssue({ path: ['nome'], code: z.ZodIssueCode.custom, message: REQUIRED_MESSAGE });
    }
  });

export type MembershipPlanFormValues = z.infer<typeof membershipPlanFormSchema>;
