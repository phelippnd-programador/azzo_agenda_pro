import { useCallback, useEffect, useState } from 'react';
import { RankedBarCard } from '@/components/common/RankedBarCard';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { MonthlyRevenueLineChart } from '@/components/dashboard/MonthlyRevenueLineChart';
import { NoShowInsights } from '@/components/dashboard/NoShowInsights';
import { WhatsAppReactivationChart } from '@/components/dashboard/WhatsAppReactivationChart';
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

function DashboardSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FlowStageCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Route;
  label: string;
  value: number;
  tone: 'amber' | 'sky';
}) {
  const toneClasses =
    tone === 'amber'
      ? {
        wrapper: 'border-orange-100 bg-white/80',
        text: 'text-orange-700',
        value: 'text-orange-900',
      }
      : {
        wrapper: 'border-sky-100 bg-white/80',
        text: 'text-sky-700',
        value: 'text-sky-900',
      };

  return (
    <div className={`rounded-xl border px-3 py-3 ${toneClasses.wrapper}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`space-y-1 ${toneClasses.text}`}>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{label}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Clientes parados nesta etapa</p>
        </div>
        <p className={`text-2xl font-semibold ${toneClasses.value}`}>{value}</p>
      </div>
    </div>
  );
}

function QuickSignalCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Clock;
  tone: 'amber' | 'emerald' | 'slate' | 'blue';
}) {
  const toneMap = {
    amber: {
      wrapper: 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50',
      icon: 'bg-amber-100 text-amber-700',
      label: 'text-amber-700',
      value: 'text-amber-950',
    },
    emerald: {
      wrapper: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50',
      icon: 'bg-emerald-100 text-emerald-700',
      label: 'text-emerald-700',
      value: 'text-emerald-950',
    },
    slate: {
      wrapper: 'border-slate-200 bg-gradient-to-br from-slate-50 to-white',
      icon: 'bg-slate-100 text-slate-700',
      label: 'text-slate-600',
      value: 'text-slate-950',
    },
    blue: {
      wrapper: 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50',
      icon: 'bg-blue-100 text-blue-700',
      label: 'text-blue-700',
      value: 'text-blue-950',
    },
  } as const;

  const styles = toneMap[tone];

  return (
    <div className={`rounded-2xl border p-3 ${styles.wrapper}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[11px] font-medium uppercase tracking-[0.14em] ${styles.label}`}>{label}</p>
          <p className={`mt-1 text-2xl font-bold ${styles.value}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

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
              ? `${formatCurrency(revenueTotal)} â€¢ ${clientsServed} cliente(s)`
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
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
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
        <Card className="border-border/60 bg-gradient-to-r from-background via-muted/30 to-background">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Visao executiva
              </p>
              <p className="text-sm font-medium text-foreground">
                {isProfessionalUser
                  ? 'Comece por pendencias, agenda do dia e receita acumulada no mes atual.'
                  : 'Leia o dia em poucos segundos: agenda, gargalos do funil e receita do mes.'}
              </p>
            </div>
            <Badge variant="outline" className="w-fit bg-background/80">
              Hoje + mes atual
            </Badge>
          </CardContent>
        </Card>
        <DashboardSectionHeader
          eyebrow="Operacao"
          title="O que exige atencao hoje"
          description={
            isProfessionalUser
              ? 'Comece pelo seu volume concluido, pendencias do dia e proxima agenda.'
              : 'Priorize agenda, equipe disponivel e gargalos do funil antes de entrar nos graficos de analise.'
          }
        />

        <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 min-[1700px]:grid-cols-4">
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
              compact
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
              compact
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
              compact
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
              compact
            />
          </div>
          <Card className="border-border/60 bg-muted/20">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle className="text-base sm:text-lg">Resumo rapido do dia</CardTitle>
              <p className="text-xs text-muted-foreground">
                Numeros que merecem leitura imediata antes de navegar pelo restante do dashboard.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                <QuickSignalCard
                  label="Pendentes"
                  value={resolvedMetrics.pendingAppointments}
                  icon={Clock}
                  tone="amber"
                />
                <QuickSignalCard
                  label="Concluidos"
                  value={resolvedMetrics.completedToday}
                  icon={CheckCircle}
                  tone="emerald"
                />
                {!isProfessionalUser ? (
                  <QuickSignalCard
                    label="Nao concluidos"
                    value={resolvedMetrics.notConcludedToday ?? 0}
                    icon={Route}
                    tone="slate"
                  />
                ) : (
                  <QuickSignalCard
                    label="Clientes no mes"
                    value={resolvedMetrics.totalClients}
                    icon={Users}
                    tone="blue"
                  />
                )}
                {!isProfessionalUser ? (
                  <QuickSignalCard
                    label="WhatsApp aberto"
                    value={resolvedMetrics.whatsAppOpenFlowsToday ?? 0}
                    icon={CalendarClock}
                    tone="blue"
                  />
                ) : (
                  <QuickSignalCard
                    label="Servicos no mes"
                    value={resolvedMetrics.todayAppointments}
                    icon={Calendar}
                    tone="slate"
                  />
                )}
              </div>

              <div className="rounded-xl border border-dashed bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                {isProfessionalUser
                  ? 'Use os cards do topo para acompanhar receita, clientes atendidos e comissao do mes sem perder o foco no dia.'
                  : 'Se pendencias, fluxos nao concluidos ou WhatsApp em aberto subirem, a prioridade esta abaixo nos blocos de risco.'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
          <div>
            <UpcomingAppointments appointments={enrichedAppointments} onUpdateStatus={updateAppointmentStatus} />
          </div>

          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Equipe Disponivel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {activeProfessionals.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
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
                      className="flex items-center gap-3 rounded-xl bg-muted/40 p-2 sm:p-3"
                    >
                      <Avatar className="h-9 w-9 flex-shrink-0 sm:h-10 sm:w-10">
                        <AvatarImage src={professional.avatar} />
                        <AvatarFallback className="bg-primary/15 text-xs text-primary sm:text-sm">
                          {professional.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {professional.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {professional.specialties.slice(0, 2).join(', ')}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`flex-shrink-0 text-[10px] sm:text-xs ${currentAppointment
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : nextAppointment
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-border bg-muted text-muted-foreground'
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

        {!isProfessionalUser ? (
          <>
            <DashboardSectionHeader
              eyebrow="Risco e conversao"
              title="Onde a operacao perde oportunidade"
              description="Use estes blocos para entender onde o funil trava hoje e quais sinais merecem intervencao imediata."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Fluxos nao concluidos hoje</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Etapas do funil geral que ficaram pelo caminho antes da conclusao.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-orange-200 bg-white/80 px-4 py-3">
                    <p className="text-xs text-orange-700">Total em risco hoje</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {resolvedMetrics.notConcludedToday ?? 0}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FlowStageCard
                      icon={Route}
                      label="Servico"
                      value={resolvedMetrics.stoppedAtServiceSelection ?? 0}
                      tone="amber"
                    />
                    <FlowStageCard
                      icon={UserCheck}
                      label="Profissional"
                      value={resolvedMetrics.stoppedAtProfessionalSelection ?? 0}
                      tone="amber"
                    />
                    <FlowStageCard
                      icon={CalendarClock}
                      label="Horario"
                      value={resolvedMetrics.stoppedAtTimeSelection ?? 0}
                      tone="amber"
                    />
                    <FlowStageCard
                      icon={ClipboardCheck}
                      label="Revisao"
                      value={resolvedMetrics.stoppedAtFinalReview ?? 0}
                      tone="amber"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">WhatsApp em aberto hoje</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Conversas ainda nao resolvidas antes de virarem abandono formal.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-sky-200 bg-white/80 px-4 py-3">
                    <p className="text-xs text-sky-700">Total pausado no canal</p>
                    <p className="text-3xl font-bold text-sky-900">
                      {resolvedMetrics.whatsAppOpenFlowsToday ?? 0}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FlowStageCard
                      icon={Route}
                      label="Servico"
                      value={resolvedMetrics.whatsAppStoppedAtServiceSelection ?? 0}
                      tone="sky"
                    />
                    <FlowStageCard
                      icon={UserCheck}
                      label="Profissional"
                      value={resolvedMetrics.whatsAppStoppedAtProfessionalSelection ?? 0}
                      tone="sky"
                    />
                    <FlowStageCard
                      icon={CalendarClock}
                      label="Horario"
                      value={resolvedMetrics.whatsAppStoppedAtTimeSelection ?? 0}
                      tone="sky"
                    />
                    <FlowStageCard
                      icon={ClipboardCheck}
                      label="Revisao"
                      value={resolvedMetrics.whatsAppStoppedAtFinalReview ?? 0}
                      tone="sky"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <NoShowInsights />
            </div>
            <div className="w-full ">
              <WhatsAppReactivationChart />
            </div>

            <DashboardSectionHeader
              eyebrow="Performance"
              title="Receita e desempenho do mes"
              description="Depois de tratar a operacao do dia, use estes blocos para leitura de crescimento, receita e ranking."
            />

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <RevenueChart />
              <MonthlyRevenueLineChart />
            </div>

            <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
              <RankedBarCard
                title="Clientes com mais servicos no periodo"
                icon={Users}
                subtitle={customerRanking?.lastUpdatedAt ? `Atualizado em ${new Date(customerRanking.lastUpdatedAt).toLocaleString('pt-BR')}` : undefined}
                items={(customerRanking?.items || []).map((item) => ({
                  id: item.clientId,
                  name: item.clientName,
                  value: item.completedServices,
                  badgeText: formatCurrency(item.revenueTotal),
                  metaText: `${item.completedServices} servico(s) - ${item.completedAppointments} atendimento(s) - ultima: ${item.lastAppointmentDate ? new Date(`${item.lastAppointmentDate}T12:00:00`).toLocaleDateString('pt-BR') : '-'
                    }`,
                }))}
                maxItems={5}
                valueLabel="Servicos"
                labelPrefix="Cliente"
                emptyMessage="Nenhum ranking de clientes disponivel no periodo."
              />

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
            </div>
          </>
        ) : (
          <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
            <RankedBarCard
              title="Clientes com mais servicos no periodo"
              icon={Users}
              subtitle={customerRanking?.lastUpdatedAt ? `Atualizado em ${new Date(customerRanking.lastUpdatedAt).toLocaleString('pt-BR')}` : undefined}
              items={(customerRanking?.items || []).map((item) => ({
                id: item.clientId,
                name: item.clientName,
                value: item.completedServices,
                badgeText: formatCurrency(item.revenueTotal),
                metaText: `${item.completedServices} servico(s) - ${item.completedAppointments} atendimento(s) - ultima: ${item.lastAppointmentDate ? new Date(`${item.lastAppointmentDate}T12:00:00`).toLocaleDateString('pt-BR') : '-'
                  }`,
              }))}
              maxItems={5}
              valueLabel="Servicos"
              labelPrefix="Cliente"
              emptyMessage="Nenhum ranking de clientes disponivel no periodo."
            />

            <Card className="border-border/60 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Resumo da sua operacao</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Leitura recomendada
                  </p>
                  <p className="mt-2">
                    Use os cards do topo para acompanhar volume entregue, receita gerada e comissao acumulada no mes atual.
                  </p>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <p className="font-medium text-foreground">Proximo passo</p>
                  <p className="mt-1">
                    Priorize confirmacao de pendencias na agenda e mantenha o foco em converter atendimentos agendados em servicos concluidos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}



