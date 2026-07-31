import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Eye, RefreshCw, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageEmptyState } from "@/components/ui/page-states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { maskPhoneBr } from "@/lib/input-masks";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

const STATUS_LABELS: Record<string, string> = {
  FAILED: "Falhou",
  SENT: "Enviado",
  PENDING: "Pendente",
};

const CHANNEL_LABELS: Record<string, string> = {
  APPOINTMENT_CREATED: "Agendamento criado",
  WHATSAPP_REMINDER: "Lembrete WhatsApp",
  WHATSAPP_CONFIG_ALERT: "Alerta config. WhatsApp",
  WHATSAPP_DELIVERY_ERROR: "Falha entrega WhatsApp",
};

function maskDestination(value?: string | null) {
  if (!value) return "-";
  if (!/^[+\d\s()-]+$/.test(value)) return value;
  return maskPhoneBr(value, false);
}

const DEFAULT_FILTERS: NotificationFilters = {
  failedOnly: false,
  limit: 20,
};

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

  const [filters, setFilters] = useState<NotificationFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    const selectedFromUrl = searchParams.get("id");
    if (selectedFromUrl) {
      setSelectedId(selectedFromUrl);
      setIsDetailOpen(true);
      void markNotificationAsRead(selectedFromUrl);
    }
  }, [searchParams, markNotificationAsRead]);

  // Ao entrar na pagina de notificacoes, busca no backend.
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
    if (status === "FAILED") {
      return "border-red-300/80 bg-red-100 text-red-900 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-200";
    }
    if (status === "PENDING") {
      return "border-amber-300/80 bg-amber-100 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200";
    }
    return "bg-primary/10 text-primary border-primary/30";
  };

  const isUnread = (item: AppNotification) => !(item.viewed ?? Boolean(item.viewedAt));

  const openDetails = async (id: string) => {
    setSelectedId(id);
    setIsDetailOpen(true);
    await markNotificationAsRead(id);
  };

  const hasActiveFilters =
    Boolean(filters.status || filters.channel || filters.failedOnly || filters.unreadOnly) ||
    (filters.limit ?? DEFAULT_FILTERS.limit) !== DEFAULT_FILTERS.limit;

  const resetFilters = async () => {
    setFilters(DEFAULT_FILTERS);
    await fetchAll(DEFAULT_FILTERS);
  };

  return (
    <MainLayout
      title="Notificações"
      subtitle="Consulta ao backend ao entrar na página e a cada 20 minutos."
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm">
                {unreadCount} não visualizada{unreadCount === 1 ? "" : "s"}
              </span>
              {lastFetchAt ? (
                <span className="text-xs text-muted-foreground">
                  (Atualizado em {formatDate(lastFetchAt)})
                </span>
              ) : null}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
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
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar notificações</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Lista de notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void handleMarkAllAsRead()} disabled={!notifications.length || unreadCount === 0}>
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
              <p className="text-sm text-muted-foreground">Carregando notificações...</p>
            ) : !notifications.length ? (
              <PageEmptyState
                title={hasActiveFilters ? "Nenhuma notificação para estes filtros" : "Nenhuma notificação encontrada"}
                description={
                  hasActiveFilters
                    ? "Os filtros atuais esconderam todos os resultados. Limpe os filtros para voltar a ver a fila completa."
                    : "Quando o sistema gerar avisos, lembretes ou falhas de entrega, eles aparecerão aqui."
                }
                action={
                  hasActiveFilters
                    ? {
                        label: "Limpar filtros",
                        onClick: () => void resetFilters(),
                      }
                    : {
                        label: "Atualizar lista",
                        onClick: () => void handleRefresh(),
                        variant: "outline",
                      }
                }
              />
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {notifications.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-xl border border-border/70 p-4 shadow-sm ${isUnread(item) ? "bg-primary/5" : "bg-card"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {isUnread(item) ? <span className="inline-block h-2 w-2 rounded-full bg-primary" /> : null}
                            <p className="truncate text-sm font-medium text-foreground">
                              {CHANNEL_LABELS[item.channel] ?? item.channel ?? "-"}
                            </p>
                            {isUnread(item) ? (
                              <Badge className="border-primary/30 bg-primary/10 text-primary">Nova</Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDate(item.sentAt || item.createdAt)}</p>
                          <p className="text-sm text-muted-foreground">{item.message}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
                          aria-label="Ver detalhe da notificação"
                          onClick={() => void openDetails(item.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className={getStatusBadgeClass(item.status)}>
                          {STATUS_LABELS[item.status] ?? item.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Destino: {maskDestination(item.destination)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-36 whitespace-nowrap">Data</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead className="text-right">Detalhe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((item) => (
                        <TableRow
                          key={item.id}
                          className={isUnread(item) ? "bg-primary/5" : undefined}
                        >
                          <TableCell className="whitespace-nowrap">{formatDate(item.sentAt || item.createdAt)}</TableCell>
                          <TableCell>{CHANNEL_LABELS[item.channel] ?? item.channel ?? "-"}</TableCell>
                          <TableCell className="max-w-[360px]">
                            <div className="flex min-w-0 items-center gap-2">
                              {isUnread(item) ? <span className="h-2 w-2 rounded-full bg-primary inline-block" /> : null}
                              <span className="min-w-0 flex-1 truncate">{item.message}</span>
                              {isUnread(item) ? (
                                <Badge className="bg-primary/10 text-primary border-primary/30">Nova</Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(item.status)}>{STATUS_LABELS[item.status] ?? item.status}</Badge>
                          </TableCell>
                          <TableCell>{maskDestination(item.destination)}</TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="text-primary hover:bg-primary/10 hover:text-primary"
                                    aria-label="Ver detalhe da notificação"
                                    onClick={() => void openDetails(item.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalhe</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
            <DialogTitle>Detalhes da notificação</DialogTitle>
            <DialogDescription>Dados completos da notificação selecionada.</DialogDescription>
          </DialogHeader>

          {!selected ? (
            <p className="text-sm text-muted-foreground">Selecione uma notificação para visualizar os detalhes.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadgeClass(selected.status)}>{selected.status}</Badge>
                <span className="text-xs text-muted-foreground">{selected.channel || "Notificação"}</span>
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
                Remover notificação
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!notificationToDelete}
        isLoading={isDeletingNotification}
        title="Remover notificação?"
        description="Tem certeza que deseja remover esta notificação? Esta ação não pode ser desfeita."
        onOpenChange={(open) => {
          if (isDeletingNotification) return;
          if (!open) setNotificationToDelete(null);
        }}
        onConfirm={handleRemoveNotification}
      />

      <DeleteConfirmationDialog
        open={isClearAllDialogOpen}
        isLoading={isClearingAll}
        title="Limpar todas as notificações?"
        description="Tem certeza que deseja limpar todas as notificações? Esta ação não pode ser desfeita."
        onOpenChange={(open) => {
          if (isClearingAll) return;
          setIsClearAllDialogOpen(open);
        }}
        onConfirm={handleClearAll}
      />
    </MainLayout>
  );
}
