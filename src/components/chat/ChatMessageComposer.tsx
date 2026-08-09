import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <form onSubmit={onSubmit} className="flex shrink-0 flex-col gap-2 border-t border-border/70 bg-card/80 pt-3 sm:flex-row sm:items-end">
      <Textarea
        {...form.register("message")}
        placeholder="Digite a mensagem para o cliente..."
        maxLength={2000}
        disabled={isSending}
        className="max-h-28 min-h-10 min-w-0 flex-1 resize-none bg-background/80"
        aria-label="Mensagem para o cliente"
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) return;
          event.preventDefault();
          if (!isSending && (watchedMessage || "").trim()) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <div className="flex shrink-0 gap-2">
        <Popover open={isEmojiOpen} onOpenChange={onEmojiOpenChange}>
          <PopoverTrigger asChild>
            <Button type="button" size="icon" className="h-10 w-10" disabled={isSending} aria-label="Selecionar emoji">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="h-7 w-7 rounded-md text-base transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  onClick={() => onAppendEmoji(emoji)}
                  aria-label={`Inserir ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button className="flex-1 sm:flex-none" type="submit" disabled={isSending || !(watchedMessage || "").trim()}>
          <SendHorizontal className="mr-2 h-4 w-4" />
          Enviar
        </Button>
      </div>
    </form>
  );
}
