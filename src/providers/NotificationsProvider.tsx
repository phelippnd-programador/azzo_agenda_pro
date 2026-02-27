import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationsStore } from "@/stores/notifications";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

export function NotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const startPolling = useNotificationsStore((state) => state.startPolling);
  const stopPolling = useNotificationsStore((state) => state.stopPolling);
  const isPublicBookingRoute =
    pathname === "/agendar" || pathname.startsWith("/agendar/");

  useEffect(() => {
    if (!isAuthenticated || isPublicBookingRoute) {
      stopPolling();
      return;
    }

    startPolling();
    return () => {
      stopPolling();
    };
  }, [isAuthenticated, isPublicBookingRoute, startPolling, stopPolling]);

  return <>{children}</>;
}
