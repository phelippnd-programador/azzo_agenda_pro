export type NotificationStatus = "FAILED" | "SENT" | "PENDING";
export type NotificationChannel = string;

export interface AppNotification {
  id: string;
  tenantId: string;
  appointmentId: string | null;
  channel: string;
  destination: string | null;
  message: string;
  status: NotificationStatus;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface NotificationsFilters {
  status?: NotificationStatus;
  channel?: string;
  failedOnly?: boolean;
  limit?: number;
}

export interface NotificationsCursor {
  cursorCreatedAt?: string;
  cursorId?: string;
}

export interface NotificationsListResponse {
  items: AppNotification[];
  hasMore: boolean;
  nextCursorCreatedAt: string | null;
  nextCursorId: string | null;
}

// Compatibilidade com componentes antigos.
export type NotificationItem = AppNotification;
