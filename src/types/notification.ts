export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
}
