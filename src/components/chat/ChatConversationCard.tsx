import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatAppointmentMarker, ChatConversation } from "@/types/chat";
import { Clock } from "lucide-react";

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
  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

type Props = {
  conversation: ChatConversation;
  selected: boolean;
  onClick: () => void;
};

const getInitials = (name?: string | null) => {
  const normalized = (name || "Cliente").trim();
  if (!normalized) return "CL";
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

export function ChatConversationCard({ conversation, selected, onClick }: Props) {
  const marker = MARKER_LABELS[conversation.appointmentMarker];
  const preview = conversation.lastMessagePreview || "Sem ultima mensagem.";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-2 rounded-lg transition-colors border",
        selected
          ? "border-primary/30 bg-primary/5"
          : "border-transparent bg-muted/40 hover:bg-muted/70"
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={conversation.clientProfileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
              {getInitials(conversation.clientName)}
            </AvatarFallback>
          </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="font-medium text-foreground text-sm truncate max-w-[125px] sm:max-w-[170px]">
              {conversation.clientName || "Cliente"}
            </p>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
              {marker}
            </Badge>
            {conversation.unreadCount > 0 ? (
              <Badge className="text-[10px] h-4 min-w-4 px-1 bg-green-600 text-white shrink-0 flex items-center justify-center">
                {conversation.unreadCount}
              </Badge>
            ) : null}
            <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <Clock className="w-3 h-3" />
              {formatDateTime(conversation.lastMessageAt)}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground truncate mt-0.5">
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}
