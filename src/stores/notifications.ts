import { create } from "zustand";
import { authApi, notificationsApi } from "@/lib/api";
import type { AppNotification, NotificationsFilters } from "@/types/notification";

const POLLING_MS = 20 * 60 * 1000;
const SUMMARY_LIMIT = 100;

let pollingInterval: number | null = null;
let pollingStarted = false;

type NotificationsStoreState = {
  items: AppNotification[];
  summaryItems: AppNotification[];
  unreadCount: number;
  lastFetchAt: string | null;
  loading: boolean;
  error: string | null;
  currentFilters: NotificationsFilters;
  hasMore: boolean;
  nextCursorCreatedAt: string | null;
  nextCursorId: string | null;
  refreshSummary: () => Promise<void>;
  fetchAll: (filters?: NotificationsFilters) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  removeNotification: (id: string) => Promise<boolean>;
  clearAllNotifications: () => void;
  markAllAsRead: () => void;
  startPolling: () => void;
  stopPolling: () => void;
};

function sortByNewest(items: AppNotification[]) {
  return [...items].sort((a, b) => {
    const left = new Date(a.createdAt || a.sentAt || 0).getTime();
    const right = new Date(b.createdAt || b.sentAt || 0).getTime();
    return right - left;
  });
}

function deriveUnreadCount(items: AppNotification[]) {
  // Sem read/unread na API: unread = PENDING + FAILED.
  return items.filter((item) => item.status === "PENDING" || item.status === "FAILED").length;
}

function withDerivedState(items: AppNotification[]) {
  const sorted = sortByNewest(items);
  return {
    items: sorted,
    summaryItems: sorted.slice(0, 5),
    unreadCount: deriveUnreadCount(sorted),
  };
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Erro ao carregar notificacoes";
}

function clearPolling() {
  if (pollingInterval === null || typeof window === "undefined") return;
  window.clearInterval(pollingInterval);
  pollingInterval = null;
}

export const useNotificationsStore = create<NotificationsStoreState>((set, get) => ({
  items: [],
  summaryItems: [],
  unreadCount: 0,
  lastFetchAt: null,
  loading: false,
  error: null,
  hasMore: true,
  nextCursorCreatedAt: null,
  nextCursorId: null,
  currentFilters: {
    failedOnly: false,
    limit: 100,
  },

  refreshSummary: async () => {
    if (!authApi.hasSession()) {
      set({
        items: [],
        summaryItems: [],
        unreadCount: 0,
        lastFetchAt: null,
        error: null,
        loading: false,
        hasMore: false,
        nextCursorCreatedAt: null,
        nextCursorId: null,
      });
      return;
    }

    try {
      set({ loading: true, error: null });
      const response = await notificationsApi.getAll({ limit: SUMMARY_LIMIT });
      const sorted = sortByNewest(response.items || []);
      set({
        summaryItems: sorted.slice(0, 5),
        unreadCount: deriveUnreadCount(sorted),
        lastFetchAt: new Date().toISOString(),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: normalizeErrorMessage(error),
      });
    }
  },

  fetchAll: async (filters = {}) => {
    if (!authApi.hasSession()) {
      set({
        items: [],
        summaryItems: [],
        unreadCount: 0,
        lastFetchAt: null,
        error: null,
        loading: false,
        hasMore: false,
        nextCursorCreatedAt: null,
        nextCursorId: null,
      });
      return;
    }

    const mergedFilters: NotificationsFilters = {
      ...get().currentFilters,
      ...filters,
    };

    if (mergedFilters.limit) {
      mergedFilters.limit = Math.min(Math.max(mergedFilters.limit, 1), 500);
    }

    try {
      set({
        loading: true,
        error: null,
        currentFilters: mergedFilters,
        hasMore: true,
        nextCursorCreatedAt: null,
        nextCursorId: null,
      });
      const response = await notificationsApi.getAll(mergedFilters);
      const sorted = sortByNewest(response.items || []);
      set({
        items: sorted,
        summaryItems: sorted.slice(0, 5),
        unreadCount: deriveUnreadCount(sorted),
        hasMore: response.hasMore,
        nextCursorCreatedAt: response.nextCursorCreatedAt,
        nextCursorId: response.nextCursorId,
        lastFetchAt: new Date().toISOString(),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: normalizeErrorMessage(error),
      });
    }
  },

  fetchNextPage: async () => {
    const state = get();
    if (!authApi.hasSession()) return;
    if (state.loading || !state.hasMore) return;

    if (!state.nextCursorCreatedAt || !state.nextCursorId) {
      set({ hasMore: false });
      return;
    }

    try {
      set({ loading: true, error: null });
      const response = await notificationsApi.getAll(state.currentFilters, {
        cursorCreatedAt: state.nextCursorCreatedAt,
        cursorId: state.nextCursorId,
      });

      const combined = [...state.items, ...(response.items || [])];
      const dedupedById = Array.from(
        new Map(combined.map((item) => [item.id, item])).values()
      );
      const sorted = sortByNewest(dedupedById);

      set({
        items: sorted,
        summaryItems: sorted.slice(0, 5),
        unreadCount: deriveUnreadCount(sorted),
        hasMore: response.hasMore,
        nextCursorCreatedAt: response.nextCursorCreatedAt,
        nextCursorId: response.nextCursorId,
        lastFetchAt: new Date().toISOString(),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: normalizeErrorMessage(error),
      });
    }
  },

  removeNotification: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await notificationsApi.deleteById(id);

      const remaining = get().items.filter((item) => item.id !== id);
      set({
        ...withDerivedState(remaining),
        loading: false,
        error: null,
      });
      return true;
    } catch (error) {
      set({
        loading: false,
        error: normalizeErrorMessage(error),
      });
      return false;
    }
  },

  clearAllNotifications: () => {
    set({
      items: [],
      summaryItems: [],
      unreadCount: 0,
      hasMore: false,
      nextCursorCreatedAt: null,
      nextCursorId: null,
      error: null,
    });
  },

  markAllAsRead: () => {
    // Como a API atual nao possui endpoint read/unread,
    // consideramos "lida" localmente mudando status PENDING/FAILED para SENT.
    const marked = get().items.map((item) =>
      item.status === "PENDING" || item.status === "FAILED"
        ? { ...item, status: "SENT" as const }
        : item
    );

    set({
      ...withDerivedState(marked),
      error: null,
    });
  },

  startPolling: () => {
    if (typeof window === "undefined" || pollingStarted) return;
    pollingStarted = true;
    clearPolling();

    pollingInterval = window.setInterval(() => {
      void get().refreshSummary();
    }, POLLING_MS);

    // Ao logar/iniciar provider, faz refresh imediato.
    void get().refreshSummary();
  },

  stopPolling: () => {
    pollingStarted = false;
    clearPolling();
  },
}));
