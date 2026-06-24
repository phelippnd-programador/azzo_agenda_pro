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
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-amber-900 dark:bg-slate-900/70 dark:text-amber-100">
                    <Layers3 className="h-3.5 w-3.5" />
                    Sobrepostos
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-amber-900 dark:bg-slate-900/70 dark:text-amber-100">
                    {isOpen ? 'Recolher' : 'Expandir'}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-amber-800 dark:text-amber-200">
                <span>
                  {isOpen
                    ? 'Compare os atendimentos lado a lado para decidir o proximo passo.'
                    : 'Grupo recolhido. Abra para comparar os atendimentos deste horario.'}
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
                    className={`min-w-[280px] max-w-[360px] flex-1 snap-start rounded-xl border border-white/80 p-3 sm:min-w-[320px] sm:p-4 lg:min-w-[340px] dark:border-slate-700/70 ${getStatusColor(appointment.status)} cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-150`}
                    onClick={() => onAppointmentClick(appointment)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-foreground/80 dark:bg-slate-900/55 dark:text-slate-200">
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
                      <Avatar className="w-10 h-10 flex-shrink-0 ring-1 ring-white/80 dark:ring-slate-700">
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

  const columnDisplayedSlots = useMemo(() => {
    const appointmentTimes = appointments
      .map((a) => normalizeTime(a.startTime))
      .filter(Boolean);
    const unique = new Set([...timeSlots, ...appointmentTimes]);
    return Array.from(unique).sort((a, b) => toMinutes(a) - toMinutes(b));
  }, [appointments]);

  if (columnMode && columnProfessionals.length > 1) {
    const colCount = columnProfessionals.length;
    const gridCols = `68px repeat(${colCount}, minmax(180px, 1fr))`;
    const SLOT_HEIGHT = 64; // px por slot de 30 min
    const dayStartMin = toMinutes(columnDisplayedSlots[0] ?? '08:00');
    const totalHeight = columnDisplayedSlots.length * SLOT_HEIGHT;

    return (
      <Card className="border-border/70 bg-card/96 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.14)]">
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
                          <p className="text-[10px] text-muted-foreground">{count} agend.</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grade de horários com altura proporcional à duração */}
              <div className="max-h-[600px] overflow-y-auto">
                <div className="grid" style={{ gridTemplateColumns: gridCols }}>
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

                    return (
                      <div
                        key={prof.id}
                        className={`border-r border-border/40 last:border-r-0 relative ${color.bg}`}
                        style={{ height: totalHeight }}
                      >
                        {/* Linhas de slot clicáveis (fundo) */}
                        {columnDisplayedSlots.map((time, slotIdx) => (
                          <div
                            key={time}
                            className="absolute left-0 right-0 border-b border-border/30 cursor-pointer group hover:bg-primary/5 transition-colors"
                            style={{ top: slotIdx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                            onClick={() => onNewAppointmentFromSlot?.(time, prof.id)}
                          >
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <Plus className="w-3.5 h-3.5 text-primary/40" />
                            </span>
                          </div>
                        ))}

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
                                    <p className="text-[10px] opacity-75 truncate leading-tight mt-0.5">
                                      {serviceLabel}
                                    </p>
                                  )}
                                  {height > 64 && (
                                    <p className="text-[10px] opacity-50 mt-0.5">
                                      {normalizeTime(apt.startTime)} – {normalizeTime(apt.endTime)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-start gap-0.5 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt); }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
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
                                      {(allowedTransitions[apt.status] ?? []).includes('CANCELLED') && (
                                        <DropdownMenuItem className="text-red-600" onClick={() => onStatusChange(apt.id, 'CANCELLED')}>Cancelar</DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem className="text-red-600" onClick={() => onDeleteRequest(apt.id)}>Excluir</DropdownMenuItem>
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
      <Card className="border-border/70 bg-card/96 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.14)]">
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
                  return (
                    <div
                      key={time}
                      className="grid min-h-[72px] grid-cols-[68px_1fr] bg-background/85 sm:min-h-[80px] sm:grid-cols-[88px_1fr]"
                    >
                      <div className="border-r border-border/60 bg-muted/25 px-2 py-3 text-center text-xs font-medium text-muted-foreground sm:px-3 sm:text-sm">
                        <span className="inline-flex rounded-full bg-background/85 px-2 py-1 shadow-sm">
                          {time}
                        </span>
                      </div>
                      <div className="p-2 sm:p-3">
                        {slotAppointments.length > 1
                          ? renderOverlapGroup(time, slotAppointments)
                          : slotAppointments.length === 1
                          ? slotAppointments.map(renderSingleAppointment)
                          : (
                            <button
                              type="button"
                              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground opacity-0 hover:opacity-100 hover:bg-primary/5 transition-all duration-150 cursor-pointer"
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
