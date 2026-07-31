import { useCallback, useEffect, useState } from 'react';
import { appRouteManifest } from '@/app/route-manifest';
import { RankedBarCard } from '@/components/common/RankedBarCard';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { MonthlyRevenueLineChart } from '@/components/dashboard/MonthlyRevenueLineChart';
import { NoShowInsights } from '@/components/dashboard/NoShowInsights';
import { WhatsAppReactivationChart } from '@/components/dashboard/WhatsAppReactivationChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageErrorState } from '@/components/ui/page-states';
import { Calendar, DollarSign, Users, TrendingUp, Clock, CheckCircle, Route, UserCheck, CalendarClock, ClipboardCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-1.5">
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
  value: string | number;
  tone: 'amber' | 'sky';
}) {
  // Ambas as variantes representam contagens de estagnação no funil (risco); só a origem
  // (agendamento direto vs. canal WhatsApp) difere. O cabeçalho do card já desambigua isso.
  void tone;
  const toneClasses = {
    wrapper: 'border-warning/25 bg-warning/8',
    text: 'text-warning',
    value: 'text-foreground',
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
      wrapper: 'border-warning/25 bg-warning/8',
      icon: 'bg-warning/15 text-warning',
      label: 'text-warning',
      value: 'text-foreground',
    },
    emerald: {
      wrapper: 'border-success/25 bg-success/8',
      icon: 'bg-success/15 text-success',
      label: 'text-success',
      value: 'text-foreground',
    },
    slate: {
      wrapper: 'border-border/70 bg-muted/25',
      icon: 'bg-muted text-muted-foreground',
      label: 'text-muted-foreground',
      value: 'text-foreground',
    },
    blue: {
      wrapper: 'border-primary/20 bg-primary/8',
      icon: 'bg-primary/15 text-primary',
      label: 'text-primary',
      value: 'text-foreground',
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

function DashboardCommandPanel({
  isProfessionalUser,
  pendingAppointments,
  completedToday,
  riskCount,
  todayRevenue,
  nextAppointmentLabel,
  onOpenAgenda,
}: {
  isProfessionalUser: boolean;
  pendingAppointments: number;
  completedToday: number;
  riskCount: number;
  todayRevenue: number;
  nextAppointmentLabel: string;
  onOpenAgenda: () => void;
}) {
  const hasRisk = riskCount > 0 || pendingAppointments > 0;

  return (
    <Card className="border-border/70 bg-card/95 shadow-panel">
      <CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-center">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Agora no salão
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {hasRisk ? 'Comece pelas pendências do dia.' : 'Operação do dia sob controle.'}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {isProfessionalUser
                  ? 'Sua agenda, entregas e comissão ficam no topo para reduzir troca de tela entre atendimentos.'
                  : 'Agenda, caixa e risco aparecem antes dos blocos analíticos para acelerar a primeira decisão.'}
              </p>
            </div>
            <Button className="w-full sm:w-auto" onClick={onOpenAgenda}>
              Abrir agenda
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 min-[520px]:grid-cols-2 min-[1700px]:grid-cols-4">
            <QuickSignalCard label="Pendentes" value={pendingAppointments} icon={Clock} tone={hasRisk ? 'amber' : 'slate'} />
            <QuickSignalCard label="Concluídos" value={completedToday} icon={CheckCircle} tone="emerald" />
            <QuickSignalCard label={isProfessionalUser ? 'Comissão' : 'Receita hoje'} value={formatCurrency(todayRevenue)} icon={DollarSign} tone="blue" />
            <QuickSignalCard label="Risco" value={riskCount} icon={Route} tone={riskCount > 0 ? 'amber' : 'slate'} />
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Próxima ação
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">{nextAppointmentLabel}</p>
            </div>
            <Badge variant={hasRisk ? 'default' : 'outline'} className="shrink-0">
              {hasRisk ? 'Atenção' : 'Ok'}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {hasRisk
              ? 'Resolva pendências e conversas abertas antes de analisar performance.'
              : 'Use os blocos abaixo apenas para acompanhamento e tendência.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
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
        error instanceof Error ? error.message : 'Erro ao carregar métricas do profissional'
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
                ? `${formatCurrency(revenueTotal)} · ${clientsServed} cliente(s)`
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

  const ownerScopedMetrics = {
    ...metrics,
    todayAppointments: todayAppointments.length,
    pendingAppointments: todayAppointments.filter(
      (appointment) => appointment.status === 'PENDING' || appointment.status === 'CONFIRMED'
    ).length,
    completedToday: todayAppointments.filter((appointment) => appointment.status === 'COMPLETED').length,
  };

  const resolvedMetrics = isProfessionalUser ? professionalScopedMetrics : ownerScopedMetrics;

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
          title="Não foi possível carregar o dashboard"
          description={isProfessionalUser ? professionalMetricsError : metricsError}
          action={{ label: "Tentar novamente", onClick: () => void handleRetryDashboardLoad() }}
        />
      </MainLayout>
    );
  }

  const nextActionAppointment = enrichedAppointments.find((appointment) =>
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(appointment.status)
  );
  const dashboardRiskCount = isProfessionalUser
    ? resolvedMetrics.pendingAppointments
    : resolvedMetrics.pendingAppointments +
      (resolvedMetrics.notConcludedToday ?? 0) +
      (resolvedMetrics.whatsAppOpenFlowsToday ?? 0);
  const nextAppointmentLabel = nextActionAppointment
    ? `${nextActionAppointment.startTime} · ${nextActionAppointment.client?.name || 'Cliente'}`
    : isProfessionalUser
      ? 'Nenhuma pendência imediata na sua agenda.'
      : 'Nenhuma pendência imediata na operação.';
  const customerRankingItems = (customerRanking?.items || []).map((item) => ({
    id: item.clientId,
    name: item.clientName,
    value: item.completedServices,
    badgeText: formatCurrency(item.revenueTotal),
    metaText: `${item.completedServices} serviço(s) · ${item.completedAppointments} atendimento(s) · última: ${
      item.lastAppointmentDate ? new Date(`${item.lastAppointmentDate}T12:00:00`).toLocaleDateString('pt-BR') : '-'
    }`,
  }));

  return (
    <MainLayout title="Dashboard" subtitle={formattedDate}>
      <div className="space-y-5 sm:space-y-6">
        <DashboardCommandPanel
          isProfessionalUser={isProfessionalUser}
          pendingAppointments={resolvedMetrics.pendingAppointments}
          completedToday={resolvedMetrics.completedToday}
          riskCount={dashboardRiskCount}
          todayRevenue={isProfessionalUser ? resolvedMetrics.monthlyRevenue : resolvedMetrics.todayRevenue}
          nextAppointmentLabel={nextAppointmentLabel}
          onOpenAgenda={() => navigate('/agenda')}
        />

        {!isProfessionalUser && <OnboardingChecklist />}

        <DashboardSectionHeader
          eyebrow="Operação"
          title="O que exige atenção hoje"
          description={
            isProfessionalUser
              ? 'Comece pelo seu volume concluído, pendências do dia e próxima agenda.'
              : 'Priorize agenda, equipe disponível e gargalos do funil antes de entrar nos gráficos de análise.'
          }
        />

        <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 min-[1700px]:grid-cols-4">
            <MetricCard
              title={isProfessionalUser ? 'Serviços concluídos' : 'Agendamentos Hoje'}
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
              iconClassName={isProfessionalUser ? 'bg-success' : 'bg-primary'}
              compact
            />
            <MetricCard
              title={isProfessionalUser ? 'Faturamento no período' : 'Faturamento Hoje'}
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
              iconClassName="bg-success"
              compact
              wrapValue
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
              title={isProfessionalUser ? 'Comissão no período' : 'Faturamento Mensal'}
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
              iconClassName="bg-primary"
              compact
              wrapValue
            />
          </div>
          <Card className="border-border/70 bg-muted/15 shadow-none">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle className="text-base sm:text-lg">Resumo rápido do dia</CardTitle>
              <p className="text-xs text-muted-foreground">
                Números que merecem leitura imediata antes de navegar pelo restante do dashboard.
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
                    label="Concluídos"
                  value={resolvedMetrics.completedToday}
                  icon={CheckCircle}
                  tone="emerald"
                />
                {!isProfessionalUser ? (
                  <QuickSignalCard
                    label="Não concluídos"
                    value={resolvedMetrics.notConcludedToday ?? 0}
                    icon={Route}
                    tone="slate"
                  />
                ) : (
                  <QuickSignalCard
                    label="Clientes no mês"
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
                    label="Serviços no mês"
                    value={resolvedMetrics.todayAppointments}
                    icon={Calendar}
                    tone="slate"
                  />
                )}
              </div>

              <div className="rounded-xl border border-dashed bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                {isProfessionalUser
                  ? 'Use os cards do topo para acompanhar receita, clientes atendidos e comissão do mês sem perder o foco no dia.'
                  : 'Se pendências, fluxos não concluídos ou WhatsApp em aberto subirem, a prioridade está abaixo nos blocos de risco.'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
          <div>
            <UpcomingAppointments appointments={enrichedAppointments} onUpdateStatus={updateAppointmentStatus} />
          </div>

          <Card className="border-border/70 bg-background/95 shadow-none">
            <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base sm:text-lg">Equipe disponível</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Status dos profissionais no dia para entender agenda, ocupação e próximos atendimentos.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate(appRouteManifest.professionals.root)}
              >
                Ver equipe
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {activeProfessionals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/80 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-foreground">Nenhum profissional cadastrado</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cadastre a equipe para acompanhar disponibilidade e próximos horários no dashboard.
                  </p>
                </div>
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
                      className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/85 p-3 transition-colors hover:bg-muted/15 sm:flex-row sm:items-center"
                    >
                      <Avatar className="h-9 w-9 flex-shrink-0 sm:h-10 sm:w-10">
                        <AvatarImage src={professional.avatar} />
                        <AvatarFallback className="bg-primary/15 text-xs text-primary sm:text-sm">
                          {professional.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-medium text-foreground">
                            {professional.name}
                          </p>
                          <p className="max-w-[240px] truncate text-xs text-muted-foreground">
                            {professional.specialties.slice(0, 2).join(', ') || 'Sem especialidade informada'}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`w-fit shrink-0 text-xs sm:text-xs ${currentAppointment
                            ? 'border-primary/25 bg-primary/8 text-primary'
                              : nextAppointment
                                ? 'border-success/25 bg-success/8 text-success'
                                : 'border-border bg-muted text-muted-foreground'
                            }`}
                        >
                          {currentAppointment
                            ? 'Ocupado'
                            : nextAppointment
                              ? `Próx: ${nextAppointment.startTime}`
                              : 'Livre'}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {!isProfessionalUser ? (
          <Tabs defaultValue="risco" className="space-y-4">
            <TabsList className="flex h-auto w-full max-w-full overflow-x-auto rounded-xl border bg-muted/30 p-1 sm:w-fit">
              <TabsTrigger value="risco" className="min-w-fit flex-1 whitespace-nowrap px-4 py-2 text-sm sm:flex-none">
                Risco e conversão
              </TabsTrigger>
              <TabsTrigger value="performance" className="min-w-fit flex-1 whitespace-nowrap px-4 py-2 text-sm sm:flex-none">
                Desempenho do mês
              </TabsTrigger>
            </TabsList>

            <TabsContent value="risco" className="space-y-4">
            <DashboardSectionHeader
              eyebrow="Risco e conversão"
              title="Onde a operação perde oportunidade"
              description="Use estes blocos para entender onde o funil trava hoje e quais sinais merecem intervenção imediata."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-warning/25 bg-warning/8 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Fluxos não concluídos hoje</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Etapas do funil geral que ficaram pelo caminho antes da conclusão.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-warning/25 bg-warning/8 px-4 py-3">
                    <p className="text-xs text-warning">Total em risco hoje</p>
                    <p className="text-3xl font-bold text-foreground">
                      {resolvedMetrics.notConcludedToday ?? 0}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FlowStageCard
                      icon={Route}
                      label="Serviço"
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
                      label="Horário"
                      value={resolvedMetrics.stoppedAtTimeSelection ?? 0}
                      tone="amber"
                    />
                    <FlowStageCard
                      icon={ClipboardCheck}
                      label="Revisão"
                      value={resolvedMetrics.stoppedAtFinalReview ?? 0}
                      tone="amber"
                    />
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Revise a fila para entender em qual etapa o cliente desistiu.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => navigate(appRouteManifest.reports.abandonment)}
                    >
                      Ver abandonos
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-warning/25 bg-warning/8 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">WhatsApp em aberto hoje</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Conversas ainda não resolvidas antes de virarem abandono formal.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-warning/25 bg-warning/8 px-4 py-3">
                    <p className="text-xs text-warning">Total pausado no canal</p>
                    <p className="text-3xl font-bold text-foreground">
                      {resolvedMetrics.whatsAppOpenFlowsToday ?? 0}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FlowStageCard
                      icon={Route}
                      label="Serviço"
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
                      label="Horário"
                      value={resolvedMetrics.whatsAppStoppedAtTimeSelection ?? 0}
                      tone="sky"
                    />
                    <FlowStageCard
                      icon={ClipboardCheck}
                      label="Revisão"
                      value={resolvedMetrics.whatsAppStoppedAtFinalReview ?? 0}
                      tone="sky"
                    />
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Entre no chat para assumir conversas paradas antes que virem abandono.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => navigate(appRouteManifest.chat.root)}
                    >
                      Abrir chat
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <NoShowInsights />
            </div>
            <div className="w-full">
              <WhatsAppReactivationChart />
            </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
            <DashboardSectionHeader
              eyebrow="Performance"
              title="Receita e desempenho do mês"
              description="Depois de tratar a operação do dia, use estes blocos para leitura de crescimento, receita e ranking."
            />

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <RevenueChart />
              <MonthlyRevenueLineChart />
            </div>

            <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
              <RankedBarCard
                title="Clientes mais recorrentes"
                icon={Users}
                subtitle={customerRanking?.lastUpdatedAt ? `Atualizado em ${new Date(customerRanking.lastUpdatedAt).toLocaleString('pt-BR')}` : undefined}
                items={customerRankingItems}
                maxItems={5}
                valueLabel="Serviços"
                labelPrefix="Cliente"
                emptyMessage="Nenhum ranking de clientes disponível no período."
              />

              <RankedBarCard
                title="Profissionais por atendimento concluído"
                icon={TrendingUp}
                subtitle={`Mês atual: ${new Date(`${monthStartIso}T12:00:00`).toLocaleDateString('pt-BR')} a ${new Date(`${monthEndIso}T12:00:00`).toLocaleDateString('pt-BR')}`}
                items={topProfessionalItems}
                maxItems={5}
                valueLabel="Atendimentos concluídos"
                labelPrefix="Profissional"
                emptyMessage="Nenhum profissional com atendimento concluído no período."
                valueFormatter={(value) => `${value} atendimento(s)`}
              />
            </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
            <RankedBarCard
              title="Clientes mais recorrentes"
              icon={Users}
              subtitle={customerRanking?.lastUpdatedAt ? `Atualizado em ${new Date(customerRanking.lastUpdatedAt).toLocaleString('pt-BR')}` : undefined}
              items={customerRankingItems}
              maxItems={5}
              valueLabel="Serviços"
              labelPrefix="Cliente"
              emptyMessage="Nenhum ranking de clientes disponível no período."
            />

            <Card className="border-border/70 bg-muted/15 shadow-none">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-base sm:text-lg">Resumo da sua operação</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Um checkpoint rápido para manter foco em entrega, agenda e conversão do dia.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-xl border border-border/70 bg-background/85 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Leitura recomendada
                  </p>
                  <p className="mt-2 font-medium text-foreground">
                    Volume entregue, receita do período e comissão acumulada precisam ser lidos juntos.
                  </p>
                  <p className="mt-1">
                    Use os cards do topo para acompanhar esses três sinais sem perder o foco na agenda do dia.
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/85 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Próximo passo
                  </p>
                  <p className="mt-2 font-medium text-foreground">Confirme pendências e empurre conclusão.</p>
                  <p className="mt-1">
                    Priorize confirmação de pendências na agenda e mantenha o foco em converter atendimentos agendados em serviços concluídos.
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



