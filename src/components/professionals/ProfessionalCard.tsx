import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Professional } from "@/lib/api";
import { Mail, MoreVertical, Phone } from "lucide-react";

type ProfessionalCardProps = {
  professional: Professional;
  onOpenProfile: (id: string) => void;
  onEdit: (professional: Professional) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onResetPassword: (professional: Professional) => void;
};

export function ProfessionalCard({
  professional,
  onOpenProfile,
  onEdit,
  onToggleActive,
  onDelete,
  onResetPassword,
}: ProfessionalCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      className={`hover:shadow-md transition-shadow cursor-pointer ${!professional.isActive ? "opacity-60" : ""}`}
      onClick={() => onOpenProfile(professional.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenProfile(professional.id);
        }
      }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
              <AvatarImage src={professional.avatar} />
              <AvatarFallback className="bg-primary/15 text-primary text-sm sm:text-base">
                {professional.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                {professional.name}
              </h3>
              <Badge
                variant={professional.isActive ? "default" : "secondary"}
                className={`text-[10px] sm:text-xs ${professional.isActive ? "bg-green-100 text-green-700" : ""}`}
              >
                {professional.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={(event) => event.stopPropagation()}
                aria-label={`Abrir acoes de ${professional.name}`}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuItem onClick={() => onOpenProfile(professional.id)}>Ver perfil</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(professional)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(professional.id, !professional.isActive)}>
                {professional.isActive ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(professional)}>
                Resetar senha
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(professional.id)}>
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">{professional.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{professional.phone}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {professional.specialties.slice(0, 3).map((specialty, index) => (
            <Badge key={index} variant="outline" className="text-[10px] sm:text-xs">
              {specialty}
            </Badge>
          ))}
          {professional.specialties.length > 3 && (
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              +{professional.specialties.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
