import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppNotification } from "@/types/notification";

const STORAGE_KEY = "azzo_notifications";

const initialNotifications: AppNotification[] = [
  {
    id: "n1",
    title: "Novo agendamento",
    message: "Maria Oliveira agendou Corte Feminino para amanha as 10:00",
    createdAt: new Date().toISOString(),
    readAt: null,
  },
  {
    id: "n2",
    title: "Lembrete",
    message: "Voce tem 3 agendamentos pendentes de confirmacao",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    readAt: null,
  },
  {
    id: "n3",
    title: "Pagamento recebido",
    message: "Pix de R$ 180,00 recebido de Fernanda Lima",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    readAt: null,
  },
];

function readStorage(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialNotifications));
      return initialNotifications;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStorage(items: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setNotifications(readStorage());
  }, []);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notifications]
  );

  const unreadCount = useMemo(
    () => sortedNotifications.filter((item) => !item.readAt).length,
    [sortedNotifications]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((item) =>
        item.id === id && !item.readAt ? { ...item, readAt: new Date().toISOString() } : item
      );
      saveStorage(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const now = new Date().toISOString();
      const next = prev.map((item) => (item.readAt ? item : { ...item, readAt: now }));
      saveStorage(next);
      return next;
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveStorage(next);
      return next;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    saveStorage([]);
  }, []);

  return {
    notifications: sortedNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
  };
}
