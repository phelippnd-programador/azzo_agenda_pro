import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1, "Digite uma mensagem.").max(2000, "Mensagem excede 2000 caracteres."),
});

export type ChatMessageForm = z.infer<typeof chatMessageSchema>;
