import { useEffect, useMemo, useState } from "react";
import { formatCurrencyCents } from "@/lib/format";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useAuth } from "@/contexts/AuthContext";
import {
  dashboardApi,
  type DashboardServiceMetricItem,
  type DashboardServicesMetricsResponse,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, Loader2, RefreshCw, Scissors, Users } from "lucide-react";

type DatePreset = "day" | "week" | "month" | "year" | "range";

type ProfessionalStats = {
  professionalId: string;
  name: string;
  revenue: number;
  commission: number;
  servicesCount: number;
  clientsCount: number;
};

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(Number(value || 0))}%`;

function dateToYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentRange(preset: DatePreset, customStart: string, customEnd: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (preset === "day") {
    return { start: dateToYmd(start), end: dateToYmd(end) };
  }

  if (preset === "week") {
    const weekDay = now.getDay() || 7;
    start.setDate(now.getDate() - (weekDay - 1));
    end.setDate(start.getDate() + 6);
    return { start: dateToYmd(start), end: dateToYmd(end) };
  }

  if (preset === "month") {
    return {
      start: dateToYmd(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: dateToYmd(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }

  if (preset === "year") {
    return {
      start: dateToYmd(new Date(now.getFullYear(), 0, 1)),
      end: dateToYmd(new Date(now.getFullYear(), 11, 31)),
    };
  }

  return {
    start: customStart,
    end: customEnd,
  };
}

export default function ProfessionalFinancial() {
  const { user } = useAuth();
  const { professionals, isLoading: isLoadingProfessionals } = useProfessionals();
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("all");
  const [statsByProfessional, setStatsByProfessional] = useState<ProfessionalStats[]>([]);
  const [isLoadingProfessionalMetrics, setIsLoadingProfessionalMetrics] = useState(false);
  const [servicesMetrics, setServicesMetrics] =
    useState<DashboardServicesMetricsResponse | null>(null);
  const [isLoadingServicesMetrics, setIsLoadingServicesMetrics] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const loggedProfessional = useMemo(
    () => professionals.find((professional) => professional.userId === user?.id) ?? null,
    [professionals, user?.id]
  );
  const isProfessional = user?.role === "PROFESSIONAL";
  const loggedProfessionalId = loggedProfessional?.id || "";
  const effectiveProfessionalId = isProfessional ? loggedProfessionalId : selectedProfessionalId;

  const { start, end } = useMemo(
    () => getCurrentRange(preset, customStart, customEnd),
    [customEnd, customStart, preset]
  );

  useEffect(() => {
    if (!start || !end || isLoadingProfessionals) {
      setStatsByProfessional([]);
      setIsLoadingProfessionalMetrics(false);
      return;
    }

    if (isProfessional && !loggedProfessionalId) {
      setStatsByProfessional([]);
      setIsLoadingProfessionalMetrics(false);
      return;
    }

    const professionalIdsToFetch =
      isProfessional
        ? [loggedProfessionalId]
        : effectiveProfessionalId === "all"
        ? professionals.map((professional) => professional.id)
        : [effectiveProfessionalId];

    const filteredProfessionalIds = professionalIdsToFetch.filter(Boolean);
    if (!filteredProfessionalIds.length) {
      setStatsByProfessional([]);
      setIsLoadingProfessionalMetrics(false);
      return;
    }

    let isMounted = true;
    setIsLoadingProfessionalMetrics(true);

    Promise.all(
      filteredProfessionalIds.map(async (professionalId) => {
        const data = await dashboardApi.getProfessionalMetrics(start, end, professionalId);
        const professional = professionals.find((item) => item.id === professionalId);
        return {
          professionalId,
          name: professional?.name || "Profissional",
          revenue: Number(data.revenueTotal || 0),
          commission: Number(data.commissionTotal || 0),
          servicesCount: Number(data.completedServices || 0),
          clientsCount: Number(data.clientsServed || 0),
        };
      })
    )
      .then((items) => {
        if (!isMounted) return;
        const filteredItems = items.filter(
          (item) =>
            (item.revenue > 0 || item.servicesCount > 0) &&
            (!isProfessional || item.professionalId === loggedProfessionalId)
        );
        setStatsByProfessional(filteredItems.sort((a, b) => b.revenue - a.revenue));
      })
      .catch(() => {
        if (!isMounted) return;
        setStatsByProfessional([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingProfessionalMetrics(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    effectiveProfessionalId,
    end,
    isLoadingProfessionals,
    isProfessional,
    loggedProfessionalId,
    professionals,
    refreshVersion,
    start,
  ]);

  useEffect(() => {
    if (!start || !end || isLoadingProfessionals) {
      setServicesMetrics(null);
      setIsLoadingServicesMetrics(false);
      return;
    }

    if (isProfessional && !loggedProfessionalId) {
      setServicesMetrics(null);
      setIsLoadingServicesMetrics(false);
      return;
    }

    let isMounted = true;
    setIsLoadingServicesMetrics(true);

    const professionalIdParam = isProfessional
      ? loggedProfessionalId
      : effectiveProfessionalId === "all"
      ? undefined
      : effectiveProfessionalId;

    dashboardApi
      .getServicesMetrics(start, end, professionalIdParam)
      .then((data) => {
        if (!isMounted) return;
        if (
          isProfessional &&
          data.professionalId &&
          data.professionalId !== loggedProfessionalId
        ) {
          setServicesMetrics(null);
          return;
        }
        setServicesMetrics(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setServicesMetrics(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingServicesMetrics(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    effectiveProfessionalId,
    end,
    isLoadingProfessionals,
    isProfessional,
    loggedProfessionalId,
    refreshVersion,
    start,
  ]);

  const visibleStatsByProfessional = useMemo(
    () =>
      isProfessional
        ? statsByProfessional.filter((item) => item.professionalId === loggedProfessionalId)
        : statsByProfessional,
    [isProfessional, loggedProfessionalId, statsByProfessional]
  );

  const servicesChartData = useMemo(() => {
    const services = servicesMetrics?.services || [];
    return [...services]
      .sort((a, b) => b.totalAppointments - a.totalAppointments)
      .slice(0, 8)
      .map((item) => {
        const otherAppointments = Math.max(
          0,
          Number(item.totalAppointments || 0) -
            Number(item.completedAppointments || 0) -
            Number(item.canceledAppointments || 0)
        );

        return {
          serviceName: item.serviceName,
          totalAppointments: Number(item.totalAppointments || 0),
          completedAppointments: Number(item.completedAppointments || 0),
          canceledAppointments: Number(item.canceledAppointments || 0),
          otherAppointments,
          completionRate: Number(item.completionRate || 0),
          cancellationRate: Number(item.cancellationRate || 0),
          revenueTotal: Number(item.revenueTotal || 0),
        };
      });
  }, [servicesMetrics]);

  const servicesChartHeight = useMemo(
    () => Math.max(300, servicesChartData.length * 56),
    [servicesChartData.length]
  );

  const serviceHighlights = useMemo(
    () => [
      {
        title: "Mais solicitado",
        item: servicesMetrics?.mostRequestedService,
      },
      {
        title: "Menos solicitado",
        item: servicesMetrics?.leastRequestedService,
      },
      {
        title: "Mais cancelado",
        item: servicesMetrics?.mostCancelledService,
      },
      {
        title: "Mais concluido",
        item: servicesMetrics?.mostCompletedService,
      },
    ],
    [servicesMetrics]
  );

  const totals = useMemo(() => {
    return visibleStatsByProfessional.reduce(
      (acc, item) => {
        acc.revenue += item.revenue;
        acc.commission += item.commission;
        acc.services += item.servicesCount;
        acc.clients += item.clientsCount;
        return acc;
      },
      { revenue: 0, commission: 0, services: 0, clients: 0 }
    );
  }, [visibleStatsByProfessional]);
  const isOwnerView = !isProfessional;

  const isLoadingMetrics = isLoadingProfessionalMetrics || isLoadingServicesMetrics;
  const canRefresh = Boolean(start && end) && !(preset === "range" && (!customStart || !customEnd));

  if (isLoadingProfessionals) {
    return (
      <MainLayout
        title="Financeiro por Profissional"
        subtitle="Acompanhe faturamento, comissoes e volume de atendimentos."
      >
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Financeiro por Profissional"
      subtitle="Metricas detalhadas por periodo para dono e equipe."
    >
      <div className={`space-y-4 sm:space-y-6 transition-opacity duration-200 ${isLoadingMetrics ? "opacity-50 pointer-events-none" : ""}`}>
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Select value={preset} onValueChange={(value) => setPreset(value as DatePreset)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia atual</SelectItem>
                  <SelectItem value="week">Semana atual</SelectItem>
                  <SelectItem value="month">Mes atual</SelectItem>
                  <SelectItem value="year">Ano atual</SelectItem>
                  <SelectItem value="range">Intervalo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isProfessional ? (
              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select value={effectiveProfessionalId} onValueChange={setSelectedProfessionalId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {professionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Profissional</Label>
                <div className="h-10 rounded-md border bg-muted/40 px-3 flex items-center text-sm text-muted-foreground">
                  {loggedProfessional?.name || "Profissional logado"}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input
                type="date"
                value={preset === "range" ? customStart : start}
                onChange={(event) => setCustomStart(event.target.value)}
                disabled={preset !== "range"}
              />
            </div>

            <div className="space-y-2">
              <Label>Data final</Label>
              <Input
                type="date"
                value={preset === "range" ? customEnd : end}
                onChange={(event) => setCustomEnd(event.target.value)}
                disabled={preset !== "range"}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRefreshVersion((current) => current + 1)}
            disabled={!canRefresh || isLoadingMetrics}
            className="gap-2"
          >
            {isLoadingMetrics ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar agora
          </Button>
        </div>

        {preset === "range" && (!customStart || !customEnd) ? (
          <p className="text-sm text-muted-foreground">
            Selecione as datas de inicio e fim para filtrar.
          </p>
        ) : null}

        <div className={`grid gap-4 ${isOwnerView ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          {isOwnerView ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Faturamento</p>
                <p className="text-xl font-bold text-foreground">{formatCurrencyCents(totals.revenue)}</p>
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Comissao total</p>
              <p className="text-xl font-bold text-primary">{formatCurrencyCents(totals.commission)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Servicos concluidos</p>
              <p className="text-xl font-bold text-emerald-700">{totals.services}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Clientes atendidos</p>
              <p className="text-xl font-bold text-sky-700">{totals.clients}</p>
            </CardContent>
          </Card>
        </div>

        <div className={`grid gap-4 ${isOwnerView ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
          {isOwnerView ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">Comparativo de faturamento</CardTitle>
              </CardHeader>
              <CardContent>
                {!visibleStatsByProfessional.length ? (
                  <p className="text-sm text-muted-foreground">Sem dados para o periodo selecionado.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={visibleStatsByProfessional}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            new Intl.NumberFormat("pt-BR", {
                              notation: "compact",
                              compactDisplay: "short",
                            }).format(Number(value))
                          }
                        />
                        <Tooltip formatter={(value) => formatCurrencyCents(Number(value))} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#7c3aed" name="Faturamento" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="commission" fill="#0ea5e9" name="Comissao" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Comparativo de volume</CardTitle>
            </CardHeader>
            <CardContent>
              {!visibleStatsByProfessional.length ? (
                <p className="text-sm text-muted-foreground">Sem dados para o periodo selecionado.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visibleStatsByProfessional}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="servicesCount" fill="#16a34a" name="Servicos" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="clientsCount" fill="#f59e0b" name="Clientes" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Analise de servicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              {serviceHighlights.map(({ title, item }) => {
                const metricItem = item as DashboardServiceMetricItem | null;
                return (
                  <div key={title} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {metricItem?.serviceName || "Sem dados"}
                    </p>
                    {metricItem ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {metricItem.totalAppointments} ag. • {metricItem.completedAppointments} concl. •{" "}
                        {metricItem.canceledAppointments} cancel.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {!servicesChartData.length ? (
              <p className="text-sm text-muted-foreground">Sem dados de servicos para o periodo selecionado.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <div style={{ height: `${servicesChartHeight}px` }}>
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Volume de agendamentos por servico
                  </p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={servicesChartData} layout="vertical" margin={{ left: 8, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        label={{ value: "Quantidade de agendamentos", position: "insideBottom", offset: -2 }}
                      />
                      <YAxis type="category" dataKey="serviceName" width={130} />
                      <Tooltip
                        formatter={(value, name, payload) => {
                          const item = payload?.payload as
                            | (typeof servicesChartData)[number]
                            | undefined;
                          if (!item) return [value, name];
                          if (name === "Agendamentos concluidos")
                            return [`${value} (${formatPercent(item.completionRate)})`, name];
                          if (name === "Agendamentos cancelados")
                            return [`${value} (${formatPercent(item.cancellationRate)})`, name];
                          if (name === "Outros status") return [value, name];
                          return [value, name];
                        }}
                        labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload as
                            | (typeof servicesChartData)[number]
                            | undefined;
                          if (!item) return label;
                          return `${label} - Total ${item.totalAppointments} - ${formatCurrencyCents(
                            item.revenueTotal
                          )}`;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="completedAppointments"
                        stackId="appointments"
                        fill="#16a34a"
                        name="Agendamentos concluidos"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={22}
                      />
                      <Bar
                        dataKey="canceledAppointments"
                        stackId="appointments"
                        fill="#ef4444"
                        name="Agendamentos cancelados"
                        maxBarSize={22}
                      />
                      <Bar
                        dataKey="otherAppointments"
                        stackId="appointments"
                        fill="#94a3b8"
                        name="Outros status"
                        maxBarSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ height: `${servicesChartHeight}px` }}>
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Taxas de conclusao e cancelamento por servico
                  </p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={servicesChartData} layout="vertical" margin={{ left: 8, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        label={{ value: "Percentual", position: "insideBottom", offset: -2 }}
                      />
                      <YAxis type="category" dataKey="serviceName" width={130} />
                      <Tooltip
                        formatter={(value, name) => [formatPercent(Number(value || 0)), name]}
                      />
                      <Legend />
                      <Bar
                        dataKey="completionRate"
                        fill="#16a34a"
                        name="% de conclusao"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={18}
                      />
                      <Bar
                        dataKey="cancellationRate"
                        fill="#ef4444"
                        name="% de cancelamento"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Detalhamento por profissional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!visibleStatsByProfessional.length ? (
              <p className="text-sm text-muted-foreground">Sem dados para listar no periodo selecionado.</p>
            ) : (
              visibleStatsByProfessional.map((item) => (
                <div
                  key={item.professionalId}
                  className={`grid gap-2 rounded-lg border p-3 ${
                    isOwnerView
                      ? "md:grid-cols-[1.5fr_repeat(4,1fr)]"
                      : "md:grid-cols-[1.5fr_repeat(3,1fr)]"
                  }`}
                >
                  <div className="font-medium text-foreground">{item.name}</div>
                  {isOwnerView ? (
                    <div className="text-sm text-muted-foreground">
                      <span className="text-muted-foreground">Faturamento:</span> {formatCurrencyCents(item.revenue)}
                    </div>
                  ) : null}
                  <div className="text-sm text-muted-foreground">
                    <span className="text-muted-foreground">Comissao:</span> {formatCurrencyCents(item.commission)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="text-muted-foreground">Servicos:</span> {item.servicesCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="text-muted-foreground">Clientes:</span> {item.clientsCount}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {isOwnerView ? (
            <Badge variant="secondary" className="gap-1">
              <DollarSign className="h-3 w-3" />
              Faturamento por servicos concluidos
            </Badge>
          ) : null}
          <Badge variant="secondary" className="gap-1">
            <Scissors className="h-3 w-3" />
            Servicos concluidos no periodo
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            Clientes unicos atendidos
          </Badge>
        </div>
      </div>
    </MainLayout>
  );
}

