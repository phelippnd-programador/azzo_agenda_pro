import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Clock, MoreVertical } from 'lucide-react';
import { Appointment } from '@/types';
import { formatCurrency } from '@/lib/mockData';
import { appointmentStatusBadgeToneMap, appointmentStatusLabelMap } from '@/lib/appointment-status';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  onUpdateStatus?: (id: string, status: Appointment["status"]) => Promise<void>;
}

export function UpcomingAppointments({ appointments, onUpdateStatus }: UpcomingAppointmentsProps) {
  const navigate = useNavigate();
  const getServiceLabel = (appointment: Appointment) => {
    const names =
      appointment.items
        ?.map((item) => item.service?.name)
        .filter((name): name is string => !!name) || [];

    if (names.length) return names.join(', ');
    return appointment.service?.name || 'Serviço';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Proximos Agendamentos</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary text-xs sm:text-sm"
          onClick={() => navigate('/agenda')}
        >
          Ver todos
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {appointments.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">Nenhum agendamento para hoje</p>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/40 rounded-xl hover:bg-muted/70 transition-colors"
            >
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <AvatarImage src={appointment.professional?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                  {appointment.client?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                  <p className="font-medium text-foreground text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                    {appointment.client?.name}
                  </p>
                  <StatusBadge
                    status={appointment.status}
                    labelMap={appointmentStatusLabelMap}
                    toneMap={appointmentStatusBadgeToneMap}
                    className="text-[10px] sm:text-xs"
                  />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {getServiceLabel(appointment)}
                  <span className="hidden sm:inline"> com {appointment.professional?.name}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    {appointment.startTime}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-primary">{formatCurrency(appointment.totalPrice)}</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(appointment.id, 'CONFIRMED')}>
                    Confirmar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(appointment.id, 'IN_PROGRESS')}>
                    Iniciar Atendimento
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
          ))
        )}
      </CardContent>
    </Card>
  );
}
