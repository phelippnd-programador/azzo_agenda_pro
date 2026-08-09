import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, ChevronUp, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clientsApi } from "@/lib/api/clients";
import type { AppointmentStatus, ClientAppointmentHistoryItem } from "@/types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

const STATUS_VARIANT: Record<
  AppointmentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isUpcoming(item: ClientAppointmentHistoryItem): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(item.date + "T00:00:00");
  return d >= today && item.status !== "CANCELLED" && item.status !== "NO_SHOW";
}

interface ChatClientAppointmentsProps {
  clientId: string;
  clientName?: string | null;
}

export function ChatClientAppointments({ clientId, clientName }: ChatClientAppointmentsProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["client-appointment-history", clientId],
    queryFn: () => clientsApi.getAppointmentHistory(clientId, 0, 10),
    enabled: Boolean(clientId),
    staleTime: 60_000,
  });

  const allItems = data?.items ?? [];

  const upcoming = allItems
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const recentPast = allItems
    .filter((i) => !isUpcoming(i))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2);

  const displayed = [...upcoming, ...recentPast].slice(0, 5);

  const handleNewAppointment = () => {
    const params = new URLSearchParams();
    params.set("clientId", clientId);
    navigate(`/agenda?${params.toString()}`);
  };

  return (
    <div className="rounded-xl border border-border/70 bg-background/65 text-card-foreground">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/40"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-semibold truncate">
            Próximos agendamentos
            {clientName ? ` - ${clientName.split(" ")[0]}` : ""}
          </span>
          {upcoming.length > 0 && (
            <Badge className="shrink-0 text-xs h-4 px-1.5 leading-none">
              {upcoming.length}
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="space-y-2 border-t border-border/70 px-4 pb-3 pt-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : displayed.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              Nenhum agendamento encontrado para este cliente.
            </p>
          ) : (
            <div className="space-y-1.5">
              {displayed.map((item) => {
                const serviceName =
                  item.services?.[0]?.service?.name ??
                  "Serviço não informado";

                const professionalName = item.professionalName ?? "Profissional não informado";

                return (
                  <div
                    key={item.appointmentId}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border/70 bg-card/70 p-2.5 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium truncate">{serviceName}</p>
                      <p className="text-muted-foreground">{formatDate(item.date)}</p>
                      <p className="text-muted-foreground truncate">{professionalName}</p>
                    </div>
                    <Badge
                      variant={STATUS_VARIANT[item.status]}
                      className="shrink-0 text-xs whitespace-nowrap"
                    >
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs mt-1"
            onClick={handleNewAppointment}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Novo agendamento
          </Button>
        </div>
      )}
    </div>
  );
}
