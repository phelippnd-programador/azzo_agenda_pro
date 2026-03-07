import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Eye, RefreshCw, Trash2 } from "lucide-react";
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
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import type { NotificationsFilters as NotificationFilters } from "@/types/notification";
import type { AppNotification } from "@/types/notification";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    markNotificationAsRead,
    markAllAsRead,
  } = useNotifications();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [isDeletingNotification, setIsDeletingNotification] = useState(false);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const [filters, setFilters] = useState<NotificationFilters>({
    failedOnly: false,
    limit: 20,
  });

  useEffect(() => {
    const selectedFromUrl = searchParams.get("id");
    if (selectedFromUrl) {
      setSelectedId(selectedFromUrl);
      setIsDetailOpen(true);
      void markNotificationAsRead(selectedFromUrl);
    }
  }, [searchParams, markNotificationAsRead]);

  // Ao entrar na pagina de notificacao, busca no backend.
  useEffect(() => {
    void fetchAll(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = async () => {
    if (isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await fetchAll(filters);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const loadMore = async () => {
    await fetchNextPage();
  };

  const handleRefresh = async () => {
    await fetchAll(currentFilters);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      const cleared = await clearAllNotifications();
      if (cleared) {
        setSelectedId(null);
      }
      setIsClearAllDialogOpen(false);
    } finally {
      setIsClearingAll(false);
    }
  };

  const openRemoveDialog = (notificationId: string | null) => {
    if (!notificationId) return;
    setNotificationToDelete(notificationId);
  };

  const handleRemoveNotification = async () => {
    if (!notificationToDelete) return;
    setIsDeletingNotification(true);
    try {
      const removed = await removeNotification(notificationToDelete);
      if (removed) {
        setSelectedId(null);
        setIsDetailOpen(false);
      }
      setNotificationToDelete(null);
    } finally {
      setIsDeletingNotification(false);
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

  const isUnread = (item: AppNotification) => !(item.viewed ?? Boolean(item.viewedAt));

  const openDetails = async (id: string) => {
    setSelectedId(id);
    setIsDetailOpen(true);
    await markNotificationAsRead(id);
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
                {unreadCount} nao visualizada{unreadCount === 1 ? "" : "s"}
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
            <NotificationsFilters
              filters={filters}
              onChange={setFilters}
              onApply={applyFilters}
              isApplying={isApplyingFilters}
            />
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
              <Button variant="outline" onClick={() => void handleMarkAllAsRead()} disabled={!notifications.length}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Marcar todas como lidas
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsClearAllDialogOpen(true)}
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
                        <tr
                          key={item.id}
                          className={`border-b hover:bg-muted/40 ${isUnread(item) ? "bg-primary/5" : ""}`}
                        >
                          <td className="py-2">{formatDate(item.sentAt || item.createdAt)}</td>
                          <td className="py-2">{item.channel || "-"}</td>
                          <td className="py-2 max-w-[360px]">
                            <div className="flex items-center gap-2">
                              {isUnread(item) ? <span className="h-2 w-2 rounded-full bg-primary inline-block" /> : null}
                              <span className="truncate">{item.message}</span>
                              {isUnread(item) ? (
                                <Badge className="bg-primary/10 text-primary border-primary/30">Nova</Badge>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-2">
                            <Badge className={getStatusBadgeClass(item.status)}>{item.status}</Badge>
                          </td>
                          <td className="py-2">{item.destination || "-"}</td>
                          <td className="py-2 text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    aria-label="Ver detalhe da notificacao"
                                    onClick={() => void openDetails(item.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalhe</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
              <p><span className="font-medium">Visualizada em:</span> {selected.viewedAt ? formatDate(selected.viewedAt) : "-"}</p>
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
                onClick={() => openRemoveDialog(selected.id)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover notificacao
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!notificationToDelete}
        isLoading={isDeletingNotification}
        title="Remover notificacao?"
        description="Tem certeza que deseja remover esta notificacao? Esta acao nao pode ser desfeita."
        onOpenChange={(open) => {
          if (isDeletingNotification) return;
          if (!open) setNotificationToDelete(null);
        }}
        onConfirm={handleRemoveNotification}
      />

      <DeleteConfirmationDialog
        open={isClearAllDialogOpen}
        isLoading={isClearingAll}
        title="Limpar todas as notificacoes?"
        description="Tem certeza que deseja limpar todas as notificacoes? Esta acao nao pode ser desfeita."
        onOpenChange={(open) => {
          if (isClearingAll) return;
          setIsClearAllDialogOpen(open);
        }}
        onConfirm={handleClearAll}
      />
    </MainLayout>
  );
}
