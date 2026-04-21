import type { ChatMessage } from "@/types/chat";
import { formatDateLong, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { PageEmptyState } from "@/components/ui/page-states";
import { Skeleton } from "@/components/ui/skeleton";

type TimelineItem =
  | { type: "day"; key: string; label: string }
  | { type: "message"; key: string; message: ChatMessage };

const MESSAGE_STATUS_LABELS: Record<ChatMessage["status"], string> = {
  QUEUED: "Na fila",
  SENT: "Enviado",
  DELIVERED: "Entregue",
  READ: "Lido",
  FAILED: "Falhou",
};

const messageStatusVariant = (message: ChatMessage) => {
  if (message.status === "FAILED") return "destructive" as const;
  if (message.status === "READ") return "default" as const;
  return "secondary" as const;
};

const getDayKey = (value?: string | null) => {
  if (!value) return "sem-data";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "sem-data";
  return parsed.toISOString().slice(0, 10);
};

const formatTimeOnly = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

type ChatTimelineProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  onFocusComposer: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
};

export function ChatTimeline({
  messages,
  isLoading,
  onFocusComposer,
  containerRef,
  onScroll,
}: ChatTimelineProps) {
  const timelineItems = messages.reduce<TimelineItem[]>((items, message, index) => {
    const previousMessage = messages[index - 1];
    const dayKey = getDayKey(message.createdAt);
    const previousDayKey = previousMessage ? getDayKey(previousMessage.createdAt) : null;

    if (dayKey !== previousDayKey) {
      items.push({
        type: "day",
        key: `day-${dayKey}-${index}`,
        label: formatDateLong(message.createdAt),
      });
    }

    items.push({
      type: "message",
      key: message.id,
      message,
    });

    return items;
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 space-y-3 overflow-y-auto pr-1 py-3"
    >
      {isLoading && messages.length === 0 ? (
        <>
          <Skeleton className="h-14 w-2/3" />
          <Skeleton className="ml-auto h-14 w-2/3" />
        </>
      ) : messages.length === 0 ? (
        <PageEmptyState
          title="Sem mensagens nesta conversa"
          description="Ainda nao existe historico nesta conversa. Envie a primeira mensagem para iniciar o atendimento manual."
          action={{
            label: "Escrever primeira mensagem",
            onClick: onFocusComposer,
          }}
        />
      ) : (
        <>
          {timelineItems.map((item) => {
            if (item.type === "day") {
              return (
                <div key={item.key} className="sticky top-0 z-10 flex justify-center py-1">
                  <Badge variant="outline" className="bg-background/95 backdrop-blur">
                    {item.label}
                  </Badge>
                </div>
              );
            }

            const { message } = item;
            const isOutbound = message.direction === "OUTBOUND";
            const statusVariant = messageStatusVariant(message);

            return (
              <div
                key={item.key}
                className={`max-w-[82%] rounded-2xl border p-3 shadow-sm ${
                  isOutbound
                    ? "ml-auto border-primary/30 bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      isOutbound ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {isOutbound ? "Saida manual" : "Cliente"}
                  </span>
                  <span
                    className={`text-[11px] ${
                      isOutbound ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {formatTimeOnly(message.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">
                  {message.content || "[Conteudo expirado]"}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] ${
                      isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {formatDateTime(message.createdAt)}
                  </span>
                  {isOutbound ? (
                    <Badge
                      variant={statusVariant}
                      className={
                        statusVariant === "secondary"
                          ? "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/15"
                          : undefined
                      }
                    >
                      {MESSAGE_STATUS_LABELS[message.status] ?? message.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Recebida</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
