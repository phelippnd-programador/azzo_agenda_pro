import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveApiMediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ChatAppointmentMarker, ChatConversation } from "@/types/chat";
import { Clock, MessageCircle, Send } from "lucide-react";

const MARKER_LABELS: Record<ChatAppointmentMarker, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  PAUSADO: "Pausado",
  CONCLUIDO: "Concluído",
  NAO_COMPARECEU: "Não compareceu",
  CANCELADO: "Cancelado",
};

const CHANNEL_LABELS: Record<ChatConversation["channel"], string> = {
  WHATSAPP: "WhatsApp",
  TELEGRAM: "Telegram",
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
  const preview = conversation.lastMessagePreview || "Sem última mensagem.";
  const avatarSrc = resolveApiMediaUrl(conversation.clientProfileImageUrl);
  const channelLabel = CHANNEL_LABELS[conversation.channel] ?? "Canal";
  const ChannelIcon = conversation.channel === "TELEGRAM" ? Send : MessageCircle;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Abrir conversa com ${conversation.clientName || "Cliente"}`}
      className={cn(
        "w-full rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary/35 bg-primary/10"
          : "border-transparent bg-background/55 hover:bg-muted/60"
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarSrc || undefined} />
          <AvatarFallback className="bg-primary/10 text-xs text-primary">
            {getInitials(conversation.clientName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-start gap-1.5">
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {conversation.clientName || "Cliente"}
              </p>
              {conversation.unreadCount > 0 ? (
                <Badge className="flex h-4 min-w-4 shrink-0 items-center justify-center bg-emerald-600 px-1 text-xs text-white dark:bg-emerald-500">
                  {conversation.unreadCount}
                </Badge>
              ) : null}
              <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDateTime(conversation.lastMessageAt)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="h-4 shrink-0 px-1.5 text-xs">
                {marker}
              </Badge>
              <Badge variant="outline" className="h-4 shrink-0 gap-1 px-1.5 text-xs">
                <ChannelIcon className="h-3 w-3" />
                {channelLabel}
              </Badge>
            </div>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}
