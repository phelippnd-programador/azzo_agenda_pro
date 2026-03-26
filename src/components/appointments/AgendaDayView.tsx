import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarIcon, Clock, Eye, MoreVertical } from 'lucide-react';
import {
  getStatusColor,
  getStatusLabel,
  allowedTransitions,
  getAppointmentItems,
} from '@/lib/appointment-status';
import type { Appointment } from '@/hooks/useAppointments';
import type { Professional } from '@/lib/api';
import type { PaginationState } from '@/hooks/useResourceList';

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

const normalizeTime = (value?: string | null) => {
  if (!value) return '';
  const [h = '', m = ''] = value.split(':');
  if (!h || !m) return value;
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
};

const toMinutes = (time: string) => {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
};

interface AgendaDayViewProps {
  appointments: Appointment[];
  professionals: Professional[];
  formattedDate: string;
  pagination: PaginationState;
  isProfessionalUser: boolean;
  canReassignAppointments: boolean;
  onAppointmentClick: (appointment: Appointment) => void;
  onStatusChange: (id: string, status: Appointment['status']) => void;
  onDeleteRequest: (id: string) => void;
  onReassignRequest: (appointment: Appointment) => void;
  onPageChange: (page: number) => void;
}

export function AgendaDayView({
  appointments,
  professionals,
  formattedDate,
  pagination,
  isProfessionalUser,
  canReassignAppointments,
  onAppointmentClick,
  onStatusChange,
  onDeleteRequest,
  onReassignRequest,
  onPageChange,
}: AgendaDayViewProps) {
  const displayedTimeSlots = useMemo(() => {
    const appointmentTimes = appointments
      .map((apt) => normalizeTime(apt.startTime))
      .filter(Boolean);
    const unique = new Set([...timeSlots, ...appointmentTimes]);
    return Array.from(unique).sort((a, b) => toMinutes(a) - toMinutes(b));
  }, [appointments]);

  const getAppointmentServiceLabel = (apt: Appointment) => {
    const items = getAppointmentItems(apt);
    const names = items.map((item) => item.service?.name).filter((n): n is string => !!n);
    return names.length ? names.join(', ') : 'Serviço';
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {appointments.length === 0 && (
            <div className="px-4 py-3 text-xs text-muted-foreground border-b border-border/50 bg-muted/20 flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/60" />
              <span>Nenhum agendamento neste dia.</span>
            </div>
          )}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] border-b">
                <div className="p-2 sm:p-3 bg-muted/40 border-r">
                  <Clock className="w-4 h-4 text-muted-foreground mx-auto" />
                </div>
                <div className="p-2 sm:p-3 bg-muted/40">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm capitalize">{formattedDate}</span>
                  </div>
                </div>
              </div>

              {/* Time slots */}
              <div className="divide-y max-h-[500px] sm:max-h-[600px] overflow-y-auto">
                {displayedTimeSlots.map((time) => {
                  const slotAppointments = appointments.filter(
                    (apt) => normalizeTime(apt.startTime) === time,
                  );
                  return (
                    <div
                      key={time}
                      className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] min-h-[60px] sm:min-h-[70px]"
                    >
                      <div className="p-2 sm:p-3 bg-muted/40 border-r text-xs sm:text-sm text-muted-foreground font-medium">
                        {time}
                      </div>
                      <div className="p-1 sm:p-2">
                        {slotAppointments.map((apt) => {
                          const client = apt.client ?? null;
                          const professional = professionals.find((p) => p.id === apt.professionalId);
                          const serviceLabel = getAppointmentServiceLabel(apt);
                          return (
                            <div
                              key={apt.id}
                              className={`p-2 sm:p-3 rounded-lg ${getStatusColor(apt.status)} mb-1.5 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-150`}
                              onClick={() => onAppointmentClick(apt)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 mt-0.5">
                                    <AvatarImage src={professional?.avatar} />
                                    <AvatarFallback className="text-xs font-medium">
                                      {client?.name?.slice(0, 2).toUpperCase() ?? '??'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-xs sm:text-sm leading-tight truncate">
                                      {client?.name || 'Cliente'}
                                    </p>
                                    <p className="text-[10px] sm:text-xs leading-tight truncate mt-0.5 opacity-80">
                                      {serviceLabel}
                                    </p>
                                    <p className="text-[10px] opacity-60 truncate leading-tight hidden sm:block">
                                      {professional?.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/5 whitespace-nowrap hidden sm:block">
                                    {getStatusLabel(apt.status)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 sm:h-7 sm:w-7"
                                    onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt); }}
                                  >
                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 sm:h-7 sm:w-7"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {(allowedTransitions[apt.status] ?? []).includes('CONFIRMED') && (
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, 'CONFIRMED')}>
                                          Confirmar agendamento
                                        </DropdownMenuItem>
                                      )}
                                      {(allowedTransitions[apt.status] ?? []).includes('IN_PROGRESS') && (
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, 'IN_PROGRESS')}>
                                          Iniciar Atendimento
                                        </DropdownMenuItem>
                                      )}
                                      {(allowedTransitions[apt.status] ?? []).includes('COMPLETED') && (
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, 'COMPLETED')}>
                                          Concluir atendimento
                                        </DropdownMenuItem>
                                      )}
                                      {(allowedTransitions[apt.status] ?? []).includes('NO_SHOW') && (
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, 'NO_SHOW')}>
                                          Não Compareceu
                                        </DropdownMenuItem>
                                      )}
                                      {!isProfessionalUser && canReassignAppointments && (
                                        <DropdownMenuItem onClick={() => { onReassignRequest(apt); }}>
                                          Realocar profissional
                                        </DropdownMenuItem>
                                      )}
                                      {(allowedTransitions[apt.status] ?? []).includes('CANCELLED') && (
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => onStatusChange(apt.id, 'CANCELLED')}
                                        >
                                          Cancelar
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => onDeleteRequest(apt.id)}
                                      >
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {Math.max(1, totalPages)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
