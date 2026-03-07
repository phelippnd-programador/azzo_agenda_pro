import { useNotificationsStore } from "@/stores/notifications";
import type { NotificationsFilters } from "@/types/notification";

export function useNotifications() {
  const notifications = useNotificationsStore((state) => state.items);
  const summaryItems = useNotificationsStore((state) => state.summaryItems);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const hasMore = useNotificationsStore((state) => state.hasMore);
  const nextCursorCreatedAt = useNotificationsStore((state) => state.nextCursorCreatedAt);
  const nextCursorId = useNotificationsStore((state) => state.nextCursorId);
  const lastFetchAt = useNotificationsStore((state) => state.lastFetchAt);
  const loading = useNotificationsStore((state) => state.loading);
  const error = useNotificationsStore((state) => state.error);
  const currentFilters = useNotificationsStore((state) => state.currentFilters);
  const refreshSummary = useNotificationsStore((state) => state.refreshSummary);
  const fetchAll = useNotificationsStore((state) => state.fetchAll);
  const fetchNextPage = useNotificationsStore((state) => state.fetchNextPage);
  const removeNotification = useNotificationsStore((state) => state.removeNotification);
  const clearAllNotifications = useNotificationsStore((state) => state.clearAllNotifications);
  const markNotificationAsRead = useNotificationsStore((state) => state.markNotificationAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const startPolling = useNotificationsStore((state) => state.startPolling);
  const stopPolling = useNotificationsStore((state) => state.stopPolling);

  return {
    notifications,
    summaryItems,
    unreadCount,
    hasMore,
    nextCursorCreatedAt,
    nextCursorId,
    lastFetchAt,
    loading,
    error,
    currentFilters,
    refreshSummary,
    fetchAll: (filters?: NotificationsFilters) => fetchAll(filters),
    fetchNextPage,
    removeNotification,
    clearAllNotifications,
    markNotificationAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
  };
}
