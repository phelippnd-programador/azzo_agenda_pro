import { useEffect, useState } from "react";
import { Building2, CalendarCheck, DollarSign, Star } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { groupsApi, type GroupDashboard } from "@/lib/api/groups";
import { resolveUiError } from "@/lib/error-utils";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Building2;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function GroupDashboardPage() {
  const [data, setData] = useState<GroupDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    groupsApi
      .dashboard()
      .then((response) => {
        if (active) setData(response);
      })
      .catch((error) => toast.error(resolveUiError(error, "Nao foi possivel carregar o consolidado do grupo.").message))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <MainLayout
      title="Multi-unidade"
      subtitle="Consolidado somente leitura das unidades vinculadas ao seu grupo"
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando consolidado...</p>
      ) : !data ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum grupo disponivel para este usuario.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard title="Unidades" value={String(data.totalUnidades || 0)} icon={Building2} />
            <MetricCard title="Faturamento" value={formatCurrency(data.faturamentoTotal || 0)} icon={DollarSign} />
            <MetricCard title="Atendimentos" value={String(data.atendimentosTotal || 0)} icon={CalendarCheck} />
            <MetricCard title="NPS medio" value={(data.npsMedio || 0).toFixed(1)} icon={Star} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ranking de unidades</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="text-right">Atendimentos</TableHead>
                    <TableHead className="text-right">NPS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.ranking || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Sem dados para exibir.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.ranking.map((unit) => (
                      <TableRow key={unit.tenantId}>
                        <TableCell className="font-medium">{unit.nomeSalao}</TableCell>
                        <TableCell className="text-right">{formatCurrency(unit.faturamento || 0)}</TableCell>
                        <TableCell className="text-right">{unit.atendimentos}</TableCell>
                        <TableCell className="text-right">{(unit.nps || 0).toFixed(1)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
