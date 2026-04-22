import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveApiMediaUrl } from "@/lib/api";
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
  const avatarSrc = resolveApiMediaUrl(conversation.clientProfileImageUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Abrir conversa com ${conversation.clientName || "Cliente"}`}
      className={cn(
        "w-full rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary/30 bg-primary/5"
          : "border-transparent bg-muted/40 hover:bg-muted/70"
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={avatarSrc || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
              {getInitials(conversation.clientName)}
            </AvatarFallback>
          </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="font-medium text-foreground text-sm truncate max-w-[150px] sm:max-w-[170px]">
                {conversation.clientName || "Cliente"}
              </p>
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
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
                {marker}
              </Badge>
            </div>
          </div>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}
