import { z } from "zod";
import { parseDecimalInput } from "@/lib/format";

export const serviceFormSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome do servico."),
    description: z.string(),
    duration: z
      .string()
      .refine((value) => {
        const parsed = Number.parseInt(value, 10);
        return value.trim() !== "" && Number.isFinite(parsed) && parsed > 0;
      }, "Informe uma duracao valida em minutos."),
    price: z.number().refine((value) => Number.isFinite(value) && value > 0, {
      message: "Informe um preco maior que zero.",
    }),
    category: z.string(),
    professionalIds: z.array(z.string()),
    isActive: z.boolean(),
    sinalObrigatorio: z.boolean(),
    sinalTipo: z.enum(["PERCENTUAL", "FIXO"]),
    sinalValor: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.sinalObrigatorio) return;
    const sinalValorNumber = parseDecimalInput(data.sinalValor);
    if (!data.sinalValor.trim() || !Number.isFinite(sinalValorNumber) || sinalValorNumber <= 0) {
      ctx.addIssue({
        path: ["sinalValor"],
        code: z.ZodIssueCode.custom,
        message: "Informe o valor do sinal (maior que zero).",
      });
      return;
    }
    if (data.sinalTipo === "PERCENTUAL" && sinalValorNumber > 100) {
      ctx.addIssue({
        path: ["sinalValor"],
        code: z.ZodIssueCode.custom,
        message: "O sinal percentual nao pode exceder 100%.",
      });
    }
  });

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
