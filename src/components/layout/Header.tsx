import { Bell, Search, User } from "lucide-react";
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
}

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const displayName = user?.salonName || user?.name || "Azzo";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AZ";

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-8">
        <div className="ml-10 sm:ml-12 lg:ml-0 min-w-0 flex-1">
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
          <div className="hidden lg:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              className="w-48 xl:w-64 pl-9 bg-gray-50 border-gray-200"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 ? (
                  <Badge className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 p-0 flex items-center justify-center bg-pink-500 text-[10px] sm:text-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 sm:w-80">
              <DropdownMenuLabel>Notificacoes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!notifications.length ? (
                <DropdownMenuItem className="text-sm text-gray-500">
                  Nenhuma notificacao
                </DropdownMenuItem>
              ) : null}
              {notifications.slice(0, 3).map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="flex flex-col items-start gap-1 py-2 sm:py-3"
                  onClick={() => {
                    markAsRead(item.id);
                    navigate(`/notificacoes?id=${item.id}`);
                  }}
                >
                  <span className="font-medium text-sm">{item.title}</span>
                  <span className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                    {item.message}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/notificacoes")}>
                Ver todas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1 sm:gap-2 px-1 sm:px-2 h-8 sm:h-9">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-xs sm:text-sm font-medium truncate max-w-[80px] lg:max-w-none">
                  {displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Perfil do Salao
              </DropdownMenuItem>
              <DropdownMenuItem>Configuracoes</DropdownMenuItem>
              <DropdownMenuItem>Plano e Faturamento</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
