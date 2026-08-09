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
  if (status === "FAILED") return "border border-red-300 bg-red-100 text-red-900 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-200";
  if (status === "PENDING") return "border border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200";
  return "border border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200";
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
      {!items.length && !loading ? <p className="text-sm text-muted-foreground">Nenhuma notificação encontrada.</p> : null}

      {items.map((item) => (
        <div
          key={item.id}
          className={`space-y-2 rounded-lg border border-border/70 bg-card/90 p-4 shadow-none transition-colors ${
            selectedId === item.id ? "border-primary/40 bg-primary/5" : ""
          } ${onSelect ? "cursor-pointer" : ""}`}
          onClick={() => onSelect?.(item.id)}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getStatusBadgeClass(item.status)}>{item.status}</Badge>
              <span className="text-xs text-muted-foreground">{item.channel}</span>
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(item.sentAt || item.createdAt)}</span>
          </div>

          <p className="text-sm text-foreground">{item.message}</p>

          <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
            <span>Destino: {item.destination || "-"}</span>
            <span>Criada em: {formatDate(item.createdAt)}</span>
            {item.sentAt ? <span>Enviada em: {formatDate(item.sentAt)}</span> : null}
          </div>

          {item.status === "FAILED" && item.errorMessage ? (
            <div className="rounded-md border border-destructive/35 bg-destructive/10 p-2 text-xs font-medium text-red-900 dark:text-red-50 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
              <span>{item.errorMessage}</span>
            </div>
          ) : null}
        </div>
      ))}

      <div className="pt-1">
        <Button variant="outline" onClick={onLoadMore} disabled={loading || !hasMore}>
          {loading ? "Carregando..." : hasMore ? "Carregar mais" : "Sem mais resultados"}
        </Button>
      </div>
    </div>
  );
}
