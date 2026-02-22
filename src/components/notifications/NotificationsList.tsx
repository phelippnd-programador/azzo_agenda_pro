import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/types/notification";

type NotificationsListProps = {
  items: NotificationItem[];
  loading: boolean;
  hasMore: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLoadMore: () => void;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStatusBadgeClass(status: NotificationItem["status"]) {
  if (status === "FAILED") return "bg-red-100 text-red-700";
  if (status === "PENDING") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export function NotificationsList({
  items,
  loading,
  hasMore,
  selectedId,
  onSelect,
  onLoadMore,
}: NotificationsListProps) {
  return (
    <div className="space-y-3">
      {!items.length && !loading ? (
        <p className="text-sm text-gray-500">Nenhuma notificacao encontrada.</p>
      ) : null}

      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-lg border p-4 space-y-2 ${
            selectedId === item.id ? "border-violet-400 bg-violet-50/40" : ""
          } ${onSelect ? "cursor-pointer" : ""}`}
          onClick={() => onSelect?.(item.id)}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getStatusBadgeClass(item.status)}>{item.status}</Badge>
              <span className="text-xs text-gray-500">{item.channel}</span>
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(item.sentAt || item.createdAt)}
            </span>
          </div>

          <p className="text-sm text-gray-800">{item.message}</p>

          <div className="text-xs text-gray-500 flex flex-wrap gap-3">
            <span>Destino: {item.destination || "-"}</span>
            <span>Criada em: {formatDate(item.createdAt)}</span>
            {item.sentAt ? <span>Enviada em: {formatDate(item.sentAt)}</span> : null}
          </div>

          {item.status === "FAILED" && item.errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
              <span>{item.errorMessage}</span>
            </div>
          ) : null}
        </div>
      ))}

      <div className="pt-1">
        <Button variant="outline" onClick={onLoadMore} disabled={loading || !hasMore}>
          {loading ? "Carregando..." : hasMore ? "Load more" : "Sem mais resultados"}
        </Button>
      </div>
    </div>
  );
}
