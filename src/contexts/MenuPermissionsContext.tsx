import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentMenuPermissions } from "@/services/menuPermissionsService";
import type { CurrentMenuPermissionItem } from "@/types/menu-permissions";

type MenuPermissionsContextValue = {
  role: string | null;
  allowedRoutes: string[] | null;
  menuItems: CurrentMenuPermissionItem[] | null;
  isLoading: boolean;
  isEnforced: boolean;
  canAccess: (path: string) => boolean;
  refreshPermissions: () => Promise<void>;
};

const MenuPermissionsContext = createContext<MenuPermissionsContextValue | undefined>(
  undefined
);

const ROUTE_ALIASES: Record<string, string> = {
  "/": "/dashboard",
  "/dashboard": "/dashboard",
  "/notifications": "/notificacoes",
  "/appointments": "/agenda",
  "/services": "/servicos",
  "/specialties": "/especialidades",
  "/professionals": "/profissionais",
  "/clients": "/clientes",
  "/suggestions": "/sugestoes",
  "/sugestoes": "/sugestoes",
  "/chat": "/chat",
  "/stock": "/estoque",
  "/inventory": "/estoque",
  "/estoque": "/estoque",
  "/financial": "/financeiro",
  "/finance": "/financeiro",
  "/audit": "/auditoria",
  "/auditoria": "/auditoria",
  "/settings": "/configuracoes",
  "/settings/stock": "/configuracoes/estoque",
  "/salon-profile": "/perfil-salao",
  "/tax-config": "/configuracoes/fiscal/impostos",
  "/tax-configs": "/configuracoes/fiscal/impostos",
  "/config-impostos": "/configuracoes/fiscal/impostos",
  "/configuracoes/fiscal": "/configuracoes/fiscal/impostos",
  "/estoque/configuracoes": "/configuracoes/estoque",
  "/invoices/preview": "/nota-fiscal",
  "/invoices/issue": "/emitir-nota",
  "/tax-monthly": "/apuracao-mensal",
  "/apuracao-mensal": "/apuracao-mensal",
  "/settings/integrations/whatsapp": "/configuracoes/integracoes/whatsapp",
};

const ALWAYS_ALLOWED_ROUTES = ["/unauthorized", "/financeiro/licenca"];
function normalizeRoute(route: string): string {
  const trimmed = route.trim();
  return ROUTE_ALIASES[trimmed] ?? trimmed;
}

function isSubRouteAllowed(path: string, allowedPath: string): boolean {
  if (allowedPath === "/") return path === "/";
  if (path === allowedPath) return true;
  if (allowedPath.includes(":")) {
    const escaped = allowedPath
      .split("/")
      .map((segment) =>
        segment.startsWith(":")
          ? "[^/]+"
          : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      )
      .join("/");
    return new RegExp(`^${escaped}$`).test(path);
  }
  return path.startsWith(`${allowedPath}/`);
}

export function MenuPermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [allowedRoutes, setAllowedRoutes] = useState<string[] | null>(null);
  const [menuItems, setMenuItems] = useState<CurrentMenuPermissionItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnforced, setIsEnforced] = useState(false);

  const refreshPermissions = useCallback(async () => {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const isPublicBookingRoute = pathname === "/agendar" || pathname.startsWith("/agendar/");

    if (isPublicBookingRoute) {
      setIsLoading(false);
      setIsEnforced(false);
      return;
    }

    if (!isAuthenticated) {
      setRole(null);
      setAllowedRoutes(null);
      setMenuItems(null);
      setIsEnforced(false);
      return;
    }

    if (String(user?.role || "").toUpperCase() === "ADMIN") {
      setRole("ADMIN");
      setAllowedRoutes(["/configuracoes/admin-sistema", "/financeiro/licenca", "/unauthorized"]);
      setMenuItems(null);
      setIsEnforced(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await getCurrentMenuPermissions();
      const normalizedRoutes = response.allowedRoutes
        .map(normalizeRoute)
        .filter(Boolean);

      setRole(response.role);
      setAllowedRoutes(normalizedRoutes);
      setMenuItems(response.items || []);
      setIsEnforced(true);
    } catch {
      // Modo seguro: se nao houver permissao previa, bloqueia acesso por padrao.
      // Se ja houver permissao carregada, preserva o ultimo estado valido.
      setAllowedRoutes((prev) => prev ?? []);
      setMenuItems((prev) => prev ?? []);
      setIsEnforced(true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const canAccess = useCallback(
    (path: string) => {
      if (ALWAYS_ALLOWED_ROUTES.includes(path)) return true;
      if (!isEnforced || !allowedRoutes) return false;
      return allowedRoutes.some((allowedPath) => isSubRouteAllowed(path, allowedPath));
    },
    [allowedRoutes, isEnforced]
  );

  const value = useMemo(
    () => ({
      role,
      allowedRoutes,
      menuItems,
      isLoading,
      isEnforced,
      canAccess,
      refreshPermissions,
    }),
    [role, allowedRoutes, menuItems, isLoading, isEnforced, canAccess, refreshPermissions]
  );

  return (
    <MenuPermissionsContext.Provider value={value}>
      {children}
    </MenuPermissionsContext.Provider>
  );
}

export function useMenuPermissions() {
  const context = useContext(MenuPermissionsContext);
  if (!context) {
    throw new Error("useMenuPermissions must be used within MenuPermissionsProvider");
  }
  return context;
}
