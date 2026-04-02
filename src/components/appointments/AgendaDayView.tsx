import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Eye,
  Layers3,
  MoreVertical,
  TriangleAlert,
} from 'lucide-react';
import {
  appointmentStatusBadgeToneMap,
  appointmentStatusLabelMap,
  getStatusColor,
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
  const [openOverlapGroups, setOpenOverlapGroups] = useState<Record<string, boolean>>({});

  const groupedAppointments = useMemo(
    () =>
      appointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
        const key = normalizeTime(appointment.startTime);
        if (!key) return acc;
        acc[key] = [...(acc[key] || []), appointment];
        return acc;
      }, {}),
    [appointments],
  );

  const displayedTimeSlots = useMemo(() => {
    const appointmentTimes = appointments
      .map((appointment) => normalizeTime(appointment.startTime))
      .filter(Boolean);
    const unique = new Set([...timeSlots, ...appointmentTimes]);
    return Array.from(unique).sort((a, b) => toMinutes(a) - toMinutes(b));
  }, [appointments]);

  const getAppointmentServiceLabel = (appointment: Appointment) => {
    const items = getAppointmentItems(appointment);
    const names = items.map((item) => item.service?.name).filter((name): name is string => !!name);
    return names.length ? names.join(', ') : 'Servico';
  };

  const getOverlapLabel = (count: number) =>
    count === 2 ? '2 agendamentos no mesmo horario' : `${count} agendamentos no mesmo horario`;

  const isOverlapGroupOpen = (slotTime: string) => openOverlapGroups[slotTime] ?? true;

  const renderAppointmentActions = (
    appointment: Appointment,
    options?: {
      showStatus?: boolean;
      compact?: boolean;
    },
  ) => (
    <div className="flex items-center gap-1 flex-shrink-0">
      {options?.showStatus !== false && (
        <StatusBadge
          status={appointment.status}
          labelMap={appointmentStatusLabelMap}
          toneMap={appointmentStatusBadgeToneMap}
          className="hidden px-1.5 py-0.5 text-[9px] sm:inline-flex sm:text-[10px]"
        />
      )}
      <Button
        variant="ghost"
        size="icon"
        className={options?.compact ? 'h-7 w-7' : 'h-6 w-6 sm:h-7 sm:w-7'}
        onClick={(event) => {
          event.stopPropagation();
          onAppointmentClick(appointment);
        }}
      >
        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={options?.compact ? 'h-7 w-7' : 'h-6 w-6 sm:h-7 sm:w-7'}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(allowedTransitions[appointment.status] ?? []).includes('CONFIRMED') && (
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'CONFIRMED')}>
              Confirmar agendamento
            </DropdownMenuItem>
          )}
          {(allowedTransitions[appointment.status] ?? []).includes('IN_PROGRESS') && (
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'IN_PROGRESS')}>
              Iniciar Atendimento
            </DropdownMenuItem>
          )}
          {(allowedTransitions[appointment.status] ?? []).includes('COMPLETED') && (
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'COMPLETED')}>
              Concluir atendimento
            </DropdownMenuItem>
          )}
          {(allowedTransitions[appointment.status] ?? []).includes('NO_SHOW') && (
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'NO_SHOW')}>
              Nao Compareceu
            </DropdownMenuItem>
          )}
          {!isProfessionalUser && canReassignAppointments && (
            <DropdownMenuItem onClick={() => onReassignRequest(appointment)}>
              Realocar profissional
            </DropdownMenuItem>
          )}
          {(allowedTransitions[appointment.status] ?? []).includes('CANCELLED') && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onStatusChange(appointment.id, 'CANCELLED')}
            >
              Cancelar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="text-red-600" onClick={() => onDeleteRequest(appointment.id)}>
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderSingleAppointment = (appointment: Appointment) => {
    const client = appointment.client ?? null;
    const professional = professionals.find((item) => item.id === appointment.professionalId);
    const serviceLabel = getAppointmentServiceLabel(appointment);

    return (
      <div
        key={appointment.id}
        className={`p-2 sm:p-3 rounded-lg ${getStatusColor(appointment.status)} mb-1.5 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-150`}
        onClick={() => onAppointmentClick(appointment)}
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
          {renderAppointmentActions(appointment)}
        </div>
      </div>
    );
  };

  const renderOverlapGroup = (slotTime: string, appointmentsAtSameTime: Appointment[]) => {
    const isOpen = isOverlapGroupOpen(slotTime);

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={(open) =>
          setOpenOverlapGroups((current) => ({
            ...current,
            [slotTime]: open,
          }))
        }
      >
        <div className="rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-2 shadow-sm">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full flex-col gap-2 rounded-lg border border-amber-200 bg-amber-100/70 px-3 py-2 text-left transition-colors hover:bg-amber-100"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-amber-500/15 p-1.5 text-amber-700">
                    <TriangleAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                      Conflito de agenda
                    </p>
                    <p className="text-xs text-amber-800 sm:text-sm">
                      {getOverlapLabel(appointmentsAtSameTime.length)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-amber-900">
                    <Layers3 className="h-3.5 w-3.5" />
                    Sobrepostos
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-amber-900">
                    {isOpen ? 'Recolher' : 'Expandir'}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-amber-800">
                <span>
                  {isOpen
                    ? 'Compare os atendimentos lado a lado para decidir o proximo passo.'
                    : 'Grupo recolhido. Abra para comparar os atendimentos deste horario.'}
                </span>
                <span className="hidden sm:inline text-amber-700">
                  {isOpen ? 'Arraste horizontalmente se precisar' : 'Toque para expandir'}
                </span>
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-2">
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
              {appointmentsAtSameTime.map((appointment, index) => {
                const client = appointment.client ?? null;
                const professional = professionals.find((item) => item.id === appointment.professionalId);
                const serviceLabel = getAppointmentServiceLabel(appointment);
                return (
                  <div
                    key={appointment.id}
                    className={`min-w-[280px] max-w-[360px] flex-1 snap-start rounded-xl border border-white/80 p-3 sm:min-w-[320px] sm:p-4 lg:min-w-[340px] ${getStatusColor(appointment.status)} cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-150`}
                    onClick={() => onAppointmentClick(appointment)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-foreground/80">
                          #{index + 1} de {appointmentsAtSameTime.length}
                        </div>
                        <StatusBadge
                          status={appointment.status}
                          labelMap={appointmentStatusLabelMap}
                          toneMap={appointmentStatusBadgeToneMap}
                        />
                      </div>
                      {renderAppointmentActions(appointment, { showStatus: false, compact: true })}
                    </div>

                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar className="w-10 h-10 flex-shrink-0 ring-1 ring-white/80">
                        <AvatarImage src={professional?.avatar} />
                        <AvatarFallback className="text-xs font-medium">
                          {client?.name?.slice(0, 2).toUpperCase() ?? '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight truncate">
                          {client?.name || 'Cliente'}
                        </p>
                        <p className="mt-1 text-sm leading-tight text-foreground/90 truncate">
                          {serviceLabel}
                        </p>
                        <div className="mt-3 space-y-1 text-xs text-foreground/70">
                          <p className="truncate">
                            <span className="font-medium text-foreground/80">Profissional:</span>{' '}
                            {professional?.name || 'Nao informado'}
                          </p>
                          <p>
                            <span className="font-medium text-foreground/80">Horario:</span>{' '}
                            {normalizeTime(appointment.startTime)} - {normalizeTime(appointment.endTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
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

              <div className="divide-y max-h-[500px] sm:max-h-[600px] overflow-y-auto">
                {displayedTimeSlots.map((time) => {
                  const slotAppointments = groupedAppointments[time] || [];
                  return (
                    <div
                      key={time}
                      className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] min-h-[60px] sm:min-h-[70px]"
                    >
                      <div className="p-2 sm:p-3 bg-muted/40 border-r text-xs sm:text-sm text-muted-foreground font-medium">
                        {time}
                      </div>
                      <div className="p-1 sm:p-2">
                        {slotAppointments.length > 1
                          ? renderOverlapGroup(time, slotAppointments)
                          : slotAppointments.map(renderSingleAppointment)}
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
            Pagina {pagination.page} de {Math.max(1, totalPages)}
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
              Proxima
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
