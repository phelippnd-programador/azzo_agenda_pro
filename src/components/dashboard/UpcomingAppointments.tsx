import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, MoreVertical } from 'lucide-react';
import { Appointment } from '@/types';
import { getStatusColor, getStatusLabel, formatCurrency } from '@/lib/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Próximos Agendamentos</CardTitle>
        <Button variant="ghost" size="sm" className="text-violet-600 text-xs sm:text-sm">
          Ver todos
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {appointments.length === 0 ? (
          <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">
            Nenhum agendamento para hoje
          </p>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <AvatarImage src={appointment.professional?.avatar} />
                <AvatarFallback className="bg-violet-100 text-violet-700 text-xs sm:text-sm">
                  {appointment.client?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                    {appointment.client?.name}
                  </p>
                  <Badge className={`${getStatusColor(appointment.status)} text-[10px] sm:text-xs`}>
                    {getStatusLabel(appointment.status)}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {appointment.service?.name}
                  <span className="hidden sm:inline"> com {appointment.professional?.name}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    {appointment.startTime}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-violet-600">
                    {formatCurrency(appointment.totalPrice)}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Confirmar</DropdownMenuItem>
                  <DropdownMenuItem>Iniciar Atendimento</DropdownMenuItem>
                  <DropdownMenuItem>Reagendar</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
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