import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail para recuperar a senha.")
    .email("Informe um e-mail valido."),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const PASSWORD_RULES = [
  { id: "length",   label: "Minimo de 8 caracteres",   test: (p: string) => p.length >= 8 },
  { id: "upper",    label: "Letra maiuscula (A-Z)",     test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower",    label: "Letra minuscula (a-z)",     test: (p: string) => /[a-z]/.test(p) },
  { id: "digit",    label: "Numero (0-9)",              test: (p: string) => /\d/.test(p) },
  { id: "special",  label: "Caractere especial (!@#$%)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .refine((p) => /[A-Z]/.test(p), "A senha deve conter ao menos uma letra maiuscula.")
      .refine((p) => /[a-z]/.test(p), "A senha deve conter ao menos uma letra minuscula.")
      .refine((p) => /\d/.test(p), "A senha deve conter ao menos um numero.")
      .refine((p) => /[^A-Za-z0-9]/.test(p), "A senha deve conter ao menos um caractere especial (!@#$%...)."),
    confirmPassword: z.string().min(1, "Confirme sua nova senha."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "As senhas nao conferem.",
      });
    }
  });

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail.").email("Informe um e-mail valido."),
  password: z.string().trim().min(1, "Informe a senha."),
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
