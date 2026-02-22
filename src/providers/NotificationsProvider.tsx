import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationsStore } from "@/stores/notifications";
import type { ReactNode } from "react";

export function NotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const startPolling = useNotificationsStore((state) => state.startPolling);
  const stopPolling = useNotificationsStore((state) => state.stopPolling);

  useEffect(() => {
    if (!isAuthenticated) {
      stopPolling();
      return;
    }

    startPolling();
    return () => {
      stopPolling();
    };
  }, [isAuthenticated, startPolling, stopPolling]);

  return <>{children}</>;
}
