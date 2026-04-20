import type {
  AppNotification,
  NotificationsCursor,
  NotificationsFilters,
  NotificationsListResponse,
} from "@/types/notification";
import { request } from "./core";

export const notificationsApi = {
  getAll: async (
    filters: NotificationsFilters = {},
    cursor?: NotificationsCursor
  ): Promise<NotificationsListResponse> => {
    const query = new URLSearchParams();
    if (filters.status) query.set("status", filters.status);
    if (filters.channel) query.set("channel", filters.channel);
    if (typeof filters.failedOnly === "boolean") {
      query.set("failedOnly", String(filters.failedOnly));
    }
    if (typeof filters.unreadOnly === "boolean") {
      query.set("unreadOnly", String(filters.unreadOnly));
    }
    const requestedLimit = filters.limit ?? 100;
    const normalizedLimit = Math.min(Math.max(requestedLimit, 1), 500);
    query.set("limit", String(normalizedLimit));

    if ((cursor?.cursorCreatedAt && !cursor.cursorId) || (!cursor?.cursorCreatedAt && cursor?.cursorId)) {
      throw new Error("Cursor invalido: cursorCreatedAt e cursorId devem ser enviados juntos.");
    }

    if (cursor?.cursorCreatedAt && cursor.cursorId) {
      query.set("cursorCreatedAt", cursor.cursorCreatedAt);
      query.set("cursorId", cursor.cursorId);
    }

    const response = await request<NotificationsListResponse | AppNotification[]>(
      `/notifications?${query.toString()}`
    );

    if (Array.isArray(response)) {
      return {
        items: response,
        hasMore: false,
        nextCursorCreatedAt: null,
        nextCursorId: null,
      };
    }

    return response;
  },
  deleteById: (id: string) =>
    request<void>(`/notifications/${id}`, {
      method: "DELETE",
    }),
  deleteAll: () =>
    request<void>("/notifications/all", {
      method: "DELETE",
    }),
  markAsViewed: (id: string) =>
    request<{ updated: boolean }>(`/notifications/${id}/viewed`, {
      method: "PATCH",
    }),
  markAllAsViewed: () =>
    request<{ updated: number }>("/notifications/viewed/all", {
      method: "PATCH",
    }),
};
