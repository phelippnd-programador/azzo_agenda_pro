import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontal, Smile } from "lucide-react";
import type { ChatMessageForm } from "@/schemas/chat";

const EMOJI_OPTIONS = [
  "\u{1F600}",
  "\u{1F601}",
  "\u{1F602}",
  "\u{1F609}",
  "\u{1F60A}",
  "\u{1F60D}",
  "\u{1F91D}",
  "\u{1F44F}",
  "\u{1F64F}",
  "\u{1F44D}",
  "\u{2764}\u{FE0F}",
  "\u{1F389}",
  "\u{2728}",
  "\u{1F4C5}",
  "\u{1F487}\u{200D}\u{2640}\u{FE0F}",
  "\u{1F485}",
];

type ChatMessageComposerProps = {
  form: UseFormReturn<ChatMessageForm>;
  isSending: boolean;
  isEmojiOpen: boolean;
  onEmojiOpenChange: (next: boolean) => void;
  onAppendEmoji: (emoji: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ChatMessageComposer({
  form,
  isSending,
  isEmojiOpen,
  onEmojiOpenChange,
  onAppendEmoji,
  onSubmit,
}: ChatMessageComposerProps) {
  const watchedMessage = form.watch("message");

  return (
    <form onSubmit={onSubmit} className="flex gap-2 border-t pt-3">
      <Input
        {...form.register("message")}
        placeholder="Digite a mensagem para o cliente..."
        maxLength={2000}
        disabled={isSending}
        aria-label="Mensagem para o cliente"
      />
      <Popover open={isEmojiOpen} onOpenChange={onEmojiOpenChange}>
        <PopoverTrigger asChild>
          <Button type="button" size="icon" disabled={isSending} aria-label="Selecionar emoji">
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-2">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="h-7 w-7 rounded text-base hover:bg-accent"
                onClick={() => onAppendEmoji(emoji)}
                aria-label={`Inserir ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Button type="submit" disabled={isSending || !(watchedMessage || "").trim()}>
        <SendHorizontal className="mr-2 h-4 w-4" />
        Enviar
      </Button>
    </form>
  );
}
