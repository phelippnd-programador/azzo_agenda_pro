import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuPermissions } from "@/contexts/MenuPermissionsContext";
import { salonApi } from "@/lib/api";
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
} from "lucide-react";

const MENU_REGISTRY = {
  "/dashboard": { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  "/notificacoes": { icon: Bell, label: "Notificacoes", path: "/notificacoes" },
  "/agenda": { icon: Calendar, label: "Agenda", path: "/agenda" },
  "/servicos": { icon: Scissors, label: "Servicos", path: "/servicos" },
  "/especialidades": { icon: Tag, label: "Especialidades", path: "/especialidades" },
  "/profissionais": { icon: Users, label: "Profissionais", path: "/profissionais" },
  "/clientes": { icon: UserCircle, label: "Clientes", path: "/clientes" },
  "/financeiro": { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
  "/financeiro/profissionais": {
    icon: BarChart3,
    label: "Financeiro Profissionais",
    path: "/financeiro/profissionais",
  },
  "/financeiro/licenca": { icon: CreditCard, label: "Licenca", path: "/financeiro/licenca" },
  "/emitir-nota": { icon: FileText, label: "Emitir Nota Fiscal", path: "/emitir-nota" },
  "/nota-fiscal": { icon: Eye, label: "Pre-visualizacao de NF", path: "/nota-fiscal" },
  "/config-impostos": {
    icon: Receipt,
    label: "Configuracao de Impostos",
    path: "/config-impostos",
  },
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
  "/financeiro",
  "/financeiro/profissionais",
  "/financeiro/licenca",
  "/emitir-nota",
  "/nota-fiscal",
  "/config-impostos",
  "/apuracao-mensal",
] as const;

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { allowedRoutes } = useMenuPermissions();
  const allowedSet = new Set(allowedRoutes ?? []);
  const visibleMenuItems = MAIN_MENU_ORDER
    .filter((route) => allowedSet.has(route))
    .map((route) => MENU_REGISTRY[route]);
  const [salonSlug, setSalonSlug] = useState("meu-salao");

  useEffect(() => {
    let mounted = true;
    salonApi
      .getProfile()
      .then((profile) => {
        if (!mounted) return;
        if (profile.salonSlug) setSalonSlug(profile.salonSlug);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
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
              {visibleMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
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
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </Link>
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
