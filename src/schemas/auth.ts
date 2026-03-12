import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail para recuperar a senha.")
    .email("Informe um e-mail valido."),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail.").email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe a senha."),
  mfaCode: z.string().optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Informe seu nome completo."),
    email: z.string().trim().min(1, "Informe seu e-mail.").email("Informe um e-mail valido."),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
    acceptedLegalTerms: z.boolean().refine((value) => value, {
      message: "Voce precisa aceitar os Termos de Uso e a Politica de Privacidade.",
    }),
    salonName: z.string().trim().min(1, "Informe o nome do salao."),
    phone: z.string().trim().min(1, "Informe o telefone."),
    cpfCnpj: z.string().trim().min(1, "Informe CPF ou CNPJ."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "As senhas nao conferem.",
      });
    }

    const cpfCnpjDigits = data.cpfCnpj.replace(/\D/g, "");
    if (cpfCnpjDigits && ![11, 14].includes(cpfCnpjDigits.length)) {
      ctx.addIssue({
        path: ["cpfCnpj"],
        code: z.ZodIssueCode.custom,
        message: "Informe um CPF ou CNPJ valido.",
      });
    }
  });

export type RegisterForm = z.infer<typeof registerSchema>;
