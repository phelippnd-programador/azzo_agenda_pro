import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, Scissors, Users } from "lucide-react";

type DatePreset = "day" | "week" | "month" | "year" | "range";

type ProfessionalStats = {
  professionalId: string;
  name: string;
  revenue: number;
  commission: number;
  servicesCount: number;
  clientsCount: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

function dateToYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value);
  const normalized = text.includes("T") ? text : `${text}T12:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
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
  const { appointments, isLoading: isLoadingAppointments } = useAppointments();
  const { professionals, isLoading: isLoadingProfessionals } = useProfessionals();
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("all");

  const loggedProfessional = useMemo(
    () => professionals.find((professional) => professional.userId === user?.id) ?? null,
    [professionals, user?.id]
  );
  const isProfessional = user?.role === "PROFESSIONAL";
  const effectiveProfessionalId = isProfessional
    ? loggedProfessional?.id || "all"
    : selectedProfessionalId;

  const { start, end } = useMemo(
    () => getCurrentRange(preset, customStart, customEnd),
    [customEnd, customStart, preset]
  );

  const statsByProfessional = useMemo<ProfessionalStats[]>(() => {
    if (!start || !end) return [];
    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);
    if (!startDate || !endDate) return [];
    endDate.setHours(23, 59, 59, 999);

    const baseAppointments = appointments.filter((appointment) => {
      if (appointment.status !== "COMPLETED") return false;
      const appointmentDate = normalizeDate(appointment.date);
      if (!appointmentDate) return false;
      const inRange = appointmentDate >= startDate && appointmentDate <= endDate;
      if (!inRange) return false;
      if (effectiveProfessionalId === "all") return true;
      return appointment.professionalId === effectiveProfessionalId;
    });

    const map = new Map<
      string,
      { revenue: number; servicesCount: number; clients: Set<string> }
    >();

    baseAppointments.forEach((appointment) => {
      const current = map.get(appointment.professionalId) ?? {
        revenue: 0,
        servicesCount: 0,
        clients: new Set<string>(),
      };
      current.revenue += Number(appointment.totalPrice || 0);
      current.servicesCount += 1;
      if (appointment.clientId) current.clients.add(appointment.clientId);
      map.set(appointment.professionalId, current);
    });

    return professionals
      .map((professional) => {
        const stats = map.get(professional.id);
        const revenue = stats?.revenue || 0;
        const commission = revenue * (Number(professional.commissionRate || 0) / 100);
        return {
          professionalId: professional.id,
          name: professional.name,
          revenue,
          commission,
          servicesCount: stats?.servicesCount || 0,
          clientsCount: stats?.clients.size || 0,
        };
      })
      .filter((item) => item.revenue > 0 || item.servicesCount > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [appointments, end, professionals, start, effectiveProfessionalId]);

  const totals = useMemo(() => {
    return statsByProfessional.reduce(
      (acc, item) => {
        acc.revenue += item.revenue;
        acc.commission += item.commission;
        acc.services += item.servicesCount;
        acc.clients += item.clientsCount;
        return acc;
      },
      { revenue: 0, commission: 0, services: 0, clients: 0 }
    );
  }, [statsByProfessional]);
  const isOwnerView = !isProfessional;

  if (isLoadingAppointments || isLoadingProfessionals) {
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
      <div className="space-y-4 sm:space-y-6">
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
                <div className="h-10 rounded-md border bg-gray-50 px-3 flex items-center text-sm text-gray-700">
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

        <div className={`grid gap-4 ${isOwnerView ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          {isOwnerView ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Faturamento</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.revenue)}</p>
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Comissao total</p>
              <p className="text-xl font-bold text-violet-700">{formatCurrency(totals.commission)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Servicos concluidos</p>
              <p className="text-xl font-bold text-emerald-700">{totals.services}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Clientes atendidos</p>
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
                {!statsByProfessional.length ? (
                  <p className="text-sm text-gray-500">Sem dados para o periodo selecionado.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsByProfessional}>
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
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
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
              {!statsByProfessional.length ? (
                <p className="text-sm text-gray-500">Sem dados para o periodo selecionado.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsByProfessional}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
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
            <CardTitle className="text-base sm:text-lg">Detalhamento por profissional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!statsByProfessional.length ? (
              <p className="text-sm text-gray-500">Sem dados para listar no periodo selecionado.</p>
            ) : (
              statsByProfessional.map((item) => (
                <div
                  key={item.professionalId}
                  className={`grid gap-2 rounded-lg border p-3 ${
                    isOwnerView
                      ? "md:grid-cols-[1.5fr_repeat(4,1fr)]"
                      : "md:grid-cols-[1.5fr_repeat(3,1fr)]"
                  }`}
                >
                  <div className="font-medium text-gray-900">{item.name}</div>
                  {isOwnerView ? (
                    <div className="text-sm text-gray-600">
                      <span className="text-gray-500">Faturamento:</span> {formatCurrency(item.revenue)}
                    </div>
                  ) : null}
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-500">Comissao:</span> {formatCurrency(item.commission)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-500">Servicos:</span> {item.servicesCount}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-500">Clientes:</span> {item.clientsCount}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
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
