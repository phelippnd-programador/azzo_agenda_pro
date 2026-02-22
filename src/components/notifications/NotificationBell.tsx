import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationItem } from "@/types/notification";
import { useNotificationsStore } from "@/stores/notifications";

function formatTimestamp(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function resolveNotificationTitle(item: NotificationItem) {
  const channel = String(item.channel || "").toUpperCase();

  if (channel.includes("WHATSAPP")) return "Lembrete WhatsApp";
  if (channel.includes("PAYMENT")) return "Pagamento recebido";
  if (channel.includes("APPOINTMENT")) return "Novo agendamento";
  if (item.status === "FAILED") return "Falha no envio";
  if (item.status === "PENDING") return "Notificacao pendente";
  return item.channel || "Notificacao";
}

export function NotificationBell() {
  const navigate = useNavigate();
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const summaryItems = useNotificationsStore((state) => state.summaryItems);
  const refreshSummary = useNotificationsStore((state) => state.refreshSummary);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          void refreshSummary();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 ? (
            <Badge className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 p-0 flex items-center justify-center bg-pink-500 text-[10px] sm:text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 sm:w-80">
        <DropdownMenuLabel>Notificacoes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!summaryItems.length ? (
          <DropdownMenuItem className="text-sm text-gray-500">
            Nenhuma notificacao
          </DropdownMenuItem>
        ) : null}
        {summaryItems.slice(0, 5).map((item) => (
          <DropdownMenuItem
            key={item.id}
            className="flex flex-col items-start gap-1 py-2 sm:py-3"
            onClick={() => navigate(`/notificacoes?id=${item.id}`)}
          >
            <span className="font-medium text-sm">{resolveNotificationTitle(item)}</span>
            <span className="text-xs sm:text-sm text-gray-500 line-clamp-2">
              {item.message}
            </span>
            <span className="text-[11px] text-gray-400">
              {formatTimestamp(item.sentAt || item.createdAt)}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/notificacoes")}>
          Ver todas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
