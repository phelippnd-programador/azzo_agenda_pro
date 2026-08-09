import { z } from 'zod';

export const workingHourSchema = z.object({
  dayOfWeek: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  isWorking: z.boolean(),
});

export const professionalFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Preencha todos os campos obrigatorios'),
    email: z.string().trim().min(1, 'Preencha todos os campos obrigatorios'),
    phone: z.string().trim().min(1, 'Preencha todos os campos obrigatorios'),
    specialties: z.array(z.string()),
    isActive: z.boolean(),
    workingHours: z.array(workingHourSchema),
  })
  .superRefine((data, ctx) => {
    const invalidRange = data.workingHours.some(
      (item) => item.isWorking && item.startTime >= item.endTime
    );
    if (invalidRange) {
      ctx.addIssue({
        path: ['workingHours'],
        code: z.ZodIssueCode.custom,
        message: 'Revise os horarios: o inicio deve ser menor que o fim.',
      });
    }
  });

export type ProfessionalFormValues = z.infer<typeof professionalFormSchema>;
