import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatAppointmentMarker, ChatConversation } from "@/types/chat";

const MARKER_LABELS: Record<ChatAppointmentMarker, string> = {
  NAO_INICIADO: "Nao iniciado",
  EM_ANDAMENTO: "Em andamento",
  PAUSADO: "Pausado",
  CONCLUIDO: "Concluido",
  NAO_COMPARECEU: "Nao compareceu",
  CANCELADO: "Cancelado",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type Props = {
  conversation: ChatConversation;
  selected: boolean;
  onClick: () => void;
};

export function ChatConversationCard({ conversation, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-2.5 rounded-lg border transition space-y-2",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm leading-tight truncate">
            {conversation.clientName || "Cliente"}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {conversation.clientPhoneMasked || "Sem telefone"}
          </p>
        </div>
        {conversation.unreadCount > 0 ? (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {conversation.unreadCount}
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-[10px]">
          Parou em: {MARKER_LABELS[conversation.appointmentMarker]}
        </Badge>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {formatDateTime(conversation.lastMessageAt)}
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground line-clamp-2">
        {conversation.lastMessagePreview || "Sem ultima mensagem."}
      </p>
    </button>
  );
}

