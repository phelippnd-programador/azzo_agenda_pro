import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, DollarSign, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAppointments } from '@/hooks/useAppointments';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { initializeDemoData } from '@/lib/api';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Dashboard() {
  const { metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useDashboard();
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const {
    professionals,
    isLoading: professionalsLoading,
  } = useProfessionals();
  const { clients } = useClients();
  const { services } = useServices();

  useEffect(() => {
    // Initialize demo data on first load
    initializeDemoData();
    refetchMetrics();
  }, [refetchMetrics]);

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments
    .filter(a => a.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Enrich appointments with client, professional, and service data
  const enrichedAppointments = todayAppointments.map(apt => {
    const client = clients.find(c => c.id === apt.clientId);
    const professional = professionals.find(p => p.id === apt.professionalId);
    const service = services.find(s => s.id === apt.serviceId);
    
    return {
      ...apt,
      client: client ? { name: client.name, phone: client.phone } : undefined,
      professional: professional ? { name: professional.name, avatar: professional.avatar } : undefined,
      service: service ? { name: service.name, duration: service.duration, price: service.price } : undefined,
    };
  });

  const activeProfessionals = professionals.filter(p => p.isActive);

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (metricsLoading || appointmentsLoading || professionalsLoading) {
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

  return (
    <MainLayout title="Dashboard" subtitle={formattedDate}>
      <div className="space-y-4 sm:space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <MetricCard
            title="Agendamentos Hoje"
            value={metrics.todayAppointments}
            icon={Calendar}
            trend={{ value: 12, isPositive: true }}
            iconClassName="bg-violet-600"
          />
          <MetricCard
            title="Faturamento Hoje"
            value={formatCurrency(metrics.todayRevenue)}
            icon={DollarSign}
            trend={{ value: 8, isPositive: true }}
            iconClassName="bg-green-600"
          />
          <MetricCard
            title="Clientes Ativos"
            value={metrics.totalClients}
            icon={Users}
            trend={{ value: 5, isPositive: true }}
            iconClassName="bg-pink-600"
          />
          <MetricCard
            title="Faturamento Mensal"
            value={formatCurrency(metrics.monthlyRevenue)}
            icon={TrendingUp}
            trend={{ value: 15, isPositive: true }}
            iconClassName="bg-blue-600"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-amber-700">Pendentes</p>
                <p className="text-lg sm:text-2xl font-bold text-amber-900">{metrics.pendingAppointments}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-emerald-700">Concluídos Hoje</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-900">{metrics.completedToday}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <UpcomingAppointments appointments={enrichedAppointments as any} />
          </div>

          {/* Team Status */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Equipe Disponível</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {activeProfessionals.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">
                  Nenhum profissional cadastrado
                </p>
              ) : (
                activeProfessionals.slice(0, 5).map((professional) => {
                  const professionalAppointments = todayAppointments.filter(
                    a => a.professionalId === professional.id
                  );
                  const currentAppointment = professionalAppointments.find(
                    a => a.status === 'IN_PROGRESS'
                  );
                  const nextAppointment = professionalAppointments.find(
                    a => a.status === 'PENDING' || a.status === 'CONFIRMED'
                  );

                  return (
                    <div
                      key={professional.id}
                      className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl"
                    >
                      <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                        <AvatarImage src={professional.avatar} />
                        <AvatarFallback className="bg-violet-100 text-violet-700 text-xs sm:text-sm">
                          {professional.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {professional.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
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
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {currentAppointment
                          ? 'Ocupado'
                          : nextAppointment
                          ? `Próx: ${nextAppointment.startTime}`
                          : 'Livre'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <RevenueChart />
      </div>
    </MainLayout>
  );
}
