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

function isValidCpf(digits: string): boolean {
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let r1 = (sum * 10) % 11;
  if (r1 === 10 || r1 === 11) r1 = 0;
  if (r1 !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  let r2 = (sum * 10) % 11;
  if (r2 === 10 || r2 === 11) r2 = 0;
  return r2 === parseInt(digits[10]);
}

function isValidCnpj(digits: string): boolean {
  if (/^(\d)\1{13}$/.test(digits)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = w1.reduce((acc, w, i) => acc + parseInt(digits[i]) * w, 0);
  const r1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (r1 !== parseInt(digits[12])) return false;
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = w2.reduce((acc, w, i) => acc + parseInt(digits[i]) * w, 0);
  const r2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return r2 === parseInt(digits[13]);
}

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
    if (!cpfCnpjDigits) return;

    if (cpfCnpjDigits.length === 11) {
      if (!isValidCpf(cpfCnpjDigits)) {
        ctx.addIssue({
          path: ["cpfCnpj"],
          code: z.ZodIssueCode.custom,
          message: "CPF invalido.",
        });
      }
    } else if (cpfCnpjDigits.length === 14) {
      if (!isValidCnpj(cpfCnpjDigits)) {
        ctx.addIssue({
          path: ["cpfCnpj"],
          code: z.ZodIssueCode.custom,
          message: "CNPJ invalido.",
        });
      }
    } else {
      ctx.addIssue({
        path: ["cpfCnpj"],
        code: z.ZodIssueCode.custom,
        message: "Informe um CPF (11 digitos) ou CNPJ (14 digitos) valido.",
      });
    }
  });

export type RegisterForm = z.infer<typeof registerSchema>;
