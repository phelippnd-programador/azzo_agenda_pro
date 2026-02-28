import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { MonthlyRevenueLineChart } from '@/components/dashboard/MonthlyRevenueLineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageErrorState, PageEmptyState } from '@/components/ui/page-states';
import { Calendar, DollarSign, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useDashboardWithOptions } from '@/hooks/useDashboard';
import { useAppointments } from '@/hooks/useAppointments';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { initializeDemoData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

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
  const { user } = useAuth();
  const isProfessionalUser = user?.role === 'PROFESSIONAL';
  const { metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } =
    useDashboardWithOptions({ enabled: !isProfessionalUser });
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const {
    professionals,
    isLoading: professionalsLoading,
  } = useProfessionals({ fetchLimits: false });
  const { clients } = useClients();
  const { services } = useServices();

  const loggedProfessional = professionals.find((professional) => professional.userId === user?.id) ?? null;
  const scopedAppointments =
    isProfessionalUser && loggedProfessional?.id
      ? appointments.filter((appointment) => appointment.professionalId === loggedProfessional.id)
      : appointments;

  useEffect(() => {
    initializeDemoData();
    if (!isProfessionalUser) {
      refetchMetrics();
    }
  }, [isProfessionalUser, refetchMetrics]);

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = scopedAppointments
    .filter((appointment) => normalizeDateToIso(appointment.date) === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const enrichedAppointments = todayAppointments.map((apt) => {
    const client = clients.find((c) => c.id === apt.clientId);
    const professional = professionals.find((p) => p.id === apt.professionalId);
    const service = services.find((s) => s.id === apt.serviceId);

    return {
      ...apt,
      client,
      professional,
      service,
    };
  });

  const activeProfessionals = isProfessionalUser
    ? professionals.filter((professional) => professional.id === loggedProfessional?.id && professional.isActive)
    : professionals.filter((professional) => professional.isActive);

  const professionalScopedMetrics = {
    todayAppointments: todayAppointments.length,
    todayRevenue: todayAppointments.reduce((sum, appointment) => sum + (appointment.totalPrice || 0), 0),
    monthlyRevenue: scopedAppointments
      .filter((appointment) => {
        const date = normalizeDateToIso(appointment.date);
        if (!date) return false;
        return date.startsWith(today.slice(0, 7));
      })
      .reduce((sum, appointment) => sum + (appointment.totalPrice || 0), 0),
    totalClients: new Set(scopedAppointments.map((appointment) => appointment.clientId)).size,
    pendingAppointments: todayAppointments.filter(
      (appointment) => appointment.status === 'PENDING' || appointment.status === 'CONFIRMED'
    ).length,
    completedToday: todayAppointments.filter((appointment) => appointment.status === 'COMPLETED').length,
  };

  const resolvedMetrics = isProfessionalUser ? professionalScopedMetrics : metrics;

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if ((metricsLoading && !isProfessionalUser) || appointmentsLoading || professionalsLoading) {
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

  if (!isProfessionalUser && metricsError) {
    return (
      <MainLayout title="Dashboard" subtitle={formattedDate}>
        <PageErrorState
          title="Nao foi possivel carregar o dashboard"
          description={metricsError}
          action={{ label: "Tentar novamente", onClick: refetchMetrics }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" subtitle={formattedDate}>
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <MetricCard
            title="Agendamentos Hoje"
            value={resolvedMetrics.todayAppointments}
            icon={Calendar}
            trend={{ value: 12, isPositive: true }}
            iconClassName="bg-primary"
          />
          <MetricCard
            title="Faturamento Hoje"
            value={formatCurrency(resolvedMetrics.todayRevenue)}
            icon={DollarSign}
            trend={{ value: 8, isPositive: true }}
            iconClassName="bg-green-600"
          />
          <MetricCard
            title="Clientes Ativos"
            value={resolvedMetrics.totalClients}
            icon={Users}
            trend={{ value: 5, isPositive: true }}
            iconClassName="bg-primary"
          />
          <MetricCard
            title="Faturamento Mensal"
            value={formatCurrency(resolvedMetrics.monthlyRevenue)}
            icon={TrendingUp}
            trend={{ value: 15, isPositive: true }}
            iconClassName="bg-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <UpcomingAppointments appointments={enrichedAppointments} />
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
      </div>
    </MainLayout>
  );
}
