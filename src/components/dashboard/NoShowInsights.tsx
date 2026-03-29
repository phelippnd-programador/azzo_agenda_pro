import { AlertCircle, CalendarClock, ReceiptText, UserRoundX } from "lucide-react";
import type { Appointment, Client, Professional, Service } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { formatCurrency, formatDateOnly } from "@/lib/format";

type NoShowInsightsProps = {
  appointments: Appointment[];
  clients: Client[];
  professionals: Professional[];
  services: Service[];
};

const normalizeDateToIso = (value: unknown) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().split("T")[0];
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  }
  return "";
};

const calculateGrowthPercent = (current: number, previous: number): number | null => {
  if (previous <= 0) return null;
  return ((current - previous) * 100) / previous;
};

export function NoShowInsights({
  appointments,
  clients,
  professionals,
  services,
}: NoShowInsightsProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();
  const todayIso = now.toISOString().split("T")[0];
  const monthStartIso = new Date(year, month, 1).toISOString().split("T")[0];
  const previousMonthStartDate = new Date(year, month - 1, 1);
  const previousMonthEndDate = new Date(year, month, 0);
  const previousMonthComparableEndDate = new Date(
    year,
    month - 1,
    Math.min(currentDay, previousMonthEndDate.getDate())
  );
  const previousMonthStartIso = previousMonthStartDate.toISOString().split("T")[0];
  const previousMonthEndIso = previousMonthComparableEndDate.toISOString().split("T")[0];
  const lastSevenDaysStartIso = new Date(year, month, now.getDate() - 6).toISOString().split("T")[0];

  const currentPeriodAppointments = appointments.filter((appointment) => {
    const iso = normalizeDateToIso(appointment.date);
    return !!iso && iso >= monthStartIso && iso <= todayIso;
  });

  const previousPeriodAppointments = appointments.filter((appointment) => {
    const iso = normalizeDateToIso(appointment.date);
    return !!iso && iso >= previousMonthStartIso && iso <= previousMonthEndIso;
  });

  const currentNoShows = currentPeriodAppointments.filter((appointment) => appointment.status === "NO_SHOW");
  const previousNoShows = previousPeriodAppointments.filter((appointment) => appointment.status === "NO_SHOW");
  const noShowCount = currentNoShows.length;
  const noShowGrowthPercent = calculateGrowthPercent(noShowCount, previousNoShows.length);

  const eligibleCurrentAppointments = currentPeriodAppointments.filter((appointment) =>
    appointment.status === "COMPLETED" || appointment.status === "NO_SHOW"
  );
  const noShowRate = eligibleCurrentAppointments.length > 0
    ? (noShowCount * 100) / eligibleCurrentAppointments.length
    : 0;

  const lastSevenDaysNoShows = appointments.filter((appointment) => {
    const iso = normalizeDateToIso(appointment.date);
    return !!iso && iso >= lastSevenDaysStartIso && iso <= todayIso && appointment.status === "NO_SHOW";
  }).length;

  const noShowLostRevenue = currentNoShows.reduce((sum, appointment) => sum + (appointment.totalPrice || 0), 0);

  const recentNoShows = [...currentNoShows]
    .sort((a, b) => {
      const dateCompare = normalizeDateToIso(b.date).localeCompare(normalizeDateToIso(a.date));
      if (dateCompare !== 0) return dateCompare;
      return (b.startTime || "").localeCompare(a.startTime || "");
    })
    .slice(0, 5)
    .map((appointment) => ({
      ...appointment,
      clientName: clients.find((client) => client.id === appointment.clientId)?.name || "Cliente nao identificado",
      professionalName:
        professionals.find((professional) => professional.id === appointment.professionalId)?.name || "Profissional nao identificado",
      serviceName:
        appointment.items?.[0]?.service?.name ||
        services.find((service) => service.id === appointment.serviceId)?.name ||
        "Servico nao identificado",
    }));

  return (
    <Card className="border-rose-200 bg-gradient-to-br from-rose-50/80 to-orange-50/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <UserRoundX className="h-5 w-5 text-rose-700" />
          No-show no periodo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visao analitica e operacional dos clientes que nao compareceram no mes atual.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="No-show no mes"
            value={noShowCount}
            icon={AlertCircle}
            trend={{
              value: noShowGrowthPercent,
              isPositive: (noShowGrowthPercent ?? 0) <= 0,
              unavailableLabel: "Sem comparativo anterior",
            }}
            iconClassName="bg-rose-600"
            className="border-rose-200 bg-white/80"
          />
          <MetricCard
            title="Taxa de no-show"
            value={`${noShowRate.toFixed(1)}%`}
            icon={CalendarClock}
            iconClassName="bg-orange-500"
            className="border-orange-200 bg-white/80"
          />
          <MetricCard
            title="Ultimos 7 dias"
            value={lastSevenDaysNoShows}
            icon={CalendarClock}
            iconClassName="bg-amber-500"
            className="border-amber-200 bg-white/80"
          />
          <MetricCard
            title="Receita em risco"
            value={formatCurrency(noShowLostRevenue)}
            icon={ReceiptText}
            iconClassName="bg-slate-700"
            className="border-slate-200 bg-white/80"
          />
        </div>

        <div className="rounded-2xl border border-rose-200 bg-white/80 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Lista operacional de no-show</p>
              <p className="text-xs text-muted-foreground">
                Ultimos casos para o time acompanhar, contactar ou analisar recorrencia.
              </p>
            </div>
            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">
              {noShowCount} no mes
            </Badge>
          </div>

          {recentNoShows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum no-show registrado no periodo atual.
            </div>
          ) : (
            <div className="space-y-3">
              {recentNoShows.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{appointment.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.serviceName} • {appointment.professionalName}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">
                      Nao compareceu
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{formatDateOnly(appointment.date)}</span>
                    <span>{appointment.startTime} - {appointment.endTime}</span>
                    <span>{formatCurrency(appointment.totalPrice || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
