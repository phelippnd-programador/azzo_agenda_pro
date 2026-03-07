import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { maskPhoneBr } from "@/lib/input-masks";
import { Calendar, DollarSign, Mail, MoreVertical, Phone } from "lucide-react";
import type { Client } from "@/lib/api";

type ClientCardProps = {
  client: Client;
  onOpenProfile: (clientId: string) => void;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function ClientCard({ client, onOpenProfile, onEdit, onDelete }: ClientCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onOpenProfile(client.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenProfile(client.id);
        }
      }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary text-sm">
                {client.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                {client.name}
              </h3>
              <p className="text-xs text-muted-foreground">{client.totalVisits} visitas</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(client)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenProfile(client.id)}>Ver perfil</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(client.id)}>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{maskPhoneBr(client.phone, false)}</span>
          </div>
          {client.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">{client.email}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              <span className="text-[10px] sm:text-xs">Ultima visita</span>
            </div>
            <p className="text-xs sm:text-sm font-medium">
              {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString("pt-BR") : "Nunca"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              <span className="text-[10px] sm:text-xs">Total gasto</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-primary">{formatCurrency(client.totalSpent)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
