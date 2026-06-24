import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Clock3, Info, Plus, Users } from 'lucide-react';
import { PageErrorState } from '@/components/ui/page-states';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { NewAppointmentDialog } from '@/components/appointments/NewAppointmentDialog';
import { AppointmentDetailsSheet } from '@/components/appointments/AppointmentDetailsSheet';
import { ReassignAppointmentDialog } from '@/components/appointments/ReassignAppointmentDialog';
import { AgendaDayView } from '@/components/appointments/AgendaDayView';
import { AgendaMonthView } from '@/components/appointments/AgendaMonthView';
import { AgendaWeekView } from '@/components/appointments/AgendaWeekView';
import { useAppointments, type Appointment } from '@/hooks/useAppointments';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentsApi, nfseApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toDateKey } from '@/lib/format';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { PaymentMethod } from '@/types';
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner';

const APPOINTMENT_PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'PIX', label: 'Pix' },
  { value: 'CREDIT_CARD', label: 'Cartao de credito' },
  { value: 'DEBIT_CARD', label: 'Cartao de debito' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'OTHER', label: 'Outro' },
];

const AGENDA_HINTS_KEY = 'azzo:agenda:hints-dismissed';

export default function Agenda() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hintsDismissed, setHintsDismissed] = useState(() =>
    localStorage.getItem(AGENDA_HINTS_KEY) === 'true',
  );

  const dismissHints = () => {
    localStorage.setItem(AGENDA_HINTS_KEY, 'true');
    setHintsDismissed(true);
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [dayAppointmentsFallback, setDayAppointmentsFallback] = useState<Appointment[] | null>(null);

  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [appointmentToReassign, setAppointmentToReassign] = useState<Appointment | null>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [appointmentToDeleteId, setAppointmentToDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);
  const [completionAppointmentId, setCompletionAppointmentId] = useState<string | null>(null);
  const [completionPaymentMethod, setCompletionPaymentMethod] = useState<PaymentMethod | ''>('');

  const [monthlyMetrics, setMonthlyMetrics] = useState<Array<{ dia: number; quantidadeAgendamentos: number }>>([]);
  const [isLoadingMonthlyMetrics, setIsLoadingMonthlyMetrics] = useState(false);

  const dateString = toDateKey(currentDate);
  const dateFilter = viewMode === 'day' ? dateString : undefined;

  // Para visão semanal: calcula segunda-feira da semana atual
  const weekStartDate = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    return d;
  }, [currentDate]);

  const {
    appointments,
    pagination,
    isLoading,
    error,
    refetch,
    goToPage,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    reassignAppointmentProfessional,
  } = useAppointments(
    {
      date: dateFilter,
      professionalId: selectedProfessional !== 'all' ? selectedProfessional : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
    },
    // Sem filtro de profissional na view dia: carrega mais para cobrir todos os profissionais
    { defaultLimit: viewMode === 'day' && selectedProfessional === 'all' ? 200 : 20, enabled: viewMode === 'day' },
  );

  // Hook separado para a visão semanal (sem paginação, busca dia a dia via múltiplos requests)
  // A API suporta busca por data única; buscamos todos os 7 dias da semana em paralelo
  // Usando useAppointments com limit alto e sem filtro de data para capturar a semana inteira
  // não é ideal — em vez disso fazemos 7 fetches individuais gerenciados localmente.
  // Para simplificar e não quebrar o hook existente, filtramos client-side dos appointments
  // já carregados quando o usuário navega do dia. Para a semana, carregamos via React Query
  // diretamente com o appointmentsApi.
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);

  useEffect(() => {
    if (viewMode !== 'week') return;
    let active = true;
    setIsLoadingWeek(true);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStartDate);
      d.setDate(weekStartDate.getDate() + i);
      return toDateKey(d);
    });

    Promise.all(
      days.map((date) =>
        appointmentsApi.getAll({
          date,
          page: 1,
          limit: 100,
          professionalId: selectedProfessional !== 'all' ? selectedProfessional : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
        }),
      ),
    )
      .then((results) => {
        if (!active) return;
        const all = results.flatMap((r) =>
          Array.isArray(r) ? r : ((r as { items?: Appointment[] }).items ?? []),
        );
        setWeekAppointments(all);
      })
      .catch(() => {
        if (active) {
          toast.error('Nao foi possivel carregar os agendamentos da semana.');
          setWeekAppointments([]);
        }
      })
      .finally(() => { if (active) setIsLoadingWeek(false); });

    return () => { active = false; };
  }, [viewMode, weekStartDate, selectedProfessional, selectedStatus]);

  const { professionals } = useProfessionals();
  const activeProfessionals = professionals.filter((p) => p.isActive);
  const canReassignAppointments = activeProfessionals.length > 1;

  const loggedProfessional = useMemo(
    () => activeProfessionals.find((p) => p.userId === user?.id) ?? null,
    [activeProfessionals, user?.id],
  );
  const isProfessionalUser = user?.role === 'PROFESSIONAL';

  const isColumnMode =
    viewMode === 'day' &&
    !isProfessionalUser &&
    selectedProfessional === 'all' &&
    activeProfessionals.length > 1;

  const effectiveSelectedProfessional = isProfessionalUser
    ? loggedProfessional?.id || ''
    : selectedProfessional;

  useEffect(() => {
    if (!isProfessionalUser || !loggedProfessional?.id) return;
    setSelectedProfessional(loggedProfessional.id);
  }, [isProfessionalUser, loggedProfessional?.id]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + (direction === 'next' ? 1 : -1));
      setDayAppointmentsFallback(null);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      next.setMonth(next.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(next);
  };

  const goToToday = () => {
    setDayAppointmentsFallback(null);
    setCurrentDate(new Date());
  };

  const openDayView = (date: Date, fallback?: Appointment[]) => {
    setCurrentDate(date);
    setViewMode('day');
    setDayAppointmentsFallback(fallback?.length ? fallback : null);
  };

  useEffect(() => {
    if (viewMode !== 'month') return;
    let active = true;
    setIsLoadingMonthlyMetrics(true);
    appointmentsApi
      .getMonthlyMetric(currentDate.getMonth() + 1, currentDate.getFullYear())
      .then((data) => { if (active) setMonthlyMetrics(data); })
      .catch(() => { if (active) { toast.error('Nao foi possivel carregar os totais mensais.'); setMonthlyMetrics([]); } })
      .finally(() => { if (active) setIsLoadingMonthlyMetrics(false); });
    return () => { active = false; };
  }, [currentDate, viewMode]);

  const monthCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingEmpty = (firstDay.getDay() + 6) % 7;

    const days: Array<{ date: Date; key: string; day: number } | null> = [];
    for (let i = 0; i < leadingEmpty; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({ date, key: toDateKey(date), day: d });
    }
    return days;
  }, [currentDate]);

  const monthAppointmentsByDay = useMemo(() => {
    const map = new Map<string, number>();
    monthCalendarDays.forEach((day) => { if (day) map.set(day.key, 0); });
    monthlyMetrics.forEach((metric) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), metric.dia);
      const key = toDateKey(date);
      if (map.has(key)) map.set(key, metric.quantidadeAgendamentos);
    });
    return map;
  }, [currentDate, monthCalendarDays, monthlyMetrics]);

  const totalAppointmentsInMonth = useMemo(
    () => monthlyMetrics.reduce((sum, m) => sum + m.quantidadeAgendamentos, 0),
    [monthlyMetrics],
  );

  const filteredAppointments = useMemo(() => {
    if (viewMode === 'month') {
      return appointments.filter((apt) =>
        monthCalendarDays.some((day) => day?.key === toDateKey(apt.date)),
      );
    }
    const dayItems = appointments.filter((apt) => toDateKey(apt.date) === dateString);
    if (dayItems.length > 0) return dayItems;
    return dayAppointmentsFallback && toDateKey(currentDate) === dateString
      ? dayAppointmentsFallback
      : [];
  }, [appointments, viewMode, monthCalendarDays, dateString, dayAppointmentsFallback, currentDate]);

  const daySummary = useMemo(() => {
    const source = filteredAppointments;
    return {
      total: source.length,
      pending: source.filter((appointment) => appointment.status === 'PENDING' || appointment.status === 'CONFIRMED').length,
      inProgress: source.filter((appointment) => appointment.status === 'IN_PROGRESS').length,
      completed: source.filter((appointment) => appointment.status === 'COMPLETED').length,
    };
  }, [filteredAppointments]);

  const handleNfseOnAppointmentCompleted = async (appointment: Appointment) => {
    try {
      const config = await nfseApi.getConfig('HOMOLOGACAO');
      if (config.emissionMode === 'MANUAL') return;

      const items = (Array.isArray(appointment.items) && appointment.items.length > 0)
        ? appointment.items
        : appointment.serviceId
        ? [{ serviceId: appointment.serviceId, service: appointment.service, durationMinutes: 0, unitPrice: Number(appointment.totalPrice || 0), totalPrice: Number(appointment.totalPrice || 0) }]
        : [];

      const client = appointment.client;
      const customerDocument = (client as { document?: string } | undefined)?.document || '';
      const customerType = customerDocument.length > 11 ? 'CNPJ' : 'CPF';
      const totalValue = Number(appointment.totalPrice || items.reduce((s, i) => s + Number(i.totalPrice || 0), 0));

      const prefill = {
        appointmentId: appointment.id,
        ambiente: config.ambiente,
        municipioCodigoIbge: config.municipioCodigoIbge,
        provedor: config.provedor,
        serieRps: config.serieRps,
        numeroRps: Date.now(),
        dataCompetencia: toDateKey(appointment.date),
        naturezaOperacao: 'Prestacao de servico',
        itemListaServico: config.itemListaServicoPadrao,
        valorServicos: totalValue,
        valorDeducoes: 0,
        valorIss: totalValue * (Number(config.aliquotaIssPadrao || 0) / 100),
        aliquotaIss: Number(config.aliquotaIssPadrao || 0),
        issRetido: false,
        customer: {
          type: customerType,
          document: customerDocument,
          name: client?.name || 'Consumidor final',
          email: client?.email || '',
          phone: client?.phone || '',
        },
        items: items.map((item, index) => {
          const itemTotal = Number(item.totalPrice || item.unitPrice || 0);
          return {
            lineNumber: index + 1,
            descricaoServico: item.service?.name || `Servico ${index + 1}`,
            quantidade: 1,
            valorUnitario: itemTotal,
            valorTotal: itemTotal,
            itemListaServico: config.itemListaServicoPadrao,
            aliquotaIss: Number(config.aliquotaIssPadrao || 0),
            valorIss: itemTotal * (Number(config.aliquotaIssPadrao || 0) / 100),
          };
        }),
      };

      sessionStorage.setItem('nfseDraftPrefill', JSON.stringify(prefill));

      if (config.emissionMode === 'ASK_ON_CLOSE') {
        const shouldOpen = window.confirm('Atendimento concluido. Deseja abrir a emissao da NFS-e agora?');
        if (!shouldOpen) return;
      }

      toast.info('Fluxo NFS-e preparado a partir do agendamento concluido.');
      navigate(`/fiscal/nfse/nova?appointmentId=${encodeURIComponent(appointment.id)}`);
    } catch (err) {
      const uiError = resolveUiError(err, 'Nao foi possivel preparar a emissao automatica de NFS-e.');
      toast.warning(`${uiError.code ? `[${uiError.code}] ` : ''}${uiError.message}`);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    if (newStatus === 'COMPLETED') {
      setCompletionAppointmentId(appointmentId);
      setCompletionPaymentMethod('');
      return;
    }

    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch {
      // tratado no hook
    }
  };

  const handleConfirmCompletion = async () => {
    if (!completionAppointmentId || !completionPaymentMethod) {
      toast.error('Selecione a forma de pagamento para concluir o atendimento.');
      return;
    }

    try {
      await updateAppointmentStatus(completionAppointmentId, 'COMPLETED', {
        paymentMethod: completionPaymentMethod,
      });
      if (selectedAppointment?.id === completionAppointmentId) {
        setSelectedAppointment((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
      }
      const apt =
        appointments.find((a) => a.id === completionAppointmentId) ??
        (selectedAppointment?.id === completionAppointmentId ? selectedAppointment : null);
      if (apt) await handleNfseOnAppointmentCompleted(apt);
      setCompletionAppointmentId(null);
      setCompletionPaymentMethod('');
    } catch {
      // tratado no hook
    }
  };

  const handleDeleteRequest = (id: string) => {
    setAppointmentToDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeletingAppointment || !appointmentToDeleteId) return;
    setIsDeletingAppointment(true);
    try {
      await deleteAppointment(appointmentToDeleteId);
      if (selectedAppointment?.id === appointmentToDeleteId) {
        setIsDetailsOpen(false);
        setSelectedAppointment(null);
      }
      setIsDeleteOpen(false);
      setAppointmentToDeleteId(null);
    } finally {
      setIsDeletingAppointment(false);
    }
  };

  const handleReassignRequest = (appointment: Appointment) => {
    if (isProfessionalUser || !canReassignAppointments) return;
    setAppointmentToReassign(appointment);
    setIsReassignOpen(true);
  };

  const handleConfirmReassign = async (professionalId: string) => {
    if (!appointmentToReassign?.id) return;
    const updated = await reassignAppointmentProfessional(appointmentToReassign.id, professionalId);
    if (selectedAppointment?.id === updated.id) setSelectedAppointment(updated);
    setAppointmentToReassign(null);
  };

  const handleViewInvoice = (appointment: Appointment) => {
    sessionStorage.setItem('invoiceAppointment', JSON.stringify({ appointment }));
    navigate('/nota-fiscal');
  };

  const reassignTargetProfessionals = useMemo(
    () => activeProfessionals.filter((p) => p.id !== appointmentToReassign?.professionalId),
    [activeProfessionals, appointmentToReassign?.professionalId],
  );

  const formattedDate = (() => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    if (viewMode === 'week') {
      const end = new Date(weekStartDate);
      end.setDate(weekStartDate.getDate() + 6);
      return `${weekStartDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  })();

  if (isLoading) {
    return (
      <MainLayout title="Agenda" subtitle="Gerencie seus agendamentos">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Agenda" subtitle="Gerencie seus agendamentos">
        <PageErrorState
          title="Nao foi possivel carregar a agenda"
          description={error}
          action={{ label: 'Tentar novamente', onClick: refetch }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Agenda" subtitle="Gerencie seus agendamentos">
      <OnboardingBanner />
      <div className="space-y-4 sm:space-y-6">
        <Card className="border-border/70 bg-card/90 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.16)]">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Operacao do dia
                </p>
                <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Leia a agenda em duas etapas: primeiro o volume do dia, depois os horarios e conflitos.
                </p>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  Use a visao diaria para execucao e a mensal para distribuicao de carga e concentracao de demanda.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-background/80">
                  {viewMode === 'day' ? 'Visao diaria' : viewMode === 'week' ? 'Visao semanal' : 'Visao mensal'}
                </Badge>
                <Badge variant="outline" className="bg-background/80">
                  {formattedDate}
                </Badge>
                <Badge variant="outline" className="bg-background/80">
                  {viewMode === 'day'
                    ? `${daySummary.total} no dia`
                    : viewMode === 'week'
                    ? `${weekAppointments.length} na semana`
                    : `${totalAppointmentsInMonth} no mes`}
                </Badge>
              </div>
            </div>

            {!hintsDismissed && (
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Leitura principal
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">Volume, pendencias e execução</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Priorize pendências e atendimentos em andamento antes de descer para detalhes finos do dia.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Navegacao
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">Dia para execução, mês para distribuição</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Alterne a visão conforme a tarefa: operar horários ou enxergar concentração de demanda no calendário.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4 relative">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Proximo passo
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">Defina contexto e então aja</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Primeiro escolha profissional, status e período; depois abra o agendamento ou registre um novo horário.
                  </p>
                  <button
                    onClick={dismissHints}
                    className="absolute right-3 top-3 text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Não mostrar mais
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Agendados</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{viewMode === 'day' ? daySummary.total : totalAppointmentsInMonth}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Clock3 className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">Pendentes</p>
                    <p className="mt-1 text-2xl font-semibold text-amber-950 dark:text-amber-50">{daySummary.pending}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <Info className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 p-3 dark:border-blue-500/20 dark:bg-blue-500/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">Em atendimento</p>
                    <p className="mt-1 text-2xl font-semibold text-blue-950 dark:text-blue-50">{daySummary.inProgress}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Concluidos</p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-950 dark:text-emerald-50">{daySummary.completed}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate('prev')}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  aria-label={viewMode === 'day' ? 'Ir para o dia anterior' : viewMode === 'week' ? 'Semana anterior' : 'Ir para o mes anterior'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} className="text-xs sm:text-sm">Hoje</Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate('next')}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  aria-label={viewMode === 'day' ? 'Ir para o proximo dia' : viewMode === 'week' ? 'Proxima semana' : 'Ir para o proximo mes'}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="min-w-0 flex-1 text-xs font-medium text-foreground capitalize sm:text-base xl:max-w-[260px]">
                  {formattedDate}
                </span>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 xl:w-auto xl:justify-end">
            {!isProfessionalUser ? (
              <Select value={effectiveSelectedProfessional || selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger className="h-8 w-full text-xs sm:h-9 sm:w-44 sm:text-sm">
                  <SelectValue placeholder="Profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {activeProfessionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex h-8 w-full items-center rounded-md border bg-muted/40 px-3 text-xs text-muted-foreground sm:h-9 sm:min-w-44 sm:w-auto sm:text-sm">
                {loggedProfessional?.name || 'Profissional logado'}
              </div>
            )}

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8 w-full text-xs sm:h-9 sm:w-44 sm:text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                <SelectItem value="IN_PROGRESS">Em atendimento</SelectItem>
                <SelectItem value="COMPLETED">Concluido</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                <SelectItem value="NO_SHOW">Nao compareceu</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex w-full overflow-hidden rounded-lg border sm:w-auto">
              <Button
                variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setViewMode('day'); setDayAppointmentsFallback(null); }}
                className="rounded-none text-xs sm:text-sm h-8 sm:h-9"
              >
                Dia
              </Button>
              <Button
                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="rounded-none border-x text-xs sm:text-sm h-8 sm:h-9"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="rounded-none text-xs sm:text-sm h-8 sm:h-9"
              >
                Mensal
              </Button>
            </div>

            <Button size="sm" className="h-8 w-full gap-1 text-xs sm:h-9 sm:w-auto sm:gap-2 sm:text-sm" onClick={() => setIsNewAppointmentOpen(true)}>
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="sm:hidden">Novo agendamento</span>
              <span className="hidden sm:inline">Novo Agendamento</span>
            </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!hintsDismissed && (
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertTitle>Fluxo de atendimento</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{"Para concluir um atendimento, siga sempre esta sequencia: Confirmado -> Em atendimento -> Concluido."}</span>
              <button
                onClick={dismissHints}
                className="shrink-0 text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Entendi
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Views */}
        {viewMode === 'month' ? (
          <AgendaMonthView
            currentDate={currentDate}
            monthCalendarDays={monthCalendarDays}
            monthAppointmentsByDay={monthAppointmentsByDay}
            totalAppointmentsInMonth={totalAppointmentsInMonth}
            onDayClick={openDayView}
          />
        ) : viewMode === 'week' ? (
          isLoadingWeek ? (
            <div className="space-y-3">
              <div className="h-10 w-full animate-pulse rounded-xl bg-muted/40" />
              <div className="h-96 w-full animate-pulse rounded-xl bg-muted/30" />
            </div>
          ) : (
            <AgendaWeekView
              currentDate={currentDate}
              appointments={weekAppointments}
              onAppointmentClick={(apt) => { setSelectedAppointment(apt); setIsDetailsOpen(true); }}
              onNewAppointmentSlot={(date, _time) => {
                setCurrentDate(date);
                setIsNewAppointmentOpen(true);
              }}
            />
          )
        ) : (
          <AgendaDayView
            appointments={filteredAppointments}
            professionals={professionals}
            formattedDate={formattedDate}
            pagination={pagination}
            isProfessionalUser={isProfessionalUser}
            canReassignAppointments={canReassignAppointments}
            columnMode={isColumnMode}
            activeProfessionals={activeProfessionals}
            onAppointmentClick={(apt) => { setSelectedAppointment(apt); setIsDetailsOpen(true); }}
            onStatusChange={handleStatusChange}
            onDeleteRequest={handleDeleteRequest}
            onReassignRequest={handleReassignRequest}
            onPageChange={goToPage}
          />
        )}

        {/* Dialogs */}
        <NewAppointmentDialog
          open={isNewAppointmentOpen}
          onOpenChange={setIsNewAppointmentOpen}
          currentDate={currentDate}
          isProfessionalUser={isProfessionalUser}
          loggedProfessional={loggedProfessional}
          activeProfessionals={activeProfessionals}
          createAppointment={createAppointment}
        />

        <AppointmentDetailsSheet
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          appointment={selectedAppointment}
          professionals={professionals}
          services={[]}
          clients={[]}
          isProfessionalUser={isProfessionalUser}
          canReassignAppointments={canReassignAppointments}
          onStatusChange={handleStatusChange}
          onDeleteRequest={handleDeleteRequest}
          onReassignRequest={(apt) => { handleReassignRequest(apt); setIsDetailsOpen(false); }}
          onViewInvoice={handleViewInvoice}
          onEditSuccess={refetch}
        />

        <ReassignAppointmentDialog
          open={isReassignOpen}
          onOpenChange={setIsReassignOpen}
          appointment={appointmentToReassign}
          professionals={reassignTargetProfessionals}
          onConfirm={handleConfirmReassign}
        />

        <DeleteConfirmationDialog
          open={isDeleteOpen}
          isLoading={isDeletingAppointment}
          title="Excluir agendamento?"
          description="Voce tem certeza que deseja excluir este agendamento? Esta acao nao pode ser desfeita."
          cancelLabel="Cancelar"
          confirmLabel="Confirmar exclusao"
          loadingLabel="Excluindo..."
          onOpenChange={(open) => {
            if (isDeletingAppointment) return;
            setIsDeleteOpen(open);
            if (!open) setAppointmentToDeleteId(null);
          }}
          onConfirm={handleConfirmDelete}
        />

        <Dialog
          open={!!completionAppointmentId}
          onOpenChange={(open) => {
            if (!open) {
              setCompletionAppointmentId(null);
              setCompletionPaymentMethod('');
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Concluir atendimento</DialogTitle>
              <DialogDescription>
                Selecione a forma de pagamento para registrar a receita automatica deste atendimento.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Select
                value={completionPaymentMethod || undefined}
                onValueChange={(value) => setCompletionPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCompletionAppointmentId(null);
                  setCompletionPaymentMethod('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={() => void handleConfirmCompletion()} disabled={!completionPaymentMethod}>
                Concluir atendimento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
