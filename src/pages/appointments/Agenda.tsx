import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Calendar, ChevronLeft, ChevronRight, Info, Plus, ShoppingCart, Users, Wallet } from 'lucide-react';
import { PageErrorState } from '@/components/ui/page-states';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
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
import { toDateKey, formatCurrency } from '@/lib/format';
import { getAppointmentItems } from '@/lib/appointment-status';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { PaymentMethod } from '@/types';
import type { AppointmentConclusionAction } from '@/lib/api';
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner';
import { useCashClosingGuard } from '@/hooks/useCashClosingGuard';
import { CashClosingGuardDialog } from '@/components/financial/CashClosingGuardDialog';
import { TutorialLauncherButton } from '@/components/tutorial/TutorialLauncherButton';
import { useTourStore } from '@/components/tutorial/tour-store';
import { AGENDA_TOUR_FULL_ID, AGENDA_TOUR_MODULE_OPTIONS } from '@/components/appointments/tutorial/agenda-tours';

// Metodos aceitos pelo backend para "Pagar agora" (fecha a comanda na hora,
// exige confirmacao instantanea) - Pix e Outro exigem o fluxo assincrono da
// tela de Comandas (QR code Asaas / lancamento manual).
const APPOINTMENT_PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartao de credito' },
  { value: 'DEBIT_CARD', label: 'Cartao de debito' },
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
  const [prefilledSlot, setPrefilledSlot] = useState<{ time: string; professionalId?: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [appointmentToReassign, setAppointmentToReassign] = useState<Appointment | null>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [appointmentToDeleteId, setAppointmentToDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);
  const [completionAppointment, setCompletionAppointment] = useState<Appointment | null>(null);
  const [completionPaymentMethod, setCompletionPaymentMethod] = useState<PaymentMethod | ''>('');
  const [completionAction, setCompletionAction] = useState<AppointmentConclusionAction | null>(null);
  const [isNfseConfirmOpen, setIsNfseConfirmOpen] = useState(false);
  const [nfseConfirmUrl, setNfseConfirmUrl] = useState('');
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [focusNotesOnDetailsOpen, setFocusNotesOnDetailsOpen] = useState(false);

  const {
    guardState,
    checkAfterCompletion,
    dismissGuard,
    openCashForToday,
    closeStaleAndOpenToday,
    keepStaleOpen,
  } = useCashClosingGuard();

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

  // Visao semanal (sem paginacao, busca dia a dia via multiplos requests -
  // a API so aceita data unica). React Query cacheia por chave de filtro:
  // trocar so o status ou o profissional reaproveita as semanas ja buscadas
  // em vez de refazer as 7 chamadas do zero a cada troca.
  const weekStartKey = toDateKey(weekStartDate);
  const { data: weekAppointmentsData, isFetching: isLoadingWeek, error: weekError } = useQuery({
    queryKey: ['agenda-week', weekStartKey, selectedProfessional, selectedStatus],
    queryFn: async () => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStartDate);
        d.setDate(weekStartDate.getDate() + i);
        return toDateKey(d);
      });

      const results = await Promise.all(
        days.map((date) =>
          appointmentsApi.getAll({
            date,
            page: 1,
            limit: 100,
            professionalId: selectedProfessional !== 'all' ? selectedProfessional : undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
          }),
        ),
      );
      return results.flatMap((r) =>
        Array.isArray(r) ? r : ((r as { items?: Appointment[] }).items ?? []),
      );
    },
    enabled: viewMode === 'week',
    staleTime: 60_000,
  });
  const weekAppointments = weekAppointmentsData ?? [];

  useEffect(() => {
    if (weekError) toast.error('Não foi possível carregar os agendamentos da semana.');
  }, [weekError]);

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

  const startTourIfNeverSeen = useTourStore((state) => state.startTourIfNeverSeen);
  // Tutorial guiado da agenda: inicia sozinho so no primeiro acesso (persistido
  // por tour+versao) e so depois que a pagina termina de carregar, para o
  // primeiro passo encontrar o elemento de cara em vez de disputar com o loading.
  useEffect(() => {
    if (isLoading || error) return;
    const timer = window.setTimeout(() => startTourIfNeverSeen(AGENDA_TOUR_FULL_ID), 600);
    return () => window.clearTimeout(timer);
  }, [isLoading, error, startTourIfNeverSeen]);

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

  const handleNewFromSlot = (time: string, professionalId?: string) => {
    setPrefilledSlot({ time, professionalId });
    setIsNewAppointmentOpen(true);
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
      .catch(() => { if (active) { toast.error('Não foi possível carregar os totais mensais.'); setMonthlyMetrics([]); } })
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
      // Contagens separadas por status, no mesmo grau de detalhe do filtro de
      // status acima - "pendente" e "confirmado" nao sao a mesma coisa para
      // quem esta lendo o resumo.
      pending: source.filter((appointment) => appointment.status === 'PENDING').length,
      confirmed: source.filter((appointment) => appointment.status === 'CONFIRMED').length,
      inProgress: source.filter((appointment) => appointment.status === 'IN_PROGRESS').length,
      completed: source.filter((appointment) => appointment.status === 'COMPLETED').length,
    };
  }, [filteredAppointments]);

  // Um agendamento pode estar selecionado (sheet aberto), na lista do dia/mes
  // ja carregada, ou so na lista da semana (que vive fora de useAppointments) -
  // confere as tres fontes antes de desistir.
  const findAppointmentById = (id: string): Appointment | null =>
    (selectedAppointment?.id === id ? selectedAppointment : null) ??
    filteredAppointments.find((a) => a.id === id) ??
    weekAppointments.find((a) => a.id === id) ??
    null;

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
        naturezaOperacao: 'Prestação de serviço',
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
            descricaoServico: item.service?.name || `Serviço ${index + 1}`,
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

      const targetUrl = `/fiscal/nfse/nova?appointmentId=${encodeURIComponent(appointment.id)}`;

      if (config.emissionMode === 'ASK_ON_CLOSE') {
        setNfseConfirmUrl(targetUrl);
        setIsNfseConfirmOpen(true);
        return;
      }

      toast.info('Fluxo NFS-e preparado a partir do agendamento concluído.');
      navigate(targetUrl);
    } catch (err) {
      const uiError = resolveUiError(err, 'Não foi possível preparar a emissão automática de NFS-e.');
      toast.warning(`${uiError.code ? `[${uiError.code}] ` : ''}${uiError.message}`);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    if (newStatus === 'COMPLETED') {
      // Gate unico: antes so o sheet bloqueava o botao quando faltava registro
      // operacional (careNotes vazio) - o menu da grade abria o mesmo dialogo
      // de conclusao sem checar nada. Concluir gera receita, comissao e baixa
      // de estoque, entao os dois caminhos tem que respeitar a mesma regra.
      try {
        const detail = await appointmentsApi.getById(appointmentId);
        if (!detail.careNotes || detail.careNotes.length === 0) {
          toast.error('Registre ao menos um detalhe do atendimento antes de concluir.');
          setSelectedAppointment(findAppointmentById(appointmentId) ?? detail.appointment);
          setFocusNotesOnDetailsOpen(true);
          setIsDetailsOpen(true);
          return;
        }
      } catch (err) {
        toast.error(resolveUiError(err, 'Não foi possível verificar o registro do atendimento.').message);
        return;
      }
      setCompletionAppointment(findAppointmentById(appointmentId));
      setCompletionPaymentMethod('');
      setCompletionAction(null);
      return;
    }

    if (newStatus === 'CANCELLED') {
      setAppointmentToCancel(findAppointmentById(appointmentId));
      return;
    }

    try {
      const atualizado = await updateAppointmentStatus(appointmentId, newStatus);
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      if (newStatus === 'IN_PROGRESS' && atualizado?.comandaId) {
        navigate(`/pos/${atualizado.comandaId}`);
      }
    } catch {
      // tratado no hook
    }
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setIsCancelling(true);
    try {
      await updateAppointmentStatus(appointmentToCancel.id, 'CANCELLED');
      if (selectedAppointment?.id === appointmentToCancel.id) {
        setSelectedAppointment((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      }
      setAppointmentToCancel(null);
    } catch {
      // tratado no hook
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!completionAppointment || !completionAction) {
      toast.error('Selecione o que fazer com este atendimento para concluir.');
      return;
    }
    if (completionAction === 'PAY_NOW' && !completionPaymentMethod) {
      toast.error('Selecione a forma de pagamento para concluir com pagamento agora.');
      return;
    }

    try {
      const payload: Parameters<typeof updateAppointmentStatus>[2] = {
        conclusionAction: completionAction,
      };
      if (completionAction === 'PAY_NOW' && completionPaymentMethod) {
        payload.paymentMethod = completionPaymentMethod;
      }
      await updateAppointmentStatus(completionAppointment.id, 'COMPLETED', payload);
      if (selectedAppointment?.id === completionAppointment.id) {
        setSelectedAppointment((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
      }
      await handleNfseOnAppointmentCompleted(completionAppointment);
      setCompletionAppointment(null);
      setCompletionPaymentMethod('');
      setCompletionAction(null);
      void checkAfterCompletion();
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
          title="Não foi possível carregar a agenda"
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
        <Card
          data-tour="agenda-summary"
          className="border-border/70 bg-card/95 shadow-panel"
        >
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Operação do dia
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {/* Contexto (o que estou vendo) separado por proximidade dos
                    contadores de status (o que precisa de atencao) - mesmo
                    peso visual, mas agrupados por significado. */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="bg-background/80">
                    {viewMode === 'day' ? 'Visão diária' : viewMode === 'week' ? 'Visão semanal' : 'Visão mensal'}
                  </Badge>
                  <Badge variant="outline" className="bg-background/80">
                    {formattedDate}
                  </Badge>
                  <Badge variant="outline" className="bg-background/80">
                    {viewMode === 'day'
                      ? `${daySummary.total} no dia`
                      : viewMode === 'week'
                      ? `${weekAppointments.length} na semana`
                      : `${totalAppointmentsInMonth} no mês`}
                  </Badge>
                </div>
                {viewMode === 'day' &&
                  (daySummary.pending > 0 || daySummary.confirmed > 0 || daySummary.inProgress > 0 || daySummary.completed > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {daySummary.pending > 0 && (
                      <Badge variant="outline" className="gap-1.5 bg-background/80">
                        <Info className="h-3 w-3" />
                        {daySummary.pending} pendente{daySummary.pending === 1 ? '' : 's'}
                      </Badge>
                    )}
                    {daySummary.confirmed > 0 && (
                      <Badge variant="outline" className="gap-1.5 bg-background/80">
                        <Info className="h-3 w-3" />
                        {daySummary.confirmed} confirmado{daySummary.confirmed === 1 ? '' : 's'}
                      </Badge>
                    )}
                    {daySummary.inProgress > 0 && (
                      <Badge variant="outline" className="gap-1.5 bg-background/80">
                        <Users className="h-3 w-3" />
                        {daySummary.inProgress} em atendimento
                      </Badge>
                    )}
                    {daySummary.completed > 0 && (
                      <Badge variant="outline" className="gap-1.5 bg-background/80">
                        <Calendar className="h-3 w-3" />
                        {daySummary.completed} concluído{daySummary.completed === 1 ? '' : 's'}
                      </Badge>
                    )}
                  </div>
                )}
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
                    Próximo passo
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

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div data-tour="agenda-date-nav" className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  size="icon"
                  onClick={() => navigateDate('prev')}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  aria-label={viewMode === 'day' ? 'Ir para o dia anterior' : viewMode === 'week' ? 'Semana anterior' : 'Ir para o mês anterior'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} className="text-xs sm:text-sm">Hoje</Button>
                <Button
                  size="icon"
                  onClick={() => navigateDate('next')}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  aria-label={viewMode === 'day' ? 'Ir para o próximo dia' : viewMode === 'week' ? 'Próxima semana' : 'Ir para o próximo mês'}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="min-w-0 flex-1 text-xs font-medium text-foreground capitalize sm:text-base xl:max-w-[260px]">
                  {formattedDate}
                </span>
              </div>

              <div className="flex w-full flex-wrap items-center gap-3 sm:gap-4 xl:w-auto xl:justify-end">
                {/* Filtros (o que estou olhando) agrupados por proximidade,
                    separados das acoes (o que vou fazer agora) por um gap
                    maior que o interno de cada grupo. */}
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
                  {!isProfessionalUser ? (
                    <Select value={effectiveSelectedProfessional || selectedProfessional} onValueChange={setSelectedProfessional}>
                      <SelectTrigger data-tour="agenda-filter-professional" className="h-8 w-full text-xs sm:h-9 sm:w-44 sm:text-sm">
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
                    <div data-tour="agenda-filter-professional" className="flex h-8 w-full items-center rounded-md border bg-muted/40 px-3 text-xs text-muted-foreground sm:h-9 sm:min-w-44 sm:w-auto sm:text-sm">
                      {loggedProfessional?.name || 'Profissional logado'}
                    </div>
                  )}

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger data-tour="agenda-filter-status" className="h-8 w-full text-xs sm:h-9 sm:w-44 sm:text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos status</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em atendimento</SelectItem>
                      <SelectItem value="COMPLETED">Concluído</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      <SelectItem value="NO_SHOW">Não compareceu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
                  <div data-tour="agenda-view-toggle" className="flex w-full overflow-hidden rounded-lg border sm:w-auto">
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

                  <Button
                    data-tour="agenda-new-appointment-button"
                    size="sm"
                    className="h-8 w-full gap-1 text-xs sm:h-9 sm:w-auto sm:gap-2 sm:text-sm"
                    onClick={() => setIsNewAppointmentOpen(true)}
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="sm:hidden">Novo agendamento</span>
                    <span className="hidden sm:inline">Novo Agendamento</span>
                  </Button>

                  <TutorialLauncherButton
                    fullTour={{ id: AGENDA_TOUR_FULL_ID, label: 'Tour completo da agenda' }}
                    modules={AGENDA_TOUR_MODULE_OPTIONS}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!hintsDismissed && (
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertTitle>Fluxo de atendimento</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{"Para concluir um atendimento, siga sempre esta sequência: Confirmado → Em atendimento → Concluído."}</span>
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
            isToday={dateString === toDateKey(new Date())}
            pagination={pagination}
            isProfessionalUser={isProfessionalUser}
            canReassignAppointments={canReassignAppointments}
            columnMode={isColumnMode}
            activeProfessionals={activeProfessionals}
            onNewAppointmentFromSlot={handleNewFromSlot}
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
          onOpenChange={(open) => { setIsNewAppointmentOpen(open); if (!open) setPrefilledSlot(null); }}
          currentDate={currentDate}
          isProfessionalUser={isProfessionalUser}
          loggedProfessional={loggedProfessional}
          activeProfessionals={activeProfessionals}
          createAppointment={createAppointment}
          initialTime={prefilledSlot?.time}
          initialProfessionalId={prefilledSlot?.professionalId}
        />

        <AppointmentDetailsSheet
          open={isDetailsOpen}
          onOpenChange={(open) => {
            setIsDetailsOpen(open);
            if (!open) setFocusNotesOnDetailsOpen(false);
          }}
          appointment={selectedAppointment}
          professionals={professionals}
          services={[]}
          clients={[]}
          isProfessionalUser={isProfessionalUser}
          canReassignAppointments={canReassignAppointments}
          focusNotesOnOpen={focusNotesOnDetailsOpen}
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
          description="Você tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."
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
          open={!!completionAppointment}
          onOpenChange={(open) => {
            if (!open) {
              setCompletionAppointment(null);
              setCompletionPaymentMethod('');
              setCompletionAction(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Concluir atendimento</DialogTitle>
              <DialogDescription>
                O que fazer com o valor deste atendimento?
              </DialogDescription>
            </DialogHeader>
            {completionAppointment ? (
              <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                <p className="text-sm font-semibold text-foreground">
                  {completionAppointment.client?.name || 'Cliente'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getAppointmentItems(completionAppointment)
                    .map((item) => item.service?.name)
                    .filter((name): name is string => !!name)
                    .join(', ') || 'Serviço'}
                  {' · '}
                  {professionals.find((p) => p.id === completionAppointment.professionalId)?.name || 'Profissional'}
                </p>
                <p className="mt-1 text-lg font-semibold text-primary">
                  {formatCurrency(
                    Number(
                      completionAppointment.totalPrice ||
                        getAppointmentItems(completionAppointment).reduce(
                          (sum, item) => sum + Number(item.totalPrice || 0),
                          0,
                        ),
                    ),
                  )}
                </p>
              </div>
            ) : null}
            <div className="space-y-3 py-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCompletionAction('ADD_TO_COMANDA')}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                    completionAction === 'ADD_TO_COMANDA'
                      ? 'border-primary bg-primary/5'
                      : 'border-border/70 hover:bg-accent'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <ShoppingCart className="h-4 w-4" />
                    Adicionar em uma comanda
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Vincula o serviço a uma comanda. Nada é lançado no caixa agora - só quando a
                    comanda for paga.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletionAction('PAY_NOW')}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                    completionAction === 'PAY_NOW'
                      ? 'border-primary bg-primary/5'
                      : 'border-border/70 hover:bg-accent'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Wallet className="h-4 w-4" />
                    Pagar agora
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Recebe o pagamento na hora e ja lanca a receita no caixa.
                  </span>
                </button>
              </div>

              {completionAction === 'PAY_NOW' ? (
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
              ) : null}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCompletionAppointment(null);
                  setCompletionPaymentMethod('');
                  setCompletionAction(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => void handleConfirmCompletion()}
                disabled={!completionAction || (completionAction === 'PAY_NOW' && !completionPaymentMethod)}
              >
                Concluir atendimento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={!!appointmentToCancel}
          title="Cancelar agendamento?"
          description={
            appointmentToCancel ? (
              <>
                Você vai cancelar o agendamento de{' '}
                <strong className="text-foreground">{appointmentToCancel.client?.name || 'cliente'}</strong> em{' '}
                {new Date(`${toDateKey(appointmentToCancel.date)}T12:00:00`).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                })}{' '}
                às {appointmentToCancel.startTime}. Esta ação não pode ser desfeita e o horário fica livre para novo
                agendamento.
              </>
            ) : (
              'Esta ação não pode ser desfeita.'
            )
          }
          isLoading={isCancelling}
          cancelLabel="Manter agendamento"
          confirmLabel="Cancelar agendamento"
          loadingLabel="Cancelando..."
          confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onOpenChange={(open) => {
            if (isCancelling) return;
            if (!open) setAppointmentToCancel(null);
          }}
          onConfirm={() => void handleConfirmCancel()}
        />
      </div>

      <Dialog open={isNfseConfirmOpen} onOpenChange={setIsNfseConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Emitir NFS-e</DialogTitle>
            <DialogDescription>
              Atendimento concluído. Deseja abrir a emissão da NFS-e agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNfseConfirmOpen(false)}>
              Agora nao
            </Button>
            <Button
              onClick={() => {
                setIsNfseConfirmOpen(false);
                toast.info('Fluxo NFS-e preparado a partir do agendamento concluído.');
                navigate(nfseConfirmUrl);
              }}
            >
              Emitir NFS-e
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CashClosingGuardDialog
        guardState={guardState}
        onOpenToday={openCashForToday}
        onCloseStaleAndOpenToday={closeStaleAndOpenToday}
        onKeepStaleOpen={keepStaleOpen}
        onDismiss={dismissGuard}
      />
    </MainLayout>
  );
}
