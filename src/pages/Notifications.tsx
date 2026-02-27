import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, RefreshCw, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotificationsFilters } from "@/components/notifications/NotificationsFilters";
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

  const handleRemoveNotification = async (notificationId: string | null) => {
    if (!notificationId) return;
    const removed = await removeNotification(notificationId);
    if (removed) {
      setSelectedId(null);
      setIsDetailOpen(false);
    }
  };

  const selected = useMemo(
    () => notifications.find((item) => item.id === selectedId) ?? null,
    [notifications, selectedId]
  );

  const getStatusBadgeClass = (status?: AppNotification["status"]) => {
    if (status === "FAILED") return "bg-destructive/10 text-destructive border-destructive/30";
    if (status === "PENDING") return "bg-muted text-muted-foreground border-border";
    return "bg-primary/10 text-primary border-primary/30";
  };

  const openDetails = (id: string) => {
    setSelectedId(id);
    setIsDetailOpen(true);
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

        <Card>
          <CardHeader>
            <CardTitle>Lista de notificacoes</CardTitle>
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

            {loading && !notifications.length ? (
              <p className="text-sm text-muted-foreground">Carregando notificacoes...</p>
            ) : !notifications.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma notificacao encontrada.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2">Data</th>
                        <th className="py-2">Canal</th>
                        <th className="py-2">Mensagem</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Destino</th>
                        <th className="py-2 text-right">Detalhe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/40">
                          <td className="py-2">{formatDate(item.sentAt || item.createdAt)}</td>
                          <td className="py-2">{item.channel || "-"}</td>
                          <td className="py-2 max-w-[360px] truncate">{item.message}</td>
                          <td className="py-2">
                            <Badge className={getStatusBadgeClass(item.status)}>{item.status}</Badge>
                          </td>
                          <td className="py-2">{item.destination || "-"}</td>
                          <td className="py-2 text-right">
                            <Button size="sm" variant="outline" onClick={() => openDetails(item.id)}>
                              Ver detalhe
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" onClick={() => void loadMore()} disabled={loading || !hasMore}>
                  {loading ? "Carregando..." : hasMore ? "Carregar mais" : "Sem mais resultados"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da notificacao</DialogTitle>
            <DialogDescription>Dados completos da notificacao selecionada.</DialogDescription>
          </DialogHeader>

          {!selected ? (
            <p className="text-sm text-muted-foreground">Selecione uma notificacao para visualizar os detalhes.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadgeClass(selected.status)}>{selected.status}</Badge>
                <span className="text-xs text-muted-foreground">{selected.channel || "Notificacao"}</span>
              </div>
              <p><span className="font-medium">Criada em:</span> {formatDate(selected.createdAt)}</p>
              <p><span className="font-medium">Enviada em:</span> {selected.sentAt ? formatDate(selected.sentAt) : "-"}</p>
              <p><span className="font-medium">Destino:</span> {selected.destination || "-"}</p>
              <p><span className="font-medium">Mensagem:</span> {selected.message}</p>
              <p><span className="font-medium">ID:</span> <span className="font-mono text-xs">{selected.id}</span></p>

              {selected.errorMessage ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro de envio</AlertTitle>
                  <AlertDescription>{selected.errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void handleRemoveNotification(selected.id)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover notificacao
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
