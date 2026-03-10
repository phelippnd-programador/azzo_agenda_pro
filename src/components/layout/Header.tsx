import { Bell, CreditCard, LogOut, PanelLeft, Search, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggleDesktopSidebar?: () => void;
  isDesktopSidebarOpen?: boolean;
}

export function Header({
  title,
  subtitle,
  onToggleDesktopSidebar,
  isDesktopSidebarOpen = true,
}: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { summaryItems, unreadCount, refreshSummary } = useNotifications();
  const displayName = user?.salonName || user?.name || "Azzo";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AZ";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-14 px-3 sm:px-4 lg:px-6">
        <div className="ml-10 sm:ml-12 lg:ml-0 min-w-0 flex-1 flex items-center gap-2">
          {onToggleDesktopSidebar ? (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onToggleDesktopSidebar}
              aria-label={isDesktopSidebarOpen ? "Recolher menu lateral" : "Expandir menu lateral"}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-sm font-medium text-foreground truncate">{title}</h1>
            {subtitle ? <p className="text-xs text-muted-foreground truncate hidden sm:block">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="hidden lg:flex relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <Input
              placeholder="Buscar..."
              className="w-44 xl:w-56 pl-8 h-8 text-sm bg-muted/60 border-transparent focus-visible:border-input focus-visible:ring-0 focus-visible:bg-card"
            />
          </div>

          <DropdownMenu
            onOpenChange={(open) => {
              if (open) {
                void refreshSummary();
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 sm:w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!summaryItems.length ? <DropdownMenuItem className="text-sm text-muted-foreground">Nenhuma notificação</DropdownMenuItem> : null}
              {summaryItems.slice(0, 5).map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="flex flex-col items-start gap-1 py-2 sm:py-3"
                  onClick={() => {
                    navigate(`/notificacoes?id=${item.id}`);
                  }}
                >
                  <span className="font-medium text-sm flex items-center gap-2">
                    {!(item.viewed ?? Boolean(item.viewedAt)) ? <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" /> : null}
                    {item.channel || "Notificação"}
                    {!(item.viewed ?? Boolean(item.viewedAt)) ? (
                      <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-[10px] py-0 px-1.5">Nova</Badge>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-2">{item.message}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/notificacoes")}>Ver todas</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-1.5 h-8 text-muted-foreground hover:text-foreground">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-xs font-medium truncate max-w-[80px] lg:max-w-[120px]">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/perfil-salao")}>
                <User className="w-4 h-4 mr-2 opacity-60" />
                Perfil do Salão
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                <Settings className="w-4 h-4 mr-2 opacity-60" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/financeiro/licenca")}>
                <CreditCard className="w-4 h-4 mr-2 opacity-60" />
                Plano e Faturamento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
