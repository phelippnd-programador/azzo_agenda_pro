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

type MenuPermissionsContextValue = {
  role: string | null;
  allowedRoutes: string[] | null;
  isLoading: boolean;
  isEnforced: boolean;
  canAccess: (path: string) => boolean;
  refreshPermissions: () => Promise<void>;
};

const MenuPermissionsContext = createContext<MenuPermissionsContextValue | undefined>(
  undefined
);

const ROUTE_ALIASES: Record<string, string> = {
  "/dashboard": "/",
  "/appointments": "/agenda",
  "/services": "/servicos",
  "/professionals": "/profissionais",
  "/clients": "/clientes",
  "/financial": "/financeiro",
  "/finance": "/financeiro",
  "/settings": "/configuracoes",
  "/salon-profile": "/perfil-salao",
  "/tax-config": "/config-impostos",
  "/tax-configs": "/config-impostos",
  "/invoices/preview": "/nota-fiscal",
  "/invoices/issue": "/emitir-nota",
  "/tax-monthly": "/apuracao-mensal",
  "/apuracao-mensal": "/apuracao-mensal",
  "/settings/integrations/whatsapp": "/configuracoes/integracoes/whatsapp",
};

const ALWAYS_ALLOWED_ROUTES = ["/unauthorized"];

function normalizeRoute(route: string): string {
  const trimmed = route.trim();
  return ROUTE_ALIASES[trimmed] ?? trimmed;
}

function isSubRouteAllowed(path: string, allowedPath: string): boolean {
  if (allowedPath === "/") return path === "/";
  if (path === allowedPath) return true;
  return path.startsWith(`${allowedPath}/`);
}

export function MenuPermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [allowedRoutes, setAllowedRoutes] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnforced, setIsEnforced] = useState(false);

  const refreshPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      setRole(null);
      setAllowedRoutes(null);
      setIsEnforced(false);
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
      setIsEnforced(true);
    } catch {
      // Fallback permissivo para não bloquear navegação por indisponibilidade do endpoint.
      setRole(null);
      setAllowedRoutes(null);
      setIsEnforced(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const canAccess = useCallback(
    (path: string) => {
      if (ALWAYS_ALLOWED_ROUTES.includes(path)) return true;
      if (!isEnforced || !allowedRoutes) return true;
      return allowedRoutes.some((allowedPath) => isSubRouteAllowed(path, allowedPath));
    },
    [allowedRoutes, isEnforced]
  );

  const value = useMemo(
    () => ({
      role,
      allowedRoutes,
      isLoading,
      isEnforced,
      canAccess,
      refreshPermissions,
    }),
    [role, allowedRoutes, isLoading, isEnforced, canAccess, refreshPermissions]
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
