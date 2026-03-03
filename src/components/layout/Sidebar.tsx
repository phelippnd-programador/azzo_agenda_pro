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
} from "lucide-react";

const MENU_REGISTRY = {
  "/dashboard": { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  "/notificacoes": { icon: Bell, label: "Notificacoes", path: "/notificacoes" },
  "/agenda": { icon: Calendar, label: "Agenda", path: "/agenda" },
  "/servicos": { icon: Scissors, label: "Servicos", path: "/servicos" },
  "/especialidades": { icon: Tag, label: "Especialidades", path: "/especialidades" },
  "/profissionais": { icon: Users, label: "Profissionais", path: "/profissionais" },
  "/clientes": { icon: UserCircle, label: "Clientes", path: "/clientes" },
  "/estoque": { icon: Boxes, label: "Estoque", path: "/estoque" },
  "/financeiro": { icon: DollarSign, label: "Resumo Financeiro", path: "/financeiro" },
  "/financeiro/profissionais": {
    icon: BarChart3,
    label: "Financeiro Profissionais",
    path: "/financeiro/profissionais",
  },
  "/financeiro/licenca": {
    icon: CreditCard,
    label: "Assinatura e Licenca",
    path: "/financeiro/licenca",
  },
  "/auditoria": { icon: ShieldCheck, label: "Auditoria", path: "/auditoria" },
  "/auditoria/lgpd": { icon: FileSearch, label: "LGPD Titulares", path: "/auditoria/lgpd" },
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
  "/estoque",
  "/financeiro",
  "/financeiro/profissionais",
  "/financeiro/licenca",
  "/auditoria",
  "/auditoria/lgpd",
  "/emitir-nota",
  "/nota-fiscal",
  "/apuracao-mensal",
] as const;

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

type MenuItem = (typeof MENU_REGISTRY)[keyof typeof MENU_REGISTRY];
type VisibleMenuEntry =
  | { type: "item"; item: MenuItem }
  | { type: "group"; key: string; label: string; icon: MenuItem["icon"]; items: MenuItem[] };

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
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
      "/financeiro/licenca",
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
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 sm:w-72 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground truncate">
                Azzo
              </span>
              <span className="text-xs sm:text-sm font-medium text-primary truncate">
                Agenda Pro
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0"
              onClick={onToggle}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 py-4">
            <nav className="px-2 sm:px-3 space-y-1">
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
                        if (window.innerWidth < 1024) onToggle();
                      }}
                    >
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-10 sm:h-11 text-sm",
                          isActive && "bg-primary/10 text-primary hover:bg-primary/10"
                        )}
                      >
                        <entry.item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="truncate">{entry.item.label}</span>
                      </Button>
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
                  <div key={entry.key} className="space-y-1">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setExpandedGroups((prev) => ({ ...prev, [entry.key]: !isOpen }))
                      }
                      className={cn(
                        "w-full justify-start gap-3 h-10 sm:h-11 text-sm",
                        isGroupActive && "text-primary"
                      )}
                    >
                      <entry.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{entry.label}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          isOpen ? "rotate-180" : "rotate-0"
                        )}
                      />
                    </Button>
                    {isOpen ? (
                      <div className="ml-4 border-l border-border pl-2 space-y-1">
                        {entry.items.map((item) => {
                          const isChildActive = activeChildPath === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => {
                                if (window.innerWidth < 1024) onToggle();
                              }}
                            >
                              <Button
                                variant={isChildActive ? "secondary" : "ghost"}
                                className={cn(
                                  "w-full justify-start gap-3 h-9 text-sm",
                                  isChildActive &&
                                    "bg-primary/10 text-primary hover:bg-primary/10"
                                )}
                              >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </Button>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <div className="px-2 sm:px-3 mt-6">
              <div className="p-3 sm:p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                  Link de Agendamento
                </p>
                <Link to={`/agendar/${salonSlug}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/10 text-xs sm:text-sm"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Ver pagina publica</span>
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollArea>

          <div className="p-2 sm:p-3 border-t border-border space-y-1">
            {allowedSet.has("/perfil-salao") && (
              <Link
                to="/perfil-salao"
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
              >
                <Button
                  variant={location.pathname === "/perfil-salao" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10 sm:h-11 text-sm",
                    location.pathname === "/perfil-salao" &&
                      "bg-primary/10 text-primary hover:bg-primary/10"
                  )}
                >
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">Perfil do Salao</span>
                </Button>
              </Link>
            )}
            {allowedSet.has("/configuracoes") && (
              <Link
                to="/configuracoes"
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
              >
                <Button
                  variant={location.pathname === "/configuracoes" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10 sm:h-11 text-sm",
                    location.pathname === "/configuracoes" &&
                      "bg-primary/10 text-primary hover:bg-primary/10"
                  )}
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">Configuracoes</span>
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 sm:h-11 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      <Button
        variant="outline"
        size="icon"
        className="fixed top-3 left-3 z-30 lg:hidden h-9 w-9"
        onClick={onToggle}
      >
        <Menu className="w-4 h-4" />
      </Button>
    </>
  );
}
