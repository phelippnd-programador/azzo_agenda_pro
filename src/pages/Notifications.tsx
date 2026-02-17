import { useEffect, useMemo, useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";

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
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
  } = useNotifications();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const selectedFromUrl = searchParams.get("id");
    if (!selectedFromUrl) return;
    setSelectedId(selectedFromUrl);
    markAsRead(selectedFromUrl);
  }, [markAsRead, searchParams]);

  const selected = useMemo(
    () => notifications.find((item) => item.id === selectedId) ?? null,
    [notifications, selectedId]
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    markAsRead(id);
  };

  return (
    <MainLayout
      title="Notificacoes"
      subtitle="Visualize, marque como lida e remova suas notificacoes."
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-600" />
              <span className="text-sm">
                {unreadCount} nao lida{unreadCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
              <Button variant="outline" size="sm" onClick={clearNotifications}>
                Limpar tudo
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Lista</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!notifications.length ? (
                <p className="text-sm text-gray-500">Nenhuma notificacao encontrada.</p>
              ) : null}

              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-md border p-3 cursor-pointer ${
                    selectedId === item.id ? "border-violet-400 bg-violet-50" : "border-gray-200"
                  }`}
                  onClick={() => handleSelect(item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(item.createdAt)}</p>
                    </div>
                    {!item.readAt ? <Badge className="bg-pink-500">Nova</Badge> : null}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selected ? (
                <p className="text-sm text-gray-500">
                  Selecione uma notificacao para visualizar os detalhes.
                </p>
              ) : (
                <>
                  <p className="font-semibold">{selected.title}</p>
                  <p className="text-xs text-gray-500">{formatDate(selected.createdAt)}</p>
                  <p className="text-sm text-gray-700">{selected.message}</p>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        removeNotification(selected.id);
                        setSelectedId(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover notificacao
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
