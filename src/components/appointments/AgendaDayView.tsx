import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Eye,
  Layers3,
  MoreVertical,
  Plus,
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
import type { WorkingHours } from '@/types';

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

const toSlotLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// Minutos desde 00:00 do horario atual, atualizado a cada minuto - usado pela
// linha de "agora" na grade do dia.
const useNowMinutes = () => {
  const [nowMinutes, setNowMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return nowMinutes;
};

const getWorkingWindow = (workingHours: WorkingHours[] | undefined) => {
  if (!Array.isArray(workingHours) || workingHours.length === 0) {
    return null;
  }

  const ranges = workingHours
    .filter((item) => item.isWorking && item.startTime && item.endTime && item.startTime < item.endTime)
    .map((item) => ({
      start: toMinutes(normalizeTime(item.startTime)),
      end: toMinutes(normalizeTime(item.endTime)),
    }))
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start);

  if (ranges.length === 0) {
    return null;
  }

  return {
    start: Math.min(...ranges.map((item) => item.start)),
    end: Math.max(...ranges.map((item) => item.end)),
  };
};

export function buildAgendaTimeSlots(appointments: Appointment[], professionals: Professional[]) {
  const appointmentTimes = appointments
    .map((appointment) => normalizeTime(appointment.startTime))
    .filter(Boolean);

  const windows = professionals
    .map((professional) => getWorkingWindow(professional.workingHours))
    .filter((window): window is { start: number; end: number } => window !== null);

  const slotMinutes = new Set<number>();

  windows.forEach((window) => {
    for (let cursor = window.start; cursor < window.end; cursor += 30) {
      slotMinutes.add(cursor);
    }
  });

  appointmentTimes.forEach((time) => slotMinutes.add(toMinutes(time)));

  if (slotMinutes.size === 0) {
    for (let cursor = toMinutes('08:00'); cursor < toMinutes('20:00'); cursor += 30) {
      slotMinutes.add(cursor);
    }
  }

  return Array.from(slotMinutes)
    .sort((a, b) => a - b)
    .map(toSlotLabel);
}

// Paleta de cores para identificação visual de profissionais nas colunas
const PROFESSIONAL_COLORS = [
  { bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800/50', dot: 'bg-violet-500', header: 'bg-violet-100/70 dark:bg-violet-900/40' },
  { bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800/50', dot: 'bg-sky-500', header: 'bg-sky-100/70 dark:bg-sky-900/40' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500', header: 'bg-emerald-100/70 dark:bg-emerald-900/40' },
  { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800/50', dot: 'bg-rose-500', header: 'bg-rose-100/70 dark:bg-rose-900/40' },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-500', header: 'bg-amber-100/70 dark:bg-amber-900/40' },
  { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800/50', dot: 'bg-indigo-500', header: 'bg-indigo-100/70 dark:bg-indigo-900/40' },
  { bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800/50', dot: 'bg-teal-500', header: 'bg-teal-100/70 dark:bg-teal-900/40' },
  { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800/50', dot: 'bg-orange-500', header: 'bg-orange-100/70 dark:bg-orange-900/40' },
];

interface AgendaDayViewProps {
  appointments: Appointment[];
  professionals: Professional[];
  formattedDate: string;
  /** Dia exibido e o dia de hoje - controla se a linha de "agora" aparece. */
  isToday?: boolean;
  pagination: PaginationState;
  isProfessionalUser: boolean;
  canReassignAppointments: boolean;
  columnMode?: boolean;
  activeProfessionals?: Professional[];
  onNewAppointmentFromSlot?: (time: string, professionalId?: string) => void;
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
  isToday = false,
  pagination,
  isProfessionalUser,
  canReassignAppointments,
  columnMode = false,
  activeProfessionals,
  onNewAppointmentFromSlot,
  onAppointmentClick,
  onStatusChange,
  onDeleteRequest,
  onReassignRequest,
  onPageChange,
}: AgendaDayViewProps) {
  const [openOverlapGroups, setOpenOverlapGroups] = useState<Record<string, boolean>>({});
  const nowMinutes = useNowMinutes();
  const columnScrollRef = useRef<HTMLDivElement>(null);
  const nowRowRef = useRef<HTMLDivElement>(null);

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

  const displayedTimeSlots = useMemo(
    () => buildAgendaTimeSlots(appointments, activeProfessionals ?? professionals),
    [activeProfessionals, appointments, professionals],
  );

  const getAppointmentServiceLabel = (appointment: Appointment) => {
    const items = getAppointmentItems(appointment);
    const names = items.map((item) => item.service?.name).filter((name): name is string => !!name);
    return names.length ? names.join(', ') : 'Serviço';
  };

  const getOverlapLabel = (count: number) => `${count} agendamentos no mesmo horário`;

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
          className="hidden px-1.5 py-0.5 text-[11px] sm:inline-flex"
        />
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ver detalhes do agendamento"
        className={options?.compact ? 'h-8 w-8' : 'h-7 w-7 sm:h-8 sm:w-8'}
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
            data-tour="agenda-appointment-menu"
            variant="ghost"
            size="icon"
            aria-label="Mais ações do agendamento"
            className={options?.compact ? 'h-8 w-8' : 'h-7 w-7 sm:h-8 sm:w-8'}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </DropdownMenuTrigger>
        {/* onClick com stopPropagation: DropdownMenuContent e portalado no DOM,
            mas o React ainda propaga o evento sintetico pela arvore de
            componentes - sem isso, clicar num item tambem dispara o onClick
            do card por baixo e abre o sheet de detalhes junto. */}
        <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
          {(allowedTransitions[appointment.status] ?? []).includes('CONFIRMED') && (
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'CONFIRMED')}>
              Confirmar agendamento
            </DropdownMenuItem>
          )}
          {(allowedTransitions[appointment.status] ?? []).includes('IN_PROGRESS') && (
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'IN_PROGRESS')}>
              Iniciar atendimento
            </DropdownMenuItem>
          )}
          {(allowedTransitions[appointment.status] ?? []).includes('COMPLETED') && (
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'COMPLETED')}>
              Concluir atendimento
            </DropdownMenuItem>
          )}
          {(allowedTransitions[appointment.status] ?? []).includes('NO_SHOW') && (
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'NO_SHOW')}>
              Não compareceu
            </DropdownMenuItem>
          )}
          {!isProfessionalUser && canReassignAppointments && (
            <DropdownMenuItem onClick={() => onReassignRequest(appointment)}>
              Realocar profissional
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {(allowedTransitions[appointment.status] ?? []).includes('CANCELLED') && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onStatusChange(appointment.id, 'CANCELLED')}
            >
              Cancelar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDeleteRequest(appointment.id)}>
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
        data-tour="agenda-appointment-card"
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
              <p className="text-[11px] sm:text-xs leading-tight truncate mt-0.5 opacity-80">
                {serviceLabel}
              </p>
              <p className="text-[11px] opacity-60 truncate leading-tight hidden sm:block">
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
            className="flex w-full flex-col gap-2 rounded-lg border border-amber-200 bg-amber-100/70 px-3 py-2 text-left transition-colors hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/15 dark:hover:bg-amber-500/20"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-amber-500/15 p-1.5 text-amber-700 dark:text-amber-300">
                    <TriangleAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
                      Conflito de agenda
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200 sm:text-sm">
                      {getOverlapLabel(appointmentsAtSameTime.length)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-amber-900 dark:bg-background/80 dark:text-amber-100">
                    <Layers3 className="h-3.5 w-3.5" />
                    Sobrepostos
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-amber-900 dark:bg-background/80 dark:text-amber-100">
                    {isOpen ? 'Recolher' : 'Expandir'}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-amber-800 dark:text-amber-200">
                <span>
                  {isOpen
                    ? 'Compare os atendimentos lado a lado para decidir o próximo passo.'
                    : 'Grupo recolhido. Abra para comparar os atendimentos deste horário.'}
                </span>
                <span className="hidden sm:inline text-amber-700 dark:text-amber-300">
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
                    data-tour="agenda-appointment-card"
                    className={`min-w-[280px] max-w-[360px] flex-1 snap-start rounded-xl border border-white/80 p-3 sm:min-w-[320px] sm:p-4 lg:min-w-[340px] dark:border-border/70 ${getStatusColor(appointment.status)} cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-150`}
                    onClick={() => onAppointmentClick(appointment)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-foreground/80 dark:bg-background/70 dark:text-foreground/80">
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
                      <Avatar className="w-10 h-10 flex-shrink-0 ring-1 ring-white/80 dark:ring-border">
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

  // --- Modo colunas por profissional ---
  const columnProfessionals = useMemo(() => {
    const base = activeProfessionals ?? professionals;
    if (!base.length) return professionals;
    // Mostra apenas profissionais que têm agendamento no dia OU todos os ativos (para ver slots livres)
    return base;
  }, [activeProfessionals, professionals]);

  const appointmentsByProfessional = useMemo(() => {
    const map = new Map<string, Map<string, Appointment[]>>();
    for (const prof of columnProfessionals) {
      map.set(prof.id, new Map());
    }
    for (const apt of appointments) {
      if (!apt.professionalId) continue;
      if (!map.has(apt.professionalId)) map.set(apt.professionalId, new Map());
      const profMap = map.get(apt.professionalId)!;
      const key = normalizeTime(apt.startTime);
      if (!key) continue;
      const existing = profMap.get(key) ?? [];
      profMap.set(key, [...existing, apt]);
    }
    return map;
  }, [appointments, columnProfessionals]);

  const columnDisplayedSlots = useMemo(
    () => buildAgendaTimeSlots(appointments, columnProfessionals),
    [appointments, columnProfessionals],
  );

  const isColumnGridActive = columnMode && columnProfessionals.length > 1;
  const SLOT_HEIGHT = 64; // px por slot de 30 min
  const columnDayStartMin = toMinutes(columnDisplayedSlots[0] ?? '08:00');
  const columnTotalHeight = columnDisplayedSlots.length * SLOT_HEIGHT;
  const columnNowTop = ((nowMinutes - columnDayStartMin) / 30) * SLOT_HEIGHT;
  const showColumnNowLine = isColumnGridActive && isToday && columnNowTop >= 0 && columnNowTop <= columnTotalHeight;

  // Rola a grade para deixar "agora" visivel logo ao abrir a tela, com um
  // pouco de contexto do que ja passou, em vez de sempre abrir no topo do
  // horario de funcionamento.
  useEffect(() => {
    if (!showColumnNowLine) return;
    columnScrollRef.current?.scrollTo({ top: Math.max(columnNowTop - 96, 0), behavior: 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showColumnNowLine]);

  useEffect(() => {
    if (isColumnGridActive || !isToday) return;
    nowRowRef.current?.scrollIntoView({ block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isColumnGridActive, isToday]);

  if (isColumnGridActive) {
    const colCount = columnProfessionals.length;
    const gridCols = `68px repeat(${colCount}, minmax(180px, 1fr))`;
    const dayStartMin = columnDayStartMin;
    const totalHeight = columnTotalHeight;
    const nowTop = columnNowTop;
    const showNowLine = showColumnNowLine;

    return (
      <Card data-tour="agenda-day-grid" className="border-border/70 bg-card/96 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.14)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${68 + colCount * 180}px` }}>
              {/* Cabeçalho de profissionais */}
              <div
                className="grid border-b border-border/60 bg-muted/25 sticky top-0 z-10"
                style={{ gridTemplateColumns: gridCols }}
              >
                <div className="border-r border-border/60 p-3 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                {columnProfessionals.map((prof, idx) => {
                  const color = PROFESSIONAL_COLORS[idx % PROFESSIONAL_COLORS.length];
                  const count = appointments.filter((a) => a.professionalId === prof.id).length;
                  return (
                    <div
                      key={prof.id}
                      className={`border-r border-border/60 last:border-r-0 p-3 ${color.header}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={prof.avatar} />
                            <AvatarFallback className="text-xs font-semibold">
                              {prof.name?.slice(0, 2).toUpperCase() ?? '??'}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${color.dot}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate leading-tight">{prof.name}</p>
                          <p className="text-[11px] text-muted-foreground">{count} agend.</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grade de horários com altura proporcional à duração */}
              <div ref={columnScrollRef} className="max-h-[600px] overflow-y-auto">
                <div className="relative grid" style={{ gridTemplateColumns: gridCols }}>
                  {showNowLine && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                      style={{ top: nowTop }}
                    >
                      <span className="ml-[68px] h-px w-full bg-primary" />
                      <span className="absolute left-2 -translate-y-1/2 rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-soft">
                        {toSlotLabel(nowMinutes)}
                      </span>
                    </div>
                  )}
                  {/* Eixo de tempo */}
                  <div className="border-r border-border/60 bg-muted/25 relative flex-shrink-0" style={{ height: totalHeight }}>
                    {columnDisplayedSlots.map((time, idx) => (
                      <div
                        key={time}
                        className="absolute left-0 right-0 border-b border-border/30 flex items-start justify-center pt-1"
                        style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      >
                        <span className="inline-flex rounded-full bg-background/85 px-1.5 py-0.5 shadow-sm text-[11px] font-medium text-muted-foreground">
                          {time}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Colunas por profissional */}
                  {columnProfessionals.map((prof, idx) => {
                    const color = PROFESSIONAL_COLORS[idx % PROFESSIONAL_COLORS.length];
                    const profApts = appointments.filter((a) => a.professionalId === prof.id);
                    const occupiedSlots = new Set(
                      profApts.flatMap((apt) => {
                        const start = toMinutes(normalizeTime(apt.startTime) || '08:00');
                        const end = apt.endTime ? toMinutes(normalizeTime(apt.endTime) || '08:30') : start + 30;
                        const slots: string[] = [];
                        for (let m = start; m < end; m += 30) slots.push(toSlotLabel(m));
                        return slots;
                      }),
                    );

                    return (
                      <div
                        key={prof.id}
                        className={`border-r border-border/40 last:border-r-0 relative ${color.bg}`}
                        style={{ height: totalHeight }}
                      >
                        {/* Linhas de slot clicáveis (fundo). Slots cobertos por um
                            agendamento existente ficam como div nao-interativo -
                            o card por cima ja tem o botao real de abrir detalhes,
                            entao nao faz sentido expor um segundo controle de
                            "criar" escondido atras dele. */}
                        {columnDisplayedSlots.map((time, slotIdx) =>
                          occupiedSlots.has(time) ? (
                            <div
                              key={time}
                              className="absolute left-0 right-0 border-b border-border/30"
                              style={{ top: slotIdx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                            />
                          ) : (
                            <button
                              key={time}
                              type="button"
                              aria-label={`Novo agendamento às ${time} com ${prof.name}`}
                              className="absolute left-0 right-0 border-b border-border/30 cursor-pointer group hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/50 transition-colors"
                              style={{ top: slotIdx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                              onClick={() => onNewAppointmentFromSlot?.(time, prof.id)}
                            >
                              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none">
                                <Plus className="w-3.5 h-3.5 text-primary/40" />
                              </span>
                            </button>
                          ),
                        )}

                        {/* Cards de agendamento com altura proporcional */}
                        {profApts.map((apt) => {
                          const startMin = toMinutes(normalizeTime(apt.startTime) || '08:00');
                          const endMin = apt.endTime
                            ? toMinutes(normalizeTime(apt.endTime) || '08:30')
                            : startMin + 30;
                          const durationMin = Math.max(endMin - startMin, 30);
                          const top = (startMin - dayStartMin) / 30 * SLOT_HEIGHT;
                          const height = Math.max(durationMin / 30 * SLOT_HEIGHT - 3, 40);
                          const client = apt.client ?? null;
                          const serviceLabel = getAppointmentServiceLabel(apt);

                          return (
                            <div
                              key={apt.id}
                              data-tour="agenda-appointment-card"
                              className={`absolute left-1 right-1 rounded-md p-1.5 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-150 border overflow-hidden z-10 ${color.border} ${getStatusColor(apt.status)}`}
                              style={{ top: top + 2, height: height - 2 }}
                              onClick={() => onAppointmentClick(apt)}
                            >
                              <div className="flex items-start justify-between gap-1 h-full">
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <p className="font-semibold text-[11px] leading-tight truncate">
                                    {client?.name || 'Cliente'}
                                  </p>
                                  {height > 48 && (
                                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] opacity-70 truncate leading-tight mt-0.5">
                                      {appointmentStatusLabelMap[apt.status] ?? apt.status}
                                    </p>
                                  )}
                                  {height > 48 && (
                                    <p className="text-[11px] opacity-75 truncate leading-tight mt-0.5">
                                      {serviceLabel}
                                    </p>
                                  )}
                                  {height > 64 && (
                                    <p className="text-[11px] opacity-50 mt-0.5">
                                      {normalizeTime(apt.startTime)} – {normalizeTime(apt.endTime)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-start gap-0.5 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Ver detalhes do agendamento"
                                    className="h-5 w-5"
                                    onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt); }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        data-tour="agenda-appointment-menu"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Mais ações do agendamento"
                                        className="h-5 w-5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                                      {(allowedTransitions[apt.status] ?? []).includes('CONFIRMED') && (
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, 'CONFIRMED')}>Confirmar</DropdownMenuItem>
                                      )}
                                      {(allowedTransitions[apt.status] ?? []).includes('IN_PROGRESS') && (
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, 'IN_PROGRESS')}>Iniciar atendimento</DropdownMenuItem>
                                      )}
                                      {(allowedTransitions[apt.status] ?? []).includes('COMPLETED') && (
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, 'COMPLETED')}>Concluir</DropdownMenuItem>
                                      )}
                                      {(allowedTransitions[apt.status] ?? []).includes('NO_SHOW') && (
                                        <DropdownMenuItem onClick={() => onStatusChange(apt.id, 'NO_SHOW')}>Não compareceu</DropdownMenuItem>
                                      )}
                                      {!isProfessionalUser && canReassignAppointments && (
                                        <DropdownMenuItem onClick={() => onReassignRequest(apt)}>Realocar profissional</DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      {(allowedTransitions[apt.status] ?? []).includes('CANCELLED') && (
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onStatusChange(apt.id, 'CANCELLED')}>Cancelar</DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDeleteRequest(apt.id)}>Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-tour="agenda-day-grid" className="border-border/70 bg-card/96 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.14)]">
        <CardContent className="p-0">
          {appointments.length === 0 && (
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/60" />
              <span>Nenhum agendamento neste dia.</span>
            </div>
          )}
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[68px_1fr] border-b border-border/60 bg-muted/25 sm:grid-cols-[88px_1fr]">
                <div className="border-r border-border/60 p-3">
                  <Clock className="w-4 h-4 text-muted-foreground mx-auto" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        Grade do dia
                      </p>
                      <span className="block truncate text-sm font-medium capitalize">{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-h-[520px] divide-y overflow-y-auto sm:max-h-[640px]">
                {displayedTimeSlots.map((time) => {
                  const slotAppointments = groupedAppointments[time] || [];
                  const isNowSlot = isToday && toMinutes(time) <= nowMinutes && nowMinutes < toMinutes(time) + 30;
                  return (
                    <div
                      key={time}
                      ref={isNowSlot ? nowRowRef : undefined}
                      className={`grid min-h-[72px] grid-cols-[68px_1fr] bg-background/85 sm:min-h-[80px] sm:grid-cols-[88px_1fr] ${
                        isNowSlot ? 'ring-1 ring-inset ring-primary/40' : ''
                      }`}
                    >
                      <div className="border-r border-border/60 bg-muted/25 px-2 py-3 text-center text-xs font-medium text-muted-foreground sm:px-3 sm:text-sm">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 shadow-sm ${
                            isNowSlot ? 'bg-primary text-primary-foreground' : 'bg-background/85'
                          }`}
                        >
                          {time}
                        </span>
                        {isNowSlot && (
                          <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                            Agora
                          </span>
                        )}
                      </div>
                      <div className="p-2 sm:p-3">
                        {slotAppointments.length > 1
                          ? renderOverlapGroup(time, slotAppointments)
                          : slotAppointments.length === 1
                          ? slotAppointments.map(renderSingleAppointment)
                          : (
                            <button
                              type="button"
                              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground opacity-0 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 hover:bg-primary/5 transition-all duration-150 cursor-pointer"
                              onClick={() => onNewAppointmentFromSlot?.(time)}
                            >
                              <Plus className="w-3 h-3 text-primary/50" />
                              Novo agendamento às {time}
                            </button>
                          )}
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
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Paginacao
            </p>
            <p className="text-sm text-muted-foreground">
              Pagina {pagination.page} de {Math.max(1, totalPages)}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              className="flex-1 sm:flex-none"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Anterior
            </Button>
            <Button
              className="flex-1 sm:flex-none"
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
