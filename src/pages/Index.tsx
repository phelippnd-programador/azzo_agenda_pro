import { useCallback, useEffect, useState } from 'react';
import { RankedBarCard } from '@/components/common/RankedBarCard';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { MonthlyRevenueLineChart } from '@/components/dashboard/MonthlyRevenueLineChart';
import { NoShowInsights } from '@/components/dashboard/NoShowInsights';
import { WhatsAppReactivationChart } from '@/components/dashboard/WhatsAppReactivationChart';
import { WhatsAppReactivationQueue } from '@/components/dashboard/WhatsAppReactivationQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageErrorState, PageEmptyState } from '@/components/ui/page-states';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, DollarSign, Users, TrendingUp, Clock, CheckCircle, Route, UserCheck, CalendarClock, ClipboardCheck } from 'lucide-react';
import { useDashboardWithOptions } from '@/hooks/useDashboard';
import { useAppointments } from '@/hooks/useAppointments';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/api';
import { shouldForceLogoutOnDashboardRetry } from '@/lib/dashboard-auth-retry';
import type { DashboardCustomerRankingResponse } from '@/types';
import type { DashboardProfessionalMetricsResponse } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

const normalizeDateToIso = (value: unknown) => {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().split('T')[0];
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }
  return '';
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const isProfessionalUser = user?.role === 'PROFESSIONAL';
  const [customerRanking, setCustomerRanking] = useState<DashboardCustomerRankingResponse | null>(null);
  const [professionalMetrics, setProfessionalMetrics] = useState<DashboardProfessionalMetricsResponse | null>(null);
  const [professionalMetricsLoading, setProfessionalMetricsLoading] = useState(false);
  const [professionalMetricsError, setProfessionalMetricsError] = useState<string | null>(null);
  const { metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } =
    useDashboardWithOptions({ enabled: !isProfessionalUser });
  const { appointments, isLoading: appointmentsLoading, updateAppointmentStatus } = useAppointments();
  const {
    professionals,
    isLoading: professionalsLoading,
  } = useProfessionals({ fetchLimits: false });

  const loggedProfessional = professionals.find((professional) => professional.userId === user?.id) ?? null;
  const scopedAppointments =
    isProfessionalUser && loggedProfessional?.id
      ? appointments.filter((appointment) => appointment.professionalId === loggedProfessional.id)
      : appointments;

  useEffect(() => {
    if (!isProfessionalUser) {
      refetchMetrics();
    }
  }, [isProfessionalUser, refetchMetrics]);

  useEffect(() => {
    let mounted = true;
    const todayDate = new Date();
    const start = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).toISOString().split('T')[0];
    const end = todayDate.toISOString().split('T')[0];

    dashboardApi
      .getCustomerMetrics(start, end, 5)
      .then((data) => {
        if (!mounted) return;
        setCustomerRanking(data);
      })
      .catch(() => {
        if (!mounted) return;
        setCustomerRanking(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthStartIso = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const monthEndIso = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const fetchProfessionalMetrics = useCallback(async () => {
    if (!isProfessionalUser || !loggedProfessional?.id) {
      setProfessionalMetrics(null);
      setProfessionalMetricsError(null);
      setProfessionalMetricsLoading(false);
      return;
    }

    try {
      setProfessionalMetricsLoading(true);
      const data = await dashboardApi.getProfessionalMetrics(monthStartIso, monthEndIso, loggedProfessional.id);
      setProfessionalMetrics(data);
      setProfessionalMetricsError(null);
    } catch (error) {
      setProfessionalMetrics(null);
      setProfessionalMetricsError(
        error instanceof Error ? error.message : 'Erro ao carregar metricas do profissional'
      );
    } finally {
      setProfessionalMetricsLoading(false);
    }
  }, [isProfessionalUser, loggedProfessional?.id, monthEndIso, monthStartIso]);

  useEffect(() => {
    if (!isProfessionalUser) return;
    void fetchProfessionalMetrics();
  }, [fetchProfessionalMetrics, isProfessionalUser]);

  const todayAppointments = scopedAppointments
    .filter((appointment) => normalizeDateToIso(appointment.date) === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const enrichedAppointments = todayAppointments.map((apt) => {
    const professional = professionals.find((p) => p.id === apt.professionalId);
    const items = apt.items?.map((item) => ({
      ...item,
      service: item.service,
    }));

    return {
      ...apt,
      professional,
      items,
    };
  });

  const activeProfessionals = isProfessionalUser
    ? professionals.filter((professional) => professional.id === loggedProfessional?.id && professional.isActive)
    : professionals.filter((professional) => professional.isActive);

  const topProfessionalItems = !isProfessionalUser
    ? professionals
        .map((professional) => {
          const professionalAppointments = appointments.filter((appointment) => {
            const iso = normalizeDateToIso(appointment.date);
            return (
              appointment.professionalId === professional.id &&
              appointment.status === 'COMPLETED' &&
              !!iso &&
              iso >= monthStartIso &&
              iso <= monthEndIso
            );
          });

          const clientsServed = new Set(professionalAppointments.map((appointment) => appointment.clientId)).size;
          const revenueTotal = professionalAppointments.reduce(
            (sum, appointment) => sum + (appointment.totalPrice || 0),
            0
          );

          return {
            id: professional.id,
            name: professional.name,
            value: professionalAppointments.length,
            badgeText:
              professionalAppointments.length > 0 ? `${professionalAppointments.length} atendimento(s)` : undefined,
            metaText:
              professionalAppointments.length > 0
                ? `${formatCurrency(revenueTotal)} • ${clientsServed} cliente(s)`
                : undefined,
          };
        })
        .filter((item) => item.value > 0)
        .sort((a, b) => {
          if (b.value !== a.value) return b.value - a.value;
          return a.name.localeCompare(b.name);
        })
    : [];

  const professionalScopedMetrics = {
    todayAppointments: professionalMetrics?.completedServices ?? 0,
    todayRevenue: professionalMetrics?.revenueTotal ?? 0,
    monthlyRevenue: professionalMetrics?.commissionTotal ?? 0,
    totalClients: professionalMetrics?.clientsServed ?? 0,
    todayAppointmentsGrowthPercent: null,
    todayRevenueGrowthPercent: null,
    totalClientsGrowthPercent: null,
    monthlyRevenueGrowthPercent: null,
    pendingAppointments: todayAppointments.filter(
      (appointment) => appointment.status === 'PENDING' || appointment.status === 'CONFIRMED'
    ).length,
    completedToday: todayAppointments.filter((appointment) => appointment.status === 'COMPLETED').length,
    notConcludedToday: 0,
    stoppedAtServiceSelection: 0,
    stoppedAtProfessionalSelection: 0,
    stoppedAtTimeSelection: 0,
    stoppedAtFinalReview: 0,
    whatsAppOpenFlowsToday: 0,
    whatsAppStoppedAtServiceSelection: 0,
    whatsAppStoppedAtProfessionalSelection: 0,
    whatsAppStoppedAtTimeSelection: 0,
    whatsAppStoppedAtFinalReview: 0,
  };

  const resolvedMetrics = isProfessionalUser ? professionalScopedMetrics : metrics;

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleRetryDashboardLoad = async () => {
    const hasSessionHint =
      typeof window !== 'undefined' ? Boolean(window.localStorage.getItem('auth_user')) : true;

    const currentError = isProfessionalUser ? professionalMetricsError : metricsError;

    if (shouldForceLogoutOnDashboardRetry(currentError, hasSessionHint)) {
      await logout();
      if (typeof window !== 'undefined') {
        window.location.assign('/login?reason=session-expired');
      }
      return;
    }

    if (isProfessionalUser) {
      await fetchProfessionalMetrics();
      return;
    }

    refetchMetrics();
  };

  if ((metricsLoading && !isProfessionalUser) || professionalMetricsLoading || appointmentsLoading || professionalsLoading) {
    return (
      <MainLayout title="Dashboard" subtitle={formattedDate}>
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if ((!isProfessionalUser && metricsError) || (isProfessionalUser && professionalMetricsError)) {
    return (
      <MainLayout title="Dashboard" subtitle={formattedDate}>
        <PageErrorState
          title="Nao foi possivel carregar o dashboard"
          description={isProfessionalUser ? professionalMetricsError : metricsError}
          action={{ label: "Tentar novamente", onClick: () => void handleRetryDashboardLoad() }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" subtitle={formattedDate}>
      <div className="space-y-4 sm:space-y-6">
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertTitle>Periodo das metricas</AlertTitle>
          <AlertDescription>
            {isProfessionalUser
              ? 'Este dashboard profissional usa metricas consolidadas da view materializada no periodo fixo do mes atual.'
              : 'Este dashboard principal usa periodos fixos: cards de hoje e do mes atual, grafico semanal para a semana corrente e linha mensal para o mes corrente. Para filtros personalizados, use o modulo financeiro detalhado.'}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <MetricCard
            title={isProfessionalUser ? 'Servicos concluidos' : 'Agendamentos Hoje'}
            value={resolvedMetrics.todayAppointments}
            icon={isProfessionalUser ? CheckCircle : Calendar}
            trend={
              isProfessionalUser
                ? undefined
                : {
                    value: resolvedMetrics.todayAppointmentsGrowthPercent ?? null,
                    isPositive: (resolvedMetrics.todayAppointmentsGrowthPercent ?? 0) >= 0,
                    unavailableLabel: 'Sem dados anteriores',
                  }
            }
            iconClassName={isProfessionalUser ? 'bg-emerald-600' : 'bg-primary'}
          />
          <MetricCard
            title={isProfessionalUser ? 'Faturamento no periodo' : 'Faturamento Hoje'}
            value={formatCurrency(resolvedMetrics.todayRevenue)}
            icon={DollarSign}
            trend={
              isProfessionalUser
                ? undefined
                : {
                    value: resolvedMetrics.todayRevenueGrowthPercent ?? null,
                    isPositive: (resolvedMetrics.todayRevenueGrowthPercent ?? 0) >= 0,
                    unavailableLabel: 'Sem dados anteriores',
                  }
            }
            iconClassName="bg-green-600"
          />
          <MetricCard
            title={isProfessionalUser ? 'Clientes atendidos' : 'Clientes Ativos'}
            value={resolvedMetrics.totalClients}
            icon={Users}
            trend={
              isProfessionalUser
                ? undefined
                : {
                    value: resolvedMetrics.totalClientsGrowthPercent ?? null,
                    isPositive: (resolvedMetrics.totalClientsGrowthPercent ?? 0) >= 0,
                    unavailableLabel: 'Sem dados anteriores',
                  }
            }
            iconClassName="bg-primary"
          />
          <MetricCard
            title={isProfessionalUser ? 'Comissao no periodo' : 'Faturamento Mensal'}
            value={formatCurrency(resolvedMetrics.monthlyRevenue)}
            icon={TrendingUp}
            trend={
              isProfessionalUser
                ? undefined
                : {
                    value: resolvedMetrics.monthlyRevenueGrowthPercent ?? null,
                    isPositive: (resolvedMetrics.monthlyRevenueGrowthPercent ?? 0) >= 0,
                    unavailableLabel: 'Sem dados anteriores',
                  }
            }
            iconClassName="bg-blue-600"
          />
        </div>

        {!isProfessionalUser ? <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-amber-700">Pendentes</p>
                <p className="text-lg sm:text-2xl font-bold text-amber-900">{resolvedMetrics.pendingAppointments}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-emerald-700">Concluidos Hoje</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-900">{resolvedMetrics.completedToday}</p>
              </div>
            </CardContent>
          </Card>
        </div> : null}

        {!isProfessionalUser ? <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              Nao Concluidos Hoje no Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-white/70 border border-orange-200 px-4 py-3">
              <p className="text-xs sm:text-sm text-orange-700">Total nao concluido no dia</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-900">
                {resolvedMetrics.notConcludedToday ?? 0}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white/70 border border-orange-100 px-3 py-2">
                <div className="flex items-center gap-2 text-orange-700">
                  <Route className="w-4 h-4" />
                  <span className="text-xs">Servico</span>
                </div>
                <p className="text-xl font-semibold text-orange-900">
                  {resolvedMetrics.stoppedAtServiceSelection ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-white/70 border border-orange-100 px-3 py-2">
                <div className="flex items-center gap-2 text-orange-700">
                  <UserCheck className="w-4 h-4" />
                  <span className="text-xs">Profissional</span>
                </div>
                <p className="text-xl font-semibold text-orange-900">
                  {resolvedMetrics.stoppedAtProfessionalSelection ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-white/70 border border-orange-100 px-3 py-2">
                <div className="flex items-center gap-2 text-orange-700">
                  <CalendarClock className="w-4 h-4" />
                  <span className="text-xs">Horario</span>
                </div>
                <p className="text-xl font-semibold text-orange-900">
                  {resolvedMetrics.stoppedAtTimeSelection ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-white/70 border border-orange-100 px-3 py-2">
                <div className="flex items-center gap-2 text-orange-700">
                  <ClipboardCheck className="w-4 h-4" />
                  <span className="text-xs">Revisao final</span>
                </div>
                <p className="text-xl font-semibold text-orange-900">
                  {resolvedMetrics.stoppedAtFinalReview ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card> : null}

        {!isProfessionalUser ? <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              Fluxos Pausados Hoje no WhatsApp
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Conversas do WhatsApp ainda em aberto hoje, antes da confirmacao formal de abandono.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-white/70 border border-sky-200 px-4 py-3">
              <p className="text-xs sm:text-sm text-sky-700">Total de fluxos pausados hoje</p>
              <p className="text-2xl sm:text-3xl font-bold text-sky-900">
                {resolvedMetrics.whatsAppOpenFlowsToday ?? 0}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white/70 border border-sky-100 px-3 py-2">
                <div className="flex items-center gap-2 text-sky-700">
                  <Route className="w-4 h-4" />
                  <span className="text-xs">Servico</span>
                </div>
                <p className="text-xl font-semibold text-sky-900">
                  {resolvedMetrics.whatsAppStoppedAtServiceSelection ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-white/70 border border-sky-100 px-3 py-2">
                <div className="flex items-center gap-2 text-sky-700">
                  <UserCheck className="w-4 h-4" />
                  <span className="text-xs">Profissional</span>
                </div>
                <p className="text-xl font-semibold text-sky-900">
                  {resolvedMetrics.whatsAppStoppedAtProfessionalSelection ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-white/70 border border-sky-100 px-3 py-2">
                <div className="flex items-center gap-2 text-sky-700">
                  <CalendarClock className="w-4 h-4" />
                  <span className="text-xs">Horario</span>
                </div>
                <p className="text-xl font-semibold text-sky-900">
                  {resolvedMetrics.whatsAppStoppedAtTimeSelection ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-white/70 border border-sky-100 px-3 py-2">
                <div className="flex items-center gap-2 text-sky-700">
                  <ClipboardCheck className="w-4 h-4" />
                  <span className="text-xs">Revisao final</span>
                </div>
                <p className="text-xl font-semibold text-sky-900">
                  {resolvedMetrics.whatsAppStoppedAtFinalReview ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card> : null}

        {!isProfessionalUser ? <WhatsAppReactivationChart /> : null}
        {!isProfessionalUser ? <WhatsAppReactivationQueue /> : null}
        {!isProfessionalUser ? (
          <NoShowInsights />
        ) : null}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <UpcomingAppointments appointments={enrichedAppointments} onUpdateStatus={updateAppointmentStatus} />
          </div>

          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Equipe Disponivel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {activeProfessionals.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Nenhum profissional cadastrado
                </p>
              ) : (
                activeProfessionals.slice(0, 5).map((professional) => {
                  const professionalAppointments = todayAppointments.filter(
                    (appointment) => appointment.professionalId === professional.id
                  );
                  const currentAppointment = professionalAppointments.find(
                    (appointment) => appointment.status === 'IN_PROGRESS'
                  );
                  const nextAppointment = professionalAppointments.find(
                    (appointment) => appointment.status === 'PENDING' || appointment.status === 'CONFIRMED'
                  );

                  return (
                    <div
                      key={professional.id}
                      className="flex items-center gap-3 p-2 sm:p-3 bg-muted/40 rounded-xl"
                    >
                      <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                        <AvatarImage src={professional.avatar} />
                        <AvatarFallback className="bg-primary/15 text-primary text-xs sm:text-sm">
                          {professional.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {professional.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {professional.specialties.slice(0, 2).join(', ')}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] sm:text-xs flex-shrink-0 ${
                          currentAppointment
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : nextAppointment
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {currentAppointment
                          ? 'Ocupado'
                          : nextAppointment
                          ? `Prox: ${nextAppointment.startTime}`
                          : 'Livre'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {scopedAppointments.length === 0 ? (
          <PageEmptyState
            title="Nenhum agendamento encontrado"
            description="Cadastre o primeiro agendamento para comecar a acompanhar as metricas."
          />
        ) : null}

        {!isProfessionalUser ? (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <RevenueChart />
            <MonthlyRevenueLineChart />
          </div>
        ) : null}

        <RankedBarCard
          title="Clientes com mais servicos no periodo"
          icon={Users}
          subtitle={customerRanking?.lastUpdatedAt ? `Atualizado em ${new Date(customerRanking.lastUpdatedAt).toLocaleString('pt-BR')}` : undefined}
          items={(customerRanking?.items || []).map((item) => ({
            id: item.clientId,
            name: item.clientName,
            value: item.completedServices,
            badgeText: formatCurrency(item.revenueTotal),
            metaText: `${item.completedServices} servico(s) - ${item.completedAppointments} atendimento(s) - ultima: ${
              item.lastAppointmentDate ? new Date(`${item.lastAppointmentDate}T12:00:00`).toLocaleDateString('pt-BR') : '-'
            }`,
          }))}
          maxItems={5}
          valueLabel="Servicos"
          labelPrefix="Cliente"
          emptyMessage="Nenhum ranking de clientes disponivel no periodo."
        />

        {!isProfessionalUser ? (
          <RankedBarCard
            title="Top profissionais no dashboard"
            icon={TrendingUp}
            subtitle={`Mes atual: ${new Date(`${monthStartIso}T12:00:00`).toLocaleDateString('pt-BR')} a ${new Date(`${monthEndIso}T12:00:00`).toLocaleDateString('pt-BR')}`}
            items={topProfessionalItems}
            maxItems={5}
            valueLabel="Atendimentos concluidos"
            labelPrefix="Profissional"
            emptyMessage="Nenhum profissional com atendimento concluido no periodo."
            valueFormatter={(value) => `${value} atendimento(s)`}
          />
        ) : null}
      </div>
    </MainLayout>
  );
}

