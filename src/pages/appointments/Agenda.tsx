import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Info, Plus } from 'lucide-react';
import { PageErrorState } from '@/components/ui/page-states';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { NewAppointmentDialog } from '@/components/appointments/NewAppointmentDialog';
import { AppointmentDetailsSheet } from '@/components/appointments/AppointmentDetailsSheet';
import { ReassignAppointmentDialog } from '@/components/appointments/ReassignAppointmentDialog';
import { AgendaDayView } from '@/components/appointments/AgendaDayView';
import { AgendaMonthView } from '@/components/appointments/AgendaMonthView';
import { useAppointments, type Appointment } from '@/hooks/useAppointments';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentsApi, nfseApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toDateKey } from '@/lib/format';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Agenda() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Navegação e view ──────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [dayAppointmentsFallback, setDayAppointmentsFallback] = useState<Appointment[] | null>(null);

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // ── Dialogs ───────────────────────────────────────────────────────────────
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [appointmentToReassign, setAppointmentToReassign] = useState<Appointment | null>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [appointmentToDeleteId, setAppointmentToDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);

  // ── Métricas mensais ──────────────────────────────────────────────────────
  const [monthlyMetrics, setMonthlyMetrics] = useState<Array<{ dia: number; quantidadeAgendamentos: number }>>([]);
  const [isLoadingMonthlyMetrics, setIsLoadingMonthlyMetrics] = useState(false);

  // ── Data hooks ────────────────────────────────────────────────────────────
  const dateString = toDateKey(currentDate);
  const dateFilter = viewMode === 'day' ? dateString : undefined;

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
    { defaultLimit: 20, enabled: viewMode === 'day' },
  );

  const { professionals } = useProfessionals();
  const activeProfessionals = professionals.filter((p) => p.isActive);
  const canReassignAppointments = activeProfessionals.length > 1;

  const loggedProfessional = useMemo(
    () => activeProfessionals.find((p) => p.userId === user?.id) ?? null,
    [activeProfessionals, user?.id],
  );
  const isProfessionalUser = user?.role === 'PROFESSIONAL';

  const effectiveSelectedProfessional = isProfessionalUser
    ? loggedProfessional?.id || ''
    : selectedProfessional;

  // Forçar filtro de profissional para usuário do tipo PROFESSIONAL
  useEffect(() => {
    if (!isProfessionalUser || !loggedProfessional?.id) return;
    setSelectedProfessional(loggedProfessional.id);
  }, [isProfessionalUser, loggedProfessional?.id]);

  // ── Navegação de data ────────────────────────────────────────────────────
  const navigateDate = (direction: 'prev' | 'next') => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + (direction === 'next' ? 1 : -1));
      setDayAppointmentsFallback(null);
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

  // ── Métricas mensais ──────────────────────────────────────────────────────
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

  // ── Cálculos do calendário mensal ────────────────────────────────────────
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

  // ── Appointments filtrados para o dia ────────────────────────────────────
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

  // ── Handlers de status / NFS-e ───────────────────────────────────────────
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

      if (config.emissionMode === 'ASK_ON_CLOSE') {
        const shouldOpen = window.confirm('Atendimento concluído. Deseja abrir a emissão da NFS-e agora?');
        if (!shouldOpen) return;
      }

      toast.info('Fluxo NFS-e preparado a partir do agendamento concluído.');
      navigate(`/fiscal/nfse/nova?appointmentId=${encodeURIComponent(appointment.id)}`);
    } catch (err) {
      const uiError = resolveUiError(err, 'Não foi possível preparar a emissão automática de NFS-e.');
      toast.warning(`${uiError.code ? `[${uiError.code}] ` : ''}${uiError.message}`);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      if (newStatus === 'COMPLETED') {
        const apt =
          appointments.find((a) => a.id === appointmentId) ??
          (selectedAppointment?.id === appointmentId ? selectedAppointment : null);
        if (apt) await handleNfseOnAppointmentCompleted(apt);
      }
    } catch {
      // tratado no hook
    }
  };

  // ── Handlers de delete ────────────────────────────────────────────────────
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

  // ── Handlers de reassign ──────────────────────────────────────────────────
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

  // ── Handler de nota fiscal ────────────────────────────────────────────────
  const handleViewInvoice = (appointment: Appointment) => {
    sessionStorage.setItem('invoiceAppointment', JSON.stringify({ appointment }));
    navigate('/nota-fiscal');
  };

  // ── Profissionais para reassign (exclui o atual) ─────────────────────────
  const reassignTargetProfessionals = useMemo(
    () => activeProfessionals.filter((p) => p.id !== appointmentToReassign?.professionalId),
    [activeProfessionals, appointmentToReassign?.professionalId],
  );

  const formattedDate =
    viewMode === 'day'
      ? currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      : currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // ── Loading / Error states ────────────────────────────────────────────────
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          {/* Navegação de data */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
              className="h-8 w-8 sm:h-9 sm:w-9"
              aria-label={viewMode === 'day' ? 'Ir para o dia anterior' : 'Ir para o mes anterior'}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs sm:text-sm">Hoje</Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
              className="h-8 w-8 sm:h-9 sm:w-9"
              aria-label={viewMode === 'day' ? 'Ir para o proximo dia' : 'Ir para o proximo mes'}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-xs sm:text-base font-medium text-foreground capitalize truncate">{formattedDate}</span>
          </div>

          {/* Filtros e ações */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {!isProfessionalUser ? (
              <Select value={effectiveSelectedProfessional || selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger className="w-36 sm:w-44 h-8 sm:h-9 text-xs sm:text-sm">
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
              <div className="h-8 sm:h-9 min-w-36 sm:min-w-44 rounded-md border bg-muted/40 px-3 flex items-center text-xs sm:text-sm text-muted-foreground">
                {loggedProfessional?.name || 'Profissional logado'}
              </div>
            )}

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-36 sm:w-44 h-8 sm:h-9 text-xs sm:text-sm">
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

            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setViewMode('day'); setDayAppointmentsFallback(null); }}
                className="rounded-none text-xs sm:text-sm h-8 sm:h-9"
              >
                Dia
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

            <Button size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm" onClick={() => setIsNewAppointmentOpen(true)}>
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Novo</span> Agendamento
            </Button>
          </div>
        </div>

        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertTitle>Fluxo de atendimento</AlertTitle>
          <AlertDescription>
            Para concluir um atendimento, siga sempre esta sequência: Confirmado → Em atendimento → Concluído.
          </AlertDescription>
        </Alert>

        {/* Views */}
        {viewMode === 'month' ? (
          <AgendaMonthView
            currentDate={currentDate}
            monthCalendarDays={monthCalendarDays}
            monthAppointmentsByDay={monthAppointmentsByDay}
            totalAppointmentsInMonth={totalAppointmentsInMonth}
            onDayClick={openDayView}
          />
        ) : (
          <AgendaDayView
            appointments={filteredAppointments}
            professionals={professionals}
            formattedDate={formattedDate}
            pagination={pagination}
            isProfessionalUser={isProfessionalUser}
            canReassignAppointments={canReassignAppointments}
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
          confirmLabel="Confirmar exclusão"
          loadingLabel="Excluindo..."
          onOpenChange={(open) => {
            if (isDeletingAppointment) return;
            setIsDeleteOpen(open);
            if (!open) setAppointmentToDeleteId(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </MainLayout>
  );
}
