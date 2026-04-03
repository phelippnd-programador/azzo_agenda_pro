import { Bell, Building2, CreditCard, LogOut, PanelLeft, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  const isOwner = user?.role === "OWNER";
  const displayName = user?.salonName || user?.name || "Azzo";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AZ";
  const avatarSrc =
    user?.avatarUrl ||
    (user?.avatar?.startsWith("http://") || user?.avatar?.startsWith("https://") ? user.avatar : undefined);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="ml-10 flex min-w-0 flex-1 items-center gap-2 sm:ml-12 lg:ml-0">
          {onToggleDesktopSidebar ? (
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground lg:flex"
              onClick={onToggleDesktopSidebar}
              aria-label={isDesktopSidebarOpen ? "Recolher menu lateral" : "Expandir menu lateral"}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-sm font-medium text-foreground">{title}</h1>
            {subtitle ? <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
          <DropdownMenu
            onOpenChange={(open) => {
              if (open) {
                void refreshSummary();
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 sm:w-80">
              <DropdownMenuLabel>Notificacoes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!summaryItems.length ? (
                <DropdownMenuItem className="text-sm text-muted-foreground">Nenhuma notificacao</DropdownMenuItem>
              ) : null}
              {summaryItems.slice(0, 5).map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="flex flex-col items-start gap-1 py-2 sm:py-3"
                  onClick={() => {
                    navigate(`/notificacoes?id=${item.id}`);
                  }}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {!(item.viewed ?? Boolean(item.viewedAt)) ? <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" /> : null}
                    {item.channel || "Notificacao"}
                    {!(item.viewed ?? Boolean(item.viewedAt)) ? (
                      <Badge variant="outline" className="border-primary/30 bg-primary/5 px-1.5 py-0 text-[10px] text-primary">
                        Nova
                      </Badge>
                    ) : null}
                  </span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{item.message}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/notificacoes")}>Ver todas</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-2 px-1.5 text-muted-foreground hover:text-foreground">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[80px] truncate text-xs font-medium md:inline lg:max-w-[120px]">{displayName}</span>
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
              {isOwner ? (
                <DropdownMenuItem onClick={() => navigate("/perfil-salao")}>
                  <Building2 className="mr-2 h-4 w-4 opacity-60" />
                  Perfil do Salao
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => navigate("/perfil-usuario")}>
                <User className="mr-2 h-4 w-4 opacity-60" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                <Settings className="mr-2 h-4 w-4 opacity-60" />
                Configuracoes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/financeiro/licenca")}>
                <CreditCard className="mr-2 h-4 w-4 opacity-60" />
                Plano e Faturamento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
