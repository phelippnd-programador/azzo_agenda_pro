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
} from "lucide-react";

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
  "/financeiro/profissionais",
  "/financeiro/licenca",
  "/auditoria",
  "/auditoria/lgpd",
  "/configuracoes/admin-sistema",
  "/emitir-nota",
  "/nota-fiscal",
  "/apuracao-mensal",
] as const;

interface SidebarProps {
  isMobileOpen: boolean;
  onToggleMobile: () => void;
  isDesktopOpen: boolean;
}

type MenuItem = (typeof MENU_REGISTRY)[keyof typeof MENU_REGISTRY];
type VisibleMenuEntry =
  | { type: "item"; item: MenuItem }
  | { type: "group"; key: string; label: string; icon: MenuItem["icon"]; items: MenuItem[] };

export function Sidebar({ isMobileOpen, onToggleMobile, isDesktopOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { allowedRoutes } = useMenuPermissions();
  const allowedSet = new Set(allowedRoutes ?? []);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const visibleMenuEntries: VisibleMenuEntry[] = useMemo(() => {
    const financialGroupPaths = [
      "/financeiro",
      "/financeiro/profissionais",
    ] as const;
    const financialItems = financialGroupPaths
      .filter((route) => allowedSet.has(route))
      .map((route) => MENU_REGISTRY[route]);

    const entries: VisibleMenuEntry[] = [];
    MAIN_MENU_ORDER.forEach((route) => {
      if (financialGroupPaths.includes(route)) return;
      if (route === "/auditoria/lgpd") {
        if (!allowedSet.has("/auditoria") && !allowedSet.has("/auditoria/lgpd")) return;
      } else if (!allowedSet.has(route)) {
        return;
      }
      entries.push({ type: "item", item: MENU_REGISTRY[route] });
    });

    if (financialItems.length > 0) {
      const financeInsertIndex = entries.findIndex(
        (entry) => entry.type === "item" && entry.item.path === "/auditoria"
      );
      const financialGroup: VisibleMenuEntry = {
        type: "group",
        key: "financeiro",
        label: "Financeiro",
        icon: DollarSign,
        items: financialItems,
      };
      if (financeInsertIndex >= 0) entries.splice(financeInsertIndex, 0, financialGroup);
      else entries.push(financialGroup);
    }

    return entries;
  }, [allowedSet]);
  const [salonSlug, setSalonSlug] = useState("meu-salao");

  useEffect(() => {
    const shouldOpenFinanceGroup = location.pathname.startsWith("/financeiro");
    if (!shouldOpenFinanceGroup) return;
    setExpandedGroups((prev) => (prev.financeiro ? prev : { ...prev, financeiro: true }));
  }, [location.pathname]);

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
                if (entry.type === "item") {
                  const isLgpdSubPage = location.pathname.startsWith("/auditoria/lgpd");
                  const isActive =
                    (location.pathname === entry.item.path ||
                      location.pathname.startsWith(`${entry.item.path}/`)) &&
                    !(entry.item.path === "/auditoria" && isLgpdSubPage);
                  return (
                    <Link
                      key={entry.item.path}
                      to={entry.item.path}
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
                        <entry.item.icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                        <span className="truncate">{entry.item.label}</span>
                      </div>
                    </Link>
                  );
                }

                const isOpen = expandedGroups[entry.key] ?? location.pathname.startsWith("/financeiro");
                const activeChildPath =
                  entry.items
                    .filter(
                      (item) =>
                        location.pathname === item.path ||
                        location.pathname.startsWith(`${item.path}/`)
                    )
                    .sort((left, right) => right.path.length - left.path.length)[0]?.path ?? null;
                const isGroupActive = Boolean(activeChildPath);

                return (
                  <div key={entry.key} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedGroups((prev) => ({ ...prev, [entry.key]: !isOpen }))
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
                        {entry.items.map((item) => {
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
