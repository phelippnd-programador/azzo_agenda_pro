import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Settings2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageErrorState } from "@/components/ui/page-states";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { commissionApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { CommissionProfessionalReportResponse } from "@/types/commission";
import { formatCurrencyCents as formatCurrency } from "@/lib/format";

const getOriginLabel = (originType: string) => {
  if (originType === "SERVICE") return "Servico";
  if (originType === "PRODUCT") return "Produto";
  if (originType === "MANUAL_ADJUSTMENT") return "Ajuste manual";
  return originType;
};

const getStatusLabel = (status: string) => {
  if (status === "OPEN") return "Em aberto";
  if (status === "PAID") return "Pago";
  if (status === "REVERSED") return "Revertido";
  return status;
};

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
};

export default function ProfessionalCommissionReport() {
  const { professionalId } = useParams<{ professionalId: string }>();
  const navigate = useNavigate();
  const [from, setFrom] = useState(getMonthRange().from);
  const [to, setTo] = useState(getMonthRange().to);
  const [report, setReport] = useState<CommissionProfessionalReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!professionalId) {
      setError("Profissional nao informado.");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const response = await commissionApi.getProfessionalReport(professionalId, from, to);
      setReport(response);
      setError(null);
    } catch (err) {
      setError(resolveUiError(err, "Nao foi possivel carregar o detalhamento da comissao.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [professionalId, from, to]);

  if (isLoading) {
    return (
      <MainLayout title="Detalhamento de Comissao" subtitle="Carregando dados">
        <div className="space-y-4">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !report) {
    return (
      <MainLayout title="Detalhamento de Comissao" subtitle="Consulta individual">
        <PageErrorState
          title="Nao foi possivel carregar o detalhamento"
          description={error || "Profissional nao encontrado."}
          action={{ label: "Voltar para comissoes", onClick: () => navigate("/financeiro/comissoes") }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Detalhamento de Comissao" subtitle={report.professionalName}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => navigate("/financeiro/comissoes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para comissoes
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/profissionais/${report.professionalId}/comissao`}>
              <Settings2 className="mr-2 h-4 w-4" />
              Configurar regra
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(report.totalAmountCents)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Em aberto</p>
              <p className="text-lg font-bold text-amber-700">{formatCurrency(report.totalOpenAmountCents)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pago</p>
              <p className="text-lg font-bold text-emerald-700">{formatCurrency(report.totalPaidAmountCents)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lancamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {!report.entries.length ? (
              <p className="text-sm text-muted-foreground">Nenhum lancamento encontrado no periodo.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origem</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Percentual</TableHead>
                    <TableHead className="text-right">Fixo</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observacoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{getOriginLabel(entry.originType)}</p>
                          <p className="text-xs text-muted-foreground">{entry.originReference || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{entry.periodKey}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.baseAmountCents)}</TableCell>
                      <TableCell className="text-right">
                        {entry.percentValue}% ({formatCurrency(entry.percentAmountCents)})
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.fixedAmountCents)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(entry.totalAmountCents)}</TableCell>
                      <TableCell>
                        <Badge variant={entry.entryStatus === "PAID" ? "default" : entry.entryStatus === "REVERSED" ? "secondary" : "outline"}>
                          {getStatusLabel(entry.entryStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-64 text-sm text-muted-foreground">
                        {entry.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
