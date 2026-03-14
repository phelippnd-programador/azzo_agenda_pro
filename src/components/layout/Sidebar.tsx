import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuPermissions } from "@/contexts/MenuPermissionsContext";
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Tag,
  UserCircle,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ExternalLink,
  Building2,
  Receipt,
  FileText,
  Calculator,
  Eye,
  CreditCard,
  BarChart3,
  ShieldCheck,
  FileSearch,
  Boxes,
  ChevronDown,
  MessageCircleMore,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import type { CurrentMenuPermissionItem } from "@/types/menu-permissions";

const MENU_REGISTRY = {
  "/dashboard": { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  "/notificacoes": { icon: Bell, label: "Notificacoes", path: "/notificacoes" },
  "/agenda": { icon: Calendar, label: "Agenda", path: "/agenda" },
  "/servicos": { icon: Scissors, label: "Servicos", path: "/servicos" },
  "/especialidades": { icon: Tag, label: "Especialidades", path: "/especialidades" },
  "/profissionais": { icon: Users, label: "Profissionais", path: "/profissionais" },
  "/clientes": { icon: UserCircle, label: "Clientes", path: "/clientes" },
  "/sugestoes": { icon: Lightbulb, label: "Sugestoes", path: "/sugestoes" },
  "/chat": { icon: MessageCircleMore, label: "Chat", path: "/chat" },
  "/estoque": { icon: Boxes, label: "Estoque", path: "/estoque" },
  "/financeiro": { icon: DollarSign, label: "Resumo Financeiro", path: "/financeiro" },
  "/financeiro/comissoes": {
    icon: Receipt,
    label: "Comissoes",
    path: "/financeiro/comissoes",
  },
  "/financeiro/profissionais": {
    icon: BarChart3,
    label: "Financeiro Profissionais",
    path: "/financeiro/profissionais",
  },
  "/financeiro/licenca": {
    icon: CreditCard,
    label: "Plano",
    path: "/financeiro/licenca",
  },
  "/auditoria": { icon: ShieldCheck, label: "Auditoria", path: "/auditoria" },
  "/auditoria/lgpd": { icon: FileSearch, label: "LGPD Titulares", path: "/auditoria/lgpd" },
  "/configuracoes/admin-sistema": {
    icon: ShieldCheck,
    label: "Admin Sistema",
    path: "/configuracoes/admin-sistema",
  },
  "/emitir-nota": { icon: FileText, label: "Emitir Nota Fiscal", path: "/emitir-nota" },
  "/nota-fiscal": { icon: Eye, label: "Pre-visualizacao de NF", path: "/nota-fiscal" },
  "/apuracao-mensal": { icon: Calculator, label: "Apuracao Mensal", path: "/apuracao-mensal" },
  "/configuracoes": { icon: Settings, label: "Configuracoes", path: "/configuracoes" },
  "/perfil-salao": { icon: Building2, label: "Perfil do Salao", path: "/perfil-salao" },
} as const;

const MAIN_MENU_ORDER = [
  "/dashboard",
  "/notificacoes",
  "/agenda",
  "/servicos",
  "/especialidades",
  "/profissionais",
  "/clientes",
  "/sugestoes",
  "/chat",
  "/estoque",
  "/financeiro",
  "/financeiro/comissoes",
  "/financeiro/profissionais",
  "/financeiro/licenca",
  "/auditoria",
  "/auditoria/lgpd",
  "/configuracoes/admin-sistema",
  "/emitir-nota",
  "/nota-fiscal",
  "/apuracao-mensal",
] as const;

const ICON_REGISTRY: Record<string, LucideIcon> = {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Tag,
  UserCircle,
  DollarSign,
  Settings,
  Bell,
  Building2,
  Receipt,
  FileText,
  Calculator,
  Eye,
  CreditCard,
  BarChart3,
  ShieldCheck,
  FileSearch,
  Boxes,
  MessageCircleMore,
  Lightbulb,
};

interface SidebarProps {
  isMobileOpen: boolean;
  onToggleMobile: () => void;
  isDesktopOpen: boolean;
}

type MenuItem = (typeof MENU_REGISTRY)[keyof typeof MENU_REGISTRY];
type DynamicMenuNode = {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  children: DynamicMenuNode[];
};

const DYNAMIC_BOTTOM_ROUTES = new Set(["/perfil-salao", "/configuracoes"]);
const HIDDEN_MENU_ROUTES = new Set(["/unauthorized"]);

function sortMenuNodes<T extends { displayOrder?: number; label?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const orderDelta = Number(left.displayOrder || 0) - Number(right.displayOrder || 0);
    if (orderDelta !== 0) return orderDelta;
    return String(left.label || "").localeCompare(String(right.label || ""), "pt-BR");
  });
}

function resolveMenuIcon(item: CurrentMenuPermissionItem): LucideIcon {
  if (item.iconKey && ICON_REGISTRY[item.iconKey]) return ICON_REGISTRY[item.iconKey];
  return MENU_REGISTRY[item.route as keyof typeof MENU_REGISTRY]?.icon ?? Settings;
}

export function Sidebar({ isMobileOpen, onToggleMobile, isDesktopOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { allowedRoutes, menuItems } = useMenuPermissions();
  const allowedSet = new Set(allowedRoutes ?? []);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const dynamicMenuNodes = useMemo<DynamicMenuNode[] | null>(() => {
    if (!menuItems || menuItems.length === 0) return null;
    const visibleItems = menuItems.filter(
      (item) =>
        item.active &&
        item.route &&
        !item.route.includes(":") &&
        !DYNAMIC_BOTTOM_ROUTES.has(item.route) &&
        !HIDDEN_MENU_ROUTES.has(item.route)
    );
    const byId = new Map(visibleItems.map((item) => [item.id, item]));
    const includedIds = new Set<string>();

    visibleItems.forEach((item) => {
      if (!allowedSet.has(item.route)) return;
      includedIds.add(item.id);
      let currentParentId = item.parentId || null;
      while (currentParentId) {
        const parent = byId.get(currentParentId);
        if (!parent) break;
        includedIds.add(parent.id);
        currentParentId = parent.parentId || null;
      }
    });

    if (includedIds.size === 0) return [];

    const nodeMap = new Map<string, DynamicMenuNode>();
    includedIds.forEach((id) => {
      const item = byId.get(id);
      if (!item) return;
      nodeMap.set(id, {
        id: item.id,
        path: item.route,
        label: item.label || MENU_REGISTRY[item.route as keyof typeof MENU_REGISTRY]?.label || item.route,
        icon: resolveMenuIcon(item),
        children: [],
      });
    });

    const roots: Array<DynamicMenuNode & { displayOrder?: number }> = [];
    sortMenuNodes(
      visibleItems.filter((item) => includedIds.has(item.id))
    ).forEach((item) => {
      const node = nodeMap.get(item.id);
      if (!node) return;
      const parent = item.parentId ? nodeMap.get(item.parentId) : null;
      if (parent) {
        parent.children.push(node);
        parent.children = sortMenuNodes(
          parent.children.map((child) => ({
            ...child,
            displayOrder: visibleItems.find((candidate) => candidate.id === child.id)?.displayOrder,
          }))
        ).map(({ displayOrder: _, ...child }) => child);
      } else {
        roots.push({ ...node, displayOrder: item.displayOrder });
      }
    });

    return sortMenuNodes(roots).map(({ displayOrder: _, ...node }) => node);
  }, [allowedSet, menuItems]);

  const visibleMenuEntries = useMemo(() => {
    if (dynamicMenuNodes) return dynamicMenuNodes;
    const financialGroupPaths = [
      "/financeiro",
      "/financeiro/comissoes",
      "/financeiro/profissionais",
    ] as const;
    const financialItems = financialGroupPaths
      .filter((route) => allowedSet.has(route))
      .map((route) => MENU_REGISTRY[route]);

    const entries: DynamicMenuNode[] = [];
    MAIN_MENU_ORDER.forEach((route) => {
      if (financialGroupPaths.includes(route)) return;
      if (route === "/auditoria/lgpd") {
        if (!allowedSet.has("/auditoria") && !allowedSet.has("/auditoria/lgpd")) return;
      } else if (!allowedSet.has(route)) {
        return;
      }
      const item = MENU_REGISTRY[route];
      entries.push({
        id: item.path,
        path: item.path,
        label: item.label,
        icon: item.icon,
        children: [],
      });
    });

    if (financialItems.length > 0) {
      const financeInsertIndex = entries.findIndex((entry) => entry.path === "/auditoria");
      const financialGroup: DynamicMenuNode = {
        id: "financeiro",
        path: "/financeiro",
        label: "Financeiro",
        icon: DollarSign,
        children: financialItems.map((item) => ({
          id: item.path,
          path: item.path,
          label: item.label,
          icon: item.icon,
          children: [],
        })),
      };
      if (financeInsertIndex >= 0) entries.splice(financeInsertIndex, 0, financialGroup);
      else entries.push(financialGroup);
    }

    return entries;
  }, [allowedSet, dynamicMenuNodes]);
  const [salonSlug, setSalonSlug] = useState("meu-salao");

  useEffect(() => {
    const matchingGroup = visibleMenuEntries.find((entry) =>
      entry.children.some(
        (child) =>
          location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
      )
    );
    if (!matchingGroup) return;
    setExpandedGroups((prev) => (prev[matchingGroup.id] ? prev : { ...prev, [matchingGroup.id]: true }));
  }, [location.pathname, visibleMenuEntries]);

  useEffect(() => {
    const cachedSlug = localStorage.getItem("salon_public_slug");
    if (cachedSlug?.trim()) {
      setSalonSlug(cachedSlug.trim());
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-60 bg-sidebar border-r border-sidebar-border shadow-sm transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isDesktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Scissors className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">Azzo</span>
                <span className="text-xs font-medium text-muted-foreground truncate">Agenda Pro</span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0 h-7 w-7"
              onClick={onToggleMobile}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 py-3">
            <nav className="px-2 space-y-0.5">
              {visibleMenuEntries.map((entry) => {
                if (entry.children.length === 0) {
                  const isLgpdSubPage = location.pathname.startsWith("/auditoria/lgpd");
                  const isActive =
                    (location.pathname === entry.path ||
                      location.pathname.startsWith(`${entry.path}/`)) &&
                    !(entry.path === "/auditoria" && isLgpdSubPage);
                  return (
                    <Link
                      key={entry.path}
                      to={entry.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onToggleMobile();
                      }}
                    >
                      <div
                        className={cn(
                          "relative flex items-center gap-2.5 h-9 px-3 rounded-md text-sm cursor-pointer select-none transition-colors",
                          isActive
                            ? "bg-primary/8 text-primary font-medium"
                            : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                        )}
                        <entry.icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                        <span className="truncate">{entry.label}</span>
                      </div>
                    </Link>
                  );
                }

                const isOpen = expandedGroups[entry.id] ?? false;
                const activeChildPath =
                  entry.children
                    .filter(
                      (item) =>
                        location.pathname === item.path ||
                        location.pathname.startsWith(`${item.path}/`)
                    )
                    .sort((left, right) => right.path.length - left.path.length)[0]?.path ?? null;
                const isGroupActive = Boolean(activeChildPath);
                const parentIsAccessible = allowedSet.has(entry.path);

                return (
                  <div key={entry.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedGroups((prev) => ({ ...prev, [entry.id]: !isOpen }))
                      }
                      className={cn(
                        "w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-sm cursor-pointer select-none transition-colors",
                        isGroupActive
                          ? "text-primary font-medium"
                          : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      >
                      <entry.icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                      <span className="truncate flex-1 text-left">{entry.label}</span>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 opacity-60 transition-transform duration-200",
                          isOpen ? "rotate-180" : "rotate-0"
                        )}
                      />
                    </button>
                    {isOpen ? (
                      <div className="ml-3 pl-3 border-l border-border space-y-0.5 py-0.5">
                        {parentIsAccessible ? (
                          <Link
                            key={`${entry.path}-overview`}
                            to={entry.path}
                            onClick={() => {
                              if (window.innerWidth < 1024) onToggleMobile();
                            }}
                          >
                            <div
                              className={cn(
                                "flex items-center gap-2.5 h-8 px-2.5 rounded-md text-sm cursor-pointer select-none transition-colors",
                                location.pathname === entry.path
                                  ? "bg-primary/8 text-primary font-medium"
                                  : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <entry.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
                              <span className="truncate">{entry.label}</span>
                            </div>
                          </Link>
                        ) : null}
                        {entry.children.map((item) => {
                          const isChildActive = activeChildPath === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => {
                                if (window.innerWidth < 1024) onToggleMobile();
                              }}
                            >
                              <div
                                className={cn(
                                  "flex items-center gap-2.5 h-8 px-2.5 rounded-md text-sm cursor-pointer select-none transition-colors",
                                  isChildActive
                                    ? "bg-primary/8 text-primary font-medium"
                                    : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                              >
                                <item.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
                                <span className="truncate">{item.label}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            {/* Public booking link */}
            <div className="px-2 mt-4">
              <Link to={`/agendar/${salonSlug}`}>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                  <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-70" />
                  <span className="truncate">Página pública</span>
                </div>
              </Link>
            </div>
          </ScrollArea>

          {/* Bottom nav */}
          <div className="px-2 pb-3 pt-2 border-t border-sidebar-border space-y-0.5">
            {allowedSet.has("/perfil-salao") && (
              <Link
                to="/perfil-salao"
                onClick={() => {
                  if (window.innerWidth < 1024) onToggleMobile();
                }}
              >
                <div
                  className={cn(
                    "flex items-center gap-2.5 h-9 px-3 rounded-md text-sm cursor-pointer select-none transition-colors",
                    location.pathname === "/perfil-salao"
                      ? "bg-primary/8 text-primary font-medium"
                      : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Building2 className="w-4 h-4 flex-shrink-0 opacity-80" />
                  <span className="truncate">Perfil do Salão</span>
                </div>
              </Link>
            )}
            {allowedSet.has("/configuracoes") && (
              <Link
                to="/configuracoes"
                onClick={() => {
                  if (window.innerWidth < 1024) onToggleMobile();
                }}
              >
                <div
                  className={cn(
                    "flex items-center gap-2.5 h-9 px-3 rounded-md text-sm cursor-pointer select-none transition-colors",
                    location.pathname === "/configuracoes"
                      ? "bg-primary/8 text-primary font-medium"
                      : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Settings className="w-4 h-4 flex-shrink-0 opacity-80" />
                  <span className="truncate">Configurações</span>
                </div>
              </Link>
            )}
            <button
              type="button"
              className="w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <button
        type="button"
        className="fixed top-3 left-3 z-30 lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm hover:bg-accent transition-colors"
        onClick={onToggleMobile}
        aria-label="Abrir menu"
      >
        <Menu className="w-4 h-4" />
      </button>
    </>
  );
}
