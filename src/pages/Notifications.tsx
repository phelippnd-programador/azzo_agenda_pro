import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, RefreshCw, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NotificationsFilters } from "@/components/notifications/NotificationsFilters";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationsFilters as NotificationFilters } from "@/types/notification";
import type { AppNotification } from "@/types/notification";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function Notifications() {
  const [searchParams] = useSearchParams();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    lastFetchAt,
    hasMore,
    currentFilters,
    fetchAll,
    fetchNextPage,
    removeNotification,
    clearAllNotifications,
    markAllAsRead,
  } = useNotifications();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [filters, setFilters] = useState<NotificationFilters>({
    failedOnly: false,
    limit: 20,
  });

  useEffect(() => {
    const selectedFromUrl = searchParams.get("id");
    if (selectedFromUrl) {
      setSelectedId(selectedFromUrl);
    }
  }, [searchParams]);

  // Ao entrar na pagina de notificacao, busca no backend.
  useEffect(() => {
    void fetchAll(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = async () => {
    await fetchAll(filters);
  };

  const loadMore = async () => {
    await fetchNextPage();
  };

  const handleRefresh = async () => {
    await fetchAll(currentFilters);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = async () => {
    const cleared = await clearAllNotifications();
    if (cleared) {
      setSelectedId(null);
    }
  };

  const handleRemoveSelected = async () => {
    if (!selected) return;
    const removed = await removeNotification(selected.id);
    if (removed) {
      setSelectedId(null);
    }
  };

  useEffect(() => {
    if (!notifications.length) {
      setSelectedId(null);
      return;
    }

    if (selectedId && notifications.some((item) => item.id === selectedId)) {
      return;
    }

    setSelectedId(notifications[0].id);
  }, [notifications, selectedId]);

  const selected = useMemo(
    () => notifications.find((item) => item.id === selectedId) ?? null,
    [notifications, selectedId]
  );

  const getStatusBadgeClass = (status?: AppNotification["status"]) => {
    if (status === "FAILED") return "bg-red-100 text-red-700";
    if (status === "PENDING") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  return (
    <MainLayout
      title="Notificacoes"
      subtitle="Consulta ao backend ao entrar na pagina e a cada 20 minutos."
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm">
                {unreadCount} pendente/falha{unreadCount === 1 ? "" : "s"}
              </span>
              {lastFetchAt ? (
                <span className="text-xs text-muted-foreground">
                  (Atualizado em {formatDate(lastFetchAt)})
                </span>
              ) : null}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationsFilters filters={filters} onChange={setFilters} onApply={applyFilters} />
          </CardContent>
        </Card>

        {error ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertTitle>Erro ao carregar notificacoes</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Lista</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleMarkAllAsRead} disabled={!notifications.length}>
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Marcar todas como lidas
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleClearAll()}
                  disabled={!notifications.length || loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar tudo
                </Button>
              </div>

              <NotificationsList
                items={notifications}
                loading={loading}
                hasMore={hasMore}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onLoadMore={loadMore}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selected ? (
                <p className="text-sm text-muted-foreground">
                  Selecione uma notificacao para visualizar os detalhes.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadgeClass(selected.status)}>{selected.status}</Badge>
                    <span className="text-xs text-muted-foreground">{selected.channel || "Notificacao"}</span>
                  </div>
                  <p className="font-semibold text-lg">{selected.channel || "Notificacao"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(selected.sentAt || selected.createdAt)}
                  </p>
                  <p className="text-sm text-foreground">{selected.message}</p>
                  <p className="text-xs text-muted-foreground">Destino: {selected.destination || "-"}</p>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => void handleRemoveSelected()}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover notificacao
                  </Button>
                  {selected.errorMessage ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                      {selected.errorMessage}
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
