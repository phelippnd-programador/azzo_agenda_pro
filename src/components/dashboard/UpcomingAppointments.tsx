import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Clock, MoreVertical } from 'lucide-react';
import { Appointment } from '@/types';
import { formatCurrency } from '@/lib/format';
import { appointmentStatusBadgeToneMap, appointmentStatusLabelMap } from '@/lib/appointment-status';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  onUpdateStatus?: (id: string, status: Appointment['status']) => void | Promise<unknown>;
}

export function UpcomingAppointments({ appointments, onUpdateStatus }: UpcomingAppointmentsProps) {
  const navigate = useNavigate();

  const getServiceLabel = (appointment: Appointment) => {
    const names =
      appointment.items
        ?.map((item) => item.service?.name)
        .filter((name): name is string => !!name) || [];

    if (names.length) return names.join(', ');
    return appointment.service?.name || 'Servico';
  };

  return (
    <Card className="border-border/70 bg-background/95 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Agenda do dia
          </p>
          <CardTitle className="text-base sm:text-lg">Proximos agendamentos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Agenda do dia com acesso rapido para confirmacao e atendimento.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-primary sm:text-sm"
          onClick={() => navigate('/agenda')}
        >
          Ver todos
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum agendamento para hoje
          </div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 transition-colors hover:bg-muted/10 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                <Avatar className="h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12">
                  <AvatarImage src={appointment.professional?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-xs text-primary sm:text-sm">
                    {appointment.client?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground sm:text-base">
                      {appointment.client?.name}
                    </p>
                    <StatusBadge
                      status={appointment.status}
                      labelMap={appointmentStatusLabelMap}
                      toneMap={appointmentStatusBadgeToneMap}
                      className="text-[10px] sm:text-xs"
                    />
                  </div>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    {getServiceLabel(appointment)}
                    <span className="hidden sm:inline"> com {appointment.professional?.name}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      {appointment.startTime}
                    </span>
                    {appointment.professional?.name ? (
                      <span className="text-xs text-muted-foreground sm:hidden">
                        {appointment.professional.name}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:text-sm">
                      {formatCurrency(appointment.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end sm:justify-start">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      aria-label={`Abrir acoes do agendamento de ${appointment.client?.name || 'cliente'}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onUpdateStatus?.(appointment.id, 'CONFIRMED')}>
                      Confirmar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus?.(appointment.id, 'IN_PROGRESS')}>
                      Iniciar atendimento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/agenda')}>
                      Reagendar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onUpdateStatus?.(appointment.id, 'CANCELLED')}
                    >
                      Cancelar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
